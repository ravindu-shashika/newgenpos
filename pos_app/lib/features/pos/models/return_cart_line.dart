import 'return_models.dart';
import 'scanned_product.dart';

class ReturnCartLine {
  ReturnCartLine({
    required this.productId,
    required this.code,
    required this.name,
    required this.netUnitPrice,
    required this.taxRate,
    this.taxMethod = 1,
    this.variantId,
    this.productBatchId,
    this.batchNo,
    this.productSaleId,
    this.qty = 1,
    this.discount = 0,
    this.isDamage = false,
    this.saleUnit = 'pc',
    this.imeiNumber = '',
    this.stockQty,
    this.maxReturnableQty,
  });

  final int productId;
  final int? variantId;
  final int? productBatchId;
  final String? batchNo;
  final int? productSaleId;
  final String code;
  final String name;
  double qty;
  double netUnitPrice;
  final double discount;
  final double taxRate;
  final int taxMethod;
  bool isDamage;
  final String saleUnit;
  final String imeiNumber;
  final double? stockQty;
  final double? maxReturnableQty;

  String get lineKey =>
      'ret-$productId-${variantId ?? 0}-${productBatchId ?? 0}-'
      '${productSaleId ?? 0}-${code.hashCode}';

  double get lineTax {
    if (taxRate <= 0) return 0;
    if (taxMethod == 1) {
      return netUnitPrice * qty * taxRate / 100;
    }
    final grossUnit = netUnitPrice * (100 + taxRate) / 100;
    return (grossUnit - netUnitPrice) * qty;
  }

  double get subtotal => netUnitPrice * qty + lineTax;

  ReturnCartLine copyWith({
    double? qty,
    double? netUnitPrice,
    bool? isDamage,
  }) {
    return ReturnCartLine(
      productId: productId,
      variantId: variantId,
      productBatchId: productBatchId,
      batchNo: batchNo,
      productSaleId: productSaleId,
      code: code,
      name: name,
      netUnitPrice: netUnitPrice ?? this.netUnitPrice,
      discount: discount,
      taxRate: taxRate,
      taxMethod: taxMethod,
      qty: qty ?? this.qty,
      isDamage: isDamage ?? this.isDamage,
      saleUnit: saleUnit,
      imeiNumber: imeiNumber,
      stockQty: stockQty,
      maxReturnableQty: maxReturnableQty,
    );
  }

  factory ReturnCartLine.fromLookupLine(
    ReturnSaleLookupLine line, {
    required double qty,
    bool isDamage = false,
  }) {
    return ReturnCartLine(
      productId: line.productId,
      variantId: line.variantId,
      productBatchId: line.productBatchId,
      productSaleId: line.productSaleId,
      code: line.code,
      name: line.name,
      netUnitPrice: line.netUnitPrice,
      discount: line.discount,
      taxRate: line.taxRate,
      qty: qty,
      isDamage: isDamage,
      saleUnit: line.saleUnit,
      imeiNumber: line.imeiNumber,
      maxReturnableQty: line.returnableQty,
    );
  }

  factory ReturnCartLine.fromScannedProduct(
    ScannedProduct product, {
    double qty = 1,
    bool isDamage = false,
  }) {
    return ReturnCartLine(
      productId: product.productId,
      variantId: product.variantId,
      productBatchId: product.productBatchId,
      batchNo: product.batchNo,
      code: product.code,
      name: product.name,
      netUnitPrice: product.price,
      taxRate: product.taxRate,
      taxMethod: product.taxMethod,
      qty: qty,
      isDamage: isDamage,
      stockQty: product.warehouseQty,
    );
  }
}
