import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../logging/app_logger.dart';
import '../providers/app_providers.dart';
import '../providers/product_grid_provider.dart';
import '../providers/local_reverb_settings_provider.dart';
import '../realtime/pos_realtime_config.dart';
import '../realtime/pos_realtime_service.dart';

/// Pulls product_stock delta when realtime socket is down.
class PosStockFallbackScheduler {
  PosStockFallbackScheduler(this._ref);

  final Ref _ref;
  Timer? _timer;
  bool _running = false;

  void start() {
    _restartTimer();
    _ref.listen<PosRealtimeConnectionState>(
      posRealtimeConnectionStateProvider,
      (_, __) => _restartTimer(),
    );
  }

  void dispose() {
    _timer?.cancel();
    _timer = null;
  }

  void _restartTimer() {
    _timer?.cancel();
    _timer = null;

    final state = _ref.read(posRealtimeConnectionStateProvider);
    final config = _ref.read(posRealtimeConfigProvider);
    final local = _ref.read(localReverbSettingsProvider);
    if (!local.enableLiveStockSync || !config.enabled) return;
    if (state == PosRealtimeConnectionState.live) return;

    _timer = Timer.periodic(const Duration(minutes: 15), (_) {
      unawaited(_tick());
    });

    Future<void>.delayed(const Duration(seconds: 40), () {
      unawaited(_tick());
    });
  }

  Future<void> _tick() async {
    if (_running) return;

    final state = _ref.read(posRealtimeConnectionStateProvider);
    if (state == PosRealtimeConnectionState.live) return;

    final local = _ref.read(localReverbSettingsProvider);
    if (!local.enableLiveStockSync) return;

    final session = _ref.read(sessionServiceProvider);
    if (!session.isLoggedIn) return;

    final warehouseId = session.warehouseId;
    final deviceId = session.deviceId;
    if (warehouseId == null || deviceId.isEmpty) return;

    _running = true;
    try {
      await _ref.read(catalogDownloadServiceProvider).refreshResourceDelta(
            resource: 'product_stock',
            deviceId: deviceId,
            warehouseId: warehouseId,
          );
      await _ref.read(catalogDownloadServiceProvider).refreshResourceDelta(
            resource: 'product_batches',
            deviceId: deviceId,
            warehouseId: warehouseId,
          );
      _ref.read(productGridProvider.notifier).reload();
    } catch (e, stack) {
      AppLogger.error('PosStockFallback', 'Delta pull failed', e, stack);
    } finally {
      _running = false;
    }
  }
}

final posStockFallbackSchedulerProvider =
    Provider<PosStockFallbackScheduler>((ref) {
  final scheduler = PosStockFallbackScheduler(ref);
  scheduler.start();
  ref.onDispose(scheduler.dispose);
  return scheduler;
});
