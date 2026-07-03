import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/local_reverb_settings_provider.dart';
import '../../../core/providers/pos_connectivity_providers.dart';
import '../../../core/realtime/pos_realtime_config.dart';
import '../../../core/realtime/pos_realtime_service.dart';
import '../../../core/theme/pos_theme.dart';
import 'pos_top_bar_clock.dart';

/// Shared shell header — optional leading slot + link status chips.
class PosShellHeader extends ConsumerWidget {
  const PosShellHeader({
    super.key,
    this.leading,
    this.status,
    this.loading = false,
    this.onRefresh,
    this.height,
  });

  final Widget? leading;
  final PosLinkStatus? status;
  final bool loading;
  final VoidCallback? onRefresh;
  final double? height;

  static const defaultHeight = 40.0;

  static _PosStatusState _chipState({
    required bool? connected,
    required bool loading,
  }) {
    if (connected == null && loading) return _PosStatusState.checking;
    if (connected == true) return _PosStatusState.connected;
    return _PosStatusState.disconnected;
  }

  static _PosStatusState _stockChipState(PosRealtimeConnectionState state) {
    switch (state) {
      case PosRealtimeConnectionState.live:
        return _PosStatusState.connected;
      case PosRealtimeConnectionState.connecting:
        return _PosStatusState.checking;
      case PosRealtimeConnectionState.polling:
        return _PosStatusState.checking;
      case PosRealtimeConnectionState.disabled:
        return _PosStatusState.disconnected;
      case PosRealtimeConnectionState.disconnected:
        return _PosStatusState.disconnected;
    }
  }

  static String _stockLabel(PosRealtimeConnectionState state) {
    switch (state) {
      case PosRealtimeConnectionState.live:
        return 'Stock live';
      case PosRealtimeConnectionState.polling:
        return 'Stock poll';
      case PosRealtimeConnectionState.connecting:
        return 'Stock…';
      case PosRealtimeConnectionState.disabled:
        return 'Stock off';
      case PosRealtimeConnectionState.disconnected:
        return 'Stock';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final styles = context.posStyles;
    final stockState = ref.watch(posRealtimeConnectionStateProvider);
    final stockConfig = ref.watch(posRealtimeConfigProvider);
    final localEnabled = ref.watch(
      localReverbSettingsProvider.select((s) => s.enableLiveStockSync),
    );
    final showStockChip = stockConfig.enabled && localEnabled;

    return Material(
      color: styles.cardBg,
      child: Container(
        height: height ?? defaultHeight,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: styles.border)),
        ),
        child: Row(
          children: [
            if (leading != null) ...[
              Expanded(
                flex: 4,
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: leading!,
                ),
              ),
              SizedBox(width: 12),
            ],
            const Spacer(),
            const PosTopBarLiveClock(),
            SizedBox(width: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              reverse: true,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _PosStatusChip(
                    label: 'Printer',
                    icon: Icons.print_outlined,
                    state: _chipState(
                      connected: status?.printerConnected,
                      loading: loading,
                    ),
                    onTap: onRefresh,
                  ),
                  SizedBox(width: 6),
                  _PosStatusChip(
                    label: 'Server',
                    icon: Icons.dns_outlined,
                    state: _chipState(
                      connected: status?.serverOnline,
                      loading: loading,
                    ),
                    onTap: onRefresh,
                  ),
                  SizedBox(width: 6),
                  _PosStatusChip(
                    label: 'Network',
                    icon: Icons.wifi_outlined,
                    state: _chipState(
                      connected: status?.networkConnected,
                      loading: loading,
                    ),
                    onTap: onRefresh,
                  ),
                  if (showStockChip) ...[
                    SizedBox(width: 6),
                    _PosStatusChip(
                      label: _stockLabel(stockState),
                      icon: Icons.inventory_2_outlined,
                      state: _stockChipState(stockState),
                      onTap: onRefresh,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

enum _PosStatusState { connected, disconnected, checking }

class _PosStatusChip extends StatelessWidget {
  const _PosStatusChip({
    required this.label,
    required this.icon,
    required this.state,
    this.onTap,
  });

  final String label;
  final IconData icon;
  final _PosStatusState state;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = context.isPosDark;

    final Color dotColor;
    final Color bgColor;
    final Color fgColor;

    switch (state) {
      case _PosStatusState.connected:
        dotColor = const Color(0xFF34D399);
        if (isDark) {
          bgColor = const Color(0xFF059669).withValues(alpha: 0.24);
          fgColor = const Color(0xFF6EE7B7);
        } else {
          bgColor = const Color(0xFFECFDF5);
          fgColor = const Color(0xFF047857);
        }
      case _PosStatusState.disconnected:
        dotColor = PosColors.red;
        bgColor = PosColors.red.withValues(alpha: isDark ? 0.2 : 0.08);
        fgColor = isDark ? const Color(0xFFFCA5A5) : PosColors.red;
      case _PosStatusState.checking:
        dotColor = PosColors.orange;
        bgColor = PosColors.orange.withValues(alpha: isDark ? 0.22 : 0.1);
        fgColor = isDark ? const Color(0xFFFCD34D) : PosColors.orange;
    }

    final chip = Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(kPosButtonRadius),
        border: Border.all(
          color: fgColor.withValues(alpha: isDark ? 0.35 : 0.18),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
          ),
          SizedBox(width: 5),
          Icon(icon, size: 13, color: fgColor),
          SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.15,
              color: fgColor,
            ),
          ),
        ],
      ),
    );

    if (onTap == null) return chip;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(kPosButtonRadius),
        child: chip,
      ),
    );
  }
}
