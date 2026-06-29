import '../../../core/database/app_database.dart';
import '../models/inventory_models.dart';

class InventoryService {
  InventoryService(this._db);

  final AppDatabase _db;
  static const lowStockThreshold = 10.0;

  Future<InventoryOverview> load({int? warehouseId}) async {
    final products = await _db.select(_db.products).get();
    final categories = await _db.select(_db.categories).get();
    final categoryNames = {for (final c in categories) c.id: c.name};

    final stockQuery = _db.select(_db.productStock);
    final stockRows = warehouseId == null
        ? await stockQuery.get()
        : await (stockQuery..where((s) => s.warehouseId.equals(warehouseId)))
            .get();

    final qtyByProduct = <int, double>{};
    for (final row in stockRows) {
      qtyByProduct[row.productId] =
          (qtyByProduct[row.productId] ?? 0) + row.qty;
    }

    final items = <InventoryItemRow>[];
    for (final product in products) {
      final qty = qtyByProduct[product.id] ?? 0;
      final status = _statusForQty(qty);
      items.add(
        InventoryItemRow(
          productId: product.id,
          name: product.name,
          code: product.code,
          categoryName: product.categoryId == null
              ? '—'
              : (categoryNames[product.categoryId] ?? 'Category'),
          qty: qty,
          price: product.price,
          status: status,
          statusLabel: _statusLabel(status),
          statusDetail: _statusDetail(status, qty),
        ),
      );
    }

    items.sort((a, b) {
      final rank = _statusRank(a.status).compareTo(_statusRank(b.status));
      if (rank != 0) return rank;
      return a.name.toLowerCase().compareTo(b.name.toLowerCase());
    });

    final lowStockCount =
        items.where((i) => i.isLowStock || i.isOutOfStock).length;
    final inStockCount = items.where((i) => i.isInStock).length;
    final recentUpdateCount = products
        .where((p) => p.updatedAt?.trim().isNotEmpty == true)
        .length;

    return InventoryOverview(
      totalItems: products.length,
      lowStockCount: lowStockCount,
      inStockCount: inStockCount,
      recentUpdateCount: recentUpdateCount,
      items: items,
    );
  }

  InventoryStockStatus _statusForQty(double qty) {
    if (qty <= 0) return InventoryStockStatus.outOfStock;
    if (qty <= lowStockThreshold) return InventoryStockStatus.lowStock;
    return InventoryStockStatus.inStock;
  }

  int _statusRank(InventoryStockStatus status) {
    switch (status) {
      case InventoryStockStatus.outOfStock:
        return 0;
      case InventoryStockStatus.lowStock:
        return 1;
      case InventoryStockStatus.inStock:
        return 2;
    }
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
