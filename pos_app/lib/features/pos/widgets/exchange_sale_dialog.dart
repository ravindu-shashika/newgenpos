import 'package:flutter/material.dart';

import '../../../core/repositories/local_return_repository.dart';
import '../../../core/theme/pos_theme.dart';
import '../pos_currency.dart';
import '../models/return_models.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

Future<ExchangeReturnResult?> showExchangeSaleDialog({
  required BuildContext context,
  required LocalReturnRepository returnRepo,
  required int warehouseId,
  required int customerId,
}) {
  return showPosDialog<ExchangeReturnResult>(
    context: context,
    builder: (ctx) => _ExchangeSaleDialog(
      returnRepo: returnRepo,
      warehouseId: warehouseId,
      customerId: customerId,
    ),
  );
}

class _ExchangeSaleDialog extends StatefulWidget {
  const _ExchangeSaleDialog({
    required this.returnRepo,
    required this.warehouseId,
    required this.customerId,
  });

  final LocalReturnRepository returnRepo;
  final int warehouseId;
  final int customerId;

  @override
  State<_ExchangeSaleDialog> createState() => _ExchangeSaleDialogState();
}

class _ExchangeSaleDialogState extends State<_ExchangeSaleDialog> {
  final _refCtrl = TextEditingController();
  ReturnSaleLookup? _lookup;
  final _returnQtyByLine = <int, double>{};
  final _selectedReturn = <int, bool>{};
  String? _error;
  bool _busy = false;

  double get _returnValue {
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

  @override
  void dispose() {
    _refCtrl.dispose();
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
        selected[line.productSaleId] = false;
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
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submit() async {
    final lookup = _lookup;
    if (lookup == null) return;

    final returnSelections =
        <({ReturnSaleLookupLine line, double qty, bool isDamage})>[];
    final allowedProductIds = <int>{};
    for (final line in lookup.lines) {
      if (_selectedReturn[line.productSaleId] != true) continue;
      final qty = _returnQtyByLine[line.productSaleId] ?? 0;
      if (qty <= 0) continue;
      returnSelections.add((line: line, qty: qty, isDamage: false));
      allowedProductIds.add(line.productId);
    }

    if (returnSelections.isEmpty) {
      setState(() => _error = 'Select items to return for exchange');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final result = await widget.returnRepo.saveReturn(
        lookup: lookup,
        selections: returnSelections,
        warehouseId: widget.warehouseId,
        customerId:
            lookup.customerId > 0 ? lookup.customerId : widget.customerId,
        saleId: lookup.saleId,
        returnNote: 'Exchange return',
      );

      if (!mounted) return;
      Navigator.pop(
        context,
        ExchangeReturnResult(
          returnResult: result,
          allowedProductIds: allowedProductIds,
          originalSaleReferenceNo: lookup.referenceNo,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PosProfessionalWideDialogShell(
      title: 'Sale exchange',
      subtitle: 'Return items, then add same-product replacements on the register',
      icon: Icons.swap_horiz_rounded,
      maxWidth: 720,
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
                  'Return credit: ${formatPosMoney(_returnValue)}',
                  style: const TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 4),
                Text(
                  'A return bill is printed. Add replacements on the main screen '
                  'and settle credit at checkout.',
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          PosProfessionalDialogFooter(
            secondaryLabel: 'Cancel',
            primaryLabel: 'Create return bill',
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
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 0),
              child: Text(
                'Check items to return. Only the same product (any size) can be '
                'added as a replacement after the return bill is created.',
                style: TextStyle(
                  fontSize: 12,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ),
            Expanded(
              child: _lookup == null
                  ? const Center(
                      child: Text(
                        'Find the original sale to start an exchange',
                      ),
                    )
                  : _buildReturnPanel(),
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
          padding: EdgeInsets.fromLTRB(24, 12, 24, 4),
          child: Text(
            'Items to return',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.all(24),
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
                        Text(
                          line.name,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        Text(
                          line.code,
                          style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(context)
                                .colorScheme
                                .onSurfaceVariant,
                          ),
                        ),
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
}
