import 'dart:convert';

class LocalReceiptLine {
  const LocalReceiptLine({
    required this.name,
    required this.code,
    required this.qty,
    required this.unitPrice,
    required this.total,
    this.description = '',
    this.discount = 0,
    this.tax = 0,
  });

  final String name;
  final String? code;
  final double qty;
  final double unitPrice;
  final double total;
  final String description;
  final double discount;
  final double tax;
}

/// Parsed return-credit settlements from a sale `payloadJson`.
class ReturnSettlementSummary {
  const ReturnSettlementSummary({
    this.credit = 0,
    this.references = const [],
  });

  final double credit;
  final List<String> references;

  bool get hasCredit => credit > 0.0001;

  String get referencesLabel => references.join(', ');

  /// Reads `return_settlements` from a sale sync payload JSON string.
  static ReturnSettlementSummary fromPayloadJson(String? payloadJson) {
    if (payloadJson == null || payloadJson.isEmpty) {
      return const ReturnSettlementSummary();
    }
    try {
      final decoded = jsonDecode(payloadJson);
      if (decoded is! Map) return const ReturnSettlementSummary();
      return fromPayloadMap(Map<String, dynamic>.from(decoded));
    } catch (_) {
      return const ReturnSettlementSummary();
    }
  }

  static ReturnSettlementSummary fromPayloadMap(Map<String, dynamic> map) {
    final raw = map['return_settlements'];
    if (raw is! List || raw.isEmpty) {
      return const ReturnSettlementSummary();
    }

    var credit = 0.0;
    final refs = <String>[];
    final seenRefs = <String>{};

    for (final entry in raw) {
      if (entry is! Map) continue;
      final row = Map<String, dynamic>.from(entry);
      final amount = (row['amount'] as num?)?.toDouble() ?? 0;
      if (amount > 0) credit += amount;

      final ref = (row['return_reference_no'] ?? row['reference_no'])
          ?.toString()
          .trim();
      if (ref != null && ref.isNotEmpty && seenRefs.add(ref)) {
        refs.add(ref);
      }
    }

    return ReturnSettlementSummary(credit: credit, references: refs);
  }
}

/// Sale receipt data for thermal printing.
class LocalReceipt {
  const LocalReceipt({
    required this.referenceNo,
    required this.createdAt,
    required this.customerName,
    required this.warehouseName,
    required this.cashierName,
    required this.lines,
    required this.grandTotal,
    required this.paidAmount,
    required this.totalTax,
    required this.totalDiscount,
    this.itemDiscount = 0,
    this.orderDiscount = 0,
    this.subtotal = 0,
    this.tenderedAmount = 0,
    this.returnCredit = 0,
    this.returnReferences = const [],
    this.serverSaleId,
    this.billTo = '',
    this.saleNote = '',
    this.paymentNote = '',
    this.dailySaleNumber = 0,
    this.registerName = 'MAIN',
    this.saleType = 'Cash',
  });

  final String referenceNo;
  final DateTime createdAt;
  final String customerName;
  final String warehouseName;
  final String cashierName;
  final List<LocalReceiptLine> lines;
  final double grandTotal;
  final double paidAmount;
  final double totalTax;
  final double totalDiscount;
  /// Sum of per-line item discounts.
  final double itemDiscount;
  /// Order-level discount (special discount on the sale).
  final double orderDiscount;
  final double subtotal;
  final double tenderedAmount;
  /// Return bill credit applied against this sale (reduces grand total).
  final double returnCredit;
  /// Return bill reference numbers applied as credit.
  final List<String> returnReferences;
  final int? serverSaleId;
  final String billTo;
  final String saleNote;
  final String paymentNote;
  final int dailySaleNumber;
  final String registerName;
  final String saleType;

  bool get hasReturnCredit => returnCredit > 0.0001;

  String get returnReferencesLabel => returnReferences.join(', ');

  int get totalItemCount => lines.length;

  double get totalDue =>
      grandTotal > paidAmount ? grandTotal - paidAmount : 0;

  double get balance {
    final tendered = tenderedAmount > 0 ? tenderedAmount : paidAmount;
    return tendered > grandTotal ? tendered - grandTotal : 0;
  }

  double get computedSubtotal {
    if (subtotal > 0) return subtotal;
    return lines.fold<double>(0, (s, l) => s + l.total);
  }

  double get computedItemDiscount {
    if (itemDiscount > 0) return itemDiscount;
    return lines.fold<double>(0, (s, l) => s + l.discount);
  }

  double get computedOrderDiscount {
    if (orderDiscount > 0) return orderDiscount;
    final item = computedItemDiscount;
    if (totalDiscount > item) return totalDiscount - item;
    return 0;
  }

  double get computedTotalDiscount =>
      computedItemDiscount + computedOrderDiscount;

  String get dailySaleLabel =>
      dailySaleNumber > 0 ? 'L-$dailySaleNumber' : '';

  /// Layout preview matching PosLanka-style receipt (sample lines).
  factory LocalReceipt.samplePreview({
    String cashierName = 'Admin',
  }) {
    return LocalReceipt(
      referenceNo: 'INV202406190205',
      createdAt: DateTime(2024, 6, 19, 4, 42, 36),
      customerName: 'Walking Customer, Sri Lanka',
      warehouseName: 'MAIN',
      cashierName: cashierName,
      dailySaleNumber: 1,
      registerName: 'MAIN',
      saleType: 'Cash',
      subtotal: 1009.99,
      itemDiscount: 50.00,
      orderDiscount: 51.00,
      totalDiscount: 101.00,
      totalTax: 0,
      grandTotal: 908.99,
      paidAmount: 908.99,
      tenderedAmount: 2000.00,
      lines: const [
        LocalReceiptLine(
          name: 'Smart Doorbell',
          code: '0003',
          qty: 1,
          unitPrice: 66.64,
          total: 66.64,
          discount: 10,
        ),
        LocalReceiptLine(
          name: 'Sample Product Two',
          code: '0004',
          qty: 2,
          unitPrice: 420.00,
          total: 840.00,
        ),
        LocalReceiptLine(
          name: 'Sample Product Three',
          code: '0005',
          qty: 1,
          unitPrice: 103.35,
          total: 103.35,
        ),
      ],
    );
  }

  /// Empty receipt for printer testing (no line items).
  factory LocalReceipt.emptyTest({
    String referenceNo = 'INV-TEST-0001',
    DateTime? createdAt,
    String customerName = 'Walking Customer',
    String warehouseName = 'MAIN',
    String cashierName = 'Admin',
    int dailySaleNumber = 1,
  }) {
    return LocalReceipt(
      referenceNo: referenceNo,
      createdAt: createdAt ?? DateTime.now(),
      customerName: customerName,
      warehouseName: warehouseName,
      cashierName: cashierName,
      dailySaleNumber: dailySaleNumber,
      registerName: 'MAIN',
      saleType: 'Cash',
      lines: const [],
      subtotal: 0,
      grandTotal: 0,
      paidAmount: 0,
      tenderedAmount: 0,
      totalTax: 0,
      totalDiscount: 0,
    );
  }
}
