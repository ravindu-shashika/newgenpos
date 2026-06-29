import 'dart:convert';

import 'package:drift/drift.dart' show OrderingTerm;
import 'package:intl/intl.dart';

import '../../../core/database/app_database.dart';
import '../models/dashboard_models.dart';
import '../sale_reference.dart';

class DashboardStatsService {
  DashboardStatsService(this._db);

  final AppDatabase _db;

  static const _defaultMarginPercent = 40.0;

  Future<DashboardStats> load({DateTime? day}) async {
    final target = day ?? DateTime.now();
    final start = DateTime(target.year, target.month, target.day);
    final end = start.add(const Duration(days: 1));
    final yesterdayStart = start.subtract(const Duration(days: 1));

    final allCompleted = await (_db.select(_db.localSales)
          ..where((s) => s.saleStatus.equals(1))
          ..orderBy([(s) => OrderingTerm.desc(s.createdAt)]))
        .get();

    final sales = allCompleted
        .where((s) =>
            !s.createdAt.isBefore(start) && s.createdAt.isBefore(end))
        .toList();

    final yesterdaySales = allCompleted
        .where((s) =>
            !s.createdAt.isBefore(yesterdayStart) &&
            s.createdAt.isBefore(start))
        .toList();

    final totalSales =
        sales.fold<double>(0, (sum, sale) => sum + sale.grandTotal);
    final yesterdayTotal =
        yesterdaySales.fold<double>(0, (sum, sale) => sum + sale.grandTotal);

    final grossProfit = totalSales * (_defaultMarginPercent / 100);
    final yesterdayGross =
        yesterdayTotal * (_defaultMarginPercent / 100);

    final count = sales.length;
    final yesterdayCount = yesterdaySales.length;
    final avg = count == 0 ? 0.0 : totalSales / count;
    final yesterdayAvg =
        yesterdayCount == 0 ? 0.0 : yesterdayTotal / yesterdayCount;

    final totalQty =
        sales.fold<double>(0, (sum, sale) => sum + sale.totalQty);
    final basketSize = count == 0 ? 0.0 : totalQty / count;

    final dailyRevenue = _buildDailyRevenue(allCompleted, start);
    final topProducts = await _buildTopProducts(sales);
    final staffPerformance = await _buildStaffPerformance(sales);
    final recent = sales.take(12).map(_mapTransaction).toList();

    return DashboardStats(
      totalSales: totalSales,
      yesterdayTotalSales: yesterdayTotal,
      grossProfit: grossProfit,
      grossProfitMarginPercent: _defaultMarginPercent,
      transactionCount: count,
      yesterdayTransactionCount: yesterdayCount,
      avgOrderValue: avg,
      avgBasketSize: basketSize,
      salesGrowthPercent: _growthPercent(totalSales, yesterdayTotal),
      grossProfitGrowthPercent: _growthPercent(grossProfit, yesterdayGross),
      transactionGrowthPercent:
          _growthPercent(count.toDouble(), yesterdayCount.toDouble()),
      avgOrderGrowthPercent: _growthPercent(avg, yesterdayAvg),
      peakHourLabel: _peakHourLabel(sales),
      dailyRevenue: dailyRevenue,
      topProducts: topProducts,
      staffPerformance: staffPerformance,
      recentTransactions: recent,
    );
  }

  double? _growthPercent(double current, double previous) {
    if (previous > 0) {
      return ((current - previous) / previous) * 100;
    }
    if (current > 0) return 100;
    return null;
  }

  String _peakHourLabel(List<LocalSale> sales) {
    if (sales.isEmpty) return '—';
    final buckets = <int, int>{};
    for (final sale in sales) {
      final hour = sale.createdAt.hour;
      buckets[hour] = (buckets[hour] ?? 0) + 1;
    }
    final peak = buckets.entries.reduce(
      (a, b) => a.value >= b.value ? a : b,
    );
    final dt = DateTime(2000, 1, 1, peak.key);
    return DateFormat('h:mm a').format(dt);
  }

  List<DailyRevenuePoint> _buildDailyRevenue(
    List<LocalSale> allCompleted,
    DateTime todayStart,
  ) {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final weekStart = todayStart.subtract(
      Duration(days: todayStart.weekday - DateTime.monday),
    );

    return List.generate(7, (i) {
      final dayStart = weekStart.add(Duration(days: i));
      final dayEnd = dayStart.add(const Duration(days: 1));
      final amount = allCompleted
          .where((s) =>
              !s.createdAt.isBefore(dayStart) &&
              s.createdAt.isBefore(dayEnd))
          .fold<double>(0, (sum, s) => sum + s.grandTotal);
      final isToday = dayStart.year == todayStart.year &&
          dayStart.month == todayStart.month &&
          dayStart.day == todayStart.day;
      return DailyRevenuePoint(
        weekday: dayStart.weekday,
        label: labels[i],
        amount: amount,
        isToday: isToday,
      );
    });
  }

  Future<List<TopProductRow>> _buildTopProducts(List<LocalSale> sales) async {
    if (sales.isEmpty) return const [];

    final saleIds = sales.map((s) => s.id).toSet();
    final allLines = await _db.select(_db.localSaleLines).get();
    final lines =
        allLines.where((line) => saleIds.contains(line.localSaleId));

    final totals = <String, ({String name, double qty, double revenue})>{};
    for (final line in lines) {
      final key = '${line.productId}_${line.variantId ?? 0}';
      final name = line.name?.trim().isNotEmpty == true
          ? line.name!.trim()
          : 'Product #${line.productId}';
      final existing = totals[key];
      totals[key] = (
        name: existing?.name ?? name,
        qty: (existing?.qty ?? 0) + line.qty,
        revenue: (existing?.revenue ?? 0) + line.total,
      );
    }

    final rows = totals.values
        .map(
          (e) => TopProductRow(
            name: e.name,
            qtySold: e.qty,
            revenue: e.revenue,
          ),
        )
        .toList()
      ..sort((a, b) => b.revenue.compareTo(a.revenue));

    return rows.take(6).toList();
  }

  Future<List<StaffPerformanceRow>> _buildStaffPerformance(
    List<LocalSale> sales,
  ) async {
    if (sales.isEmpty) return const [];

    final users = await _db.select(_db.localUsers).get();
    final userNames = {for (final u in users) u.id: u.name};

    final totals = <int, ({int count, double sales})>{};
    for (final sale in sales) {
      final userId = _userIdFromPayload(sale.payloadJson);
      if (userId == null) continue;
      final existing = totals[userId];
      totals[userId] = (
        count: (existing?.count ?? 0) + 1,
        sales: (existing?.sales ?? 0) + sale.grandTotal,
      );
    }

    if (totals.isEmpty) return const [];

    final maxSales = totals.values
        .fold<double>(0, (m, e) => e.sales > m ? e.sales : m);

    final rows = totals.entries
        .map((e) {
          final name = userNames[e.key]?.trim();
          return StaffPerformanceRow(
            name: name != null && name.isNotEmpty
                ? name
                : 'Operator #${e.key}',
            transactionCount: e.value.count,
            totalSales: e.value.sales,
            progress: maxSales <= 0 ? 0 : e.value.sales / maxSales,
          );
        })
        .toList()
      ..sort((a, b) => b.totalSales.compareTo(a.totalSales));

    return [
      for (var i = 0; i < rows.length && i < 5; i++)
        StaffPerformanceRow(
          name: rows[i].name,
          transactionCount: rows[i].transactionCount,
          totalSales: rows[i].totalSales,
          progress: rows[i].progress,
          rank: i + 1,
        ),
    ];
  }

  int? _userIdFromPayload(String? payloadJson) {
    if (payloadJson == null || payloadJson.isEmpty) return null;
    try {
      final map = jsonDecode(payloadJson) as Map<String, dynamic>;
      final id = map['user_id'];
      if (id is int) return id;
      return int.tryParse(id?.toString() ?? '');
    } catch (_) {
      return null;
    }
  }

  DashboardTransaction _mapTransaction(LocalSale sale) {
    return DashboardTransaction(
      orderId: _formatOrderId(sale),
      createdAt: sale.createdAt,
      itemCount: sale.itemCount,
      paymentLabel: _paymentLabel(sale.payloadJson),
      paymentIcon: _paymentIcon(sale.payloadJson),
      total: sale.grandTotal,
      isPaid: sale.paymentStatus == 4 || sale.paidAmount >= sale.grandTotal,
    );
  }

  String _formatOrderId(LocalSale sale) {
    final ref = resolveLocalSaleReference(
      clientUuid: sale.clientUuid,
      referenceNo: sale.referenceNo,
      serverReferenceNo: sale.serverReferenceNo,
    );
    if (ref.length <= 10) return '#$ref';
    final digits = ref.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length >= 5) {
      return '#${digits.substring(digits.length - 5)}';
    }
    return '#${sale.id}';
  }

  String _paymentLabel(String? payloadJson) {
    if (payloadJson == null || payloadJson.isEmpty) return 'Cash';
    try {
      final map = jsonDecode(payloadJson) as Map<String, dynamic>;
      final paidBy = map['paid_by_id'];
      if (paidBy is List && paidBy.length > 1) return 'Split payment';
      final id = paidBy is List ? paidBy.first : paidBy;
      final idStr = id?.toString() ?? '1';
      if (idStr == '3') {
        final cardType = map['card_type']?.toString().trim();
        final cardNumber = map['card_number']?.toString().trim();
        if (cardType != null && cardType.isNotEmpty) {
          if (cardNumber != null && cardNumber.length >= 4) {
            return '$cardType • ${cardNumber.substring(cardNumber.length - 4)}';
          }
          return cardType;
        }
        return 'Card';
      }
      if (idStr == '4') return 'Cheque';
      if (idStr == '2') return 'Gift card';
      return 'Cash';
    } catch (_) {
      return 'Cash';
    }
  }

  String _paymentIcon(String? payloadJson) {
    if (payloadJson == null || payloadJson.isEmpty) return 'cash';
    try {
      final map = jsonDecode(payloadJson) as Map<String, dynamic>;
      final paidBy = map['paid_by_id'];
      if (paidBy is List && paidBy.length > 1) return 'split';
      final id = paidBy is List ? paidBy.first : paidBy;
      final idStr = id?.toString() ?? '1';
      if (idStr == '3') return 'card';
      return 'cash';
    } catch (_) {
      return 'cash';
    }
  }
}
