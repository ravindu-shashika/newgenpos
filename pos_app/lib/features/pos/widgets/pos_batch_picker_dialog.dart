import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import '../models/scanned_product.dart';
import 'pos_ui_widgets.dart';
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

    return AlertDialog(
      title: const Text('Select batch'),
      content: SizedBox(
        width: 420,
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
            const SizedBox(height: 12),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: options.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (ctx, i) {
                  final opt = options[i];
                  final expiry = opt.expiredDate?.trim();
                  return ListTile(
                    title: Text('Batch ${opt.batchNo}'),
                    subtitle: expiry != null && expiry.isNotEmpty
                        ? Text('Expires: $expiry')
                        : null,
                    trailing: Text(
                      opt.qty.toStringAsFixed(2),
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
