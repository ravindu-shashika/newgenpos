import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import '../pos_currency.dart';
import 'pos_amount_numpad.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

/// Opens a numpad to set the return credit amount (capped at [maxAmount]).
Future<double?> showReturnCreditAmountDialog({
  required BuildContext context,
  required double maxAmount,
  required double initialAmount,
}) {
  return showPosDialog<double>(
    context: context,
    builder: (ctx) => _ReturnCreditAmountDialog(
      maxAmount: maxAmount,
      initialAmount: initialAmount,
    ),
  );
}

class _ReturnCreditAmountDialog extends StatefulWidget {
  const _ReturnCreditAmountDialog({
    required this.maxAmount,
    required this.initialAmount,
  });

  final double maxAmount;
  final double initialAmount;

  @override
  State<_ReturnCreditAmountDialog> createState() =>
      _ReturnCreditAmountDialogState();
}

class _ReturnCreditAmountDialogState extends State<_ReturnCreditAmountDialog> {
  late final TextEditingController _amountCtrl;

  double get _amount => double.tryParse(_amountCtrl.text.trim()) ?? 0;

  @override
  void initState() {
    super.initState();
    final initial = widget.initialAmount.clamp(0, widget.maxAmount).toDouble();
    _amountCtrl = TextEditingController(
      text: initial % 1 == 0
          ? initial.toStringAsFixed(0)
          : initial.toStringAsFixed(2),
    );
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    super.dispose();
  }

  void _apply() {
    final amount = _amount.clamp(0, widget.maxAmount).toDouble();
    Navigator.pop(context, amount);
  }

  void _useFullAmount() {
    final max = widget.maxAmount;
    _amountCtrl.text =
        max % 1 == 0 ? max.toStringAsFixed(0) : max.toStringAsFixed(2);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final styles = context.posStyles;
    final amount = _amount.clamp(0, widget.maxAmount).toDouble();
    final overMax = _amount > widget.maxAmount + 0.009;

    return PosProfessionalWideDialogShell(
      title: 'Return credit',
      subtitle: 'Enter the credit amount for this return',
      icon: Icons.undo_rounded,
      maxWidth: 520,
      onClose: () => Navigator.pop(context),
      footer: PosProfessionalDialogFooter(
        secondaryLabel: 'Cancel',
        primaryLabel: 'Apply credit',
        onSecondary: () => Navigator.pop(context),
        onPrimary: _apply,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 18, 24, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: _InfoChip(
                    label: 'Item total',
                    value: formatPosMoney(widget.maxAmount),
                    color: styles.text,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _InfoChip(
                    label: 'Credit amount',
                    value: formatPosMoney(amount),
                    color: context.posBrand.primary,
                  ),
                ),
              ],
            ),
            if (overMax) ...[
              const SizedBox(height: 8),
              Text(
                'Max credit is ${formatPosMoney(widget.maxAmount)}',
                style: styles.caption.copyWith(color: PosColors.red),
              ),
            ],
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: _useFullAmount,
                icon: const Icon(Icons.done_all, size: 18),
                label: const Text('Use full item total'),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              height: 72,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: styles.inputFill,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: styles.border),
              ),
              child: Text(
                formatPosMoney(amount),
                style: TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.w800,
                  color: styles.text,
                  height: 1,
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 280,
              child: PosAmountNumpad(
                controller: _amountCtrl,
                onChanged: () => setState(() {}),
                showQuickCash: false,
                fillHeight: true,
                largeTouch: true,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
