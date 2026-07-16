import 'dart:async';

// REVERB_DISABLED: remove ignore_for_file below when Reverb connect block is uncommented.
// ignore_for_file: unused_import, unused_field, unused_element

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
    required void Function(String message) onConnectionFailed,
  })  : _stockHandler = PosStockSyncHandler(db),
        _onStateChanged = onStateChanged,
        _onEventReceived = onEventReceived,
        _onConnectionFailed = onConnectionFailed;

  final PosStockSyncHandler _stockHandler;
  final void Function(PosRealtimeConnectionState state) _onStateChanged;
  final void Function(DateTime at) _onEventReceived;
  final void Function(String message) _onConnectionFailed;

  PusherChannelsClient? _client;
  PrivateChannel? _channel;
  StreamSubscription<void>? _connectionSub;
  StreamSubscription<ChannelReadEvent>? _eventSub;

  PosRealtimeConfig _config = PosRealtimeConfig.disabled();
  String? _token;
  int? _warehouseId;
  bool _disposed = false;
  bool _handlingFailure = false;
  bool _suppressFailureAlerts = false;

  PosRealtimeConnectionState _state = PosRealtimeConnectionState.disabled;

  PosRealtimeConnectionState get state => _state;

  Future<void> connect({
    required PosRealtimeConfig config,
    required String posToken,
    required int warehouseId,
  }) async {
    // REVERB_DISABLED: uncomment block below when Reverb is enabled.
    _setState(PosRealtimeConnectionState.disabled);
    return;

    /*
    _config = config;
    _token = posToken;
    _warehouseId = warehouseId;
    _handlingFailure = false;
    _suppressFailureAlerts = false;

    if (!config.isValid) {
      _setState(PosRealtimeConnectionState.disabled);
      return;
    }

    await _tearDownClient(notifyDisconnected: false);
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
        // Do not call refresh() — that auto-retries forever.
        unawaited(_handleConnectionFailure(exception));
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
      _handlingFailure = false;
      _channel?.subscribeIfNotUnsubscribed();
      _setState(PosRealtimeConnectionState.live);
    });

    unawaited(_client!.connect());
    */
  }

  String _normalizePrivateChannel(String channel) {
    if (channel.startsWith('private-')) {
      return channel.substring('private-'.length);
    }
    return channel;
  }

  Future<void> _handleConnectionFailure(Object exception) async {
    // Intentional disconnect / disabled — never surface failure alerts.
    if (_handlingFailure || _disposed || _suppressFailureAlerts) return;
    _handlingFailure = true;

    final endpoint = _config.wsUrl;
    AppLogger.warning(
      'PosRealtime',
      'Connection failed — auto-retry stopped ($endpoint)',
      exception,
    );

    await _tearDownClient(notifyDisconnected: false);
    _setState(PosRealtimeConnectionState.disconnected);
    _onConnectionFailed(_userFacingFailureMessage(exception, endpoint));
  }

  String _userFacingFailureMessage(Object exception, String endpoint) {
    final detail = AppLogger.userMessage(exception);
    final refused = detail.toLowerCase().contains('refused') ||
        detail.toLowerCase().contains('connection');
    final reason = refused
        ? 'The Reverb server is not reachable at $endpoint.'
        : 'Could not connect to Reverb at $endpoint.';
    return '$reason Auto-retry is off. Use Connect in Reverb status or Settings when the server is ready.';
  }

  void markPolling() => _setState(PosRealtimeConnectionState.polling);

  void markDisconnected() => _setState(PosRealtimeConnectionState.disconnected);

  Future<void> _tearDownClient({required bool notifyDisconnected}) async {
    await _eventSub?.cancel();
    _eventSub = null;
    await _connectionSub?.cancel();
    _connectionSub = null;
    _channel?.unsubscribe();
    _channel = null;
    try {
      _client?.dispose();
    } catch (_) {}
    _client = null;
    if (notifyDisconnected && !_disposed && _config.enabled) {
      _setState(PosRealtimeConnectionState.disconnected);
    }
  }

  Future<void> disconnect() async {
    _suppressFailureAlerts = true;
    _handlingFailure = true;
    await _tearDownClient(notifyDisconnected: true);
    _handlingFailure = false;
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

/// One-shot failure message for UI alert (cleared after shown).
final posRealtimeFailureProvider = StateProvider<String?>((ref) => null);

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
      // Inventory / dashboard pages watch this and reload from local DB.
      ref.read(syncRevisionProvider.notifier).state++;
    },
    onConnectionFailed: (message) {
      // Never alert when live stock sync is turned off on this terminal.
      if (!ref.read(localReverbSettingsProvider).enableLiveStockSync) return;
      ref.read(posRealtimeFailureProvider.notifier).state = message;
    },
  );
  ref.onDispose(() {
    unawaited(service.dispose());
  });
  return service;
});

Future<void> connectPosRealtimeIfConfigured(WidgetRef ref) async {
  // REVERB_DISABLED: uncomment block below when Reverb is enabled.
  ref.read(posRealtimeConnectionStateProvider.notifier).state =
      PosRealtimeConnectionState.disabled;
  ref.read(posRealtimeFailureProvider.notifier).state = null;
  return;

  /*
  await ref.read(localReverbSettingsProvider.notifier).ensureLoaded();
  final local = ref.read(localReverbSettingsProvider);
  if (!local.enableLiveStockSync) {
    await ref.read(posRealtimeServiceProvider).disconnect();
    ref.read(posRealtimeConnectionStateProvider.notifier).state =
        PosRealtimeConnectionState.disabled;
    ref.read(posRealtimeFailureProvider.notifier).state = null;
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

  ref.read(posRealtimeFailureProvider.notifier).state = null;

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
    ref.read(posRealtimeServiceProvider).markDisconnected();
    ref.read(posRealtimeFailureProvider.notifier).state =
        'Live stock sync could not start. Auto-retry is off. Use Connect in Reverb status or Settings when ready.';
  }
  */
}

Future<void> disconnectPosRealtime(WidgetRef ref) async {
  await ref.read(posRealtimeServiceProvider).disconnect();
  ref.read(posRealtimeConnectionStateProvider.notifier).state =
      PosRealtimeConnectionState.disconnected;
  ref.read(posRealtimeFailureProvider.notifier).state = null;
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
      return 'Reverb disconnected — connect manually when ready';
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
