import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import '../models/return_cart_line.dart';
import '../pos_currency.dart';
import '../pos_totals.dart';

class ReturnSessionPanel extends StatelessWidget {
  const ReturnSessionPanel({
    super.key,
    required this.returnLines,
    required this.totals,
    required this.scanController,
    required this.onScanSubmit,
    required this.onRemoveLine,
    required this.onUpdateQty,
    required this.onCancelSession,
    this.busy = false,
    this.showScanField = true,
    this.title = 'Return items',
  });

  final List<ReturnCartLine> returnLines;
  final PosTotals totals;
  final TextEditingController scanController;
  final ValueChanged<String> onScanSubmit;
  final ValueChanged<String> onRemoveLine;
  final void Function(String lineKey, double qty) onUpdateQty;
  final VoidCallback onCancelSession;
  final bool busy;
  final bool showScanField;
  final String title;

  @override
  Widget build(BuildContext context) {
    final styles = context.posStyles;
    final brand = context.posBrand;

    return Material(
      color: brand.primary.withValues(alpha: 0.06),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
            child: Row(
              children: [
                Icon(Icons.undo_rounded, color: brand.primary, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: styles.body.copyWith(fontWeight: FontWeight.w800),
                  ),
                ),
                TextButton(
                  onPressed: busy ? null : onCancelSession,
                  child: const Text('Cancel'),
                ),
              ],
            ),
          ),
          if (showScanField)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: TextField(
                controller: scanController,
                enabled: !busy,
                decoration: InputDecoration(
                  isDense: true,
                  hintText: 'Scan return item (barcode, code, or name)',
                  prefixIcon: const Icon(Icons.qr_code_scanner, size: 20),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.add_circle_outline),
                    onPressed: busy
                        ? null
                        : () => onScanSubmit(scanController.text),
                  ),
                ),
                onSubmitted: onScanSubmit,
              ),
            ),
          if (returnLines.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _summaryChip(
                    context,
                    'Return credit',
                    totals.returnCreditFromSession,
                    brand.primary,
                  ),
                  const SizedBox(width: 8),
                  _summaryChip(
                    context,
                    'Sale total',
                    totals.saleGrandTotal,
                    styles.text,
                  ),
                  const SizedBox(width: 8),
                  _summaryChip(
                    context,
                    totals.balanceDue > 0.009 ? 'Balance due' : 'No payment',
                    totals.balanceDue > 0.009
                        ? totals.balanceDue
                        : 0,
                    totals.storeCreditDue > 0.009
                        ? PosColors.teal
                        : brand.primary,
                  ),
                ],
              ),
            ),
          if (returnLines.isEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Scan or search products to return',
                style: styles.caption,
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              itemCount: returnLines.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final line = returnLines[i];
                return Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            line.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: styles.body.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            line.code,
                            style: styles.caption,
                          ),
                          if (line.stockQty != null)
                            Text(
                              'Stock: ${line.stockQty!.toStringAsFixed(0)}',
                              style: styles.caption,
                            ),
                        ],
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.remove_circle_outline),
                          onPressed: busy || line.qty <= 1
                              ? null
                              : () => onUpdateQty(
                                    line.lineKey,
                                    line.qty - 1,
                                  ),
                        ),
                        Text(line.qty.toStringAsFixed(0)),
                        IconButton(
                          icon: const Icon(Icons.add_circle_outline),
                          onPressed: busy
                              ? null
                              : () {
                                  final max = line.maxReturnableQty;
                                  if (max != null && line.qty >= max) return;
                                  onUpdateQty(line.lineKey, line.qty + 1);
                                },
                        ),
                      ],
                    ),
                    SizedBox(
                      width: 72,
                      child: Text(
                        formatPosMoney(line.subtotal),
                        textAlign: TextAlign.right,
                        style: styles.moneyMedium.copyWith(fontSize: 13),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: busy
                          ? null
                          : () => onRemoveLine(line.lineKey),
                    ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _summaryChip(
    BuildContext context,
    String label,
    double amount,
    Color color,
  ) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            Text(
              formatPosMoney(amount),
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
