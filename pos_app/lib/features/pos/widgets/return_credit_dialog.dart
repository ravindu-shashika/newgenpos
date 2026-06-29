import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/pos_theme.dart';
import '../pos_currency.dart';
import '../models/return_models.dart';
import 'pos_professional_dialog.dart';
import 'pos_touch_text_field.dart';
import 'show_pos_dialog.dart';

Future<List<AppliedReturnSettlement>?> showReturnCreditDialog({
  required BuildContext context,
  required List<PendingReturnCredit> credits,
  required double maxApply,
  List<AppliedReturnSettlement> initial = const [],
  Future<PendingReturnCredit?> Function(String referenceNo)? onLookupReference,
  List<AppliedReturnSettlement> Function(double amount)? onManualAmount,
}) {
  return showPosDialog<List<AppliedReturnSettlement>>(
    context: context,
    builder: (ctx) => _ReturnCreditDialog(
      credits: credits,
      maxApply: maxApply,
      initial: initial,
      onLookupReference: onLookupReference,
      onManualAmount: onManualAmount,
    ),
  );
}

class _ReturnCreditDialog extends StatefulWidget {
  const _ReturnCreditDialog({
    required this.credits,
    required this.maxApply,
    required this.initial,
    this.onLookupReference,
    this.onManualAmount,
  });

  final List<PendingReturnCredit> credits;
  final double maxApply;
  final List<AppliedReturnSettlement> initial;
  final Future<PendingReturnCredit?> Function(String referenceNo)?
      onLookupReference;
  final List<AppliedReturnSettlement> Function(double amount)? onManualAmount;

  @override
  State<_ReturnCreditDialog> createState() => _ReturnCreditDialogState();
}

class _ReturnCreditDialogState extends State<_ReturnCreditDialog> {
  late List<AppliedReturnSettlement> _settlements;
  final _scanCtrl = TextEditingController();
  final _manualCtrl = TextEditingController();
  String? _error;
  bool _scanBusy = false;
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    _settlements = [...widget.initial];
  }

  @override
  void dispose() {
    _scanCtrl.dispose();
    _manualCtrl.dispose();
    super.dispose();
  }

  double get _selectedTotal =>
      _settlements.fold<double>(0, (s, r) => s + r.amount);

  double _amountForCredit(String clientUuid) {
    return _settlements
        .where((s) => s.returnClientUuid == clientUuid)
        .fold<double>(0, (sum, s) => sum + s.amount);
  }

  void _setCreditAmount(PendingReturnCredit credit, double amount) {
    final others = _settlements
        .where((s) => s.returnClientUuid != credit.clientUuid)
        .toList();
    if (amount <= 0) {
      setState(() => _settlements = others);
      return;
    }
    setState(() {
      _settlements = [
        ...others,
        AppliedReturnSettlement(
          returnClientUuid: credit.clientUuid,
          returnReferenceNo: credit.referenceNo,
          amount: amount,
          returnId: credit.returnId,
        ),
      ];
    });
  }

  void _apply() => Navigator.pop(context, _settlements);

  Future<void> _scanReturnBill() async {
    final lookup = widget.onLookupReference;
    if (lookup == null) return;

    final ref = _scanCtrl.text.trim();
    if (ref.isEmpty) {
      setState(() => _error = 'Scan or enter return bill number');
      return;
    }

    setState(() {
      _scanBusy = true;
      _error = null;
    });

    try {
      final credit = await lookup(ref);
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
        _tab = 2;
      });
      _scanCtrl.clear();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _scanBusy = false);
    }
  }

  void _applyManualAmount() {
    final builder = widget.onManualAmount;
    if (builder == null) return;

    final raw = _manualCtrl.text.trim();
    final amount = double.tryParse(raw);
    if (amount == null || amount <= 0) {
      setState(() => _error = 'Enter a valid return amount');
      return;
    }

    final settlements = builder(amount.clamp(0, widget.maxApply));
    if (settlements.isEmpty) {
      setState(() => _error = 'No pending return credit to apply');
      return;
    }

    setState(() {
      _error = null;
      _settlements = settlements;
      _tab = 2;
    });
    _manualCtrl.clear();
  }

  @override
  Widget build(BuildContext context) {
    return PosProfessionalDialogShell(
      title: 'Settle return credit',
      subtitle: 'Scan return bill or enter amount for this sale',
      icon: Icons.account_balance_wallet_outlined,
      maxWidth: 580,
      maxBodyHeight: 420,
      onClose: () => Navigator.pop(context),
      footer: PosProfessionalDialogFooter(
        secondaryLabel: 'Cancel',
        primaryLabel: 'Apply credit',
        primaryEnabled: _selectedTotal > 0 || widget.credits.isNotEmpty,
        onSecondary: () => Navigator.pop(context),
        onPrimary: _apply,
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Apply up to ${formatPosMoney(widget.maxApply)} against this sale',
            style: const TextStyle(fontSize: 13, color: PosColors.textMuted),
          ),
          const SizedBox(height: 12),
          SegmentedButton<int>(
            segments: const [
              ButtonSegment(value: 0, label: Text('Scan bill')),
              ButtonSegment(value: 1, label: Text('Manual')),
              ButtonSegment(value: 2, label: Text('Credits')),
            ],
            selected: {_tab},
            onSelectionChanged: (s) => setState(() => _tab = s.first),
          ),
          const SizedBox(height: 14),
          if (_error != null) ...[
            Text(_error!, style: const TextStyle(color: PosColors.red)),
            const SizedBox(height: 8),
          ],
          Expanded(child: _buildTabBody()),
          if (_selectedTotal > 0) ...[
            const SizedBox(height: 12),
            Text(
              'Selected ${formatPosMoney(_selectedTotal)}',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTabBody() {
    switch (_tab) {
      case 0:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Scan the return bill barcode or enter return reference',
              style: TextStyle(fontSize: 12, color: PosColors.textMuted),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: PosTouchTextField(
                    controller: _scanCtrl,
                    autofocus: true,
                    suppressNativeKeyboard: true,
                    decoration: const InputDecoration(
                      labelText: 'Return bill #',
                      prefixIcon: Icon(Icons.qr_code_scanner),
                    ),
                    onSubmitted: (_) => _scanReturnBill(),
                  ),
                ),
                const SizedBox(width: 10),
                FilledButton(
                  onPressed: _scanBusy ? null : _scanReturnBill,
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
          ],
        );
      case 1:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Enter return credit amount to settle on this sale',
              style: TextStyle(fontSize: 12, color: PosColors.textMuted),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _manualCtrl,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
                    ],
                    decoration: const InputDecoration(
                      labelText: 'Return amount',
                      prefixText: 'Rs ',
                    ),
                    onSubmitted: (_) => _applyManualAmount(),
                  ),
                ),
                const SizedBox(width: 10),
                FilledButton(
                  onPressed: _applyManualAmount,
                  child: const Text('Apply'),
                ),
              ],
            ),
          ],
        );
      default:
        if (widget.credits.isEmpty) {
          return const PosProfessionalEmptyState(
            message: 'No pending return credits for this customer.',
            icon: Icons.receipt_long_outlined,
          );
        }
        return ListView.separated(
          itemCount: widget.credits.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (_, i) {
            final credit = widget.credits[i];
            final amount = _amountForCredit(credit.clientUuid);
            return Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: PosColors.pageBg,
                border: Border.all(color: PosColors.border),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    credit.referenceNo,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  Text(
                    'Credit ${formatPosMoney(credit.creditRemaining)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: PosColors.textMuted,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: Slider(
                          value: amount.clamp(0, credit.creditRemaining),
                          max: credit.creditRemaining,
                          onChanged: (v) {
                            final room =
                                widget.maxApply - _selectedTotal + amount;
                            final next = v.clamp(0, room).toDouble();
                            _setCreditAmount(credit, next);
                          },
                        ),
                      ),
                      SizedBox(
                        width: 72,
                        child: Text(
                          formatPosMoney(amount),
                          textAlign: TextAlign.end,
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
    }
  }
}
