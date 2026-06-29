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
    this.subtotal = 0,
    this.tenderedAmount = 0,
    this.serverSaleId,
    this.billTo = '',
    this.saleNote = '',
    this.paymentNote = '',
    this.dailySaleNumber = 0,
    this.registerName = 'MAIN',
    this.saleType = 'CASH',
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
  final double subtotal;
  final double tenderedAmount;
  final int? serverSaleId;
  final String billTo;
  final String saleNote;
  final String paymentNote;
  final int dailySaleNumber;
  final String registerName;
  final String saleType;

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
      saleType: 'CASH',
      subtotal: 1009.99,
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
      saleType: 'CASH',
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
