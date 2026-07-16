import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import '../models/scanned_product.dart';
import '../pos_currency.dart';
import 'show_pos_dialog.dart';

Future<ProductBatchOption?> showBatchPickerDialog({
  required BuildContext context,
  required String productName,
  required List<ProductBatchOption> options,
}) {
  return showPosDialog<ProductBatchOption>(
    context: context,
    builder: (ctx) => _BatchPickerDialog(
      productName: productName,
      options: options,
    ),
  );
}

class _BatchPickerDialog extends StatelessWidget {
  const _BatchPickerDialog({
    required this.productName,
    required this.options,
  });

  final String productName;
  final List<ProductBatchOption> options;

  @override
  Widget build(BuildContext context) {
    final styles = context.posStyles;
    final showPricing = options.length > 1;

    return AlertDialog(
      title: const Text('Select batch'),
      content: SizedBox(
        width: 480,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              productName,
              style: TextStyle(
                color: styles.textMuted,
                fontSize: 13,
              ),
            ),
            if (showPricing) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  const Expanded(child: SizedBox.shrink()),
                  SizedBox(
                    width: 72,
                    child: Text(
                      'Qty',
                      textAlign: TextAlign.right,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: styles.textMuted,
                      ),
                    ),
                  ),
                  SizedBox(
                    width: 88,
                    child: Text(
                      'Price',
                      textAlign: TextAlign.right,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: styles.textMuted,
                      ),
                    ),
                  ),
                  SizedBox(
                    width: 88,
                    child: Text(
                      'Max',
                      textAlign: TextAlign.right,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: styles.textMuted,
                      ),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 8),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: options.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (ctx, i) {
                  final opt = options[i];
                  final expiry = opt.expiredDate?.trim();
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                    title: Text('Batch ${opt.batchNo}'),
                    subtitle: expiry != null && expiry.isNotEmpty
                        ? Text('Expires: $expiry')
                        : null,
                    trailing: showPricing
                        ? Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              SizedBox(
                                width: 72,
                                child: Text(
                                  opt.qty == opt.qty.roundToDouble()
                                      ? '${opt.qty.toInt()}'
                                      : opt.qty.toStringAsFixed(2),
                                  textAlign: TextAlign.right,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: styles.textMuted,
                                  ),
                                ),
                              ),
                              SizedBox(
                                width: 88,
                                child: Text(
                                  opt.price != null
                                      ? formatPosMoney(opt.price!)
                                      : '—',
                                  textAlign: TextAlign.right,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: styles.accent,
                                  ),
                                ),
                              ),
                              SizedBox(
                                width: 88,
                                child: Text(
                                  opt.maxPrice != null && opt.maxPrice! > 0
                                      ? formatPosMoney(opt.maxPrice!)
                                      : '—',
                                  textAlign: TextAlign.right,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: styles.textMuted,
                                  ),
                                ),
                              ),
                            ],
                          )
                        : Text(
                            opt.qty == opt.qty.roundToDouble()
                                ? '${opt.qty.toInt()}'
                                : opt.qty.toStringAsFixed(2),
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              color: styles.accent,
                            ),
                          ),
                    onTap: () => Navigator.of(ctx).pop(opt),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
      ],
    );
  }
}
