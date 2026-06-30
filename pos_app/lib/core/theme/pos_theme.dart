import 'package:flutter/material.dart';

import '../../features/pos/models/pos_ui_settings.dart';

export 'pos_app_styles.dart';

/// Professional square-ish button corners (not pill-shaped).
const double kPosButtonRadius = 6;

/// Static accent palette — same in light and dark mode.
abstract final class PosColors {
  static const primary = Color(0xFF002C76);
  static const primaryDark = Color(0xFF001F55);
  static const primaryLight = Color(0xFFE8F0FE);
  static const connectedPillBg = Color(0xFFE8F0FE);
  static const connectedPillText = Color(0xFF002C76);

  static const purple = Color(0xFF7C5CC4);
  static const purpleDark = Color(0xFF5B45A0);
  static const purpleLight = Color(0xFFEDE7F6);
  static const teal = Color(0xFF26A69A);
  static const red = Color(0xFFDC2626);
  static const blue = Color(0xFF3B6FF5);
  static const pink = Color(0xFFEC407A);
  static const orange = Color(0xFFFF9800);
  static const amber = Color(0xFFFFC107);
  static const indigo = Color(0xFF5C6BC0);
  static const slate = Color(0xFF78909C);

  // Light defaults — prefer theme-aware accessors in widgets.
  static const pageBg = Color(0xFFF4F7FB);
  static const panelBg = Color(0xFFFFFFFF);
  static const catalogBg = Color(0xFFFFFFFF);
  static const orderPanelBg = Color(0xFFEEF4FC);
  static const posSidebarBg = Color(0xFFF0F4FA);
  static const sidebarBg = Color(0xFF002C76);
  static const sidebarActiveBg = Color(0xFF002C76);
  static const border = Color(0xFFDCE4F0);
  static const textPrimary = Color(0xFF1A2B56);
  static const textMuted = Color(0xFF6B7A94);
  static const searchFill = Color(0xFFF1F5FB);
  static const searchBorder = Color(0xFFDCE4F0);
  static const chipInactive = Color(0xFFE8F0FE);
  static const chipInactiveText = Color(0xFF3B6FF5);
  static const productIconBg = Color(0xFFE8F0FE);

  static const loginAccent = Color(0xFF3B6FF5);
  static const loginAccentDark = Color(0xFF2F5BEA);
  static const loginPageBg = Color(0xFFF4F7FA);
  static const loginHeaderBg = Color(0xFFF4F7FA);
  static const loginFieldFill = Color(0xFFEEF2F8);
  static const loginNumpadFill = Color(0xFFEEF2F8);
  static const loginNumpadBorder = Color(0xFFE2E8F0);
  static const loginFieldBorder = Color(0xFFD5DEE8);
  static const loginPillBg = Color(0xFFEEF2F8);
  static const loginText = Color(0xFF1A2B56);
  static const loginTextMuted = Color(0xFF8B95A8);
}

/// Preset swatches for theme / button color pickers.
abstract final class PosThemePresets {
  static const swatches = <String, Color>{
    'Navy': Color(0xFF002C76),
    'Blue': Color(0xFF3B6FF5),
    'Teal': Color(0xFF0D9488),
    'Green': Color(0xFF059669),
    'Purple': Color(0xFF7C5CC4),
    'Indigo': Color(0xFF4F46E5),
    'Red': Color(0xFFDC2626),
    'Slate': Color(0xFF475569),
  };
}

Color parsePosHexColor(String? hex, Color fallback) {
  if (hex == null || hex.trim().isEmpty) return fallback;
  var h = hex.trim();
  if (h.startsWith('#')) h = h.substring(1);
  if (h.length != 6) return fallback;
  final value = int.tryParse(h, radix: 16);
  if (value == null) return fallback;
  return Color(0xFF000000 | value);
}

String colorToPosHex(Color color) {
  final rgb = color.toARGB32() & 0xFFFFFF;
  return '#${rgb.toRadixString(16).padLeft(6, '0').toUpperCase()}';
}

Color _blend(Color a, Color b, double t) {
  return Color.lerp(a, b, t) ?? a;
}

/// Brightness-aware surface, text, and border tokens for POS layouts.
@immutable
class PosSurfaceTheme extends ThemeExtension<PosSurfaceTheme> {
  const PosSurfaceTheme({
    required this.pageBg,
    required this.panelBg,
    required this.catalogBg,
    required this.orderPanelBg,
    required this.posSidebarBg,
    required this.border,
    required this.textPrimary,
    required this.textMuted,
    required this.searchFill,
    required this.searchBorder,
    required this.productIconBg,
    required this.connectedPillBg,
    required this.connectedPillText,
    required this.loginPageBg,
    required this.loginHeaderBg,
    required this.loginFieldFill,
    required this.loginNumpadFill,
    required this.loginNumpadBorder,
    required this.loginFieldBorder,
    required this.loginPillBg,
    required this.loginText,
    required this.loginTextMuted,
    required this.elevatedSurface,
    required this.shadowColor,
  });

  final Color pageBg;
  final Color panelBg;
  final Color catalogBg;
  final Color orderPanelBg;
  final Color posSidebarBg;
  final Color border;
  final Color textPrimary;
  final Color textMuted;
  final Color searchFill;
  final Color searchBorder;
  final Color productIconBg;
  final Color connectedPillBg;
  final Color connectedPillText;
  final Color loginPageBg;
  final Color loginHeaderBg;
  final Color loginFieldFill;
  final Color loginNumpadFill;
  final Color loginNumpadBorder;
  final Color loginFieldBorder;
  final Color loginPillBg;
  final Color loginText;
  final Color loginTextMuted;
  final Color elevatedSurface;
  final Color shadowColor;

  factory PosSurfaceTheme.light() {
    return const PosSurfaceTheme(
      pageBg: PosColors.pageBg,
      panelBg: PosColors.panelBg,
      catalogBg: PosColors.catalogBg,
      orderPanelBg: PosColors.orderPanelBg,
      posSidebarBg: PosColors.posSidebarBg,
      border: PosColors.border,
      textPrimary: PosColors.textPrimary,
      textMuted: PosColors.textMuted,
      searchFill: PosColors.searchFill,
      searchBorder: PosColors.searchBorder,
      productIconBg: PosColors.productIconBg,
      connectedPillBg: PosColors.connectedPillBg,
      connectedPillText: PosColors.connectedPillText,
      loginPageBg: PosColors.loginPageBg,
      loginHeaderBg: PosColors.loginHeaderBg,
      loginFieldFill: PosColors.loginFieldFill,
      loginNumpadFill: PosColors.loginNumpadFill,
      loginNumpadBorder: PosColors.loginNumpadBorder,
      loginFieldBorder: PosColors.loginFieldBorder,
      loginPillBg: PosColors.loginPillBg,
      loginText: PosColors.loginText,
      loginTextMuted: PosColors.loginTextMuted,
      elevatedSurface: Color(0xFFFFFFFF),
      shadowColor: Color(0x1A000000),
    );
  }

  factory PosSurfaceTheme.dark() {
    return const PosSurfaceTheme(
      pageBg: Color(0xFF0F172A),
      panelBg: Color(0xFF1E293B),
      catalogBg: Color(0xFF1E293B),
      orderPanelBg: Color(0xFF172033),
      posSidebarBg: Color(0xFF1E293B),
      border: Color(0xFF334155),
      textPrimary: Color(0xFFF1F5F9),
      textMuted: Color(0xFF94A3B8),
      searchFill: Color(0xFF334155),
      searchBorder: Color(0xFF475569),
      productIconBg: Color(0xFF334155),
      connectedPillBg: Color(0xFF1E3A5F),
      connectedPillText: Color(0xFF93C5FD),
      loginPageBg: Color(0xFF0F172A),
      loginHeaderBg: Color(0xFF0F172A),
      loginFieldFill: Color(0xFF1E293B),
      loginNumpadFill: Color(0xFF1E293B),
      loginNumpadBorder: Color(0xFF334155),
      loginFieldBorder: Color(0xFF475569),
      loginPillBg: Color(0xFF1E293B),
      loginText: Color(0xFFF1F5F9),
      loginTextMuted: Color(0xFF94A3B8),
      elevatedSurface: Color(0xFF273449),
      shadowColor: Color(0x40000000),
    );
  }

  @override
  PosSurfaceTheme copyWith({
    Color? pageBg,
    Color? panelBg,
    Color? catalogBg,
    Color? orderPanelBg,
    Color? posSidebarBg,
    Color? border,
    Color? textPrimary,
    Color? textMuted,
    Color? searchFill,
    Color? searchBorder,
    Color? productIconBg,
    Color? connectedPillBg,
    Color? connectedPillText,
    Color? loginPageBg,
    Color? loginHeaderBg,
    Color? loginFieldFill,
    Color? loginNumpadFill,
    Color? loginNumpadBorder,
    Color? loginFieldBorder,
    Color? loginPillBg,
    Color? loginText,
    Color? loginTextMuted,
    Color? elevatedSurface,
    Color? shadowColor,
  }) {
    return PosSurfaceTheme(
      pageBg: pageBg ?? this.pageBg,
      panelBg: panelBg ?? this.panelBg,
      catalogBg: catalogBg ?? this.catalogBg,
      orderPanelBg: orderPanelBg ?? this.orderPanelBg,
      posSidebarBg: posSidebarBg ?? this.posSidebarBg,
      border: border ?? this.border,
      textPrimary: textPrimary ?? this.textPrimary,
      textMuted: textMuted ?? this.textMuted,
      searchFill: searchFill ?? this.searchFill,
      searchBorder: searchBorder ?? this.searchBorder,
      productIconBg: productIconBg ?? this.productIconBg,
      connectedPillBg: connectedPillBg ?? this.connectedPillBg,
      connectedPillText: connectedPillText ?? this.connectedPillText,
      loginPageBg: loginPageBg ?? this.loginPageBg,
      loginHeaderBg: loginHeaderBg ?? this.loginHeaderBg,
      loginFieldFill: loginFieldFill ?? this.loginFieldFill,
      loginNumpadFill: loginNumpadFill ?? this.loginNumpadFill,
      loginNumpadBorder: loginNumpadBorder ?? this.loginNumpadBorder,
      loginFieldBorder: loginFieldBorder ?? this.loginFieldBorder,
      loginPillBg: loginPillBg ?? this.loginPillBg,
      loginText: loginText ?? this.loginText,
      loginTextMuted: loginTextMuted ?? this.loginTextMuted,
      elevatedSurface: elevatedSurface ?? this.elevatedSurface,
      shadowColor: shadowColor ?? this.shadowColor,
    );
  }

  @override
  PosSurfaceTheme lerp(ThemeExtension<PosSurfaceTheme>? other, double t) {
    if (other is! PosSurfaceTheme) return this;
    return PosSurfaceTheme(
      pageBg: Color.lerp(pageBg, other.pageBg, t)!,
      panelBg: Color.lerp(panelBg, other.panelBg, t)!,
      catalogBg: Color.lerp(catalogBg, other.catalogBg, t)!,
      orderPanelBg: Color.lerp(orderPanelBg, other.orderPanelBg, t)!,
      posSidebarBg: Color.lerp(posSidebarBg, other.posSidebarBg, t)!,
      border: Color.lerp(border, other.border, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      searchFill: Color.lerp(searchFill, other.searchFill, t)!,
      searchBorder: Color.lerp(searchBorder, other.searchBorder, t)!,
      productIconBg: Color.lerp(productIconBg, other.productIconBg, t)!,
      connectedPillBg: Color.lerp(connectedPillBg, other.connectedPillBg, t)!,
      connectedPillText:
          Color.lerp(connectedPillText, other.connectedPillText, t)!,
      loginPageBg: Color.lerp(loginPageBg, other.loginPageBg, t)!,
      loginHeaderBg: Color.lerp(loginHeaderBg, other.loginHeaderBg, t)!,
      loginFieldFill: Color.lerp(loginFieldFill, other.loginFieldFill, t)!,
      loginNumpadFill: Color.lerp(loginNumpadFill, other.loginNumpadFill, t)!,
      loginNumpadBorder:
          Color.lerp(loginNumpadBorder, other.loginNumpadBorder, t)!,
      loginFieldBorder:
          Color.lerp(loginFieldBorder, other.loginFieldBorder, t)!,
      loginPillBg: Color.lerp(loginPillBg, other.loginPillBg, t)!,
      loginText: Color.lerp(loginText, other.loginText, t)!,
      loginTextMuted: Color.lerp(loginTextMuted, other.loginTextMuted, t)!,
      elevatedSurface: Color.lerp(elevatedSurface, other.elevatedSurface, t)!,
      shadowColor: Color.lerp(shadowColor, other.shadowColor, t)!,
    );
  }
}

@immutable
class PosBrandTheme extends ThemeExtension<PosBrandTheme> {
  const PosBrandTheme({
    required this.primary,
    required this.primaryDark,
    required this.primaryLight,
    required this.buttonPrimary,
    required this.sidebarBg,
    required this.chipInactive,
    required this.chipInactiveText,
  });

  final Color primary;
  final Color primaryDark;
  final Color primaryLight;
  final Color buttonPrimary;
  final Color sidebarBg;
  final Color chipInactive;
  final Color chipInactiveText;

  factory PosBrandTheme.defaults() {
    return PosBrandTheme.fromPrimary(
      PosColors.primary,
      buttonPrimary: PosColors.primary,
    );
  }

  factory PosBrandTheme.fromPrimary(
    Color primary, {
    Color? buttonPrimary,
    bool darkMode = false,
  }) {
    final btn = buttonPrimary ?? primary;
    final blendBase = darkMode ? const Color(0xFF1E293B) : Colors.white;
    return PosBrandTheme(
      primary: primary,
      primaryDark: _blend(primary, Colors.black, 0.25),
      primaryLight: darkMode
          ? _blend(primary, blendBase, 0.75)
          : _blend(primary, Colors.white, 0.88),
      buttonPrimary: btn,
      sidebarBg: darkMode
          ? _blend(primary, blendBase, 0.15)
          : _blend(primary, Colors.white, 0.94),
      chipInactive: darkMode
          ? _blend(primary, blendBase, 0.35)
          : _blend(primary, Colors.white, 0.9),
      chipInactiveText: darkMode
          ? _blend(primary, Colors.white, 0.65)
          : _blend(primary, Colors.white, 0.35),
    );
  }

  @override
  PosBrandTheme copyWith({
    Color? primary,
    Color? primaryDark,
    Color? primaryLight,
    Color? buttonPrimary,
    Color? sidebarBg,
    Color? chipInactive,
    Color? chipInactiveText,
  }) {
    return PosBrandTheme(
      primary: primary ?? this.primary,
      primaryDark: primaryDark ?? this.primaryDark,
      primaryLight: primaryLight ?? this.primaryLight,
      buttonPrimary: buttonPrimary ?? this.buttonPrimary,
      sidebarBg: sidebarBg ?? this.sidebarBg,
      chipInactive: chipInactive ?? this.chipInactive,
      chipInactiveText: chipInactiveText ?? this.chipInactiveText,
    );
  }

  @override
  PosBrandTheme lerp(ThemeExtension<PosBrandTheme>? other, double t) {
    if (other is! PosBrandTheme) return this;
    return PosBrandTheme(
      primary: Color.lerp(primary, other.primary, t)!,
      primaryDark: Color.lerp(primaryDark, other.primaryDark, t)!,
      primaryLight: Color.lerp(primaryLight, other.primaryLight, t)!,
      buttonPrimary: Color.lerp(buttonPrimary, other.buttonPrimary, t)!,
      sidebarBg: Color.lerp(sidebarBg, other.sidebarBg, t)!,
      chipInactive: Color.lerp(chipInactive, other.chipInactive, t)!,
      chipInactiveText:
          Color.lerp(chipInactiveText, other.chipInactiveText, t)!,
    );
  }
}

extension PosThemeContext on BuildContext {
  PosSurfaceTheme get posSurface =>
      Theme.of(this).extension<PosSurfaceTheme>() ?? PosSurfaceTheme.light();

  PosBrandTheme get posBrand =>
      Theme.of(this).extension<PosBrandTheme>() ?? PosBrandTheme.defaults();

  bool get isPosDark => Theme.of(this).brightness == Brightness.dark;

  /// Brand accent readable on panel/dialog surfaces.
  Color get posAccent =>
      isPosDark ? const Color(0xFF93C5FD) : posBrand.primary;
}

PosBrandTheme resolvePosBrandTheme(PosUiSettings ui) {
  final primary = parsePosHexColor(ui.themePrimaryColor, PosColors.primary);
  final buttonHex = ui.buttonPrimaryColor.trim();
  final buttonPrimary = buttonHex.isEmpty
      ? primary
      : parsePosHexColor(buttonHex, primary);
  return PosBrandTheme.fromPrimary(
    primary,
    buttonPrimary: buttonPrimary,
    darkMode: ui.darkMode,
  );
}

PosSurfaceTheme resolvePosSurfaceTheme(PosUiSettings ui) {
  return ui.darkMode ? PosSurfaceTheme.dark() : PosSurfaceTheme.light();
}

RoundedRectangleBorder posButtonShape({double? radius}) {
  return RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(radius ?? kPosButtonRadius),
  );
}

ButtonStyle posFilledButtonStyle(Color background, {Color? foreground}) {
  return FilledButton.styleFrom(
    backgroundColor: background,
    foregroundColor: foreground ?? Colors.white,
    disabledBackgroundColor: background.withValues(alpha: 0.45),
    minimumSize: const Size(0, 44),
    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
    elevation: 0,
    shadowColor: Colors.transparent,
    shape: posButtonShape(),
    textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
  );
}

ButtonStyle posOutlinedButtonStyle(Color foreground, {Color? borderColor}) {
  return OutlinedButton.styleFrom(
    foregroundColor: foreground,
    minimumSize: const Size(0, 44),
    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
    side: BorderSide(color: borderColor ?? PosColors.border),
    shape: posButtonShape(),
    textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
  );
}

ThemeData buildPosTheme([PosUiSettings ui = const PosUiSettings()]) {
  final brand = resolvePosBrandTheme(ui);
  final surface = resolvePosSurfaceTheme(ui);
  final brightness = ui.darkMode ? Brightness.dark : Brightness.light;
  final base = ui.darkMode ? ThemeData.dark() : ThemeData.light();

  final accentOnSurface =
      ui.darkMode ? const Color(0xFF93C5FD) : brand.primary;

  final textTheme = base.textTheme
      .apply(
        fontFamily: 'Segoe UI',
        fontSizeFactor: ui.fontScale.clamp(0.85, 1.25),
        bodyColor: surface.textPrimary,
        displayColor: surface.textPrimary,
      )
      .copyWith(
        bodyLarge: TextStyle(color: surface.textPrimary),
        bodyMedium: TextStyle(color: surface.textPrimary),
        bodySmall: TextStyle(color: surface.textMuted),
        titleLarge: TextStyle(
          color: surface.textPrimary,
          fontWeight: FontWeight.w700,
        ),
        titleMedium: TextStyle(
          color: surface.textPrimary,
          fontWeight: FontWeight.w600,
        ),
        titleSmall: TextStyle(
          color: surface.textPrimary,
          fontWeight: FontWeight.w600,
        ),
        labelLarge: TextStyle(
          color: surface.textPrimary,
          fontWeight: FontWeight.w600,
        ),
        labelMedium: TextStyle(color: surface.textMuted),
        labelSmall: TextStyle(color: surface.textMuted),
      );

  final colorScheme = ColorScheme.fromSeed(
    seedColor: brand.primary,
    brightness: brightness,
    primary: brand.primary,
    onPrimary: Colors.white,
    surface: surface.panelBg,
    onSurface: surface.textPrimary,
    onSurfaceVariant: surface.textMuted,
    outline: surface.border,
    surfaceContainerHighest: surface.searchFill,
  );

  return ThemeData(
    useMaterial3: true,
    fontFamily: 'Segoe UI',
    brightness: brightness,
    textTheme: textTheme,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: surface.pageBg,
    dividerColor: surface.border,
    extensions: [brand, surface],
    filledButtonTheme: FilledButtonThemeData(
      style: posFilledButtonStyle(brand.buttonPrimary),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: posOutlinedButtonStyle(
        accentOnSurface,
        borderColor: surface.border,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: accentOnSurface,
        minimumSize: const Size(0, 40),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        shape: posButtonShape(),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: brand.buttonPrimary,
        foregroundColor: Colors.white,
        elevation: 0,
        minimumSize: const Size(0, 44),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        shape: posButtonShape(),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
      ),
    ),
    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(
        foregroundColor: surface.textPrimary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(kPosButtonRadius),
        ),
      ),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: surface.panelBg,
      foregroundColor: surface.textPrimary,
      elevation: 0,
      scrolledUnderElevation: 0,
      surfaceTintColor: Colors.transparent,
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: surface.panelBg,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: TextStyle(
        color: surface.textPrimary,
        fontSize: 18,
        fontWeight: FontWeight.w700,
      ),
      contentTextStyle: TextStyle(color: surface.textMuted, fontSize: 14),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: surface.panelBg,
      surfaceTintColor: Colors.transparent,
    ),
    listTileTheme: ListTileThemeData(
      textColor: surface.textPrimary,
      iconColor: surface.textMuted,
    ),
    segmentedButtonTheme: SegmentedButtonThemeData(
      style: ButtonStyle(
        shape: WidgetStateProperty.all(posButtonShape()),
        padding: WidgetStateProperty.all(
          const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: surface.searchFill,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(kPosButtonRadius + 2),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(kPosButtonRadius + 2),
        borderSide: BorderSide(color: surface.searchBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(kPosButtonRadius + 2),
        borderSide: BorderSide(color: accentOnSurface, width: 1.5),
      ),
      hintStyle: TextStyle(color: surface.textMuted, fontSize: 14),
      labelStyle: TextStyle(color: surface.textMuted, fontSize: 14),
    ),
    cardTheme: CardThemeData(
      color: surface.panelBg,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: surface.border),
      ),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(color: accentOnSurface),
    sliderTheme: SliderThemeData(
      activeTrackColor: accentOnSurface,
      inactiveTrackColor: surface.border,
      thumbColor: accentOnSurface,
      overlayColor: accentOnSurface.withValues(alpha: 0.12),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return brand.primary;
        return null;
      }),
      trackColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return brand.primary.withValues(alpha: 0.35);
        }
        return null;
      }),
    ),
    checkboxTheme: CheckboxThemeData(
      fillColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return brand.primary;
        return null;
      }),
      checkColor: WidgetStateProperty.all(Colors.white),
      side: BorderSide(color: surface.border),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(3),
      ),
    ),
  );
}

ThemeData buildLoginTheme([PosUiSettings ui = const PosUiSettings()]) {
  final surface = resolvePosSurfaceTheme(ui);
  final brand = resolvePosBrandTheme(ui);
  final brightness = ui.darkMode ? Brightness.dark : Brightness.light;

  return ThemeData(
    useMaterial3: true,
    fontFamily: 'Segoe UI',
    brightness: brightness,
    colorScheme: ColorScheme.fromSeed(
      seedColor: PosColors.loginAccent,
      brightness: brightness,
      primary: PosColors.loginAccent,
      surface: surface.panelBg,
      onSurface: surface.loginText,
      onSurfaceVariant: surface.loginTextMuted,
    ),
    scaffoldBackgroundColor: surface.loginPageBg,
    textTheme: TextTheme(
      bodyLarge: TextStyle(color: surface.loginText),
      bodyMedium: TextStyle(color: surface.loginText),
      bodySmall: TextStyle(color: surface.loginTextMuted),
      titleLarge: TextStyle(
        color: surface.loginText,
        fontWeight: FontWeight.w700,
      ),
    ),
    extensions: [brand, surface],
    filledButtonTheme: FilledButtonThemeData(
      style: posFilledButtonStyle(PosColors.loginAccent),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: posOutlinedButtonStyle(
        PosColors.loginAccent,
        borderColor: surface.loginFieldBorder,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: PosColors.loginAccent,
        shape: posButtonShape(),
      ),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: PosColors.loginAccent,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: surface.loginFieldFill,
      hintStyle: TextStyle(color: surface.loginTextMuted),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(kPosButtonRadius + 2),
        borderSide: BorderSide(color: surface.loginFieldBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(kPosButtonRadius + 2),
        borderSide: const BorderSide(color: PosColors.loginAccent, width: 1.5),
      ),
    ),
  );
}
