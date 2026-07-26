import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../core/database/app_database.dart';
import '../../../core/theme/pos_theme.dart';
import '../models/sale_bill_detail.dart';
import '../pos_currency.dart';
import '../services/sale_bill_detail_service.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

Future<void> showSaleBillDetailDialog({
  required BuildContext context,
  required AppDatabase db,
  required int localSaleId,
}) async {
  final detail = await SaleBillDetailService(db).load(localSaleId);
  if (!context.mounted) return;
  if (detail == null) {
    await showPosInfoDialog(
      context: context,
      title: 'Bill not found',
      message: 'Could not load sale items for this bill.',
      icon: Icons.receipt_long_outlined,
    );
    return;
  }

  final service = SaleBillDetailService(db);
  final reference = service.formatReference(detail.sale);
  final dateFmt = DateFormat('d MMM yyyy · h:mm a');

  await showPosDialog<void>(
    context: context,
    builder: (ctx) => PosProfessionalDialogShell(
      title: reference,
      subtitle: 'Bill items',
      icon: Icons.receipt_long_outlined,
      maxWidth: 640,
      maxBodyHeight: 480,
      footer: PosProfessionalDialogFooter(
        primaryLabel: 'Close',
        onPrimary: () => Navigator.pop(ctx),
      ),
      body: _SaleBillDetailBody(
        detail: detail,
        reference: reference,
        dateLabel: dateFmt.format(detail.sale.createdAt),
      ),
    ),
  );
}

class _SaleBillDetailBody extends StatelessWidget {
  const _SaleBillDetailBody({
    required this.detail,
    required this.reference,
    required this.dateLabel,
  });

  final SaleBillDetail detail;
  final String reference;
  final String dateLabel;

  @override
  Widget build(BuildContext context) {
    final sale = detail.sale;
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _MetaRow(
          children: [
            _MetaChip(icon: Icons.schedule, label: dateLabel),
            if (detail.paymentLabel != null)
              _MetaChip(icon: Icons.payments_outlined, label: detail.paymentLabel!),
            if (detail.customerName != null)
              _MetaChip(icon: Icons.person_outline, label: detail.customerName!),
          ],
        ),
        SizedBox(height: 14),
        Expanded(
          child: detail.lines.isEmpty
              ? Center(
                  child: Text(
                    'No line items recorded for this bill.',
                    style: TextStyle(color: muted),
                  ),
                )
              : ListView.separated(
                  itemCount: detail.lines.length,
                  separatorBuilder: (_, __) => Divider(
                    height: 1,
                    color: Theme.of(context).dividerColor,
                  ),
                  itemBuilder: (_, i) => _LineRow(line: detail.lines[i]),
                ),
        ),
        SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: context.posBrand.primaryLight.withValues(alpha: 0.35),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Column(
            children: [
              if (sale.totalDiscount > 0)
                _TotalRow(
                  label: 'Discount',
                  value: formatPosMoney(-sale.totalDiscount),
                ),
              if (sale.totalTax > 0)
                _TotalRow(label: 'Tax', value: formatPosMoney(sale.totalTax)),
              if (sale.shippingCost > 0)
                _TotalRow(
                  label: 'Shipping',
                  value: formatPosMoney(sale.shippingCost),
                ),
              if (detail.hasReturnCredit) ...[
                _TotalRow(
                  label: 'Return credit',
                  value: formatPosMoney(-detail.returnCredit),
                ),
                if (detail.returnReferencesLabel.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Return bill: ${detail.returnReferencesLabel}',
                        style: TextStyle(
                          fontSize: 12,
                          color: muted,
                        ),
                      ),
                    ),
                  ),
              ],
              _TotalRow(
                label: 'Grand total',
                value: formatPosMoney(sale.grandTotal),
                bold: true,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MetaRow extends StatelessWidget {
  const _MetaRow({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: children,
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
          SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _LineRow extends StatelessWidget {
  const _LineRow({required this.line});

  final LocalSaleLine line;

  @override
  Widget build(BuildContext context) {
    final name = line.name?.trim().isNotEmpty == true
        ? line.name!.trim()
        : 'Product #${line.productId}';
    final code = line.code?.trim();
    final qtyLabel = line.qty == line.qty.roundToDouble()
        ? '${line.qty.toInt()} ${line.saleUnit}'
        : '${line.qty.toStringAsFixed(2)} ${line.saleUnit}';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
                if (code != null && code.isNotEmpty) ...[
                  SizedBox(height: 2),
                  Text(
                    code,
                    style: TextStyle(
                      fontSize: 12,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
                SizedBox(height: 4),
                Text(
                  '$qtyLabel × ${formatPosMoney(line.netUnitPrice)}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: 12),
          Text(
            formatPosMoney(line.total),
            style: context.posStyles.productPrice.copyWith(fontSize: 14),
          ),
        ],
      ),
    );
  }
}

class _TotalRow extends StatelessWidget {
  const _TotalRow({
    required this.label,
    required this.value,
    this.bold = false,
  });

  final String label;
  final String value;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: bold ? 14 : 13,
                fontWeight: bold ? FontWeight.w800 : FontWeight.w500,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: bold ? 16 : 13,
              fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ],
      ),
    );
  }
}
