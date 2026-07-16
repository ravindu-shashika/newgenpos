import 'dart:async';
import 'dart:convert';

import 'package:drift/drift.dart';

import '../pos_http/pos_api_client.dart';
import '../config/app_config.dart';
import '../database/app_database.dart';
import '../logging/app_logger.dart';
import '../repositories/local_auth_repository.dart';
import '../repositories/pos_settings_repository.dart';
import '../../features/pos/models/pos_settings.dart';
import 'download_models.dart';

class _DownloadTuning {
  const _DownloadTuning({
    required this.pageSize,
    required this.dbBatchSize,
    required this.parallelChunks,
  });

  final int pageSize;
  final int dbBatchSize;
  final int parallelChunks;

  factory _DownloadTuning.forBulk(bool bulk) => _DownloadTuning(
        pageSize: AppConfig.downloadPageSizeFor(bulk: bulk),
        dbBatchSize: AppConfig.dbWriteBatchSizeFor(bulk: bulk),
        parallelChunks: AppConfig.downloadParallelChunksFor(bulk: bulk),
      );
}

int? _parseIntOrNull(dynamic v) {
  if (v == null) return null;
  if (v is int) return v;
  return int.tryParse(v.toString());
}

class _DownloadCheckpoint {
  const _DownloadCheckpoint({
    required this.resource,
    this.cursorId,
    required this.mode,
    this.since,
  });

  final String resource;
  final int? cursorId;
  final String mode;
  final String? since;

  Map<String, dynamic> toJson() => {
        'resource': resource,
        if (cursorId != null) 'cursor_id': cursorId,
        'mode': mode,
        if (since != null) 'since': since,
      };

  static _DownloadCheckpoint? decode(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return _DownloadCheckpoint(
        resource: map['resource']?.toString() ?? '',
        cursorId: _parseIntOrNull(map['cursor_id']),
        mode: map['mode']?.toString() ?? 'full',
        since: map['since']?.toString(),
      );
    } catch (_) {
      return null;
    }
  }
}

/// Chunked catalog download — cursor pagination, checkpoints, incremental FTS.
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
  _DownloadTuning _tuning = _DownloadTuning.forBulk(false);

  void cancel() => _cancelled = true;

  Future<int> download({
    required PosDownloadMode mode,
    required String deviceId,
    int? warehouseId,
    String? username,
    String? password,
    String? since,
    bool bulkMode = false,
    DownloadProgressCallback? onProgress,
  }) async {
    _cancelled = false;
    _tuning = _DownloadTuning.forBulk(bulkMode);

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
      await _db.saveDownloadCheckpoint(null);
    }

    AppLogger.info(
      'Download',
      'Fetching manifest',
      'mode=$mode warehouse=$warehouseId bulk=$bulkMode',
    );

    Map<String, dynamic> manifest;
    try {
      manifest = await _api.downloadManifest(
        username: username,
        password: password,
        warehouseId: warehouseId,
        mode: mode,
        since: resolvedSince,
        receiveTimeout: AppConfig.downloadReceiveTimeoutFor(bulk: bulkMode),
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
    final resourceNames = <String>[];
    var totalChunks = 0;
    for (final raw in resources) {
      if (raw is! Map) continue;
      final resource = raw['resource']?.toString() ?? '';
      final pages = _int(raw['pages']);
      if (resource.isEmpty || pages == 0) continue;
      resourceNames.add(resource);
      totalChunks += pages;
    }

    final savedCheckpoint = _DownloadCheckpoint.decode(
      meta?.downloadCheckpointJson,
    );
    var resumeIndex = 0;
    if (savedCheckpoint != null &&
        savedCheckpoint.mode == (mode == PosDownloadMode.delta ? 'delta' : 'full')) {
      final idx = resourceNames.indexOf(savedCheckpoint.resource);
      if (idx >= 0) resumeIndex = idx;
    }

    var completedChunks = 0;
    var productsDownloaded = false;
    var incrementalFtsDuringDownload = false;

    for (var r = resumeIndex; r < resourceNames.length; r++) {
      if (_cancelled) throw Exception('Download cancelled');

      final resource = resourceNames[r];
      int? startCursor;
      if (r == resumeIndex && savedCheckpoint?.resource == resource) {
        startCursor = savedCheckpoint?.cursorId;
      }

      final chunksDone = await _downloadResourceCursor(
        resource: resource,
        warehouseId: resolvedWarehouseId,
        mode: mode,
        since: resolvedSince,
        username: username,
        password: password,
        startCursorId: startCursor,
        totalChunks: totalChunks > 0 ? totalChunks : 1,
        completedChunks: completedChunks,
        onProgress: (info) {
          onProgress?.call(info);
        },
      );

      completedChunks += chunksDone;
      if (resource == 'products') {
        productsDownloaded = true;
        incrementalFtsDuringDownload = true;
      }

      await _db.saveDownloadCheckpoint(null);
    }

    final syncAt = DateTime.now().toIso8601String();
    PosSettings? settings = await _posSettings.load();
    try {
      final device = await _posSettings.refreshFromBootstrap(_api);
      settings = device.pos;
    } catch (e, stack) {
      AppLogger.error(
        'Download',
        'POS settings bootstrap refresh failed',
        e,
        stack,
      );
    }

    final firstCustomer = await (_db.select(_db.customers)
          ..orderBy([(c) => OrderingTerm.asc(c.id)])
          ..limit(1))
        .getSingleOrNull();
    final firstBiller = await (_db.select(_db.billers)
          ..orderBy([(b) => OrderingTerm.asc(b.id)])
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
      defaultBillerId: Value(settings?.billerId ?? firstBiller?.id),
    ));

    if (productsDownloaded && !incrementalFtsDuringDownload) {
      try {
        AppLogger.info('Download', 'Rebuilding product search index');
        await _db.rebuildProductSearchIndex();
      } catch (e, stack) {
        AppLogger.error('Download', 'Product search index rebuild failed', e, stack);
      }
    } else if (productsDownloaded) {
      try {
        await _db.customStatement('ANALYZE products');
        await _db.customStatement('ANALYZE product_stock');
      } catch (_) {}
    }

    return resolvedWarehouseId;
  }

  Future<int> _downloadResourceCursor({
    required String resource,
    required int warehouseId,
    required PosDownloadMode mode,
    required String? since,
    required String? username,
    required String? password,
    int? startCursorId,
    required int totalChunks,
    required int completedChunks,
    required void Function(DownloadProgressInfo info) onProgress,
  }) async {
    var cursorId = startCursorId;
    var page = startCursorId == null ? 1 : 2;
    var localCompleted = 0;
    var chunkIndex = completedChunks;
    Future<Map<String, dynamic>>? prefetch;

    while (true) {
      if (_cancelled) throw Exception('Download cancelled');

      final Map<String, dynamic> chunk;
      if (prefetch != null) {
        chunk = await prefetch;
        prefetch = null;
      } else {
        chunk = await _fetchChunk(
          username: username,
          password: password,
          resource: resource,
          page: page,
          cursorId: cursorId,
          warehouseId: warehouseId,
          mode: mode,
          since: since,
        );
      }

      final rows = chunk['data'] as List<dynamic>? ?? [];
      final hasMore = chunk['has_more'] == true;
      final nextCursor = _intOrNull(chunk['next_cursor_id']);

      if (hasMore && nextCursor != null && _tuning.parallelChunks > 1) {
        prefetch = _fetchChunk(
          username: username,
          password: password,
          resource: resource,
          page: page + 1,
          cursorId: nextCursor,
          warehouseId: warehouseId,
          mode: mode,
          since: since,
        );
      }

      await _persistDownloadChunk(resource, rows);
      localCompleted++;
      chunkIndex++;

      onProgress(DownloadProgressInfo(
        resource: resource,
        page: localCompleted,
        totalPages: totalChunks,
        completedChunks: chunkIndex,
        totalChunks: totalChunks,
        rowsThisChunk: rows.length,
        overallPercent:
            totalChunks > 0 ? (chunkIndex / totalChunks * 100).clamp(0, 100) : 0,
      ));

      await _db.saveDownloadCheckpoint(
        jsonEncode(
          _DownloadCheckpoint(
            resource: resource,
            cursorId: nextCursor,
            mode: mode == PosDownloadMode.delta ? 'delta' : 'full',
            since: since,
          ).toJson(),
        ),
      );

      if (!hasMore || rows.isEmpty) break;

      cursorId = nextCursor;
      page++;
      await _yieldToUi();
    }

    return localCompleted;
  }

  Future<Map<String, dynamic>> _fetchChunk({
    required String? username,
    required String? password,
    required String resource,
    required int page,
    required int? cursorId,
    required int warehouseId,
    required PosDownloadMode mode,
    required String? since,
  }) {
    return _api.downloadChunk(
      username: username,
      password: password,
      resource: resource,
      page: page,
      cursorId: cursorId,
      warehouseId: warehouseId,
      perPage: _tuning.pageSize,
      mode: mode,
      since: since,
      receiveTimeout: AppConfig.downloadReceiveTimeoutFor(
        bulk: _tuning.pageSize >= AppConfig.downloadPageSizeBulk,
      ),
    );
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

    _tuning = _DownloadTuning.forBulk(false);

    await _downloadResourceCursor(
      resource: resource,
      warehouseId: warehouseId,
      mode: PosDownloadMode.delta,
      since: since,
      username: null,
      password: null,
      totalChunks: 1,
      completedChunks: 0,
      onProgress: (_) {},
    );

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
        final maps =
            rows.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        await _localAuth.upsertUsers(maps);
        AppLogger.info(
          'Download',
          'Users chunk imported',
          'rows=${maps.length} total=${await _localAuth.countUsers()} '
              'with_pin=${await _localAuth.countUsersWithPin()}',
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
          onBatchWritten: (maps) async {
            for (final m in maps) {
              await _db.upsertProductSearchIndexRow(
                productId: _int(m['id']),
                name: m['name']?.toString() ?? '',
                code: m['code']?.toString() ?? '',
                altCode: m['alt_code']?.toString(),
              );
            }
          },
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
            maxPrice: Value(_dblOrNull(m['max_price'])),
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
    TableInfo<T, D> table, {
    Future<void> Function(List<Map<String, dynamic>> maps)? onBatchWritten,
  }) async {
    final batchSize = _tuning.dbBatchSize;
    for (var i = 0; i < items.length; i += batchSize) {
      if (_cancelled) return;
      final slice = items.skip(i).take(batchSize);
      final maps = <Map<String, dynamic>>[];
      await _db.batch((batch) {
        for (final raw in slice) {
          if (raw is! Map) continue;
          final map = Map<String, dynamic>.from(raw);
          maps.add(map);
          batch.insert(table, mapper(map), mode: InsertMode.insertOrReplace);
        }
      });
      if (onBatchWritten != null && maps.isNotEmpty) {
        await onBatchWritten(maps);
      }
      await _yieldToUi();
    }
  }

  int _int(dynamic v, {int fallback = 0}) {
    if (v == null) return fallback;
    if (v is int) return v;
    return int.tryParse(v.toString()) ?? fallback;
  }

  int? _intOrNull(dynamic v) => _parseIntOrNull(v);

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
