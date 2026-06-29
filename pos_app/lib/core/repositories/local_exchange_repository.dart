import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';

import '../../features/pos/models/exchange_models.dart';
import '../../features/pos/models/return_models.dart';
import '../../features/pos/sale_reference.dart';
import '../database/app_database.dart';
import 'local_sale_repository.dart';

class LocalExchangeRepository {
  LocalExchangeRepository(this._db, this._saleRepo);

  final AppDatabase _db;
  final LocalSaleRepository _saleRepo;
  static const _uuid = Uuid();

  Future<String> saveExchange({
    required ReturnSaleLookup lookup,
    required List<({ReturnSaleLookupLine line, double qty})> returnSelections,
    required List<ExchangeNewLine> newLines,
    required int warehouseId,
    int? saleId,
    String? exchangeNote,
    String? staffNote,
  }) async {
    if (returnSelections.isEmpty) {
      throw StateError('Select at least one item to return.');
    }
    if (newLines.isEmpty) {
      throw StateError('Add at least one new product.');
    }

    final clientUuid = _uuid.v4();
    final exchangeRef = generateExchangeReference();
    var exchangeValue = 0.0;
    var newProductsTotal = 0.0;
    var totalQty = 0.0;
    var totalDiscount = 0.0;
    var totalTax = 0.0;

    final linePayloads = <Map<String, dynamic>>[];

    for (final row in returnSelections) {
      if (row.qty <= 0) continue;
      final line = row.line;
      final ratio =
          row.qty / (line.returnableQty > 0 ? line.returnableQty : 1);
      final lineDiscount = line.discount * ratio;
      final lineTax = line.tax * ratio;
      final lineTotal = line.netUnitPrice * row.qty + lineTax;

      exchangeValue += lineTotal;
      totalQty += row.qty;
      totalDiscount += lineDiscount;
      totalTax += lineTax;

      linePayloads.add({
        'type': 'return',
        'product_sale_id': line.productSaleId,
        'product_id': line.productId,
        'product_code': line.code,
        'qty': row.qty,
        'net_unit_price': line.netUnitPrice,
        'discount': lineDiscount,
        'tax_rate': line.taxRate,
        'tax': lineTax,
        'subtotal': lineTotal,
        'total': lineTotal,
        'sale_unit': line.saleUnit,
        'product_batch_id': line.productBatchId,
        'imei_number': line.imeiNumber,
      });
    }

    for (final line in newLines) {
      if (line.qty <= 0) continue;
      newProductsTotal += line.lineTotal;
      totalQty += line.qty;
      totalDiscount += line.discount;
      totalTax += line.tax;

      linePayloads.add({
        'type': 'new',
        'product_id': line.productId,
        'product_code': line.code,
        'qty': line.qty,
        'net_unit_price': line.netUnitPrice,
        'discount': line.discount,
        'tax_rate': line.taxRate,
        'tax': line.tax,
        'subtotal': line.lineTotal,
        'total': line.lineTotal,
        'sale_unit': line.saleUnit,
        'product_batch_id': line.productBatchId,
        'imei_number': line.imeiNumber,
      });
    }

    final balance = newProductsTotal - exchangeValue;
    String? paymentType;
    if (balance > 0) {
      paymentType = 'receive';
    } else if (balance < 0) {
      paymentType = 'pay';
    }

    final payload = {
      'client_uuid': clientUuid,
      'reference_no': exchangeRef,
      'sale_id': saleId ?? lookup.saleId,
      'sale_reference_no': lookup.referenceNo,
      'exchange_value': exchangeValue,
      'new_products_total': newProductsTotal,
      'balance': balance,
      'amount': balance.abs(),
      'payment_type': paymentType,
      'item': linePayloads.length,
      'total_qty': totalQty,
      'total_discount': totalDiscount,
      'total_tax': totalTax,
      'order_tax_rate': 0,
      'order_tax': 0,
      'grand_total': newProductsTotal,
      'exchange_note': exchangeNote ?? '',
      'staff_note': staffNote ?? '',
      'lines': linePayloads,
    };

    await _db.into(_db.localExchanges).insert(LocalExchangesCompanion.insert(
          clientUuid: clientUuid,
          saleId: Value(saleId ?? lookup.saleId),
          saleReferenceNo: lookup.referenceNo,
          warehouseId: warehouseId,
          customerId: lookup.customerId,
          referenceNo: Value(exchangeRef),
          balance: balance,
          paymentType: Value(paymentType),
          payloadJson: jsonEncode(payload),
        ));

    for (final row in returnSelections) {
      if (row.qty <= 0) continue;
      await _restoreWarehouseStock(
        warehouseId: warehouseId,
        productId: row.line.productId,
        variantId: row.line.variantId,
        qty: row.qty,
      );
    }

    for (final line in newLines) {
      if (line.qty <= 0) continue;
      await _deductWarehouseStock(
        warehouseId: warehouseId,
        productId: line.productId,
        variantId: line.variantId,
        qty: line.qty,
      );
    }

    await _saleRepo.addReturnQtyToLocalSale(
      saleReferenceNo: lookup.referenceNo,
      updates: returnSelections
          .where((r) => r.qty > 0)
          .map((r) => (productSaleId: r.line.productSaleId, qty: r.qty))
          .toList(),
    );

    return clientUuid;
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

  Future<void> _deductWarehouseStock({
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

    final newQty = stock.qty - qty;
    await (_db.update(_db.productStock)..where((s) => s.id.equals(stock.id)))
        .write(ProductStockCompanion(
      qty: Value(newQty < 0 ? 0 : newQty),
    ));
  }

  Future<List<Map<String, dynamic>>> loadPendingSyncPayloads({
    bool includeFailed = true,
  }) async {
    final statuses = includeFailed
        ? ['pending', 'failed', 'queued']
        : ['pending', 'queued'];
    final rows = await (_db.select(_db.localExchanges)
          ..where((r) => r.syncStatus.isIn(statuses))
          ..orderBy([(r) => OrderingTerm.asc(r.createdAt)]))
        .get();

    return rows.map((row) {
      final payload = jsonDecode(row.payloadJson) as Map<String, dynamic>;
      return Map<String, dynamic>.from(payload);
    }).toList();
  }

  Future<void> markSynced(
    String clientUuid, {
    required String status,
    int? serverExchangeId,
    String? referenceNo,
    String? error,
  }) async {
    await (_db.update(_db.localExchanges)
          ..where((r) => r.clientUuid.equals(clientUuid)))
        .write(LocalExchangesCompanion(
      syncStatus: Value(status),
      serverExchangeId: Value(serverExchangeId),
      serverReferenceNo: Value(referenceNo),
      errorMessage: Value(error),
      syncedAt: status == 'synced' ? Value(DateTime.now()) : const Value.absent(),
    ));
  }
}
