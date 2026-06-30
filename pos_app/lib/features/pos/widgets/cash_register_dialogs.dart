import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/pos_theme.dart';
import '../models/cash_register_details.dart';
import '../pos_currency.dart';
import '../services/cash_register_service.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

Future<bool> showOpenCashRegisterDialog({
  required BuildContext context,
  required CashRegisterService service,
  required int warehouseId,
  required int userId,
  String? warehouseName,
}) async {
  final cashCtrl = TextEditingController(text: '0');
  var submitting = false;

  final opened = await showPosDialog<bool>(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => PosProfessionalDialogShell(
        title: 'Open cash register',
        subtitle: 'Enter opening cash before making sales',
        icon: Icons.point_of_sale_outlined,
        maxWidth: 440,
        maxBodyHeight: 280,
        footer: PosProfessionalDialogFooter(
          secondaryLabel: 'Later',
          primaryLabel: 'Open day',
          primaryEnabled: !submitting,
          onSecondary: submitting ? null : () => Navigator.pop(ctx, false),
          onPrimary: submitting
              ? null
              : () => _submitOpenRegister(
                    ctx: ctx,
                    service: service,
                    warehouseId: warehouseId,
                    userId: userId,
                    cashCtrl: cashCtrl,
                    onSubmitting: () => setState(() => submitting = true),
                    onSubmitFailed: () => setState(() => submitting = false),
                  ),
        ),
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Open the day before making sales. Enter cash in hand to start.',
              style: TextStyle(fontSize: 13, height: 1.45, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
            SizedBox(height: 14),
            if (warehouseName != null && warehouseName.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Theme.of(context).dividerColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Warehouse',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      warehouseName,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            TextField(
              controller: cashCtrl,
              autofocus: true,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
              ],
              decoration: InputDecoration(
                labelText: 'Cash in hand *',
                border: OutlineInputBorder(),
                hintText: '0',
              ),
              onSubmitted: submitting
                  ? null
                  : (_) => _submitOpenRegister(
                        ctx: ctx,
                        service: service,
                        warehouseId: warehouseId,
                        userId: userId,
                        cashCtrl: cashCtrl,
                        onSubmitting: () => setState(() => submitting = true),
                        onSubmitFailed: () =>
                            setState(() => submitting = false),
                      ),
            ),
            if (submitting) ...[
              SizedBox(height: 16),
              Center(child: CircularProgressIndicator()),
            ],
          ],
        ),
      ),
    ),
  );

  cashCtrl.dispose();
  return opened == true;
}

Future<void> _submitOpenRegister({
  required BuildContext ctx,
  required CashRegisterService service,
  required int warehouseId,
  required int userId,
  required TextEditingController cashCtrl,
  required VoidCallback onSubmitting,
  required VoidCallback onSubmitFailed,
}) async {
  final raw = cashCtrl.text.trim();
  final n = double.tryParse(raw.isEmpty ? '0' : raw);
  if (n == null || n < 0) {
    ScaffoldMessenger.of(ctx).showSnackBar(
      const SnackBar(
        content: Text('Enter a valid cash in hand amount'),
      ),
    );
    return;
  }

  onSubmitting();
  try {
    await service.openRegister(
      warehouseId: warehouseId,
      userId: userId,
      cashInHand: n,
    );
    if (ctx.mounted) Navigator.pop(ctx, true);
  } catch (e) {
    onSubmitFailed();
    if (ctx.mounted) {
      ScaffoldMessenger.of(ctx).showSnackBar(
        SnackBar(content: Text('Failed to open register: $e')),
      );
    }
  }
}

typedef CashRegisterDayEndPrintCallback = Future<void> Function(
  CashRegisterDetails details,
  double actualCash,
);

double _cashRegisterDialogBodyHeight(BuildContext context, bool closing) {
  final screenH = MediaQuery.sizeOf(context).height;
  if (closing) {
    return (screenH * 0.74).clamp(560.0, 760.0);
  }
  return (screenH * 0.52).clamp(360.0, 480.0);
}

void _revealCloseCashField({
  required ScrollController scrollCtrl,
  required FocusNode actualCashFocus,
}) {
  WidgetsBinding.instance.addPostFrameCallback((_) {
    if (scrollCtrl.hasClients) {
      scrollCtrl.animateTo(
        scrollCtrl.position.maxScrollExtent,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
      );
    }
    actualCashFocus.requestFocus();
  });
}

Future<bool> showCashRegisterDetailsDialog({
  required BuildContext context,
  required CashRegisterService service,
  required int registerId,
  required int userId,
  bool requireClose = false,
  CashRegisterDayEndPrintCallback? onDayEndPrint,
}) async {
  CashRegisterDetails? details;
  try {
    details = await service.getDetails(
      registerId: registerId,
      userId: userId,
    );
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not load register: $e')),
      );
    }
    return false;
  }

  if (!context.mounted) return false;

  final actualCtrl = TextEditingController(
    text: details.totalCash.toStringAsFixed(2),
  );
  final scrollCtrl = ScrollController();
  final actualCashFocus = FocusNode();
  var showCloseFields = requireClose;
  var submitting = false;

  if (showCloseFields) {
    _revealCloseCashField(
      scrollCtrl: scrollCtrl,
      actualCashFocus: actualCashFocus,
    );
  }

  String fmt(double v) => formatPosMoney(v);

  Widget row(String label, double value, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(child: Text(label, style: TextStyle(fontWeight: bold ? FontWeight.bold : null))),
          Text(fmt(value), style: TextStyle(fontWeight: bold ? FontWeight.bold : null)),
        ],
      ),
    );
  }

  final closed = await showPosDialog<bool>(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => PosProfessionalDialogShell(
        title: requireClose
            ? 'Close cash register'
            : 'Cash register details',
        subtitle: requireClose
            ? 'Review totals before exiting'
            : 'Today\'s register summary',
        icon: Icons.account_balance_wallet_outlined,
        maxWidth: 480,
        maxBodyHeight: _cashRegisterDialogBodyHeight(ctx, showCloseFields),
        footer: PosProfessionalDialogFooter(
          secondaryLabel: requireClose ? null : 'Close',
          primaryLabel: showCloseFields ? 'Submit & close' : 'Close register',
          primaryEnabled: !submitting,
          onSecondary:
              requireClose ? null : () => Navigator.pop(ctx, false),
          onPrimary: showCloseFields
              ? (submitting
                  ? null
                  : () async {
                      final actual = double.tryParse(actualCtrl.text.trim());
                      if (actual == null || actual < 0) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          const SnackBar(
                            content: Text('Enter valid actual cash'),
                          ),
                        );
                        return;
                      }
                      setState(() => submitting = true);
                      try {
                        await service.closeRegister(
                          registerId: registerId,
                          userId: userId,
                          closingBalance: details!.totalCash,
                          actualCash: actual,
                        );
                        if (onDayEndPrint != null) {
                          try {
                            await onDayEndPrint(details, actual);
                          } catch (e) {
                            if (ctx.mounted) {
                              ScaffoldMessenger.of(ctx).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Register closed but day-end print failed: $e',
                                  ),
                                ),
                              );
                            }
                          }
                        }
                        if (ctx.mounted) Navigator.pop(ctx, true);
                      } catch (e) {
                        setState(() => submitting = false);
                        if (ctx.mounted) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            SnackBar(
                              content: Text('Failed to close register: $e'),
                            ),
                          );
                        }
                      }
                    })
              : () {
                  setState(() => showCloseFields = true);
                  _revealCloseCashField(
                    scrollCtrl: scrollCtrl,
                    actualCashFocus: actualCashFocus,
                  );
                },
        ),
        body: SingleChildScrollView(
          controller: scrollCtrl,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Please review transactions and payments.',
                style: TextStyle(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
              SizedBox(height: 12),
              row('Cash in hand', details!.cashInHand),
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
              row('Total supplier payment', details.totalSupplierPayment),
              Divider(height: 24),
              row('Total cash', details.totalCash, bold: true),
              if (showCloseFields) ...[
                SizedBox(height: 12),
                TextField(
                  controller: actualCtrl,
                  focusNode: actualCashFocus,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(
                      RegExp(r'^\d*\.?\d{0,2}'),
                    ),
                  ],
                  decoration: InputDecoration(
                    labelText: 'Actual cash *',
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    ),
  );

  actualCtrl.dispose();
  scrollCtrl.dispose();
  actualCashFocus.dispose();
  return closed == true;
}
