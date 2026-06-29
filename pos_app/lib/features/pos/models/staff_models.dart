class BillerSalesStats {
  const BillerSalesStats({
    this.sales = 0,
    this.transactions = 0,
  });

  final double sales;
  final int transactions;

  static const zero = BillerSalesStats();
}

class BillerPerformanceRow {
  const BillerPerformanceRow({
    required this.id,
    required this.name,
    this.companyName,
    required this.today,
    required this.last7Days,
    required this.thisMonth,
    this.isActive = false,
  });

  final int id;
  final String name;
  final String? companyName;
  final BillerSalesStats today;
  final BillerSalesStats last7Days;
  final BillerSalesStats thisMonth;
  final bool isActive;
}

class BillerTransactionRow {
  const BillerTransactionRow({
    required this.id,
    required this.referenceLabel,
    required this.createdAt,
    required this.grandTotal,
    required this.itemCount,
  });

  final int id;
  final String referenceLabel;
  final DateTime createdAt;
  final double grandTotal;
  final int itemCount;
}

class BillerOverview {
  const BillerOverview({
    required this.totalBillers,
    required this.todayTotal,
    required this.last7DaysTotal,
    required this.monthTotal,
    required this.billers,
  });

  final int totalBillers;
  final BillerSalesStats todayTotal;
  final BillerSalesStats last7DaysTotal;
  final BillerSalesStats monthTotal;
  final List<BillerPerformanceRow> billers;
}

enum BillerStatsPeriod {
  today('Today'),
  last7Days('Last 7 days'),
  month('This month');

  const BillerStatsPeriod(this.label);
  final String label;
}
