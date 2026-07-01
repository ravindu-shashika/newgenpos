import 'package:drift/drift.dart';

import '../pos_http/pos_api_client.dart';
import '../config/app_config.dart';
import '../database/app_database.dart';
import '../logging/app_logger.dart';
import '../repositories/local_auth_repository.dart';
import '../repositories/pos_settings_repository.dart';
import 'download_models.dart';

/// Chunked catalog download — yields between batches so the UI stays responsive.
class CatalogDownloadService {
  CatalogDownloadService(
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

  Future<int> download({
    required PosDownloadMode mode,
    required String deviceId,
    int? warehouseId,
    String? username,
    String? password,
    String? since,
    DownloadProgressCallback? onProgress,
  }) async {
    _cancelled = false;

    final meta = await _db.getSyncMeta();
    final resolvedSince = mode == PosDownloadMode.delta
        ? (since ?? meta?.lastCatalogSyncAt ?? meta?.lastFullDownloadAt)
        : null;

    if (mode == PosDownloadMode.delta &&
        (resolvedSince == null || resolvedSince.isEmpty)) {
      throw Exception(
        'No previous sync timestamp. Run a full download first.',
      );
    }

    if (mode == PosDownloadMode.full) {
      await _db.clearAllLocalDataForFullDownload();
    }

    AppLogger.info('Download', 'Fetching manifest', 'mode=$mode warehouse=$warehouseId');

    Map<String, dynamic> manifest;
    try {
      manifest = await _api.downloadManifest(
        username: username,
        password: password,
        warehouseId: warehouseId,
        mode: mode,
        since: resolvedSince,
      );
    } catch (e, stack) {
      AppLogger.error('Download', 'Manifest request failed', e, stack);
      rethrow;
    }

    final resolvedWarehouseId =
        warehouseId ?? _intOrNull(manifest['warehouse_id']);
    if (resolvedWarehouseId == null) {
      throw Exception('warehouse_id is required');
    }

    final resources = manifest['resources'] as List<dynamic>? ?? [];

    var totalChunks = 0;
    final resourcePlans = <Map<String, dynamic>>[];
    for (final raw in resources) {
      if (raw is! Map) continue;
      final resource = raw['resource']?.toString() ?? '';
      final totalRows = _int(raw['total']);
      final serverPages = _int(raw['pages']);
      if (resource.isEmpty || serverPages == 0) continue;

      final clientPages = totalRows > 0
          ? (totalRows / AppConfig.downloadPageSize).ceil()
          : serverPages;
      totalChunks += clientPages;
      resourcePlans.add({
        'resource': resource,
        'clientPages': clientPages,
      });
    }

    var completedChunks = 0;

    for (final plan in resourcePlans) {
      if (_cancelled) throw Exception('Download cancelled');

      final resource = plan['resource'] as String;
      final clientPages = plan['clientPages'] as int;

      for (var page = 1; page <= clientPages; page++) {
        if (_cancelled) throw Exception('Download cancelled');

        Map<String, dynamic> chunk;
        try {
          chunk = await _api.downloadChunk(
            username: username,
            password: password,
            resource: resource,
            page: page,
            warehouseId: resolvedWarehouseId,
            perPage: AppConfig.downloadPageSize,
            mode: mode,
            since: resolvedSince,
          );
        } catch (e, stack) {
          AppLogger.error(
            'Download',
            'Chunk failed: $resource page $page/$clientPages',
            e,
            stack,
          );
          rethrow;
        }

        final rows = chunk['data'] as List<dynamic>? ?? [];
        await _persistDownloadChunk(resource, rows);
        completedChunks++;

        onProgress?.call(DownloadProgressInfo(
          resource: resource,
          page: page,
          totalPages: clientPages,
          completedChunks: completedChunks,
          totalChunks: totalChunks > 0 ? totalChunks : clientPages,
          rowsThisChunk: rows.length,
          overallPercent: totalChunks > 0
              ? (completedChunks / totalChunks * 100).clamp(0, 100)
              : 0,
        ));

        await _yieldToUi();
      }
    }

    final syncAt = DateTime.now().toIso8601String();
    final settings = await _posSettings.load();
    final firstCustomer = await (_db.select(_db.customers)
          ..orderBy([(c) => OrderingTerm.asc(c.id)])
          ..limit(1))
        .getSingleOrNull();

    await _db.upsertSyncMeta(SyncMetaCompanion.insert(
      id: const Value(1),
      deviceId: deviceId,
      warehouseId: resolvedWarehouseId,
      lastCatalogSyncAt: Value(syncAt),
      lastFullDownloadAt: mode == PosDownloadMode.full
          ? Value(syncAt)
          : const Value.absent(),
      defaultCustomerId: Value(settings?.customerId ?? firstCustomer?.id),
      defaultBillerId: Value(settings?.billerId),
    ));

    try {
      await _posSettings.refreshFromBootstrap(_api);
    } catch (e, stack) {
      AppLogger.error('Download', 'POS settings bootstrap refresh failed', e, stack);
    }

    return resolvedWarehouseId;
  }

  /// Pull one catalog resource (e.g. product_stock) after a sale sync.
  Future<void> refreshResourceDelta({
    required String resource,
    required String deviceId,
    required int warehouseId,
  }) async {
    final meta = await _db.getSyncMeta();
    final since = meta?.lastCatalogSyncAt ?? meta?.lastFullDownloadAt;
    if (since == null || since.isEmpty) return;

    final manifest = await _api.downloadManifest(
      warehouseId: warehouseId,
      mode: PosDownloadMode.delta,
      since: since,
    );

    final resources = manifest['resources'] as List<dynamic>? ?? [];
    Map<String, dynamic>? plan;
    for (final raw in resources) {
      if (raw is! Map) continue;
      if (raw['resource']?.toString() == resource) {
        final totalRows = _int(raw['total']);
        final serverPages = _int(raw['pages']);
        if (serverPages == 0) return;
        final clientPages = totalRows > 0
            ? (totalRows / AppConfig.downloadPageSize).ceil()
            : serverPages;
        plan = {'clientPages': clientPages};
        break;
      }
    }
    if (plan == null) return;

    final clientPages = plan['clientPages'] as int;
    for (var page = 1; page <= clientPages; page++) {
      final chunk = await _api.downloadChunk(
        resource: resource,
        page: page,
        warehouseId: warehouseId,
        perPage: AppConfig.downloadPageSize,
        mode: PosDownloadMode.delta,
        since: since,
      );
      final rows = chunk['data'] as List<dynamic>? ?? [];
      await _persistDownloadChunk(resource, rows);
      await _yieldToUi();
    }

    await _db.upsertSyncMeta(SyncMetaCompanion.insert(
      id: const Value(1),
      deviceId: deviceId,
      warehouseId: warehouseId,
      lastCatalogSyncAt: Value(DateTime.now().toIso8601String()),
    ));
  }

  Future<void> _yieldToUi() async {
    await Future<void>.delayed(Duration.zero);
  }

  Future<void> _persistDownloadChunk(
    String resource,
    List<dynamic> rows,
  ) async {
    if (rows.isEmpty) return;

    switch (resource) {
      case 'users':
        await _localAuth.upsertUsers(
          rows.map((e) => Map<String, dynamic>.from(e as Map)).toList(),
        );
        return;
      case 'warehouses':
        await _upsertBatched(
          rows,
          (m) => WarehousesCompanion.insert(
            id: Value(_int(m['id'])),
            name: m['name']?.toString() ?? '',
            phone: Value(m['phone']?.toString()),
            email: Value(m['email']?.toString()),
            address: Value(m['address']?.toString()),
            updatedAt: Value(m['updated_at']?.toString()),
          ),
          _db.warehouses,
        );
        break;
      case 'categories':
        await _upsertBatched(
          rows,
          (m) => CategoriesCompanion.insert(
            id: Value(_int(m['id'])),
            name: m['name']?.toString() ?? '',
            image: Value(m['image']?.toString()),
            updatedAt: Value(m['updated_at']?.toString()),
          ),
          _db.categories,
        );
        break;
      case 'brands':
        await _upsertBatched(
          rows,
          (m) => BrandsCompanion.insert(
            id: Value(_int(m['id'])),
            name: m['name']?.toString() ?? '',
            image: Value(m['image']?.toString()),
            updatedAt: Value(m['updated_at']?.toString()),
          ),
          _db.brands,
        );
        break;
      case 'taxes':
        await _upsertBatched(
          rows,
          (m) => TaxesCompanion.insert(
            id: Value(_int(m['id'])),
            name: m['name']?.toString() ?? '',
            rate: Value(_dbl(m['rate'])),
            updatedAt: Value(m['updated_at']?.toString()),
          ),
          _db.taxes,
        );
        break;
      case 'units':
        await _upsertBatched(
          rows,
          (m) => UnitsCompanion.insert(
            id: Value(_int(m['id'])),
            unitCode: Value(m['unit_code']?.toString()),
            unitName: m['unit_name']?.toString() ?? '',
            baseUnit: Value(_intOrNull(m['base_unit'])),
            operator: Value(m['operator']?.toString()),
            operationValue: Value(_dbl(m['operation_value'], fallback: 1)),
            updatedAt: Value(m['updated_at']?.toString()),
          ),
          _db.units,
        );
        break;
      case 'customers':
        await _upsertBatched(
          rows,
          (m) => CustomersCompanion.insert(
            id: Value(_int(m['id'])),
            name: m['name']?.toString() ?? '',
            phoneNumber: Value(m['phone_number']?.toString()),
            email: Value(m['email']?.toString()),
            city: Value(m['city']?.toString()),
            customerGroupId: Value(_intOrNull(m['customer_group_id'])),
            updatedAt: Value(m['updated_at']?.toString()),
          ),
          _db.customers,
        );
        break;
      case 'billers':
        await _upsertBatched(
          rows,
          (m) => BillersCompanion.insert(
            id: Value(_int(m['id'])),
            name: m['name']?.toString() ?? '',
            companyName: Value(m['company_name']?.toString()),
            updatedAt: Value(m['updated_at']?.toString()),
          ),
          _db.billers,
        );
        break;
      case 'products':
        await _upsertBatched(
          rows,
          (m) => ProductsCompanion.insert(
            id: Value(_int(m['id'])),
            name: m['name']?.toString() ?? '',
            code: m['code']?.toString() ?? '',
            altCode: Value(m['alt_code']?.toString()),
            type: Value(m['type']?.toString() ?? 'standard'),
            brandId: Value(_intOrNull(m['brand_id'])),
            categoryId: Value(_intOrNull(m['category_id'])),
            unitId: Value(_intOrNull(m['unit_id'])),
            saleUnitId: Value(_intOrNull(m['sale_unit_id'])),
            cost: Value(_dbl(m['cost'])),
            price: Value(_dbl(m['price'])),
            maxPrice: Value(_dblOrNull(m['max_price'])),
            wholesalePrice: Value(_dbl(m['wholesale_price'])),
            taxId: Value(_intOrNull(m['tax_id'])),
            taxMethod: Value(_int(m['tax_method'], fallback: 1)),
            image: Value(m['image']?.toString()),
            isVariant: Value(m['is_variant'] == true || m['is_variant'] == 1),
            isBatch: Value(m['is_batch'] == true || m['is_batch'] == 1),
            isImei: Value(m['is_imei'] == true || m['is_imei'] == 1),
            isEmbeded: Value(m['is_embeded'] == true || m['is_embeded'] == 1),
            featured: Value(_int(m['featured'])),
            updatedAt: Value(m['updated_at']?.toString()),
          ),
          _db.products,
        );
        break;
      case 'product_variants':
        await _upsertBatched(
          rows,
          (m) => ProductVariantsCompanion.insert(
            id: Value(_int(m['id'])),
            productId: _int(m['product_id']),
            variantId: Value(_intOrNull(m['variant_id'])),
            itemCode: m['item_code']?.toString() ?? '',
            additionalPrice: Value(_dbl(m['additional_price'])),
            updatedAt: Value(m['updated_at']?.toString()),
          ),
          _db.productVariants,
        );
        break;
      case 'product_batches':
        await _upsertBatched(
          rows,
          (m) => ProductBatchesCompanion.insert(
            id: Value(_int(m['id'])),
            productId: _int(m['product_id']),
            batchNo: m['batch_no']?.toString() ?? '',
            expiredDate: Value(m['expired_date']?.toString()),
            qty: Value(_dbl(m['qty'])),
            updatedAt: Value(m['updated_at']?.toString()),
          ),
          _db.productBatches,
        );
        break;
      case 'product_stock':
        await _upsertBatched(
          rows,
          (m) => ProductStockCompanion.insert(
            id: Value(_int(m['id'])),
            productId: _int(m['product_id']),
            warehouseId: _int(m['warehouse_id']),
            variantId: Value(_intOrNull(m['variant_id'])),
            qty: Value(_dbl(m['qty'])),
            price: Value(_dblOrNull(m['price'])),
            productBatchId: Value(_intOrNull(m['product_batch_id'])),
            imeiNumber: Value(m['imei_number']?.toString()),
            updatedAt: Value(m['updated_at']?.toString()),
          ),
          _db.productStock,
        );
        break;
      case 'coupons':
        await _upsertBatched(
          rows,
          (m) => LocalCouponsCompanion.insert(
            id: Value(_int(m['id'])),
            code: m['code']?.toString() ?? '',
            type: Value(m['type']?.toString() ?? 'percentage'),
            amount: Value(_dbl(m['amount'])),
            minimumAmount: Value(_dbl(m['minimum_amount'])),
            quantity: Value(_dblOrNull(m['quantity'])),
            used: Value(_dbl(m['used'])),
            expiredDate: Value(m['expired_date']?.toString()),
            updatedAt: Value(m['updated_at']?.toString()),
          ),
          _db.localCoupons,
        );
        break;
      case 'settings':
        for (final raw in rows) {
          if (raw is Map) {
            await _posSettings.saveFromDownloadRow(Map<String, dynamic>.from(raw));
          }
        }
        break;
    }
  }

  Future<void> _upsertBatched<T extends Table, D>(
    List<dynamic> items,
    Insertable<D> Function(Map<String, dynamic> m) mapper,
    TableInfo<T, D> table,
  ) async {
    final batchSize = AppConfig.dbWriteBatchSize;
    for (var i = 0; i < items.length; i += batchSize) {
      if (_cancelled) return;
      final slice = items.skip(i).take(batchSize);
      await _db.batch((batch) {
        for (final raw in slice) {
          if (raw is! Map) continue;
          final map = Map<String, dynamic>.from(raw);
          batch.insert(table, mapper(map), mode: InsertMode.insertOrReplace);
        }
      });
      await _yieldToUi();
    }
  }

  int _int(dynamic v, {int fallback = 0}) {
    if (v == null) return fallback;
    if (v is int) return v;
    return int.tryParse(v.toString()) ?? fallback;
  }

  int? _intOrNull(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    return int.tryParse(v.toString());
  }

  double _dbl(dynamic v, {double fallback = 0}) {
    if (v == null) return fallback;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? fallback;
  }

  double? _dblOrNull(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString());
  }
}
