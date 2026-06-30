import 'package:flutter/material.dart';

import 'pos_theme.dart';

/// Semantic POS colors and text styles — access via [BuildContext.posStyles].
@immutable
class PosAppStyles {
  const PosAppStyles(this._context);

  final BuildContext _context;

  bool get isDark => _context.isPosDark;

  PosSurfaceTheme get surface => _context.posSurface;

  PosBrandTheme get brand => _context.posBrand;

  // —— Text colors ——

  Color get text => Theme.of(_context).colorScheme.onSurface;

  Color get textMuted => Theme.of(_context).colorScheme.onSurfaceVariant;

  /// Brand accent for labels on panels (readable in light and dark).
  Color get accent => isDark ? const Color(0xFF93C5FD) : brand.primary;

  Color get accentStrong => isDark ? const Color(0xFFBFDBFE) : brand.primaryDark;

  /// Text/icons on brand-primary buttons and pills.
  Color get onBrand => Colors.white;

  Color get onBrandMuted => Colors.white.withValues(alpha: 0.88);

  Color get danger => isDark ? const Color(0xFFFCA5A5) : PosColors.red;

  Color get success => isDark ? const Color(0xFF6EE7B7) : const Color(0xFF047857);

  // —— Surfaces ——

  Color get pageBg => Theme.of(_context).scaffoldBackgroundColor;

  Color get cardBg => Theme.of(_context).colorScheme.surface;

  Color get elevatedBg => surface.elevatedSurface;

  Color get border => Theme.of(_context).dividerColor;

  Color get orderPanelBg => surface.orderPanelBg;

  Color get catalogBg => surface.catalogBg;

  Color get inputFill => Theme.of(_context).colorScheme.surfaceContainerHighest;

  /// Secondary outlined buttons on checkout (Coupon, Discount, etc.).
  Color get secondaryBtnBg => isDark ? elevatedBg : Colors.white;

  Color get shadowColor => surface.shadowColor;

  // —— Typography ——

  TextStyle get titleLarge => TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w800,
        color: text,
        letterSpacing: -0.2,
      );

  TextStyle get titleMedium => TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        color: text,
      );

  TextStyle get body => TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: text,
      );

  TextStyle get bodyMuted => TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: textMuted,
      );

  TextStyle get caption => TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: textMuted,
      );

  TextStyle get productName => TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: text,
        height: 1.2,
      );

  TextStyle get productCode => TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w600,
        color: textMuted,
        letterSpacing: 0.2,
      );

  TextStyle get productPrice => TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w800,
        color: accent,
      );

  TextStyle get moneyLarge => TextStyle(
        fontSize: 32,
        fontWeight: FontWeight.w800,
        color: accent,
        height: 1,
      );

  TextStyle get moneyMedium => TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: text,
      );

  TextStyle get buttonLabel => TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: onBrand,
      );

  TextStyle get payButtonLabel => TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.2,
        color: onBrand,
      );

  TextStyle get chipOnGradient => const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: Colors.white,
      );

  /// Window title bar — always on brand-primary background.
  Color get titleBarFg => Colors.white;

  Color get titleBarFgMuted => Colors.white.withValues(alpha: 0.75);

  // —— Decorations ——

  BoxDecoration cardDecoration({double radius = 12}) => BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: border),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: shadowColor,
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
      );

  ButtonStyle checkoutOutlinedStyle({
    bool highlighted = false,
  }) =>
      OutlinedButton.styleFrom(
        minimumSize: const Size(0, 46),
        foregroundColor: highlighted ? accent : text,
        side: BorderSide(
          color: highlighted ? accent : border,
        ),
        backgroundColor: highlighted
            ? (isDark
                ? brand.primary.withValues(alpha: 0.22)
                : brand.primaryLight)
            : secondaryBtnBg,
      );
}

extension PosAppStylesContext on BuildContext {
  PosAppStyles get posStyles => PosAppStyles(this);
}
