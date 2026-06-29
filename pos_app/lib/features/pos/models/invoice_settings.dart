import 'dart:convert';

/// Active invoice template from backend Invoice Settings (58mm / 80mm / a4).
class InvoiceSettings {
  const InvoiceSettings({
    this.size = '80mm',
    this.templateName,
    this.invoiceName,
    this.headerText,
    this.headerTitle,
    this.footerText,
    this.footerTitle,
    this.invoiceDateFormat,
    this.companyLogo,
    this.showBarcode = false,
    this.showQrCode = false,
    this.showColumns = const {},
  });

  final String size;
  final String? templateName;
  final String? invoiceName;
  final String? headerText;
  final String? headerTitle;
  final String? footerText;
  final String? footerTitle;
  final String? invoiceDateFormat;
  final String? companyLogo;
  final bool showBarcode;
  final bool showQrCode;
  final Map<String, dynamic> showColumns;

  factory InvoiceSettings.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic> columns = {};
    final rawColumns = json['show_column'];
    if (rawColumns is Map) {
      columns = Map<String, dynamic>.from(rawColumns);
    } else if (rawColumns is String && rawColumns.isNotEmpty) {
      try {
        final decoded = jsonDecode(rawColumns);
        if (decoded is Map) {
          columns = Map<String, dynamic>.from(decoded);
        }
      } catch (_) {}
    }

    return InvoiceSettings(
      size: (json['size']?.toString() ?? '80mm').toLowerCase(),
      templateName: json['template_name']?.toString(),
      invoiceName: json['invoice_name']?.toString(),
      headerText: json['header_text']?.toString(),
      headerTitle: json['header_title']?.toString(),
      footerText: json['footer_text']?.toString(),
      footerTitle: json['footer_title']?.toString(),
      invoiceDateFormat: json['invoice_date_format']?.toString(),
      companyLogo: json['company_logo']?.toString(),
      showBarcode: _bool(json['show_barcode']),
      showQrCode: _bool(json['show_qr_code']),
      showColumns: columns,
    );
  }

  Map<String, dynamic> toJson() => {
        'size': size,
        'template_name': templateName,
        'invoice_name': invoiceName,
        'header_text': headerText,
        'header_title': headerTitle,
        'footer_text': footerText,
        'footer_title': footerTitle,
        'invoice_date_format': invoiceDateFormat,
        'company_logo': companyLogo,
        'show_barcode': showBarcode,
        'show_qr_code': showQrCode,
        'show_column': showColumns,
      };

  bool columnEnabled(String key) {
    final v = showColumns[key];
    if (v == null) return false;
    if (v is bool) return v;
    if (v is num) return v != 0;
    return v.toString() == '1' || v.toString().toLowerCase() == 'true';
  }

  /// Legacy POS: Invoice Settings size first, then pos_setting thermal fallback.
  static String resolveThermalSize({
    InvoiceSettings? invoice,
    String? invoiceOption,
    String? thermalInvoiceSize,
  }) {
    final invSize = invoice?.size ?? '';
    if (invSize == '58mm') return '58mm';
    if (invSize == '80mm') return '80mm';
    if (invSize == 'a4') return 'a4';

    final option = (invoiceOption ?? '').toLowerCase();
    if (option == 'a4') return 'a4';
    if (option == 'thermal') {
      final thermal = (thermalInvoiceSize ?? '80').toString().toLowerCase();
      if (thermal == '58' || thermal == '58mm') return '58mm';
      return '80mm';
    }
    return '80mm';
  }

  static bool _bool(dynamic v) {
    if (v is bool) return v;
    if (v is int) return v != 0;
    if (v is String) return v == '1' || v.toLowerCase() == 'true';
    return false;
  }
}
