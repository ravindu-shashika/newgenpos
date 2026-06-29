class ScannedProduct {
  ScannedProduct({
    required this.productId,
    required this.code,
    required this.name,
    required this.price,
    required this.taxRate,
    required this.taxMethod,
    required this.warehouseQty,
    this.variantId,
    this.image,
    this.source = ProductSource.local,
  });

  final int productId;
  final int? variantId;
  final String code;
  final String name;
  final double price;
  final double taxRate;
  final int taxMethod;
  final double warehouseQty;
  final String? image;
  final ProductSource source;

  factory ScannedProduct.fromApiMap(Map<String, dynamic> map) {
    return ScannedProduct(
      productId: _int(map['product_id']),
      variantId: _intOrNull(map['variant_id'] ?? map['product_variant_id']),
      code: map['code']?.toString() ?? '',
      name: map['name']?.toString() ?? '',
      price: _dbl(map['price']),
      taxRate: _dbl(map['tax_rate']),
      taxMethod: _int(map['tax_method'], fallback: 1),
      warehouseQty: _dbl(map['warehouse_qty'] ?? map['qty']),
      image: map['image']?.toString() ?? map['base_image']?.toString(),
      source: ProductSource.remote,
    );
  }

  static int _int(dynamic v, {int fallback = 0}) {
    if (v is int) return v;
    return int.tryParse('$v') ?? fallback;
  }

  static int? _intOrNull(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    return int.tryParse('$v');
  }

  static double _dbl(dynamic v) {
    if (v is num) return v.toDouble();
    return double.tryParse('$v') ?? 0;
  }
}

// Re-export source enum for model file consumers
enum ProductSource { local, remote }
