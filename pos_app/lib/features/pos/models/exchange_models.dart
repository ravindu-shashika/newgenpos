class ExchangeNewLine {
  const ExchangeNewLine({
    required this.productId,
    required this.code,
    required this.name,
    required this.qty,
    required this.netUnitPrice,
    required this.discount,
    required this.taxRate,
    required this.tax,
    required this.lineTotal,
    this.variantId,
    this.productBatchId,
    this.saleUnit = 'pc',
    this.imeiNumber = '',
  });

  final int productId;
  final int? variantId;
  final int? productBatchId;
  final String code;
  final String name;
  final double qty;
  final double netUnitPrice;
  final double discount;
  final double taxRate;
  final double tax;
  final double lineTotal;
  final String saleUnit;
  final String imeiNumber;

  ExchangeNewLine copyWith({double? qty}) {
    if (qty == null || qty == this.qty) return this;
    final ratio = qty / this.qty;
    return ExchangeNewLine(
      productId: productId,
      variantId: variantId,
      productBatchId: productBatchId,
      code: code,
      name: name,
      qty: qty,
      netUnitPrice: netUnitPrice,
      discount: discount * ratio,
      taxRate: taxRate,
      tax: tax * ratio,
      lineTotal: lineTotal * ratio,
      saleUnit: saleUnit,
      imeiNumber: imeiNumber,
    );
  }
}
