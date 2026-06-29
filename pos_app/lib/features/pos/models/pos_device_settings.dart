import 'invoice_settings.dart';
import 'pos_settings.dart';

/// Cached POS + invoice template settings from bootstrap / download.
class PosDeviceSettings {
  const PosDeviceSettings({
    required this.pos,
    this.invoice,
    this.siteTitle,
  });

  final PosSettings pos;
  final InvoiceSettings? invoice;
  final String? siteTitle;

  String get thermalSize => InvoiceSettings.resolveThermalSize(
        invoice: invoice,
        invoiceOption: pos.invoiceOption,
        thermalInvoiceSize: pos.thermalInvoiceSize,
      );

  String get receiptTitle =>
      invoice?.invoiceName?.trim().isNotEmpty == true
          ? invoice!.invoiceName!.trim()
          : (siteTitle?.trim().isNotEmpty == true
              ? siteTitle!.trim()
              : 'SALE RECEIPT');
}
