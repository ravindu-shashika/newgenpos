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
                      const Icon(
                        Icons.point_of_sale_outlined,
                        size: 16,
                        color: Colors.white70,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        PosBranding.appName,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
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
            child: Icon(icon, size: 18, color: Colors.white),
          ),
        ),
      ),
    );
  }
}
