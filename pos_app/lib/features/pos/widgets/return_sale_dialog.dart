import 'package:flutter/material.dart';

import '../../../core/repositories/local_return_repository.dart';
import '../../../core/theme/pos_theme.dart';
import '../models/return_cart_line.dart';
import '../models/return_models.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

Future<ReturnCheckoutSessionStart?> showReturnSaleDialog({
  required BuildContext context,
  required LocalReturnRepository returnRepo,
  required int warehouseId,
  required int customerId,
  ReturnSessionMode sessionMode = ReturnSessionMode.returnAndSale,
  Future<ReturnSaleLookup?> Function(String ref)? serverLookup,
}) {
  return showPosDialog<ReturnCheckoutSessionStart>(
    context: context,
    builder: (ctx) => _ReturnSaleDialog(
      returnRepo: returnRepo,
      warehouseId: warehouseId,
      customerId: customerId,
      sessionMode: sessionMode,
      serverLookup: serverLookup,
    ),
  );
}

class _ReturnSaleDialog extends StatefulWidget {
  const _ReturnSaleDialog({
    required this.returnRepo,
    required this.warehouseId,
    required this.customerId,
    required this.sessionMode,
    this.serverLookup,
  });

  final LocalReturnRepository returnRepo;
  final int warehouseId;
  final int customerId;
  final ReturnSessionMode sessionMode;
  final Future<ReturnSaleLookup?> Function(String ref)? serverLookup;

  @override
  State<_ReturnSaleDialog> createState() => _ReturnSaleDialogState();
}

class _ReturnSaleDialogState extends State<_ReturnSaleDialog> {
  final _refCtrl = TextEditingController();
  ReturnSaleLookup? _lookup;
  final _qtyByLine = <int, double>{};
  final _damageByLine = <int, bool>{};
  String? _error;
  bool _busy = false;

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
        serverLookup: widget.serverLookup,
      );

      if (lookup == null || lookup.lines.isEmpty) {
        throw StateError(
          'Sale not found. Enter the receipt reference or sale number.',
        );
      }

      final qty = <int, double>{};
      final damage = <int, bool>{};
      for (final line in lookup.lines) {
        qty[line.productSaleId] = line.returnableQty;
        damage[line.productSaleId] = false;
      }

      if (!mounted) return;
      setState(() {
        _lookup = lookup;
        _qtyByLine
          ..clear()
          ..addAll(qty);
        _damageByLine
          ..clear()
          ..addAll(damage);
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

    final selections = <({ReturnSaleLookupLine line, double qty, bool isDamage})>[];
    for (final line in lookup.lines) {
      final qty = _qtyByLine[line.productSaleId] ?? 0;
      if (qty <= 0) continue;
      selections.add((
        line: line,
        qty: qty,
        isDamage: _damageByLine[line.productSaleId] ?? false,
      ));
    }

    if (selections.isEmpty) {
      setState(() => _error = 'Select qty to return');
      return;
    }

    final returnLines = selections
        .map(
          (row) => ReturnCartLine.fromLookupLine(
            row.line,
            qty: row.qty,
            isDamage: row.isDamage,
          ),
        )
        .toList();

    if (!mounted) return;
    Navigator.pop(
      context,
      ReturnCheckoutSessionStart(
        mode: widget.sessionMode,
        originalSaleLookup: lookup,
        returnLines: returnLines,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PosProfessionalWideDialogShell(
      title: 'Sale return',
      subtitle: 'Link sale and add return items to checkout',
      icon: Icons.undo_rounded,
      onClose: () {
        if (!_busy) Navigator.pop(context);
      },
      footer: PosProfessionalDialogFooter(
        secondaryLabel: 'Cancel',
        primaryLabel: 'Add to return',
        primaryEnabled: !_busy && _lookup != null,
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
                    controller: _refCtrl,
                    decoration: InputDecoration(
                      labelText: 'Sale reference',
                      hintText: 'posr20260604153045',
                    ),
                    onSubmitted: (_) => _loadSale(),
                  ),
                ),
                SizedBox(width: 12),
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
                style: TextStyle(color: PosColors.red),
              ),
            ),
          Padding(
            padding: EdgeInsets.fromLTRB(24, 8, 24, 0),
            child: Text(
              'Find the original sale, set return qty per line, then add items '
              'on the register. Credit offsets new sale at checkout. '
              'Damaged items are not added back to stock.',
              style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          ),
          Expanded(
            child: _lookup == null
                ? const Center(child: Text('Find a sale to return items'))
                : ListView.separated(
                    padding: const EdgeInsets.all(24),
                    itemCount: _lookup!.lines.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (_, i) {
                      final line = _lookup!.lines[i];
                      final qty = _qtyByLine[line.productSaleId] ?? 0;
                      final damaged = _damageByLine[line.productSaleId] ?? false;
                      return Row(
                        children: [
                          Expanded(
                            flex: 4,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  line.name,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  line.code,
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
                            child: Text(
                              'Max ${line.returnableQty.toStringAsFixed(0)}',
                              style: TextStyle(fontSize: 12),
                            ),
                          ),
                          Expanded(
                            flex: 2,
                            child: Row(
                              children: [
                                IconButton(
                                  onPressed: qty > 0
                                      ? () => setState(() =>
                                          _qtyByLine[line.productSaleId] =
                                              qty - 1)
                                      : null,
                                  icon: const Icon(Icons.remove),
                                ),
                                Text(
                                  qty.toStringAsFixed(0),
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                IconButton(
                                  onPressed: qty < line.returnableQty
                                      ? () => setState(() =>
                                          _qtyByLine[line.productSaleId] =
                                              qty + 1)
                                      : null,
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
                              value: damaged,
                              onChanged: (v) => setState(
                                () => _damageByLine[line.productSaleId] = v,
                              ),
                            ),
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
