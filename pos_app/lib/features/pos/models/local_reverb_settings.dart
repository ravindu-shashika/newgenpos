import 'dart:convert';

import '../../../core/config/app_config.dart';
import '../../../core/realtime/pos_realtime_config.dart';

/// Per-terminal Reverb WebSocket settings stored on the device.
class LocalReverbSettings {
  const LocalReverbSettings({
    this.enableLiveStockSync = defaultEnableLiveStockSync,
    this.appKey,
    this.host,
    this.port,
    this.scheme,
    this.authEndpoint,
  });

  final bool enableLiveStockSync;
  final String? appKey;
  final String? host;
  final int? port;

  /// `http` or `https`. Null = use server bootstrap scheme.
  final String? scheme;

  /// Optional override for `/pos/broadcasting/auth`. Null = derive from API URL.
  final String? authEndpoint;

  static const defaultEnableLiveStockSync = true;

  bool get hasConnectionFields =>
      appKey?.trim().isNotEmpty == true && host?.trim().isNotEmpty == true;

  LocalReverbSettings copyWith({
    bool? enableLiveStockSync,
    String? appKey,
    bool clearAppKey = false,
    String? host,
    bool clearHost = false,
    int? port,
    bool clearPort = false,
    String? scheme,
    bool clearScheme = false,
    String? authEndpoint,
    bool clearAuthEndpoint = false,
  }) {
    return LocalReverbSettings(
      enableLiveStockSync: enableLiveStockSync ?? this.enableLiveStockSync,
      appKey: clearAppKey ? null : (appKey ?? this.appKey),
      host: clearHost ? null : (host ?? this.host),
      port: clearPort ? null : (port ?? this.port),
      scheme: clearScheme ? null : (scheme ?? this.scheme),
      authEndpoint:
          clearAuthEndpoint ? null : (authEndpoint ?? this.authEndpoint),
    );
  }

  factory LocalReverbSettings.defaults() => const LocalReverbSettings();

  factory LocalReverbSettings.fromJson(Map<String, dynamic> json) {
    return LocalReverbSettings(
      enableLiveStockSync:
          _bool(json['enable_live_stock_sync'], fallback: true),
      appKey: _nonEmpty(json['reverb_app_key']),
      host: _nonEmpty(json['reverb_host']),
      port: _intOrNull(json['reverb_port']),
      scheme: _schemeOrNull(json['reverb_scheme']?.toString()),
      authEndpoint: _nonEmpty(json['reverb_auth_endpoint']),
    );
  }

  Map<String, dynamic> toJson() => {
        'enable_live_stock_sync': enableLiveStockSync,
        if (appKey != null) 'reverb_app_key': appKey,
        if (host != null) 'reverb_host': host,
        if (port != null) 'reverb_port': port,
        if (scheme != null) 'reverb_scheme': scheme,
        if (authEndpoint != null) 'reverb_auth_endpoint': authEndpoint,
      };

  String encode() => jsonEncode(toJson());

  static LocalReverbSettings decode(String raw) =>
      LocalReverbSettings.fromJson(jsonDecode(raw) as Map<String, dynamic>);

  /// Merge bootstrap realtime config with saved terminal values.
  PosRealtimeConfig resolveConfig({
    required PosRealtimeConfig bootstrap,
    required int? warehouseId,
    String? posBaseUrl,
  }) {
    var config = bootstrap;

    final key = appKey?.trim();
    if (key != null && key.isNotEmpty) {
      config = config.copyWith(key: key);
    }

    final hostValue = host?.trim();
    if (hostValue != null && hostValue.isNotEmpty) {
      final schemeValue = scheme ?? config.scheme;
      config = config.copyWith(
        host: hostValue,
        port: port ?? config.port,
        scheme: schemeValue,
        useTls: schemeValue == 'https',
      );
    } else {
      if (port != null) config = config.copyWith(port: port);
      if (scheme != null && scheme!.isNotEmpty) {
        config = config.copyWith(
          scheme: scheme,
          useTls: scheme == 'https',
        );
      }
    }

    final auth = authEndpoint?.trim();
    if (auth != null && auth.isNotEmpty) {
      config = config.copyWith(authEndpoint: auth);
    }

    if (!config.enabled && hasConnectionFields) {
      final base = AppConfig.resolvePosBaseUrl(posBaseUrl);
      config = config.copyWith(
        enabled: true,
        authEndpoint: config.authEndpoint ?? '$base/broadcasting/auth',
        channel: config.channel ??
            (warehouseId != null
                ? 'private-pos.warehouse.$warehouseId'
                : null),
      );
    }

    return config;
  }

  /// Populate fields from server bootstrap (does not save).
  LocalReverbSettings importedFromBootstrap(PosRealtimeConfig bootstrap) {
    return copyWith(
      appKey: bootstrap.key,
      host: bootstrap.host,
      port: bootstrap.port,
      scheme: bootstrap.scheme,
      authEndpoint: bootstrap.authEndpoint,
    );
  }

  static String? _nonEmpty(dynamic value) {
    final text = value?.toString().trim();
    if (text == null || text.isEmpty) return null;
    return text;
  }

  static int? _intOrNull(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    return int.tryParse(value.toString());
  }

  static String? _schemeOrNull(String? raw) {
    final value = raw?.trim().toLowerCase();
    if (value == 'http' || value == 'https') return value;
    return null;
  }

  static bool _bool(dynamic value, {required bool fallback}) {
    if (value is bool) return value;
    if (value is int) return value != 0;
    if (value is String) {
      if (value == '1' || value.toLowerCase() == 'true') return true;
      if (value == '0' || value.toLowerCase() == 'false') return false;
    }
    return fallback;
  }
}
