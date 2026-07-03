import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/providers/app_providers.dart';
import '../../core/providers/local_reverb_settings_provider.dart';
import '../../core/realtime/pos_realtime_config.dart';
import '../../core/realtime/pos_realtime_service.dart';
import 'models/local_reverb_settings.dart';
import 'providers/pos_settings_subpage_provider.dart';
import 'widgets/pos_settings_ui.dart';
import 'widgets/pos_toast.dart';

class PosReverbSettingsScreen extends ConsumerStatefulWidget {
  const PosReverbSettingsScreen({super.key});

  @override
  ConsumerState<PosReverbSettingsScreen> createState() =>
      _PosReverbSettingsScreenState();
}

class _PosReverbSettingsScreenState extends ConsumerState<PosReverbSettingsScreen> {
  bool _busy = false;
  final _appKeyCtrl = TextEditingController();
  final _hostCtrl = TextEditingController();
  final _portCtrl = TextEditingController();
  final _authEndpointCtrl = TextEditingController();
  String? _scheme;
  bool _fieldsReady = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadFields());
  }

  void _loadFields() {
    final local = ref.read(localReverbSettingsProvider);
    _appKeyCtrl.text = local.appKey ?? '';
    _hostCtrl.text = local.host ?? '';
    _portCtrl.text = local.port?.toString() ?? '';
    _authEndpointCtrl.text = local.authEndpoint ?? '';
    _scheme = local.scheme;
    if (mounted) setState(() => _fieldsReady = true);
  }

  @override
  void dispose() {
    _appKeyCtrl.dispose();
    _hostCtrl.dispose();
    _portCtrl.dispose();
    _authEndpointCtrl.dispose();
    super.dispose();
  }

  void _snack(String msg, {bool error = false, bool success = false}) {
    if (!mounted) return;
    PosToast.show(
      context,
      msg,
      type: error
          ? PosToastType.error
          : success
              ? PosToastType.success
              : PosToastType.info,
    );
  }

  String _stateLabel(
    PosRealtimeConnectionState state,
    PosRealtimeConfig config,
    bool localEnabled,
  ) {
    if (!localEnabled) return 'Disabled on this terminal';
    if (!config.enabled) return 'Not configured';
    switch (state) {
      case PosRealtimeConnectionState.live:
        return 'Connected (live WebSocket)';
      case PosRealtimeConnectionState.connecting:
        return 'Connecting…';
      case PosRealtimeConnectionState.polling:
        return 'Polling fallback (socket unavailable)';
      case PosRealtimeConnectionState.disconnected:
        return 'Disconnected';
      case PosRealtimeConnectionState.disabled:
        return 'Not configured';
    }
  }

  PosRealtimeConfig _effectiveConfig(
    LocalReverbSettings local,
    PosRealtimeConfig bootstrap,
  ) {
    return local.resolveConfig(
      bootstrap: bootstrap,
      warehouseId: ref.read(sessionServiceProvider).warehouseId,
      posBaseUrl: ref.read(sessionServiceProvider).posBaseUrl,
    );
  }

  Future<void> _refreshFromServer() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await refreshPosRealtimeConfigFromServer(ref);
      if (!mounted) return;
      _snack('Reverb settings refreshed from server', success: true);
    } catch (e) {
      _snack('Failed to refresh: $e', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _importFromServer() {
    final bootstrap = ref.read(posRealtimeConfigProvider);
    if (!bootstrap.enabled && bootstrap.key == null) {
      _snack('Refresh from server first to import bootstrap values', error: true);
      return;
    }
    _appKeyCtrl.text = bootstrap.key ?? '';
    _hostCtrl.text = bootstrap.host ?? '';
    _portCtrl.text = bootstrap.port.toString();
    _authEndpointCtrl.text = bootstrap.authEndpoint ?? '';
    _scheme = bootstrap.scheme;
    setState(() {});
    _snack('Server values loaded into form — tap Save to keep them', success: true);
  }

  Future<void> _saveSettings() async {
    final appKey = _appKeyCtrl.text.trim();
    final host = _hostCtrl.text.trim();
    final portText = _portCtrl.text.trim();
    final auth = _authEndpointCtrl.text.trim();

    int? port;
    if (portText.isNotEmpty) {
      port = int.tryParse(portText);
      if (port == null || port < 1 || port > 65535) {
        _snack('Port must be between 1 and 65535', error: true);
        return;
      }
    }

    if (host.isNotEmpty && appKey.isEmpty) {
      _snack('App key is required when host is set', error: true);
      return;
    }

    await ref.read(localReverbSettingsProvider.notifier).patch(
          (s) => s.copyWith(
            appKey: appKey.isEmpty ? null : appKey,
            clearAppKey: appKey.isEmpty,
            host: host.isEmpty ? null : host,
            clearHost: host.isEmpty,
            port: port,
            clearPort: portText.isEmpty,
            scheme: _scheme,
            clearScheme: _scheme == null,
            authEndpoint: auth.isEmpty ? null : auth,
            clearAuthEndpoint: auth.isEmpty,
          ),
        );

    await refreshPosRealtimeConfigFromServer(ref);
    if (ref.read(localReverbSettingsProvider).enableLiveStockSync) {
      await connectPosRealtimeIfConfigured(ref);
    }
    _snack('Reverb settings saved', success: true);
  }

  Future<void> _clearSettings() async {
    _appKeyCtrl.clear();
    _hostCtrl.clear();
    _portCtrl.clear();
    _authEndpointCtrl.clear();
    setState(() => _scheme = null);

    await ref.read(localReverbSettingsProvider.notifier).patch(
          (s) => s.copyWith(
            clearAppKey: true,
            clearHost: true,
            clearPort: true,
            clearScheme: true,
            clearAuthEndpoint: true,
          ),
        );
    await refreshPosRealtimeConfigFromServer(ref);
    if (ref.read(localReverbSettingsProvider).enableLiveStockSync) {
      await connectPosRealtimeIfConfigured(ref);
    }
    _snack('Using server bootstrap values only', success: true);
  }

  @override
  Widget build(BuildContext context) {
    if (!_fieldsReady) {
      return PosSettingsSubPageShell(
        title: 'Reverb setup',
        subtitle: 'Live stock sync (WebSocket)',
        onBack: () => closePosSettingsSubPage(ref),
        child: const Center(child: CircularProgressIndicator()),
      );
    }

    final local = ref.watch(localReverbSettingsProvider);
    final bootstrap = ref.watch(posRealtimeConfigProvider);
    final effective = _effectiveConfig(local, bootstrap);
    final stockState = ref.watch(posRealtimeConnectionStateProvider);
    final lastEvent = ref.watch(posRealtimeLastEventProvider);
    final hasLocalFields = local.hasConnectionFields;

    return PosSettingsSubPageShell(
      title: 'Reverb setup',
      subtitle: 'App key, host, port, and connection for live stock sync',
      onBack: () => closePosSettingsSubPage(ref),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          PosSettingsSectionCard(
            icon: Icons.podcasts_outlined,
            title: 'This terminal',
            subtitle: 'Connection status and enable/disable on this device',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Status'),
                  subtitle: Text(
                    _stateLabel(
                      stockState,
                      effective,
                      local.enableLiveStockSync,
                    ),
                  ),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Enable live stock sync'),
                  subtitle: const Text(
                    'Connect to Reverb WebSocket for realtime stock updates',
                  ),
                  value: local.enableLiveStockSync,
                  onChanged: _busy
                      ? null
                      : (enabled) async {
                          setState(() => _busy = true);
                          try {
                            await ref
                                .read(localReverbSettingsProvider.notifier)
                                .patch(
                                  (s) =>
                                      s.copyWith(enableLiveStockSync: enabled),
                                );
                            if (enabled) {
                              await connectPosRealtimeIfConfigured(ref);
                            } else {
                              await disconnectPosRealtime(ref);
                              ref
                                  .read(
                                    posRealtimeConnectionStateProvider.notifier,
                                  )
                                  .state = PosRealtimeConnectionState.disabled;
                            }
                          } finally {
                            if (mounted) setState(() => _busy = false);
                          }
                        },
                ),
                if (lastEvent != null)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Last stock event'),
                    subtitle: Text(
                      DateFormat('MMM d, yyyy HH:mm:ss')
                          .format(lastEvent.toLocal()),
                    ),
                  ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    OutlinedButton.icon(
                      onPressed: _busy
                          ? null
                          : () => unawaited(_refreshFromServer()),
                      icon: const Icon(Icons.cloud_download_outlined, size: 18),
                      label: const Text('Refresh from server'),
                    ),
                    OutlinedButton.icon(
                      onPressed: _busy || !local.enableLiveStockSync
                          ? null
                          : () => unawaited(connectPosRealtimeIfConfigured(ref)),
                      icon: const Icon(Icons.refresh_rounded, size: 18),
                      label: const Text('Reconnect'),
                    ),
                    OutlinedButton.icon(
                      onPressed: _busy ||
                              stockState == PosRealtimeConnectionState.disabled
                          ? null
                          : () => unawaited(disconnectPosRealtime(ref)),
                      icon: const Icon(Icons.link_off_outlined, size: 18),
                      label: const Text('Disconnect'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          PosSettingsSectionCard(
            icon: Icons.tune_outlined,
            title: 'Reverb connection settings',
            subtitle:
                'Saved on this terminal. Leave blank to use server bootstrap values.',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: _appKeyCtrl,
                  enabled: !_busy,
                  decoration: const InputDecoration(
                    labelText: 'App key',
                    hintText: 'local-pos-key',
                    helperText: 'Same as REVERB_APP_KEY on the server (public)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _hostCtrl,
                  enabled: !_busy,
                  decoration: const InputDecoration(
                    labelText: 'Host',
                    hintText: 'pos.yourcompany.com',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _portCtrl,
                  enabled: !_busy,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(
                    labelText: 'Port',
                    hintText: '443',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String?>(
                  key: ValueKey('reverb-scheme-$_scheme'),
                  initialValue: _scheme,
                  decoration: const InputDecoration(
                    labelText: 'Scheme',
                    helperText: 'Use server default when not selected',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: null, child: Text('Use server default')),
                    DropdownMenuItem(value: 'http', child: Text('http')),
                    DropdownMenuItem(value: 'https', child: Text('https')),
                  ],
                  onChanged: _busy
                      ? null
                      : (value) => setState(() => _scheme = value),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _authEndpointCtrl,
                  enabled: !_busy,
                  decoration: const InputDecoration(
                    labelText: 'Auth endpoint (optional)',
                    hintText: 'https://pos.yourcompany.com/pos/broadcasting/auth',
                    helperText: 'Leave empty to use your POS API URL + /broadcasting/auth',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Do not enter REVERB_APP_SECRET here — it stays on the server only.',
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    FilledButton.icon(
                      onPressed: _busy ? null : () => unawaited(_saveSettings()),
                      icon: const Icon(Icons.save_outlined, size: 18),
                      label: const Text('Save settings'),
                    ),
                    OutlinedButton.icon(
                      onPressed: _busy ? null : _importFromServer,
                      icon: const Icon(Icons.download_outlined, size: 18),
                      label: const Text('Fill from server'),
                    ),
                    if (hasLocalFields ||
                        local.appKey != null ||
                        local.scheme != null ||
                        local.authEndpoint != null)
                      OutlinedButton(
                        onPressed: _busy ? null : () => unawaited(_clearSettings()),
                        child: const Text('Clear local settings'),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          PosSettingsSectionCard(
            icon: Icons.dns_outlined,
            title: 'Effective connection (after merge)',
            subtitle: 'What this terminal will use when connecting',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _InfoRow(
                  label: 'Enabled',
                  value: effective.enabled ? 'Yes' : 'No',
                ),
                _InfoRow(
                  label: 'App key',
                  value: effective.key?.isNotEmpty == true
                      ? effective.key!
                      : '—',
                ),
                _InfoRow(label: 'Host', value: effective.host ?? '—'),
                _InfoRow(label: 'Port', value: '${effective.port}'),
                _InfoRow(label: 'Scheme', value: effective.scheme),
                _InfoRow(label: 'WebSocket URL', value: effective.wsUrl),
                if (effective.authEndpoint != null)
                  _InfoRow(label: 'Auth URL', value: effective.authEndpoint!),
                if (effective.channel != null)
                  _InfoRow(label: 'Channel', value: effective.channel!),
              ],
            ),
          ),
          const SizedBox(height: 16),
          PosSettingsSectionCard(
            icon: Icons.cloud_upload_outlined,
            title: 'Production setup (server)',
            subtitle: 'Configure once on Laravel when deploying with a domain',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SelectableText(
                  'Server .env (required):\n'
                  'REVERB_APP_ID=local-pos\n'
                  'REVERB_APP_KEY=local-pos-key\n'
                  'REVERB_APP_SECRET=local-pos-secret\n'
                  'REVERB_HOST=pos.yourcompany.com\n'
                  'REVERB_PORT=443\n'
                  'REVERB_SCHEME=https\n'
                  'REVERB_ENABLED=true\n'
                  'BROADCAST_CONNECTION=reverb\n\n'
                  'Then run php artisan reverb:start and proxy /app in nginx.\n'
                  'Use Fill from server above, or type the same app key and host here.',
                  style: TextStyle(fontSize: 12, height: 1.45),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _busy
                      ? null
                      : () => unawaited(
                            Clipboard.setData(
                              const ClipboardData(
                                text: 'REVERB_APP_ID=local-pos\n'
                                    'REVERB_APP_KEY=local-pos-key\n'
                                    'REVERB_APP_SECRET=local-pos-secret\n'
                                    'REVERB_HOST=pos.yourcompany.com\n'
                                    'REVERB_PORT=443\n'
                                    'REVERB_SCHEME=https\n'
                                    'REVERB_ENABLED=true\n'
                                    'BROADCAST_CONNECTION=reverb',
                              ),
                            ).then((_) {
                              if (mounted) {
                                _snack('Sample .env copied', success: true);
                              }
                            }),
                          ),
                  icon: const Icon(Icons.copy_outlined, size: 18),
                  label: const Text('Copy sample production .env'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: SelectableText(value, style: const TextStyle(fontSize: 13)),
          ),
        ],
      ),
    );
  }
}
