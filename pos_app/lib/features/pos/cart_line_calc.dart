import 'models/cart_line.dart';
import 'models/cart_line_edit_context.dart';

double rowPriceFromBase(
  double basePrice,
  CartLineUnitOption unit,
) {
  if (unit.operator == '*') return basePrice * unit.operationValue;
  if (unit.operator == '/') {
    return unit.operationValue == 0 ? basePrice : basePrice / unit.operationValue;
  }
  return basePrice;
}

double basePriceFromRow(
  double rowPrice,
  CartLineUnitOption unit,
) {
  if (unit.operator == '*') {
    return unit.operationValue == 0 ? rowPrice : rowPrice / unit.operationValue;
  }
  if (unit.operator == '/') return rowPrice * unit.operationValue;
  return rowPrice;
}

double unitDiscountForLine(CartLine line) {
  if (line.qty <= 0) return 0;
  return line.discount / line.qty;
}

double rowUnitPriceForLine(CartLine line) {
  final unitDiscount = unitDiscountForLine(line);
  if (line.taxMethod == 2) {
    return line.netUnitPrice + unitDiscount;
  }
  return line.netUnitPrice + unitDiscount;
}

CartLine applyCartLineEdit({
  required CartLine line,
  required double qty,
  required double unitDiscount,
  required double rowUnitPrice,
  required double taxRate,
  required int taxMethod,
  required String saleUnit,
}) {
  final safeQty = qty <= 0 ? 1.0 : qty;
  final safeDiscount = unitDiscount < 0 ? 0.0 : unitDiscount;
  final safeRow = rowUnitPrice < 0 ? 0.0 : rowUnitPrice;

  double netUnitPrice;
  if (taxMethod == 2) {
    final subTotalUnit = safeRow - safeDiscount;
    netUnitPrice = taxRate > 0
        ? ((100 / (100 + taxRate)) * subTotalUnit).toDouble()
        : subTotalUnit;
  } else {
    netUnitPrice = safeRow - safeDiscount;
  }

  return line.copyWith(
    qty: safeQty,
    discount: safeDiscount * safeQty,
    netUnitPrice: netUnitPrice,
    taxRate: taxRate,
    taxMethod: taxMethod,
    saleUnit: saleUnit,
  );
}
