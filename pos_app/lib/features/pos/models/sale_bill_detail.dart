import '../../../core/database/app_database.dart';

/// Completed sale bill with line items for dashboard / history views.
class SaleBillDetail {
  const SaleBillDetail({
    required this.sale,
    required this.lines,
    this.customerName,
    this.paymentLabel,
  });

  final LocalSale sale;
  final List<LocalSaleLine> lines;
  final String? customerName;
  final String? paymentLabel;

  double get linesSubtotal =>
      lines.fold<double>(0, (sum, line) => sum + line.total);
}
