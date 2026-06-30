import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
  bool _loading = false;
  String? _error;
  bool? _terminalActive;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _refreshTerminalStatus());
  }

  Future<void> _refreshTerminalStatus() async {
    final session = ref.read(sessionServiceProvider);
    if (!session.isRegistered) return;

    try {
      final api = ref.read(apiClientProvider);
      final status = await api.checkTerminalStatus(
        macAddress: session.macAddress ?? session.terminalCode,
        deviceId: session.deviceId,
      );
      if (!mounted) return;
      setState(() => _terminalActive = status['is_active'] == true);
    } catch (e, stack) {
      AppLogger.error('Setup', 'Terminal status check failed', e, stack);
      if (!mounted) return;
      setState(() => _terminalActive = null);
    }
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

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final api = ref.read(apiClientProvider);
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ready to download'),
        actions: [
          IconButton(
            tooltip: 'Refresh terminal status',
            onPressed: _loading ? null : _refreshTerminalStatus,
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
                SizedBox(height: 16),
                Text(
                  'Device registered',
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 8),
                if (session.terminalCode != null) ...[
                  Text(
                    'Terminal: ${session.terminalCode}'
                    '${session.terminalName != null ? ' (${session.terminalName})' : ''}',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  SizedBox(height: 12),
                ],
                Center(child: _statusChip()),
                SizedBox(height: 16),
                Text(
                  'After admin activates this terminal, download POS data. '
                  'Then sign in with your POS Access PIN from the downloaded users list.',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                if (_error != null) ...[
                  SizedBox(height: 12),
                  Text(_error!, style: TextStyle(color: Colors.red)),
                ],
                SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: _loading ? null : _downloadAll,
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
              ],
            ),
          ),
        ),
      ),
    );
  }
}
