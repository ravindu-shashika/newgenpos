import 'models/cart_line.dart';

/// Totals aligned with web `posCartHelpers.calcPosTotals()`.
class PosTotals {
  PosTotals({
    required this.itemCount,
    required this.totalQty,
    required this.lineDiscount,
    required this.lineTax,
    required this.subtotal,
    required this.orderDiscount,
    required this.orderTax,
    required this.shippingCost,
    required this.couponDiscount,
    required this.returnCredit,
    required this.grandTotal,
    this.returnCreditFromSession = 0,
    this.returnSettlementCredit = 0,
    this.saleGrandTotal = 0,
    this.balanceDue = 0,
    this.storeCreditDue = 0,
  });

  final int itemCount;
  final double totalQty;
  final double lineDiscount;
  final double lineTax;
  final double subtotal;
  final double orderDiscount;
  final double orderTax;
  final double shippingCost;
  final double couponDiscount;
  final double returnCredit;
  final double grandTotal;
  final double returnCreditFromSession;
  final double returnSettlementCredit;
  final double saleGrandTotal;
  final double balanceDue;
  final double storeCreditDue;

  double get totalTax => lineTax + orderTax;
  double get totalDiscount => lineDiscount + orderDiscount;
}

PosTotals calcPosTotals({
  required List<CartLine> lines,
  required double orderDiscountValue,
  required String orderDiscountType,
  required double orderTaxRate,
  required double shippingCost,
  required double couponDiscount,
  double returnSettlementCredit = 0,
  double returnSessionCredit = 0,
}) {
  var totalQty = 0.0;
  var lineDiscount = 0.0;
  var lineTax = 0.0;
  var subtotal = 0.0;

  for (final line in lines) {
    totalQty += line.qty;
    lineDiscount += line.discount;
    lineTax += line.lineTax;
    subtotal += line.netUnitPrice * line.qty;
  }

  final orderDiscount = orderDiscountType == 'Percentage'
      ? subtotal * (orderDiscountValue / 100)
      : orderDiscountValue;

  // Legacy pos.blade.php: total_price = sum of line subtotals (incl. line tax).
  final totalPrice = subtotal + lineTax;
  final orderTax = (totalPrice - orderDiscount) * (orderTaxRate / 100);
  final saleGrandTotal = totalPrice +
      orderTax +
      shippingCost -
      orderDiscount -
      couponDiscount;

  final totalReturnCredit = returnSettlementCredit + returnSessionCredit;
  final balanceDue =
      (saleGrandTotal - totalReturnCredit).clamp(0, double.infinity).toDouble();
  final storeCreditDue =
      (totalReturnCredit - saleGrandTotal).clamp(0, double.infinity).toDouble();
  final grandTotal = balanceDue;

  return PosTotals(
    itemCount: lines.length,
    totalQty: totalQty,
    lineDiscount: lineDiscount,
    lineTax: lineTax,
    subtotal: subtotal,
    orderDiscount: orderDiscount,
    orderTax: orderTax,
    shippingCost: shippingCost,
    couponDiscount: couponDiscount,
    returnCredit: totalReturnCredit,
    returnCreditFromSession: returnSessionCredit,
    returnSettlementCredit: returnSettlementCredit,
    saleGrandTotal: saleGrandTotal,
    balanceDue: balanceDue,
    storeCreditDue: storeCreditDue,
    grandTotal: grandTotal < 0 ? 0 : grandTotal,
  );
}
