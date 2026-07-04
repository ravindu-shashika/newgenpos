import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/app_config.dart';
import '../../core/logging/app_logger.dart';
import '../../core/providers/app_providers.dart';
import '../../core/providers/pos_ui_settings_provider.dart';
import '../../core/sync/download_models.dart';
import '../pos/widgets/pos_sub_screen_shell.dart';

/// Download / sync catalog — setup, login, or from inside POS.
class DownloadScreen extends ConsumerStatefulWidget {
  const DownloadScreen({
    super.key,
    required this.mode,
    this.isInitialSetup = false,
    this.inApp = false,
    this.autoStart = false,
    this.useSnapshotImport = false,
    this.warehouseId,
    this.onComplete,
  });

  final PosDownloadMode mode;
  final bool isInitialSetup;
  /// Opened from POS screen after login — minimal UI, returns to billing.
  final bool inApp;
  final bool autoStart;
  /// Bulk SQLite snapshot import (10M+ catalogs) instead of HTTP chunks.
  final bool useSnapshotImport;
  final int? warehouseId;
  final VoidCallback? onComplete;

  @override
  ConsumerState<DownloadScreen> createState() => _DownloadScreenState();
}

class _DownloadScreenState extends ConsumerState<DownloadScreen> {
  bool _loading = false;
  bool _fieldsInitialized = false;
  bool _autoStarted = false;
  String? _error;
  String _status = '';
  double _percent = 0;

  void _initFields() {
    if (_fieldsInitialized) return;
    _fieldsInitialized = true;
  }

  void _maybeAutoStart() {
    if (!widget.autoStart || _autoStarted || _loading) return;
    _autoStarted = true;
    WidgetsBinding.instance.addPostFrameCallback((_) => _runDownload());
  }

  Future<void> _runDownload() async {
    _initFields();

    setState(() {
      _loading = true;
      _error = null;
      _status = 'Preparing…';
      _percent = 0;
    });

    try {
      final api = ref.read(apiClientProvider);
      final session = ref.read(sessionServiceProvider);

      if (!session.hasUsableServerUrl) {
        throw Exception(
          'Server URL is missing or points to localhost. '
          'Open Register / Setup and save your public POS API URL.',
        );
      }
      api.setBaseUrl(session.effectivePosBaseUrl);

      final posToken = session.posToken;
      if (posToken == null || posToken.isEmpty) {
        throw Exception('POS token missing. Register this device again.');
      }
      api.setPosToken(posToken);

      if (widget.isInitialSetup) {
        await api.health();
        if (!session.isTerminalRegistered) {
          throw Exception(
            'Terminal not registered. Go back and register this device.',
          );
        }
      } else if (widget.inApp) {
        await api.health();
      }

      await session.ensureDeviceId();

      final warehouseId = widget.warehouseId ?? session.warehouseId;
      if (warehouseId == null) {
        throw Exception('warehouse_id is required');
      }

      if (widget.useSnapshotImport) {
        await ref.read(catalogSnapshotImportServiceProvider).importFullSnapshot(
              deviceId: session.deviceId,
              warehouseId: warehouseId,
              onProgress: ({required phase, required percent, detail}) {
                if (!mounted) return;
                setState(() {
                  _status = detail ?? phase;
                  _percent = percent;
                });
              },
            );
      } else {
        final bulkMode = ref.read(posUiSettingsProvider).catalogDownloadBulkMode;
        await ref.read(catalogDownloadServiceProvider).download(
              mode: widget.mode,
              deviceId: session.deviceId,
              warehouseId: warehouseId,
              username: null,
              password: null,
              bulkMode: bulkMode,
              onProgress: (info) {
                if (!mounted) return;
                setState(() {
                  _status = '${_resourceLabel(info.resource)} — '
                      'chunk ${info.page} '
                      '(${info.rowsThisChunk} rows)';
                  _percent = info.overallPercent / 100;
                });
              },
            );
      }

      final userCount =
          await ref.read(localAuthRepositoryProvider).countUsers();
      final pinCount =
          await ref.read(localAuthRepositoryProvider).countUsersWithPin();
      AppLogger.info(
        'DownloadScreen',
        'Download finished',
        'users=$userCount with_credentials=$pinCount',
      );

      if (userCount == 0) {
        throw Exception(
          'Download finished but no users were imported. '
          'Check that active users exist on the server, then try Full download again.',
        );
      }
      if (pinCount == 0) {
        throw Exception(
          'Users downloaded but none have a POS Access PIN or password. '
          'Set POS Access PIN in Admin → User List, then download again.',
        );
      }

      if (widget.isInitialSetup) {
        await session.saveProvision();
      }

      if (!mounted) return;

      if (widget.onComplete != null) {
        widget.onComplete!();
      } else {
        Navigator.of(context).pop(true);
      }
    } catch (e, stack) {
      AppLogger.error('DownloadScreen', 'Download failed', e, stack);
      if (mounted) setState(() => _error = AppLogger.userMessage(e));
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
          if (_error == null) {
            _status = 'Complete';
            _percent = 1;
          }
        });
      }
    }
  }

  String _resourceLabel(String key) {
    return switch (key) {
      'product_stock' => 'Stock',
      'product_batches' => 'Batches',
      'product_variants' => 'Variants',
      'products' => 'Products',
      'customers' => 'Customers',
      'users' => 'Users',
      _ => key.replaceAll('_', ' '),
    };
  }

  void _cancel() {
    if (widget.useSnapshotImport) {
      ref.read(catalogSnapshotImportServiceProvider).cancel();
    } else {
      ref.read(catalogDownloadServiceProvider).cancel();
    }
    if (mounted) Navigator.of(context).pop(false);
  }

  String get _modeLabel {
    if (widget.useSnapshotImport) return 'Full snapshot import';
    return widget.mode == PosDownloadMode.full
        ? 'Download all data'
        : 'Sync latest data';
  }

  String get _description {
    if (widget.useSnapshotImport) {
      return 'Server builds a compressed SQLite catalog file. Best for initial '
          'provisioning with millions of products. Pending sales are preserved.';
    }
    if (widget.mode == PosDownloadMode.delta) {
      return 'Downloads only rows changed since your last sync (quick delta).';
    }
    final bulk = ref.watch(posUiSettingsProvider).catalogDownloadBulkMode;
    return bulk
        ? 'Clears local catalog data and re-downloads via fast bulk HTTP chunks. '
            'Pending sales are preserved.'
        : 'Clears local catalog data and re-downloads with smaller chunks to '
            'keep the UI responsive. Pending sales are preserved.';
  }

  @override
  Widget build(BuildContext context) {
    _initFields();
    _maybeAutoStart();

    final content = Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  _description,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                if (widget.inApp && !widget.useSnapshotImport) ...[
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    alignment: WrapAlignment.center,
                    children: [
                      Chip(
                        label: Text(
                          ref.watch(posUiSettingsProvider).catalogDownloadBulkMode
                              ? 'Bulk HTTP mode'
                              : 'Responsive mode',
                        ),
                        avatar: const Icon(Icons.tune, size: 16),
                      ),
                      const Chip(
                        label: Text('Products'),
                        avatar: Icon(Icons.inventory_2, size: 16),
                      ),
                      const Chip(
                        label: Text('Stock'),
                        avatar: Icon(Icons.warehouse, size: 16),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 24),
                if (_loading || _percent > 0) ...[
                  LinearProgressIndicator(value: _percent > 0 ? _percent : null),
                  const SizedBox(height: 12),
                ],
                if (_status.isNotEmpty)
                  Text(_status, textAlign: TextAlign.center),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: Colors.red)),
                ],
                const SizedBox(height: 24),
                if (!_loading && !widget.autoStart)
                  FilledButton(
                    onPressed: _runDownload,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text(_modeLabel),
                    ),
                  ),
                if (_loading)
                  OutlinedButton(
                    onPressed: _cancel,
                    child: const Text('Cancel'),
                  ),
              ],
            ),
          ),
        ),
      );

    if (widget.inApp) {
      return PosSubScreenShell(
        title: widget.useSnapshotImport
            ? 'Snapshot import'
            : 'Update POS data',
        backIcon: _loading ? Icons.close : Icons.arrow_back,
        backTooltip: _loading ? 'Cancel' : 'Back',
        onBack: _loading
            ? _cancel
            : () => Navigator.of(context).pop(false),
        body: content,
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_modeLabel),
        leading: _loading
            ? IconButton(icon: const Icon(Icons.close), onPressed: _cancel)
            : BackButton(onPressed: () => Navigator.of(context).pop(false)),
      ),
      body: content,
    );
  }
}
