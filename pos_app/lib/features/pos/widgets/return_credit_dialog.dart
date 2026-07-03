import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/pos_theme.dart';
import '../pos_currency.dart';
import '../models/return_models.dart';
import 'pos_professional_dialog.dart';
import 'pos_touch_keyboard_controller.dart';
import 'pos_touch_text_field.dart';
import 'pos_touch_text_keyboard.dart';
import 'show_pos_dialog.dart';

Future<List<AppliedReturnSettlement>?> showReturnCreditDialog({
  required BuildContext context,
  required double maxApply,
  List<AppliedReturnSettlement> initial = const [],
  required Future<PendingReturnCredit?> Function(String referenceNo)
      onLookupReference,
}) {
  return showPosDialog<List<AppliedReturnSettlement>>(
    context: context,
    builder: (ctx) => _ReturnCreditDialog(
      maxApply: maxApply,
      initial: initial,
      onLookupReference: onLookupReference,
    ),
  );
}

class _ReturnCreditDialog extends ConsumerStatefulWidget {
  const _ReturnCreditDialog({
    required this.maxApply,
    required this.initial,
    required this.onLookupReference,
  });

  final double maxApply;
  final List<AppliedReturnSettlement> initial;
  final Future<PendingReturnCredit?> Function(String referenceNo)
      onLookupReference;

  @override
  ConsumerState<_ReturnCreditDialog> createState() =>
      _ReturnCreditDialogState();
}

class _ReturnCreditDialogState extends ConsumerState<_ReturnCreditDialog> {
  late List<AppliedReturnSettlement> _settlements;
  late final PosTouchKeyboardController _typeKeyboard;
  final _billCtrl = TextEditingController();
  final _billFocus = FocusNode();
  String? _error;
  bool _scanBusy = false;
  bool _typeMode = false;

  bool get _scanMode => !_typeMode;

  @override
  void initState() {
    super.initState();
    _typeKeyboard = PosTouchKeyboardController();
    _settlements = [...widget.initial];
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ref.read(posTouchKeyboardControllerProvider).detach();
      _billFocus.requestFocus();
    });
  }

  @override
  void dispose() {
    ref.read(posTouchKeyboardControllerProvider).detach();
    _typeKeyboard.dispose();
    _billCtrl.dispose();
    _billFocus.dispose();
    super.dispose();
  }

  double get _selectedTotal =>
      _settlements.fold<double>(0, (s, r) => s + r.amount);

  void _bindTypeKeyboard() {
    _typeKeyboard.attach(
      PosTouchKeyboardSession(
        controller: _billCtrl,
        focusNode: _billFocus,
        kind: PosTouchInputKind.text,
        onChanged: () => setState(() {}),
      ),
      detachOnFocusLoss: false,
    );
  }

  void _setEntryMode(bool typeMode) {
    if (_typeMode == typeMode) return;
    setState(() => _typeMode = typeMode);
    ref.read(posTouchKeyboardControllerProvider).detach();
    if (typeMode) {
      _bindTypeKeyboard();
    } else {
      _typeKeyboard.detach();
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _billFocus.requestFocus();
    });
  }

  void _apply() => Navigator.pop(context, _settlements);

  Future<void> _lookupReturnBill() async {
    final refNo = _billCtrl.text.trim();
    if (refNo.isEmpty) {
      setState(() => _error = _scanMode
          ? 'Scan return bill barcode'
          : 'Enter return bill number');
      return;
    }

    setState(() {
      _scanBusy = true;
      _error = null;
    });

    try {
      final credit = await widget.onLookupReference(refNo);
      if (credit == null) {
        throw StateError('Return bill not found or already settled');
      }

      final apply = credit.creditRemaining.clamp(0, widget.maxApply).toDouble();
      if (apply <= 0) {
        throw StateError('Nothing left to apply from this return');
      }

      if (!mounted) return;
      setState(() {
        _settlements = [
          AppliedReturnSettlement(
            returnClientUuid: credit.clientUuid,
            returnReferenceNo: credit.referenceNo,
            amount: apply,
            returnId: credit.returnId,
          ),
        ];
      });
      _billCtrl.clear();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _scanBusy = false);
    }
  }

  Widget _buildBillField() {
    final decoration = InputDecoration(
      labelText: 'Return bill #',
      prefixIcon: Icon(
        _scanMode ? Icons.qr_code_scanner : Icons.keyboard_outlined,
      ),
    );

    if (_scanMode) {
      return PosTouchTextField(
        key: const ValueKey('return-bill-scan'),
        controller: _billCtrl,
        focusNode: _billFocus,
        autofocus: true,
        suppressNativeKeyboard: true,
        textCapitalization: TextCapitalization.characters,
        decoration: decoration,
        onSubmitted: (_) => _lookupReturnBill(),
      );
    }

    return TextField(
      key: const ValueKey('return-bill-type'),
      controller: _billCtrl,
      focusNode: _billFocus,
      showCursor: true,
      autofocus: true,
      textCapitalization: TextCapitalization.characters,
      decoration: decoration,
      onTap: _bindTypeKeyboard,
      onSubmitted: (_) => _lookupReturnBill(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PosProfessionalDialogShell(
      title: 'Settle return credit',
      subtitle: _scanMode
          ? 'Scan a return bill from a previous visit'
          : 'Enter a return bill from a previous visit',
      icon: Icons.account_balance_wallet_outlined,
      maxWidth: 580,
      maxBodyHeight: _typeMode ? 560 : 280,
      onClose: () {
        ref.read(posTouchKeyboardControllerProvider).detach();
        _typeKeyboard.detach();
        Navigator.pop(context);
      },
      footer: PosProfessionalDialogFooter(
        secondaryLabel: 'Cancel',
        primaryLabel: 'Apply credit',
        primaryEnabled: _selectedTotal > 0,
        onSecondary: () => Navigator.pop(context),
        onPrimary: _apply,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Apply up to ${formatPosMoney(widget.maxApply)} from a prior '
              'return bill. Inline returns on this sale use the Return sidebar.',
              style: TextStyle(
                fontSize: 13,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 14),
            SegmentedButton<bool>(
              segments: const [
                ButtonSegment(
                  value: false,
                  label: Text('Scan'),
                  icon: Icon(Icons.qr_code_scanner, size: 18),
                ),
                ButtonSegment(
                  value: true,
                  label: Text('Type'),
                  icon: Icon(Icons.keyboard_outlined, size: 18),
                ),
              ],
              selected: {_typeMode},
              onSelectionChanged: (selection) =>
                  _setEntryMode(selection.first),
            ),
            const SizedBox(height: 14),
            if (_error != null) ...[
              Text(_error!, style: const TextStyle(color: PosColors.red)),
              const SizedBox(height: 8),
            ],
            Text(
              _scanMode
                  ? 'Scan the return bill barcode with your scanner'
                  : 'Tap keys below to enter return bill reference',
              style: TextStyle(
                fontSize: 12,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _buildBillField()),
                const SizedBox(width: 10),
                FilledButton(
                  onPressed: _scanBusy ? null : _lookupReturnBill,
                  child: _scanBusy
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Find'),
                ),
              ],
            ),
            if (_typeMode) ...[
              const SizedBox(height: 12),
              ListenableBuilder(
                listenable: _typeKeyboard,
                builder: (context, _) => Material(
                  color: context.posStyles.cardBg,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: Theme.of(context).dividerColor),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: PosTouchTextKeyboard(controller: _typeKeyboard),
                  ),
                ),
              ),
            ],
            if (_selectedTotal > 0) ...[
              const SizedBox(height: 16),
              Text(
                'Selected ${formatPosMoney(_selectedTotal)}',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
