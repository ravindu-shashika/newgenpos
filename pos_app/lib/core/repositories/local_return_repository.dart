import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';

import '../../features/pos/models/return_models.dart';
import '../../features/pos/models/scanned_product.dart';
import '../../features/pos/sale_reference.dart';
import '../database/app_database.dart';
import 'local_sale_repository.dart';

class LocalReturnRepository {
  LocalReturnRepository(this._db, this._saleRepo);

  final AppDatabase _db;
  final LocalSaleRepository _saleRepo;
  static const _uuid = Uuid();

  Future<ReturnSaleLookup?> lookupLocalSaleByReference(String referenceNo) async {
    final ref = referenceNo.trim();
    if (ref.isEmpty) return null;

    final sale = await _saleRepo.findByReference(ref);
    if (sale == null) return null;

    final dbLines = await (_db.select(_db.localSaleLines)
          ..where((l) => l.localSaleId.equals(sale.id)))
        .get();

    final payloadLines = <Map<String, dynamic>>[];
    if (sale.payloadJson != null) {
      try {
        final payload = jsonDecode(sale.payloadJson!) as Map<String, dynamic>;
        final linesRaw = payload['lines'] as List<dynamic>? ??
            payload['products'] as List<dynamic>? ??
            [];
        payloadLines.addAll(
          linesRaw.map((e) => Map<String, dynamic>.from(e as Map)),
        );
      } catch (_) {}
    }

    if (dbLines.isEmpty && payloadLines.isEmpty) return null;

    final lookupLines = <ReturnSaleLookupLine>[];
    final lineCount = dbLines.isNotEmpty ? dbLines.length : payloadLines.length;

    for (var i = 0; i < lineCount; i++) {
      final dbLine = i < dbLines.length ? dbLines[i] : null;
      final payloadLine = i < payloadLines.length ? payloadLines[i] : null;

      final qty = (payloadLine?['qty'] as num?)?.toDouble() ??
          dbLine?.qty ??
          0;
      final returnedQty =
          (payloadLine?['return_qty'] as num?)?.toDouble() ?? 0;
      final returnableQty = (qty - returnedQty).clamp(0.0, qty).toDouble();
      if (returnableQty <= 0) continue;

      lookupLines.add(
        ReturnSaleLookupLine(
          productSaleId:
              (payloadLine?['product_sale_id'] as num?)?.toInt() ?? (i + 1),
          productId: (payloadLine?['product_id'] as num?)?.toInt() ??
              dbLine?.productId ??
              0,
          variantId: (payloadLine?['variant_id'] as num?)?.toInt() ??
              dbLine?.variantId,
          productBatchId: (payloadLine?['product_batch_id'] as num?)?.toInt() ??
              dbLine?.productBatchId,
          name: payloadLine?['name']?.toString() ??
              dbLine?.name ??
              'Product',
          code: payloadLine?['code']?.toString() ?? dbLine?.code ?? '',
          returnableQty: returnableQty,
          netUnitPrice: (payloadLine?['net_unit_price'] as num?)?.toDouble() ??
              dbLine?.netUnitPrice ??
              0,
          discount: (payloadLine?['discount'] as num?)?.toDouble() ??
              dbLine?.discount ??
              0,
          taxRate: (payloadLine?['tax_rate'] as num?)?.toDouble() ??
              dbLine?.taxRate ??
              0,
          tax: (payloadLine?['tax'] as num?)?.toDouble() ?? dbLine?.tax ?? 0,
          subtotal: (payloadLine?['subtotal'] as num?)?.toDouble() ??
              (payloadLine?['total'] as num?)?.toDouble() ??
              dbLine?.total ??
              0,
          saleUnit:
              payloadLine?['sale_unit']?.toString() ?? dbLine?.saleUnit ?? 'pc',
          imeiNumber: payloadLine?['imei_number']?.toString() ??
              dbLine?.imeiNumber ??
              '',
        ),
      );
    }

    if (lookupLines.isEmpty) return null;

    return ReturnSaleLookup(
      saleId: sale.serverSaleId ?? sale.id,
      referenceNo: sale.serverReferenceNo ?? sale.referenceNo ?? ref,
      customerId: sale.customerId,
      warehouseId: sale.warehouseId,
      orderDiscount: sale.orderDiscount,
      orderTaxRate: sale.orderTaxRate,
      lines: lookupLines,
    );
  }

  /// Local database only — same fields as server return lookup.
  Future<ReturnSaleLookup?> resolveSaleForReturn({
    required String referenceNo,
  }) async {
    return lookupLocalSaleByReference(referenceNo);
  }

  Future<SavedReturnResult> saveReturn({
    required ReturnSaleLookup lookup,
    required List<({ReturnSaleLookupLine line, double qty, bool isDamage})>
        selections,
    required int warehouseId,
    required int customerId,
    int? saleId,
    String? returnNote,
  }) async {
    final clientUuid = _uuid.v4();
    var totalQty = 0.0;
    var totalDiscount = 0.0;
    var totalTax = 0.0;
    var totalPrice = 0.0;

    final linePayloads = <Map<String, dynamic>>[];
    for (final row in selections) {
      if (row.qty <= 0) continue;
      final line = row.line;
      final ratio = row.qty / (line.returnableQty > 0 ? line.returnableQty : 1);
      final lineDiscount = line.discount * ratio;
      final lineTax = line.tax * ratio;
      final lineTotal = line.netUnitPrice * row.qty + lineTax;

      totalQty += row.qty;
      totalDiscount += lineDiscount;
      totalTax += lineTax;
      totalPrice += lineTotal;

      linePayloads.add({
        'product_sale_id': line.productSaleId,
        'product_id': line.productId,
        'product_variant_id': line.variantId,
        'product_batch_id': line.productBatchId,
        'product_code': line.code,
        'qty': row.qty,
        'net_unit_price': line.netUnitPrice,
        'discount': lineDiscount,
        'tax_rate': line.taxRate,
        'tax': lineTax,
        'subtotal': lineTotal,
        'total': lineTotal,
        'sale_unit': line.saleUnit,
        'imei_number': line.imeiNumber,
        'is_damage': row.isDamage,
      });
    }

    if (linePayloads.isEmpty) {
      throw StateError('Select at least one item to return.');
    }

    final orderTax =
        (totalPrice - lookup.orderDiscount) * (lookup.orderTaxRate / 100);
    final grandTotal =
        totalPrice + orderTax - lookup.orderDiscount;

    final payload = {
      'client_uuid': clientUuid,
      'sale_id': saleId ?? lookup.saleId,
      'sale_reference_no': lookup.referenceNo,
      'refund': 0,
      'change_sale_status': 0,
      'item': linePayloads.length,
      'total_qty': totalQty,
      'total_discount': totalDiscount,
      'total_tax': totalTax,
      'total_price': totalPrice,
      'order_tax_rate': lookup.orderTaxRate,
      'order_tax': orderTax,
      'grand_total': grandTotal,
      'total_sale_discount': lookup.orderDiscount,
      'return_note': returnNote ?? '',
      'lines': linePayloads,
    };

    final referenceNo = generateReturnReference();
    final createdAt = DateTime.now();

    payload['reference_no'] = referenceNo;

    await _db.into(_db.localReturns).insert(LocalReturnsCompanion.insert(
          clientUuid: clientUuid,
          saleId: Value(saleId ?? lookup.saleId),
          saleReferenceNo: lookup.referenceNo,
          warehouseId: warehouseId,
          customerId: customerId,
          referenceNo: Value(referenceNo),
          grandTotal: grandTotal,
          payloadJson: jsonEncode(payload),
        ));

    for (final row in selections) {
      if (row.qty <= 0 || row.isDamage) continue;
      await _restoreWarehouseStock(
        warehouseId: warehouseId,
        productId: row.line.productId,
        variantId: row.line.variantId,
        qty: row.qty,
      );
    }

    await _saleRepo.addReturnQtyToLocalSale(
      saleReferenceNo: lookup.referenceNo,
      updates: selections
          .where((r) => r.qty > 0)
          .map((r) => (productSaleId: r.line.productSaleId, qty: r.qty))
          .toList(),
    );

    final receiptLines = selections
        .where((r) => r.qty > 0)
        .map(
          (r) => ReturnReceiptLine(
            name: r.line.name,
            code: r.line.code,
            qty: r.qty,
            unitPrice: r.line.netUnitPrice,
            total: r.line.netUnitPrice * r.qty,
          ),
        )
        .toList();

    return SavedReturnResult(
      clientUuid: clientUuid,
      referenceNo: referenceNo,
      grandTotal: grandTotal,
      creditRemaining: grandTotal,
      saleReferenceNo: lookup.referenceNo,
      lines: receiptLines,
      createdAt: createdAt,
    );
  }

  /// Return without original sale bill — scan products and issue store credit.
  Future<SavedReturnResult> saveReturnWithoutBill({
    required List<({ScannedProduct product, double qty, bool isDamage})>
        selections,
    required int warehouseId,
    required int customerId,
    int? billerId,
    String? returnNote,
  }) async {
    final clientUuid = _uuid.v4();
    var totalQty = 0.0;
    var totalDiscount = 0.0;
    var totalTax = 0.0;
    var totalPrice = 0.0;

    final linePayloads = <Map<String, dynamic>>[];
    final receiptLines = <ReturnReceiptLine>[];

    for (final row in selections) {
      if (row.qty <= 0) continue;
      final product = row.product;
      final lineTax = product.price * product.taxRate / 100 * row.qty;
      final lineTotal = product.price * row.qty + lineTax;

      totalQty += row.qty;
      totalTax += lineTax;
      totalPrice += lineTotal;

      linePayloads.add({
        'product_id': product.productId,
        'product_variant_id': product.variantId,
        'product_code': product.code,
        'qty': row.qty,
        'net_unit_price': product.price,
        'discount': 0,
        'tax_rate': product.taxRate,
        'tax': lineTax,
        'subtotal': lineTotal,
        'total': lineTotal,
        'sale_unit': 'pc',
        'is_damage': row.isDamage,
      });

      receiptLines.add(
        ReturnReceiptLine(
          name: product.name,
          code: product.code,
          qty: row.qty,
          unitPrice: product.price,
          total: lineTotal,
        ),
      );
    }

    if (linePayloads.isEmpty) {
      throw StateError('Select at least one item to return.');
    }

    final grandTotal = totalPrice;
    final referenceNo = generateReturnReference();
    final createdAt = DateTime.now();

    final payload = {
      'client_uuid': clientUuid,
      'reference_no': referenceNo,
      'return_type': 'without_sale',
      'sale_id': null,
      'sale_reference_no': '',
      'refund': 0,
      'warehouse_id': warehouseId,
      'customer_id': customerId,
      if (billerId != null) 'biller_id': billerId,
      'item': linePayloads.length,
      'total_qty': totalQty,
      'total_discount': totalDiscount,
      'total_tax': totalTax,
      'total_price': totalPrice,
      'order_tax_rate': 0,
      'order_tax': 0,
      'grand_total': grandTotal,
      'total_sale_discount': 0,
      'return_note': returnNote ?? '',
      'lines': linePayloads,
    };

    await _db.into(_db.localReturns).insert(LocalReturnsCompanion.insert(
          clientUuid: clientUuid,
          saleId: const Value.absent(),
          saleReferenceNo: '',
          warehouseId: warehouseId,
          customerId: customerId,
          referenceNo: Value(referenceNo),
          grandTotal: grandTotal,
          payloadJson: jsonEncode(payload),
        ));

    for (final row in selections) {
      if (row.qty <= 0 || row.isDamage) continue;
      await _restoreWarehouseStock(
        warehouseId: warehouseId,
        productId: row.product.productId,
        variantId: row.product.variantId,
        qty: row.qty,
      );
    }

    return SavedReturnResult(
      clientUuid: clientUuid,
      referenceNo: referenceNo,
      grandTotal: grandTotal,
      creditRemaining: grandTotal,
      lines: receiptLines,
      createdAt: createdAt,
    );
  }

  /// Find pending return credit by return bill reference (barcode scan).
  Future<PendingReturnCredit?> lookupCreditByReference({
    required String referenceNo,
    int? warehouseId,
    int? customerId,
  }) async {
    final ref = referenceNo.trim();
    if (ref.isEmpty) return null;

    final normalized = normalizeSaleReference(ref);

    final q = _db.select(_db.localReturns)
      ..where((r) => r.grandTotal.isBiggerThan(r.settledAmount));

    if (warehouseId != null) {
      q.where((r) => r.warehouseId.equals(warehouseId));
    }
    if (customerId != null) {
      q.where((r) => r.customerId.equals(customerId));
    }

    final rows = await q.get();
    for (final row in rows) {
      final candidates = [
        row.referenceNo,
        row.serverReferenceNo,
        row.clientUuid,
      ];
      for (final candidate in candidates) {
        if (candidate == null || candidate.trim().isEmpty) continue;
        if (normalizeSaleReference(candidate) == normalized) {
          final credit = PendingReturnCredit.fromLocal(
            clientUuid: row.clientUuid,
            referenceNo: row.serverReferenceNo ?? row.referenceNo ?? row.clientUuid,
            grandTotal: row.grandTotal,
            settledAmount: row.settledAmount,
            serverReturnId: row.serverReturnId,
            saleId: row.saleId,
          );
          if (credit.creditRemaining > 0.0001) return credit;
        }
      }
    }

    return null;
  }

  /// Apply a manual settlement amount across pending credits (oldest first).
  List<AppliedReturnSettlement> distributeManualSettlement({
    required List<PendingReturnCredit> credits,
    required double amount,
    required double maxApply,
  }) {
    var remaining = amount.clamp(0, maxApply);
    final result = <AppliedReturnSettlement>[];
    if (remaining <= 0 || credits.isEmpty) return result;

    for (final credit in credits) {
      if (remaining <= 0) break;
      final apply = remaining.clamp(0, credit.creditRemaining).toDouble();
      if (apply <= 0) continue;
      result.add(
        AppliedReturnSettlement(
          returnClientUuid: credit.clientUuid,
          returnReferenceNo: credit.referenceNo,
          amount: apply,
          returnId: credit.returnId,
        ),
      );
      remaining -= apply;
    }
    return result;
  }

  Future<void> _restoreWarehouseStock({
    required int warehouseId,
    required int productId,
    int? variantId,
    required double qty,
  }) async {
    final query = _db.select(_db.productStock)
      ..where((s) =>
          s.warehouseId.equals(warehouseId) & s.productId.equals(productId))
      ..orderBy([(s) => OrderingTerm.asc(s.id)]);

    if (variantId != null) {
      query.where((s) => s.variantId.equals(variantId));
    }

    final stock = await (query..limit(1)).getSingleOrNull();
    if (stock == null) return;

    await (_db.update(_db.productStock)..where((s) => s.id.equals(stock.id)))
        .write(ProductStockCompanion(
      qty: Value(stock.qty + qty),
    ));
  }

  Future<List<Map<String, dynamic>>> loadPendingSyncPayloads({
    bool includeFailed = true,
  }) async {
    final statuses = includeFailed
        ? ['pending', 'failed', 'queued']
        : ['pending', 'queued'];
    final rows = await (_db.select(_db.localReturns)
          ..where((r) => r.syncStatus.isIn(statuses))
          ..orderBy([(r) => OrderingTerm.asc(r.createdAt)]))
        .get();

    return rows.map((row) {
      final payload = jsonDecode(row.payloadJson) as Map<String, dynamic>;
      return Map<String, dynamic>.from(payload);
    }).toList();
  }

  Future<List<String>> loadUnsyncedClientUuids() async {
    final rows = await (_db.select(_db.localReturns)
          ..where((r) =>
              r.syncStatus.isIn(['pending', 'failed', 'queued', 'processing'])))
        .get();
    return rows.map((r) => r.clientUuid).toList();
  }

  Future<void> markSynced(
    String clientUuid, {
    required String status,
    int? serverReturnId,
    String? referenceNo,
    String? error,
  }) async {
    await (_db.update(_db.localReturns)
          ..where((r) => r.clientUuid.equals(clientUuid)))
        .write(LocalReturnsCompanion(
      syncStatus: Value(status),
      serverReturnId: Value(serverReturnId),
      serverReferenceNo: Value(referenceNo),
      errorMessage: Value(error),
      syncedAt: status == 'synced' ? Value(DateTime.now()) : const Value.absent(),
    ));
  }

  Future<List<PendingReturnCredit>> loadPendingCredits({
    int? warehouseId,
    int? customerId,
  }) async {
    final q = _db.select(_db.localReturns)
      ..where((r) => r.grandTotal.isBiggerThan(r.settledAmount));

    if (warehouseId != null) {
      q.where((r) => r.warehouseId.equals(warehouseId));
    }
    if (customerId != null) {
      q.where((r) => r.customerId.equals(customerId));
    }

    final rows = await (q..orderBy([(r) => OrderingTerm.desc(r.createdAt)]))
        .get();

    return rows
        .map(
          (r) => PendingReturnCredit.fromLocal(
            clientUuid: r.clientUuid,
            referenceNo: r.serverReferenceNo ?? r.referenceNo ?? r.clientUuid,
            grandTotal: r.grandTotal,
            settledAmount: r.settledAmount,
            serverReturnId: r.serverReturnId,
            saleId: r.saleId,
          ),
        )
        .where((c) => c.creditRemaining > 0.0001)
        .toList();
  }

  Future<void> applyLocalSettlement(
    String returnClientUuid,
    double amount,
  ) async {
    final row = await (_db.select(_db.localReturns)
          ..where((r) => r.clientUuid.equals(returnClientUuid)))
        .getSingleOrNull();
    if (row == null) return;

    final remaining = row.grandTotal - row.settledAmount;
    final apply = amount.clamp(0, remaining);
    await (_db.update(_db.localReturns)..where((r) => r.id.equals(row.id)))
        .write(LocalReturnsCompanion(
      settledAmount: Value(row.settledAmount + apply),
    ));
  }
}
