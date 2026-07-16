import 'package:drift/drift.dart';

import '../pos_http/pos_api_client.dart';
import '../database/app_database.dart';
import '../database/product_catalog_sql.dart';
import '../../features/pos/models/cart_line_edit_context.dart';
import '../../features/pos/models/product_list_page.dart';
import '../../features/pos/models/scanned_product.dart';
import '../../features/pos/product_filter.dart';

class ProductLookupRepository {
  ProductLookupRepository(this._db, this._api);

  final AppDatabase _db;
  final PosApiClient _api;

  /// Fast indexed exact match for barcode scanners (local DB only).
  Future<ScannedProduct?> lookupBarcodeExact({
    required String code,
    required int warehouseId,
    String priceType = 'retail',
  }) {
    final trimmed = code.trim();
    if (trimmed.isEmpty) return Future.value(null);
    return _lookupLocal(trimmed, warehouseId, priceType: priceType);
  }

  /// Local scan first (variant item_code → product code), then API fallback.
  Future<ScannedProduct?> lookup({
    required String code,
    required int warehouseId,
    required int customerId,
    bool preferOnline = false,
    String priceType = 'retail',
  }) async {
    final trimmed = code.trim();
    if (trimmed.isEmpty) return null;

    if (!preferOnline) {
      final local = await _lookupLocal(trimmed, warehouseId, priceType: priceType);
      if (local != null) return local;
    }

    try {
      final remote = await _api.scan(
        code: trimmed,
        warehouseId: warehouseId,
        customerId: customerId,
      );
      return ScannedProduct.fromApiMap(remote);
    } catch (_) {
      if (!preferOnline) return null;
      rethrow;
    }
  }

  /// Products with stock in [warehouseId] for the POS grid (aggregated qty).
  Future<List<ScannedProduct>> listInStock({
    required int warehouseId,
    ProductGridFilter filter = ProductGridFilter.all,
    int filterId = 1,
    String priceType = 'retail',
    int limit = 500,
  }) async {
    final page = await listInStockPage(
      warehouseId: warehouseId,
      filter: filter,
      filterId: filterId,
      priceType: priceType,
      offset: 0,
      limit: limit,
    );
    return page.items;
  }

  /// Paginated product grid — SQL-side aggregation (scales to 1M+ SKUs).
  Future<ProductListPage> listInStockPage({
    required int warehouseId,
    ProductGridFilter filter = ProductGridFilter.all,
    int filterId = 1,
    String priceType = 'retail',
    int offset = 0,
    int limit = 24,
  }) async {
    final filterSql = _gridFilterSql(filter);
    final filterVars = _gridFilterVariables(filter, filterId);
    final baseVars = [Variable<int>(warehouseId), ...filterVars];

    final countRow = await _db
        .customSelect(
          ProductCatalogSql.gridCountSql(filterSql),
          variables: baseVars,
          readsFrom: { _db.products, _db.productStock, _db.productBatches },
        )
        .getSingle();
    final totalCount = countRow.read<int>('cnt');

    if (totalCount == 0 || offset >= totalCount) {
      return ProductListPage(
        items: const [],
        totalCount: totalCount,
        offset: offset,
      );
    }

    final rows = await _db
        .customSelect(
          ProductCatalogSql.gridPageSql(filterSql),
          variables: [
            ...baseVars,
            Variable<int>(limit),
            Variable<int>(offset),
          ],
          readsFrom: { _db.products, _db.productStock, _db.productBatches },
        )
        .get();

    if (rows.isEmpty) {
      return ProductListPage(
        items: const [],
        totalCount: totalCount,
        offset: offset,
      );
    }

    final pageKeys = <String>[];
    final variantByKey = <String, int?>{};
    final qtyByKey = <String, double>{};
    final productsById = <int, QueryRow>{};

    for (final row in rows) {
      final productId = row.read<int>('product_id');
      final variantIdRaw = row.read<int>('variant_id');
      final variantId = variantIdRaw == 0 ? null : variantIdRaw;
      final key = '${productId}_${variantId ?? 0}';
      pageKeys.add(key);
      variantByKey[key] = variantId;
      qtyByKey[key] = row.read<double>('qty');
      productsById[productId] = row;
    }

    final variantMap = await _variantMapForKeys(pageKeys, variantByKey);
    final taxMap = await _taxRateMap(
      productsById.values
          .map((r) => r.read<int?>('tax_id'))
          .toSet(),
    );

    final items = <ScannedProduct>[];
    for (final key in pageKeys) {
      final productId = int.parse(key.split('_').first);
      final row = productsById[productId]!;
      final variantId = variantByKey[key];
      var code = row.read<String>('code');
      var price = _resolvePrice(
        row.read<double>('price'),
        row.read<double>('wholesale_price'),
        priceType,
      );

      if (variantId != null) {
        final variant = variantMap['${productId}_$variantId'];
        if (variant != null) {
          code = variant.itemCode;
          price += variant.additionalPrice;
        }
      }

      final taxId = row.read<int?>('tax_id');
      items.add(
        ScannedProduct(
          productId: productId,
          variantId: variantId,
          code: code,
          name: row.read<String>('name'),
          price: price,
          cost: row.read<double>('cost'),
          taxRate: taxId == null ? 0 : (taxMap[taxId] ?? 0),
          taxMethod: row.read<int>('tax_method'),
          warehouseQty: qtyByKey[key] ?? 0,
          image: row.read<String?>('image'),
          source: ProductSource.local,
          isBatch: row.read<int>('is_batch') == 1,
          maxPrice: row.read<double?>('max_price'),
        ),
      );
    }

    return ProductListPage(
      items: items,
      totalCount: totalCount,
      offset: offset,
    );
  }

  String _gridFilterSql(ProductGridFilter filter) {
    switch (filter) {
      case ProductGridFilter.all:
        return '';
      case ProductGridFilter.featured:
        return 'AND p.featured = 1';
      case ProductGridFilter.category:
        return 'AND p.category_id = ?';
      case ProductGridFilter.brand:
        return 'AND p.brand_id = ?';
    }
  }

  List<Variable> _gridFilterVariables(ProductGridFilter filter, int filterId) {
    switch (filter) {
      case ProductGridFilter.all:
      case ProductGridFilter.featured:
        return const [];
      case ProductGridFilter.category:
      case ProductGridFilter.brand:
        return [Variable<int>(filterId)];
    }
  }

  Future<Map<String, ProductVariant>> _variantMapForKeys(
    List<String> keys,
    Map<String, int?> variantByKey,
  ) async {
    final productIds = <int>{};
    for (final key in keys) {
      final variantId = variantByKey[key];
      if (variantId == null) continue;
      productIds.add(int.parse(key.split('_').first));
    }
    if (productIds.isEmpty) return {};

    final rows = await (_db.select(_db.productVariants)
          ..where((v) => v.productId.isIn(productIds.toList())))
        .get();
    return {
      for (final v in rows) '${v.productId}_${v.variantId}': v,
    };
  }

  Future<Map<int, double>> _taxRateMap(Set<int?> taxIds) async {
    final ids = taxIds.whereType<int>().toList();
    if (ids.isEmpty) return {};
    final rows =
        await (_db.select(_db.taxes)..where((t) => t.id.isIn(ids))).get();
    return {for (final t in rows) t.id: t.rate};
  }

  /// Search by product name or code (prefix on codes for index use).
  Future<List<ScannedProduct>> searchLocal({
    required String query,
    required int warehouseId,
    String priceType = 'retail',
    int limit = 25,
  }) async {
    final term = query.trim();
    if (term.length < 2) return [];

    final candidates = <_SearchCandidate>[];
    final seenKeys = <String>{};

    void addCandidate({
      required Product product,
      int? variantId,
      String? code,
      double additionalPrice = 0,
    }) {
      final key = '${product.id}_${variantId ?? 0}';
      if (seenKeys.contains(key) || candidates.length >= limit) return;
      seenKeys.add(key);
      candidates.add(
        _SearchCandidate(
          product: product,
          variantId: variantId,
          code: code ?? product.code,
          additionalPrice: additionalPrice,
        ),
      );
    }

    final codeLike = _isCodeLikeTerm(term);
    final escaped = term.replaceAll('%', '').replaceAll('_', '');

    if (codeLike) {
      final prefix = '$escaped%';
      final productRows = await (_db.select(_db.products)
            ..where((p) => p.code.like(prefix) | p.altCode.like(prefix))
            ..limit(limit))
          .get();
      for (final p in productRows) {
        addCandidate(product: p);
      }

      if (candidates.length < limit) {
        final variantRows = await (_db.select(_db.productVariants)
              ..where((v) => v.itemCode.like(prefix))
              ..limit(limit))
            .get();
        if (variantRows.isNotEmpty) {
          final productIds = variantRows.map((v) => v.productId).toSet().toList();
          final products = await (_db.select(_db.products)
                ..where((p) => p.id.isIn(productIds)))
              .get();
          final byId = {for (final p in products) p.id: p};
          for (final v in variantRows) {
            if (candidates.length >= limit) break;
            final product = byId[v.productId];
            if (product == null) continue;
            addCandidate(
              product: product,
              variantId: v.variantId,
              code: v.itemCode,
              additionalPrice: v.additionalPrice,
            );
          }
        }
      }
    }

    if (candidates.length < limit) {
      final ftsMatch = ProductCatalogSql.ftsMatchExpression(term);
      if (ftsMatch != null) {
        try {
          final ftsIds = await _db.searchProductIdsFts(
            matchExpression: ftsMatch,
            limit: limit,
          );
          if (ftsIds.isNotEmpty) {
            final productRows = await (_db.select(_db.products)
                  ..where((p) => p.id.isIn(ftsIds)))
                .get();
            final byId = {for (final p in productRows) p.id: p};
            for (final id in ftsIds) {
              if (candidates.length >= limit) break;
              final product = byId[id];
              if (product == null) continue;
              addCandidate(product: product);
            }
          }
        } catch (_) {
          // FTS unavailable — fall through to legacy prefix scan.
        }
      }
    }

    if (candidates.length < limit && !codeLike) {
      final prefix = '${escaped.substring(0, escaped.length.clamp(0, 3))}%';
      final productRows = await (_db.select(_db.products)
            ..where(
              (p) =>
                  p.name.like(prefix) |
                  p.code.like(prefix) |
                  p.altCode.like(prefix),
            )
            ..limit(limit))
          .get();
      for (final p in productRows) {
        addCandidate(product: p);
        if (candidates.length >= limit) break;
      }
    }

    if (candidates.isEmpty) return [];

    final taxMap = await _taxRateMap(
      candidates.map((c) => c.product.taxId).toSet(),
    );
    final stockMap = await _batchStockQty(
      warehouseId: warehouseId,
      keys: [
        for (final c in candidates) (c.product.id, c.variantId),
      ],
      isBatchByProductId: {
        for (final c in candidates) c.product.id: c.product.isBatch,
      },
    );

    final results = <ScannedProduct>[];
    for (final c in candidates) {
      final basePrice = _resolvePrice(
        c.product.price,
        c.product.wholesalePrice,
        priceType,
      );
      results.add(
        ScannedProduct(
          productId: c.product.id,
          variantId: c.variantId,
          code: c.code,
          name: c.product.name,
          price: basePrice + c.additionalPrice,
          cost: c.product.cost,
          taxRate: c.product.taxId == null ? 0 : (taxMap[c.product.taxId] ?? 0),
          taxMethod: c.product.taxMethod,
          warehouseQty: stockMap['${c.product.id}_${c.variantId ?? 0}'] ?? 0,
          image: c.product.image,
          source: ProductSource.local,
          isBatch: c.product.isBatch,
          maxPrice: c.product.maxPrice,
        ),
      );
    }

    results.sort((a, b) => a.name.compareTo(b.name));
    return results;
  }

  bool _isCodeLikeTerm(String term) =>
      !term.contains(' ') && RegExp(r'^[A-Za-z0-9\-]+$').hasMatch(term);

  DateTime get _today =>
      DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);

  bool _isBatchExpired(String? expiryRaw, DateTime today) {
    final raw = expiryRaw?.trim();
    if (raw == null || raw.isEmpty) return false;
    final expiry = DateTime.tryParse(raw);
    if (expiry == null) return false;
    final day = DateTime(expiry.year, expiry.month, expiry.day);
    return day.isBefore(today);
  }

  Future<double> _warehouseBatchStockTotal({
    required int productId,
    required int warehouseId,
  }) async {
    final options = await listBatchOptions(
      productId: productId,
      warehouseId: warehouseId,
    );
    return options.fold<double>(0, (sum, option) => sum + option.qty);
  }

  Future<double> _stockQtyForProduct({
    required int productId,
    required int warehouseId,
    required int? variantId,
    required bool isBatch,
  }) async {
    if (isBatch && variantId == null) {
      final batchTotal = await _warehouseBatchStockTotal(
        productId: productId,
        warehouseId: warehouseId,
      );
      if (batchTotal > 0) return batchTotal;
    }
    return _stockQty(productId, warehouseId, variantId, isBatch: isBatch);
  }

  Future<double> _totalStockQty(int productId, int warehouseId) async {
    final rows = await (_db.select(_db.productStock)
          ..where((s) =>
              s.productId.equals(productId) &
              s.warehouseId.equals(warehouseId)))
        .get();
    return rows.fold<double>(0, (sum, r) => sum + r.qty);
  }

  Future<ScannedProduct?> _lookupLocal(
    String code,
    int warehouseId, {
    String priceType = 'retail',
  }) async {
    final variant = await (_db.select(_db.productVariants)
          ..where((v) => v.itemCode.equals(code)))
        .getSingleOrNull();

    if (variant != null) {
      final product = await (_db.select(_db.products)
            ..where((p) => p.id.equals(variant.productId)))
          .getSingleOrNull();
      if (product == null) return null;

      final taxMap = await _taxRateMap({product.taxId});
      final stock = await _stockQtyForProduct(
        productId: product.id,
        warehouseId: warehouseId,
        variantId: variant.variantId,
        isBatch: product.isBatch,
      );
      final basePrice = _resolvePrice(
        product.price,
        product.wholesalePrice,
        priceType,
      );
      return ScannedProduct(
        productId: product.id,
        variantId: variant.variantId,
        code: variant.itemCode,
        name: product.name,
        price: basePrice + variant.additionalPrice,
        cost: product.cost,
        taxRate: product.taxId == null ? 0 : (taxMap[product.taxId] ?? 0),
        taxMethod: product.taxMethod,
        warehouseQty: stock,
        image: product.image,
        source: ProductSource.local,
        isBatch: product.isBatch,
        maxPrice: product.maxPrice,
      );
    }

    final product = await (_db.select(_db.products)
          ..where((p) => p.code.equals(code)))
        .getSingleOrNull();

    Product? matched = product;
    if (matched == null) {
      matched = await (_db.select(_db.products)
            ..where((p) => p.altCode.equals(code)))
          .getSingleOrNull();
    }
    if (matched == null) return null;

    final taxMap = await _taxRateMap({matched.taxId});
    final stock = await _stockQtyForProduct(
      productId: matched.id,
      warehouseId: warehouseId,
      variantId: null,
      isBatch: matched.isBatch,
    );
    final basePrice = _resolvePrice(
      matched.price,
      matched.wholesalePrice,
      priceType,
    );
    return ScannedProduct(
      productId: matched.id,
      variantId: null,
      code: matched.code,
      name: matched.name,
      price: basePrice,
      cost: matched.cost,
      taxRate: matched.taxId == null ? 0 : (taxMap[matched.taxId] ?? 0),
      taxMethod: matched.taxMethod,
      warehouseQty: stock,
      image: matched.image,
      source: ProductSource.local,
      isBatch: matched.isBatch,
      maxPrice: matched.maxPrice,
    );
  }

  /// Batches with warehouse qty for batch-tracked products.
  Future<List<ProductBatchOption>> listBatchOptions({
    required int productId,
    required int warehouseId,
  }) async {
    final fromWarehouse = await _batchOptionsFromWarehouseStock(
      productId: productId,
      warehouseId: warehouseId,
    );
    if (fromWarehouse.isNotEmpty) return fromWarehouse;
    return _batchOptionsFromCatalog(
      productId: productId,
      warehouseId: warehouseId,
    );
  }

  Future<List<ProductBatchOption>> _batchOptionsFromWarehouseStock({
    required int productId,
    required int warehouseId,
  }) async {
    final product = await (_db.select(_db.products)
          ..where((p) => p.id.equals(productId)))
        .getSingleOrNull();

    final stockRows = await (_db.select(_db.productStock)
          ..where(
            (s) =>
                s.warehouseId.equals(warehouseId) &
                s.productId.equals(productId) &
                s.productBatchId.isNotNull() &
                s.qty.isBiggerThanValue(0),
          ))
        .get();
    if (stockRows.isEmpty) return [];

    final batchIds =
        stockRows.map((s) => s.productBatchId!).toSet().toList();
    final batchRows = await (_db.select(_db.productBatches)
          ..where((b) => b.id.isIn(batchIds)))
        .get();
    final batchById = {for (final b in batchRows) b.id: b};

    final today = _today;
    final qtyByBatch = <int, double>{};
    final batchNoById = <int, String>{};
    final expiryById = <int, String?>{};
    final priceByBatch = <int, double?>{};
    final maxPriceByBatch = <int, double?>{};

    for (final stock in stockRows) {
      final batchId = stock.productBatchId;
      if (batchId == null) continue;

      final batch = batchById[batchId];
      if (batch != null && _isBatchExpired(batch.expiredDate, today)) {
        continue;
      }

      qtyByBatch[batchId] = (qtyByBatch[batchId] ?? 0) + stock.qty;
      batchNoById[batchId] = batch?.batchNo ?? 'Batch #$batchId';
      expiryById[batchId] = batch?.expiredDate;
      if (stock.price != null && stock.price! > 0) {
        priceByBatch[batchId] = stock.price;
      }
      if (stock.maxPrice != null && stock.maxPrice! > 0) {
        maxPriceByBatch[batchId] = stock.maxPrice;
      }
    }

    return _sortBatchOptions(
      qtyByBatch.entries
          .map(
            (e) => ProductBatchOption(
              batchId: e.key,
              batchNo: batchNoById[e.key] ?? 'Batch #${e.key}',
              qty: e.value,
              expiredDate: expiryById[e.key],
              price: priceByBatch[e.key] ?? product?.price,
              maxPrice: maxPriceByBatch[e.key] ?? product?.maxPrice,
            ),
          )
          .toList(),
    );
  }

  Future<List<ProductBatchOption>> _batchOptionsFromCatalog({
    required int productId,
    required int warehouseId,
  }) async {
    final product = await (_db.select(_db.products)
          ..where((p) => p.id.equals(productId)))
        .getSingleOrNull();

    final batchRows = await (_db.select(_db.productBatches)
          ..where(
            (b) =>
                b.productId.equals(productId) & b.qty.isBiggerThanValue(0),
          ))
        .get();
    if (batchRows.isEmpty) return [];

    final today = _today;
    final options = <ProductBatchOption>[];

    for (final batch in batchRows) {
      if (_isBatchExpired(batch.expiredDate, today)) continue;

      final warehouseRows = await (_db.select(_db.productStock)
            ..where(
              (s) =>
                  s.warehouseId.equals(warehouseId) &
                  s.productId.equals(productId) &
                  s.productBatchId.equals(batch.id),
            ))
          .get();
      final warehouseQty = warehouseRows.fold<double>(
        0,
        (sum, row) => sum + row.qty,
      );
      final qty = warehouseQty > 0 ? warehouseQty : batch.qty;
      if (qty <= 0) continue;

      double? batchPrice;
      double? batchMaxPrice;
      for (final row in warehouseRows) {
        if (row.price != null && row.price! > 0) {
          batchPrice = row.price;
        }
        if (row.maxPrice != null && row.maxPrice! > 0) {
          batchMaxPrice = row.maxPrice;
        }
      }

      options.add(
        ProductBatchOption(
          batchId: batch.id,
          batchNo: batch.batchNo,
          qty: qty,
          expiredDate: batch.expiredDate,
          price: batchPrice ?? product?.price,
          maxPrice: batchMaxPrice ?? product?.maxPrice,
        ),
      );
    }

    return _sortBatchOptions(options);
  }

  List<ProductBatchOption> _sortBatchOptions(List<ProductBatchOption> options) {
    final sorted = List<ProductBatchOption>.from(options);
    sorted.sort((a, b) {
      final aExp = a.expiredDate ?? '';
      final bExp = b.expiredDate ?? '';
      if (aExp.isEmpty && bExp.isEmpty) {
        return a.batchNo.compareTo(b.batchNo);
      }
      if (aExp.isEmpty) return 1;
      if (bExp.isEmpty) return -1;
      return aExp.compareTo(bExp);
    });
    return sorted;
  }

  Future<Map<String, double>> _batchStockQty({
    required int warehouseId,
    required List<(int productId, int? variantId)> keys,
    Map<int, bool>? isBatchByProductId,
  }) async {
    if (keys.isEmpty) return {};

    final productIds = keys.map((k) => k.$1).toSet().toList();
    final rows = await (_db.select(_db.productStock)
          ..where(
            (s) =>
                s.warehouseId.equals(warehouseId) &
                s.productId.isIn(productIds),
          ))
        .get();

    final totals = <String, double>{};
    for (final key in keys) {
      final mapKey = '${key.$1}_${key.$2 ?? 0}';
      final isBatch = isBatchByProductId?[key.$1] ?? false;
      if (isBatch && key.$2 == null) {
        totals[mapKey] = await _warehouseBatchStockTotal(
          productId: key.$1,
          warehouseId: warehouseId,
        );
        continue;
      }
      if (key.$2 != null) {
        totals[mapKey] = rows
            .where((r) => r.productId == key.$1 && r.variantId == key.$2)
            .fold<double>(0, (sum, r) => sum + r.qty);
      } else {
        totals[mapKey] = rows
            .where(
              (r) =>
                  r.productId == key.$1 &&
                  r.variantId == null &&
                  r.productBatchId == null,
            )
            .fold<double>(0, (sum, r) => sum + r.qty);
      }
    }
    return totals;
  }

  /// Batch stock lookup for checkout validation (one query per cart).
  Future<Map<String, double>> getWarehouseQtyBatch({
    required int warehouseId,
    required List<({
      int productId,
      int? variantId,
      int? productBatchId,
    })> keys,
  }) async {
    if (keys.isEmpty) return {};

    final batchKeys = keys.where((k) => k.productBatchId != null).toList();
    final otherKeys = keys.where((k) => k.productBatchId == null).toList();
    final result = <String, double>{};

    for (final k in batchKeys) {
      final mapKey =
          '${k.productId}_${k.variantId ?? 0}_${k.productBatchId}';
      result[mapKey] = await getWarehouseQty(
        warehouseId: warehouseId,
        productId: k.productId,
        variantId: k.variantId,
        productBatchId: k.productBatchId,
      );
    }

    if (otherKeys.isEmpty) return result;

    final productIds = otherKeys.map((k) => k.productId).toSet().toList();
    final products = await (_db.select(_db.products)
          ..where((p) => p.id.isIn(productIds)))
        .get();
    final isBatchById = {for (final p in products) p.id: p.isBatch};

    final stockRows = await (_db.select(_db.productStock)
          ..where(
            (s) =>
                s.warehouseId.equals(warehouseId) &
                s.productId.isIn(productIds),
          ))
        .get();

    for (final k in otherKeys) {
      final mapKey = '${k.productId}_${k.variantId ?? 0}';
      if (result.containsKey(mapKey)) continue;

      final isBatch = isBatchById[k.productId] ?? false;
      if (isBatch && k.variantId == null) {
        result[mapKey] = await _warehouseBatchStockTotal(
          productId: k.productId,
          warehouseId: warehouseId,
        );
        continue;
      }

      if (k.variantId != null) {
        result[mapKey] = stockRows
            .where((r) => r.productId == k.productId && r.variantId == k.variantId)
            .fold<double>(0, (sum, r) => sum + r.qty);
      } else if (isBatch) {
        result[mapKey] = stockRows
            .where(
              (r) =>
                  r.productId == k.productId &&
                  r.productBatchId != null,
            )
            .fold<double>(0, (sum, r) => sum + r.qty);
      } else {
        result[mapKey] = stockRows
            .where(
              (r) =>
                  r.productId == k.productId &&
                  r.variantId == null &&
                  r.productBatchId == null,
            )
            .fold<double>(0, (sum, r) => sum + r.qty);
      }
    }

    return result;
  }

  /// Available warehouse quantity for a product (matches search/grid logic).
  Future<double> getWarehouseQty({
    required int warehouseId,
    required int productId,
    int? variantId,
    int? productBatchId,
  }) async {
    if (productBatchId != null) {
      final rows = await (_db.select(_db.productStock)
            ..where(
              (s) =>
                  s.warehouseId.equals(warehouseId) &
                  s.productId.equals(productId) &
                  s.productBatchId.equals(productBatchId),
            ))
          .get();
      return rows.fold<double>(0, (sum, r) => sum + r.qty);
    }
    if (variantId != null) {
      return _stockQty(productId, warehouseId, variantId);
    }
    final product = await (_db.select(_db.products)
          ..where((p) => p.id.equals(productId)))
        .getSingleOrNull();
    if (product?.isBatch == true) {
      return _warehouseBatchStockTotal(
        productId: productId,
        warehouseId: warehouseId,
      );
    }
    return _totalStockQty(productId, warehouseId);
  }

  Future<double> _stockQty(
    int productId,
    int warehouseId,
    int? variantId, {
    bool isBatch = false,
  }) async {
    if (variantId != null) {
      final rows = await (_db.select(_db.productStock)
            ..where((s) =>
                s.productId.equals(productId) &
                s.warehouseId.equals(warehouseId) &
                s.variantId.equals(variantId)))
          .get();
      return rows.fold<double>(0, (sum, r) => sum + r.qty);
    }

    final rows = await (_db.select(_db.productStock)
          ..where((s) =>
              s.productId.equals(productId) &
              s.warehouseId.equals(warehouseId) &
              s.variantId.isNull()))
        .get();
    if (isBatch) {
      return rows
          .where((r) => r.productBatchId != null)
          .fold<double>(0, (sum, r) => sum + r.qty);
    }
    return rows
        .where((r) => r.productBatchId == null)
        .fold<double>(0, (sum, r) => sum + r.qty);
  }

  double _resolvePrice(double retail, double wholesale, String priceType) {
    if (priceType == 'wholesale' && wholesale > 0) return wholesale;
    return retail;
  }

  Future<CartLineEditContext?> loadCartLineEditContext({
    required int productId,
    int? variantId,
  }) async {
    final product = await (_db.select(_db.products)
          ..where((p) => p.id.equals(productId)))
        .getSingleOrNull();
    if (product == null) return null;

    var additional = 0.0;
    if (variantId != null) {
      final variant = await (_db.select(_db.productVariants)
            ..where(
              (v) =>
                  v.productId.equals(productId) & v.variantId.equals(variantId),
            ))
          .getSingleOrNull();
      additional = variant?.additionalPrice ?? 0;
    }

    final retail = product.price + additional;
    final wholesale = product.wholesalePrice + additional;
    final units = await _unitChainForProduct(product);
    final priceOptions = <CartLinePriceOption>[
      CartLinePriceOption(label: 'Retail', basePrice: retail),
      if (wholesale > 0)
        CartLinePriceOption(label: 'Wholesale', basePrice: wholesale),
      if (product.maxPrice != null && product.maxPrice! > 0)
        CartLinePriceOption(label: 'Max', basePrice: product.maxPrice!),
    ];

    return CartLineEditContext(
      productType: product.type,
      retailPrice: retail,
      wholesalePrice: wholesale,
      units: units,
      priceOptions: priceOptions,
    );
  }

  Future<List<CartLineUnitOption>> _unitChainForProduct(Product product) async {
    final allUnits = await _db.select(_db.units).get();
    if (allUnits.isEmpty) {
      return const [
        CartLineUnitOption(name: 'Piece', operator: '*', operationValue: 1),
      ];
    }

    final byId = {for (final u in allUnits) u.id: u};
    final chain = <CartLineUnitOption>[];
    var currentId = product.saleUnitId ?? product.unitId;

    while (currentId != null && byId.containsKey(currentId)) {
      final unit = byId[currentId]!;
      chain.add(
        CartLineUnitOption(
          name: unit.unitName,
          operator: unit.operator ?? '*',
          operationValue: unit.operationValue,
        ),
      );
      currentId = unit.baseUnit;
    }

    if (chain.isEmpty) {
      return const [
        CartLineUnitOption(name: 'Piece', operator: '*', operationValue: 1),
      ];
    }
    return chain;
  }
}

class _SearchCandidate {
  const _SearchCandidate({
    required this.product,
    required this.code,
    this.variantId,
    this.additionalPrice = 0,
  });

  final Product product;
  final int? variantId;
  final String code;
  final double additionalPrice;
}
