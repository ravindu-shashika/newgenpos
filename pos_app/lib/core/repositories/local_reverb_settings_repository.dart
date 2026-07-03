import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../features/pos/models/local_reverb_settings.dart';

class LocalReverbSettingsRepository {
  static const _prefsKey = 'local_reverb_settings_v1';
  static const _legacyDbKey = 'local_database_settings_v1';

  Future<LocalReverbSettings> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_prefsKey);
    if (raw != null && raw.trim().isNotEmpty) {
      try {
        return LocalReverbSettings.decode(raw);
      } catch (_) {
        // fall through to migration
      }
    }
    return _migrateLegacy(prefs);
  }

  Future<LocalReverbSettings> _migrateLegacy(SharedPreferences prefs) async {
    final legacyRaw = prefs.getString(_legacyDbKey);
    if (legacyRaw != null && legacyRaw.trim().isNotEmpty) {
      try {
        final json = jsonDecode(legacyRaw) as Map<String, dynamic>;
        final host = json['reverb_host_override']?.toString().trim();
        final port = json['reverb_port_override'];
        final enable = json['enable_live_stock_sync'];
        final migrated = LocalReverbSettings(
          enableLiveStockSync: _legacyBool(enable, fallback: true),
          host: host != null && host.isNotEmpty ? host : null,
          port: port is int ? port : int.tryParse(port?.toString() ?? ''),
        );
        await save(migrated);
        return migrated;
      } catch (_) {
        // ignore
      }
    }
    return LocalReverbSettings.defaults();
  }

  Future<void> save(LocalReverbSettings settings) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefsKey, settings.encode());
  }

  static bool _legacyBool(dynamic value, {required bool fallback}) {
    if (value is bool) return value;
    if (value is int) return value != 0;
    if (value is String) {
      if (value == '1' || value.toLowerCase() == 'true') return true;
      if (value == '0' || value.toLowerCase() == 'false') return false;
    }
    return fallback;
  }
}
