import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/app_database.dart' show Taxe;
import '../../../core/theme/pos_theme.dart';
import '../cart_line_calc.dart';
import '../models/cart_line.dart';
import '../models/cart_line_edit_context.dart';
import '../pos_currency.dart';
import 'payment_processing_layout.dart';
import 'pos_amount_numpad.dart';
import 'pos_professional_dialog.dart';
import 'pos_touch_keyboard_controller.dart';
import 'show_pos_dialog.dart';

enum _CartEditField { qty, unitDiscount, unitPrice }

Future<CartLine?> showCartLineEditDialog({
  required BuildContext context,
  required CartLine line,
  required CartLineEditContext editContext,
  required List<Taxe> taxes,
}) {
  return showPosDialog<CartLine>(
    context: context,
    builder: (ctx) => _CartLineEditDialog(
      line: line,
      editContext: editContext,
      taxes: taxes,
    ),
  );
}

class _CartLineEditDialog extends ConsumerStatefulWidget {
  const _CartLineEditDialog({
    required this.line,
    required this.editContext,
    required this.taxes,
  });

  final CartLine line;
  final CartLineEditContext editContext;
  final List<Taxe> taxes;

  @override
  ConsumerState<_CartLineEditDialog> createState() => _CartLineEditDialogState();
}

class _CartLineEditDialogState extends ConsumerState<_CartLineEditDialog> {
  late final TextEditingController _qtyCtrl;
  late final TextEditingController _unitDiscountCtrl;
  late final TextEditingController _unitPriceCtrl;
  late final FocusNode _qtyFocus;
  late final FocusNode _discountFocus;
  late final FocusNode _priceFocus;

  late int _unitIndex;
  late int _priceOptionIndex;
  late int _taxIndex;
  _CartEditField _activeField = _CartEditField.qty;

  @override
  void initState() {
    super.initState();
    final line = widget.line;
    final units = widget.editContext.units;

    _unitIndex = 0;
    for (var i = 0; i < units.length; i++) {
      if (units[i].name.toLowerCase() == line.saleUnit.toLowerCase()) {
        _unitIndex = i;
        break;
      }
    }

    final rowPrice = rowUnitPriceForLine(line);
    _priceOptionIndex = 0;
    var bestDiff = double.infinity;
    for (var i = 0; i < widget.editContext.priceOptions.length; i++) {
      final option = widget.editContext.priceOptions[i];
      final optionRow = rowPriceFromBase(option.basePrice, units[_unitIndex]);
      final diff = (optionRow - rowPrice).abs();
      if (diff < bestDiff) {
        bestDiff = diff;
        _priceOptionIndex = i;
      }
    }

    _taxIndex = _taxIndexForRate(line.taxRate);

    _qtyCtrl = TextEditingController(
      text: _formatNumber(
        line.qty,
        decimals: line.qty == line.qty.roundToDouble() ? 0 : 2,
      ),
    );
    _unitDiscountCtrl = TextEditingController(
      text: _formatNumber(unitDiscountForLine(line)),
    );
    _unitPriceCtrl = TextEditingController(
      text: _formatNumber(rowPrice),
    );
    _qtyFocus = FocusNode();
    _discountFocus = FocusNode();
    _priceFocus = FocusNode();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ref.read(posTouchKeyboardControllerProvider).detach();
      _selectField(_CartEditField.qty);
    });
  }

  @override
  void dispose() {
    ref.read(posTouchKeyboardControllerProvider).detach();
    _qtyCtrl.dispose();
    _unitDiscountCtrl.dispose();
    _unitPriceCtrl.dispose();
    _qtyFocus.dispose();
    _discountFocus.dispose();
    _priceFocus.dispose();
    super.dispose();
  }

  TextEditingController get _activeCtrl {
    switch (_activeField) {
      case _CartEditField.qty:
        return _qtyCtrl;
      case _CartEditField.unitDiscount:
        return _unitDiscountCtrl;
      case _CartEditField.unitPrice:
        return _unitPriceCtrl;
    }
  }

  void _selectField(_CartEditField field) {
    setState(() => _activeField = field);
    ref.read(posTouchKeyboardControllerProvider).detach();
    final node = switch (field) {
      _CartEditField.qty => _qtyFocus,
      _CartEditField.unitDiscount => _discountFocus,
      _CartEditField.unitPrice => _priceFocus,
    };
    node.requestFocus();
  }

  int _taxIndexForRate(double rate) {
    final options = _taxOptions;
    for (var i = 0; i < options.length; i++) {
      if ((options[i].rate - rate).abs() < 0.0001) return i;
    }
    return 0;
  }

  List<({String name, double rate})> get _taxOptions {
    return [
      (name: 'No Tax', rate: 0.0),
      ...widget.taxes.map((t) => (name: t.name, rate: t.rate)),
    ];
  }

  CartLineUnitOption get _selectedUnit => widget.editContext.units[_unitIndex];

  String _formatNumber(double value, {int decimals = 2}) {
    if (value == 0) return '0';
    if (decimals == 0 || value == value.roundToDouble()) {
      return value.toStringAsFixed(0);
    }
    return value.toStringAsFixed(decimals);
  }

  double? _parse(String text) => double.tryParse(text.trim());

  void _applyPriceOption(int index) {
    setState(() {
      _priceOptionIndex = index;
      final base = widget.editContext.priceOptions[index].basePrice;
      _unitPriceCtrl.text = _formatNumber(rowPriceFromBase(base, _selectedUnit));
    });
  }

  void _applyUnit(int index) {
    final currentRow = _parse(_unitPriceCtrl.text) ?? rowUnitPriceForLine(widget.line);
    final base = basePriceFromRow(currentRow, _selectedUnit);
    setState(() {
      _unitIndex = index;
      _unitPriceCtrl.text = _formatNumber(
        rowPriceFromBase(base, widget.editContext.units[index]),
      );
    });
  }

  void _submit() {
    final qty = _parse(_qtyCtrl.text);
    final unitDiscount = _parse(_unitDiscountCtrl.text) ?? 0;
    final unitPrice = _parse(_unitPriceCtrl.text);

    if (qty == null || qty <= 0) {
      _showError('Enter a valid quantity');
      return;
    }
    if (unitPrice == null || unitPrice < 0) {
      _showError('Enter a valid unit price');
      return;
    }
    if (unitDiscount > unitPrice) {
      _showError('Unit discount cannot exceed unit price');
      return;
    }

    final tax = _taxOptions[_taxIndex];
    final updated = applyCartLineEdit(
      line: widget.line,
      qty: qty,
      unitDiscount: unitDiscount,
      rowUnitPrice: unitPrice,
      taxRate: tax.rate,
      taxMethod: widget.line.taxMethod,
      saleUnit: _selectedUnit.name,
    );
    Navigator.pop(context, updated);
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final showUnits =
        widget.editContext.isStandard || widget.editContext.units.length > 1;

    return PosProfessionalWideDialogShell(
      title: widget.line.name,
      subtitle: widget.line.code,
      icon: Icons.edit_outlined,
      maxWidth: 920,
      maxHeightFactor: 0.88,
      body: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              flex: 3,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _FieldGrid(
                      columns: 2,
                      children: [
                        _EditField(
                          label: 'Quantity',
                          child: PosAmountField(
                            controller: _qtyCtrl,
                            focusNode: _qtyFocus,
                            onTap: () => _selectField(_CartEditField.qty),
                          ),
                        ),
                        _EditField(
                          label: 'Unit discount',
                          child: PosAmountField(
                            controller: _unitDiscountCtrl,
                            focusNode: _discountFocus,
                            onTap: () =>
                                _selectField(_CartEditField.unitDiscount),
                          ),
                        ),
                        if (widget.editContext.priceOptions.length > 1)
                          _EditField(
                            label: 'Price option',
                            child: DropdownButtonFormField<int>(
                              value: _priceOptionIndex,
                              decoration: const InputDecoration(isDense: true),
                              items: [
                                for (var i = 0;
                                    i < widget.editContext.priceOptions.length;
                                    i++)
                                  DropdownMenuItem(
                                    value: i,
                                    child: Text(
                                      formatPosMoney(
                                        rowPriceFromBase(
                                          widget.editContext.priceOptions[i]
                                              .basePrice,
                                          _selectedUnit,
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                              onChanged: (v) {
                                if (v == null) return;
                                _applyPriceOption(v);
                              },
                            ),
                          )
                        else
                          _EditField(
                            label: 'Price option',
                            child: InputDecorator(
                              decoration: const InputDecoration(isDense: true),
                              child: Text(
                                formatPosMoney(
                                  widget.editContext.priceOptions.first.basePrice,
                                ),
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color:
                                      Theme.of(context).colorScheme.onSurface,
                                ),
                              ),
                            ),
                          ),
                        _EditField(
                          label: 'Unit price',
                          child: PosAmountField(
                            controller: _unitPriceCtrl,
                            focusNode: _priceFocus,
                            onTap: () => _selectField(_CartEditField.unitPrice),
                          ),
                        ),
                        _EditField(
                          label: 'Tax rate',
                          child: DropdownButtonFormField<int>(
                            value: _taxIndex,
                            decoration: const InputDecoration(isDense: true),
                            items: [
                              for (var i = 0; i < _taxOptions.length; i++)
                                DropdownMenuItem(
                                  value: i,
                                  child: Text(_taxOptions[i].name),
                                ),
                            ],
                            onChanged: (v) {
                              if (v == null) return;
                              setState(() => _taxIndex = v);
                            },
                          ),
                        ),
                        if (showUnits)
                          _EditField(
                            label: 'Product unit',
                            child: DropdownButtonFormField<int>(
                              value: _unitIndex,
                              decoration: const InputDecoration(isDense: true),
                              items: [
                                for (var i = 0;
                                    i < widget.editContext.units.length;
                                    i++)
                                  DropdownMenuItem(
                                    value: i,
                                    child: Text(
                                      widget.editContext.units[i].name,
                                    ),
                                  ),
                              ],
                              onChanged: (v) {
                                if (v == null) return;
                                _applyUnit(v);
                              },
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Theme.of(context).scaffoldBackgroundColor,
                        borderRadius:
                            BorderRadius.circular(kPosButtonRadius),
                        border: Border.all(
                          color: Theme.of(context).dividerColor,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.info_outline,
                            size: 18,
                            color: Theme.of(context)
                                .colorScheme
                                .onSurfaceVariant,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Line total preview: '
                              '${formatPosMoney(_previewLineTotal())}',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color:
                                    Theme.of(context).colorScheme.onSurface,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              flex: 2,
              child: PaymentKeypadColumn(
                controller: _activeCtrl,
                onChanged: () => setState(() {}),
                clearButtonLabel: 'Clear',
              ),
            ),
          ],
        ),
      ),
      footer: PosProfessionalDialogFooter(
        secondaryLabel: 'Cancel',
        primaryLabel: 'Update',
        buttonMinHeight: 52,
        onSecondary: () => Navigator.pop(context),
        onPrimary: _submit,
      ),
    );
  }

  double _previewLineTotal() {
    final qty = _parse(_qtyCtrl.text) ?? widget.line.qty;
    final unitDiscount = _parse(_unitDiscountCtrl.text) ?? 0;
    final unitPrice =
        _parse(_unitPriceCtrl.text) ?? rowUnitPriceForLine(widget.line);
    if (qty <= 0) return 0;
    final tax = _taxOptions[_taxIndex];
    return applyCartLineEdit(
      line: widget.line,
      qty: qty,
      unitDiscount: unitDiscount,
      rowUnitPrice: unitPrice,
      taxRate: tax.rate,
      taxMethod: widget.line.taxMethod,
      saleUnit: _selectedUnit.name,
    ).subtotal;
  }
}

class _FieldGrid extends StatelessWidget {
  const _FieldGrid({
    required this.columns,
    required this.children,
  });

  final int columns;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (var i = 0; i < children.length; i += columns) {
      final slice = children.sublist(
        i,
        i + columns > children.length ? children.length : i + columns,
      );
      rows.add(
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (var j = 0; j < columns; j++) ...[
              if (j > 0) const SizedBox(width: 14),
              Expanded(
                child: j < slice.length ? slice[j] : const SizedBox.shrink(),
              ),
            ],
          ],
        ),
      );
      if (i + columns < children.length) {
        rows.add(const SizedBox(height: 14));
      }
    }
    return Column(children: rows);
  }
}

class _EditField extends StatelessWidget {
  const _EditField({
    required this.label,
    required this.child,
  });

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 6),
        child,
      ],
    );
  }
}
