import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';

enum PosToastType { success, error, info, warning }

/// Branded floating toast — white card with icon (not default dark snackbar).
class PosToast {
  PosToast._();

  static void show(
    BuildContext context,
    String message, {
    PosToastType type = PosToastType.info,
    Duration duration = const Duration(seconds: 3),
  }) {
    if (message.trim().isEmpty) return;

    final brand = context.posBrand;
    final (icon, iconColor, accent) = _style(type, brand);

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          elevation: 0,
          backgroundColor: Colors.transparent,
          padding: EdgeInsets.zero,
          margin: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          behavior: SnackBarBehavior.floating,
          duration: duration,
          content: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(kPosButtonRadius),
              border: Border.all(color: PosColors.border),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(kPosButtonRadius),
                  ),
                  child: Icon(icon, size: 20, color: iconColor),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    message,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: PosColors.textPrimary,
                      height: 1.35,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
  }

  static (IconData, Color, Color) _style(PosToastType type, PosBrandTheme brand) {
    switch (type) {
      case PosToastType.success:
        return (Icons.check_circle_outline_rounded, const Color(0xFF059669),
            const Color(0xFF059669));
      case PosToastType.error:
        return (Icons.error_outline_rounded, PosColors.red, PosColors.red);
      case PosToastType.warning:
        return (
          Icons.warning_amber_rounded,
          const Color(0xFFD97706),
          const Color(0xFFD97706),
        );
      case PosToastType.info:
        return (Icons.info_outline_rounded, brand.primary, brand.primary);
    }
  }
}
