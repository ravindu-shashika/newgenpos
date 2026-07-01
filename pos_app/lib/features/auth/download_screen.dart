import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/app_config.dart';
import '../../core/logging/app_logger.dart';
import '../../core/providers/app_providers.dart';
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
    this.warehouseId,
    this.onComplete,
  });

  final PosDownloadMode mode;
  final bool isInitialSetup;
  /// Opened from POS screen after login — minimal UI, returns to billing.
  final bool inApp;
  final bool autoStart;
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
      final download = ref.read(catalogDownloadServiceProvider);

      api.setBaseUrl(AppConfig.resolvePosBaseUrl(session.posBaseUrl));

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

      await download.download(
        mode: widget.mode,
        deviceId: session.deviceId,
        warehouseId: warehouseId,
        username: null,
        password: null,
        onProgress: (info) {
          if (!mounted) return;
          setState(() {
            _status = '${_resourceLabel(info.resource)} — '
                'page ${info.page}/${info.totalPages} '
                '(${info.rowsThisChunk} rows)';
            _percent = info.overallPercent / 100;
          });
        },
      );

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
    ref.read(catalogDownloadServiceProvider).cancel();
    if (mounted) Navigator.of(context).pop(false);
  }

  @override
  Widget build(BuildContext context) {
    _initFields();
    _maybeAutoStart();

    final modeLabel = widget.mode == PosDownloadMode.full
        ? 'Download all data'
        : 'Sync latest data';

    final content = Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (widget.inApp)
                  Text(
                    widget.mode == PosDownloadMode.delta
                        ? 'Downloads latest products, stock, customers, users, '
                            'taxes, and other POS data changed since last sync.'
                        : 'Clears all local data and downloads everything again from the server.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  )
                else if (widget.mode == PosDownloadMode.delta)
                  Text(
                    'Only rows changed since your last sync will be downloaded.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  )
                else
                  Text(
                    'Clears all local data (catalog, sales, returns) and re-downloads from the server.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                if (widget.inApp) ...[
                  SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    alignment: WrapAlignment.center,
                    children: [
                      Chip(label: Text('Products'), avatar: Icon(Icons.inventory_2, size: 16)),
                      Chip(label: Text('Stock'), avatar: Icon(Icons.warehouse, size: 16)),
                      Chip(label: Text('Customers'), avatar: Icon(Icons.people, size: 16)),
                      Chip(label: Text('Users'), avatar: Icon(Icons.person, size: 16)),
                    ],
                  ),
                ],
                SizedBox(height: 24),
                if (_loading || _percent > 0) ...[
                  LinearProgressIndicator(value: _percent > 0 ? _percent : null),
                  SizedBox(height: 12),
                ],
                if (_status.isNotEmpty)
                  Text(_status, textAlign: TextAlign.center),
                if (_error != null) ...[
                  SizedBox(height: 12),
                  Text(_error!, style: TextStyle(color: Colors.red)),
                ],
                SizedBox(height: 24),
                if (!_loading && !widget.autoStart)
                  FilledButton(
                    onPressed: _runDownload,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text(modeLabel),
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
        title: 'Update POS data',
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
        title: Text(modeLabel),
        leading: _loading
            ? IconButton(icon: const Icon(Icons.close), onPressed: _cancel)
            : BackButton(onPressed: () => Navigator.of(context).pop(false)),
      ),
      body: content,
    );
  }
}
