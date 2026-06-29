import 'dart:typed_data';

import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../models/local_print_settings.dart';
import '../models/return_models.dart';
import '../pos_currency.dart';
import '../sale_reference.dart';

/// Print a return credit bill after processing a sale return.
class ReturnReceiptPrintService {
  static Future<void> printReturnReceipt(
    SavedReturnResult result, {
    required LocalPrintSettings printSettings,
    String? customerName,
    String? cashierName,
    String? warehouseName,
  }) async {
    final pageFormat = _pageFormat(printSettings);
    final job = 'return-${result.referenceNo}';

    Future<Uint8List> onLayout(PdfPageFormat printerFormat) =>
        buildReturnReceiptPdf(
          result,
          printSettings: printSettings,
          pageFormat: printerFormat,
          customerName: customerName,
          cashierName: cashierName,
          warehouseName: warehouseName,
        );

    if (printSettings.directPrint) {
      final printers = await Printing.listPrinters();
      if (printers.isNotEmpty) {
        Printer? target;
        final url = printSettings.printerUrl.trim();
        if (url.isNotEmpty) {
          for (final p in printers) {
            if (p.url == url) {
              target = p;
              break;
            }
          }
        }
        target ??= printers.firstWhere(
          (p) => p.isDefault,
          orElse: () => printers.first,
        );
        final ok = await Printing.directPrintPdf(
          printer: target,
          onLayout: onLayout,
          name: job,
          format: pageFormat,
        );
        if (ok == true) return;
      }
    }

    await Printing.layoutPdf(
      onLayout: onLayout,
      name: job,
      format: pageFormat,
    );
  }

  static PdfPageFormat _pageFormat(LocalPrintSettings settings) {
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

  static Future<Uint8List> buildReturnReceiptPdf(
    SavedReturnResult result, {
    required LocalPrintSettings printSettings,
    PdfPageFormat? pageFormat,
    String? customerName,
    String? cashierName,
    String? warehouseName,
  }) async {
    final format = pageFormat ?? _pageFormat(printSettings);
    final opts = printSettings;
    final dateFmt = DateFormat(
      opts.option(PrintOptionKeys.activeDateFormat)
          ? opts.dateFormat
          : 'yyyy-MM-dd hh:mm:ssa',
    );
    final qtyFmt = NumberFormat('#,##0.###');
    final createdAt = result.createdAt ?? DateTime.now();
    final refDisplay = formatSaleReferenceDisplay(result.referenceNo);

    final doc = pw.Document();
    doc.addPage(
      pw.Page(
        pageFormat: format,
        build: (context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.stretch,
            children: [
              pw.Center(
                child: pw.Text(
                  'SALES RETURN',
                  style: pw.TextStyle(
                    fontSize: 14,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
              ),
              pw.SizedBox(height: 6),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Return #:', style: const pw.TextStyle(fontSize: 9)),
                  pw.Text(
                    refDisplay,
                    style: pw.TextStyle(
                      fontSize: 9,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                ],
              ),
              pw.Align(
                alignment: pw.Alignment.centerRight,
                child: pw.Text(
                  dateFmt.format(createdAt),
                  style: const pw.TextStyle(fontSize: 8),
                ),
              ),
              if (result.saleReferenceNo != null &&
                  result.saleReferenceNo!.trim().isNotEmpty) ...[
                pw.SizedBox(height: 4),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Sale ref:',
                        style: const pw.TextStyle(fontSize: 8)),
                    pw.Text(
                      formatSaleReferenceDisplay(result.saleReferenceNo),
                      style: const pw.TextStyle(fontSize: 8),
                    ),
                  ],
                ),
              ],
              if (customerName != null && customerName.trim().isNotEmpty) ...[
                pw.SizedBox(height: 4),
                pw.Text('Customer: $customerName',
                    style: const pw.TextStyle(fontSize: 8)),
              ],
              if (cashierName != null && cashierName.trim().isNotEmpty) ...[
                pw.Text('Cashier: $cashierName',
                    style: const pw.TextStyle(fontSize: 8)),
              ],
              if (warehouseName != null && warehouseName.trim().isNotEmpty) ...[
                pw.Text('Warehouse: $warehouseName',
                    style: const pw.TextStyle(fontSize: 8)),
              ],
              pw.Divider(thickness: 0.5),
              pw.Text(
                'Returned items',
                style: pw.TextStyle(
                  fontSize: 9,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
              pw.SizedBox(height: 4),
              for (final line in result.lines) ...[
                pw.Text(
                  line.name,
                  style: pw.TextStyle(
                    fontSize: 8,
                    fontWeight: pw.FontWeight.bold,
                  ),
                  maxLines: 2,
                ),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text(
                      '${line.code} x ${qtyFmt.format(line.qty)}',
                      style: const pw.TextStyle(fontSize: 7),
                    ),
                    pw.Text(
                      formatPosMoney(line.total),
                      style: const pw.TextStyle(fontSize: 7),
                    ),
                  ],
                ),
                pw.SizedBox(height: 2),
              ],
              pw.Divider(thickness: 0.5),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text(
                    'RETURN CREDIT',
                    style: pw.TextStyle(
                      fontSize: 10,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.Text(
                    formatPosMoney(result.creditRemaining),
                    style: pw.TextStyle(
                      fontSize: 11,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                ],
              ),
              pw.SizedBox(height: 8),
              pw.Text(
                'Scan this return bill on your next purchase to settle credit.',
                style: const pw.TextStyle(fontSize: 7),
                textAlign: pw.TextAlign.center,
              ),
            ],
          );
        },
      ),
    );

    return doc.save();
  }
}
