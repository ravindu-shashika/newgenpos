import 'models/cart_line.dart';
import 'models/return_models.dart';

class PosCheckoutState {
  const PosCheckoutState({
    this.lines = const [],
    this.customerId,
    this.billerId,
    this.warehouseId,
    this.saleDate,
    this.priceType = 'retail',
    this.orderTaxRate = 0,
    this.orderDiscountValue = 0,
    this.orderDiscountType = 'Flat',
    this.shippingCost = 0,
    this.couponId,
    this.couponDiscount = 0,
    this.couponCode,
    this.paidById = '1',
    this.saleNote = '',
    this.staffNote = '',
    this.draftClientUuid,
    this.returnSettlements = const [],
  });

  final List<CartLine> lines;
  final int? customerId;
  final int? billerId;
  final int? warehouseId;
  final DateTime? saleDate;
  final String priceType;
  final double orderTaxRate;
  final double orderDiscountValue;
  final String orderDiscountType;
  final double shippingCost;
  final int? couponId;
  final double couponDiscount;
  final String? couponCode;
  final String paidById;
  final String saleNote;
  final String staffNote;
  final String? draftClientUuid;
  final List<AppliedReturnSettlement> returnSettlements;

  bool get isEmpty => lines.isEmpty;

  double get returnCreditApplied =>
      returnSettlements.fold<double>(0, (s, r) => s + r.amount);

  PosCheckoutState copyWith({
    List<CartLine>? lines,
    int? customerId,
    int? billerId,
    int? warehouseId,
    DateTime? saleDate,
    String? priceType,
    double? orderTaxRate,
    double? orderDiscountValue,
    String? orderDiscountType,
    double? shippingCost,
    int? couponId,
    double? couponDiscount,
    String? couponCode,
    String? paidById,
    String? saleNote,
    String? staffNote,
    String? draftClientUuid,
    List<AppliedReturnSettlement>? returnSettlements,
    bool clearCoupon = false,
    bool clearDraft = false,
    bool clearReturnSettlements = false,
  }) {
    return PosCheckoutState(
      lines: lines ?? this.lines,
      customerId: customerId ?? this.customerId,
      billerId: billerId ?? this.billerId,
      warehouseId: warehouseId ?? this.warehouseId,
      saleDate: saleDate ?? this.saleDate,
      priceType: priceType ?? this.priceType,
      orderTaxRate: orderTaxRate ?? this.orderTaxRate,
      orderDiscountValue: orderDiscountValue ?? this.orderDiscountValue,
      orderDiscountType: orderDiscountType ?? this.orderDiscountType,
      shippingCost: shippingCost ?? this.shippingCost,
      couponId: clearCoupon ? null : (couponId ?? this.couponId),
      couponDiscount:
          clearCoupon ? 0 : (couponDiscount ?? this.couponDiscount),
      couponCode: clearCoupon ? null : (couponCode ?? this.couponCode),
      paidById: paidById ?? this.paidById,
      saleNote: saleNote ?? this.saleNote,
      staffNote: staffNote ?? this.staffNote,
      draftClientUuid:
          clearDraft ? null : (draftClientUuid ?? this.draftClientUuid),
      returnSettlements: clearReturnSettlements
          ? const []
          : (returnSettlements ?? this.returnSettlements),
    );
  }

  PosCheckoutState addProduct(CartLine line) {
    final next = [...lines];
    final idx = next.indexWhere((l) => l.lineKey == line.lineKey);
    if (idx >= 0) {
      final existing = next[idx];
      next[idx] = existing.copyWith(
        qty: existing.qty + line.qty,
        stockQty: line.stockQty ?? existing.stockQty,
      );
    } else {
      next.add(line);
    }
    return copyWith(lines: next);
  }

  PosCheckoutState updateQty(String lineKey, double qty) {
    final next = lines
        .map((l) => l.lineKey == lineKey ? l.copyWith(qty: qty) : l)
        .where((l) => l.qty > 0)
        .toList();
    return copyWith(lines: next);
  }

  PosCheckoutState removeLine(String lineKey) {
    return copyWith(
      lines: lines.where((l) => l.lineKey != lineKey).toList(),
    );
  }

  PosCheckoutState clearCart() {
    return const PosCheckoutState();
  }
}
