import 'dart:convert';

/// Local POS checkout UI options (shipping, tax, whatsapp).
class PosUiSettings {
  const PosUiSettings({
    this.enableShipping = true,
    this.enableTax = true,
    this.enableWhatsapp = false,
    this.enableKeyboard = false,
    this.enableReturn = true,
    this.enableExchange = false,
    this.enablePointsPayment = false,
    this.gridColumnCount,
    this.saleReferencePrefix = 'posr-',
    this.saleReferenceMode = 'datetime',
    this.saleReferenceNextSeq = 1,
    this.sidebarLogoPath,
    this.defaultCustomerId,
    this.defaultBillerId,
    this.themePrimaryColor = '#002C76',
    this.buttonPrimaryColor = '',
    this.darkMode = false,
    this.fontScale = 1.0,
  });

  final bool enableShipping;
  final bool enableTax;
  final bool enableWhatsapp;
  final bool enableKeyboard;
  final bool enableReturn;
  final bool enableExchange;
  final bool enablePointsPayment;

  /// Local override for product grid columns. `null` uses server `product_number`.
  final int? gridColumnCount;

  /// Sale invoice reference prefix (e.g. posr-, sr-, INV).
  final String saleReferencePrefix;

  /// `datetime` = prefix + yyyyMMdd-HHmmss; `sequential` = prefix + counter.
  final String saleReferenceMode;

  final int saleReferenceNextSeq;

  /// Local image path shown at the top of the POS sidebar.
  final String? sidebarLogoPath;

  /// Local default customer for register checkout.
  final int? defaultCustomerId;

  /// Local default biller for register checkout.
  final int? defaultBillerId;

  /// App accent / sidebar theme color (hex, e.g. #002C76).
  final String themePrimaryColor;

  /// Primary filled-button color (hex). Empty uses [themePrimaryColor].
  final String buttonPrimaryColor;

  final bool darkMode;
  final double fontScale;

  static int resolveGridColumnCount({
    int? localOverride,
    int? serverProductNumber,
  }) {
    final value = localOverride ?? serverProductNumber ?? 5;
    return value.clamp(1, 12);
  }

  PosUiSettings copyWith({
    bool? enableShipping,
    bool? enableTax,
    bool? enableWhatsapp,
    bool? enableKeyboard,
    bool? enableReturn,
    bool? enableExchange,
    bool? enablePointsPayment,
    int? gridColumnCount,
    bool clearGridColumnCount = false,
    String? saleReferencePrefix,
    String? saleReferenceMode,
    int? saleReferenceNextSeq,
    String? sidebarLogoPath,
    bool clearSidebarLogo = false,
    int? defaultCustomerId,
    bool clearDefaultCustomerId = false,
    int? defaultBillerId,
    bool clearDefaultBillerId = false,
    String? themePrimaryColor,
    String? buttonPrimaryColor,
    bool clearButtonPrimaryColor = false,
    bool? darkMode,
    double? fontScale,
  }) {
    return PosUiSettings(
      enableShipping: enableShipping ?? this.enableShipping,
      enableTax: enableTax ?? this.enableTax,
      enableWhatsapp: enableWhatsapp ?? this.enableWhatsapp,
      enableKeyboard: enableKeyboard ?? this.enableKeyboard,
      enableReturn: enableReturn ?? this.enableReturn,
      enableExchange: enableExchange ?? this.enableExchange,
      enablePointsPayment: enablePointsPayment ?? this.enablePointsPayment,
      gridColumnCount: clearGridColumnCount
          ? null
          : (gridColumnCount ?? this.gridColumnCount),
      saleReferencePrefix: saleReferencePrefix ?? this.saleReferencePrefix,
      saleReferenceMode: saleReferenceMode ?? this.saleReferenceMode,
      saleReferenceNextSeq: saleReferenceNextSeq ?? this.saleReferenceNextSeq,
      sidebarLogoPath: clearSidebarLogo
          ? null
          : (sidebarLogoPath ?? this.sidebarLogoPath),
      defaultCustomerId: clearDefaultCustomerId
          ? null
          : (defaultCustomerId ?? this.defaultCustomerId),
      defaultBillerId: clearDefaultBillerId
          ? null
          : (defaultBillerId ?? this.defaultBillerId),
      themePrimaryColor: themePrimaryColor ?? this.themePrimaryColor,
      buttonPrimaryColor: clearButtonPrimaryColor
          ? ''
          : (buttonPrimaryColor ?? this.buttonPrimaryColor),
      darkMode: darkMode ?? this.darkMode,
      fontScale: fontScale ?? this.fontScale,
    );
  }

  factory PosUiSettings.defaults() => const PosUiSettings();

  factory PosUiSettings.fromJson(Map<String, dynamic> json) {
    return PosUiSettings(
      enableShipping: _bool(json['enable_shipping'], fallback: true),
      enableTax: _bool(json['enable_tax'], fallback: true),
      enableWhatsapp: _bool(json['enable_whatsapp'], fallback: false),
      enableKeyboard: _bool(json['enable_keyboard'], fallback: false),
      enableReturn: _bool(json['enable_return'], fallback: true),
      enableExchange: _bool(json['enable_exchange'], fallback: false),
      enablePointsPayment:
          _bool(json['enable_points_payment'], fallback: false),
      gridColumnCount: _intOrNull(json['grid_column_count']),
      saleReferencePrefix:
          json['sale_reference_prefix']?.toString().trim().isNotEmpty == true
              ? json['sale_reference_prefix'].toString().trim()
              : 'posr-',
      saleReferenceMode:
          json['sale_reference_mode']?.toString() ?? 'datetime',
      saleReferenceNextSeq:
          _intOrNull(json['sale_reference_next_seq']) ?? 1,
      sidebarLogoPath: json['sidebar_logo_path']?.toString(),
      defaultCustomerId: _intOrNull(json['default_customer_id']),
      defaultBillerId: _intOrNull(json['default_biller_id']),
      themePrimaryColor:
          json['theme_primary_color']?.toString().trim().isNotEmpty == true
              ? json['theme_primary_color'].toString().trim()
              : '#002C76',
      buttonPrimaryColor: json['button_primary_color']?.toString() ?? '',
      darkMode: _bool(json['dark_mode'], fallback: false),
      fontScale: _doubleOrNull(json['font_scale']) ?? 1.0,
    );
  }

  Map<String, dynamic> toJson() => {
        'enable_shipping': enableShipping,
        'enable_tax': enableTax,
        'enable_whatsapp': enableWhatsapp,
        'enable_keyboard': enableKeyboard,
        'enable_return': enableReturn,
        'enable_exchange': enableExchange,
        'enable_points_payment': enablePointsPayment,
        if (gridColumnCount != null) 'grid_column_count': gridColumnCount,
        'sale_reference_prefix': saleReferencePrefix,
        'sale_reference_mode': saleReferenceMode,
        'sale_reference_next_seq': saleReferenceNextSeq,
        if (sidebarLogoPath != null) 'sidebar_logo_path': sidebarLogoPath,
        if (defaultCustomerId != null) 'default_customer_id': defaultCustomerId,
        if (defaultBillerId != null) 'default_biller_id': defaultBillerId,
        'theme_primary_color': themePrimaryColor,
        if (buttonPrimaryColor.isNotEmpty)
          'button_primary_color': buttonPrimaryColor,
        'dark_mode': darkMode,
        'font_scale': fontScale,
      };

  String encode() => jsonEncode(toJson());

  static PosUiSettings decode(String raw) =>
      PosUiSettings.fromJson(jsonDecode(raw) as Map<String, dynamic>);

  static int? _intOrNull(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    return int.tryParse(v.toString());
  }

  static bool _bool(dynamic v, {required bool fallback}) {
    if (v is bool) return v;
    if (v is int) return v != 0;
    if (v is String) {
      if (v == '1' || v.toLowerCase() == 'true') return true;
      if (v == '0' || v.toLowerCase() == 'false') return false;
    }
    return fallback;
  }

  static double? _doubleOrNull(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString());
  }
}
