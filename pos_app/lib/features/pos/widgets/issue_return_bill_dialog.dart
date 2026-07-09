import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/app_providers.dart';
import '../../../core/providers/local_print_settings_provider.dart';
import '../../../core/providers/pos_meta_provider.dart';
import '../../../core/providers/pos_ui_settings_provider.dart';
import '../../../core/theme/pos_theme.dart';
import '../models/return_cart_line.dart';
import '../models/return_models.dart';
import '../models/scanned_product.dart';
import '../pos_currency.dart';
import '../sale_reference.dart';
import '../services/return_entry_service.dart';
import '../services/return_receipt_print_service.dart';
import 'pos_professional_dialog.dart';
import 'return_credit_amount_dialog.dart';
import 'show_pos_dialog.dart';
import 'transaction_success_dialog.dart';

/// Dedicated flow: scan return items, edit amounts, issue return credit bill.
Future<SavedReturnResult?> showIssueReturnBillDialog({
  required BuildContext context,
  required WidgetRef ref,
  required int warehouseId,
  required int customerId,
  int? billerId,
}) {
  return showPosDialog<SavedReturnResult>(
    context: context,
    barrierDismissible: false,
    builder: (ctx) => _IssueReturnBillDialog(
      warehouseId: warehouseId,
      customerId: customerId,
      billerId: billerId,
    ),
  );
}

class _ReturnLine {
  _ReturnLine({required this.cartLine});

  ReturnCartLine cartLine;

  String get key => cartLine.lineKey;
}

class _IssueReturnBillDialog extends ConsumerStatefulWidget {
  const _IssueReturnBillDialog({
    required this.warehouseId,
    required this.customerId,
    this.billerId,
  });

  final int warehouseId;
  final int customerId;
  final int? billerId;

  @override
  ConsumerState<_IssueReturnBillDialog> createState() =>
      _IssueReturnBillDialogState();
}

class _IssueReturnBillDialogState extends ConsumerState<_IssueReturnBillDialog> {
  final _scanCtrl = TextEditingController();
  final _scanFocus = FocusNode();
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
    _entryService = ReturnEntryService(
      ref.read(productLookupRepositoryProvider),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _scanFocus.requestFocus();
    });
  }

  @override
  void dispose() {
    _scanCtrl.dispose();
    _scanFocus.dispose();
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

  Future<void> _editUnitPrice(_ReturnLine row) async {
    final line = row.cartLine;
    final edited = await showReturnCreditAmountDialog(
      context: context,
      initialAmount: line.netUnitPrice,
      itemTotal: line.subtotal,
      title: 'Unit price',
      subtitle: line.name,
      itemTotalLabel: 'Line total',
      amountLabel: 'Unit price',
      primaryLabel: 'Apply',
      showUseFullAmount: false,
      icon: Icons.payments_outlined,
    );
    if (edited == null || !mounted) return;
    setState(() => line.netUnitPrice = edited);
  }

  Future<void> _issueBill() async {
    if (_lines.isEmpty) {
      setState(() => _error = 'Scan at least one product');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final lines =
          _lines.values.map((l) => l.cartLine).where((l) => l.qty > 0).toList();

      final result = await ref
          .read(localReturnRepositoryProvider)
          .saveReturnFromCartLines(
            lines: lines,
            warehouseId: widget.warehouseId,
            customerId: widget.customerId,
            billerId: widget.billerId,
            issueMode: 'return_bill',
          );

      if (!mounted) return;

      final ui = ref.read(posUiSettingsProvider);
      if (ui.enablePrint) {
        await _printReturnReceipt(result);
      }

      if (!mounted) return;

      await showTransactionSuccessDialog(
        context: context,
        transactionNo: formatSaleReferenceDisplay(result.referenceNo),
        refId: result.clientUuid,
        changeDue: 0,
      );

      if (!mounted) return;
      Navigator.pop(context, result);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _printReturnReceipt(SavedReturnResult result) async {
    final session = ref.read(sessionServiceProvider);
    final meta = ref.read(posLocalMetaProvider).value;
    String? customerName;
    String? warehouseName;
    if (meta != null) {
      for (final c in meta.customers) {
        if (c.id == widget.customerId) {
          customerName = c.name;
          break;
        }
      }
      for (final w in meta.warehouses) {
        if (w.id == widget.warehouseId) {
          warehouseName = w.name;
          break;
        }
      }
    }
    final printSettings = ref.read(localPrintSettingsProvider);
    await ReturnReceiptPrintService.printReturnReceipt(
      result,
      printSettings: printSettings,
      customerName: customerName,
      cashierName: session.userName,
      warehouseName: warehouseName,
    );
  }

  @override
  Widget build(BuildContext context) {
    final lineList = _lines.values.toList();

    return PosProfessionalWideDialogShell(
      title: 'Issue return bill',
      subtitle: 'Scan return items, adjust amounts, and print credit bill',
      icon: Icons.assignment_return_outlined,
      onClose: _busy ? null : () => Navigator.pop(context),
      footer: PosProfessionalDialogFooter(
        secondaryLabel: 'Cancel',
        primaryLabel: 'Issue return bill',
        primaryEnabled: !_busy && lineList.isNotEmpty,
        primaryLoading: _busy,
        onSecondary: _busy ? null : () => Navigator.pop(context),
        onPrimary: _issueBill,
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
                    focusNode: _scanFocus,
                    autofocus: true,
                    decoration: const InputDecoration(
                      labelText: 'Barcode, code, or product name',
                      prefixIcon: Icon(Icons.qr_code_scanner),
                    ),
                    onSubmitted: _addProduct,
                  ),
                ),
                const SizedBox(width: 12),
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
                style: const TextStyle(color: PosColors.red),
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
                              ],
                            ),
                          ),
                          Expanded(
                            flex: 2,
                            child: InkWell(
                              onTap: _busy
                                  ? null
                                  : () => unawaited(
                                        _editUnitPrice(lineList[i]),
                                      ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    formatPosMoney(line.netUnitPrice),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    'Unit · tap to edit',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: Theme.of(context)
                                          .colorScheme
                                          .onSurfaceVariant,
                                    ),
                                  ),
                                  Text(
                                    formatPosMoney(line.subtotal),
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: context.posBrand.primary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
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
