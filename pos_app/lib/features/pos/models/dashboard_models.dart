class DashboardStats {
  const DashboardStats({
    required this.totalSales,
    required this.yesterdayTotalSales,
    required this.grossProfit,
    required this.grossProfitMarginPercent,
    required this.transactionCount,
    required this.yesterdayTransactionCount,
    required this.avgOrderValue,
    required this.avgBasketSize,
    required this.salesGrowthPercent,
    required this.grossProfitGrowthPercent,
    required this.transactionGrowthPercent,
    required this.avgOrderGrowthPercent,
    required this.peakHourLabel,
    required this.dailyRevenue,
    required this.topProducts,
    required this.staffPerformance,
    required this.recentTransactions,
  });

  final double totalSales;
  final double yesterdayTotalSales;
  final double grossProfit;
  final double grossProfitMarginPercent;
  final int transactionCount;
  final int yesterdayTransactionCount;
  final double avgOrderValue;
  final double avgBasketSize;
  final double? salesGrowthPercent;
  final double? grossProfitGrowthPercent;
  final double? transactionGrowthPercent;
  final double? avgOrderGrowthPercent;
  final String peakHourLabel;
  final List<DailyRevenuePoint> dailyRevenue;
  final List<TopProductRow> topProducts;
  final List<StaffPerformanceRow> staffPerformance;
  final List<DashboardTransaction> recentTransactions;

  static const empty = DashboardStats(
    totalSales: 0,
    yesterdayTotalSales: 0,
    grossProfit: 0,
    grossProfitMarginPercent: 0,
    transactionCount: 0,
    yesterdayTransactionCount: 0,
    avgOrderValue: 0,
    avgBasketSize: 0,
    salesGrowthPercent: null,
    grossProfitGrowthPercent: null,
    transactionGrowthPercent: null,
    avgOrderGrowthPercent: null,
    peakHourLabel: '—',
    dailyRevenue: [],
    topProducts: [],
    staffPerformance: [],
    recentTransactions: [],
  );
}

class DailyRevenuePoint {
  const DailyRevenuePoint({
    required this.weekday,
    required this.label,
    required this.amount,
    this.isToday = false,
  });

  final int weekday;
  final String label;
  final double amount;
  final bool isToday;
}

class TopProductRow {
  const TopProductRow({
    required this.name,
    required this.qtySold,
    required this.revenue,
  });

  final String name;
  final double qtySold;
  final double revenue;
}

class StaffPerformanceRow {
  const StaffPerformanceRow({
    required this.name,
    required this.transactionCount,
    required this.totalSales,
    required this.progress,
    this.rank,
  });

  final String name;
  final int transactionCount;
  final double totalSales;
  final double progress;
  final int? rank;
}

class DashboardTransaction {
  const DashboardTransaction({
    required this.orderId,
    required this.createdAt,
    required this.itemCount,
    required this.paymentLabel,
    required this.paymentIcon,
    required this.total,
    required this.isPaid,
  });

  final String orderId;
  final DateTime createdAt;
  final int itemCount;
  final String paymentLabel;
  final String paymentIcon;
  final double total;
  final bool isPaid;
}
