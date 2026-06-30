import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/pos_theme.dart';
import '../pos_currency.dart';
import 'pos_amount_numpad.dart';

/// Payment modal width — wide layout for touch POS.
const kPosPaymentDialogWidth = 1160.0;

const kPosCashTabQuickAmounts = [20, 50, 100, 500, 1000, 2000, 5000];

class PaymentProcessingHeader extends StatelessWidget {
  const PaymentProcessingHeader({
    super.key,
    required this.invoiceLabel,
    required this.totalText,
    required this.onClose,
    this.busy = false,
  });

  final String invoiceLabel;
  final String totalText;
  final VoidCallback onClose;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final brand = context.posBrand;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 12, 12),
      decoration: BoxDecoration(
        color: s.isDark
            ? brand.primary.withValues(alpha: 0.18)
            : brand.primaryLight.withValues(alpha: 0.4),
        border: Border(bottom: BorderSide(color: s.border)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: brand.buttonPrimary,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.payments_outlined, size: 24, color: s.onBrand),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Payment', style: s.caption),
                Text(invoiceLabel, style: s.titleMedium),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'AMOUNT DUE',
                style: s.caption.copyWith(
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                ),
              ),
              Text(totalText, style: s.moneyLarge.copyWith(fontSize: 32)),
            ],
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: busy ? null : onClose,
            tooltip: 'Close (Esc)',
            iconSize: 26,
            icon: Icon(Icons.close_rounded, color: s.textMuted),
          ),
        ],
      ),
    );
  }
}

class PaymentMethodPillTabs extends StatelessWidget {
  const PaymentMethodPillTabs({
    super.key,
    required this.labels,
    required this.icons,
    required this.selectedIndex,
    required this.onChanged,
  });

  final List<String> labels;
  final List<IconData> icons;
  final int selectedIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: [
          for (var i = 0; i < labels.length; i++) ...[
            if (i > 0) const SizedBox(width: 10),
            Expanded(
              child: _PaymentTouchTab(
                label: labels[i],
                icon: icons[i],
                selected: i == selectedIndex,
                onTap: () {
                  HapticFeedback.selectionClick();
                  onChanged(i);
                },
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PaymentTouchTab extends StatelessWidget {
  const _PaymentTouchTab({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final fg = selected ? s.accent : s.textMuted;

    return Material(
      color: selected ? s.accent.withValues(alpha: 0.12) : s.cardBg,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: selected ? s.accent : s.border,
          width: selected ? 2 : 1,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: SizedBox(
          height: 64,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 22, color: fg),
              const SizedBox(height: 4),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: fg,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class PaymentAmountBanner extends StatelessWidget {
  const PaymentAmountBanner({
    super.key,
    this.label = 'TOTAL',
    required this.amountText,
  });

  final String label;
  final String amountText;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      decoration: s.cardDecoration(),
      child: Row(
        children: [
          Text(
            label,
            style: s.caption.copyWith(
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
            ),
          ),
          const Spacer(),
          Text(
            amountText,
            style: s.moneyLarge.copyWith(fontSize: 30, color: s.text),
          ),
        ],
      ),
    );
  }
}

class PaymentCashLiveSummary extends StatelessWidget {
  const PaymentCashLiveSummary({
    super.key,
    required this.tenderedText,
    required this.changeText,
    required this.isReady,
  });

  final String tenderedText;
  final String changeText;
  final bool isReady;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Row(
      children: [
        Expanded(
          child: _CashStatBox(
            label: 'RECEIVED',
            value: tenderedText,
            icon: Icons.account_balance_wallet_outlined,
            accent: s.accent,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _CashStatBox(
            label: 'CHANGE',
            value: changeText,
            icon: Icons.currency_exchange_rounded,
            accent: isReady ? s.success : s.danger,
            highlight: isReady,
          ),
        ),
      ],
    );
  }
}

class _CashStatBox extends StatelessWidget {
  const _CashStatBox({
    required this.label,
    required this.value,
    required this.icon,
    required this.accent,
    this.highlight = false,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color accent;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: highlight ? accent.withValues(alpha: 0.12) : s.cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: highlight ? accent.withValues(alpha: 0.5) : s.border,
          width: highlight ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: accent),
              const SizedBox(width: 6),
              Text(
                label,
                style: s.caption.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.6,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: highlight ? accent : s.text,
            ),
          ),
        ],
      ),
    );
  }
}

class PaymentCashQuickActions extends StatelessWidget {
  const PaymentCashQuickActions({
    super.key,
    required this.onExactAmount,
    required this.onClear,
    required this.exactAmountText,
  });

  final VoidCallback onExactAmount;
  final VoidCallback onClear;
  final String exactAmountText;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final brand = context.posBrand;
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: FilledButton.icon(
            onPressed: onExactAmount,
            icon: Icon(Icons.done_all_rounded, size: 22, color: s.onBrand),
            label: Text(
              'Exact — $exactAmountText',
              style: TextStyle(color: s.onBrand, fontWeight: FontWeight.w800),
            ),
            style: FilledButton.styleFrom(
              minimumSize: const Size(0, 52),
              backgroundColor: brand.buttonPrimary,
              foregroundColor: s.onBrand,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: OutlinedButton(
            onPressed: onClear,
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(0, 52),
              foregroundColor: s.danger,
              side: BorderSide(color: s.danger.withValues(alpha: 0.45)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: Text(
              'Clear',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                color: s.danger,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class PaymentQuickCashGrid extends StatelessWidget {
  const PaymentQuickCashGrid({
    super.key,
    required this.onAmount,
    required this.onBackspace,
  });

  final ValueChanged<double> onAmount;
  final VoidCallback onBackspace;

  @override
  Widget build(BuildContext context) {
    const columns = 4;
    final items = <({String label, VoidCallback onTap, bool danger})>[
      for (final amount in kPosCashTabQuickAmounts)
        (
          label: amount.toString(),
          onTap: () => onAmount(amount.toDouble()),
          danger: false,
        ),
      (label: '⌫', onTap: onBackspace, danger: true),
    ];

    final rows = (items.length / columns).ceil();
    final s = context.posStyles;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'QUICK CASH',
          style: s.caption.copyWith(
            fontWeight: FontWeight.w800,
            letterSpacing: 0.7,
          ),
        ),
        const SizedBox(height: 8),
        for (var r = 0; r < rows; r++) ...[
          if (r > 0) const SizedBox(height: 8),
          Row(
            children: [
              for (var c = 0; c < columns; c++) ...[
                if (c > 0) const SizedBox(width: 8),
                Expanded(
                  child: _quickCell(
                    context,
                    index: r * columns + c,
                    items: items,
                  ),
                ),
              ],
            ],
          ),
        ],
      ],
    );
  }

  Widget _quickCell(
    BuildContext context, {
    required int index,
    required List<({String label, VoidCallback onTap, bool danger})> items,
  }) {
    if (index >= items.length) {
      return const SizedBox(height: 52);
    }
    final item = items[index];
    final s = context.posStyles;
    return Material(
      color: item.danger
          ? s.danger.withValues(alpha: 0.1)
          : s.cardBg,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          item.onTap();
        },
        borderRadius: BorderRadius.circular(10),
        child: Container(
          height: 52,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: item.danger
                  ? s.danger.withValues(alpha: 0.4)
                  : s.border,
            ),
          ),
          child: Text(
            item.label,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: item.danger ? s.danger : s.text,
            ),
          ),
        ),
      ),
    );
  }
}

class PaymentCashReceivedField extends StatelessWidget {
  const PaymentCashReceivedField({
    super.key,
    required this.controller,
    required this.onTap,
    required this.active,
  });

  final TextEditingController controller;
  final VoidCallback onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final accent = s.accent;

    return Material(
      color: active ? accent.withValues(alpha: 0.08) : s.cardBg,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: active ? accent : s.border,
              width: active ? 2.5 : 1,
            ),
          ),
          child: Row(
            children: [
              Icon(
                Icons.account_balance_wallet_outlined,
                size: 22,
                color: active ? accent : s.textMuted,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'CASH RECEIVED',
                      style: s.caption.copyWith(
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.6,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      controller.text.isEmpty ? '0' : controller.text,
                      style: s.moneyLarge.copyWith(fontSize: 28, color: s.text),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Min touch height for bill-adjustment rows on payment modal.
const kPaymentAdjustmentRowHeight = 54.0;

class PaymentBillAdjustments extends StatelessWidget {
  const PaymentBillAdjustments({
    super.key,
    required this.discountAmountText,
    required this.onDiscountTap,
    required this.onCouponTap,
    this.couponCode,
    this.couponDiscountText,
    this.onReturnCreditTap,
  });

  final String discountAmountText;
  final VoidCallback onDiscountTap;
  final VoidCallback onCouponTap;
  final String? couponCode;
  final String? couponDiscountText;
  final VoidCallback? onReturnCreditTap;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final hasCoupon = couponCode != null && couponCode!.isNotEmpty;

    Widget adjustmentRow({
      required IconData icon,
      required String label,
      required String value,
      required VoidCallback onTap,
      bool valueAccent = true,
    }) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: SizedBox(
            height: kPaymentAdjustmentRowHeight,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: s.accent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(icon, size: 20, color: s.accent),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      label,
                      style: s.titleMedium.copyWith(fontSize: 15),
                    ),
                  ),
                  Flexible(
                    child: Text(
                      value,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.end,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: valueAccent ? s.accent : s.textMuted,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(Icons.chevron_right_rounded, size: 22, color: s.textMuted),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
      decoration: BoxDecoration(
        color: s.cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: s.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Bill Adjustments',
            style: s.caption.copyWith(
              fontWeight: FontWeight.w800,
              letterSpacing: 0.6,
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 8),
          adjustmentRow(
            icon: Icons.discount_outlined,
            label: 'Order discount',
            value: discountAmountText,
            onTap: onDiscountTap,
          ),
          Divider(height: 1, color: s.border),
          adjustmentRow(
            icon: Icons.confirmation_number_outlined,
            label: 'Coupon',
            value: hasCoupon
                ? '$couponCode${couponDiscountText != null ? ' ($couponDiscountText)' : ''}'
                : 'Tap to apply',
            onTap: onCouponTap,
            valueAccent: hasCoupon,
          ),
          if (onReturnCreditTap != null) ...[
            Divider(height: 1, color: s.border),
            adjustmentRow(
              icon: Icons.receipt_long_outlined,
              label: 'Return bill',
              value: 'Apply credit',
              onTap: onReturnCreditTap!,
              valueAccent: false,
            ),
          ],
        ],
      ),
    );
  }
}

class PaymentKeypadColumn extends StatelessWidget {
  const PaymentKeypadColumn({
    super.key,
    required this.controller,
    required this.onChanged,
    this.allowDecimal = true,
    this.maxLength,
    this.clearButtonLabel = 'Clear',
  });

  final TextEditingController controller;
  final VoidCallback onChanged;
  final bool allowDecimal;
  final int? maxLength;
  final String clearButtonLabel;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
      decoration: BoxDecoration(
        color: s.inputFill.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: s.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'KEYPAD',
            textAlign: TextAlign.center,
            style: s.caption.copyWith(
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
              fontSize: 10,
            ),
          ),
          const SizedBox(height: 6),
          Expanded(
            child: PosPaymentNumpad(
              controller: controller,
              onChanged: onChanged,
              allowDecimal: allowDecimal,
              maxLength: maxLength,
              clearButtonLabel: clearButtonLabel,
            ),
          ),
        ],
      ),
    );
  }
}

class PaymentFooterBar extends StatelessWidget {
  const PaymentFooterBar({
    super.key,
    required this.showPrintOption,
    required this.printInvoice,
    required this.onPrintChanged,
    required this.canComplete,
    required this.busy,
    required this.onComplete,
    this.completeLabel = 'COMPLETE SALE',
    this.statusHint,
  });

  final bool showPrintOption;
  final bool printInvoice;
  final ValueChanged<bool>? onPrintChanged;
  final bool canComplete;
  final bool busy;
  final VoidCallback onComplete;
  final String completeLabel;
  final String? statusHint;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final brand = context.posBrand;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      decoration: BoxDecoration(
        color: s.cardBg,
        border: Border(top: BorderSide(color: s.border)),
      ),
      child: Row(
        children: [
          if (showPrintOption)
            InkWell(
              onTap: busy
                  ? null
                  : () => onPrintChanged?.call(!printInvoice),
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Checkbox(
                      value: printInvoice,
                      onChanged: busy
                          ? null
                          : (v) => onPrintChanged?.call(v ?? false),
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      visualDensity: VisualDensity.compact,
                      activeColor: s.accent,
                    ),
                    Text(
                      'Print Bill',
                      style: s.body.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
          if (!canComplete && statusHint != null)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  statusHint!,
                  style: s.body.copyWith(
                    fontWeight: FontWeight.w600,
                    color: s.danger,
                  ),
                ),
              ),
            )
          else
            const Spacer(),
          SizedBox(
            width: 480,
            child: FilledButton(
              onPressed: busy || !canComplete ? null : onComplete,
              style: FilledButton.styleFrom(
                minimumSize: const Size(double.infinity, 58),
                backgroundColor: canComplete ? brand.buttonPrimary : null,
                foregroundColor: s.onBrand,
                disabledForegroundColor: s.textMuted,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (busy)
                    SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: s.onBrand,
                      ),
                    )
                  else
                    Icon(Icons.check_circle_rounded, size: 24, color: s.onBrand),
                  const SizedBox(width: 10),
                  Text(
                    busy ? 'Processing…' : completeLabel,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.4,
                      color: s.onBrand,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class PaymentCardDetailsFields extends StatelessWidget {
  const PaymentCardDetailsFields({
    super.key,
    required this.cardType,
    required this.onCardTypeChanged,
    required this.digitsController,
    required this.onDigitsTap,
    required this.digitsActive,
  });

  final String cardType;
  final ValueChanged<String> onCardTypeChanged;
  final TextEditingController digitsController;
  final VoidCallback onDigitsTap;
  final bool digitsActive;

  static const _cardTypes = ['Visa', 'Master Card', 'Amex'];

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final accent = s.accent;
    final digits = digitsController.text.trim();
    final masked = digits.isEmpty
        ? '• • • •'
        : digits.padRight(4, '•').split('').join(' ');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'CARD TYPE',
          style: s.caption.copyWith(
            fontWeight: FontWeight.w800,
            letterSpacing: 0.6,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            for (final type in _cardTypes) ...[
              Expanded(
                child: _CardChip(
                  label: type == 'Master Card' ? 'MC' : type,
                  selected: cardType == type,
                  onTap: () => onCardTypeChanged(type),
                ),
              ),
              if (type != _cardTypes.last) const SizedBox(width: 8),
            ],
          ],
        ),
        const SizedBox(height: 16),
        Text(
          'LAST 4 DIGITS — TAP TO ENTER',
          style: s.caption.copyWith(
            fontWeight: FontWeight.w800,
            letterSpacing: 0.6,
          ),
        ),
        const SizedBox(height: 8),
        Material(
          color: digitsActive ? accent.withValues(alpha: 0.08) : s.cardBg,
          borderRadius: BorderRadius.circular(12),
          child: InkWell(
            onTap: onDigitsTap,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              height: 64,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: digitsActive ? accent : s.border,
                  width: digitsActive ? 2.5 : 1,
                ),
              ),
              child: Text(
                masked,
                style: s.moneyLarge.copyWith(
                  fontSize: 32,
                  letterSpacing: 10,
                  color: s.text,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _CardChip extends StatelessWidget {
  const _CardChip({
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
    final accent = s.accent;
    return Material(
      color: selected ? accent.withValues(alpha: 0.14) : s.cardBg,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          height: 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: selected ? accent : s.border,
              width: selected ? 2 : 1,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: selected ? accent : s.text,
            ),
          ),
        ),
      ),
    );
  }
}

class PaymentReadyBanner extends StatelessWidget {
  const PaymentReadyBanner({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: s.success.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: s.success.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Icon(Icons.verified_rounded, size: 22, color: s.success),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: s.body.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class PaymentAmountAdjustmentsRow extends StatelessWidget {
  const PaymentAmountAdjustmentsRow({
    super.key,
    required this.amountText,
    required this.discountAmountText,
    required this.onDiscountTap,
    required this.onCouponTap,
    this.couponCode,
    this.couponDiscountText,
    this.onReturnCreditTap,
  });

  final String amountText;
  final String discountAmountText;
  final VoidCallback onDiscountTap;
  final VoidCallback onCouponTap;
  final String? couponCode;
  final String? couponDiscountText;
  final VoidCallback? onReturnCreditTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 3,
          child: PaymentAmountBanner(
            label: 'TO CHARGE',
            amountText: amountText,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: PaymentBillAdjustments(
            discountAmountText: discountAmountText,
            onDiscountTap: onDiscountTap,
            onCouponTap: onCouponTap,
            couponCode: couponCode,
            couponDiscountText: couponDiscountText,
            onReturnCreditTap: onReturnCreditTap,
          ),
        ),
      ],
    );
  }
}

/// @deprecated Use [PaymentQuickCashGrid].
class PaymentQuickCashStrip extends PaymentQuickCashGrid {
  const PaymentQuickCashStrip({
    super.key,
    required super.onAmount,
    required super.onBackspace,
  });
}
