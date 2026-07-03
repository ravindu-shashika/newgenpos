import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../logging/app_logger.dart';
import '../providers/app_providers.dart';
import '../providers/pos_ui_settings_provider.dart';

/// Periodically uploads pending bills when [PosUiSettings.autoSyncUploadMinutes] > 0.
class SyncUploadScheduler {
  SyncUploadScheduler(this._ref);

  final Ref _ref;
  Timer? _timer;
  bool _running = false;
  bool? _lastOnline;

  void start() {
    _restartTimer();
    _ref.listen<int>(
      posUiSettingsProvider.select((s) => s.autoSyncUploadMinutes),
      (_, __) => _restartTimer(),
    );
    _ref.listen<AsyncValue<bool>>(
      isOnlineProvider,
      (previous, next) {
        final online = next.valueOrNull ?? false;
        if (online && _lastOnline != true) {
          unawaited(_tick());
        }
        _lastOnline = online;
      },
    );
  }

  void dispose() {
    _timer?.cancel();
    _timer = null;
  }

  void _restartTimer() {
    _timer?.cancel();
    _timer = null;

    final minutes = _ref.read(posUiSettingsProvider).autoSyncUploadMinutes;
    if (minutes <= 0) return;

    _timer = Timer.periodic(Duration(minutes: minutes), (_) {
      unawaited(_tick());
    });

    Future<void>.delayed(const Duration(seconds: 20), () {
      unawaited(_tick());
    });
  }

  Future<void> _tick() async {
    if (_running) return;

    final minutes = _ref.read(posUiSettingsProvider).autoSyncUploadMinutes;
    if (minutes <= 0) return;

    final session = _ref.read(sessionServiceProvider);
    if (!session.isLoggedIn) return;

    final pending = await _ref.read(appDatabaseProvider).countPendingSales();
    if (pending == 0) {
      final queued = await _ref
          .read(localSaleRepositoryProvider)
          .loadUnsyncedClientUuids();
      if (queued.isEmpty) return;
    }

    _running = true;
    try {
      await _ref.read(syncServiceProvider).syncPending(
            background: true,
            retryFailed: true,
          );
      _ref.read(syncRevisionProvider.notifier).state++;
    } catch (e, stack) {
      AppLogger.error('SyncUploadScheduler', 'Auto upload failed', e, stack);
    } finally {
      _running = false;
    }
  }
}

final syncUploadSchedulerProvider = Provider<SyncUploadScheduler>((ref) {
  final scheduler = SyncUploadScheduler(ref);
  scheduler.start();
  ref.onDispose(scheduler.dispose);
  return scheduler;
});
