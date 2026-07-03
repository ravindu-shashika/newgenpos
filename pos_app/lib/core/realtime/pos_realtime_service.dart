import 'dart:async';

import 'package:dart_pusher_channels/dart_pusher_channels.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../database/app_database.dart';
import '../logging/app_logger.dart';
import '../pos_http/pos_api_headers.dart';
import '../providers/app_providers.dart';
import '../providers/local_reverb_settings_provider.dart';
import '../providers/product_grid_provider.dart';
import 'pos_realtime_config.dart';
import 'pos_stock_sync_handler.dart';

typedef PosRealtimeEventCallback = Future<void> Function(
  Map<String, dynamic> payload,
);

class PosRealtimeService {
  PosRealtimeService({
    required AppDatabase db,
    required void Function(PosRealtimeConnectionState state) onStateChanged,
    required void Function(DateTime at) onEventReceived,
  })  : _stockHandler = PosStockSyncHandler(db),
        _onStateChanged = onStateChanged,
        _onEventReceived = onEventReceived;

  final PosStockSyncHandler _stockHandler;
  final void Function(PosRealtimeConnectionState state) _onStateChanged;
  final void Function(DateTime at) _onEventReceived;

  PusherChannelsClient? _client;
  PrivateChannel? _channel;
  StreamSubscription<void>? _connectionSub;
  StreamSubscription<ChannelReadEvent>? _eventSub;
  Timer? _reconnectTimer;

  PosRealtimeConfig _config = PosRealtimeConfig.disabled();
  String? _token;
  int? _warehouseId;
  bool _disposed = false;

  PosRealtimeConnectionState _state = PosRealtimeConnectionState.disabled;

  PosRealtimeConnectionState get state => _state;

  Future<void> connect({
    required PosRealtimeConfig config,
    required String posToken,
    required int warehouseId,
  }) async {
    _config = config;
    _token = posToken;
    _warehouseId = warehouseId;

    if (!config.isValid) {
      _setState(PosRealtimeConnectionState.disabled);
      return;
    }

    await disconnect();
    _setState(PosRealtimeConnectionState.connecting);

    final wsScheme = config.useTls ? 'wss' : 'ws';
    final options = PusherChannelsOptions.fromHost(
      scheme: wsScheme,
      host: config.host!,
      port: config.port,
      key: config.key!,
    );

    _client = PusherChannelsClient.websocket(
      options: options,
      connectionErrorHandler: (exception, trace, refresh) {
        AppLogger.warning('PosRealtime', 'Connection error', exception);
        _setState(PosRealtimeConnectionState.polling);
        _scheduleReconnect();
        refresh();
      },
    );

    final channelName = _normalizePrivateChannel(config.channel!);
    _channel = _client!.privateChannel(
      channelName,
      authorizationDelegate:
          EndpointAuthorizableChannelTokenAuthorizationDelegate.forPrivateChannel(
        authorizationEndpoint: Uri.parse(config.authEndpoint!),
        headers: {
          ...PosApiHeaders.forAuthEndpoint(config.authEndpoint!),
          'Authorization': 'Bearer $posToken',
        },
      ),
    );

    _eventSub = _channel!.bind('pos.stock.updated').listen((event) async {
      try {
        await _stockHandler.applyEventData(event.data);
        _onEventReceived(DateTime.now());
      } catch (e, stack) {
        AppLogger.error('PosRealtime', 'Failed to apply stock event', e, stack);
      }
    });

    _connectionSub = _client!.onConnectionEstablished.listen((_) {
      _channel?.subscribeIfNotUnsubscribed();
      _setState(PosRealtimeConnectionState.live);
    });

    unawaited(_client!.connect());
  }

  String _normalizePrivateChannel(String channel) {
    if (channel.startsWith('private-')) {
      return channel.substring('private-'.length);
    }
    return channel;
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    if (_disposed || !_config.isValid || _token == null || _warehouseId == null) {
      return;
    }
    _reconnectTimer = Timer(const Duration(seconds: 30), () {
      unawaited(
        connect(
          config: _config,
          posToken: _token!,
          warehouseId: _warehouseId!,
        ),
      );
    });
  }

  void markPolling() => _setState(PosRealtimeConnectionState.polling);

  Future<void> disconnect() async {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    await _eventSub?.cancel();
    _eventSub = null;
    await _connectionSub?.cancel();
    _connectionSub = null;
    _channel?.unsubscribe();
    _channel = null;
    _client?.dispose();
    _client = null;
    if (!_disposed && _config.enabled) {
      _setState(PosRealtimeConnectionState.disconnected);
    }
  }

  Future<void> dispose() async {
    _disposed = true;
    await disconnect();
    _setState(PosRealtimeConnectionState.disabled);
  }

  void _setState(PosRealtimeConnectionState next) {
    if (_state == next) return;
    _state = next;
    _onStateChanged(next);
  }
}

final posRealtimeConfigProvider =
    StateProvider<PosRealtimeConfig>((ref) => PosRealtimeConfig.disabled());

final posRealtimeConnectionStateProvider =
    StateProvider<PosRealtimeConnectionState>(
  (ref) => PosRealtimeConnectionState.disabled,
);

final posRealtimeLastEventProvider = StateProvider<DateTime?>((ref) => null);

final posRealtimeServiceProvider = Provider<PosRealtimeService>((ref) {
  final db = ref.watch(appDatabaseProvider);
  final service = PosRealtimeService(
    db: db,
    onStateChanged: (state) {
      ref.read(posRealtimeConnectionStateProvider.notifier).state = state;
    },
    onEventReceived: (at) {
      ref.read(posRealtimeLastEventProvider.notifier).state = at;
      ref.read(productGridProvider.notifier).reload();
    },
  );
  ref.onDispose(() {
    unawaited(service.dispose());
  });
  return service;
});

Future<void> connectPosRealtimeIfConfigured(WidgetRef ref) async {
  final local = ref.read(localReverbSettingsProvider);
  if (!local.enableLiveStockSync) {
    await ref.read(posRealtimeServiceProvider).disconnect();
    ref.read(posRealtimeConnectionStateProvider.notifier).state =
        PosRealtimeConnectionState.disabled;
    return;
  }

  final session = ref.read(sessionServiceProvider);
  if (!session.isLoggedIn ||
      session.posToken == null ||
      session.posToken!.isEmpty) {
    return;
  }

  final warehouseId = session.warehouseId;
  if (warehouseId == null) return;

  try {
    final bootstrap = await ref.read(apiClientProvider).bootstrap();
    final realtimeRaw = bootstrap['realtime'];
    var config = PosRealtimeConfig.fromBootstrap(
      realtimeRaw is Map
          ? Map<String, dynamic>.from(realtimeRaw)
          : null,
    );
    config = local.resolveConfig(
      bootstrap: config,
      warehouseId: warehouseId,
      posBaseUrl: session.posBaseUrl,
    );
    ref.read(posRealtimeConfigProvider.notifier).state = config;
    if (!config.isValid) return;

    await ref.read(posRealtimeServiceProvider).connect(
          config: config,
          posToken: session.posToken!,
          warehouseId: warehouseId,
        );
  } catch (e, stack) {
    AppLogger.error('PosRealtime', 'Connect failed', e, stack);
    ref.read(posRealtimeServiceProvider).markPolling();
  }
}

Future<void> disconnectPosRealtime(WidgetRef ref) async {
  await ref.read(posRealtimeServiceProvider).disconnect();
  ref.read(posRealtimeConnectionStateProvider.notifier).state =
      PosRealtimeConnectionState.disconnected;
}

Future<void> refreshPosRealtimeConfigFromServer(WidgetRef ref) async {
  try {
    final bootstrap = await ref.read(apiClientProvider).bootstrap();
    final realtimeRaw = bootstrap['realtime'];
    var config = PosRealtimeConfig.fromBootstrap(
      realtimeRaw is Map
          ? Map<String, dynamic>.from(realtimeRaw)
          : null,
    );
    final local = ref.read(localReverbSettingsProvider);
    final session = ref.read(sessionServiceProvider);
    config = local.resolveConfig(
      bootstrap: config,
      warehouseId: session.warehouseId,
      posBaseUrl: session.posBaseUrl,
    );
    ref.read(posRealtimeConfigProvider.notifier).state = config;
  } catch (e, stack) {
    AppLogger.error('PosRealtime', 'Refresh config failed', e, stack);
  }
}

String reverbStatusTooltip({
  required PosRealtimeConnectionState state,
  required PosRealtimeConfig config,
  required bool localEnabled,
}) {
  if (!localEnabled) return 'Live stock sync off (local setting)';
  if (!config.enabled) return 'Reverb not enabled on server';
  switch (state) {
    case PosRealtimeConnectionState.live:
      return 'Reverb connected — live stock sync';
    case PosRealtimeConnectionState.connecting:
      return 'Reverb connecting…';
    case PosRealtimeConnectionState.polling:
      return 'Reverb down — polling stock every 15 min';
    case PosRealtimeConnectionState.disconnected:
      return 'Reverb disconnected';
    case PosRealtimeConnectionState.disabled:
      return 'Reverb not configured';
  }
}

Color? reverbStatusDotColor({
  required PosRealtimeConnectionState state,
  required PosRealtimeConfig config,
  required bool localEnabled,
}) {
  if (!localEnabled || !config.enabled) {
    return const Color(0xFF9CA3AF);
  }
  switch (state) {
    case PosRealtimeConnectionState.live:
      return const Color(0xFF34D399);
    case PosRealtimeConnectionState.connecting:
    case PosRealtimeConnectionState.polling:
      return const Color(0xFFFBBF24);
    case PosRealtimeConnectionState.disconnected:
      return const Color(0xFFF87171);
    case PosRealtimeConnectionState.disabled:
      return const Color(0xFF9CA3AF);
  }
}
