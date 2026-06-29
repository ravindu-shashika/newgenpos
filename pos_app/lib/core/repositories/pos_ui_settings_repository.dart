import 'package:shared_preferences/shared_preferences.dart';

import '../../features/pos/models/pos_ui_settings.dart';

class PosUiSettingsRepository {
  static const _prefsKey = 'pos_ui_settings_v1';

  Future<PosUiSettings> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_prefsKey);
    if (raw == null || raw.isEmpty) {
      return PosUiSettings.defaults();
    }
    try {
      return PosUiSettings.decode(raw);
    } catch (_) {
      return PosUiSettings.defaults();
    }
  }

  Future<void> save(PosUiSettings settings) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefsKey, settings.encode());
  }
}
