/// App-wide POS branding (window title, login, sidebar).
class PosBranding {
  PosBranding._();

  static const appName = 'NEWGENID POS';
  static const terminalTitle = 'POS Pro Terminal';
  static const fallbackInitial = 'N';

  /// Uses [custom] when non-empty; otherwise [appName].
  static String effectiveAppName(String? custom) {
    final trimmed = custom?.trim() ?? '';
    return trimmed.isEmpty ? appName : trimmed;
  }

  static String fallbackInitialFor(String? custom) {
    final name = effectiveAppName(custom);
    return name.isNotEmpty ? name[0].toUpperCase() : fallbackInitial;
  }
}
