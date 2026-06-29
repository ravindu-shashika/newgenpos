import 'scanned_product.dart';

class ProductListPage {
  const ProductListPage({
    required this.items,
    required this.totalCount,
    required this.offset,
  });

  final List<ScannedProduct> items;
  final int totalCount;
  final int offset;

  bool get hasMore => offset + items.length < totalCount;
}
