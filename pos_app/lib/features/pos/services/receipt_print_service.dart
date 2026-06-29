import 'dart:io';
import 'dart:typed_data';

import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../models/local_print_settings.dart';
import '../models/local_receipt.dart';
import '../sale_reference.dart';
import '../pos_currency.dart';
import '../utils/amount_in_words.dart';

class _ReceiptMetrics {
  _ReceiptMetrics(this.pageFormat)
      : contentWidth =
            pageFormat.width - pageFormat.marginLeft - pageFormat.marginRight;

  final PdfPageFormat pageFormat;
  final double contentWidth;

  bool get is58 => contentWidth < 58 * PdfPageFormat.mm;

  double get brandSize => is58 ? 11.0 : 13.0;
  double get bodySize => is58 ? 6.5 : 8.5;
  double get smallSize => is58 ? 6.0 : 6.5;
  double get tinySize => is58 ? 5.5 : 6.0;

  /// REF NO, date/time, customer, cashier.
  double get metaSize => is58 ? 7.5 : 8.5;

  /// Product name and line-item columns.
  double get itemNameSize => is58 ? 7.5 : 8.5;
  double get itemDetailSize => is58 ? 6.5 : 7.5;

  /// Totals block (Total, Discount, Paid Amount, Grand Total).
  double get totalSize => is58 ? 7.5 : 8.5;
  double get totalLargeSize => is58 ? 9.0 : 10.0;

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

  static PdfPageFormat coalescePrinterFormat(
    PdfPageFormat printerFormat,
    LocalPrintSettings settings,
  ) {
    if (settings.paperSize == 'a4') return printerFormat;
    final widthMm = printerFormat.width / PdfPageFormat.mm;
    if (widthMm >= 45 && widthMm <= 85) {
      return printerFormat.copyWith(
        marginLeft: 1.5 * PdfPageFormat.mm,
        marginRight: 1.5 * PdfPageFormat.mm,
        marginTop: 2 * PdfPageFormat.mm,
        marginBottom: 4 * PdfPageFormat.mm,
      );
    }
    return pageFormatFor(settings);
  }
}

class ReceiptPrintService {
  static Future<void> printReceipt(
    LocalReceipt receipt, {
    required LocalPrintSettings printSettings,
    String? jobName,
    String? cashierName,
  }) async {
    final pageFormat = _ReceiptMetrics.pageFormatFor(printSettings);
    final job = jobName ?? 'receipt-${receipt.referenceNo}';

    Future<Uint8List> onLayout(PdfPageFormat printerFormat) => buildReceiptPdf(
          receipt,
          printSettings: printSettings,
          pageFormat: _ReceiptMetrics.coalescePrinterFormat(
            printerFormat,
            printSettings,
          ),
          cashierName: cashierName,
        );

    if (printSettings.directPrint) {
      final printer = await _resolvePrinter(printSettings);
      if (printer != null) {
        final ok = await Printing.directPrintPdf(
          printer: printer,
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

  /// Whether a configured or default system printer is available.
  static Future<bool> isPrinterAvailable(LocalPrintSettings settings) async {
    try {
      return await _resolvePrinter(settings)
          .timeout(const Duration(seconds: 8))
          .then((p) => p != null);
    } catch (_) {
      return false;
    }
  }

  /// Saved printer URL, else Windows default thermal/receipt printer.
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

  static Future<Uint8List> buildReceiptPdf(
    LocalReceipt receipt, {
    required LocalPrintSettings printSettings,
    PdfPageFormat? pageFormat,
    String? cashierName,
  }) async {
    final format = pageFormat ?? _ReceiptMetrics.pageFormatFor(printSettings);
    final m = _ReceiptMetrics(format);
    final opts = printSettings;
    final useBrandColor = opts.option(PrintOptionKeys.activePrimaryColor);
    final primary =
        useBrandColor ? _parseColor(opts.primaryColor) : PdfColors.black;

    final datePattern = opts.option(PrintOptionKeys.activeDateFormat)
        ? opts.dateFormat
        : 'yyyy-MM-dd hh:mm:ssa';
    final dateFmt = DateFormat(datePattern);
    final qtyFmt = NumberFormat('#,##0.000');

    final refNo = _resolveInvoiceNo(opts, receipt);
    final cashier = (cashierName ?? receipt.cashierName).trim();

    final logo = await _loadLogo(opts);
    final doc = pw.Document();

    doc.addPage(
      pw.Page(
        pageFormat: m.pageFormat,
        build: (context) {
          final children = <pw.Widget>[];

          // ── Branding header (logo, name, address, phone, contact) ──
          if (logo != null) {
            final w = opts.option(PrintOptionKeys.activeLogoHeightWidth)
                ? opts.logoWidth
                : 56.0;
            final h = opts.option(PrintOptionKeys.activeLogoHeightWidth)
                ? opts.logoHeight
                : 56.0;
            children.add(
              pw.Center(
                child:
                    pw.Image(logo, width: w, height: h, fit: pw.BoxFit.contain),
              ),
            );
            children.add(pw.SizedBox(height: 1));
          }

          children.add(
            pw.Center(
              child: pw.Text(
                opts.receiptTitle,
                style: pw.TextStyle(
                  fontSize: m.brandSize,
                  fontWeight: pw.FontWeight.bold,
                  color: primary,
                  height: 1.0,
                ),
                textAlign: pw.TextAlign.center,
              ),
            ),
          );

          if (opts.option(PrintOptionKeys.showWarehouseInfo) &&
              opts.warehouseAddress.trim().isNotEmpty) {
            for (final line in opts.warehouseAddress.split('\n')) {
              final text = line.trim();
              if (text.isEmpty) continue;
              children.add(
                pw.Text(
                  text,
                  textAlign: pw.TextAlign.center,
                  style: pw.TextStyle(
                    fontSize: m.bodySize,
                    fontWeight: pw.FontWeight.bold,
                    color: primary,
                  ),
                ),
              );
            }
          }

          if (opts.phoneNumber.trim().isNotEmpty) {
            children.add(
              pw.Text(
                opts.phoneNumber.trim(),
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(
                  fontSize: m.smallSize,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            );
          }

          final contact = opts.contactLine.trim().isNotEmpty
              ? opts.contactLine.trim()
              : opts.headerText.trim();
          if (contact.isNotEmpty) {
            children.add(
              pw.Text(
                contact,
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(fontSize: m.tinySize),
                maxLines: 2,
              ),
            );
          } else if (opts.headerTitle.trim().isNotEmpty) {
            children.add(
              pw.Text(
                opts.headerTitle.trim(),
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(fontSize: m.tinySize),
              ),
            );
          }

          children.add(_rule(primary, vertical: 1));

          // ── REF NO (left) + number (right); datetime below (right) ──
          if (opts.option(PrintOptionKeys.showRefNumber)) {
            children.add(
              _labelValue('REF NO:', formatSaleReferenceDisplay(refNo), m,
                  valueBold: true, fontSize: m.metaSize),
            );
          }
          children.add(
            pw.Align(
              alignment: pw.Alignment.centerRight,
              child: pw.Text(
                dateFmt.format(receipt.createdAt),
                style: pw.TextStyle(fontSize: m.metaSize),
                textAlign: pw.TextAlign.right,
              ),
            ),
          );

          // ── Customer & cashier ──
          if (opts.option(PrintOptionKeys.showCustomerName)) {
            children.add(pw.SizedBox(height: 2));
            children.add(
              _labelValue(
                'Customer:',
                receipt.customerName,
                m,
                fontSize: m.metaSize,
              ),
            );
          }
          if (opts.option(PrintOptionKeys.showBillerInfo) &&
              cashier.isNotEmpty) {
            children.add(pw.SizedBox(height: 2));
            children.add(
              _labelValue('Cashier:', cashier, m, fontSize: m.metaSize),
            );
          }

          if (opts.option(PrintOptionKeys.showBillToInfo) &&
              receipt.billTo.isNotEmpty) {
            children.add(_labelValue('Bill To:', receipt.billTo, m));
          }

          // ── INVOICE ITEMS section ──
          children.add(
            pw.Column(
              mainAxisSize: pw.MainAxisSize.min,
              crossAxisAlignment: pw.CrossAxisAlignment.stretch,
              children: [
                pw.Center(
                  child: pw.Text(
                    opts.itemsSectionTitle,
                    style: pw.TextStyle(
                      fontSize: m.bodySize,
                      fontWeight: pw.FontWeight.bold,
                      color: primary,
                      height: 0.85,
                      lineSpacing: 0,
                    ),
                    textAlign: pw.TextAlign.center,
                  ),
                ),
                _thinDivider(primary),
                _itemColumnHeader(m),
              ],
            ),
          );

          for (var i = 0; i < receipt.lines.length; i++) {
            children
                .add(_itemRow(receipt.lines[i], i + 1, m, qtyFmt));
          }

          children.add(_rule(primary));

          // ── Totals ──
          final sub = receipt.computedSubtotal;
          children.add(_totalRow('Total:', sub, m, bold: true));

          if (opts.option(PrintOptionKeys.showDiscount)) {
            children.add(
              _totalRow(
                'Total Discount:',
                receipt.totalDiscount,
                m,
                bold: true,
              ),
            );
          }
          children.add(
            _totalRow(
              'GRAND TOTAL:',
              receipt.grandTotal,
              m,
              bold: true,
              large: true,
            ),
          );

          if (opts.option(PrintOptionKeys.showPaidInfo)) {
            final tendered = receipt.tenderedAmount > 0
                ? receipt.tenderedAmount
                : receipt.paidAmount;
            children.add(
              _totalRow('Paid Amount:', tendered, m, bold: true),
            );
            if (receipt.balance > 0) {
              children.add(
                _totalRow(
                  'BALANCE:',
                  receipt.balance,
                  m,
                  bold: true,
                  large: true,
                ),
              );
            }
          }

          if (!opts.option(PrintOptionKeys.hideTotalDue) &&
              receipt.totalDue > 0) {
            children.add(
              _totalRow(
                'Total Due:',
                receipt.totalDue,
                m,
                bold: true,
              ),
            );
          }

          children.add(_rule(primary));

          if (opts.option(PrintOptionKeys.showSaleTypeItems)) {
            children.add(
              _labelValue(
                'Sale Type:',
                receipt.saleType,
                m,
                fontSize: m.metaSize,
              ),
            );
            children.add(
              _labelValue(
                'Total Items:',
                receipt.totalItemCount.toString().padLeft(2, '0'),
                m,
                fontSize: m.metaSize,
              ),
            );
          }

          if (opts.option(PrintOptionKeys.showSaleNote) &&
              receipt.saleNote.isNotEmpty) {
            children.add(_labelValue('Sale Note:', receipt.saleNote, m));
          }
          if (opts.option(PrintOptionKeys.showPaymentNote) &&
              receipt.paymentNote.isNotEmpty) {
            children.add(_labelValue('Payment Note:', receipt.paymentNote, m));
          }

          if (opts.option(PrintOptionKeys.showVatRegistration) &&
              opts.vatRegistrationNo.isNotEmpty) {
            children.add(
              pw.Text(
                'VAT Reg: ${opts.vatRegistrationNo}',
                style: pw.TextStyle(fontSize: m.tinySize),
                textAlign: pw.TextAlign.center,
              ),
            );
          }

          if (opts.option(PrintOptionKeys.showInWords)) {
            children.add(
              pw.Padding(
                padding: const pw.EdgeInsets.symmetric(vertical: 4),
                child: pw.Text(
                  amountInWords(receipt.grandTotal),
                  style: pw.TextStyle(fontSize: m.tinySize),
                  textAlign: pw.TextAlign.center,
                ),
              ),
            );
          }

          // ── Footer ──
          if (opts.option(PrintOptionKeys.showFooterText)) {
            children.add(pw.SizedBox(height: 6));
            if (opts.footerTitle.isNotEmpty) {
              children.add(
                pw.Text(
                  opts.footerTitle,
                  textAlign: pw.TextAlign.center,
                  style: pw.TextStyle(
                    fontSize: m.bodySize,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
              );
            }
            if (opts.footerText.isNotEmpty) {
              children.add(
                pw.Text(
                  opts.footerText,
                  textAlign: pw.TextAlign.center,
                  style: pw.TextStyle(fontSize: m.smallSize),
                ),
              );
            }
          }

          if (opts.softwareCredit.trim().isNotEmpty) {
            children.add(
              pw.Text(
                opts.softwareCredit.trim(),
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(fontSize: m.tinySize),
              ),
            );
          }

          if (opts.option(PrintOptionKeys.showBarcode)) {
            children.add(pw.SizedBox(height: 8));
            children.add(
              pw.Center(
                child: pw.BarcodeWidget(
                  barcode: pw.Barcode.code128(),
                  data: formatSaleReferenceDisplay(refNo),
                  width: m.contentWidth * 0.9,
                  height: 32,
                  drawText: false,
                ),
              ),
            );
            children.add(
              pw.Center(
                child: pw.Text(
                  formatSaleReferenceDisplay(refNo),
                  style: pw.TextStyle(
                    fontSize: m.tinySize,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            );
          }

          if (opts.option(PrintOptionKeys.showQrCode)) {
            children.add(pw.SizedBox(height: 6));
            children.add(
              pw.Center(
                child: pw.BarcodeWidget(
                  barcode: pw.Barcode.qrCode(),
                  data: refNo,
                  width: 52,
                  height: 52,
                ),
              ),
            );
          }

          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.stretch,
            children: children,
          );
        },
      ),
    );

    return doc.save();
  }

  /// Honour saved [referencePrefix]; auto-generate only when that option is on.
  static String _resolveInvoiceNo(
    LocalPrintSettings opts,
    LocalReceipt receipt,
  ) {
    final prefix = opts.referencePrefix.trim();
    if (opts.option(PrintOptionKeys.activeGeneratSettings)) {
      return '$prefix${DateFormat('yyyyMMdd').format(receipt.createdAt)}0205';
    }

    final ref = receipt.referenceNo.trim();
    if (prefix.isEmpty) return ref;

    // Real synced sale — keep server reference as-is.
    if (receipt.serverSaleId != null && ref.isNotEmpty) return ref;

    // Preview / local: apply user's prefix to the numeric tail.
    final tail = ref.replaceFirst(RegExp(r'^[A-Za-z]+-?'), '');
    return tail.isNotEmpty
        ? '$prefix$tail'
        : '$prefix${receipt.createdAt.millisecondsSinceEpoch % 100000}';
  }

  static const double _dividerThickness = 0.6;

  /// pdf [Divider] defaults to 16pt height — set height = thickness to avoid gaps.
  static pw.Widget _thinDivider(PdfColor color) => pw.Divider(
        thickness: _dividerThickness,
        height: _dividerThickness,
        color: color,
      );

  static pw.Widget _rule(PdfColor color, {double vertical = 4}) => pw.Padding(
        padding: pw.EdgeInsets.symmetric(vertical: vertical),
        child: _thinDivider(color),
      );

  static pw.Widget _labelValue(
    String label,
    String value,
    _ReceiptMetrics m, {
    bool valueBold = false,
    double? fontSize,
  }) {
    final size = fontSize ?? m.smallSize;
    return pw.Row(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(label, style: pw.TextStyle(fontSize: size)),
        pw.Expanded(
          child: pw.Text(
            value,
            style: pw.TextStyle(
              fontSize: size,
              fontWeight: valueBold ? pw.FontWeight.bold : null,
            ),
            textAlign: pw.TextAlign.right,
            maxLines: 4,
          ),
        ),
      ],
    );
  }

  static pw.Widget _itemColumnHeader(_ReceiptMetrics m) {
    return pw.Row(
      children: [
        _col('ITEM', m, flex: 2, bold: true, fontSize: m.itemDetailSize),
        _col('PRICE', m,
            flex: 2,
            align: pw.TextAlign.right,
            bold: true,
            fontSize: m.itemDetailSize),
        _col('QTY', m,
            flex: 2,
            align: pw.TextAlign.right,
            bold: true,
            fontSize: m.itemDetailSize),
        _col('DIS.', m,
            flex: 2,
            align: pw.TextAlign.right,
            bold: true,
            fontSize: m.itemDetailSize),
        _col('SUBTOTAL', m,
            flex: 3,
            align: pw.TextAlign.right,
            bold: true,
            fontSize: m.itemDetailSize),
      ],
    );
  }

  static pw.Widget _col(
    String text,
    _ReceiptMetrics m, {
    required int flex,
    pw.TextAlign align = pw.TextAlign.left,
    bool bold = false,
    double? fontSize,
  }) {
    return pw.Expanded(
      flex: flex,
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: fontSize ?? m.tinySize,
          fontWeight: bold ? pw.FontWeight.bold : null,
        ),
        textAlign: align,
        maxLines: 1,
      ),
    );
  }

  static pw.Widget _itemRow(
    LocalReceiptLine line,
    int index,
    _ReceiptMetrics m,
    NumberFormat qtyFmt,
  ) {
    final idx = index.toString().padLeft(2, '0');
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 4),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            '$idx. ${line.name}',
            style: pw.TextStyle(fontSize: m.itemNameSize),
            maxLines: 3,
          ),
          pw.Row(
            children: [
              _col(
                line.code ?? '',
                m,
                flex: 2,
                fontSize: m.itemDetailSize,
              ),
              _col(
                formatPosMoney(line.unitPrice),
                m,
                flex: 2,
                align: pw.TextAlign.right,
                fontSize: m.itemDetailSize,
              ),
              _col(
                qtyFmt.format(line.qty),
                m,
                flex: 2,
                align: pw.TextAlign.right,
                fontSize: m.itemDetailSize,
              ),
              _col(
                formatPosMoney(line.discount),
                m,
                flex: 2,
                align: pw.TextAlign.right,
                fontSize: m.itemDetailSize,
              ),
              _col(
                formatPosMoney(line.total),
                m,
                flex: 3,
                align: pw.TextAlign.right,
                fontSize: m.itemDetailSize,
              ),
            ],
          ),
        ],
      ),
    );
  }

  static pw.Widget _totalRow(
    String label,
    double amount,
    _ReceiptMetrics m, {
    bool bold = false,
    bool large = false,
  }) {
    final size = large ? m.totalLargeSize : m.totalSize;
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 1),
      child: pw.Row(
        children: [
          pw.Expanded(
            child: pw.Text(
              label,
              style: pw.TextStyle(
                fontSize: size,
                fontWeight: bold ? pw.FontWeight.bold : null,
              ),
            ),
          ),
          pw.Text(
            formatPosMoney(amount),
            style: pw.TextStyle(
              fontSize: size,
              fontWeight: bold ? pw.FontWeight.bold : null,
            ),
          ),
        ],
      ),
    );
  }

  static Future<pw.MemoryImage?> _loadLogo(LocalPrintSettings settings) async {
    final path = settings.logoPath;
    if (path == null || path.isEmpty) return null;
    try {
      final file = File(path);
      if (!await file.exists()) return null;
      return pw.MemoryImage(await file.readAsBytes());
    } catch (_) {
      return null;
    }
  }

  static PdfColor _parseColor(String hex) {
    var h = hex.replaceFirst('#', '').trim();
    if (h.length == 6) {
      return PdfColor.fromInt(0xFF000000 | int.parse(h, radix: 16));
    }
    return PdfColors.black;
  }
}
