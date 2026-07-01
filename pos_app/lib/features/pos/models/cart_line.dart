import 'package:uuid/uuid.dart';

class CartLine {
  CartLine({
    required this.productId,
    required this.code,
    required this.name,
    required this.netUnitPrice,
    required this.taxRate,
    required this.taxMethod,
    this.variantId,
    this.productBatchId,
    this.batchNo,
    this.qty = 1,
    this.discount = 0,
    this.stockQty,
    this.saleUnit = 'pc',
  });

  final int productId;
  final int? variantId;
  final int? productBatchId;
  final String? batchNo;
  final String code;
  final String name;
  double qty;
  double netUnitPrice;
  double discount;
  double taxRate;
  int taxMethod;
  final double? stockQty;
  String saleUnit;

  double get lineTax {
    if (taxRate <= 0) return 0;
    if (taxMethod == 1) {
      return netUnitPrice * qty * taxRate / 100;
    }
    // Inclusive tax: netUnitPrice is ex-tax; gross unit = net * (1 + rate/100).
    final grossUnit = netUnitPrice * (100 + taxRate) / 100;
    return (grossUnit - netUnitPrice) * qty;
  }

  /// Line total — [netUnitPrice] is already net of unit discount; do not subtract [discount] again.
  double get subtotal => netUnitPrice * qty + lineTax;

  String get lineKey =>
      '$productId-${variantId ?? 0}-${productBatchId ?? 0}-${code.hashCode}';

  CartLine copyWith({
    double? qty,
    double? stockQty,
    double? netUnitPrice,
    double? discount,
    double? taxRate,
    int? taxMethod,
    String? saleUnit,
    int? productBatchId,
    String? batchNo,
  }) {
    return CartLine(
      productId: productId,
      variantId: variantId,
      productBatchId: productBatchId ?? this.productBatchId,
      batchNo: batchNo ?? this.batchNo,
      code: code,
      name: name,
      netUnitPrice: netUnitPrice ?? this.netUnitPrice,
      taxRate: taxRate ?? this.taxRate,
      taxMethod: taxMethod ?? this.taxMethod,
      qty: qty ?? this.qty,
      discount: discount ?? this.discount,
      stockQty: stockQty ?? this.stockQty,
      saleUnit: saleUnit ?? this.saleUnit,
    );
  }

  Map<String, dynamic> toSyncLine() {
    return {
      'product_id': productId,
      'variant_id': variantId,
      if (productBatchId != null) 'product_batch_id': productBatchId,
      'code': code,
      'name': name,
      'qty': qty,
      'net_unit_price': netUnitPrice,
      'discount': discount,
      'tax_rate': taxRate,
      'tax': lineTax,
      'subtotal': subtotal,
      'total': subtotal,
      'sale_unit': saleUnit,
    };
  }
}

class CartState {
  CartState({this.lines = const [], this.orderDiscount = 0});

  final List<CartLine> lines;
  final double orderDiscount;

  double get totalQty => lines.fold<double>(0, (s, l) => s + l.qty);
  double get totalDiscount =>
      lines.fold<double>(0, (s, l) => s + l.discount) + orderDiscount;
  double get totalTax => lines.fold<double>(0, (s, l) => s + l.lineTax);
  double get grandTotal =>
      lines.fold<double>(0, (s, l) => s + l.subtotal) - orderDiscount;

  bool get isEmpty => lines.isEmpty;

  CartState addProduct(CartLine line) {
    final next = [...lines];
    final idx = next.indexWhere((l) => l.lineKey == line.lineKey);
    if (idx >= 0) {
      next[idx].qty += line.qty;
    } else {
      next.add(line);
    }
    return CartState(lines: next, orderDiscount: orderDiscount);
  }

  CartState updateQty(String lineKey, double qty) {
    final next = lines.map((l) {
      if (l.lineKey == lineKey) {
        return l.copyWith(qty: qty);
      }
      return l;
    }).where((l) => l.qty > 0).toList();
    return CartState(lines: next, orderDiscount: orderDiscount);
  }

  CartState removeLine(String lineKey) {
    return CartState(
      lines: lines.where((l) => l.lineKey != lineKey).toList(),
      orderDiscount: orderDiscount,
    );
  }

  CartState clear() => CartState(orderDiscount: 0);
}

const _uuid = Uuid();

String newClientUuid() => _uuid.v4();
