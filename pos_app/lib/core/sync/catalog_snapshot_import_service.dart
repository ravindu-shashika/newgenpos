import 'dart:io';

import 'package:drift/drift.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import '../database/app_database.dart';
import '../logging/app_logger.dart';
import '../pos_http/pos_api_client.dart';
import '../repositories/local_auth_repository.dart';
import '../repositories/pos_settings_repository.dart';

typedef SnapshotProgressCallback = void Function({
  required String phase,
  required double percent,
  String? detail,
});

/// Bulk catalog import via server-built SQLite snapshot (ATTACH + INSERT).
class CatalogSnapshotImportService {
  CatalogSnapshotImportService(
    this._db,
    this._api,
    this._localAuth,
    this._posSettings,
  );

  final AppDatabase _db;
  final PosApiClient _api;
  final LocalAuthRepository _localAuth;
  final PosSettingsRepository _posSettings;

  bool _cancelled = false;

  void cancel() => _cancelled = true;

  Future<int> importFullSnapshot({
    required String deviceId,
    required int warehouseId,
    SnapshotProgressCallback? onProgress,
  }) async {
    _cancelled = false;
    onProgress?.call(phase: 'request', percent: 0, detail: 'Requesting snapshot');

    final meta = await _api.requestCatalogSnapshot(warehouseId: warehouseId);
    final snapshotId = meta['id']?.toString();
    if (snapshotId == null || snapshotId.isEmpty) {
      throw Exception('Server did not return snapshot id');
    }

    while (!_cancelled) {
      final status = await _api.catalogSnapshotStatus(snapshotId);
      final state = status['status']?.toString() ?? '';
      final progress = (status['progress'] as num?)?.toDouble() ?? 0;
      onProgress?.call(
        phase: state,
        percent: progress / 100,
        detail: status['message']?.toString(),
      );

      if (state == 'ready') break;
      if (state == 'failed') {
        throw Exception(status['message']?.toString() ?? 'Snapshot build failed');
      }
      await Future<void>.delayed(const Duration(seconds: 3));
    }

    if (_cancelled) throw Exception('Import cancelled');

    final tempDir = await getTemporaryDirectory();
    final gzPath = p.join(tempDir.path, 'pos_snapshot_$snapshotId.db.gz');
    final dbPath = p.join(tempDir.path, 'pos_snapshot_$snapshotId.db');

    onProgress?.call(phase: 'download', percent: 0.05, detail: 'Downloading file');

    await _api.downloadCatalogSnapshotFile(
      snapshotId: snapshotId,
      savePath: gzPath,
      onProgress: (received, total) {
        if (total != null && total > 0) {
          onProgress?.call(
            phase: 'download',
            percent: 0.05 + (received / total) * 0.35,
            detail: 'Downloading ${(received / total * 100).toStringAsFixed(0)}%',
          );
        }
      },
    );

    if (_cancelled) throw Exception('Import cancelled');

    onProgress?.call(phase: 'decompress', percent: 0.42, detail: 'Decompressing');

    final gzBytes = await File(gzPath).readAsBytes();
    final dbBytes = gzip.decode(gzBytes);
    await File(dbPath).writeAsBytes(dbBytes, flush: true);

    await _db.clearAllLocalDataForFullDownload();

    onProgress?.call(phase: 'import', percent: 0.5, detail: 'Importing catalog');

    final tables = [
      'warehouses',
      'categories',
      'brands',
      'taxes',
      'units',
      'customers',
      'billers',
      'local_coupons',
      'products',
      'product_variants',
      'product_batches',
      'product_stock',
    ];

    final escaped = dbPath.replaceAll("'", "''");
    for (var i = 0; i < tables.length; i++) {
      if (_cancelled) throw Exception('Import cancelled');
      final table = tables[i];
      await _db.customStatement(
        "ATTACH DATABASE '$escaped' AS snap",
      );
      try {
        await _db.customStatement(
          'INSERT OR REPLACE INTO main.$table SELECT * FROM snap.$table',
        );
      } finally {
        await _db.customStatement('DETACH DATABASE snap');
      }
      onProgress?.call(
        phase: 'import',
        percent: 0.5 + ((i + 1) / tables.length) * 0.4,
        detail: 'Imported $table',
      );
    }

    // Users need password hash column mapping from snapshot local_users.
    await _db.customStatement("ATTACH DATABASE '$escaped' AS snap");
    try {
      final userRows = await _db.customSelect(
        'SELECT id, name, username, email, password_hash, access_pin_hash, '
        'warehouse_id, role_id, biller_id, updated_at FROM snap.local_users',
        readsFrom: const {},
      ).get();
      if (userRows.isNotEmpty) {
        await _localAuth.upsertUsers(
          userRows
              .map(
                (r) => {
                  'id': r.read<int>('id'),
                  'name': r.read<String>('name'),
                  'username': r.readNullable<String>('username'),
                  'email': r.readNullable<String>('email'),
                  'password': r.read<String>('password_hash'),
                  'access_pin': r.readNullable<String>('access_pin_hash'),
                  'warehouse_id': r.readNullable<int>('warehouse_id'),
                  'role_id': r.readNullable<int>('role_id'),
                  'biller_id': r.readNullable<int>('biller_id'),
                  'updated_at': r.readNullable<String>('updated_at'),
                },
              )
              .toList(),
        );
      }
    } finally {
      await _db.customStatement('DETACH DATABASE snap');
    }

    onProgress?.call(phase: 'index', percent: 0.92, detail: 'Rebuilding search index');
    await _db.rebuildProductSearchIndex();

    final syncAt = DateTime.now().toIso8601String();
    var settings = await _posSettings.load();
    try {
      final device = await _posSettings.refreshFromBootstrap(_api);
      settings = device.pos;
    } catch (e, stack) {
      AppLogger.error('SnapshotImport', 'Bootstrap refresh failed', e, stack);
    }

    await _db.upsertSyncMeta(SyncMetaCompanion.insert(
      id: const Value(1),
      deviceId: deviceId,
      warehouseId: warehouseId,
      lastCatalogSyncAt: Value(syncAt),
      lastFullDownloadAt: Value(syncAt),
      defaultCustomerId: Value(settings?.customerId),
      defaultBillerId: Value(settings?.billerId),
    ));

    try {
      await File(gzPath).delete();
      await File(dbPath).delete();
    } catch (_) {}

    onProgress?.call(phase: 'complete', percent: 1, detail: 'Done');
    return warehouseId;
  }
}
