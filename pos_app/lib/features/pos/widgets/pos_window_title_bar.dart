import 'dart:async';

import 'package:flutter/material.dart';
import 'package:window_manager/window_manager.dart';

import '../../../core/branding/pos_branding.dart';
import '../../../core/services/pos_window_service.dart';
import '../../../core/theme/pos_theme.dart';

/// Custom draggable title bar shown in kiosk mode (native bar is hidden).
class PosWindowTitleBar extends StatelessWidget {
  const PosWindowTitleBar({super.key});

  static const height = 36.0;

  @override
  Widget build(BuildContext context) {
    final brand = context.posBrand;
    final styles = context.posStyles;

    return Material(
      color: brand.primary,
      elevation: 1,
      child: SizedBox(
        height: height,
        child: Row(
          children: [
            Expanded(
              child: DragToMoveArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  child: Row(
                    children: [
                      Icon(
                        Icons.point_of_sale_outlined,
                        size: 16,
                        color: styles.titleBarFgMuted,
                      ),
                      SizedBox(width: 8),
                      Text(
                        PosBranding.appName,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: styles.titleBarFg,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            _TitleBarIconButton(
              semanticsLabel: 'Minimize window',
              icon: Icons.remove_rounded,
              onTap: () => unawaited(PosWindowService.instance.minimize()),
            ),
            ValueListenableBuilder<bool>(
              valueListenable: PosWindowService.instance.maximizedNotifier,
              builder: (context, maximized, _) {
                return _TitleBarIconButton(
                  semanticsLabel:
                      maximized ? 'Restore window' : 'Maximize window',
                  icon: maximized
                      ? Icons.fullscreen_exit_rounded
                      : Icons.fullscreen_rounded,
                  onTap: () =>
                      unawaited(PosWindowService.instance.toggleMaximize()),
                );
              },
            ),
            _TitleBarIconButton(
              semanticsLabel: 'Close application',
              icon: Icons.close_rounded,
              onTap: () => PosWindowService.instance.requestClose(context),
            ),
          ],
        ),
      ),
    );
  }
}

class _TitleBarIconButton extends StatelessWidget {
  const _TitleBarIconButton({
    required this.semanticsLabel,
    required this.icon,
    required this.onTap,
  });

  final String semanticsLabel;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final fg = context.posStyles.titleBarFg;

    return Semantics(
      button: true,
      label: semanticsLabel,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          hoverColor: Colors.white.withValues(alpha: 0.12),
          child: SizedBox(
            width: 46,
            height: PosWindowTitleBar.height,
            child: Icon(icon, size: 18, color: fg),
          ),
        ),
      ),
    );
  }
}
