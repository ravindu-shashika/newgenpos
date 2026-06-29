import 'dart:convert';

import 'package:drift/drift.dart' show OrderingTerm;

import '../../../core/database/app_database.dart';
import '../models/staff_models.dart';
import '../sale_reference.dart';

class StaffService {
  StaffService(this._db);

  final AppDatabase _db;

  Future<BillerOverview> load({int? currentBillerId}) async {
    final billers = await (_db.select(_db.billers)
          ..orderBy([(b) => OrderingTerm.asc(b.name)]))
        .get();
    final sales = await (_db.select(_db.localSales)
          ..where((s) => s.saleStatus.equals(1)))
        .get();

    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final todayEnd = todayStart.add(const Duration(days: 1));
    final last7Start = todayStart.subtract(const Duration(days: 6));
    final monthStart = DateTime(now.year, now.month, 1);
    final monthEnd = DateTime(now.year, now.month + 1, 1);

    final todayByBiller = _aggregateSales(
      sales,
      start: todayStart,
      end: todayEnd,
    );
    final last7ByBiller = _aggregateSales(
      sales,
      start: last7Start,
      end: todayEnd,
    );
    final monthByBiller = _aggregateSales(
      sales,
      start: monthStart,
      end: monthEnd,
    );

    final rows = billers
        .map((biller) {
          final today = todayByBiller[biller.id] ?? BillerSalesStats.zero;
          final last7 = last7ByBiller[biller.id] ?? BillerSalesStats.zero;
          final month = monthByBiller[biller.id] ?? BillerSalesStats.zero;
          return BillerPerformanceRow(
            id: biller.id,
            name: biller.name,
            companyName: biller.companyName,
            today: today,
            last7Days: last7,
            thisMonth: month,
            isActive: currentBillerId != null && biller.id == currentBillerId,
          );
        })
        .toList()
      ..sort((a, b) {
        if (a.isActive != b.isActive) return a.isActive ? -1 : 1;
        final byMonth = b.thisMonth.sales.compareTo(a.thisMonth.sales);
        if (byMonth != 0) return byMonth;
        return a.name.compareTo(b.name);
      });

    return BillerOverview(
      totalBillers: billers.length,
      todayTotal: _sumStats(todayByBiller.values),
      last7DaysTotal: _sumStats(last7ByBiller.values),
      monthTotal: _sumStats(monthByBiller.values),
      billers: rows,
    );
  }

  Future<List<BillerTransactionRow>> loadTransactions({
    required int billerId,
    required BillerStatsPeriod period,
  }) async {
    final range = _periodRange(period);
    final sales = await (_db.select(_db.localSales)
          ..where((s) => s.saleStatus.equals(1))
          ..orderBy([(s) => OrderingTerm.desc(s.createdAt)]))
        .get();

    return sales
        .where((sale) {
          if (_billerIdFromSale(sale) != billerId) return false;
          return !sale.createdAt.isBefore(range.start) &&
              sale.createdAt.isBefore(range.end);
        })
        .map(_mapTransaction)
        .toList();
  }

  Map<int, BillerSalesStats> _aggregateSales(
    List<LocalSale> sales, {
    required DateTime start,
    required DateTime end,
  }) {
    final totals = <int, ({double sales, int count})>{};
    for (final sale in sales) {
      if (sale.createdAt.isBefore(start) || !sale.createdAt.isBefore(end)) {
        continue;
      }
      final billerId = _billerIdFromSale(sale);
      if (billerId == null) continue;
      final existing = totals[billerId];
      totals[billerId] = (
        sales: (existing?.sales ?? 0) + sale.grandTotal,
        count: (existing?.count ?? 0) + 1,
      );
    }

    return {
      for (final entry in totals.entries)
        entry.key: BillerSalesStats(
          sales: entry.value.sales,
          transactions: entry.value.count,
        ),
    };
  }

  BillerSalesStats _sumStats(Iterable<BillerSalesStats> stats) {
    var sales = 0.0;
    var count = 0;
    for (final stat in stats) {
      sales += stat.sales;
      count += stat.transactions;
    }
    return BillerSalesStats(sales: sales, transactions: count);
  }

  ({DateTime start, DateTime end}) _periodRange(BillerStatsPeriod period) {
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final todayEnd = todayStart.add(const Duration(days: 1));
    return switch (period) {
      BillerStatsPeriod.today => (start: todayStart, end: todayEnd),
      BillerStatsPeriod.last7Days => (
          start: todayStart.subtract(const Duration(days: 6)),
          end: todayEnd,
        ),
      BillerStatsPeriod.month => (
          start: DateTime(now.year, now.month, 1),
          end: DateTime(now.year, now.month + 1, 1),
        ),
    };
  }

  int? _billerIdFromSale(LocalSale sale) {
    if (sale.billerId != null) return sale.billerId;
    return _billerIdFromPayload(sale.payloadJson);
  }

  int? _billerIdFromPayload(String? payloadJson) {
    if (payloadJson == null || payloadJson.isEmpty) return null;
    try {
      final map = jsonDecode(payloadJson) as Map<String, dynamic>;
      final id = map['biller_id'];
      if (id is int) return id;
      return int.tryParse(id?.toString() ?? '');
    } catch (_) {
      return null;
    }
  }

  BillerTransactionRow _mapTransaction(LocalSale sale) {
    final ref = resolveLocalSaleReference(
      clientUuid: sale.clientUuid,
      referenceNo: sale.referenceNo,
      serverReferenceNo: sale.serverReferenceNo,
    );
    return BillerTransactionRow(
      id: sale.id,
      referenceLabel: ref,
      createdAt: sale.createdAt,
      grandTotal: sale.grandTotal,
      itemCount: sale.itemCount,
    );
  }
}
