import 'package:flutter/material.dart';

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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: PosColors.primaryLight.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: PosColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Grand total',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: PosColors.textMuted,
                  ),
                ),
                Text(
                  formatPosMoney(grandTotal),
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: PosColors.primary,
                    height: 1.1,
                  ),
                ),
              ],
            ),
          ),
          _chip(
            'Discount',
            discountAmount,
            PosColors.primary,
            onTap: onDiscountTap,
          ),
          const SizedBox(width: 8),
          _chip(
            'Coupon',
            couponAmount,
            PosColors.primaryDark,
            onTap: onCouponTap,
          ),
          if (returnCredit > 0 || onReturnCreditTap != null) ...[
            const SizedBox(width: 8),
            _chip(
              'Return',
              returnCredit,
              PosColors.primaryDark,
              onTap: onReturnCreditTap,
            ),
          ],
          if (showChange && change != null) ...[
            const SizedBox(width: 8),
            _chip('Change', change!, PosColors.primary),
          ],
        ],
      ),
    );
  }

  Widget _chip(
    String label,
    double value,
    Color color, {
    VoidCallback? onTap,
  }) {
    final child = Container(
      constraints: const BoxConstraints(minWidth: 88),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
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
