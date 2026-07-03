import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/providers/local_reverb_settings_provider.dart';
import '../../../core/realtime/pos_realtime_config.dart';
import '../../../core/realtime/pos_realtime_service.dart';
import '../../../core/theme/pos_app_styles.dart';
import '../providers/pos_settings_subpage_provider.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

Future<void> showReverbStatusDialog({
  required BuildContext context,
  required WidgetRef ref,
}) {
  return showPosDialog<void>(
    context: context,
    builder: (ctx) => const _ReverbStatusDialog(),
  );
}

class _ReverbStatusDialog extends ConsumerStatefulWidget {
  const _ReverbStatusDialog();

  @override
  ConsumerState<_ReverbStatusDialog> createState() =>
      _ReverbStatusDialogState();
}

class _ReverbStatusDialogState extends ConsumerState<_ReverbStatusDialog> {
  bool _busy = false;

  String _headline({
    required PosRealtimeConnectionState state,
    required PosRealtimeConfig config,
    required bool localEnabled,
  }) {
    if (!localEnabled) return 'Off on this terminal';
    if (!config.enabled) return 'Not enabled on server';
    switch (state) {
      case PosRealtimeConnectionState.live:
        return 'Connected';
      case PosRealtimeConnectionState.connecting:
        return 'Connecting…';
      case PosRealtimeConnectionState.polling:
        return 'Polling fallback';
      case PosRealtimeConnectionState.disconnected:
        return 'Disconnected';
      case PosRealtimeConnectionState.disabled:
        return 'Not configured';
    }
  }

  Color _headlineColor({
    required PosRealtimeConnectionState state,
    required PosRealtimeConfig config,
    required bool localEnabled,
    required PosAppStyles s,
  }) {
    final dot = reverbStatusDotColor(
      state: state,
      config: config,
      localEnabled: localEnabled,
    );
    if (dot == const Color(0xFF34D399)) return s.success;
    if (dot == const Color(0xFFF87171)) return s.danger;
    if (dot == const Color(0xFFFBBF24)) return s.accent;
    return s.textMuted;
  }

  Future<void> _reconnect() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await connectPosRealtimeIfConfigured(ref);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _disconnect() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await disconnectPosRealtime(ref);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _openSettings() {
    Navigator.pop(context);
    openPosReverbSettings(ref);
  }

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final local = ref.watch(localReverbSettingsProvider);
    final state = ref.watch(posRealtimeConnectionStateProvider);
    final config = ref.watch(posRealtimeConfigProvider);
    final lastEvent = ref.watch(posRealtimeLastEventProvider);
    final tooltip = reverbStatusTooltip(
      state: state,
      config: config,
      localEnabled: local.enableLiveStockSync,
    );
    final headline = _headline(
      state: state,
      config: config,
      localEnabled: local.enableLiveStockSync,
    );
    final headlineColor = _headlineColor(
      state: state,
      config: config,
      localEnabled: local.enableLiveStockSync,
      s: s,
    );
    final canReconnect =
        local.enableLiveStockSync && config.enabled && state != PosRealtimeConnectionState.live;
    final canDisconnect = state == PosRealtimeConnectionState.live ||
        state == PosRealtimeConnectionState.connecting ||
        state == PosRealtimeConnectionState.polling;

    return PosProfessionalDialogShell(
      title: 'Live stock sync',
      subtitle: 'Reverb WebSocket connection',
      icon: Icons.podcasts_outlined,
      maxWidth: 480,
      onClose: _busy ? () {} : () => Navigator.pop(context),
      footer: Row(
        children: [
          OutlinedButton(
            onPressed: _busy ? null : () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          const Spacer(),
          OutlinedButton.icon(
            onPressed: _busy ? null : _openSettings,
            icon: const Icon(Icons.settings_outlined, size: 18),
            label: const Text('Settings'),
          ),
          const SizedBox(width: 8),
          if (canDisconnect)
            OutlinedButton(
              onPressed: _busy ? null : () => unawaited(_disconnect()),
              child: const Text('Disconnect'),
            ),
          if (canReconnect) ...[
            const SizedBox(width: 8),
            FilledButton.icon(
              onPressed: _busy ? null : () => unawaited(_reconnect()),
              icon: _busy
                  ? SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: s.onBrand,
                      ),
                    )
                  : const Icon(Icons.refresh_rounded, size: 18),
              label: Text(_busy ? 'Connecting…' : 'Reconnect'),
            ),
          ],
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
            decoration: BoxDecoration(
              color: headlineColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: headlineColor.withValues(alpha: 0.35)),
            ),
            child: Column(
              children: [
                Text(
                  headline,
                  style: s.titleMedium.copyWith(
                    fontSize: 20,
                    color: headlineColor,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  tooltip,
                  textAlign: TextAlign.center,
                  style: s.bodyMuted,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _DetailRow(
            label: 'Terminal setting',
            value: local.enableLiveStockSync ? 'Enabled' : 'Disabled',
          ),
          _DetailRow(
            label: 'Server Reverb',
            value: config.enabled ? 'Enabled' : 'Disabled',
          ),
          if (config.enabled && config.host != null) ...[
            _DetailRow(
              label: 'Host',
              value: config.host!,
            ),
            _DetailRow(
              label: 'Port',
              value: '${config.port}',
            ),
            if (config.channel != null)
              _DetailRow(
                label: 'Channel',
                value: config.channel!,
              ),
          ],
          if (lastEvent != null)
            _DetailRow(
              label: 'Last stock event',
              value: DateFormat('MMM d, yyyy HH:mm:ss')
                  .format(lastEvent.toLocal()),
            ),
          const SizedBox(height: 12),
          Text(
            'Turn live stock sync on or off in Settings → Local data & backup. '
            'When the socket is unavailable, stock is refreshed every 15 minutes.',
            style: s.bodyMuted.copyWith(fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: s.bodyMuted),
          ),
          Expanded(
            child: Text(
              value,
              style: s.body,
            ),
          ),
        ],
      ),
    );
  }
}
