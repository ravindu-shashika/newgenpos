import 'package:drift/drift.dart';

import '../../../core/database/app_database.dart';
import '../../../core/database/product_catalog_sql.dart';
import '../models/inventory_models.dart';

class InventoryService {
  InventoryService(this._db);

  final AppDatabase _db;
  static const lowStockThreshold = 10.0;
  static const _searchIdCap = 2000;

  Future<InventorySummary> loadSummary({int? warehouseId}) async {
    final warehouseScoped = warehouseId != null;
    final variables = <Variable>[
      if (warehouseScoped) Variable<int>(warehouseId),
      Variable<double>(lowStockThreshold),
      Variable<double>(lowStockThreshold),
    ];

    final row = await _db
        .customSelect(
          ProductCatalogSql.inventorySummarySql(warehouseScoped: warehouseScoped),
          variables: variables,
          readsFrom: {_db.products, _db.productStock},
        )
        .getSingle();

    return InventorySummary(
      totalItems: row.read<int>('total_items'),
      lowStockCount: row.read<int>('low_stock_count'),
      outOfStockCount: row.read<int>('out_of_stock_count'),
      inStockCount: row.read<int>('in_stock_count'),
      recentUpdateCount: row.read<int>('recent_update_count'),
    );
  }

  Future<InventoryListPage> loadPage({
    int? warehouseId,
    String search = '',
    int offset = 0,
    int limit = 4,
    InventoryStockFilter stockFilter = InventoryStockFilter.all,
  }) async {
    final term = search.trim();
    if (term.length >= 2) {
      return _loadSearchPage(
        warehouseId: warehouseId,
        term: term,
        offset: offset,
        limit: limit,
        stockFilter: stockFilter,
      );
    }

    return _loadBrowsePage(
      warehouseId: warehouseId,
      offset: offset,
      limit: limit,
      stockFilter: stockFilter,
    );
  }

  String _stockFilterSql(InventoryStockFilter filter) {
    switch (filter) {
      case InventoryStockFilter.all:
        return '';
      case InventoryStockFilter.outOfStock:
        return 'AND COALESCE(pq.qty, 0) <= 0';
      case InventoryStockFilter.lowStock:
        return 'AND COALESCE(pq.qty, 0) > 0 AND COALESCE(pq.qty, 0) <= ?';
    }
  }

  List<Variable> _stockFilterVars(InventoryStockFilter filter) {
    switch (filter) {
      case InventoryStockFilter.all:
      case InventoryStockFilter.outOfStock:
        return const [];
      case InventoryStockFilter.lowStock:
        return [Variable<double>(lowStockThreshold)];
    }
  }

  /// Default browse: one row per product (qty aggregated).
  Future<InventoryListPage> _loadBrowsePage({
    int? warehouseId,
    required int offset,
    required int limit,
    InventoryStockFilter stockFilter = InventoryStockFilter.all,
  }) async {
    final warehouseScoped = warehouseId != null;
    final stockSql = _stockFilterSql(stockFilter);
    final stockVars = _stockFilterVars(stockFilter);
    final baseVars = <Variable>[
      if (warehouseScoped) Variable<int>(warehouseId),
      ...stockVars,
    ];

    final countRow = await _db
        .customSelect(
          ProductCatalogSql.inventoryCountSql(
            warehouseScoped: warehouseScoped,
            searchFilterSql: stockSql,
          ),
          variables: baseVars,
          readsFrom: {_db.products, _db.productStock, _db.categories},
        )
        .getSingle();
    final totalCount = countRow.read<int>('cnt');

    if (totalCount == 0 || offset >= totalCount) {
      return InventoryListPage(items: const [], totalCount: totalCount);
    }

    final rows = await _db
        .customSelect(
          ProductCatalogSql.inventoryPageSql(
            warehouseScoped: warehouseScoped,
            searchFilterSql: stockSql,
          ),
          variables: [
            if (warehouseScoped) Variable<int>(warehouseId),
            ...stockVars,
            Variable<double>(lowStockThreshold),
            Variable<int>(limit),
            Variable<int>(offset),
          ],
          readsFrom: {_db.products, _db.productStock, _db.categories},
        )
        .get();

    final items = rows.map((row) {
      final qty = row.read<double>('qty');
      final status = _statusForQty(qty);
      return InventoryItemRow(
        productId: row.read<int>('product_id'),
        name: row.read<String>('name'),
        code: row.read<String>('code'),
        categoryName: row.read<String>('category_name'),
        qty: qty,
        price: row.read<double>('price'),
        status: status,
        statusLabel: _statusLabel(status),
        statusDetail: _statusDetail(status, qty),
      );
    }).toList();

    return InventoryListPage(items: items, totalCount: totalCount);
  }

  /// Search: base product code → all variants; specific variant SKU → that only.
  Future<InventoryListPage> _loadSearchPage({
    int? warehouseId,
    required String term,
    required int offset,
    required int limit,
    InventoryStockFilter stockFilter = InventoryStockFilter.all,
  }) async {
    final hits = await _searchHits(term);
    if (hits.isEmpty) {
      return const InventoryListPage(items: [], totalCount: 0);
    }

    final allProductIds = hits.allProductIds;
    final products = await (_db.select(_db.products)
          ..where((p) => p.id.isIn(allProductIds)))
        .get();
    if (products.isEmpty) {
      return const InventoryListPage(items: [], totalCount: 0);
    }

    final byId = {for (final p in products) p.id: p};
    final categoryIds =
        products.map((p) => p.categoryId).whereType<int>().toSet().toList();
    final categoryById = <int, String>{};
    if (categoryIds.isNotEmpty) {
      final cats = await (_db.select(_db.categories)
            ..where((c) => c.id.isIn(categoryIds)))
          .get();
      for (final c in cats) {
        categoryById[c.id] = c.name;
      }
    }

    final variants = await (_db.select(_db.productVariants)
          ..where((v) => v.productId.isIn(allProductIds)))
        .get();
    final variantsByProduct = <int, List<ProductVariant>>{};
    for (final v in variants) {
      variantsByProduct.putIfAbsent(v.productId, () => []).add(v);
    }

    final expanded = <_InventoryCandidate>[];
    final seenKeys = <String>{};

    void addCandidate(_InventoryCandidate c) {
      final key = '${c.product.id}_${c.variantId ?? 0}';
      if (seenKeys.contains(key)) return;
      seenKeys.add(key);
      expanded.add(c);
    }

    for (final id in hits.expandAllProductIds) {
      final product = byId[id];
      if (product == null) continue;
      final productVariants = variantsByProduct[id] ?? const [];
      if (productVariants.isEmpty) {
        addCandidate(
          _InventoryCandidate(
            product: product,
            variantId: null,
            code: product.code,
            additionalPrice: 0,
          ),
        );
        continue;
      }
      final sorted = List<ProductVariant>.from(productVariants)
        ..sort((a, b) => a.itemCode.compareTo(b.itemCode));
      for (final v in sorted) {
        addCandidate(
          _InventoryCandidate(
            product: product,
            variantId: v.variantId,
            code: v.itemCode,
            additionalPrice: v.additionalPrice,
          ),
        );
      }
    }

    for (final v in hits.matchedVariants) {
      if (hits.expandAllProductIds.contains(v.productId)) continue;
      final product = byId[v.productId];
      if (product == null) continue;
      addCandidate(
        _InventoryCandidate(
          product: product,
          variantId: v.variantId,
          code: v.itemCode,
          additionalPrice: v.additionalPrice,
        ),
      );
    }

    expanded.sort((a, b) {
      final byName = a.product.name.compareTo(b.product.name);
      if (byName != 0) return byName;
      return a.code.compareTo(b.code);
    });

    final qtyByKey = await _qtyByKey(
      warehouseId: warehouseId,
      keys: [
        for (final c in expanded) (c.product.id, c.variantId),
      ],
    );

    final filtered = <({_InventoryCandidate c, double qty})>[];
    for (final c in expanded) {
      final qty = qtyByKey['${c.product.id}_${c.variantId ?? 0}'] ?? 0;
      if (!_matchesStockFilter(qty, stockFilter)) continue;
      filtered.add((c: c, qty: qty));
    }

    final totalCount = filtered.length;
    if (totalCount == 0 || offset >= totalCount) {
      return InventoryListPage(items: const [], totalCount: totalCount);
    }

    final pageSlice = filtered.skip(offset).take(limit).toList();
    final items = <InventoryItemRow>[];
    for (final entry in pageSlice) {
      final c = entry.c;
      final qty = entry.qty;
      final status = _statusForQty(qty);
      final categoryName = c.product.categoryId == null
          ? '—'
          : (categoryById[c.product.categoryId] ?? '—');
      items.add(
        InventoryItemRow(
          productId: c.product.id,
          variantId: c.variantId,
          name: c.product.name,
          code: c.code,
          categoryName: categoryName,
          qty: qty,
          price: c.product.price + c.additionalPrice,
          status: status,
          statusLabel: _statusLabel(status),
          statusDetail: _statusDetail(status, qty),
        ),
      );
    }

    return InventoryListPage(items: items, totalCount: totalCount);
  }

  bool _matchesStockFilter(double qty, InventoryStockFilter filter) {
    switch (filter) {
      case InventoryStockFilter.all:
        return true;
      case InventoryStockFilter.outOfStock:
        return qty <= 0;
      case InventoryStockFilter.lowStock:
        return qty > 0 && qty <= lowStockThreshold;
    }
  }

  Future<Map<String, double>> _qtyByKey({
    int? warehouseId,
    required List<(int productId, int? variantId)> keys,
  }) async {
    if (keys.isEmpty) return {};

    final productIds = keys.map((k) => k.$1).toSet().toList();
    final query = _db.select(_db.productStock)
      ..where((s) => s.productId.isIn(productIds));
    if (warehouseId != null) {
      query.where((s) => s.warehouseId.equals(warehouseId));
    }
    final rows = await query.get();

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

  Future<_InventorySearchHits> _searchHits(String term) async {
    final expandAll = <int>{};
    final expandOrdered = <int>[];
    final matchedVariants = <ProductVariant>[];
    final variantKeys = <String>{};
    final codeLike = _isCodeLikeTerm(term);

    void expandProduct(int id) {
      if (expandAll.add(id)) expandOrdered.add(id);
    }

    // Code / SKU first so exact variant hits are not widened by FTS.
    if (codeLike) {
      final escaped = term.replaceAll('%', '').replaceAll('_', '');
      final prefix = '$escaped%';

      final codeRows = await _db
          .customSelect(
            ProductCatalogSql.inventoryCodePrefixSql,
            variables: [
              Variable<String>(prefix),
              Variable<String>(prefix),
              Variable<int>(_searchIdCap),
            ],
            readsFrom: {_db.products},
          )
          .get();
      for (final row in codeRows) {
        expandProduct(row.read<int>('product_id'));
        if (expandOrdered.length >= _searchIdCap) break;
      }

      // Exact variant SKU first; else prefix only (not contains — avoids XL vs L).
      var variantRows = await (_db.select(_db.productVariants)
            ..where((v) => v.itemCode.equals(escaped))
            ..limit(_searchIdCap))
          .get();
      final exactVariantHit = variantRows.isNotEmpty;
      if (variantRows.isEmpty) {
        variantRows = await (_db.select(_db.productVariants)
              ..where((v) => v.itemCode.like(prefix))
              ..limit(_searchIdCap))
            .get();
      }
      for (final v in variantRows) {
        if (expandAll.contains(v.productId)) continue;
        final key = '${v.productId}_${v.variantId ?? 0}';
        if (!variantKeys.add(key)) continue;
        matchedVariants.add(v);
      }

      // Exact/prefix SKU or product-code hit: skip FTS/category widening.
      if (expandOrdered.isNotEmpty ||
          matchedVariants.isNotEmpty ||
          exactVariantHit) {
        return _InventorySearchHits(
          expandAllProductIds: expandOrdered,
          matchedVariants: matchedVariants,
        );
      }
    }

    final ftsMatch = ProductCatalogSql.ftsMatchExpression(term);
    if (ftsMatch != null) {
      try {
        for (final id in await _db.searchProductIdsFts(
          matchExpression: ftsMatch,
          limit: _searchIdCap,
        )) {
          expandProduct(id);
          if (expandOrdered.length >= _searchIdCap) break;
        }
      } catch (_) {}
    }

    if (expandOrdered.length < _searchIdCap) {
      final categoryRows = await _db
          .customSelect(
            ProductCatalogSql.inventoryCategorySearchSql,
            variables: [
              Variable<String>(term),
              Variable<int>(_searchIdCap),
            ],
            readsFrom: {_db.products, _db.categories},
          )
          .get();
      for (final row in categoryRows) {
        expandProduct(row.read<int>('product_id'));
        if (expandOrdered.length >= _searchIdCap) break;
      }
    }

    return _InventorySearchHits(
      expandAllProductIds: expandOrdered,
      matchedVariants: matchedVariants,
    );
  }

  bool _isCodeLikeTerm(String term) =>
      !term.contains(' ') && RegExp(r'^[A-Za-z0-9\-]+$').hasMatch(term);

  InventoryStockStatus _statusForQty(double qty) {
    if (qty <= 0) return InventoryStockStatus.outOfStock;
    if (qty <= lowStockThreshold) return InventoryStockStatus.lowStock;
    return InventoryStockStatus.inStock;
  }

  String _statusLabel(InventoryStockStatus status) {
    switch (status) {
      case InventoryStockStatus.inStock:
        return 'In Stock';
      case InventoryStockStatus.lowStock:
        return 'Low Stock';
      case InventoryStockStatus.outOfStock:
        return 'Out of Stock';
    }
  }

  String _statusDetail(InventoryStockStatus status, double qty) {
    final qtyLabel = qty == qty.roundToDouble()
        ? qty.toInt().toString()
        : qty.toStringAsFixed(1);
    switch (status) {
      case InventoryStockStatus.inStock:
        return '$qtyLabel units available';
      case InventoryStockStatus.lowStock:
        return 'Only $qtyLabel left';
      case InventoryStockStatus.outOfStock:
        return 'Reorder required';
    }
  }
}

class _InventorySearchHits {
  const _InventorySearchHits({
    required this.expandAllProductIds,
    required this.matchedVariants,
  });

  final List<int> expandAllProductIds;
  final List<ProductVariant> matchedVariants;

  bool get isEmpty =>
      expandAllProductIds.isEmpty && matchedVariants.isEmpty;

  List<int> get allProductIds {
    final ids = <int>{...expandAllProductIds};
    for (final v in matchedVariants) {
      ids.add(v.productId);
    }
    return ids.toList();
  }
}

class _InventoryCandidate {
  const _InventoryCandidate({
    required this.product,
    required this.code,
    required this.additionalPrice,
    this.variantId,
  });

  final Product product;
  final int? variantId;
  final String code;
  final double additionalPrice;
}
