import 'package:flutter/material.dart';

import '../../../core/repositories/local_return_repository.dart';
import '../../../core/repositories/product_lookup_repository.dart';
import '../../../core/theme/pos_theme.dart';
import '../models/return_models.dart';
import '../models/scanned_product.dart';
import '../pos_currency.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

Future<SavedReturnResult?> showReturnWithoutBillDialog({
  required BuildContext context,
  required LocalReturnRepository returnRepo,
  required ProductLookupRepository productLookup,
  required int warehouseId,
  required int customerId,
  int? billerId,
}) {
  return showPosDialog<SavedReturnResult>(
    context: context,
    builder: (ctx) => _ReturnWithoutBillDialog(
      returnRepo: returnRepo,
      productLookup: productLookup,
      warehouseId: warehouseId,
      customerId: customerId,
      billerId: billerId,
    ),
  );
}

class _ReturnLine {
  _ReturnLine({
    required this.product,
    required this.qty,
    this.isDamage = false,
  });

  final ScannedProduct product;
  double qty;
  bool isDamage;

  String get key => '${product.productId}_${product.variantId ?? 0}';

  double get lineTotal => product.price * qty;
}

class _ReturnWithoutBillDialog extends StatefulWidget {
  const _ReturnWithoutBillDialog({
    required this.returnRepo,
    required this.productLookup,
    required this.warehouseId,
    required this.customerId,
    this.billerId,
  });

  final LocalReturnRepository returnRepo;
  final ProductLookupRepository productLookup;
  final int warehouseId;
  final int customerId;
  final int? billerId;

  @override
  State<_ReturnWithoutBillDialog> createState() =>
      _ReturnWithoutBillDialogState();
}

class _ReturnWithoutBillDialogState extends State<_ReturnWithoutBillDialog> {
  final _scanCtrl = TextEditingController();
  final _lines = <String, _ReturnLine>{};
  String? _error;
  bool _busy = false;

  double get _grandTotal =>
      _lines.values.fold<double>(0, (s, l) => s + l.lineTotal);

  @override
  void dispose() {
    _scanCtrl.dispose();
    super.dispose();
  }

  Future<void> _addProduct(String code) async {
    final term = code.trim();
    if (term.isEmpty) return;

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final product = await widget.productLookup.lookup(
        code: term,
        warehouseId: widget.warehouseId,
        customerId: widget.customerId,
      );
      if (product == null) {
        throw StateError('Product not found: $term');
      }

      final key = '${product.productId}_${product.variantId ?? 0}';
      final existing = _lines[key];
      if (existing != null) {
        existing.qty += 1;
      } else {
        _lines[key] = _ReturnLine(product: product, qty: 1);
      }
      _scanCtrl.clear();
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submit() async {
    if (_lines.isEmpty) {
      setState(() => _error = 'Scan at least one product');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final result = await widget.returnRepo.saveReturnWithoutBill(
        selections: _lines.values
            .map(
              (l) => (
                product: l.product,
                qty: l.qty,
                isDamage: l.isDamage,
              ),
            )
            .toList(),
        warehouseId: widget.warehouseId,
        customerId: widget.customerId,
        billerId: widget.billerId,
      );
      if (!mounted) return;
      Navigator.pop(context, result);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lineList = _lines.values.toList();

    return PosProfessionalWideDialogShell(
      title: 'Return without bill',
      subtitle: 'Scan products to issue store credit',
      icon: Icons.qr_code_scanner,
      onClose: _busy ? null : () => Navigator.pop(context),
      footer: PosProfessionalDialogFooter(
        secondaryLabel: 'Cancel',
        primaryLabel: 'Create return',
        primaryEnabled: !_busy && lineList.isNotEmpty,
        primaryLoading: _busy,
        onSecondary: _busy ? null : () => Navigator.pop(context),
        onPrimary: _submit,
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _scanCtrl,
                    decoration: InputDecoration(
                      labelText: 'Scan barcode or enter code',
                      prefixIcon: Icon(Icons.qr_code_scanner),
                    ),
                    onSubmitted: _addProduct,
                  ),
                ),
                SizedBox(width: 12),
                FilledButton(
                  onPressed: _busy ? null : () => _addProduct(_scanCtrl.text),
                  child: const Text('Add'),
                ),
              ],
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 0),
              child: Text(
                _error!,
                style: TextStyle(color: PosColors.red),
              ),
            ),
          if (lineList.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 12, 24, 0),
              child: Text(
                'Credit ${formatPosMoney(_grandTotal)}',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  color: context.posBrand.primary,
                ),
              ),
            ),
          Expanded(
            child: lineList.isEmpty
                ? Center(
                    child: Text(
                      'Scan products to return',
                      style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(24),
                    itemCount: lineList.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (_, i) {
                      final line = lineList[i];
                      return Row(
                        children: [
                          Expanded(
                            flex: 4,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  line.product.name,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  line.product.code,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            flex: 2,
                            child: Text(formatPosMoney(line.lineTotal)),
                          ),
                          Expanded(
                            flex: 2,
                            child: Row(
                              children: [
                                IconButton(
                                  onPressed: line.qty > 1
                                      ? () => setState(() => line.qty -= 1)
                                      : null,
                                  icon: const Icon(Icons.remove),
                                ),
                                Text(
                                  line.qty.toStringAsFixed(0),
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                IconButton(
                                  onPressed: () => setState(() => line.qty += 1),
                                  icon: const Icon(Icons.add),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            flex: 2,
                            child: SwitchListTile(
                              contentPadding: EdgeInsets.zero,
                              title: const Text(
                                'Damage',
                                style: TextStyle(fontSize: 12),
                              ),
                              value: line.isDamage,
                              onChanged: (v) =>
                                  setState(() => line.isDamage = v),
                            ),
                          ),
                          IconButton(
                            onPressed: () =>
                                setState(() => _lines.remove(line.key)),
                            icon: const Icon(Icons.close, size: 18),
                          ),
                        ],
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
