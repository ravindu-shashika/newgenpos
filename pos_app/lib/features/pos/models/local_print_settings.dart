import 'dart:convert';

/// Local receipt / thermal print configuration (no backend required).
class LocalPrintSettings {
  const LocalPrintSettings({
    this.paperSize = '80mm',
    this.pageWidthMm = 72.1,
    this.pageHeightMm = 297,
    this.receiptTitle = 'PosLanka.lk',
    this.headerTitle = '',
    this.headerText = '',
    this.warehouseAddress = 'Colombo\nSri Lanka',
    this.phoneNumber = '',
    this.contactLine = '',
    this.itemsSectionTitle = 'INVOICE ITEMS',
    this.footerTitle = 'Thank You! Come Again!',
    this.footerText = '',
    this.softwareCredit = '',
    this.logoPath,
    this.logoWidth = 56,
    this.logoHeight = 56,
    this.dateFormat = 'yyyy-MM-dd hh:mm:ssa',
    this.numberingType = 'sequential',
    this.referencePrefix = 'INV',
    this.primaryColor = '#2196F3',
    this.vatRegistrationNo = '',
    this.showOptions = const {},
    this.directPrint = true,
    this.printerUrl = '',
    this.printerName = '',
  });

  final String paperSize;
  final double pageWidthMm;
  final double pageHeightMm;
  final String receiptTitle;
  final String headerTitle;
  final String headerText;
  final String warehouseAddress;
  final String phoneNumber;
  final String contactLine;
  final String itemsSectionTitle;
  final String footerTitle;
  final String footerText;
  final String softwareCredit;
  final String? logoPath;
  final double logoWidth;
  final double logoHeight;
  final String dateFormat;
  final String numberingType;
  final String referencePrefix;
  final String primaryColor;
  final String vatRegistrationNo;
  final Map<String, bool> showOptions;
  /// Skip the system print dialog and send to [printerUrl] or Windows default.
  final bool directPrint;
  final String printerUrl;
  final String printerName;

  bool option(String key) => showOptions[key] ?? PrintOptionKeys.defaultValue(key);

  LocalPrintSettings copyWith({
    String? paperSize,
    double? pageWidthMm,
    double? pageHeightMm,
    String? receiptTitle,
    String? headerTitle,
    String? headerText,
    String? warehouseAddress,
    String? phoneNumber,
    String? contactLine,
    String? itemsSectionTitle,
    String? footerTitle,
    String? footerText,
    String? softwareCredit,
    String? logoPath,
    bool clearLogo = false,
    double? logoWidth,
    double? logoHeight,
    String? dateFormat,
    String? numberingType,
    String? referencePrefix,
    String? primaryColor,
    String? vatRegistrationNo,
    Map<String, bool>? showOptions,
    bool? directPrint,
    String? printerUrl,
    String? printerName,
  }) {
    return LocalPrintSettings(
      paperSize: paperSize ?? this.paperSize,
      pageWidthMm: pageWidthMm ?? this.pageWidthMm,
      pageHeightMm: pageHeightMm ?? this.pageHeightMm,
      receiptTitle: receiptTitle ?? this.receiptTitle,
      headerTitle: headerTitle ?? this.headerTitle,
      headerText: headerText ?? this.headerText,
      warehouseAddress: warehouseAddress ?? this.warehouseAddress,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      contactLine: contactLine ?? this.contactLine,
      itemsSectionTitle: itemsSectionTitle ?? this.itemsSectionTitle,
      footerTitle: footerTitle ?? this.footerTitle,
      footerText: footerText ?? this.footerText,
      softwareCredit: softwareCredit ?? this.softwareCredit,
      logoPath: clearLogo ? null : (logoPath ?? this.logoPath),
      logoWidth: logoWidth ?? this.logoWidth,
      logoHeight: logoHeight ?? this.logoHeight,
      dateFormat: dateFormat ?? this.dateFormat,
      numberingType: numberingType ?? this.numberingType,
      referencePrefix: referencePrefix ?? this.referencePrefix,
      primaryColor: primaryColor ?? this.primaryColor,
      vatRegistrationNo: vatRegistrationNo ?? this.vatRegistrationNo,
      showOptions: showOptions ?? this.showOptions,
      directPrint: directPrint ?? this.directPrint,
      printerUrl: printerUrl ?? this.printerUrl,
      printerName: printerName ?? this.printerName,
    );
  }

  factory LocalPrintSettings.defaults() {
    return LocalPrintSettings(
      showOptions: PrintOptionKeys.defaults(),
    );
  }

  factory LocalPrintSettings.fromJson(Map<String, dynamic> json) {
    final rawOpts = json['show_options'];
    Map<String, bool> opts = PrintOptionKeys.defaults();
    if (rawOpts is Map) {
      for (final entry in rawOpts.entries) {
        opts[entry.key.toString()] = _bool(entry.value);
      }
    }

    return LocalPrintSettings(
      paperSize: json['paper_size']?.toString() ?? '80mm',
      pageWidthMm: _dbl(json['page_width_mm'], 72.1),
      pageHeightMm: _dbl(json['page_height_mm'], 297),
      receiptTitle: json['receipt_title']?.toString() ?? 'PosLanka.lk',
      headerTitle: json['header_title']?.toString() ?? '',
      headerText: json['header_text']?.toString() ?? '',
      warehouseAddress: json['warehouse_address']?.toString() ?? '',
      phoneNumber: json['phone_number']?.toString() ?? '',
      contactLine: json['contact_line']?.toString() ?? '',
      itemsSectionTitle:
          json['items_section_title']?.toString() ?? 'INVOICE ITEMS',
      footerTitle: json['footer_title']?.toString() ?? '',
      footerText: json['footer_text']?.toString() ?? '',
      softwareCredit: json['software_credit']?.toString() ?? '',
      logoPath: json['logo_path']?.toString(),
      logoWidth: _dbl(json['logo_width'], 48),
      logoHeight: _dbl(json['logo_height'], 48),
      dateFormat: json['date_format']?.toString() ?? 'yyyy-MM-dd hh:mm:ssa',
      numberingType: json['numbering_type']?.toString() ?? 'sequential',
      referencePrefix: json['reference_prefix']?.toString() ?? 'INV',
      primaryColor: json['primary_color']?.toString() ?? '#2196F3',
      vatRegistrationNo: json['vat_registration_no']?.toString() ?? '',
      showOptions: opts,
      directPrint: _bool(json['direct_print'] ?? true),
      printerUrl: json['printer_url']?.toString() ?? '',
      printerName: json['printer_name']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'paper_size': paperSize,
        'page_width_mm': pageWidthMm,
        'page_height_mm': pageHeightMm,
        'receipt_title': receiptTitle,
        'header_title': headerTitle,
        'header_text': headerText,
        'warehouse_address': warehouseAddress,
        'phone_number': phoneNumber,
        'contact_line': contactLine,
        'items_section_title': itemsSectionTitle,
        'footer_title': footerTitle,
        'footer_text': footerText,
        'software_credit': softwareCredit,
        'logo_path': logoPath,
        'logo_width': logoWidth,
        'logo_height': logoHeight,
        'date_format': dateFormat,
        'numbering_type': numberingType,
        'reference_prefix': referencePrefix,
        'primary_color': primaryColor,
        'vat_registration_no': vatRegistrationNo,
        'show_options': showOptions,
        'direct_print': directPrint,
        'printer_url': printerUrl,
        'printer_name': printerName,
      };

  String encode() => jsonEncode(toJson());

  static LocalPrintSettings decode(String raw) =>
      LocalPrintSettings.fromJson(jsonDecode(raw) as Map<String, dynamic>);

  static double _dbl(dynamic v, double fallback) {
    if (v is num) return v.toDouble();
    return double.tryParse('$v') ?? fallback;
  }

  static bool _bool(dynamic v) {
    if (v is bool) return v;
    if (v is num) return v != 0;
    return v.toString() == '1' || v.toString().toLowerCase() == 'true';
  }

  LocalPrintSettings withPaperSize(String size) {
    switch (size) {
      case '58mm':
        return copyWith(
          paperSize: size,
          pageWidthMm: 48,
          pageHeightMm: 297,
        );
      case 'a4':
        return copyWith(
          paperSize: size,
          pageWidthMm: 210,
          pageHeightMm: 297,
        );
      default:
        return copyWith(
          paperSize: '80mm',
          pageWidthMm: 72.1,
          pageHeightMm: 297,
        );
    }
  }

  bool get allOptionsSelected {
    for (final key in PrintOptionKeys.toggleable) {
      if (!option(key)) return false;
    }
    return true;
  }

  LocalPrintSettings withAllOptions(bool value) {
    final next = Map<String, bool>.from(showOptions);
    for (final key in PrintOptionKeys.toggleable) {
      next[key] = value;
    }
    return copyWith(showOptions: next);
  }

  LocalPrintSettings withOption(String key, bool value) {
    final next = Map<String, bool>.from(showOptions);
    next[key] = value;
    return copyWith(showOptions: next);
  }
}

/// Checkbox keys aligned with legacy invoice `show_column` settings.
class PrintOptionKeys {
  static const activeLogoHeightWidth = 'active_logo_height_width';
  static const showRefNumber = 'show_ref_number';
  static const activeGeneratSettings = 'active_generat_settings';
  static const activeDateFormat = 'active_date_format';
  static const showWarehouseInfo = 'show_warehouse_info';
  static const showBillToInfo = 'show_bill_to_info';
  static const showBillerInfo = 'show_biller_info';
  static const showPaymentNote = 'show_payment_note';
  static const hideTotalDue = 'hide_total_due';
  static const showInWords = 'show_in_words';
  static const showFooterText = 'show_footer_text';
  static const showBarcode = 'show_barcode';
  static const showQrCode = 'show_qr_code';
  static const activePrimaryColor = 'active_primary_color';
  static const showVatRegistration = 'show_vat_registration';
  static const showSaleNote = 'show_sale_note';
  static const showCustomerName = 'show_customer_name';
  static const showDescription = 'show_description';
  static const showPaidInfo = 'show_paid_info';
  static const showDiscount = 'show_discount';
  static const showTaxInfo = 'show_tax_info';
  static const showDailySaleNumber = 'show_daily_sale_number';
  static const showSaleTypeItems = 'show_sale_type_items';

  static const toggleable = [
    activeLogoHeightWidth,
    showRefNumber,
    activeGeneratSettings,
    activeDateFormat,
    showWarehouseInfo,
    showBillToInfo,
    showBillerInfo,
    showPaymentNote,
    hideTotalDue,
    showInWords,
    showFooterText,
    showBarcode,
    showQrCode,
    activePrimaryColor,
    showVatRegistration,
    showSaleNote,
    showCustomerName,
    showDescription,
    showPaidInfo,
    showDiscount,
    showDailySaleNumber,
    showSaleTypeItems,
  ];

  static const labels = <String, String>{
    activeLogoHeightWidth: 'Active Logo Height Width',
    showRefNumber: 'Show Reference No',
    activeGeneratSettings: 'Auto Generate Numbering Type',
    activeDateFormat: 'Active Date Format',
    showWarehouseInfo: 'Show Warehouse Info',
    showBillToInfo: 'Show Bill To Info',
    showBillerInfo: 'Served By',
    showPaymentNote: 'Show Payment Note',
    hideTotalDue: 'Hide Total Due',
    showInWords: 'Show Amount In Words',
    showFooterText: 'Show Footer Text',
    showBarcode: 'Show Barcode',
    showQrCode: 'Show QR Code',
    activePrimaryColor: 'Active Primary Color',
    showVatRegistration: 'Show Vat Registration Number',
    showSaleNote: 'Show Sale Note',
    showCustomerName: 'Show Customer Name',
    showDescription: 'Show Description [58mm, 80mm]',
    showPaidInfo: 'Show Paid Info',
    showDiscount: 'Show Discount',
    showDailySaleNumber: 'Show Daily Sale Number',
    showSaleTypeItems: 'Show Sale Type & Total Items',
  };

  static Map<String, bool> defaults() => {
        for (final k in toggleable) k: defaultValue(k),
      };

  static bool defaultValue(String key) {
    switch (key) {
      case hideTotalDue:
      case activeGeneratSettings:
      case activeDateFormat:
      case activeLogoHeightWidth:
      case showDailySaleNumber:
      case showTaxInfo:
        return false;
      default:
        return true;
    }
  }
}
