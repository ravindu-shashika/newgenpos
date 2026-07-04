import 'package:intl/intl.dart';

/// POS display currency and quick-cash denominations.
const kPosCurrencySymbol = 'Rs.';
const kPosQuickCashAmounts = [50, 100, 500, 1000, 2000, 5000];

/// Payment modal quick denominations (mockup grid: 5×2).
const kPosPaymentQuickCashAmounts = [
  1, 5, 10, 50, 100, 500, 1000, 2000, 5000,
];

final _posMoneyFormat = NumberFormat('#,##0.00');
final _posMoneyIntFormat = NumberFormat('#,##0');

String formatPosMoney(double amount) {
  final abs = amount.abs();
  final formatted = _posMoneyFormat.format(abs);
  if (amount < 0) {
    return '-$kPosCurrencySymbol$formatted';
  }
  return '$kPosCurrencySymbol$formatted';
}

String formatPosMoneyLabel(int amount) =>
    '$kPosCurrencySymbol${_posMoneyIntFormat.format(amount)}';
