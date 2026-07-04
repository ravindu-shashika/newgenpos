import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/app_config.dart';
import '../../core/logging/app_logger.dart';
import '../../core/providers/app_providers.dart';
import '../../core/sync/download_models.dart';
import '../../core/theme/pos_theme.dart';
import '../pos/widgets/pos_professional_dialog.dart';
import '../pos/widgets/show_pos_dialog.dart';
import 'download_screen.dart';
import 'login_screen.dart';
import 'register_screen.dart';

/// After registration: wait for admin activation, then download (no login required).
class SetupScreen extends ConsumerStatefulWidget {
  const SetupScreen({super.key});

  @override
  ConsumerState<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends ConsumerState<SetupScreen> {
  final _serverUrlCtrl = TextEditingController();
  bool _loading = false;
  bool _savingUrl = false;
  String? _error;
  bool? _terminalActive;

  @override
  void initState() {
    super.initState();
    final session = ref.read(sessionServiceProvider);
    _serverUrlCtrl.text = AppConfig.displayPosBaseUrl(session.posBaseUrl);
    WidgetsBinding.instance.addPostFrameCallback((_) => _refreshTerminalStatus());
  }

  @override
  void dispose() {
    _serverUrlCtrl.dispose();
    super.dispose();
  }

  Future<void> _saveServerUrl() async {
    final url = AppConfig.normalizePosBaseUrlInput(_serverUrlCtrl.text);
    if (url == null) {
      setState(() => _error = 'Enter a valid POS server URL ending with /pos');
      return;
    }
    if (AppConfig.isLoopbackPosUrl(url)) {
      setState(
        () => _error =
            'Localhost / 127.0.0.1 cannot be used. Enter your public server URL.',
      );
      return;
    }

    setState(() {
      _savingUrl = true;
      _error = null;
    });
    try {
      await ref.read(sessionServiceProvider).savePosBaseUrl(url);
      bumpSessionState(ref);
      if (!mounted) return;
      setState(() {
        _serverUrlCtrl.text = url;
        _savingUrl = false;
      });
      await _refreshTerminalStatus();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _savingUrl = false;
        _error = AppLogger.userMessage(e);
      });
    }
  }

  Future<void> _refreshTerminalStatus() async {
    final session = ref.read(sessionServiceProvider);
    if (!session.isRegistered) return;
    if (!session.hasUsableServerUrl) {
      setState(() {
        _terminalActive = null;
        _error =
            'Server URL is missing or points to localhost. Enter your API URL and tap Save URL.';
      });
      return;
    }

    try {
      final api = ref.read(apiClientProvider);
      api.setBaseUrl(session.effectivePosBaseUrl);
      api.setPosToken(session.posToken);
      final status = await api.checkTerminalStatus(
        macAddress: session.macAddress ?? session.terminalCode,
        deviceId: session.deviceId,
      );
      if (!mounted) return;
      setState(() {
        _terminalActive = status['is_active'] == true;
        _error = null;
      });
    } catch (e, stack) {
      AppLogger.error('Setup', 'Terminal status check failed', e, stack);
      if (!mounted) return;
      setState(() {
        _terminalActive = null;
        _error = AppLogger.userMessage(e);
      });
    }
  }

  Future<void> _resetDevice() async {
    final ok = await showPosConfirmDialog(
      context: context,
      title: 'Reset device registration?',
      message:
          'Clears registration and server URL. You will return to the Register screen.',
      icon: Icons.restart_alt_rounded,
      confirmLabel: 'Reset',
      destructive: true,
    );
    if (ok != true || !mounted) return;

    await ref.read(sessionServiceProvider).resetDeviceRegistration();
    bumpSessionState(ref);
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const RegisterScreen()),
      (_) => false,
    );
  }

  Future<void> _downloadAll() async {
    final session = ref.read(sessionServiceProvider);
    if (!session.isRegistered) {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const RegisterScreen()),
      );
      return;
    }

    if (!session.hasUsableServerUrl) {
      setState(
        () => _error =
            'Save a valid server URL (not localhost) before downloading.',
      );
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final api = ref.read(apiClientProvider);
      api.setBaseUrl(session.effectivePosBaseUrl);
      api.setPosToken(session.posToken);
      final status = await api.checkTerminalStatus(
        macAddress: session.macAddress ?? session.terminalCode,
        deviceId: session.deviceId,
      );

      final isActive = status['is_active'] == true;
      if (!mounted) return;

      setState(() => _terminalActive = isActive);

      if (!isActive) {
        setState(() {
          _error = 'Terminal not active yet. Please contact admin.';
          _loading = false;
        });
        await showPosDialog<void>(
          context: context,
          builder: (ctx) => PosProfessionalDialog(
            title: 'Terminal not active',
            subtitle: 'Waiting for administrator approval',
            icon: Icons.phonelink_erase_outlined,
            maxWidth: 440,
            maxBodyHeight: 100,
            body: Text(
              'Terminal not active yet. Please contact admin.',
              style: TextStyle(
                fontSize: 14,
                height: 1.5,
                color: Theme.of(ctx).colorScheme.onSurface,
              ),
            ),
            primaryLabel: 'OK',
            onPrimary: () => Navigator.pop(ctx),
          ),
        );
        return;
      }

      final warehouseId = session.warehouseId;

      if (!mounted) return;

      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => DownloadScreen(
            mode: PosDownloadMode.full,
            isInitialSetup: true,
            warehouseId: warehouseId,
            autoStart: true,
            onComplete: () {
              Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (_) => false,
              );
            },
          ),
        ),
      );
    } catch (e, stack) {
      AppLogger.error('Setup', 'Download start failed', e, stack);
      setState(() => _error = AppLogger.userMessage(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _statusChip() {
    final Color color;
    final String label;
    final IconData icon;

    if (_terminalActive == true) {
      color = Colors.green;
      label = 'Active';
      icon = Icons.check_circle;
    } else if (_terminalActive == false) {
      color = Colors.orange;
      label = 'Pending activation';
      icon = Icons.hourglass_top;
    } else {
      color = Colors.grey;
      label = 'Checking status…';
      icon = Icons.sync;
    }

    return Chip(
      avatar: Icon(icon, size: 18, color: color),
      label: Text(label),
      side: BorderSide(color: color.withValues(alpha: 0.5)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionServiceProvider);
    ref.watch(sessionRevisionProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ready to download'),
        actions: [
          IconButton(
            tooltip: 'Refresh terminal status',
            onPressed: _loading || _savingUrl ? null : _refreshTerminalStatus,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Icon(
                  Icons.check_circle_outline,
                  size: 56,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(height: 16),
                Text(
                  'Device registered',
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                if (session.terminalCode != null) ...[
                  Text(
                    'Terminal: ${session.terminalCode}'
                    '${session.terminalName != null ? ' (${session.terminalName})' : ''}',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 12),
                ],
                TextField(
                  controller: _serverUrlCtrl,
                  keyboardType: TextInputType.url,
                  autocorrect: false,
                  enabled: !_loading && !_savingUrl,
                  decoration: const InputDecoration(
                    labelText: 'POS server URL',
                    hintText: 'https://your-domain.com/api/pos',
                    helperText: 'Must match the URL used at registration',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.cloud_outlined),
                  ),
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: _loading || _savingUrl ? null : _saveServerUrl,
                  icon: _savingUrl
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.save_outlined),
                  label: Text(_savingUrl ? 'Saving…' : 'Save URL'),
                ),
                const SizedBox(height: 12),
                Center(child: _statusChip()),
                const SizedBox(height: 16),
                Text(
                  'After admin activates this terminal, download POS data. '
                  'Then sign in with your POS Access PIN from the downloaded users list.',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: Colors.red)),
                ],
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: _loading || _savingUrl ? null : _downloadAll,
                  icon: _loading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.cloud_download),
                  label: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(_loading ? 'Checking…' : 'Download'),
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: _loading || _savingUrl ? null : _resetDevice,
                  child: const Text('Reset device registration'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
