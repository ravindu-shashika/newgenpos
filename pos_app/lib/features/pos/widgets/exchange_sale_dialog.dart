import 'package:flutter/material.dart';

import '../../../core/repositories/local_exchange_repository.dart';
import '../../../core/repositories/local_return_repository.dart';
import '../../../core/repositories/product_lookup_repository.dart';
import '../../../core/theme/pos_theme.dart';
import '../pos_currency.dart';
import '../models/exchange_models.dart';
import '../models/return_models.dart';
import '../models/scanned_product.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

Future<bool?> showExchangeSaleDialog({
  required BuildContext context,
  required LocalReturnRepository returnRepo,
  required LocalExchangeRepository exchangeRepo,
  required ProductLookupRepository productLookup,
  required int warehouseId,
  required int customerId,
}) {
  return showPosDialog<bool>(
    context: context,
    builder: (ctx) => _ExchangeSaleDialog(
      returnRepo: returnRepo,
      exchangeRepo: exchangeRepo,
      productLookup: productLookup,
      warehouseId: warehouseId,
      customerId: customerId,
    ),
  );
}

class _ExchangeSaleDialog extends StatefulWidget {
  const _ExchangeSaleDialog({
    required this.returnRepo,
    required this.exchangeRepo,
    required this.productLookup,
    required this.warehouseId,
    required this.customerId,
  });

  final LocalReturnRepository returnRepo;
  final LocalExchangeRepository exchangeRepo;
  final ProductLookupRepository productLookup;
  final int warehouseId;
  final int customerId;

  @override
  State<_ExchangeSaleDialog> createState() => _ExchangeSaleDialogState();
}

class _ExchangeSaleDialogState extends State<_ExchangeSaleDialog> {
  final _refCtrl = TextEditingController();
  final _productSearchCtrl = TextEditingController();
  ReturnSaleLookup? _lookup;
  final _returnQtyByLine = <int, double>{};
  final _selectedReturn = <int, bool>{};
  final _newLines = <ExchangeNewLine>[];
  String? _error;
  bool _busy = false;

  double get _exchangeValue {
    final lookup = _lookup;
    if (lookup == null) return 0;
    var total = 0.0;
    for (final line in lookup.lines) {
      if (_selectedReturn[line.productSaleId] != true) continue;
      final qty = _returnQtyByLine[line.productSaleId] ?? 0;
      if (qty <= 0) continue;
      final ratio = qty / (line.returnableQty > 0 ? line.returnableQty : 1);
      total += line.netUnitPrice * qty -
          line.discount * ratio +
          line.tax * ratio;
    }
    return total;
  }

  double get _newProductsTotal =>
      _newLines.fold(0.0, (sum, line) => sum + line.lineTotal);

  double get _balance => _newProductsTotal - _exchangeValue;

  @override
  void dispose() {
    _refCtrl.dispose();
    _productSearchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadSale() async {
    final refNo = _refCtrl.text.trim();
    if (refNo.isEmpty) {
      setState(() => _error = 'Enter sale reference');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final lookup = await widget.returnRepo.resolveSaleForReturn(
        referenceNo: refNo,
      );

      if (lookup == null || lookup.lines.isEmpty) {
        throw StateError(
          'Sale not found on this terminal. Use the receipt reference or '
          'sale number from a sale completed here.',
        );
      }

      final qty = <int, double>{};
      final selected = <int, bool>{};
      for (final line in lookup.lines) {
        qty[line.productSaleId] = line.returnableQty;
        selected[line.productSaleId] = true;
      }

      if (!mounted) return;
      setState(() {
        _lookup = lookup;
        _returnQtyByLine
          ..clear()
          ..addAll(qty);
        _selectedReturn
          ..clear()
          ..addAll(selected);
        _newLines.clear();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _addProduct() async {
    final code = _productSearchCtrl.text.trim();
    if (code.isEmpty) return;

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final product = await widget.productLookup.lookup(
        code: code,
        warehouseId: widget.warehouseId,
        customerId: widget.customerId,
      );
      if (product == null) {
        throw StateError('Product not found: $code');
      }

      final line = _lineFromProduct(product);
      final existingIndex = _newLines.indexWhere(
        (l) => l.productId == line.productId && l.variantId == line.variantId,
      );

      if (!mounted) return;
      setState(() {
        if (existingIndex >= 0) {
          final existing = _newLines[existingIndex];
          _newLines[existingIndex] =
              existing.copyWith(qty: existing.qty + 1);
        } else {
          _newLines.add(line);
        }
        _productSearchCtrl.clear();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  ExchangeNewLine _lineFromProduct(ScannedProduct product) {
    final price = product.price;
    final qty = 1.0;
    double tax;
    if (product.taxMethod == 1) {
      tax = price * qty * product.taxRate / 100;
    } else {
      tax = price * qty - (price * qty / (1 + product.taxRate / 100));
    }
    final lineTotal = product.taxMethod == 1 ? price * qty + tax : price * qty;

    return ExchangeNewLine(
      productId: product.productId,
      variantId: product.variantId,
      code: product.code,
      name: product.name,
      qty: qty,
      netUnitPrice: price,
      discount: 0,
      taxRate: product.taxRate,
      tax: tax,
      lineTotal: lineTotal,
    );
  }

  Future<void> _submit() async {
    final lookup = _lookup;
    if (lookup == null) return;

    final returnSelections =
        <({ReturnSaleLookupLine line, double qty})>[];
    for (final line in lookup.lines) {
      if (_selectedReturn[line.productSaleId] != true) continue;
      final qty = _returnQtyByLine[line.productSaleId] ?? 0;
      if (qty <= 0) continue;
      returnSelections.add((line: line, qty: qty));
    }

    if (returnSelections.isEmpty) {
      setState(() => _error = 'Select items to return');
      return;
    }
    if (_newLines.isEmpty) {
      setState(() => _error = 'Add new products for exchange');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      await widget.exchangeRepo.saveExchange(
        lookup: lookup,
        returnSelections: returnSelections,
        newLines: _newLines,
        warehouseId: widget.warehouseId,
        saleId: lookup.saleId,
      );
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String _balanceLabel() {
    final b = _balance;
    if (b > 0.0001) {
      return 'Customer pays ${formatPosMoney(b.abs())}';
    }
    if (b < -0.0001) {
      return 'Refund to customer ${formatPosMoney(b.abs())}';
    }
    return 'Even exchange — no balance';
  }

  @override
  Widget build(BuildContext context) {
    return PosProfessionalWideDialogShell(
      title: 'Sale exchange',
      subtitle: 'Return items and add replacement products',
      icon: Icons.swap_horiz_rounded,
      maxWidth: 980,
      onClose: () {
        if (!_busy) Navigator.pop(context);
      },
      footer: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Return value: ${formatPosMoney(_exchangeValue)}  ·  '
                  'New total: ${formatPosMoney(_newProductsTotal)}',
                  style: const TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 4),
                Text(
                  _balanceLabel(),
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: _balance > 0
                        ? PosColors.red
                        : PosColors.primary,
                  ),
                ),
              ],
            ),
          ),
          PosProfessionalDialogFooter(
            secondaryLabel: 'Cancel',
            primaryLabel: 'Complete exchange',
            primaryEnabled: !_busy && _lookup != null,
            primaryLoading: _busy,
            onSecondary: _busy ? null : () => Navigator.pop(context),
            onPrimary: _submit,
          ),
        ],
      ),
      body: SizedBox(
        width: double.infinity,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _refCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Original sale reference',
                        hintText: 'posr20260604153045',
                      ),
                      onSubmitted: (_) => _loadSale(),
                    ),
                  ),
                  const SizedBox(width: 12),
                  FilledButton(
                    onPressed: _busy ? null : _loadSale,
                    child: const Text('Find'),
                  ),
                ],
              ),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 0),
                child: Text(
                  _error!,
                  style: const TextStyle(color: PosColors.red),
                ),
              ),
            Expanded(
              child: _lookup == null
                  ? const Center(
                      child: Text(
                        'Find the original sale to start an exchange',
                      ),
                    )
                  : Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(child: _buildReturnPanel()),
                        const VerticalDivider(width: 1),
                        Expanded(child: _buildNewProductsPanel()),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReturnPanel() {
    final lookup = _lookup!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Text(
            'Return items',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: lookup.lines.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final line = lookup.lines[i];
              final selected = _selectedReturn[line.productSaleId] ?? false;
              final qty = _returnQtyByLine[line.productSaleId] ?? 0;
              return Row(
                children: [
                  Checkbox(
                    value: selected,
                    onChanged: (v) => setState(
                      () => _selectedReturn[line.productSaleId] = v ?? false,
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(line.name,
                            style: const TextStyle(fontWeight: FontWeight.w600)),
                        Text(line.code,
                            style: const TextStyle(
                                fontSize: 12, color: PosColors.textMuted)),
                      ],
                    ),
                  ),
                  if (selected) ...[
                    IconButton(
                      onPressed: qty > 0
                          ? () => setState(() =>
                              _returnQtyByLine[line.productSaleId] = qty - 1)
                          : null,
                      icon: const Icon(Icons.remove, size: 18),
                    ),
                    Text(qty.toStringAsFixed(0)),
                    IconButton(
                      onPressed: qty < line.returnableQty
                          ? () => setState(() =>
                              _returnQtyByLine[line.productSaleId] = qty + 1)
                          : null,
                      icon: const Icon(Icons.add, size: 18),
                    ),
                  ],
                ],
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildNewProductsPanel() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(
            children: [
              const Expanded(
                child: Text(
                  'New products',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              Expanded(
                flex: 2,
                child: TextField(
                  controller: _productSearchCtrl,
                  decoration: const InputDecoration(
                    isDense: true,
                    hintText: 'Scan / enter code',
                    border: OutlineInputBorder(),
                  ),
                  onSubmitted: (_) => _addProduct(),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: _busy ? null : _addProduct,
                icon: const Icon(Icons.add),
              ),
            ],
          ),
        ),
        Expanded(
          child: _newLines.isEmpty
              ? const Center(child: Text('Add products for the exchange'))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _newLines.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final line = _newLines[i];
                    return Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(line.name,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600)),
                              Text(
                                '${line.code} · ${formatPosMoney(line.lineTotal)}',
                                style: const TextStyle(
                                    fontSize: 12, color: PosColors.textMuted),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: line.qty > 1
                              ? () => setState(
                                  () => _newLines[i] = line.copyWith(
                                        qty: line.qty - 1,
                                      ),
                                )
                              : null,
                          icon: const Icon(Icons.remove, size: 18),
                        ),
                        Text(line.qty.toStringAsFixed(0)),
                        IconButton(
                          onPressed: () => setState(
                            () => _newLines[i] = line.copyWith(qty: line.qty + 1),
                          ),
                          icon: const Icon(Icons.add, size: 18),
                        ),
                        IconButton(
                          onPressed: () =>
                              setState(() => _newLines.removeAt(i)),
                          icon: const Icon(Icons.delete_outline,
                              color: PosColors.red, size: 20),
                        ),
                      ],
                    );
                  },
                ),
        ),
      ],
    );
  }
}
