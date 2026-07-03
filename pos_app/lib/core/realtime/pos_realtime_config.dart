class PosRealtimeConfig {
  const PosRealtimeConfig({
    required this.enabled,
    this.key,
    this.host,
    this.port = 8080,
    this.scheme = 'http',
    this.useTls = false,
    this.authEndpoint,
    this.channel,
  });

  final bool enabled;
  final String? key;
  final String? host;
  final int port;
  final String scheme;
  final bool useTls;
  final String? authEndpoint;
  final String? channel;

  factory PosRealtimeConfig.disabled() => const PosRealtimeConfig(enabled: false);

  factory PosRealtimeConfig.fromBootstrap(Map<String, dynamic>? json) {
    if (json == null || json['enabled'] != true) {
      return PosRealtimeConfig.disabled();
    }
    return PosRealtimeConfig(
      enabled: true,
      key: json['key']?.toString(),
      host: json['host']?.toString(),
      port: _int(json['port']) ?? 8080,
      scheme: json['scheme']?.toString() ?? 'http',
      useTls: json['use_tls'] == true || json['scheme']?.toString() == 'https',
      authEndpoint: json['auth_endpoint']?.toString(),
      channel: json['channel']?.toString(),
    );
  }

  bool get isValid =>
      enabled &&
      (key?.isNotEmpty ?? false) &&
      (host?.isNotEmpty ?? false) &&
      (authEndpoint?.isNotEmpty ?? false) &&
      (channel?.isNotEmpty ?? false);

  PosRealtimeConfig copyWith({
    bool? enabled,
    String? key,
    String? host,
    int? port,
    String? scheme,
    bool? useTls,
    String? authEndpoint,
    String? channel,
  }) {
    return PosRealtimeConfig(
      enabled: enabled ?? this.enabled,
      key: key ?? this.key,
      host: host ?? this.host,
      port: port ?? this.port,
      scheme: scheme ?? this.scheme,
      useTls: useTls ?? this.useTls,
      authEndpoint: authEndpoint ?? this.authEndpoint,
      channel: channel ?? this.channel,
    );
  }

  String get wsUrl {
    if (host == null || host!.isEmpty) return '—';
    final defaultPort = scheme == 'https' ? 443 : 80;
    if (port == defaultPort) return '$scheme://$host';
    return '$scheme://$host:$port';
  }

  static int? _int(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    return int.tryParse(v.toString());
  }
}

enum PosRealtimeConnectionState {
  disabled,
  disconnected,
  connecting,
  live,
  polling,
}
