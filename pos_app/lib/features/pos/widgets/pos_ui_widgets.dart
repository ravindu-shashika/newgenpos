import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/app_providers.dart';
import '../../../core/theme/pos_theme.dart';
import '../pos_currency.dart';
import '../models/scanned_product.dart';
import '../pos_product_image.dart';

class PosFilterButton extends StatelessWidget {
  const PosFilterButton({
    super.key,
    required this.label,
    required this.color,
    required this.onTap,
    this.active = false,
    this.compact = false,
  });

  final String label;
  final Color color;
  final VoidCallback onTap;
  final bool active;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    if (compact) {
      return PosFilterChip(
        label: label,
        active: active,
        onTap: onTap,
      );
    }

    return Expanded(
      child: Material(
        color: active ? color : color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            height: 44,
            alignment: Alignment.center,
            child: Text(
              label,
              style: TextStyle(
                color: active ? Colors.white : color,
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Gradient catalog filter chip — Category / Brand / Featured toolbar.
class PosQuickFilterChip extends StatelessWidget {
  const PosQuickFilterChip({
    super.key,
    required this.label,
    required this.colors,
    required this.onTap,
    this.active = false,
  });

  final String label;
  final List<Color> colors;
  final VoidCallback onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final gradient = colors.length >= 2
        ? colors
        : [colors.first, colors.first.withValues(alpha: 0.85)];

    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Ink(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              gradient: LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: active
                    ? gradient
                    : gradient
                        .map((c) => c.withValues(alpha: 0.72))
                        .toList(growable: false),
              ),
              boxShadow: active
                  ? [
                      BoxShadow(
                        color: gradient.last.withValues(alpha: 0.35),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : null,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Rounded category chip (terminal mockup).
class PosFilterChip extends StatelessWidget {
  const PosFilterChip({
    super.key,
    required this.label,
    required this.onTap,
    this.active = false,
  });

  final String label;
  final VoidCallback onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.zero,
          child: Ink(
            decoration: BoxDecoration(
              color: active ? PosColors.primary : PosColors.chipInactive,
              borderRadius: BorderRadius.zero,
              border: active
                  ? null
                  : Border.all(color: PosColors.chipInactive),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: active ? Colors.white : PosColors.chipInactiveText,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class PosProductCard extends ConsumerWidget {
  const PosProductCard({
    super.key,
    required this.product,
    required this.onTap,
  });

  final ScannedProduct product;
  final VoidCallback onTap;

  String get _qtyLabel {
    final q = product.warehouseQty;
    if (q == q.roundToDouble()) {
      return q.toInt().toString();
    }
    return q.toStringAsFixed(2);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final brand = context.posBrand;
    final code = product.code.trim();
    final posBaseUrl = ref.watch(sessionServiceProvider).posBaseUrl;
    final imageUrl =
        resolveProductImageUrl(product.image, posBaseUrl: posBaseUrl);

    return Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(kPosButtonRadius),
        side: const BorderSide(color: PosColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              _ProductThumb(
                imageUrl: imageUrl,
                iconColor: brand.primary,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      product.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: PosColors.textPrimary,
                        height: 1.15,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            code.isEmpty ? '—' : '[$code]',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                              color: PosColors.textMuted,
                            ),
                          ),
                        ),
                        Text(
                          'Qty: $_qtyLabel',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: brand.primary,
                          ),
                        ),
                      ],
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

class _ProductThumb extends StatelessWidget {
  const _ProductThumb({
    required this.imageUrl,
    required this.iconColor,
  });

  final String? imageUrl;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: PosColors.productIconBg,
        borderRadius: BorderRadius.circular(kPosButtonRadius),
        border: Border.all(color: PosColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: imageUrl != null
          ? Image.network(
              imageUrl!,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _fallback(),
            )
          : _fallback(),
    );
  }

  Widget _fallback() {
    return Center(
      child: Icon(
        Icons.inventory_2_outlined,
        size: 20,
        color: iconColor.withValues(alpha: 0.55),
      ),
    );
  }
}

class PosGrandTotalBanner extends StatelessWidget {
  const PosGrandTotalBanner({
    super.key,
    required this.total,
    this.taxLabel,
    this.taxAmount,
    this.subtotal,
  });

  final double total;
  final String? taxLabel;
  final double? taxAmount;
  final double? subtotal;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (subtotal != null) ...[
          _summaryRow('Subtotal', subtotal!),
          const SizedBox(height: 6),
        ],
        if (taxLabel != null && taxAmount != null) ...[
          _summaryRow(taxLabel!, taxAmount!),
          const SizedBox(height: 10),
        ],
        Row(
          children: [
            const Text(
              'Total',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: PosColors.textMuted,
              ),
            ),
            const Spacer(),
            Flexible(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerRight,
                child: Text(
                  formatPosMoney(total),
                  maxLines: 1,
                  softWrap: false,
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    color: PosColors.primary,
                    height: 1,
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _summaryRow(String label, double amount) {
    return Row(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: PosColors.textMuted,
          ),
        ),
        const Spacer(),
        Text(
          formatPosMoney(amount),
          maxLines: 1,
          softWrap: false,
          overflow: TextOverflow.fade,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: PosColors.textPrimary,
          ),
        ),
      ],
    );
  }
}

class PosPaymentButton extends StatelessWidget {
  const PosPaymentButton({
    super.key,
    required this.label,
    required this.color,
    required this.onPressed,
    this.icon,
    this.disabled = false,
    this.expandWidth = false,
  });

  final String label;
  final Color color;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool disabled;
  final bool expandWidth;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: disabled ? color.withValues(alpha: 0.35) : color,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: disabled ? null : onPressed,
        borderRadius: BorderRadius.circular(8),
        child: SizedBox(
          height: 40,
          width: expandWidth ? double.infinity : null,
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: icon == null ? 16 : 12),
            child: Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                if (icon != null) ...[
                  Icon(icon, size: 18, color: Colors.white),
                  const SizedBox(width: 6),
                ],
                Text(
                  label,
                  maxLines: 1,
                  softWrap: false,
                  overflow: TextOverflow.clip,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    height: 1.1,
                  ),
                ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class PosOrderEmptyState extends StatelessWidget {
  const PosOrderEmptyState({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.shopping_basket_outlined,
            size: 56,
            color: PosColors.textMuted.withValues(alpha: 0.35),
          ),
          const SizedBox(height: 12),
          Text(
            'Order is empty',
            style: TextStyle(
              fontSize: 15,
              color: PosColors.textMuted.withValues(alpha: 0.8),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class PosPayButton extends StatelessWidget {
  const PosPayButton({
    super.key,
    required this.onPressed,
    this.disabled = false,
  });

  final VoidCallback? onPressed;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: Material(
        color: disabled
            ? PosColors.primary.withValues(alpha: 0.4)
            : PosColors.primary,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: disabled ? null : onPressed,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Text(
              'PAY',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white.withValues(alpha: disabled ? 0.7 : 1),
                fontSize: 22,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Quantity stepper for cart lines.
class PosQtyStepper extends StatelessWidget {
  const PosQtyStepper({
    super.key,
    required this.qty,
    required this.onDecrement,
    required this.onIncrement,
    this.enabled = true,
  });

  final double qty;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: PosColors.primaryLight,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: PosColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _stepBtn(Icons.remove, onDecrement),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              qty.toStringAsFixed(qty == qty.roundToDouble() ? 0 : 2),
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: PosColors.primary,
              ),
            ),
          ),
          _stepBtn(Icons.add, onIncrement),
        ],
      ),
    );
  }

  Widget _stepBtn(IconData icon, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(22),
        child: SizedBox(
          width: 40,
          height: 40,
          child: Icon(icon, size: 24, color: PosColors.primary),
        ),
      ),
    );
  }
}

/// Cart line card — mockup style with icon, qty stepper, line total.
class PosCartLineCard extends StatelessWidget {
  const PosCartLineCard({
    super.key,
    required this.name,
    required this.unitPrice,
    required this.qty,
    required this.lineTotal,
    required this.onDecrement,
    required this.onIncrement,
    this.onEdit,
    this.enabled = true,
  });

  final String name;
  final double unitPrice;
  final double qty;
  final double lineTotal;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;
  final VoidCallback? onEdit;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final qtyLabel =
        qty.toStringAsFixed(qty == qty.roundToDouble() ? 0 : 2);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: PosColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: PosColors.productIconBg,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              Icons.shopping_bag_outlined,
              size: 20,
              color: PosColors.primary.withValues(alpha: 0.7),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: enabled ? onEdit : null,
                          borderRadius: BorderRadius.circular(kPosButtonRadius),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 2),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    name,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                      color: onEdit != null
                                          ? PosColors.primary
                                          : PosColors.textPrimary,
                                      height: 1.25,
                                      decoration: onEdit != null
                                          ? TextDecoration.underline
                                          : null,
                                      decorationColor: PosColors.primary
                                          .withValues(alpha: 0.35),
                                    ),
                                  ),
                                ),
                                if (onEdit != null) ...[
                                  const SizedBox(width: 6),
                                  Icon(
                                    Icons.edit_outlined,
                                    size: 16,
                                    color: PosColors.primary
                                        .withValues(alpha: 0.85),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _CartMoneyText(
                      amount: lineTotal,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                        color: PosColors.textPrimary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${formatPosMoney(unitPrice)} × $qtyLabel',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: PosColors.textMuted,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    PosQtyStepper(
                      qty: qty,
                      onDecrement: onDecrement,
                      onIncrement: onIncrement,
                      enabled: enabled,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Keeps currency values on one line; scales down on narrow panels.
class _CartMoneyText extends StatelessWidget {
  const _CartMoneyText({
    required this.amount,
    required this.style,
  });

  final double amount;
  final TextStyle style;

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 132),
      child: FittedBox(
        fit: BoxFit.scaleDown,
        alignment: Alignment.centerRight,
        child: Text(
          formatPosMoney(amount),
          maxLines: 1,
          softWrap: false,
          textAlign: TextAlign.right,
          style: style,
        ),
      ),
    );
  }
}

class PosCartTableHeader extends StatelessWidget {
  const PosCartTableHeader({super.key});

  @override
  Widget build(BuildContext context) {
    const style = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w700,
      color: PosColors.textMuted,
      letterSpacing: 0.3,
    );
    return Container(
      color: PosColors.pageBg,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: const Row(
        children: [
          Expanded(flex: 4, child: Text('Product', style: style)),
          Expanded(flex: 2, child: Text('Price', style: style)),
          Expanded(flex: 2, child: Text('Quantity', style: style)),
          Expanded(
              flex: 2,
              child:
                  Text('SubTotal', style: style, textAlign: TextAlign.right)),
          SizedBox(width: 36),
        ],
      ),
    );
  }
}
