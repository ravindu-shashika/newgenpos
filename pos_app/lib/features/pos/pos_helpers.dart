import 'package:flutter/material.dart';

import 'models/cart_line.dart';
import 'pos_currency.dart';

/// Payment + coupon helpers aligned with web `posHelpers.js` / `pos.blade.php`.
class MixPaymentLine {
  const MixPaymentLine({
    required this.paidById,
    required this.payingAmount,
    required this.cashReceived,
  });

  final String paidById;
  final double payingAmount;
  final double cashReceived;

  bool get isCash => paidById == '1';
}

class MixPaymentTotals {
  const MixPaymentTotals({
    required this.totalPaying,
    required this.change,
    required this.due,
  });

  final double totalPaying;
  final double change;
  final double due;
}

/// Drop empty lines and align tendered amounts with legacy POS rules.
List<MixPaymentLine> normalizeMixPayments(List<MixPaymentLine> lines) {
  final normalized = <MixPaymentLine>[];
  for (final line in lines) {
    final paying = line.payingAmount;
    if (paying <= 0) continue;
    normalized.add(
      MixPaymentLine(
        paidById: line.paidById,
        payingAmount: paying,
        cashReceived: line.isCash ? line.cashReceived : paying,
      ),
    );
  }
  return normalized;
}

MixPaymentTotals computeMixPaymentTotals({
  required List<MixPaymentLine> lines,
  required double grandTotal,
}) {
  final totalPaying =
      lines.fold<double>(0, (sum, line) => sum + line.payingAmount);
  var change = 0.0;
  for (final line in lines) {
    if (line.isCash) {
      change += line.cashReceived - line.payingAmount;
    }
  }
  if (change < 0) change = 0;
  final due = grandTotal - totalPaying;
  return MixPaymentTotals(
    totalPaying: totalPaying,
    change: change,
    due: due > 0 ? due : 0,
  );
}

double checkoutQtyForProduct(
  List<CartLine> lines, {
  required int productId,
  int? variantId,
  int? productBatchId,
  String? excludeLineKey,
}) {
  return lines
      .where(
        (l) =>
            l.productId == productId &&
            l.variantId == variantId &&
            (productBatchId == null || l.productBatchId == productBatchId) &&
            l.lineKey != excludeLineKey,
      )
      .fold<double>(0, (sum, l) => sum + l.qty);
}

String? stockLimitMessage({
  required String productName,
  required double available,
  required double requested,
}) {
  if (requested <= available) return null;
  if (available <= 0) {
    return 'Out of stock: $productName';
  }
  final availLabel = available == available.roundToDouble()
      ? available.toStringAsFixed(0)
      : available.toStringAsFixed(2);
  return 'Only $availLabel in stock for $productName';
}

dynamic encodePaidById(String paidById) {
  final parsed = int.tryParse(paidById);
  return parsed ?? paidById;
}

class PosPaymentMethod {
  const PosPaymentMethod({
    required this.id,
    required this.label,
    required this.key,
  });

  final String id;
  final String label;
  final String key;
}

IconData paymentMethodIcon(String key) {
  switch (key.toLowerCase()) {
    case 'cash':
      return Icons.payments_outlined;
    case 'card':
      return Icons.credit_card;
    case 'credit':
      return Icons.receipt_long_outlined;
    case 'cheque':
      return Icons.fact_check_outlined;
    case 'gift_card':
      return Icons.card_giftcard_outlined;
    case 'deposit':
      return Icons.savings_outlined;
    case 'points':
      return Icons.stars_outlined;
    case 'razorpay':
      return Icons.account_balance_outlined;
    case 'pesapal':
      return Icons.language_outlined;
    case 'installment':
      return Icons.calendar_month_outlined;
    case 'mix':
      return Icons.call_split;
    case 'draft':
      return Icons.drafts_outlined;
    case 'cancel':
      return Icons.close;
    case 'more':
      return Icons.more_horiz;
    case 'hold':
      return Icons.pause_circle_outline;
    case 'save':
      return Icons.save_outlined;
  }
  return Icons.payment_outlined;
}

const kPosPaymentMethods = <String, PosPaymentMethod>{
  'cash': PosPaymentMethod(id: '1', label: 'Cash', key: 'cash'),
  'card': PosPaymentMethod(id: '3', label: 'Card', key: 'card'),
  'credit': PosPaymentMethod(id: 'credit', label: 'Credit Sale', key: 'credit'),
  'cheque': PosPaymentMethod(id: '4', label: 'Cheque', key: 'cheque'),
  'gift_card': PosPaymentMethod(id: '2', label: 'Gift Card', key: 'gift_card'),
  'deposit': PosPaymentMethod(id: '6', label: 'Deposit', key: 'deposit'),
  'points': PosPaymentMethod(id: '7', label: 'Points', key: 'points'),
  'razorpay': PosPaymentMethod(id: 'razorpay', label: 'Razorpay', key: 'razorpay'),
  'pesapal': PosPaymentMethod(id: 'pesapal', label: 'Pesapal', key: 'pesapal'),
  'installment': PosPaymentMethod(id: 'installment', label: 'Installment', key: 'installment'),
};

const kStandardPaymentKeys = <String>{
  'cash',
  'card',
  'cheque',
  'gift_card',
  'deposit',
  'points',
  'razorpay',
  'pesapal',
  'installment',
};

class PosPaymentButtonGroups {
  const PosPaymentButtonGroups({
    required this.primary,
    required this.more,
  });

  final List<PosPaymentMethod> primary;
  final List<PosPaymentMethod> more;
}

PosPaymentMethod resolvePaymentMethod(String raw) {
  final key = raw.trim().toLowerCase();
  return kPosPaymentMethods[key] ??
      PosPaymentMethod(
        id: key,
        label: key.replaceAll('_', ' '),
        key: key,
      );
}

PosPaymentButtonGroups resolvePaymentButtonGroups([
  List<String> options = const ['cash', 'card', 'cheque', 'deposit'],
]) {
  final primary = <PosPaymentMethod>[];
  final more = <PosPaymentMethod>[];
  for (final raw in options) {
    final method = resolvePaymentMethod(raw);
    if (isExcludedPaymentMethod(method)) continue;
    if (kStandardPaymentKeys.contains(method.key)) {
      primary.add(method);
    } else {
      more.add(method);
    }
  }
  return PosPaymentButtonGroups(primary: primary, more: more);
}

List<PosPaymentMethod> resolvePaymentButtons([
  List<String> options = const ['cash', 'card', 'cheque', 'deposit'],
]) {
  return resolvePaymentButtonGroups(options).primary;
}

bool isExcludedPaymentMethod(PosPaymentMethod method) =>
    method.key == 'credit';

List<PosPaymentMethod> resolveAllPaymentMethods([
  List<String> options = const ['cash', 'card', 'cheque', 'deposit'],
]) {
  final groups = resolvePaymentButtonGroups(options);
  return [...groups.primary, ...groups.more]
      .where((m) => !isExcludedPaymentMethod(m))
      .toList();
}

List<PosPaymentMethod> resolveSavePaymentMethods([
  List<String> options = const ['cash', 'card', 'cheque', 'deposit'],
]) {
  return [...resolveAllPaymentMethods(options), kMixPaymentMethod];
}

/// Applies local POS UI toggles to server payment option keys.
List<String> applyLocalPaymentOptionOverrides({
  required List<String> serverOptions,
  required bool enablePointsPayment,
}) {
  final options = serverOptions
      .map((e) => e.trim().toLowerCase())
      .where((e) => e.isNotEmpty)
      .toList();
  options.removeWhere((e) => e == 'points');
  if (enablePointsPayment) {
    options.add('points');
  }
  return options;
}

const kMixPaymentMethod = PosPaymentMethod(
  id: 'mix',
  label: 'Mix',
  key: 'mix',
);

class CouponApplyResult {
  CouponApplyResult.ok({
    required this.couponId,
    required this.discount,
    required this.message,
  }) : ok = true;

  CouponApplyResult.fail(this.message)
      : ok = false,
        couponId = null,
        discount = 0;

  final bool ok;
  final int? couponId;
  final double discount;
  final String message;
}

CouponApplyResult applyCouponCode({
  required String code,
  required List<LocalCouponRow> coupons,
  required double grandTotalBeforeCoupon,
}) {
  final trimmed = code.trim();
  if (trimmed.isEmpty) {
    return CouponApplyResult.fail('Enter a coupon code.');
  }

  LocalCouponRow? match;
  for (final c in coupons) {
    if (c.code.toLowerCase() == trimmed.toLowerCase()) {
      match = c;
      break;
    }
  }
  if (match == null) {
    return CouponApplyResult.fail('Invalid coupon code!');
  }

  final today = DateTime.now().toIso8601String().substring(0, 10);
  if (match.expiredDate != null &&
      match.expiredDate!.isNotEmpty &&
      today.compareTo(match.expiredDate!.substring(0, 10)) > 0) {
    return CouponApplyResult.fail('This coupon has expired!');
  }

  if (match.quantity != null &&
      match.used != null &&
      match.quantity! <= match.used!) {
    return CouponApplyResult.fail('This coupon is no longer available.');
  }

  if (grandTotalBeforeCoupon < match.minimumAmount) {
    return CouponApplyResult.fail(
      'Grand total must be at least ${match.minimumAmount} for this coupon.',
    );
  }

  final isFixed = match.type.toLowerCase() == 'fixed';
  final discount = isFixed
      ? match.amount
      : grandTotalBeforeCoupon * (match.amount / 100);

  return CouponApplyResult.ok(
    couponId: match.id,
    discount: discount,
    message: isFixed
        ? 'Coupon applied: ${formatPosMoney(match.amount)} off'
        : 'Coupon applied: ${match.amount}% off',
  );
}

/// Lightweight coupon row for helper (avoids drift import in tests).
class LocalCouponRow {
  LocalCouponRow({
    required this.id,
    required this.code,
    required this.type,
    required this.amount,
    required this.minimumAmount,
    this.quantity,
    this.used,
    this.expiredDate,
  });

  final int id;
  final String code;
  final String type;
  final double amount;
  final double minimumAmount;
  final double? quantity;
  final double? used;
  final String? expiredDate;
}
