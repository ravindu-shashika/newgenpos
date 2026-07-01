import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/pos_ui_settings_provider.dart';
import '../../../core/theme/pos_theme.dart';
import '../cart_line_calc.dart';
import '../models/cart_line.dart';
import '../models/scanned_product.dart';
import '../pos_currency.dart';
import '../pos_helpers.dart';
import 'payment_processing_layout.dart';
import 'pos_amount_numpad.dart';
import 'pos_professional_dialog.dart';
import 'pos_touch_keyboard_controller.dart';
import 'pos_ui_widgets.dart';
import 'show_pos_dialog.dart';

class AddItemEntryResult {
  const AddItemEntryResult({
    required this.qty,
    this.unitDiscount = 0,
  });

  final double qty;
  final double unitDiscount;
}

Future<AddItemEntryResult?> showAddItemEntryDialog({
  required BuildContext context,
  required ScannedProduct product,
  double initialQty = 1,
  double initialUnitDiscount = 0,
  double availableStock = 0,
}) {
  return showPosDialog<AddItemEntryResult>(
    context: context,
    builder: (ctx) => _AddItemEntryDialog(
      product: product,
      initialQty: initialQty,
      initialUnitDiscount: initialUnitDiscount,
      availableStock: availableStock,
    ),
  );
}

enum _AddItemField { qty, unitDiscount }

class _AddItemEntryDialog extends ConsumerStatefulWidget {
  const _AddItemEntryDialog({
    required this.product,
    required this.initialQty,
    required this.initialUnitDiscount,
    required this.availableStock,
  });

  final ScannedProduct product;
  final double initialQty;
  final double initialUnitDiscount;
  final double availableStock;

  @override
  ConsumerState<_AddItemEntryDialog> createState() => _AddItemEntryDialogState();
}

class _AddItemEntryDialogState extends ConsumerState<_AddItemEntryDialog> {
  static const _panelHeight = 400.0;

  late int _tabIndex;
  late double _qty;
  late final TextEditingController _qtyCtrl;
  late final FocusNode _qtyFocus;
  late final TextEditingController _unitDiscountCtrl;
  late final FocusNode _unitDiscountFocus;

  @override
  void initState() {
    super.initState();
    _tabIndex = 0;
    _qty = widget.initialQty.clamp(1, double.infinity);
    _qtyCtrl = TextEditingController(text: _formatQty(_qty));
    _qtyFocus = FocusNode();
    _unitDiscountCtrl = TextEditingController(
      text: _formatAmount(widget.initialUnitDiscount),
    );
    _unitDiscountFocus = FocusNode();
    _qtyCtrl.addListener(_syncQtyFromController);
    _unitDiscountCtrl.addListener(() => setState(() {}));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ref.read(posTouchKeyboardControllerProvider).detach();
      _selectField(_AddItemField.qty);
    });
  }

  @override
  void dispose() {
    ref.read(posTouchKeyboardControllerProvider).detach();
    _qtyCtrl.removeListener(_syncQtyFromController);
    _qtyCtrl.dispose();
    _qtyFocus.dispose();
    _unitDiscountCtrl.dispose();
    _unitDiscountFocus.dispose();
    super.dispose();
  }

  void _selectField(_AddItemField field) {
    ref.read(posTouchKeyboardControllerProvider).detach();
    final node = switch (field) {
      _AddItemField.qty => _qtyFocus,
      _AddItemField.unitDiscount => _unitDiscountFocus,
    };
    node.requestFocus();
  }

  void _syncQtyFromController() {
    final parsed = double.tryParse(_qtyCtrl.text.trim());
    if (parsed == null || parsed <= 0) return;
    if (parsed != _qty) {
      setState(() => _qty = parsed);
    }
  }

  String _formatQty(double v) {
    if (v == v.roundToDouble()) return v.toStringAsFixed(0);
    return v.toStringAsFixed(2);
  }

  String _formatAmount(double v) {
    if (v == 0) return '0';
    return v % 1 == 0 ? v.toStringAsFixed(0) : v.toStringAsFixed(2);
  }

  double get _unitDiscount =>
      double.tryParse(_unitDiscountCtrl.text.trim()) ?? 0;

  CartLine get _previewLine {
    final draft = CartLine(
      productId: widget.product.productId,
      variantId: widget.product.variantId,
      productBatchId: widget.product.productBatchId,
      batchNo: widget.product.batchNo,
      code: widget.product.code,
      name: widget.product.name,
      netUnitPrice: widget.product.price,
      taxRate: widget.product.taxRate,
      taxMethod: widget.product.taxMethod,
      qty: _qty,
      stockQty: widget.product.warehouseQty,
    );
    return applyCartLineEdit(
      line: draft,
      qty: _qty,
      unitDiscount: _unitDiscount.clamp(0, widget.product.price),
      rowUnitPrice: widget.product.price,
      taxRate: widget.product.taxRate,
      taxMethod: widget.product.taxMethod,
      saleUnit: draft.saleUnit,
    );
  }

  void _setQty(double next) {
    final clamped = next < 1 ? 1.0 : next;
    if (widget.availableStock > 0 && clamped > widget.availableStock) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            stockLimitMessage(
                  productName: widget.product.name,
                  available: widget.availableStock,
                  requested: clamped,
                ) ??
                'Quantity exceeds available stock',
          ),
        ),
      );
      return;
    }
    setState(() {
      _qty = clamped;
      _qtyCtrl.text = _formatQty(_qty);
      _qtyCtrl.selection = TextSelection.collapsed(offset: _qtyCtrl.text.length);
    });
  }

  void _submit() {
    final qty = double.tryParse(_qtyCtrl.text.trim()) ?? _qty;
    final unitDiscount = _unitDiscount;

    if (qty <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid quantity')),
      );
      return;
    }
    if (widget.availableStock > 0 && qty > widget.availableStock) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            stockLimitMessage(
                  productName: widget.product.name,
                  available: widget.availableStock,
                  requested: qty,
                ) ??
                'Quantity exceeds available stock',
          ),
        ),
      );
      return;
    }
    if (unitDiscount > widget.product.price) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Unit discount cannot exceed unit price'),
        ),
      );
      return;
    }

    Navigator.pop(
      context,
      AddItemEntryResult(qty: qty, unitDiscount: unitDiscount),
    );
  }

  @override
  Widget build(BuildContext context) {
    final enableKeyboard = ref.watch(posUiSettingsProvider).enableKeyboard;
    final preview = _previewLine;

    return PosProfessionalWideDialogShell(
      title: widget.product.name,
      subtitle: widget.product.code,
      icon: Icons.add_shopping_cart_outlined,
      maxWidth: 960,
      maxHeightFactor: 0.9,
      onClose: () => Navigator.pop(context),
      headerExtra: Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
        child: _AddItemTabBar(
          selectedIndex: _tabIndex,
          onChanged: (i) {
            setState(() => _tabIndex = i);
            _selectField(
              i == 0 ? _AddItemField.qty : _AddItemField.unitDiscount,
            );
          },
        ),
      ),
      footer: PosProfessionalDialogFooter(
        secondaryLabel: 'Cancel',
        primaryLabel: 'Add to cart',
        buttonMinHeight: 52,
        onSecondary: () => Navigator.pop(context),
        onPrimary: _submit,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 18, 24, 8),
        child: SizedBox(
          height: _panelHeight,
          child: _tabIndex == 0
              ? _QtyEntryPanel(
                  product: widget.product,
                  qty: _qty,
                  qtyController: _qtyCtrl,
                  qtyFocus: _qtyFocus,
                  lineTotal: preview.subtotal,
                  availableStock: widget.availableStock,
                  enableKeyboard: enableKeyboard,
                  onQtyChanged: _setQty,
                  onDecrement: () => _setQty(_qty - 1),
                  onIncrement: () => _setQty(_qty + 1),
                  onQtyFieldTap: () => _selectField(_AddItemField.qty),
                  activeKeypadController: enableKeyboard ? _qtyCtrl : null,
                  onKeypadChanged: () {
                    final parsed = double.tryParse(_qtyCtrl.text.trim());
                    if (parsed != null && parsed > 0) {
                      _setQty(parsed);
                    }
                  },
                )
              : _UnitDiscountEntryPanel(
                  product: widget.product,
                  unitDiscountController: _unitDiscountCtrl,
                  unitDiscountFocus: _unitDiscountFocus,
                  lineTotal: preview.subtotal,
                  enableKeyboard: enableKeyboard,
                  onFieldTap: () => _selectField(_AddItemField.unitDiscount),
                  activeKeypadController:
                      enableKeyboard ? _unitDiscountCtrl : null,
                  onKeypadChanged: () => setState(() {}),
                ),
        ),
      ),
    );
  }
}

class _QtyEntryPanel extends StatelessWidget {
  const _QtyEntryPanel({
    required this.product,
    required this.qty,
    required this.qtyController,
    required this.qtyFocus,
    required this.lineTotal,
    required this.availableStock,
    required this.enableKeyboard,
    required this.onQtyChanged,
    required this.onDecrement,
    required this.onIncrement,
    required this.onQtyFieldTap,
    this.activeKeypadController,
    this.onKeypadChanged,
  });

  final ScannedProduct product;
  final double qty;
  final TextEditingController qtyController;
  final FocusNode qtyFocus;
  final double lineTotal;
  final double availableStock;
  final bool enableKeyboard;
  final ValueChanged<double> onQtyChanged;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;
  final VoidCallback onQtyFieldTap;
  final TextEditingController? activeKeypadController;
  final VoidCallback? onKeypadChanged;

  @override
  Widget build(BuildContext context) {
    final styles = context.posStyles;

    final info = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          formatPosMoney(product.price),
          style: styles.moneyLarge.copyWith(fontSize: 28),
        ),
        const SizedBox(height: 4),
        Text('Unit price', style: styles.caption),
        if (availableStock > 0) ...[
          const SizedBox(height: 12),
          Text(
            'Available: ${availableStock.toStringAsFixed(availableStock == availableStock.roundToDouble() ? 0 : 2)}',
            style: styles.bodyMuted.copyWith(fontSize: 13),
          ),
        ],
        const SizedBox(height: 20),
        Text(
          'Quantity',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: styles.textMuted,
          ),
        ),
        const SizedBox(height: 10),
        Center(
          child: PosQtyStepper(
            qty: qty,
            onDecrement: onDecrement,
            onIncrement: onIncrement,
          ),
        ),
        const SizedBox(height: 16),
        if (enableKeyboard) ...[
          Text('Or enter quantity', style: styles.caption),
          const SizedBox(height: 8),
          PosAmountField(
            controller: qtyController,
            focusNode: qtyFocus,
            onTap: onQtyFieldTap,
          ),
        ],
        const Spacer(),
        _LineTotalPreview(amount: lineTotal),
      ],
    );

    if (!enableKeyboard || activeKeypadController == null) {
      return SizedBox(height: 400, child: info);
    }

    final keypadCtrl = activeKeypadController!;

    return SizedBox(
      height: 400,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(flex: 3, child: info),
          const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: PaymentKeypadColumn(
              controller: keypadCtrl,
              onChanged: onKeypadChanged ?? () {},
              allowDecimal: true,
              clearButtonLabel: 'Clear',
            ),
          ),
        ],
      ),
    );
  }
}

class _UnitDiscountEntryPanel extends StatelessWidget {
  const _UnitDiscountEntryPanel({
    required this.product,
    required this.unitDiscountController,
    required this.unitDiscountFocus,
    required this.lineTotal,
    required this.enableKeyboard,
    required this.onFieldTap,
    this.activeKeypadController,
    this.onKeypadChanged,
  });

  final ScannedProduct product;
  final TextEditingController unitDiscountController;
  final FocusNode unitDiscountFocus;
  final double lineTotal;
  final bool enableKeyboard;
  final VoidCallback onFieldTap;
  final TextEditingController? activeKeypadController;
  final VoidCallback? onKeypadChanged;

  @override
  Widget build(BuildContext context) {
    final styles = context.posStyles;

    final info = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          formatPosMoney(product.price),
          style: styles.moneyLarge.copyWith(fontSize: 28),
        ),
        const SizedBox(height: 4),
        Text('Unit price', style: styles.caption),
        const SizedBox(height: 20),
        Text(
          'Unit discount',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: styles.textMuted,
          ),
        ),
        const SizedBox(height: 8),
        PosAmountField(
          controller: unitDiscountController,
          focusNode: unitDiscountFocus,
          onTap: onFieldTap,
        ),
        const SizedBox(height: 8),
        Text(
          'Discount per unit (flat amount)',
          style: styles.caption,
        ),
        const Spacer(),
        _LineTotalPreview(amount: lineTotal),
      ],
    );

    if (!enableKeyboard || activeKeypadController == null) {
      return SizedBox(height: 400, child: info);
    }

    final keypadCtrl = activeKeypadController!;

    return SizedBox(
      height: 400,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(flex: 3, child: info),
          const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: PaymentKeypadColumn(
              controller: keypadCtrl,
              onChanged: onKeypadChanged ?? () {},
              clearButtonLabel: 'Clear',
            ),
          ),
        ],
      ),
    );
  }
}

class _LineTotalPreview extends StatelessWidget {
  const _LineTotalPreview({required this.amount});

  final double amount;

  @override
  Widget build(BuildContext context) {
    final styles = context.posStyles;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: styles.inputFill.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: styles.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              'Line total',
              style: styles.body.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
          Text(
            formatPosMoney(amount),
            style: styles.moneyMedium.copyWith(fontSize: 18),
          ),
        ],
      ),
    );
  }
}

class _AddItemTabBar extends StatelessWidget {
  const _AddItemTabBar({
    required this.selectedIndex,
    required this.onChanged,
  });

  final int selectedIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: context.posBrand.chipInactive,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: [
          Expanded(
            child: _TabButton(
              label: 'Quantity',
              selected: selectedIndex == 0,
              onTap: () => onChanged(0),
            ),
          ),
          Expanded(
            child: _TabButton(
              label: 'Unit discount',
              selected: selectedIndex == 1,
              onTap: () => onChanged(1),
            ),
          ),
        ],
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
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
      color: selected ? s.cardBg : Colors.transparent,
      borderRadius: BorderRadius.circular(20),
      elevation: selected ? 1 : 0,
      shadowColor: Colors.black12,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: SizedBox(
          height: 40,
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: selected ? s.text : s.textMuted,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
