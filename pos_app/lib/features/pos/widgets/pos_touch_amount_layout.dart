import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import 'pos_amount_numpad.dart';

/// Left summary + quick values, right full-height numpad (payment / discount).
class PosTouchAmountEntryLayout extends StatefulWidget {
  const PosTouchAmountEntryLayout({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.fieldLabel,
    required this.onChanged,
    this.height = 400,
    this.largeTouch = true,
    this.showCaption = false,
    this.leftBody,
    this.quickBar,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final String fieldLabel;
  final VoidCallback onChanged;
  final double height;
  final bool largeTouch;
  final bool showCaption;
  final List<Widget>? leftBody;
  final Widget? quickBar;

  @override
  State<PosTouchAmountEntryLayout> createState() =>
      _PosTouchAmountEntryLayoutState();
}

class _PosTouchAmountEntryLayoutState extends State<PosTouchAmountEntryLayout> {
  bool _quickCashInitial = true;

  void _markQuickCashUsed() {
    if (_quickCashInitial) setState(() => _quickCashInitial = false);
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: widget.height,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            flex: 4,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (widget.showCaption) ...[
                  Text(
                    widget.fieldLabel,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: PosColors.textMuted,
                    ),
                  ),
                  const SizedBox(height: 6),
                ],
                PosAmountField(
                  controller: widget.controller,
                  focusNode: widget.focusNode,
                  largeTouch: widget.largeTouch,
                  decoration: InputDecoration(
                    labelText: widget.fieldLabel,
                    border: const OutlineInputBorder(),
                    contentPadding: widget.largeTouch
                        ? const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 14,
                          )
                        : null,
                  ),
                  onTap: () => widget.focusNode.requestFocus(),
                ),
                if (widget.leftBody != null) ...[
                  const SizedBox(height: 12),
                  ...widget.leftBody!,
                ],
                const SizedBox(height: 12),
                Expanded(
                  child: widget.quickBar ??
                      PosQuickCashBar(
                        controller: widget.controller,
                        onChanged: widget.onChanged,
                        largeTouch: widget.largeTouch,
                        layout: PosQuickCashLayout.grid,
                        columns: 2,
                        quickCashInitial: _quickCashInitial,
                        onQuickCashUsed: _markQuickCashUsed,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            flex: 5,
            child: PosAmountNumpad(
              controller: widget.controller,
              onChanged: widget.onChanged,
              showQuickCash: false,
              fillHeight: true,
              largeTouch: widget.largeTouch,
              quickCashInitial: _quickCashInitial,
              onQuickCashUsed: _markQuickCashUsed,
            ),
          ),
        ],
      ),
    );
  }
}

/// Compact side-by-side summary for total due and change.
class PosAmountSummaryRow extends StatelessWidget {
  const PosAmountSummaryRow({
    super.key,
    required this.totalLabel,
    required this.totalValue,
    required this.secondaryLabel,
    required this.secondaryValue,
    this.secondaryColor,
  });

  final String totalLabel;
  final String totalValue;
  final String secondaryLabel;
  final String secondaryValue;
  final Color? secondaryColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _tile(totalLabel, totalValue, PosColors.textPrimary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _tile(
            secondaryLabel,
            secondaryValue,
            secondaryColor ?? PosColors.primary,
          ),
        ),
      ],
    );
  }

  Widget _tile(String label, String value, Color valueColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: PosColors.textMuted.withValues(alpha: 0.9),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}
