import 'package:flutter/material.dart';

import '../../features/pos/models/pos_ui_settings.dart';

/// Professional square-ish button corners (not pill-shaped).
const double kPosButtonRadius = 6;

/// POS Pro Terminal palette defaults (blue mockup).
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

  factory PosBrandTheme.fromPrimary(Color primary, {Color? buttonPrimary}) {
    final btn = buttonPrimary ?? primary;
    return PosBrandTheme(
      primary: primary,
      primaryDark: _blend(primary, Colors.black, 0.25),
      primaryLight: _blend(primary, Colors.white, 0.88),
      buttonPrimary: btn,
      sidebarBg: _blend(primary, Colors.white, 0.94),
      chipInactive: _blend(primary, Colors.white, 0.9),
      chipInactiveText: _blend(primary, Colors.white, 0.35),
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
      chipInactiveText: Color.lerp(chipInactiveText, other.chipInactiveText, t)!,
    );
  }
}

extension PosThemeContext on BuildContext {
  PosBrandTheme get posBrand =>
      Theme.of(this).extension<PosBrandTheme>() ?? PosBrandTheme.defaults();
}

PosBrandTheme resolvePosBrandTheme(PosUiSettings ui) {
  final primary = parsePosHexColor(ui.themePrimaryColor, PosColors.primary);
  final buttonHex = ui.buttonPrimaryColor.trim();
  final buttonPrimary = buttonHex.isEmpty
      ? primary
      : parsePosHexColor(buttonHex, primary);
  return PosBrandTheme.fromPrimary(primary, buttonPrimary: buttonPrimary);
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

ButtonStyle posOutlinedButtonStyle(Color foreground) {
  return OutlinedButton.styleFrom(
    foregroundColor: foreground,
    minimumSize: const Size(0, 44),
    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
    side: const BorderSide(color: PosColors.border),
    shape: posButtonShape(),
    textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
  );
}

ThemeData buildPosTheme([PosUiSettings ui = const PosUiSettings()]) {
  final brand = resolvePosBrandTheme(ui);
  final brightness = ui.darkMode ? Brightness.dark : Brightness.light;
  final base = ui.darkMode ? ThemeData.dark() : ThemeData.light();

  final textTheme = base.textTheme.apply(
    fontFamily: 'Segoe UI',
    fontSizeFactor: ui.fontScale.clamp(0.85, 1.25),
  );

  return ThemeData(
    useMaterial3: true,
    fontFamily: 'Segoe UI',
    brightness: brightness,
    textTheme: textTheme,
    colorScheme: ColorScheme.fromSeed(
      seedColor: brand.primary,
      brightness: brightness,
      primary: brand.primary,
      surface: ui.darkMode ? const Color(0xFF1E293B) : PosColors.panelBg,
    ),
    scaffoldBackgroundColor:
        ui.darkMode ? const Color(0xFF0F172A) : PosColors.pageBg,
    dividerColor: PosColors.border,
    extensions: [brand],
    filledButtonTheme: FilledButtonThemeData(
      style: posFilledButtonStyle(brand.buttonPrimary),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: posOutlinedButtonStyle(brand.primary),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: brand.primary,
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
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(kPosButtonRadius),
        ),
      ),
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
      fillColor: ui.darkMode ? const Color(0xFF1E293B) : PosColors.searchFill,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(kPosButtonRadius + 2),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(kPosButtonRadius + 2),
        borderSide: const BorderSide(color: PosColors.searchBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(kPosButtonRadius + 2),
        borderSide: BorderSide(color: brand.primary, width: 1.5),
      ),
      hintStyle: const TextStyle(color: PosColors.textMuted, fontSize: 14),
    ),
    cardTheme: CardThemeData(
      color: ui.darkMode ? const Color(0xFF1E293B) : PosColors.panelBg,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: const BorderSide(color: PosColors.border),
      ),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(color: brand.primary),
    sliderTheme: SliderThemeData(
      activeTrackColor: brand.primary,
      thumbColor: brand.primary,
      overlayColor: brand.primary.withValues(alpha: 0.12),
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
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(3),
      ),
    ),
  );
}

ThemeData buildLoginTheme() {
  return ThemeData(
    useMaterial3: true,
    fontFamily: 'Segoe UI',
    colorScheme: ColorScheme.fromSeed(
      seedColor: PosColors.loginAccent,
      brightness: Brightness.light,
      primary: PosColors.loginAccent,
      surface: Colors.white,
    ),
    scaffoldBackgroundColor: PosColors.loginPageBg,
    filledButtonTheme: FilledButtonThemeData(
      style: posFilledButtonStyle(PosColors.loginAccent),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: posOutlinedButtonStyle(PosColors.loginAccent),
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
  );
}
