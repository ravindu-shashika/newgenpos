import 'dart:convert';

import 'package:drift/drift.dart' show OrderingTerm;

import '../../../core/database/app_database.dart';
import '../models/sale_bill_detail.dart';
import '../sale_reference.dart';

class SaleBillDetailService {
  SaleBillDetailService(this._db);

  final AppDatabase _db;

  Future<SaleBillDetail?> load(int localSaleId) async {
    final sale = await (_db.select(_db.localSales)
          ..where((s) => s.id.equals(localSaleId)))
        .getSingleOrNull();
    if (sale == null) return null;

    final lines = await (_db.select(_db.localSaleLines)
          ..where((l) => l.localSaleId.equals(localSaleId))
          ..orderBy([(l) => OrderingTerm.asc(l.id)]))
        .get();

    String? customerName;
    if (sale.customerId > 0) {
      final customer = await (_db.select(_db.customers)
            ..where((c) => c.id.equals(sale.customerId)))
          .getSingleOrNull();
      customerName = customer?.name.trim();
      if (customerName != null && customerName.isEmpty) {
        customerName = null;
      }
    }

    return SaleBillDetail(
      sale: sale,
      lines: lines,
      customerName: customerName,
      paymentLabel: _paymentLabel(sale.payloadJson),
    );
  }

  String _paymentLabel(String? payloadJson) {
    if (payloadJson == null || payloadJson.isEmpty) return 'Cash';
    try {
      final map = jsonDecode(payloadJson) as Map<String, dynamic>;
      final paidBy = map['paid_by_id'];
      if (paidBy is List && paidBy.length > 1) return 'Split payment';
      final id = paidBy is List ? paidBy.first : paidBy;
      final idStr = id?.toString() ?? '1';
      if (idStr == '3') return 'Card';
      if (idStr == '4') return 'Cheque';
      if (idStr == '2') return 'Gift card';
      return 'Cash';
    } catch (_) {
      return 'Cash';
    }
  }

  String formatReference(LocalSale sale) {
    final ref = resolveLocalSaleReference(
      clientUuid: sale.clientUuid,
      referenceNo: sale.referenceNo,
      serverReferenceNo: sale.serverReferenceNo,
    );
    final display = formatSaleReferenceDisplay(ref);
    if (display.isNotEmpty) return display;
    return '#${sale.id}';
  }
}
