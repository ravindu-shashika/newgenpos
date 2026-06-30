import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import '../pos_currency.dart';
import 'pos_amount_numpad.dart';
import 'pos_inline_text_pad.dart';

class DiscountEntryPanel extends StatelessWidget {
  const DiscountEntryPanel({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.subtotal,
    required this.displaySubtotal,
    required this.discountType,
    required this.onTypeChanged,
    required this.onChanged,
    this.panelHeight = 420,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final double subtotal;
  final double displaySubtotal;
  final String discountType;
  final ValueChanged<String> onTypeChanged;
  final VoidCallback onChanged;
  final double panelHeight;

  bool get _isPercent => discountType == 'Percentage';

  double get _value => double.tryParse(controller.text.trim()) ?? 0;

  double get _discountAmount =>
      _isPercent ? subtotal * (_value / 100) : _value;

  double get _newTotal => (displaySubtotal - _discountAmount)
      .clamp(0.0, double.infinity)
      .toDouble();

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return SizedBox(
      height: panelHeight,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            flex: 11,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _DiscountTypeButton(
                        label: '% Percent',
                        selected: _isPercent,
                        onTap: () {
                          onTypeChanged('Percentage');
                          controller.text = '0';
                          onChanged();
                        },
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: _DiscountTypeButton(
                        label: 'Rs. Flat Rate',
                        selected: !_isPercent,
                        onTap: () {
                          onTypeChanged('Flat');
                          controller.text = '0';
                          onChanged();
                        },
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 16),
                Container(
                  height: 88,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: s.inputFill,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: s.border),
                  ),
                  child: Text(
                    _isPercent
                        ? '${_formatDisplay(_value)} %'
                        : formatPosMoney(_value),
                    style: TextStyle(
                      fontSize: 40,
                      fontWeight: FontWeight.w800,
                      color: s.text,
                      height: 1,
                    ),
                  ),
                ),
                SizedBox(height: 16),
                Expanded(
                  child: PosAmountNumpad(
                    controller: controller,
                    onChanged: onChanged,
                    showQuickCash: false,
                    fillHeight: true,
                    largeTouch: true,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: 28),
          Expanded(
            flex: 9,
            child: OrderAdjustmentPanel(
              currentSubtotal: displaySubtotal,
              appliedDiscount: _discountAmount,
              newTotal: _newTotal,
              promoMessage: _discountAmount > 0
                  ? '${_isPercent ? '${_formatDisplay(_value)}%' : formatPosMoney(_value)} discount applied'
                  : 'No discount applied',
              promoApplied: _discountAmount > 0,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDisplay(double v) {
    if (v == 0) return '0';
    return v % 1 == 0 ? v.toStringAsFixed(0) : v.toStringAsFixed(2);
  }
}

class CouponEntryPanel extends StatelessWidget {
  const CouponEntryPanel({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.grandTotalBeforeCoupon,
    required this.quickCodes,
    required this.errorText,
    required this.onChanged,
    required this.onSelectCode,
    this.panelHeight = 420,
    this.previewDiscount = 0,
    this.previewCode,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final double grandTotalBeforeCoupon;
  final List<String> quickCodes;
  final String? errorText;
  final VoidCallback onChanged;
  final ValueChanged<String> onSelectCode;
  final double panelHeight;
  final double previewDiscount;
  final String? previewCode;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final newTotal = (grandTotalBeforeCoupon - previewDiscount)
        .clamp(0.0, double.infinity)
        .toDouble();

    return SizedBox(
      height: panelHeight,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            flex: 11,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Enter coupon code',
                  style: s.caption.copyWith(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: 8),
                Container(
                  height: 72,
                  alignment: Alignment.center,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: s.inputFill,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: errorText != null ? s.danger : s.border,
                    ),
                  ),
                  child: Text(
                    controller.text.isEmpty ? 'COUPON' : controller.text,
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.4,
                      color: controller.text.isEmpty
                          ? s.textMuted.withValues(alpha: 0.55)
                          : s.text,
                    ),
                  ),
                ),
                if (errorText != null) ...[
                  SizedBox(height: 6),
                  Text(
                    errorText!,
                    style: TextStyle(color: s.danger, fontSize: 12),
                  ),
                ],
                if (quickCodes.isNotEmpty) ...[
                  SizedBox(height: 12),
                  Text(
                    'Quick select',
                    style: s.caption.copyWith(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final code in quickCodes)
                        ActionChip(
                          label: Text(
                            code,
                            style: TextStyle(
                              color: s.text,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          onPressed: () => onSelectCode(code),
                          backgroundColor: s.inputFill,
                          side: BorderSide(color: s.border),
                        ),
                    ],
                  ),
                ],
                SizedBox(height: 12),
                Expanded(
                  child: PosInlineTextPad(
                    controller: controller,
                    onChanged: onChanged,
                    fillHeight: true,
                    largeTouch: true,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: 28),
          Expanded(
            flex: 9,
            child: OrderAdjustmentPanel(
              currentSubtotal: grandTotalBeforeCoupon,
              appliedDiscount: previewDiscount,
              newTotal: newTotal,
              promoMessage: previewDiscount > 0
                  ? 'Coupon ${previewCode ?? controller.text.trim()} applied'
                  : 'No coupon applied',
              promoApplied: previewDiscount > 0,
            ),
          ),
        ],
      ),
    );
  }
}

class OrderAdjustmentPanel extends StatelessWidget {
  const OrderAdjustmentPanel({
    super.key,
    required this.currentSubtotal,
    required this.appliedDiscount,
    required this.newTotal,
    required this.promoMessage,
    required this.promoApplied,
  });

  final double currentSubtotal;
  final double appliedDiscount;
  final double newTotal;
  final String promoMessage;
  final bool promoApplied;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Order Adjustment',
          style: s.titleMedium.copyWith(fontSize: 18),
        ),
        SizedBox(height: 20),
        _SummaryRow(
          label: 'Current Subtotal',
          value: currentSubtotal,
        ),
        SizedBox(height: 14),
        _SummaryRow(
          label: 'Applied Discount',
          value: -appliedDiscount,
          valueColor: s.accent,
          labelColor: s.accent,
        ),
        SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: s.inputFill,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: s.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'PROMO APPLIED',
                style: s.caption.copyWith(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                ),
              ),
              SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    promoApplied ? Icons.check_circle : Icons.info_outline,
                    size: 18,
                    color: s.accent,
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      promoMessage,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: s.accent,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const Spacer(),
        Container(height: 3, color: s.accent),
        SizedBox(height: 18),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Text(
                'New Total',
                style: s.titleMedium.copyWith(fontSize: 22),
              ),
            ),
            Text(
              formatPosMoney(newTotal),
              style: TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.w800,
                color: s.accent,
                height: 1,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.labelColor,
    this.valueColor,
  });

  final String label;
  final double value;
  final Color? labelColor;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Row(
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: labelColor ?? s.textMuted,
          ),
        ),
        const Spacer(),
        Text(
          formatPosMoney(value),
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: valueColor ?? s.text,
          ),
        ),
      ],
    );
  }
}

class _DiscountTypeButton extends StatelessWidget {
  const _DiscountTypeButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Material(
      color: selected ? s.accent.withValues(alpha: 0.12) : s.secondaryBtnBg,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          height: 72,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? s.accent : s.border,
              width: selected ? 2 : 1,
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: selected ? s.accent : s.textMuted,
            ),
          ),
        ),
      ),
    );
  }
}
