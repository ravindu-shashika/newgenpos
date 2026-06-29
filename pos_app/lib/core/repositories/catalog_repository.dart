import 'package:drift/drift.dart';

import '../pos_http/pos_api_client.dart';
import '../database/app_database.dart';
import '../repositories/local_auth_repository.dart';

typedef DownloadProgress = void Function(String resource, int page, int totalPages);

class CatalogRepository {
  CatalogRepository(this._db, this._api, this._localAuth);

  final AppDatabase _db;
  final PosApiClient _api;
  final LocalAuthRepository _localAuth;

  /// Initial POS provisioning — downloads all catalog + users before offline login.
  Future<int> fullDownload({
    required String username,
    required String password,
    required String deviceId,
    int? warehouseId,
    DownloadProgress? onProgress,
  }) async {
    final manifest = await _api.downloadManifest(
      username: username,
      password: password,
      warehouseId: warehouseId,
    );

    final resolvedWarehouseId =
        warehouseId ?? _intOrNull(manifest['warehouse_id']);
    if (resolvedWarehouseId == null) {
      throw Exception('warehouse_id is required');
    }

    final resources = manifest['resources'] as List<dynamic>? ?? [];
    for (final raw in resources) {
      if (raw is! Map) continue;
      final resource = raw['resource']?.toString() ?? '';
      final pages = _int(raw['pages']);
      if (resource.isEmpty || pages == 0) continue;

      for (var page = 1; page <= pages; page++) {
        onProgress?.call(resource, page, pages);
        final chunk = await _api.downloadChunk(
          username: username,
          password: password,
          resource: resource,
          page: page,
          warehouseId: resolvedWarehouseId,
        );
        await _persistDownloadChunk(resource, chunk['data'] as List<dynamic>? ?? []);
      }
    }

    final syncAt = DateTime.now().toIso8601String();
    final firstCustomer = await (_db.select(_db.customers)
          ..orderBy([(c) => OrderingTerm.asc(c.id)]))
        .getSingleOrNull();

    await _db.upsertSyncMeta(SyncMetaCompanion.insert(
      id: const Value(1),
      deviceId: deviceId,
      warehouseId: resolvedWarehouseId,
      lastCatalogSyncAt: Value(syncAt),
      lastFullDownloadAt: Value(syncAt),
      defaultCustomerId: Value(firstCustomer?.id),
    ));

    return resolvedWarehouseId;
  }

  Future<void> _persistDownloadChunk(String resource, List<dynamic> rows) async {
    switch (resource) {
      case 'users':
        await _localAuth.replaceUsers(
          rows.map((e) => Map<String, dynamic>.from(e as Map)).toList(),
        );
        break;
      case 'warehouses':
        await _upsertList(
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
        await _upsertList(
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
        await _upsertList(
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
        await _upsertList(
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
        await _upsertList(
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
        await _upsertList(
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
        await _upsertList(
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
        await _upsertList(
          rows,
          (m) => ProductsCompanion.insert(
            id: Value(_int(m['id'])),
            name: m['name']?.toString() ?? '',
            code: m['code']?.toString() ?? '',
            type: Value(m['type']?.toString() ?? 'standard'),
            brandId: Value(_intOrNull(m['brand_id'])),
            categoryId: Value(_intOrNull(m['category_id'])),
            unitId: Value(_intOrNull(m['unit_id'])),
            saleUnitId: Value(_intOrNull(m['sale_unit_id'])),
            cost: Value(_dbl(m['cost'])),
            price: Value(_dbl(m['price'])),
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
        await _upsertList(
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
      case 'product_stock':
        await _upsertList(
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
      case 'settings':
      case 'coupons':
        break;
    }
  }

  Future<String> syncCatalog({
    required int warehouseId,
    required String deviceId,
    String? since,
  }) async {
    final data = await _api.catalog(warehouseId: warehouseId, since: since);
    final syncVersion = data['sync_version']?.toString() ?? DateTime.now().toIso8601String();

    await _db.transaction(() async {
      await _upsertList(
        data['categories'] as List<dynamic>? ?? [],
        (m) => CategoriesCompanion.insert(
          id: Value(_int(m['id'])),
          name: m['name']?.toString() ?? '',
          image: Value(m['image']?.toString()),
          updatedAt: Value(m['updated_at']?.toString()),
        ),
        _db.categories,
      );

      await _upsertList(
        data['brands'] as List<dynamic>? ?? [],
        (m) => BrandsCompanion.insert(
          id: Value(_int(m['id'])),
          name: m['name']?.toString() ?? '',
          image: Value(m['image']?.toString()),
          updatedAt: Value(m['updated_at']?.toString()),
        ),
        _db.brands,
      );

      await _upsertList(
        data['taxes'] as List<dynamic>? ?? [],
        (m) => TaxesCompanion.insert(
          id: Value(_int(m['id'])),
          name: m['name']?.toString() ?? '',
          rate: Value(_dbl(m['rate'])),
          updatedAt: Value(m['updated_at']?.toString()),
        ),
        _db.taxes,
      );

      await _upsertList(
        data['units'] as List<dynamic>? ?? [],
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

      await _upsertList(
        data['customers'] as List<dynamic>? ?? [],
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

      await _upsertList(
        data['billers'] as List<dynamic>? ?? [],
        (m) => BillersCompanion.insert(
          id: Value(_int(m['id'])),
          name: m['name']?.toString() ?? '',
          companyName: Value(m['company_name']?.toString()),
          updatedAt: Value(m['updated_at']?.toString()),
        ),
        _db.billers,
      );

      await _upsertList(
        data['products'] as List<dynamic>? ?? [],
        (m) => ProductsCompanion.insert(
          id: Value(_int(m['id'])),
          name: m['name']?.toString() ?? '',
          code: m['code']?.toString() ?? '',
          type: Value(m['type']?.toString() ?? 'standard'),
          brandId: Value(_intOrNull(m['brand_id'])),
          categoryId: Value(_intOrNull(m['category_id'])),
          unitId: Value(_intOrNull(m['unit_id'])),
          saleUnitId: Value(_intOrNull(m['sale_unit_id'])),
          cost: Value(_dbl(m['cost'])),
          price: Value(_dbl(m['price'])),
          taxId: Value(_intOrNull(m['tax_id'])),
          taxMethod: Value(_int(m['tax_method'], fallback: 1)),
          image: Value(m['image']?.toString()),
          isVariant: Value(m['is_variant'] == true),
          isBatch: Value(m['is_batch'] == true),
          isImei: Value(m['is_imei'] == true),
          isEmbeded: Value(m['is_embeded'] == true),
          featured: Value(_int(m['featured'])),
          updatedAt: Value(m['updated_at']?.toString()),
        ),
        _db.products,
      );

      await _upsertList(
        data['product_variants'] as List<dynamic>? ?? [],
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

      await _upsertList(
        data['product_stock'] as List<dynamic>? ?? [],
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

      final firstCustomer = await (_db.select(_db.customers)
            ..orderBy([(c) => OrderingTerm.asc(c.id)]))
          .getSingleOrNull();

      await _db.upsertSyncMeta(SyncMetaCompanion.insert(
        id: const Value(1),
        deviceId: deviceId,
        warehouseId: warehouseId,
        lastCatalogSyncAt: Value(syncVersion),
        defaultCustomerId: Value(firstCustomer?.id),
      ));
    });

    return syncVersion;
  }

  Future<void> _upsertList<T extends Table, D>(
    List<dynamic> items,
    Insertable<D> Function(Map<String, dynamic> m) mapper,
    TableInfo<T, D> table,
  ) async {
    for (final raw in items) {
      if (raw is! Map) continue;
      final map = Map<String, dynamic>.from(raw);
      await _db.into(table).insertOnConflictUpdate(mapper(map));
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
