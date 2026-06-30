import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import 'tables.dart';

part 'app_database.g.dart';

@DriftDatabase(tables: [
  DeviceSession,
  SyncMeta,
  Warehouses,
  LocalUsers,
  Categories,
  Brands,
  Taxes,
  Units,
  Customers,
  LocalCoupons,
  Billers,
  Products,
  ProductVariants,
  ProductStock,
  LocalSales,
  LocalSaleLines,
  LocalReturns,
  LocalExchanges,
  LocalCashRegisters,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  AppDatabase.forTesting(super.executor);

  @override
  int get schemaVersion => 11;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) async {
          await m.createAll();
          await _createProductLookupIndexes(m);
        },
        onUpgrade: (m, from, to) async {
          if (from < 2) {
            await m.createTable(warehouses);
            await m.createTable(localUsers);
            await m.addColumn(syncMeta, syncMeta.lastFullDownloadAt);
          }
          if (from < 3) {
            await m.createTable(deviceSession);
          }
          if (from < 4) {
            await m.createTable(localCoupons);
            await m.addColumn(products, products.wholesalePrice);
          }
          if (from < 5) {
            await m.database.customStatement(
              'ALTER TABLE device_session DROP COLUMN api_base_url',
            );
            await m.database.customStatement(
              'ALTER TABLE sync_meta DROP COLUMN api_base_url',
            );
          }
          if (from < 6) {
            await m.addColumn(syncMeta, syncMeta.posSettingsJson);
          }
          if (from < 7) {
            await m.createTable(localReturns);
          }
          if (from < 8) {
            await m.createTable(localExchanges);
          }
          if (from < 9) {
            await m.addColumn(localUsers, localUsers.accessPinHash);
          }
          if (from < 10) {
            await _createProductLookupIndexes(m);
          }
          if (from < 11) {
            await m.createTable(localCashRegisters);
            await m.addColumn(
              localSales,
              localSales.localCashRegisterId,
            );
          }
        },
      );

  static Future<void> _createProductLookupIndexes(Migrator m) async {
    await m.database.customStatement(
      'CREATE INDEX IF NOT EXISTS idx_products_code ON products(code)',
    );
    await m.database.customStatement(
      'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)',
    );
    await m.database.customStatement(
      'CREATE INDEX IF NOT EXISTS idx_product_variants_item_code '
      'ON product_variants(item_code)',
    );
    await m.database.customStatement(
      'CREATE INDEX IF NOT EXISTS idx_product_variants_product_id '
      'ON product_variants(product_id)',
    );
    await m.database.customStatement(
      'CREATE INDEX IF NOT EXISTS idx_product_stock_wh_lookup '
      'ON product_stock(warehouse_id, product_id, variant_id)',
    );
  }

  Future<DeviceSessionData?> getDeviceSession() {
    return (select(deviceSession)..where((t) => t.id.equals(1)))
        .getSingleOrNull();
  }

  Future<void> upsertDeviceSession(DeviceSessionCompanion row) {
    return into(deviceSession).insertOnConflictUpdate(row);
  }

  Future<void> ensureDeviceSessionRow() async {
    final existing = await getDeviceSession();
    if (existing != null) return;
    await upsertDeviceSession(
      DeviceSessionCompanion.insert(id: const Value(1)),
    );
  }

  Future<void> upsertSyncMeta(SyncMetaCompanion row) {
    return into(syncMeta).insertOnConflictUpdate(row);
  }

  /// Update cached POS settings without requiring deviceId/warehouseId on insert.
  Future<int> updateSyncMetaPosSettings({
    required String posSettingsJson,
    int? defaultCustomerId,
    int? defaultBillerId,
  }) {
    return (update(syncMeta)..where((t) => t.id.equals(1))).write(
      SyncMetaCompanion(
        posSettingsJson: Value(posSettingsJson),
        defaultCustomerId: Value(defaultCustomerId),
        defaultBillerId: Value(defaultBillerId),
      ),
    );
  }

  Future<SyncMetaData?> getSyncMeta() {
    return (select(syncMeta)..where((t) => t.id.equals(1))).getSingleOrNull();
  }

  Future<int> countPendingReturns() async {
    final rows = await (select(localReturns)
          ..where((r) => r.syncStatus.isIn(['pending', 'failed', 'queued'])))
        .get();
    return rows.length;
  }

  Future<int> countPendingSales() async {
    final rows = await (select(localSales)
          ..where((s) =>
              s.syncStatus.isIn(['pending', 'failed', 'queued']) &
              s.saleStatus.equals(1)))
        .get();
    return rows.length;
  }

  /// Clears catalog + local transaction queue before a full re-download.
  /// Device session (login/tokens) is kept so the user stays signed in.
  Future<void> clearAllLocalDataForFullDownload() async {
    await transaction(() async {
      await delete(localSaleLines).go();
      await delete(localSales).go();
      await delete(localReturns).go();
      await delete(localExchanges).go();
      await delete(localUsers).go();
      await delete(productStock).go();
      await delete(productVariants).go();
      await delete(products).go();
      await delete(billers).go();
      await delete(customers).go();
      await delete(units).go();
      await delete(taxes).go();
      await delete(brands).go();
      await delete(categories).go();
      await delete(warehouses).go();
      await delete(localCoupons).go();
    });
  }

  /// @deprecated Use [clearAllLocalDataForFullDownload].
  Future<void> clearCatalogTables() => clearAllLocalDataForFullDownload();
}

const kLocalDatabaseFileName = 'newgenpos.sqlite';

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dir = await getApplicationDocumentsDirectory();
    final file = File(p.join(dir.path, kLocalDatabaseFileName));
    final legacy = File(p.join(dir.path, 'pos.sqlite'));
    if (!file.existsSync() && legacy.existsSync()) {
      await legacy.rename(file.path);
    }
    return NativeDatabase.createInBackground(
      file,
      setup: (rawDb) {
        rawDb.execute('PRAGMA journal_mode = WAL;');
        rawDb.execute('PRAGMA busy_timeout = 10000;');
      },
    );
  });
}
