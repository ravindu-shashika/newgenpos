import '../../../core/database/app_database.dart';

/// Completed sale bill with line items for dashboard / history views.
class SaleBillDetail {
  const SaleBillDetail({
    required this.sale,
    required this.lines,
    this.customerName,
    this.paymentLabel,
    this.returnCredit = 0,
    this.returnReferences = const [],
  });

  final LocalSale sale;
  final List<LocalSaleLine> lines;
  final String? customerName;
  final String? paymentLabel;
  final double returnCredit;
  final List<String> returnReferences;

  bool get hasReturnCredit => returnCredit > 0.0001;

  String get returnReferencesLabel => returnReferences.join(', ');

  double get linesSubtotal =>
      lines.fold<double>(0, (sum, line) => sum + line.total);
}
