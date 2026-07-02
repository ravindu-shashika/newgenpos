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
      inStockCount: row.read<int>('in_stock_count'),
      recentUpdateCount: row.read<int>('recent_update_count'),
    );
  }

  Future<InventoryListPage> loadPage({
    int? warehouseId,
    String search = '',
    int offset = 0,
    int limit = 4,
  }) async {
    final term = search.trim();
    List<int>? searchIds;
    if (term.length >= 2) {
      searchIds = await _searchProductIds(term);
      if (searchIds.isEmpty) {
        return const InventoryListPage(items: [], totalCount: 0);
      }
    }

    final warehouseScoped = warehouseId != null;
    final searchFilterSql = searchIds == null
        ? ''
        : 'AND p.id IN (${List.filled(searchIds.length, '?').join(', ')})';

    final baseVars = <Variable>[
      if (warehouseScoped) Variable<int>(warehouseId),
      if (searchIds != null) ...searchIds.map(Variable<int>.new),
    ];

    final countRow = await _db
        .customSelect(
          ProductCatalogSql.inventoryCountSql(
            warehouseScoped: warehouseScoped,
            searchFilterSql: searchFilterSql,
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
            searchFilterSql: searchFilterSql,
          ),
          variables: [
            ...baseVars,
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

  Future<List<int>> _searchProductIds(String term) async {
    final ids = <int>{};

    final ftsMatch = ProductCatalogSql.ftsMatchExpression(term);
    if (ftsMatch != null) {
      try {
        ids.addAll(
          await _db.searchProductIdsFts(
            matchExpression: ftsMatch,
            limit: _searchIdCap,
          ),
        );
      } catch (_) {}
    }

    if (ids.length < _searchIdCap) {
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
        ids.add(row.read<int>('product_id'));
        if (ids.length >= _searchIdCap) break;
      }
    }

    if (ids.length < _searchIdCap && _isCodeLikeTerm(term)) {
      final prefix = '${term.replaceAll('%', '').replaceAll('_', '')}%';
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
        ids.add(row.read<int>('product_id'));
        if (ids.length >= _searchIdCap) break;
      }
    }

    return ids.toList();
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
