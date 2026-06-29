class ReturnSaleLookupLine {
  const ReturnSaleLookupLine({
    required this.productSaleId,
    required this.productId,
    required this.name,
    required this.code,
    required this.returnableQty,
    required this.netUnitPrice,
    required this.discount,
    required this.taxRate,
    required this.tax,
    required this.subtotal,
    this.variantId,
    this.productBatchId,
    this.saleUnit = 'pc',
    this.imeiNumber = '',
  });

  final int productSaleId;
  final int productId;
  final int? variantId;
  final int? productBatchId;
  final String name;
  final String code;
  final double returnableQty;
  final double netUnitPrice;
  final double discount;
  final double taxRate;
  final double tax;
  final double subtotal;
  final String saleUnit;
  final String imeiNumber;

  factory ReturnSaleLookupLine.fromJson(Map<String, dynamic> json) {
    return ReturnSaleLookupLine(
      productSaleId: (json['product_sale_id'] as num).toInt(),
      productId: (json['product_id'] as num).toInt(),
      variantId: (json['variant_id'] as num?)?.toInt(),
      productBatchId: (json['product_batch_id'] as num?)?.toInt(),
      name: json['name']?.toString() ?? 'Product',
      code: json['code']?.toString() ?? '',
      returnableQty: (json['returnable_qty'] as num?)?.toDouble() ??
          (json['qty'] as num?)?.toDouble() ??
          0,
      netUnitPrice: (json['net_unit_price'] as num?)?.toDouble() ?? 0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0,
      taxRate: (json['tax_rate'] as num?)?.toDouble() ?? 0,
      tax: (json['tax'] as num?)?.toDouble() ?? 0,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
      saleUnit: json['sale_unit']?.toString() ?? 'pc',
      imeiNumber: json['imei_number']?.toString() ?? '',
    );
  }
}

class ReturnSaleLookup {
  const ReturnSaleLookup({
    required this.saleId,
    required this.referenceNo,
    required this.customerId,
    required this.warehouseId,
    required this.orderDiscount,
    required this.orderTaxRate,
    required this.lines,
  });

  final int saleId;
  final String referenceNo;
  final int customerId;
  final int warehouseId;
  final double orderDiscount;
  final double orderTaxRate;
  final List<ReturnSaleLookupLine> lines;

  factory ReturnSaleLookup.fromJson(Map<String, dynamic> json) {
    final sale = Map<String, dynamic>.from(json['sale'] as Map);
    final rawLines = json['lines'] as List<dynamic>? ?? [];
    return ReturnSaleLookup(
      saleId: (sale['id'] as num).toInt(),
      referenceNo: sale['reference_no']?.toString() ?? '',
      customerId: (sale['customer_id'] as num?)?.toInt() ?? 0,
      warehouseId: (sale['warehouse_id'] as num?)?.toInt() ?? 0,
      orderDiscount: (sale['order_discount'] as num?)?.toDouble() ?? 0,
      orderTaxRate: (sale['order_tax_rate'] as num?)?.toDouble() ?? 0,
      lines: rawLines
          .map((e) => ReturnSaleLookupLine.fromJson(
                Map<String, dynamic>.from(e as Map),
              ))
          .toList(),
    );
  }
}

class PendingReturnCredit {
  const PendingReturnCredit({
    required this.clientUuid,
    required this.referenceNo,
    required this.creditRemaining,
    this.returnId,
    this.saleId,
  });

  final String clientUuid;
  final String referenceNo;
  final double creditRemaining;
  final int? returnId;
  final int? saleId;

  factory PendingReturnCredit.fromJson(Map<String, dynamic> json) {
    return PendingReturnCredit(
      clientUuid: json['client_uuid']?.toString() ?? '',
      referenceNo: json['reference_no']?.toString() ?? '',
      creditRemaining: (json['credit_remaining'] as num?)?.toDouble() ?? 0,
      returnId: (json['return_id'] as num?)?.toInt(),
      saleId: (json['sale_id'] as num?)?.toInt(),
    );
  }

  factory PendingReturnCredit.fromLocal({
    required String clientUuid,
    required String referenceNo,
    required double grandTotal,
    required double settledAmount,
    int? serverReturnId,
    int? saleId,
  }) {
    return PendingReturnCredit(
      clientUuid: clientUuid,
      referenceNo: referenceNo,
      creditRemaining: grandTotal - settledAmount,
      returnId: serverReturnId,
      saleId: saleId,
    );
  }
}

/// Result after saving a return locally (for print + sync).
class SavedReturnResult {
  const SavedReturnResult({
    required this.clientUuid,
    required this.referenceNo,
    required this.grandTotal,
    required this.creditRemaining,
    this.saleReferenceNo,
    this.lines = const [],
    this.createdAt,
  });

  final String clientUuid;
  final String referenceNo;
  final double grandTotal;
  final double creditRemaining;
  final String? saleReferenceNo;
  final List<ReturnReceiptLine> lines;
  final DateTime? createdAt;
}

class ReturnReceiptLine {
  const ReturnReceiptLine({
    required this.name,
    required this.code,
    required this.qty,
    required this.unitPrice,
    required this.total,
  });

  final String name;
  final String code;
  final double qty;
  final double unitPrice;
  final double total;
}

class AppliedReturnSettlement {
  const AppliedReturnSettlement({
    required this.returnClientUuid,
    required this.returnReferenceNo,
    required this.amount,
    this.returnId,
  });

  final String returnClientUuid;
  final String returnReferenceNo;
  final double amount;
  final int? returnId;

  Map<String, dynamic> toSyncJson() => {
        if (returnId != null) 'return_id': returnId,
        'return_client_uuid': returnClientUuid,
        'amount': amount,
      };
}
