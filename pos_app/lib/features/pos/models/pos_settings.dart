/// POS settings from `pos_setting` table / `/pos/bootstrap` (legacy pos.blade.php).
class PosSettings {
  const PosSettings({
    this.customerId,
    this.billerId,
    this.warehouseId,
    this.productNumber = 15,
    this.keyboardActive = false,
    this.isTable = false,
    this.sendSms = false,
    this.cashRegister = false,
    this.showPrintInvoice = false,
    this.invoiceOption,
    this.thermalInvoiceSize,
    this.paymentOptions = const ['cash', 'card', 'cheque', 'deposit'],
  });

  final int? customerId;
  final int? billerId;
  final int? warehouseId;
  final int productNumber;
  final bool keyboardActive;
  final bool isTable;
  final bool sendSms;
  final bool cashRegister;
  final bool showPrintInvoice;
  final String? invoiceOption;
  final String? thermalInvoiceSize;
  final List<String> paymentOptions;

  factory PosSettings.fromJson(Map<String, dynamic> json) {
    final rawOptions = json['payment_options'];
    List<String> options;
    if (rawOptions is List) {
      options = rawOptions.map((e) => e.toString().trim()).where((e) => e.isNotEmpty).toList();
    } else if (rawOptions is String && rawOptions.isNotEmpty) {
      options = rawOptions.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
    } else {
      options = const ['cash', 'card', 'cheque', 'deposit'];
    }

    return PosSettings(
      customerId: _intOrNull(json['customer_id']),
      billerId: _intOrNull(json['biller_id']),
      warehouseId: _intOrNull(json['warehouse_id']),
      productNumber: _int(json['product_number'], fallback: 15),
      keyboardActive: _bool(json['keyboard_active'] ?? json['keybord_active']),
      isTable: _bool(json['is_table']),
      sendSms: _bool(json['send_sms']),
      cashRegister: _bool(json['cash_register']),
      showPrintInvoice: _bool(json['show_print_invoice']),
      invoiceOption: json['invoice_option']?.toString(),
      thermalInvoiceSize: json['thermal_invoice_size']?.toString(),
      paymentOptions: options,
    );
  }

  Map<String, dynamic> toJson() => {
        'customer_id': customerId,
        'biller_id': billerId,
        'warehouse_id': warehouseId,
        'product_number': productNumber,
        'keyboard_active': keyboardActive,
        'is_table': isTable,
        'send_sms': sendSms,
        'cash_register': cashRegister,
        'show_print_invoice': showPrintInvoice,
        'invoice_option': invoiceOption,
        'thermal_invoice_size': thermalInvoiceSize,
        'payment_options': paymentOptions,
      };

  static int? _intOrNull(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    return int.tryParse(v.toString());
  }

  static int _int(dynamic v, {required int fallback}) {
    return _intOrNull(v) ?? fallback;
  }

  static bool _bool(dynamic v) {
    if (v is bool) return v;
    if (v is int) return v != 0;
    if (v is String) return v == '1' || v.toLowerCase() == 'true';
    return false;
  }
}
