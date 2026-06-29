class CashRegisterDetails {
  const CashRegisterDetails({
    required this.cashInHand,
    required this.totalSaleAmount,
    required this.totalPayment,
    required this.cashPayment,
    required this.creditCardPayment,
    required this.chequePayment,
    required this.giftCardPayment,
    required this.depositPayment,
    required this.paypalPayment,
    required this.totalSaleReturn,
    required this.totalExpense,
    required this.totalSupplierPayment,
    required this.totalCash,
    required this.status,
    this.customMethods = const {},
  });

  final double cashInHand;
  final double totalSaleAmount;
  final double totalPayment;
  final double cashPayment;
  final double creditCardPayment;
  final double chequePayment;
  final double giftCardPayment;
  final double depositPayment;
  final double paypalPayment;
  final double totalSaleReturn;
  final double totalExpense;
  final double totalSupplierPayment;
  final double totalCash;
  final bool status;
  final Map<String, double> customMethods;

  factory CashRegisterDetails.fromJson(Map<String, dynamic> json) {
    final custom = <String, double>{};
    final rawCustom = json['custom_methods'];
    if (rawCustom is Map) {
      for (final entry in rawCustom.entries) {
        custom[entry.key.toString()] = _dbl(entry.value);
      }
    }

    return CashRegisterDetails(
      cashInHand: _dbl(json['cash_in_hand']),
      totalSaleAmount: _dbl(json['total_sale_amount']),
      totalPayment: _dbl(json['total_payment']),
      cashPayment: _dbl(json['cash_payment']),
      creditCardPayment: _dbl(json['credit_card_payment']),
      chequePayment: _dbl(json['cheque_payment']),
      giftCardPayment: _dbl(json['gift_card_payment']),
      depositPayment: _dbl(json['deposit_payment']),
      paypalPayment: _dbl(json['paypal_payment']),
      totalSaleReturn: _dbl(json['total_sale_return']),
      totalExpense: _dbl(json['total_expense']),
      totalSupplierPayment: _dbl(json['total_supplier_payment']),
      totalCash: _dbl(json['total_cash']),
      status: json['status'] == true || json['status'] == 1,
      customMethods: custom,
    );
  }

  static double _dbl(dynamic v) {
    if (v is num) return v.toDouble();
    return double.tryParse(v?.toString() ?? '') ?? 0;
  }
}
