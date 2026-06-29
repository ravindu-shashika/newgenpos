import 'dart:async';

import 'package:dio/dio.dart';

import '../pos_http/pos_api_client.dart';
import '../config/app_config.dart';
import '../logging/app_logger.dart';
import '../repositories/local_sale_repository.dart';

typedef PendingSaleLoader = Future<List<Map<String, dynamic>>> Function({
  bool includeFailed,
});
typedef UnsyncedUuidLoader = Future<List<String>> Function();
typedef SaleSyncMarker = Future<void> Function(
  String clientUuid, {
  required String status,
  int? serverSaleId,
  String? referenceNo,
  String? error,
});
typedef BatchSaleSyncMarker = Future<void> Function(
  List<LocalSyncStatusUpdate> updates,
);

/// Result of a pending-sales sync attempt.
class SyncPendingResult {
  const SyncPendingResult({
    required this.wasOnline,
    this.attempted = 0,
    this.synced = 0,
    this.failed = 0,
    this.queued = 0,
    this.errorMessage,
    this.failedMessages = const [],
  });

  final bool wasOnline;
  final int attempted;
  final int synced;
  final int failed;
  final int queued;
  final String? errorMessage;
  final List<String> failedMessages;

  bool get hasPending => attempted > synced + failed;
}

/// Pushes offline sales to the server queue and polls until processed.
class SyncService {
  SyncService({
    required PosApiClient api,
    required this.deviceId,
    required this.loadPendingSales,
    required this.loadUnsyncedUuids,
    required this.markSaleSynced,
    required this.markManySaleSynced,
    this.loadPendingReturns,
    this.markReturnSynced,
    this.loadPendingExchanges,
    this.markExchangeSynced,
    this.terminalCode,
    this.userId,
    this.onSyncComplete,
  }) : _api = api;

  final PosApiClient _api;
  final String deviceId;
  final String? terminalCode;
  final int? userId;
  final PendingSaleLoader loadPendingSales;
  final UnsyncedUuidLoader loadUnsyncedUuids;
  final SaleSyncMarker markSaleSynced;
  final BatchSaleSyncMarker markManySaleSynced;
  final PendingSaleLoader? loadPendingReturns;
  final SaleSyncMarker? markReturnSynced;
  final PendingSaleLoader? loadPendingExchanges;
  final SaleSyncMarker? markExchangeSynced;
  final void Function()? onSyncComplete;

  Future<SyncPendingResult>? _activeSync;

  DateTime? _lastHealthAt;
  bool? _lastHealthOnline;

  bool get isSyncing => _activeSync != null;

  Future<bool> probeOnline({bool force = false}) async {
    final now = DateTime.now();
    if (!force &&
        _lastHealthAt != null &&
        _lastHealthOnline != null &&
        now.difference(_lastHealthAt!) < AppConfig.healthCheckInterval) {
      return _lastHealthOnline!;
    }

    try {
      final health = await _api.health();
      final online = health['online'];
      final result = online == true ||
          online == 1 ||
          online == '1' ||
          online == 'true';
      _lastHealthAt = now;
      _lastHealthOnline = result;
      return result;
    } catch (e, stack) {
      AppLogger.error('Sync', 'Health probe failed', e, stack);
      _lastHealthAt = now;
      _lastHealthOnline = false;
      return false;
    }
  }

  Future<SyncPendingResult> syncPending({
    bool retryFailed = true,
    bool background = false,
  }) {
    final active = _activeSync;
    if (active != null) return active;

    final run = _runSyncPending(
      retryFailed: retryFailed,
      background: background,
    );
    _activeSync = run;
    return run.whenComplete(() {
      if (identical(_activeSync, run)) {
        _activeSync = null;
      }
    });
  }

  Future<SyncPendingResult> _runSyncPending({
    required bool retryFailed,
    bool background = false,
  }) async {
    var attempted = 0;
    var synced = 0;
    var failed = 0;
    var queued = 0;
    var wasOnline = false;
    final failedMessages = <String>[];
    var sawQueued = false;

    try {
      wasOnline = await probeOnline(force: true);
      if (!wasOnline) {
        return const SyncPendingResult(
          wasOnline: false,
          errorMessage:
              'Cannot reach server — check API URL and php artisan serve',
        );
      }

      if (userId == null) {
        const msg =
            'Cashier not logged in — log out and sign in again to sync sales';
        AppLogger.warning('Sync', msg);
        return SyncPendingResult(
          wasOnline: true,
          errorMessage: msg,
        );
      }

      // Pick up sales already processed by the queue worker.
      synced += await _pollServerSyncStatus(maxAttempts: 1);

      if (!background) {
        await _syncPendingReturns(retryFailed: retryFailed);
        await _syncPendingExchanges(retryFailed: retryFailed);
      } else {
        unawaited(_syncPendingReturns(retryFailed: retryFailed));
        unawaited(_syncPendingExchanges(retryFailed: retryFailed));
      }

      final pending = await loadPendingSales(includeFailed: retryFailed);
      if (pending.isEmpty) {
        final stillQueued = await loadUnsyncedUuids();
        if (stillQueued.isNotEmpty && !background) {
          synced += await _pollServerSyncStatus(
            maxAttempts: AppConfig.queueStatusPollAttempts,
            delay: AppConfig.queueStatusPollDelay,
          );
        }
        return SyncPendingResult(
          wasOnline: true,
          synced: synced,
          queued: stillQueued.isNotEmpty ? stillQueued.length : 0,
          errorMessage: stillQueued.isNotEmpty
              ? 'Sales processing on server — ensure queue worker is running'
              : null,
        );
      }

      attempted = pending.length;

      for (var i = 0; i < pending.length; i += AppConfig.maxSyncBatch) {
        final batch = pending.skip(i).take(AppConfig.maxSyncBatch).toList();
        final results = await _api.syncSales(
          deviceId: deviceId,
          sales: batch,
          terminalCode: terminalCode,
          userId: userId,
        );

        if (results.isEmpty) {
          failed += batch.length;
          failedMessages.add(
            'Server returned no sync results for ${batch.length} sale(s)',
          );
          continue;
        }

        final batchUpdates = <LocalSyncStatusUpdate>[];
        for (final result in results) {
          final uuid = result['client_uuid'] as String? ?? '';
          final status = result['status'] as String? ?? 'failed';
          final message = result['message']?.toString();
          if (status == 'synced' || status == 'already_synced') {
            synced++;
            batchUpdates.add(LocalSyncStatusUpdate(
              clientUuid: uuid,
              status: status,
              serverSaleId: _parseInt(result['sale_id']),
              referenceNo: result['reference_no']?.toString(),
              error: message,
            ));
          } else if (status == 'failed') {
            failed++;
            if (message != null && message.isNotEmpty) {
              failedMessages.add(message);
            }
            batchUpdates.add(LocalSyncStatusUpdate(
              clientUuid: uuid,
              status: status,
              serverSaleId: _parseInt(result['sale_id']),
              referenceNo: result['reference_no']?.toString(),
              error: message,
            ));
          } else if (status == 'queued') {
            sawQueued = true;
            queued++;
            batchUpdates.add(LocalSyncStatusUpdate(
              clientUuid: uuid,
              status: 'queued',
            ));
          }
        }
        if (batchUpdates.isNotEmpty) {
          await _applyLocalSyncUpdates(batchUpdates);
        }
      }

      if (sawQueued && !background) {
        synced += await _pollServerSyncStatus(
          maxAttempts: AppConfig.queueStatusPollAttempts,
          delay: AppConfig.queueStatusPollDelay,
        );
      }

      final remaining = await loadUnsyncedUuids();
      if (remaining.isNotEmpty && sawQueued) {
        failedMessages.add(
          '${remaining.length} sale(s) still in server queue — run: php artisan queue:work --queue=pos-sales',
        );
      }

      return SyncPendingResult(
        wasOnline: true,
        attempted: attempted,
        synced: synced,
        failed: failed,
        queued: queued,
        failedMessages: failedMessages,
        errorMessage: failedMessages.isNotEmpty ? failedMessages.first : null,
      );
    } catch (e, stack) {
      final msg = _formatSyncError(e);
      AppLogger.error('Sync', 'Pending sales sync failed', e, stack);
      return SyncPendingResult(
        wasOnline: wasOnline,
        attempted: attempted,
        synced: synced,
        failed: failed > 0 ? failed : (attempted > 0 ? attempted : 0),
        queued: queued,
        errorMessage: msg,
        failedMessages: failedMessages,
      );
    } finally {
      await Future<void>.delayed(const Duration(milliseconds: 50));
      onSyncComplete?.call();
    }
  }

  Future<void> _syncPendingReturns({required bool retryFailed}) async {
    final loader = loadPendingReturns;
    final marker = markReturnSynced;
    if (loader == null || marker == null) return;

    final pending = await loader(includeFailed: retryFailed);
    if (pending.isEmpty) return;

    for (var i = 0; i < pending.length; i += AppConfig.maxSyncBatch) {
      final batch = pending.skip(i).take(AppConfig.maxSyncBatch).toList();
      try {
        final results = await _api.syncReturns(
          deviceId: deviceId,
          returns: batch,
          terminalCode: terminalCode,
          userId: userId,
        );
        for (final result in results) {
          final uuid = result['client_uuid'] as String? ?? '';
          final status = result['status'] as String? ?? 'failed';
          if (status == 'synced' || status == 'already_synced') {
            await marker(
              uuid,
              status: 'synced',
              serverSaleId: _parseInt(result['return_id']),
              referenceNo: result['reference_no']?.toString(),
            );
          } else {
            await marker(
              uuid,
              status: 'failed',
              error: result['message']?.toString(),
            );
          }
        }
      } catch (e, stack) {
        AppLogger.error('Sync', 'Return sync batch failed', e, stack);
      }
    }
  }

  Future<void> _syncPendingExchanges({required bool retryFailed}) async {
    final loader = loadPendingExchanges;
    final marker = markExchangeSynced;
    if (loader == null || marker == null) return;

    final pending = await loader(includeFailed: retryFailed);
    if (pending.isEmpty) return;

    for (var i = 0; i < pending.length; i += AppConfig.maxSyncBatch) {
      final batch = pending.skip(i).take(AppConfig.maxSyncBatch).toList();
      try {
        final results = await _api.syncExchanges(
          deviceId: deviceId,
          exchanges: batch,
          terminalCode: terminalCode,
          userId: userId,
        );
        for (final result in results) {
          final uuid = result['client_uuid'] as String? ?? '';
          final status = result['status'] as String? ?? 'failed';
          if (status == 'synced' || status == 'already_synced') {
            await marker(
              uuid,
              status: 'synced',
              serverSaleId: _parseInt(result['exchange_id']),
              referenceNo: result['reference_no']?.toString(),
            );
          } else {
            await marker(
              uuid,
              status: 'failed',
              error: result['message']?.toString(),
            );
          }
        }
      } catch (e, stack) {
        AppLogger.error('Sync', 'Exchange sync batch failed', e, stack);
      }
    }
  }

  Future<int> _pollServerSyncStatus({
    int maxAttempts = 1,
    Duration delay = Duration.zero,
  }) async {
    var totalSynced = 0;

    for (var attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0 && delay > Duration.zero) {
        await Future<void>.delayed(delay);
      }

      final uuids = await loadUnsyncedUuids();
      if (uuids.isEmpty) break;

      try {
        final items = await _api.syncSaleStatus(
          clientUuids: uuids,
          userId: userId,
        );
        final updates = <LocalSyncStatusUpdate>[];
        for (final item in items) {
          try {
            final uuid = item['client_uuid']?.toString() ?? '';
            if (uuid.isEmpty) continue;

            final serverStatus = item['sync_status']?.toString() ?? '';
            if (serverStatus == 'synced') {
              totalSynced++;
              updates.add(LocalSyncStatusUpdate(
                clientUuid: uuid,
                status: 'synced',
                serverSaleId: _parseInt(item['sale_id']),
                referenceNo: item['reference_no']?.toString(),
                error: null,
              ));
            } else if (serverStatus == 'failed') {
              updates.add(LocalSyncStatusUpdate(
                clientUuid: uuid,
                status: 'failed',
                error: item['error_message']?.toString(),
              ));
            }
          } catch (e, stack) {
            AppLogger.error('Sync', 'Bad sync-status row', e, stack);
          }
        }
        if (updates.isNotEmpty) {
          await _applyLocalSyncUpdates(updates);
        }
      } catch (e, stack) {
        AppLogger.error('Sync', 'Sync status poll failed', e, stack);
        break;
      }
    }

    return totalSynced;
  }

  Future<void> _applyLocalSyncUpdates(List<LocalSyncStatusUpdate> updates) async {
    try {
      await markManySaleSynced(updates);
    } catch (e, stack) {
      AppLogger.warning(
        'Sync',
        'Server sync ok but local status save failed; will retry on next sale',
        e,
      );
      AppLogger.error('Sync', 'Local sync status write failed', e, stack);
    }
  }

  static int? _parseInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString());
  }

  static String _formatSyncError(Object e) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map) {
        final message = data['message'] ?? data['error'];
        if (message != null && message.toString().isNotEmpty) {
          return message.toString();
        }
      }
      return e.message ??
          'Network error (${e.response?.statusCode ?? 'no response'})';
    }
    return e.toString();
  }
}
