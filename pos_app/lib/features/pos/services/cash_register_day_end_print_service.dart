import 'dart:typed_data';

import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../models/cash_register_details.dart';
import '../pos_currency.dart';
import '../models/local_print_settings.dart';

class _DayEndMetrics {
  _DayEndMetrics(this.pageFormat);

  final PdfPageFormat pageFormat;
  double get bodySize => 8.5;
  double get smallSize => 6.5;
  double get brandSize => 13.0;
  double get totalSize => 9.0;

  static PdfPageFormat pageFormatFor(LocalPrintSettings settings) {
    if (settings.paperSize == 'a4') {
      return PdfPageFormat.a4.copyWith(
        marginLeft: 12,
        marginRight: 12,
        marginTop: 12,
        marginBottom: 12,
      );
    }
    final w = settings.pageWidthMm * PdfPageFormat.mm;
    final h = settings.pageHeightMm * PdfPageFormat.mm;
    return PdfPageFormat(
      w,
      h.isFinite && h > 0 ? h : double.infinity,
      marginLeft: 1.5 * PdfPageFormat.mm,
      marginRight: 1.5 * PdfPageFormat.mm,
      marginTop: 2 * PdfPageFormat.mm,
      marginBottom: 4 * PdfPageFormat.mm,
    );
  }
}

/// Thermal day-end / cash register closing summary.
class CashRegisterDayEndPrintService {
  static Future<void> printDayEndSummary({
    required CashRegisterDetails details,
    required double actualCash,
    required LocalPrintSettings printSettings,
    String? cashierName,
    String? warehouseName,
    int? registerId,
  }) async {
    final pageFormat = _DayEndMetrics.pageFormatFor(printSettings);
    final job = 'day-end-${registerId ?? 'register'}';

    Future<Uint8List> onLayout(PdfPageFormat _) => buildDayEndPdf(
          details: details,
          actualCash: actualCash,
          printSettings: printSettings,
          pageFormat: pageFormat,
          cashierName: cashierName,
          warehouseName: warehouseName,
          registerId: registerId,
        );

    if (printSettings.directPrint) {
      final printer = await _resolvePrinter(printSettings);
      if (printer != null) {
        await Printing.directPrintPdf(
          printer: printer,
          onLayout: onLayout,
          name: job,
        );
        return;
      }
    }

    await Printing.layoutPdf(onLayout: onLayout, name: job);
  }

  static Future<Uint8List> buildDayEndPdf({
    required CashRegisterDetails details,
    required double actualCash,
    required LocalPrintSettings printSettings,
    required PdfPageFormat pageFormat,
    String? cashierName,
    String? warehouseName,
    int? registerId,
  }) async {
    final m = _DayEndMetrics(pageFormat);
    final now = DateTime.now();
    final dateStr = DateFormat(printSettings.dateFormat).format(now);
    final diff = actualCash - details.totalCash;

    pw.Widget row(String label, double value, {bool bold = false}) {
      return pw.Padding(
        padding: const pw.EdgeInsets.symmetric(vertical: 2),
        child: pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Expanded(
              child: pw.Text(
                label,
                style: pw.TextStyle(
                  fontSize: m.bodySize,
                  fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal,
                ),
              ),
            ),
            pw.Text(
              formatPosMoney(value),
              style: pw.TextStyle(
                fontSize: m.bodySize,
                fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal,
              ),
            ),
          ],
        ),
      );
    }

    final doc = pw.Document();
    doc.addPage(
      pw.Page(
        pageFormat: pageFormat,
        build: (ctx) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.stretch,
          children: [
            pw.Text(
              printSettings.receiptTitle,
              textAlign: pw.TextAlign.center,
              style: pw.TextStyle(
                fontSize: m.brandSize,
                fontWeight: pw.FontWeight.bold,
              ),
            ),
            pw.SizedBox(height: 4),
            pw.Text(
              'DAY END SUMMARY',
              textAlign: pw.TextAlign.center,
              style: pw.TextStyle(
                fontSize: m.totalSize,
                fontWeight: pw.FontWeight.bold,
              ),
            ),
            pw.SizedBox(height: 6),
            pw.Text(dateStr, textAlign: pw.TextAlign.right,
                style: pw.TextStyle(fontSize: m.smallSize)),
            if (warehouseName != null && warehouseName.isNotEmpty)
              pw.Text('Warehouse: $warehouseName',
                  style: pw.TextStyle(fontSize: m.smallSize)),
            if (cashierName != null && cashierName.isNotEmpty)
              pw.Text('Cashier: $cashierName',
                  style: pw.TextStyle(fontSize: m.smallSize)),
            if (registerId != null)
              pw.Text('Register #$registerId',
                  style: pw.TextStyle(fontSize: m.smallSize)),
            pw.SizedBox(height: 8),
            pw.Divider(thickness: 0.5),
            pw.SizedBox(height: 6),
            row('Cash in hand', details.cashInHand),
            row('Total sale amount', details.totalSaleAmount),
            row('Total payment', details.totalPayment),
            row('Cash payment', details.cashPayment),
            row('Credit card payment', details.creditCardPayment),
            row('Cheque payment', details.chequePayment),
            row('Gift card payment', details.giftCardPayment),
            row('Deposit payment', details.depositPayment),
            row('Paypal payment', details.paypalPayment),
            for (final e in details.customMethods.entries)
              row(e.key.replaceAll('_', ' '), e.value),
            row('Total sale return', details.totalSaleReturn),
            row('Total expense', details.totalExpense),
            row('Supplier payment', details.totalSupplierPayment),
            pw.SizedBox(height: 4),
            pw.Divider(thickness: 0.5),
            row('Total cash (expected)', details.totalCash, bold: true),
            row('Actual cash counted', actualCash, bold: true),
            row('Difference', diff, bold: true),
            pw.SizedBox(height: 12),
            pw.Text(
              'Register closed — day end',
              textAlign: pw.TextAlign.center,
              style: pw.TextStyle(
                fontSize: m.smallSize,
                fontWeight: pw.FontWeight.bold,
              ),
            ),
            if (printSettings.footerTitle.isNotEmpty) ...[
              pw.SizedBox(height: 8),
              pw.Text(
                printSettings.footerTitle,
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(fontSize: m.smallSize),
              ),
            ],
          ],
        ),
      ),
    );

    return doc.save();
  }

  static Future<Printer?> _resolvePrinter(LocalPrintSettings settings) async {
    try {
      final printers = await Printing.listPrinters();
      if (printers.isEmpty) return null;
      final url = settings.printerUrl.trim();
      if (url.isNotEmpty) {
        for (final p in printers) {
          if (p.url == url) return p;
        }
      }
      for (final p in printers) {
        if (p.isDefault) return p;
      }
      return printers.first;
    } catch (_) {
      return null;
    }
  }
}
