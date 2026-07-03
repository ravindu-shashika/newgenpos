import 'package:shared_preferences/shared_preferences.dart';

import '../../features/pos/models/local_database_settings.dart';

class LocalDatabaseSettingsRepository {
  static const _prefsKey = 'local_database_settings_v1';

  Future<LocalDatabaseSettings> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_prefsKey);
    if (raw == null || raw.isEmpty) {
      return LocalDatabaseSettings.defaults();
    }
    try {
      return LocalDatabaseSettings.decode(raw);
    } catch (_) {
      return LocalDatabaseSettings.defaults();
    }
  }

  Future<void> save(LocalDatabaseSettings settings) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefsKey, settings.encode());
  }
}
