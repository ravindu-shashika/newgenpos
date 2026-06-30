import 'package:flutter/material.dart';

import '../../../core/theme/pos_app_styles.dart';
import '../../../core/theme/pos_theme.dart';
import '../pos_currency.dart';

/// Compact totals strip for the quick-billing modal header.
class PosCheckoutSummaryBar extends StatelessWidget {
  const PosCheckoutSummaryBar({
    super.key,
    required this.grandTotal,
    required this.discountAmount,
    required this.couponAmount,
    this.change,
    this.showChange = false,
    this.returnCredit = 0,
    this.onDiscountTap,
    this.onCouponTap,
    this.onReturnCreditTap,
  });

  final double grandTotal;
  final double discountAmount;
  final double couponAmount;
  final double? change;
  final bool showChange;
  final double returnCredit;
  final VoidCallback? onDiscountTap;
  final VoidCallback? onCouponTap;
  final VoidCallback? onReturnCreditTap;

  @override
  Widget build(BuildContext context) {
    final styles = context.posStyles;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: styles.isDark
            ? styles.brand.primary.withValues(alpha: 0.18)
            : styles.brand.primaryLight.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: styles.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Grand total', style: styles.caption),
                Text(
                  formatPosMoney(grandTotal),
                  style: styles.moneyLarge.copyWith(fontSize: 28),
                ),
              ],
            ),
          ),
          _chip(
            context,
            'Discount',
            discountAmount,
            styles.accent,
            onTap: onDiscountTap,
          ),
          SizedBox(width: 8),
          _chip(
            context,
            'Coupon',
            couponAmount,
            styles.accentStrong,
            onTap: onCouponTap,
          ),
          if (returnCredit > 0 || onReturnCreditTap != null) ...[
            SizedBox(width: 8),
            _chip(
              context,
              'Return',
              returnCredit,
              styles.accentStrong,
              onTap: onReturnCreditTap,
            ),
          ],
          if (showChange && change != null) ...[
            SizedBox(width: 8),
            _chip(context, 'Change', change!, styles.accent),
          ],
        ],
      ),
    );
  }

  Widget _chip(
    BuildContext context,
    String label,
    double value,
    Color color, {
    VoidCallback? onTap,
  }) {
    final child = Container(
      constraints: const BoxConstraints(minWidth: 88),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: context.posStyles.cardBg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 11, color: color),
          ),
          Text(
            formatPosMoney(value),
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );

    if (onTap == null) return child;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: child,
      ),
    );
  }
}
