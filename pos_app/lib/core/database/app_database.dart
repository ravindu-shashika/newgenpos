import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import 'product_catalog_sql.dart';
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
  ProductBatches,
  ProductStock,
  LocalSales,
  LocalSaleLines,
  LocalReturns,
  LocalExchanges,
  LocalCashRegisters,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase({String? databaseFilePath})
      : _databaseFilePath = databaseFilePath,
        super(_openConnection(databaseFilePath));

  AppDatabase.forTesting(super.executor) : _databaseFilePath = null;

  final String? _databaseFilePath;

  String? get databaseFilePath => _databaseFilePath;

  @override
  int get schemaVersion => 14;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) async {
          await m.createAll();
          await _createProductLookupIndexes(m);
          await _createProductCatalogScaleIndexes(m);
          await _createProductFts(m);
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
          if (from < 12) {
            await m.createTable(productBatches);
            await m.addColumn(products, products.altCode);
            await m.addColumn(products, products.maxPrice);
            await m.database.customStatement(
              'CREATE INDEX IF NOT EXISTS idx_products_alt_code ON products(alt_code)',
            );
            await m.database.customStatement(
              'CREATE INDEX IF NOT EXISTS idx_product_batches_product_id '
              'ON product_batches(product_id)',
            );
          }
          if (from < 13) {
            await _createProductCatalogScaleIndexes(m);
            await _createProductFts(m);
            await m.database.customStatement('DELETE FROM products_fts');
            await m.database.customStatement(ProductCatalogSql.rebuildFtsSql);
          }
          if (from < 14) {
            await m.addColumn(localSales, localSales.uploadAttempts);
            await m.addColumn(localSales, localSales.nextRetryAt);
            await m.addColumn(localSales, localSales.lastUploadAt);
            await m.addColumn(syncMeta, syncMeta.downloadCheckpointJson);
          }
        },
      );

  static Future<void> _createProductCatalogScaleIndexes(Migrator m) async {
    await m.database.customStatement(
      'CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured)',
    );
    await m.database.customStatement(
      'CREATE INDEX IF NOT EXISTS idx_products_category_id '
      'ON products(category_id)',
    );
    await m.database.customStatement(
      'CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id)',
    );
    await m.database.customStatement(
      'CREATE INDEX IF NOT EXISTS idx_product_stock_wh_instock '
      'ON product_stock(warehouse_id, product_id, variant_id) '
      'WHERE qty > 0',
    );
  }

  static Future<void> _createProductFts(Migrator m) async {
    await m.database.customStatement('''
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
  product_id UNINDEXED,
  name,
  code,
  alt_code,
  tokenize='unicode61 remove_diacritics 2'
)
''');
  }

  /// Rebuild full-text index after catalog sync (safe for 1M+ rows).
  Future<void> rebuildProductSearchIndex() async {
    await transaction(() async {
      await customStatement('DELETE FROM products_fts');
      await customStatement(ProductCatalogSql.rebuildFtsSql);
    });
    await customStatement('ANALYZE products');
    await customStatement('ANALYZE product_stock');
  }

  Future<void> upsertProductSearchIndexRow({
    required int productId,
    required String name,
    required String code,
    String? altCode,
  }) {
    return customStatement(
      ProductCatalogSql.upsertFtsRowSql,
      [
        productId,
        productId,
        name,
        code,
        altCode ?? '',
      ],
    );
  }

  Future<List<int>> searchProductIdsFts({
    required String matchExpression,
    int limit = 25,
  }) async {
    final rows = await customSelect(
      ProductCatalogSql.ftsSearchSql,
      variables: [
        Variable<String>(matchExpression),
        Variable<int>(limit),
      ],
      readsFrom: const {},
    ).get();
    return rows
        .map((r) => r.read<int>('product_id'))
        .whereType<int>()
        .toList();
  }

  static Future<void> _createProductLookupIndexes(Migrator m) async {
    await m.database.customStatement(
      'CREATE INDEX IF NOT EXISTS idx_products_code ON products(code)',
    );
    await m.database.customStatement(
      'CREATE INDEX IF NOT EXISTS idx_products_alt_code ON products(alt_code)',
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
    await m.database.customStatement(
      'CREATE INDEX IF NOT EXISTS idx_product_batches_product_id '
      'ON product_batches(product_id)',
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
  /// Only overwrites default customer/biller when a positive id is provided.
  Future<int> updateSyncMetaPosSettings({
    required String posSettingsJson,
    int? defaultCustomerId,
    int? defaultBillerId,
  }) {
    return (update(syncMeta)..where((t) => t.id.equals(1))).write(
      SyncMetaCompanion(
        posSettingsJson: Value(posSettingsJson),
        defaultCustomerId: defaultCustomerId != null && defaultCustomerId > 0
            ? Value(defaultCustomerId)
            : const Value.absent(),
        defaultBillerId: defaultBillerId != null && defaultBillerId > 0
            ? Value(defaultBillerId)
            : const Value.absent(),
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

  /// Clears catalog tables before a full re-download.
  /// Pending sales/returns/exchanges and device session are preserved.
  Future<void> clearAllLocalDataForFullDownload() async {
    await transaction(() async {
      await delete(localUsers).go();
      await delete(productStock).go();
      await delete(productBatches).go();
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
      await customStatement('DELETE FROM products_fts');
    });
  }

  /// @deprecated Use [clearAllLocalDataForFullDownload].
  Future<void> clearCatalogTables() => clearAllLocalDataForFullDownload();

  Future<void> saveDownloadCheckpoint(String? json) async {
    await (update(syncMeta)..where((t) => t.id.equals(1))).write(
      SyncMetaCompanion(downloadCheckpointJson: Value(json)),
    );
  }

  Future<String?> getDownloadCheckpoint() async {
    final meta = await getSyncMeta();
    return meta?.downloadCheckpointJson;
  }
}

const kLocalDatabaseFileName = 'newgenpos.sqlite';

LazyDatabase _openConnection(String? databaseFilePath) {
  return LazyDatabase(() async {
    final file = databaseFilePath != null
        ? File(databaseFilePath)
        : File(p.join(
            (await getApplicationDocumentsDirectory()).path,
            kLocalDatabaseFileName,
          ));
    if (databaseFilePath == null) {
      final legacy = File(p.join(file.parent.path, 'pos.sqlite'));
      if (!file.existsSync() && legacy.existsSync()) {
        await legacy.rename(file.path);
      }
    }
    await file.parent.create(recursive: true);
    return NativeDatabase.createInBackground(
      file,
      setup: (rawDb) {
        rawDb.execute('PRAGMA journal_mode = WAL;');
        rawDb.execute('PRAGMA busy_timeout = 10000;');
      },
    );
  });
}
