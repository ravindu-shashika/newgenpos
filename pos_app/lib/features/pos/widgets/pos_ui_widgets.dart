import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/app_providers.dart';
import '../../../core/theme/pos_theme.dart';
import '../../../core/theme/pos_app_styles.dart';
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
              style: context.posStyles.chipOnGradient,
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
    final styles = context.posStyles;
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.zero,
          child: Ink(
            decoration: BoxDecoration(
              color: active ? styles.brand.primary : styles.brand.chipInactive,
              borderRadius: BorderRadius.zero,
              border: active
                  ? null
                  : Border.all(color: styles.border),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: active ? styles.onBrand : styles.text,
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
    final styles = context.posStyles;
    final code = product.code.trim();
    final posBaseUrl = ref.watch(sessionServiceProvider).posBaseUrl;
    final imageUrl =
        resolveProductImageUrl(product.image, posBaseUrl: posBaseUrl);
    final inStock = product.warehouseQty > 0;
    final lowStock = inStock && product.warehouseQty <= 5;

    return Material(
      color: styles.cardBg,
      elevation: styles.isDark ? 0 : 1,
      shadowColor: styles.shadowColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: styles.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              flex: 11,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _ProductThumb(
                    imageUrl: imageUrl,
                    iconColor: styles.accent,
                    large: true,
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: _StockBadge(
                      qtyLabel: _qtyLabel,
                      inStock: inStock,
                      lowStock: lowStock,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: styles.productName,
                  ),
                  if (code.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Text(code, maxLines: 1, overflow: TextOverflow.ellipsis, style: styles.productCode),
                  ],
                  const SizedBox(height: 6),
                  Text(
                    formatPosMoney(product.price),
                    style: styles.productPrice,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StockBadge extends StatelessWidget {
  const _StockBadge({
    required this.qtyLabel,
    required this.inStock,
    required this.lowStock,
  });

  final String qtyLabel;
  final bool inStock;
  final bool lowStock;

  @override
  Widget build(BuildContext context) {
    final styles = context.posStyles;
    final Color bg;
    final Color fg;
    if (!inStock) {
      bg = styles.danger.withValues(alpha: 0.18);
      fg = styles.danger;
    } else if (lowStock) {
      bg = PosColors.orange.withValues(alpha: 0.2);
      fg = styles.isDark ? const Color(0xFFFCD34D) : PosColors.orange;
    } else {
      bg = styles.success.withValues(alpha: 0.18);
      fg = styles.success;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: fg.withValues(alpha: 0.35)),
      ),
      child: Text(
        inStock ? 'Qty $qtyLabel' : 'Out',
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w800,
          color: fg,
        ),
      ),
    );
  }
}

class _ProductThumb extends StatelessWidget {
  const _ProductThumb({
    required this.imageUrl,
    required this.iconColor,
    this.large = false,
  });

  final String? imageUrl;
  final Color iconColor;
  final bool large;

  @override
  Widget build(BuildContext context) {
    final styles = context.posStyles;
    return Container(
      width: large ? double.infinity : 44,
      height: large ? double.infinity : 44,
      decoration: BoxDecoration(
        color: styles.surface.productIconBg,
        border: large ? null : Border.all(color: styles.border),
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
        size: large ? 36 : 20,
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
    final styles = context.posStyles;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (subtotal != null) ...[
          _summaryRow(context, 'Subtotal', subtotal!),
          SizedBox(height: 6),
        ],
        if (taxLabel != null && taxAmount != null) ...[
          _summaryRow(context, taxLabel!, taxAmount!),
          SizedBox(height: 10),
        ],
        Row(
          children: [
            Text('Total', style: styles.bodyMuted.copyWith(fontWeight: FontWeight.w600)),
            const Spacer(),
            Flexible(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerRight,
                child: Text(
                  formatPosMoney(total),
                  maxLines: 1,
                  softWrap: false,
                  style: styles.moneyLarge,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _summaryRow(BuildContext context, String label, double amount) {
    final styles = context.posStyles;
    return Row(
      children: [
        Text(label, style: styles.bodyMuted),
        const Spacer(),
        Text(
          formatPosMoney(amount),
          maxLines: 1,
          softWrap: false,
          overflow: TextOverflow.fade,
          style: styles.moneyMedium,
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
    final styles = context.posStyles;
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
                  Icon(icon, size: 18, color: styles.onBrand),
                  SizedBox(width: 6),
                ],
                Text(
                  label,
                  maxLines: 1,
                  softWrap: false,
                  overflow: TextOverflow.clip,
                  style: styles.buttonLabel,
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
    final styles = context.posStyles;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.shopping_basket_outlined,
            size: 56,
            color: styles.textMuted.withValues(alpha: 0.35),
          ),
          SizedBox(height: 12),
          Text(
            'Order is empty',
            style: styles.bodyMuted.copyWith(fontWeight: FontWeight.w500),
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
    final styles = context.posStyles;
    return SizedBox(
      width: double.infinity,
      child: Material(
        color: disabled
            ? styles.brand.buttonPrimary.withValues(alpha: 0.4)
            : styles.brand.buttonPrimary,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: disabled ? null : onPressed,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Text(
              'PAY',
              textAlign: TextAlign.center,
              style: styles.payButtonLabel.copyWith(
                color: disabled ? styles.onBrandMuted : styles.onBrand,
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
    final styles = context.posStyles;
    return Container(
      decoration: BoxDecoration(
        color: styles.isDark
            ? styles.brand.primary.withValues(alpha: 0.2)
            : styles.brand.primaryLight,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: styles.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _stepBtn(context, Icons.remove, onDecrement),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              qty.toStringAsFixed(qty == qty.roundToDouble() ? 0 : 2),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: styles.accent,
              ),
            ),
          ),
          _stepBtn(context, Icons.add, onIncrement),
        ],
      ),
    );
  }

  Widget _stepBtn(BuildContext context, IconData icon, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(22),
        child: SizedBox(
          width: 40,
          height: 40,
          child: Icon(icon, size: 24, color: context.posStyles.accent),
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
    final styles = context.posStyles;
    final qtyLabel =
        qty.toStringAsFixed(qty == qty.roundToDouble() ? 0 : 2);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: styles.cardDecoration(),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Material(
            color: context.posSurface.productIconBg,
            borderRadius: BorderRadius.circular(12),
            child: InkWell(
              onTap: enabled ? onEdit : null,
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 52,
                height: 52,
                child: Center(
                  child: Icon(
                    Icons.shopping_bag_outlined,
                    size: 26,
                    color: styles.accent.withValues(alpha: 0.9),
                  ),
                ),
              ),
            ),
          ),
          SizedBox(width: 10),
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
                                          ? styles.accent
                                          : styles.text,
                                      height: 1.25,
                                      decoration: onEdit != null
                                          ? TextDecoration.underline
                                          : null,
                                      decorationColor:
                                          styles.accent.withValues(alpha: 0.35),
                                    ),
                                  ),
                                ),
                                if (onEdit != null) ...[
                                  SizedBox(width: 6),
                                  Icon(
                                    Icons.edit_outlined,
                                    size: 16,
                                    color: styles.accent.withValues(alpha: 0.85),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: 8),
                    _CartMoneyText(
                      amount: lineTotal,
                      style: styles.moneyMedium.copyWith(fontSize: 16),
                    ),
                  ],
                ),
                SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${formatPosMoney(unitPrice)} × $qtyLabel',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: styles.caption.copyWith(fontSize: 13),
                      ),
                    ),
                    SizedBox(width: 8),
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
    final style = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w700,
      color: Theme.of(context).colorScheme.onSurfaceVariant,
      letterSpacing: 0.3,
    );
    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
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
