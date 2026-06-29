/// POS display currency and quick-cash denominations.
const kPosCurrencySymbol = 'Rs.';
const kPosQuickCashAmounts = [50, 100, 500, 1000, 2000, 5000];

/// Payment modal quick denominations (mockup grid: 5×2).
const kPosPaymentQuickCashAmounts = [
  1, 5, 10, 20, 50, 100, 500, 1000, 2000, 5000,
];

String formatPosMoney(double amount) {
  if (amount < 0) {
    return '-$kPosCurrencySymbol${(-amount).toStringAsFixed(2)}';
  }
  return '$kPosCurrencySymbol${amount.toStringAsFixed(2)}';
}

String formatPosMoneyLabel(int amount) => '$kPosCurrencySymbol$amount';
