import 'package:flutter/material.dart';

import '../../../core/repositories/product_lookup_repository.dart';
import '../../../core/theme/pos_theme.dart';
import '../models/return_cart_line.dart';
import '../models/return_models.dart';
import '../models/scanned_product.dart';
import '../pos_currency.dart';
import '../services/return_entry_service.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

Future<ReturnCheckoutSessionStart?> showReturnWithoutBillDialog({
  required BuildContext context,
  required ProductLookupRepository productLookup,
  required int warehouseId,
  required int customerId,
  ReturnSessionMode sessionMode = ReturnSessionMode.returnAndSale,
}) {
  return showPosDialog<ReturnCheckoutSessionStart>(
    context: context,
    builder: (ctx) => _ReturnWithoutBillDialog(
      productLookup: productLookup,
      warehouseId: warehouseId,
      customerId: customerId,
      sessionMode: sessionMode,
    ),
  );
}

class _ReturnLine {
  _ReturnLine({
    required this.cartLine,
  });

  final ReturnCartLine cartLine;

  String get key => cartLine.lineKey;
}

class _ReturnWithoutBillDialog extends StatefulWidget {
  const _ReturnWithoutBillDialog({
    required this.productLookup,
    required this.warehouseId,
    required this.customerId,
    required this.sessionMode,
  });

  final ProductLookupRepository productLookup;
  final int warehouseId;
  final int customerId;
  final ReturnSessionMode sessionMode;

  @override
  State<_ReturnWithoutBillDialog> createState() =>
      _ReturnWithoutBillDialogState();
}

class _ReturnWithoutBillDialogState extends State<_ReturnWithoutBillDialog> {
  final _scanCtrl = TextEditingController();
  final _lines = <String, _ReturnLine>{};
  late final ReturnEntryService _entryService;
  String? _error;
  bool _busy = false;

  double get _grandTotal => _lines.values.fold<double>(
        0,
        (s, l) => s + l.cartLine.subtotal,
      );

  @override
  void initState() {
    super.initState();
    _entryService = ReturnEntryService(widget.productLookup);
  }

  @override
  void dispose() {
    _scanCtrl.dispose();
    super.dispose();
  }

  Future<void> _addProduct(String input) async {
    final term = input.trim();
    if (term.isEmpty) return;

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      var match = await _entryService.resolveInput(
        input: term,
        warehouseId: widget.warehouseId,
        customerId: widget.customerId,
      );

      if (match == null && term.length >= 2) {
        final hits = await _entryService.searchByName(
          query: term,
          warehouseId: widget.warehouseId,
        );
        if (hits.length > 1 && mounted) {
          final picked = await _pickProduct(hits);
          if (picked == null) return;
          match = ReturnProductMatch(product: picked);
        } else if (hits.length == 1) {
          match = ReturnProductMatch(product: hits.first);
        }
      }

      if (match == null) {
        throw StateError('Product not found: $term');
      }

      final cartLine = _entryService.buildReturnLine(match: match);
      final key = cartLine.lineKey;
      final existing = _lines[key];
      if (existing != null) {
        existing.cartLine.qty += 1;
      } else {
        _lines[key] = _ReturnLine(cartLine: cartLine);
      }
      _scanCtrl.clear();
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<ScannedProduct?> _pickProduct(List<ScannedProduct> hits) {
    return showPosDialog<ScannedProduct>(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: const Text('Select product'),
        children: [
          for (final p in hits.take(12))
            SimpleDialogOption(
              onPressed: () => Navigator.pop(context, p),
              child: ListTile(
                title: Text(p.name),
                subtitle: Text(
                  '${p.code} · Stock ${p.warehouseQty.toStringAsFixed(0)}',
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _submit() {
    if (_lines.isEmpty) {
      setState(() => _error = 'Scan at least one product');
      return;
    }

    Navigator.pop(
      context,
      ReturnCheckoutSessionStart(
        mode: widget.sessionMode,
        returnLines: _lines.values.map((l) => l.cartLine).toList(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lineList = _lines.values.toList();

    return PosProfessionalWideDialogShell(
      title: 'Return without bill',
      subtitle: 'Scan products to add to return checkout',
      icon: Icons.qr_code_scanner,
      onClose: _busy ? null : () => Navigator.pop(context),
      footer: PosProfessionalDialogFooter(
        secondaryLabel: 'Cancel',
        primaryLabel: 'Add to return',
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
                    decoration: const InputDecoration(
                      labelText: 'Barcode, code, or product name',
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
                'Return credit ${formatPosMoney(_grandTotal)}',
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
                      'Scan barcode, code, or search by name',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(24),
                    itemCount: lineList.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (_, i) {
                      final line = lineList[i].cartLine;
                      return Row(
                        children: [
                          Expanded(
                            flex: 4,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  line.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
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
                                if (line.stockQty != null)
                                  Text(
                                    'Stock: ${line.stockQty!.toStringAsFixed(0)}',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Theme.of(context)
                                          .colorScheme
                                          .onSurfaceVariant,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          Expanded(
                            flex: 2,
                            child: Text(formatPosMoney(line.subtotal)),
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
                                  style: const TextStyle(
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
                            onPressed: () => setState(
                              () => _lines.remove(lineList[i].key),
                            ),
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
