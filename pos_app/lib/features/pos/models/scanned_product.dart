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
    this.isBatch = false,
    this.productBatchId,
    this.batchNo,
    this.maxPrice,
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
  final bool isBatch;
  final int? productBatchId;
  final String? batchNo;
  final double? maxPrice;

  ScannedProduct copyWith({
    int? productId,
    int? variantId,
    String? code,
    String? name,
    double? price,
    double? taxRate,
    int? taxMethod,
    double? warehouseQty,
    String? image,
    ProductSource? source,
    bool? isBatch,
    int? productBatchId,
    String? batchNo,
    double? maxPrice,
  }) {
    return ScannedProduct(
      productId: productId ?? this.productId,
      variantId: variantId ?? this.variantId,
      code: code ?? this.code,
      name: name ?? this.name,
      price: price ?? this.price,
      taxRate: taxRate ?? this.taxRate,
      taxMethod: taxMethod ?? this.taxMethod,
      warehouseQty: warehouseQty ?? this.warehouseQty,
      image: image ?? this.image,
      source: source ?? this.source,
      isBatch: isBatch ?? this.isBatch,
      productBatchId: productBatchId ?? this.productBatchId,
      batchNo: batchNo ?? this.batchNo,
      maxPrice: maxPrice ?? this.maxPrice,
    );
  }

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
      isBatch: map['is_batch'] == true || map['is_batch'] == 1,
      productBatchId: _intOrNull(map['batch_id'] ?? map['product_batch_id']),
      batchNo: map['batch_no']?.toString(),
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

class ProductBatchOption {
  const ProductBatchOption({
    required this.batchId,
    required this.batchNo,
    required this.qty,
    this.expiredDate,
  });

  final int batchId;
  final String batchNo;
  final double qty;
  final String? expiredDate;
}

enum ProductSource { local, remote }
