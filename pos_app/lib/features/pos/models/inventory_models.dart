enum InventoryStockStatus { inStock, lowStock, outOfStock }

class InventorySummary {
  const InventorySummary({
    required this.totalItems,
    required this.lowStockCount,
    required this.inStockCount,
    required this.recentUpdateCount,
  });

  final int totalItems;
  final int lowStockCount;
  final int inStockCount;
  final int recentUpdateCount;
}

class InventoryListPage {
  const InventoryListPage({
    required this.items,
    required this.totalCount,
  });

  final List<InventoryItemRow> items;
  final int totalCount;
}

class InventoryListQuery {
  const InventoryListQuery({
    this.search = '',
    this.page = 0,
    this.pageSize = 4,
  });

  final String search;
  final int page;
  final int pageSize;

  @override
  bool operator ==(Object other) {
    return other is InventoryListQuery &&
        other.search == search &&
        other.page == page &&
        other.pageSize == pageSize;
  }

  @override
  int get hashCode => Object.hash(search, page, pageSize);
}

/// @deprecated Use [InventorySummary] + [InventoryListPage].
class InventoryOverview {
  const InventoryOverview({
    required this.totalItems,
    required this.lowStockCount,
    required this.inStockCount,
    required this.recentUpdateCount,
    required this.items,
  });

  final int totalItems;
  final int lowStockCount;
  final int inStockCount;
  final int recentUpdateCount;
  final List<InventoryItemRow> items;
}

class InventoryItemRow {
  const InventoryItemRow({
    required this.productId,
    required this.name,
    required this.code,
    required this.categoryName,
    required this.qty,
    required this.price,
    required this.status,
    required this.statusLabel,
    required this.statusDetail,
  });

  final int productId;
  final String name;
  final String code;
  final String categoryName;
  final double qty;
  final double price;
  final InventoryStockStatus status;
  final String statusLabel;
  final String statusDetail;

  bool get isLowStock => status == InventoryStockStatus.lowStock;
  bool get isOutOfStock => status == InventoryStockStatus.outOfStock;
  bool get isInStock => status == InventoryStockStatus.inStock;
}
