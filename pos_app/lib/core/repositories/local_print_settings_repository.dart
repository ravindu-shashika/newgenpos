import 'package:shared_preferences/shared_preferences.dart';

import '../../features/pos/models/local_print_settings.dart';

class LocalPrintSettingsRepository {
  static const _prefsKey = 'local_print_settings_v1';

  Future<LocalPrintSettings> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_prefsKey);
    if (raw == null || raw.isEmpty) {
      return LocalPrintSettings.defaults();
    }
    try {
      return LocalPrintSettings.decode(raw);
    } catch (_) {
      return LocalPrintSettings.defaults();
    }
  }

  Future<void> save(LocalPrintSettings settings) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefsKey, settings.encode());
  }
}
