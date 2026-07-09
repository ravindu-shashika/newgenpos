import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import '../pos_currency.dart';
import 'pos_amount_numpad.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

/// Opens a numpad to set a return credit amount or unit price.
///
/// [itemTotal] is shown in the reference chip (defaults to [maxAmount]).
/// When [maxAmount] is null, the entered value is not capped.
Future<double?> showReturnCreditAmountDialog({
  required BuildContext context,
  required double initialAmount,
  double? maxAmount,
  double? itemTotal,
  String title = 'Return credit',
  String subtitle = 'Enter the credit amount for this return',
  String itemTotalLabel = 'Item total',
  String amountLabel = 'Credit amount',
  String primaryLabel = 'Apply credit',
  String useFullLabel = 'Use full item total',
  bool showUseFullAmount = true,
  IconData icon = Icons.undo_rounded,
}) {
  return showPosDialog<double>(
    context: context,
    builder: (ctx) => _ReturnCreditAmountDialog(
      initialAmount: initialAmount,
      maxAmount: maxAmount,
      itemTotal: itemTotal ?? maxAmount ?? initialAmount,
      title: title,
      subtitle: subtitle,
      itemTotalLabel: itemTotalLabel,
      amountLabel: amountLabel,
      primaryLabel: primaryLabel,
      useFullLabel: useFullLabel,
      showUseFullAmount: showUseFullAmount && maxAmount != null,
      icon: icon,
    ),
  );
}

class _ReturnCreditAmountDialog extends StatefulWidget {
  const _ReturnCreditAmountDialog({
    required this.initialAmount,
    required this.itemTotal,
    this.maxAmount,
    required this.title,
    required this.subtitle,
    required this.itemTotalLabel,
    required this.amountLabel,
    required this.primaryLabel,
    required this.useFullLabel,
    required this.showUseFullAmount,
    required this.icon,
  });

  final double initialAmount;
  final double? maxAmount;
  final double itemTotal;
  final String title;
  final String subtitle;
  final String itemTotalLabel;
  final String amountLabel;
  final String primaryLabel;
  final String useFullLabel;
  final bool showUseFullAmount;
  final IconData icon;

  @override
  State<_ReturnCreditAmountDialog> createState() =>
      _ReturnCreditAmountDialogState();
}

class _ReturnCreditAmountDialogState extends State<_ReturnCreditAmountDialog> {
  late final TextEditingController _amountCtrl;

  double get _amount => double.tryParse(_amountCtrl.text.trim()) ?? 0;

  double? get _maxCap => widget.maxAmount;

  double _clampAmount(double value) {
    final max = _maxCap;
    if (max == null) return value < 0 ? 0 : value;
    return value.clamp(0, max).toDouble();
  }

  @override
  void initState() {
    super.initState();
    final initial = _clampAmount(widget.initialAmount);
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
    Navigator.pop(context, _clampAmount(_amount));
  }

  void _useFullAmount() {
    final max = _maxCap;
    if (max == null) return;
    _amountCtrl.text =
        max % 1 == 0 ? max.toStringAsFixed(0) : max.toStringAsFixed(2);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final styles = context.posStyles;
    final amount = _clampAmount(_amount);
    final max = _maxCap;
    final overMax = max != null && _amount > max + 0.009;

    return PosProfessionalWideDialogShell(
      title: widget.title,
      subtitle: widget.subtitle,
      icon: widget.icon,
      maxWidth: 520,
      onClose: () => Navigator.pop(context),
      footer: PosProfessionalDialogFooter(
        secondaryLabel: 'Cancel',
        primaryLabel: widget.primaryLabel,
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
                    label: widget.itemTotalLabel,
                    value: formatPosMoney(widget.itemTotal),
                    color: styles.text,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _InfoChip(
                    label: widget.amountLabel,
                    value: formatPosMoney(amount),
                    color: context.posBrand.primary,
                  ),
                ),
              ],
            ),
            if (overMax) ...[
              const SizedBox(height: 8),
              Text(
                'Max ${widget.amountLabel.toLowerCase()} is ${formatPosMoney(max!)}',
                style: styles.caption.copyWith(color: PosColors.red),
              ),
            ],
            if (widget.showUseFullAmount) ...[
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: _useFullAmount,
                  icon: const Icon(Icons.done_all, size: 18),
                  label: Text(widget.useFullLabel),
                ),
              ),
            ],
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
