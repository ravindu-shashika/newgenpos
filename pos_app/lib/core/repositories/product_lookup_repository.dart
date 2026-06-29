import 'package:drift/drift.dart';

import '../pos_http/pos_api_client.dart';
import '../database/app_database.dart';
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

  /// Paginated product grid — loads a slice sorted by name.
  Future<ProductListPage> listInStockPage({
    required int warehouseId,
    ProductGridFilter filter = ProductGridFilter.all,
    int filterId = 1,
    String priceType = 'retail',
    int offset = 0,
    int limit = 24,
  }) async {
    final stockRows = await (_db.select(_db.productStock)
          ..where((s) => s.warehouseId.equals(warehouseId))
          ..orderBy([(s) => OrderingTerm.asc(s.productId)]))
        .get();

    final qtyByKey = <String, double>{};
    final variantByKey = <String, int?>{};
    final productIds = <int>{};

    for (final stock in stockRows) {
      if (stock.qty <= 0) continue;
      final key = '${stock.productId}_${stock.variantId ?? 0}';
      qtyByKey[key] = (qtyByKey[key] ?? 0) + stock.qty;
      variantByKey[key] = stock.variantId;
      productIds.add(stock.productId);
    }

    if (productIds.isEmpty) {
      return const ProductListPage(items: [], totalCount: 0, offset: 0);
    }

    final productQuery = _filteredProductsQuery(
      productIds: productIds.toList(),
      filter: filter,
      filterId: filterId,
    );
    final productRows = await productQuery.get();
    final productsById = {for (final p in productRows) p.id: p};

    final sortedKeys = qtyByKey.keys.where((key) {
      final productId = int.parse(key.split('_').first);
      return productsById.containsKey(productId);
    }).toList()
      ..sort((a, b) {
        final nameA = productsById[int.parse(a.split('_').first)]!.name;
        final nameB = productsById[int.parse(b.split('_').first)]!.name;
        return nameA.compareTo(nameB);
      });

    final totalCount = sortedKeys.length;
    final pageKeys = sortedKeys.skip(offset).take(limit).toList();
    if (pageKeys.isEmpty) {
      return ProductListPage(
        items: const [],
        totalCount: totalCount,
        offset: offset,
      );
    }

    final variantMap = await _variantMapForKeys(pageKeys, variantByKey);
    final taxMap = await _taxRateMap(
      pageKeys
          .map((key) => productsById[int.parse(key.split('_').first)]!.taxId)
          .toSet(),
    );

    final items = <ScannedProduct>[];
    for (final key in pageKeys) {
      final productId = int.parse(key.split('_').first);
      final product = productsById[productId]!;
      final variantId = variantByKey[key];
      var code = product.code;
      var price =
          _resolvePrice(product.price, product.wholesalePrice, priceType);

      if (variantId != null) {
        final variant = variantMap['${productId}_$variantId'];
        if (variant != null) {
          code = variant.itemCode;
          price = _resolvePrice(
                product.price,
                product.wholesalePrice,
                priceType,
              ) +
              variant.additionalPrice;
        }
      }

      items.add(ScannedProduct(
        productId: product.id,
        variantId: variantId,
        code: code,
        name: product.name,
        price: price,
        taxRate: product.taxId == null ? 0 : (taxMap[product.taxId] ?? 0),
        taxMethod: product.taxMethod,
        warehouseQty: qtyByKey[key] ?? 0,
        image: product.image,
        source: ProductSource.local,
      ));
    }

    return ProductListPage(
      items: items,
      totalCount: totalCount,
      offset: offset,
    );
  }

  Selectable<Product> _filteredProductsQuery({
    required List<int> productIds,
    required ProductGridFilter filter,
    required int filterId,
  }) {
    switch (filter) {
      case ProductGridFilter.all:
        return _db.select(_db.products)
          ..where((p) => p.id.isIn(productIds));
      case ProductGridFilter.featured:
        return _db.select(_db.products)
          ..where((p) => p.id.isIn(productIds) & p.featured.equals(1));
      case ProductGridFilter.category:
        return _db.select(_db.products)
          ..where(
            (p) => p.id.isIn(productIds) & p.categoryId.equals(filterId),
          );
      case ProductGridFilter.brand:
        return _db.select(_db.products)
          ..where((p) => p.id.isIn(productIds) & p.brandId.equals(filterId));
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
            ..where((p) => p.code.like(prefix))
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
      final nameLike = '%$escaped%';
      final productRows = await (_db.select(_db.products)
            ..where((p) => p.name.like(nameLike) | p.code.like(nameLike))
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
          taxRate: c.product.taxId == null ? 0 : (taxMap[c.product.taxId] ?? 0),
          taxMethod: c.product.taxMethod,
          warehouseQty: stockMap['${c.product.id}_${c.variantId ?? 0}'] ?? 0,
          image: c.product.image,
          source: ProductSource.local,
        ),
      );
    }

    results.sort((a, b) => a.name.compareTo(b.name));
    return results;
  }

  bool _isCodeLikeTerm(String term) =>
      !term.contains(' ') && RegExp(r'^[A-Za-z0-9\-]+$').hasMatch(term);

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
      final stock = await _stockQty(
        product.id,
        warehouseId,
        variant.variantId,
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
        taxRate: product.taxId == null ? 0 : (taxMap[product.taxId] ?? 0),
        taxMethod: product.taxMethod,
        warehouseQty: stock,
        image: product.image,
        source: ProductSource.local,
      );
    }

    final product = await (_db.select(_db.products)
          ..where((p) => p.code.equals(code)))
        .getSingleOrNull();
    if (product == null) return null;

    final taxMap = await _taxRateMap({product.taxId});
    final stock = await _stockQty(product.id, warehouseId, null);
    final basePrice = _resolvePrice(
      product.price,
      product.wholesalePrice,
      priceType,
    );
    return ScannedProduct(
      productId: product.id,
      variantId: null,
      code: product.code,
      name: product.name,
      price: basePrice,
      taxRate: product.taxId == null ? 0 : (taxMap[product.taxId] ?? 0),
      taxMethod: product.taxMethod,
      warehouseQty: stock,
      image: product.image,
      source: ProductSource.local,
    );
  }

  Future<Map<String, double>> _batchStockQty({
    required int warehouseId,
    required List<(int productId, int? variantId)> keys,
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
      if (key.$2 != null) {
        totals[mapKey] = rows
            .where((r) => r.productId == key.$1 && r.variantId == key.$2)
            .fold<double>(0, (sum, r) => sum + r.qty);
      } else {
        totals[mapKey] = rows
            .where((r) => r.productId == key.$1)
            .fold<double>(0, (sum, r) => sum + r.qty);
      }
    }
    return totals;
  }

  /// Available warehouse quantity for a product (matches search/grid logic).
  Future<double> getWarehouseQty({
    required int warehouseId,
    required int productId,
    int? variantId,
  }) async {
    if (variantId != null) {
      return _stockQty(productId, warehouseId, variantId);
    }
    return _totalStockQty(productId, warehouseId);
  }

  Future<double> _stockQty(int productId, int warehouseId, int? variantId) async {
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
    return rows.fold<double>(0, (sum, r) => sum + r.qty);
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
