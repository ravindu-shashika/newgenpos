import 'dart:async';
import 'dart:convert';

import 'package:drift/drift.dart';

import '../database/app_database.dart';
import '../../features/pos/models/cart_line.dart';
import '../../features/pos/models/local_receipt.dart';
import '../../features/pos/pos_totals.dart';
import '../../features/pos/sale_reference.dart';
import '../../features/pos/pos_helpers.dart';

class LocalSaleRepository {
  LocalSaleRepository(this._db);

  final AppDatabase _db;

  /// Serialize sync-status writes — avoids SQLITE_BUSY with background Drift isolate.
  static Future<void> _syncWriteChain = Future<void>.value();

  Future<int> saveCheckout({
    required String clientUuid,
    required String referenceNo,
    required int warehouseId,
    required int customerId,
    int? billerId,
    int? userId,
    int? cashRegisterId,
    required List<CartLine> lines,
    required double paidAmount,
    double payingAmount = 0,
    required PosTotals totals,
    double orderTaxRate = 0,
    String paidById = '1',
    bool isDraft = false,
    String saleNote = '',
    String staffNote = '',
    String paymentReceiver = '',
    String paymentNote = '',
    String cardNumber = '',
    String cardHolderName = '',
    String cardType = '',
    String chequeNo = '',
    List<MixPaymentLine>? mixPayments,
    List<Map<String, dynamic>> returnSettlements = const [],
    int currencyId = 1,
  }) async {
    final totalPrice = totals.subtotal + totals.lineTax;
    final tendered = payingAmount > 0 ? payingAmount : paidAmount;

    final payload = buildSyncPayload(
      clientUuid: clientUuid,
      referenceNo: referenceNo,
      warehouseId: warehouseId,
      customerId: customerId,
      billerId: billerId,
      userId: userId,
      cashRegisterId: cashRegisterId,
      lines: lines,
      paidAmount: paidAmount,
      payingAmount: tendered,
      orderDiscount: totals.orderDiscount,
      orderTaxRate: orderTaxRate,
      orderTax: totals.orderTax,
      shippingCost: totals.shippingCost,
      couponDiscount: totals.couponDiscount,
      paidById: paidById,
      isDraft: isDraft,
      saleNote: saleNote,
      staffNote: staffNote,
      paymentReceiver: paymentReceiver,
      paymentNote: paymentNote,
      cardNumber: cardNumber,
      cardHolderName: cardHolderName,
      cardType: cardType,
      chequeNo: chequeNo,
      mixPayments: mixPayments,
      returnSettlements: returnSettlements,
      grandTotal: totals.grandTotal,
      totalPrice: totalPrice,
      totalQty: totals.totalQty,
      totalDiscount: totals.totalDiscount,
      totalTax: totals.lineTax,
      currencyId: currencyId,
    );

    return _db.transaction(() async {
      final saleId = await _db.into(_db.localSales).insert(LocalSalesCompanion.insert(
            clientUuid: clientUuid,
            warehouseId: warehouseId,
            customerId: customerId,
            billerId: Value(billerId),
            referenceNo: Value(referenceNo),
            itemCount: Value(lines.length),
            totalQty: Value(totals.totalQty),
            totalDiscount: Value(totals.totalDiscount),
            totalTax: Value(totals.totalTax),
            grandTotal: totals.grandTotal,
            paidAmount: Value(paidAmount),
            orderDiscount: Value(totals.orderDiscount),
            orderTaxRate: Value(orderTaxRate),
            shippingCost: Value(totals.shippingCost),
            saleStatus: Value(isDraft ? 3 : 1),
            payloadJson: Value(jsonEncode(payload)),
            syncStatus: Value(isDraft ? 'draft' : 'pending'),
          ));

      for (final line in lines) {
        await _db.into(_db.localSaleLines).insert(LocalSaleLinesCompanion.insert(
              localSaleId: saleId,
              productId: line.productId,
              variantId: Value(line.variantId),
              code: Value(line.code),
              name: Value(line.name),
              qty: line.qty,
              netUnitPrice: line.netUnitPrice,
              discount: Value(line.discount),
              taxRate: Value(line.taxRate),
              tax: Value(line.lineTax),
              total: line.subtotal,
            ));
      }

      if (!isDraft) {
        await _deductWarehouseStock(warehouseId: warehouseId, lines: lines);
      }

      return saleId;
    });
  }

  /// Mirror legacy POS: reduce warehouse qty immediately when sale completes.
  Future<void> _deductWarehouseStock({
    required int warehouseId,
    required List<CartLine> lines,
  }) async {
    for (final line in lines) {
      final query = _db.select(_db.productStock)
        ..where((s) =>
            s.warehouseId.equals(warehouseId) &
            s.productId.equals(line.productId))
        ..orderBy([(s) => OrderingTerm.asc(s.id)]);

      if (line.variantId != null) {
        query.where((s) => s.variantId.equals(line.variantId!));
      }

      // Legacy Product_Warehouse::FindProductWithoutVariant uses first row for product+warehouse.
      final stock = await (query..limit(1)).getSingleOrNull();
      if (stock == null) continue;

      final newQty = stock.qty - line.qty;
      await (_db.update(_db.productStock)..where((s) => s.id.equals(stock.id)))
          .write(ProductStockCompanion(
        qty: Value(newQty < 0 ? 0 : newQty),
      ));
    }
  }

  Map<String, dynamic> buildSyncPayload({
    required String clientUuid,
    required String referenceNo,
    required int warehouseId,
    required int customerId,
    int? billerId,
    int? userId,
    int? cashRegisterId,
    required List<CartLine> lines,
    required double paidAmount,
    required double payingAmount,
    required double orderDiscount,
    double orderTaxRate = 0,
    double orderTax = 0,
    double shippingCost = 0,
    double couponDiscount = 0,
    String paidById = '1',
    bool isDraft = false,
    String saleNote = '',
    String staffNote = '',
    String paymentReceiver = '',
    String paymentNote = '',
    String cardNumber = '',
    String cardHolderName = '',
    String cardType = '',
    String chequeNo = '',
    List<MixPaymentLine>? mixPayments,
    List<Map<String, dynamic>> returnSettlements = const [],
    required double grandTotal,
    required double totalPrice,
    required double totalQty,
    required double totalDiscount,
    required double totalTax,
    int currencyId = 1,
  }) {
    final paymentAmount = isDraft ? 0.0 : paidAmount;
    final normalizedMix = !isDraft && mixPayments != null
        ? normalizeMixPayments(mixPayments)
        : <MixPaymentLine>[];

    final List<dynamic> paidByIds;
    final List<double> paidAmounts;
    final List<double> payingAmounts;
    if (normalizedMix.isNotEmpty) {
      paidByIds = normalizedMix.map((line) => encodePaidById(line.paidById)).toList();
      paidAmounts = normalizedMix.map((line) => line.payingAmount).toList();
      payingAmounts = normalizedMix.map((line) => line.cashReceived).toList();
    } else {
      paidByIds = isDraft ? <dynamic>[] : [encodePaidById(paidById)];
      paidAmounts = isDraft ? <double>[] : [paymentAmount];
      payingAmounts = isDraft ? <double>[] : [payingAmount];
    }

    final totalApplied = isDraft
        ? 0.0
        : (normalizedMix.isNotEmpty
            ? paidAmounts.fold<double>(0, (s, v) => s + v)
            : paymentAmount);

    return {
      'client_uuid': clientUuid,
      'reference_no': referenceNo,
      'warehouse_id': warehouseId,
      'customer_id': customerId,
      if (billerId != null) 'biller_id': billerId,
      if (userId != null) 'user_id': userId,
      if (cashRegisterId != null) 'cash_register_id': cashRegisterId,
      'item': lines.length,
      'total_qty': totalQty,
      'total_discount': totalDiscount,
      'total_tax': totalTax,
      'total_price': totalPrice,
      'order_tax': orderTax,
      'grand_total': grandTotal,
      'paid_amount': isDraft
          ? 0.0
          : (normalizedMix.isNotEmpty ? paidAmounts : paymentAmount),
      'paid_by_id': paidByIds,
      'paying_amount': payingAmounts,
      'payment_note': paymentNote,
      if (paymentReceiver.isNotEmpty) 'payment_receiver': paymentReceiver,
      if (cardNumber.isNotEmpty) 'card_number': cardNumber,
      if (cardHolderName.isNotEmpty) 'card_holder_name': cardHolderName,
      if (cardType.isNotEmpty) 'card_type': cardType,
      if (chequeNo.isNotEmpty) 'cheque_no': chequeNo,
      'account_id': 0,
      'currency_id': currencyId,
      'exchange_rate': 1,
      'sale_status': isDraft ? 3 : 1,
      'payment_status': isDraft
          ? 1
          : (totalApplied >= grandTotal
              ? 4
              : (totalApplied > 0 ? 2 : 1)),
      'order_discount': orderDiscount,
      'order_tax_rate': orderTaxRate,
      'shipping_cost': shippingCost,
      'coupon_discount': couponDiscount,
      'pos': 1,
      'draft': isDraft ? 1 : 0,
      'coupon_active': couponDiscount > 0 ? 1 : 0,
      if (saleNote.isNotEmpty) 'sale_note': saleNote,
      if (staffNote.isNotEmpty) 'staff_note': staffNote,
      if (returnSettlements.isNotEmpty)
        'return_settlements': returnSettlements,
      'lines': lines.map((l) => l.toSyncLine()).toList(),
      'products': lines.map((l) => l.toSyncLine()).toList(),
    };
  }

  /// Latest completed sale (not draft) for reprint.
  Future<LocalReceipt?> getLastReceipt({String? cashierName}) async {
    final sale = await (_db.select(_db.localSales)
          ..where((s) => s.saleStatus.equals(1))
          ..orderBy([(s) => OrderingTerm.desc(s.createdAt)])
          ..limit(1))
        .getSingleOrNull();
    if (sale == null) return null;

    final lines = await (_db.select(_db.localSaleLines)
          ..where((l) => l.localSaleId.equals(sale.id)))
        .get();

    final customer = await (_db.select(_db.customers)
          ..where((c) => c.id.equals(sale.customerId)))
        .getSingleOrNull();
    final warehouse = await (_db.select(_db.warehouses)
          ..where((w) => w.id.equals(sale.warehouseId)))
        .getSingleOrNull();

    final ref = sale.serverReferenceNo?.isNotEmpty == true
        ? sale.serverReferenceNo!
        : (sale.referenceNo ?? 'LOCAL-${sale.id}');

    final receiptLines = lines
        .map(
          (l) => LocalReceiptLine(
            name: l.name ?? 'Product',
            code: l.code,
            qty: l.qty,
            unitPrice: l.netUnitPrice,
            total: l.total,
            discount: l.discount,
            tax: l.tax,
          ),
        )
        .toList();

    final subtotal = receiptLines.fold<double>(0, (s, l) => s + l.total);

    return LocalReceipt(
      referenceNo: ref,
      createdAt: sale.createdAt,
      customerName: customer?.name ?? 'Customer #${sale.customerId}',
      warehouseName: warehouse?.name ?? 'Warehouse #${sale.warehouseId}',
      cashierName: cashierName ?? '',
      registerName: warehouse?.name ?? 'MAIN',
      dailySaleNumber: sale.id,
      saleType: 'CASH',
      subtotal: subtotal,
      grandTotal: sale.grandTotal,
      paidAmount: sale.paidAmount,
      tenderedAmount: sale.paidAmount,
      totalTax: sale.totalTax,
      totalDiscount: sale.totalDiscount,
      serverSaleId: sale.serverSaleId,
      lines: receiptLines,
    );
  }

  Future<String?> latestFailedSyncError() async {
    final sale = await (_db.select(_db.localSales)
          ..where((s) => s.syncStatus.equals('failed'))
          ..orderBy([(s) => OrderingTerm.desc(s.createdAt)])
          ..limit(1))
        .getSingleOrNull();
    final msg = sale?.errorMessage;
    if (msg != null && msg.isNotEmpty) return msg;
    return null;
  }

  Future<List<String>> loadUnsyncedClientUuids() async {
    final sales = await (_db.select(_db.localSales)
          ..where((s) =>
              s.syncStatus.isIn(['pending', 'failed', 'queued']) &
              s.saleStatus.equals(1)))
        .get();
    return sales.map((s) => s.clientUuid).toList();
  }

  Future<List<Map<String, dynamic>>> loadPendingSyncPayloads({
    bool includeFailed = true,
  }) async {
    // Re-upload `queued`/`failed` on manual retry when server job never ran.
    // Draft / hold bills (sale_status 3) stay local and are never synced.
    final statuses =
        includeFailed ? ['pending', 'failed', 'queued'] : ['pending'];
    final sales = await (_db.select(_db.localSales)
          ..where((s) =>
              s.syncStatus.isIn(statuses) & s.saleStatus.equals(1))
          ..orderBy([(s) => OrderingTerm.asc(s.createdAt)]))
        .get();

    return sales.map((s) {
      if (s.payloadJson != null && s.payloadJson!.isNotEmpty) {
        return Map<String, dynamic>.from(jsonDecode(s.payloadJson!) as Map);
      }
      return <String, dynamic>{'client_uuid': s.clientUuid};
    }).toList();
  }

  Future<void> markSynced(
    String clientUuid, {
    required String status,
    int? serverSaleId,
    String? referenceNo,
    String? error,
  }) async {
    await _writeSyncStatus([
      LocalSyncStatusUpdate(
        clientUuid: clientUuid,
        status: status,
        serverSaleId: serverSaleId,
        referenceNo: referenceNo,
        error: error,
      ),
    ]);
  }

  Future<void> markManySynced(List<LocalSyncStatusUpdate> updates) async {
    if (updates.isEmpty) return;
    await _writeSyncStatus(updates);
  }

  Future<void> _writeSyncStatus(List<LocalSyncStatusUpdate> updates) async {
    final previous = _syncWriteChain;
    final gate = Completer<void>();
    _syncWriteChain = gate.future;
    await previous;
    try {
      for (final update in updates) {
        await _writeOneSyncStatus(update);
      }
      gate.complete();
    } catch (e, stack) {
      if (!gate.isCompleted) {
        gate.completeError(e, stack);
      }
      rethrow;
    }
  }

  Future<void> _writeOneSyncStatus(LocalSyncStatusUpdate update) async {
    final syncStatus = switch (update.status) {
      'synced' || 'already_synced' => 'synced',
      'failed' => 'failed',
      'queued' => 'queued',
      _ => 'pending',
    };

    for (var attempt = 0; attempt < 12; attempt++) {
      try {
        await (_db.update(_db.localSales)
              ..where((s) => s.clientUuid.equals(update.clientUuid)))
            .write(LocalSalesCompanion(
          syncStatus: Value(syncStatus),
          serverSaleId: Value(update.serverSaleId),
          serverReferenceNo: Value(update.referenceNo),
          errorMessage: syncStatus == 'synced'
              ? const Value(null)
              : Value(update.error),
          syncedAt: syncStatus == 'synced'
              ? Value(DateTime.now())
              : const Value.absent(),
        ));
        return;
      } catch (e) {
        if (!_isDbLocked(e) || attempt == 11) rethrow;
        await Future<void>.delayed(
          Duration(milliseconds: 50 * (attempt + 1)),
        );
      }
    }
  }

  bool _isDbLocked(Object e) {
    final text = e.toString().toLowerCase();
    return text.contains('database is locked') || text.contains('sqlite_busy');
  }

  /// Find a completed local sale by reference, server id, or partial ref suffix.
  Future<LocalSale?> findByReference(String referenceNo) async {
    final needle = normalizeSaleReference(referenceNo);
    if (needle.isEmpty) return null;

    final sales = await (_db.select(_db.localSales)
          ..where((s) => s.saleStatus.equals(1))
          ..orderBy([(s) => OrderingTerm.desc(s.createdAt)]))
        .get();

    for (final sale in sales) {
      if (_saleMatchesReference(sale, needle, partial: false)) return sale;
    }

    if (needle.length >= 4) {
      for (final sale in sales) {
        if (_saleMatchesReference(sale, needle, partial: true)) return sale;
      }
    }

    return null;
  }

  bool _saleMatchesReference(
    LocalSale sale,
    String needle, {
    required bool partial,
  }) {
    final numericNeedle = int.tryParse(needle);
    if (numericNeedle != null) {
      if (sale.serverSaleId == numericNeedle || sale.id == numericNeedle) {
        return true;
      }
    }

    final candidates = <String>[
      normalizeSaleReference(sale.referenceNo),
      normalizeSaleReference(sale.serverReferenceNo),
      normalizeSaleReference(sale.clientUuid),
    ];

    if (sale.payloadJson != null) {
      try {
        final payload = jsonDecode(sale.payloadJson!) as Map<String, dynamic>;
        candidates.add(
          normalizeSaleReference(payload['reference_no']?.toString()),
        );
      } catch (_) {}
    }

    for (final candidate in candidates) {
      if (candidate.isEmpty) continue;
      if (partial) {
        if (candidate == needle || candidate.endsWith(needle)) return true;
      } else if (candidate == needle) {
        return true;
      }
    }
    return false;
  }

  /// Mirror server product_sale.return_qty for offline returns/exchanges.
  Future<void> addReturnQtyToLocalSale({
    required String saleReferenceNo,
    required List<({int productSaleId, double qty})> updates,
  }) async {
    if (updates.isEmpty) return;

    final sale = await findByReference(saleReferenceNo);
    if (sale == null || sale.payloadJson == null) return;

    final payload = jsonDecode(sale.payloadJson!) as Map<String, dynamic>;
    final lines = (payload['lines'] as List<dynamic>? ??
            payload['products'] as List<dynamic>? ??
            [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();

    for (final update in updates) {
      if (update.qty <= 0) continue;
      final idx = update.productSaleId - 1;
      if (idx < 0 || idx >= lines.length) continue;
      final prev = (lines[idx]['return_qty'] as num?)?.toDouble() ?? 0;
      lines[idx]['return_qty'] = prev + update.qty;
    }

    payload['lines'] = lines;
    await (_db.update(_db.localSales)..where((s) => s.id.equals(sale.id)))
        .write(LocalSalesCompanion(
      payloadJson: Value(jsonEncode(payload)),
    ));
  }
}

class LocalSyncStatusUpdate {
  const LocalSyncStatusUpdate({
    required this.clientUuid,
    required this.status,
    this.serverSaleId,
    this.referenceNo,
    this.error,
  });

  final String clientUuid;
  final String status;
  final int? serverSaleId;
  final String? referenceNo;
  final String? error;
}
