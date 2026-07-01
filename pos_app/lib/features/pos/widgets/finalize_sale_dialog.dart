import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/pos_ui_settings_provider.dart';
import '../../../core/theme/pos_theme.dart';
import '../pos_helpers.dart';
import '../pos_currency.dart';
import 'pos_amount_numpad.dart';
import 'pos_touch_keyboard_controller.dart';
import 'pos_touch_keyboard_host.dart';
import 'pos_touch_text_field.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

class FinalizeSaleResult {
  const FinalizeSaleResult({
    required this.paidAmount,
    required this.payingAmount,
    this.mixPayments,
    this.paymentReceiver = '',
    this.paymentNote = '',
    this.saleNote = '',
    this.staffNote = '',
    this.cardNumber = '',
    this.cardHolderName = '',
    this.cardType = '',
    this.chequeNo = '',
    this.printInvoice = false,
    this.sendWhatsapp = false,
  });

  final double paidAmount;
  final double payingAmount;
  final List<MixPaymentLine>? mixPayments;
  final String paymentReceiver;
  final String paymentNote;
  final String saleNote;
  final String staffNote;
  final String cardNumber;
  final String cardHolderName;
  final String cardType;
  final String chequeNo;
  final bool printInvoice;
  final bool sendWhatsapp;
}

Future<FinalizeSaleResult?> showFinalizeSaleDialog({
  required BuildContext context,
  required double grandTotal,
  required String paymentLabel,
  required String paidById,
  String initialSaleNote = '',
  String initialStaffNote = '',
  bool showPrintInvoiceOption = false,
  bool defaultPrintInvoice = false,
  bool showWhatsappOption = false,
  bool defaultSendWhatsapp = false,
  bool isMixPayment = false,
  List<PosPaymentMethod> paymentMethods = const [],
}) {
  return showPosDialog<FinalizeSaleResult>(
    context: context,
    builder: (ctx) => PosTouchKeyboardHost(
      expand: false,
      child: _FinalizeSaleDialog(
        grandTotal: grandTotal,
        paymentLabel: paymentLabel,
        paidById: paidById,
        initialSaleNote: initialSaleNote,
        initialStaffNote: initialStaffNote,
        showPrintInvoiceOption: showPrintInvoiceOption,
        defaultPrintInvoice: defaultPrintInvoice,
        showWhatsappOption: showWhatsappOption,
        defaultSendWhatsapp: defaultSendWhatsapp,
        isMixPayment: isMixPayment,
        paymentMethods: paymentMethods,
      ),
    ),
  );
}

const _cardTypes = ['Visa', 'Master Card'];

class _MixPaymentRowData {
  _MixPaymentRowData({
    required this.paidById,
    required double payingAmount,
    required double cashReceived,
  })  : payingCtrl = TextEditingController(
          text: payingAmount.toStringAsFixed(2),
        ),
        cashCtrl = TextEditingController(
          text: cashReceived.toStringAsFixed(2),
        );

  String paidById;
  final TextEditingController payingCtrl;
  final TextEditingController cashCtrl;

  void dispose() {
    payingCtrl.dispose();
    cashCtrl.dispose();
  }
}

class _FinalizeSaleDialog extends ConsumerStatefulWidget {
  const _FinalizeSaleDialog({
    required this.grandTotal,
    required this.paymentLabel,
    required this.paidById,
    required this.initialSaleNote,
    required this.initialStaffNote,
    required this.showPrintInvoiceOption,
    required this.defaultPrintInvoice,
    required this.showWhatsappOption,
    required this.defaultSendWhatsapp,
    required this.isMixPayment,
    required this.paymentMethods,
  });

  final double grandTotal;
  final String paymentLabel;
  final String paidById;
  final String initialSaleNote;
  final String initialStaffNote;
  final bool showPrintInvoiceOption;
  final bool defaultPrintInvoice;
  final bool showWhatsappOption;
  final bool defaultSendWhatsapp;
  final bool isMixPayment;
  final List<PosPaymentMethod> paymentMethods;

  bool get isCash => !isMixPayment && paidById == '1';
  bool get isCard => !isMixPayment && paidById == '3';

  @override
  ConsumerState<_FinalizeSaleDialog> createState() =>
      _FinalizeSaleDialogState();
}

class _FinalizeSaleDialogState extends ConsumerState<_FinalizeSaleDialog> {
  late final TextEditingController _cashReceivedCtrl;
  late final FocusNode _cashFocus;
  late final TextEditingController _cardNumberCtrl;
  late final TextEditingController _cardHolderCtrl;
  late final TextEditingController _chequeNoCtrl;
  late final TextEditingController _paymentReceiverCtrl;
  late final TextEditingController _paymentNoteCtrl;
  late final TextEditingController _saleNoteCtrl;
  late final TextEditingController _staffNoteCtrl;
  late bool _printInvoice;
  late bool _sendWhatsapp;
  bool _quickCashInitial = true;
  String _cardType = _cardTypes.first;
  late final List<_MixPaymentRowData> _mixRows;

  @override
  void initState() {
    super.initState();
    final total = _format(widget.grandTotal);
    _cashReceivedCtrl = TextEditingController(text: total);
    _cashFocus = FocusNode();
    _cardNumberCtrl = TextEditingController();
    _cardHolderCtrl = TextEditingController();
    _chequeNoCtrl = TextEditingController();
    _paymentReceiverCtrl = TextEditingController();
    _paymentNoteCtrl = TextEditingController();
    _saleNoteCtrl = TextEditingController(text: widget.initialSaleNote);
    _staffNoteCtrl = TextEditingController(text: widget.initialStaffNote);
    _printInvoice = widget.defaultPrintInvoice;
    _sendWhatsapp = widget.defaultSendWhatsapp;
    _mixRows = [
      _MixPaymentRowData(
        paidById: _defaultPaidById(),
        payingAmount: widget.grandTotal,
        cashReceived: widget.grandTotal,
      ),
    ];
    for (final row in _mixRows) {
      row.payingCtrl.addListener(_onAmountChanged);
      row.cashCtrl.addListener(_onAmountChanged);
    }
    _cashReceivedCtrl.addListener(_onAmountChanged);
    if (widget.isCash) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _cashFocus.requestFocus();
      });
    }
  }

  String _defaultPaidById() {
    for (final method in widget.paymentMethods) {
      if (method.id == '1') return '1';
    }
    return widget.paymentMethods.isNotEmpty
        ? widget.paymentMethods.first.id
        : '1';
  }

  @override
  void dispose() {
    _cashFocus.dispose();
    for (final row in _mixRows) {
      row.dispose();
    }
    for (final c in [
      _cashReceivedCtrl,
      _cardNumberCtrl,
      _cardHolderCtrl,
      _chequeNoCtrl,
      _paymentReceiverCtrl,
      _paymentNoteCtrl,
      _saleNoteCtrl,
      _staffNoteCtrl,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  void _markQuickCashUsed() {
    if (_quickCashInitial) {
      setState(() => _quickCashInitial = false);
    }
  }

  void _onAmountChanged() => setState(() {});

  double _parseAmount(TextEditingController ctrl) =>
      double.tryParse(ctrl.text.trim()) ?? 0;

  double get _tendered =>
      double.tryParse(_cashReceivedCtrl.text.trim()) ?? widget.grandTotal;

  double get _paidAmount {
    if (widget.isMixPayment) return _mixTotalPaying;
    if (!widget.isCash) return widget.grandTotal;
    if (_tendered >= widget.grandTotal) return widget.grandTotal;
    return _tendered < 0 ? 0 : _tendered;
  }

  List<MixPaymentLine> get _currentMixLines => _mixRows
      .map(
        (row) => MixPaymentLine(
          paidById: row.paidById,
          payingAmount: _parseAmount(row.payingCtrl),
          cashReceived: _parseAmount(row.cashCtrl),
        ),
      )
      .toList();

  MixPaymentTotals get _mixTotals => computeMixPaymentTotals(
        lines: _currentMixLines,
        grandTotal: widget.grandTotal,
      );

  double get _mixTotalPaying => _mixTotals.totalPaying;

  double get _totalPaying =>
      widget.isMixPayment ? _mixTotalPaying : _paidAmount;

  double get _change =>
      widget.isMixPayment ? _mixTotals.change : _singlePaymentChange;

  double get _singlePaymentChange => widget.isCash
      ? (_tendered - _paidAmount).clamp(0, double.infinity).toDouble()
      : 0;

  double get _due => widget.isMixPayment
      ? _mixTotals.due
      : (widget.grandTotal - _totalPaying).clamp(0, double.infinity);

  bool get _mixHasCardRow =>
      widget.isMixPayment && _mixRows.any((row) => row.paidById == '3');

  bool get _mixHasChequeRow =>
      widget.isMixPayment && _mixRows.any((row) => row.paidById == '4');

  String _format(double v) => v.toStringAsFixed(2);

  void _addMixPaymentRow() {
    final allocated = _mixTotalPaying;
    final remaining = (widget.grandTotal - allocated)
        .clamp(0, double.infinity)
        .toDouble();
    setState(() {
      final row = _MixPaymentRowData(
        paidById: _defaultPaidById(),
        payingAmount: remaining,
        cashReceived: remaining,
      );
      row.payingCtrl.addListener(_onAmountChanged);
      row.cashCtrl.addListener(_onAmountChanged);
      _mixRows.add(row);
    });
  }

  void _removeMixPaymentRow(int index) {
    if (_mixRows.length <= 1) return;
    setState(() {
      final row = _mixRows.removeAt(index);
      row.dispose();
    });
  }

  void _onMixPaidByChanged(int index, String? value) {
    if (value == null) return;
    setState(() {
      final row = _mixRows[index];
      row.paidById = value;
      if (value != '1') {
        final paying = _parseAmount(row.payingCtrl);
        row.cashCtrl.text = _format(paying);
      }
    });
  }

  void _onMixPayingAmountChanged(int index) {
    final row = _mixRows[index];
    if (row.paidById != '1') {
      final paying = _parseAmount(row.payingCtrl);
      row.cashCtrl.text = _format(paying);
    }
    _onAmountChanged();
  }

  void _submit() {
    if (!widget.isMixPayment) {
      _submitSinglePayment();
      return;
    }

    final mixPayments = normalizeMixPayments(_currentMixLines);
    if (mixPayments.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter at least one payment amount')),
      );
      return;
    }

    final totals = computeMixPaymentTotals(
      lines: mixPayments,
      grandTotal: widget.grandTotal,
    );
    if (_mixHasChequeRow && _chequeNoCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cheque number is required')),
      );
      return;
    }
    if (_mixHasCardRow &&
        (_cardNumberCtrl.text.trim().isEmpty ||
            _cardHolderCtrl.text.trim().isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Card number and holder name are required')),
      );
      return;
    }

    Navigator.pop(
      context,
      FinalizeSaleResult(
        paidAmount: totals.totalPaying,
        payingAmount: totals.totalPaying,
        mixPayments: mixPayments,
        paymentReceiver: _paymentReceiverCtrl.text.trim(),
        paymentNote: _paymentNoteCtrl.text.trim(),
        saleNote: _saleNoteCtrl.text.trim(),
        staffNote: _staffNoteCtrl.text.trim(),
        cardNumber: _mixHasCardRow ? _cardNumberCtrl.text.trim() : '',
        cardHolderName: _mixHasCardRow ? _cardHolderCtrl.text.trim() : '',
        cardType: _mixHasCardRow ? _cardType : '',
        chequeNo: _mixHasChequeRow ? _chequeNoCtrl.text.trim() : '',
        printInvoice: _printInvoice,
        sendWhatsapp: _sendWhatsapp,
      ),
    );
  }

  void _submitSinglePayment() {
    Navigator.pop(
      context,
      FinalizeSaleResult(
        paidAmount: _paidAmount,
        payingAmount: widget.isCash ? _tendered : widget.grandTotal,
        paymentReceiver: _paymentReceiverCtrl.text.trim(),
        paymentNote: _paymentNoteCtrl.text.trim(),
        saleNote: _saleNoteCtrl.text.trim(),
        staffNote: _staffNoteCtrl.text.trim(),
        cardNumber: _cardNumberCtrl.text.trim(),
        cardHolderName: _cardHolderCtrl.text.trim(),
        cardType: widget.isCard ? _cardType : '',
        printInvoice: _printInvoice,
        sendWhatsapp: _sendWhatsapp,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final touchKeyboard = ref.watch(posUiSettingsProvider).enableKeyboard;
    return PosProfessionalWideDialogShell(
      title: 'Finalize sale',
      subtitle: widget.paymentLabel,
      icon: Icons.point_of_sale_rounded,
      onClose: () => Navigator.pop(context),
      footer: Wrap(
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 16,
        runSpacing: 8,
        children: [
          PosProfessionalDialogFooter(
            primaryLabel: 'Submit',
            onPrimary: _submit,
          ),
          if (widget.showPrintInvoiceOption)
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Checkbox(
                  value: _printInvoice,
                  onChanged: (v) =>
                      setState(() => _printInvoice = v ?? false),
                ),
                Text('Print invoice'),
              ],
            ),
          if (widget.showWhatsappOption)
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Checkbox(
                  value: _sendWhatsapp,
                  onChanged: (v) =>
                      setState(() => _sendWhatsapp = v ?? false),
                ),
                Text('Send WhatsApp message'),
              ],
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (widget.isMixPayment) ...[
                      for (var i = 0; i < _mixRows.length; i++)
                        _buildMixPaymentRow(i),
                              SizedBox(height: 8),
                              Align(
                                alignment: Alignment.center,
                                child: FilledButton.icon(
                                  onPressed: _addMixPaymentRow,
                                  style: FilledButton.styleFrom(
                                    backgroundColor: context.posBrand.primary,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 10,
                                    ),
                                  ),
                                  icon: const Icon(Icons.add, size: 18),
                                  label: const Text('More Payment'),
                                ),
                              ),
                              if (_mixHasCardRow) ...[
                                SizedBox(height: 14),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.stretch,
                                        children: [
                                          _fieldLabel('Card Number'),
                                          PosTouchTextField(
                                            controller: _cardNumberCtrl,
                                            kind: PosTouchInputKind.number,
                                            decoration: InputDecoration(
                                              isDense: true,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.stretch,
                                        children: [
                                          _fieldLabel('Card Holder Name'),
                                          PosTouchTextField(
                                            controller: _cardHolderCtrl,
                                            textCapitalization:
                                                TextCapitalization.words,
                                            decoration: InputDecoration(
                                              isDense: true,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.stretch,
                                        children: [
                                          _fieldLabel('Card Type'),
                                          DropdownButtonFormField<String>(
                                            initialValue: _cardType,
                                            isExpanded: true,
                                            decoration: InputDecoration(
                                              isDense: true,
                                            ),
                                            items: _cardTypes
                                                .map(
                                                  (t) => DropdownMenuItem(
                                                    value: t,
                                                    child: Text(t),
                                                  ),
                                                )
                                                .toList(),
                                            onChanged: (v) {
                                              if (v == null) return;
                                              setState(() => _cardType = v);
                                            },
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                              if (_mixHasChequeRow) ...[
                                SizedBox(height: 14),
                                _fieldLabel('Cheque Number'),
                                PosTouchTextField(
                                  controller: _chequeNoCtrl,
                                  decoration:
                                      InputDecoration(isDense: true),
                                ),
                              ],
                              SizedBox(height: 14),
                            ] else if (widget.isCash) ...[
                              _fieldLabel(
                                'Cash Received',
                                tooltip:
                                    'Cash handed over by the customer. Example: sale is 300, customer gives 500 — enter 500.',
                              ),
                              if (touchKeyboard)
                                PosTouchTextField(
                                  controller: _cashReceivedCtrl,
                                  focusNode: _cashFocus,
                                  kind: PosTouchInputKind.amount,
                                  showQuickCash: true,
                                  autofocus: true,
                                  textAlign: TextAlign.right,
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  onChanged: (_) => _onAmountChanged(),
                                )
                              else ...[
                                PosAmountField(
                                  controller: _cashReceivedCtrl,
                                  focusNode: _cashFocus,
                                  onTap: () => _cashFocus.requestFocus(),
                                ),
                                SizedBox(height: 12),
                                PosAmountNumpad(
                                  controller: _cashReceivedCtrl,
                                  onChanged: _onAmountChanged,
                                  quickCashInitial: _quickCashInitial,
                                  onQuickCashUsed: _markQuickCashUsed,
                                ),
                              ],
                              SizedBox(height: 14),
                            ] else if (widget.isCard) ...[
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    flex: 5,
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.stretch,
                                      children: [
                                        _fieldLabel('Card Number'),
                                        PosTouchTextField(
                                          controller: _cardNumberCtrl,
                                          kind: PosTouchInputKind.number,
                                          autofocus: true,
                                          decoration: InputDecoration(
                                            isDense: true,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  SizedBox(width: 10),
                                  Expanded(
                                    flex: 5,
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.stretch,
                                      children: [
                                        _fieldLabel('Card Holder Name'),
                                        PosTouchTextField(
                                          controller: _cardHolderCtrl,
                                          textCapitalization:
                                              TextCapitalization.words,
                                          decoration: InputDecoration(
                                            isDense: true,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  SizedBox(width: 10),
                                  Expanded(
                                    flex: 3,
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.stretch,
                                      children: [
                                        _fieldLabel('Card Type'),
                                        DropdownButtonFormField<String>(
                                          initialValue: _cardType,
                                          isExpanded: true,
                                          decoration: InputDecoration(
                                            isDense: true,
                                          ),
                                          items: _cardTypes
                                              .map(
                                                (t) => DropdownMenuItem(
                                                  value: t,
                                                  child: Text(t),
                                                ),
                                              )
                                              .toList(),
                                          onChanged: (v) {
                                            if (v == null) return;
                                            setState(() => _cardType = v);
                                          },
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 14),
                            ],
                            _fieldLabel('Payment Receiver'),
                            PosTouchTextField(
                              controller: _paymentReceiverCtrl,
                              decoration: InputDecoration(isDense: true),
                            ),
                            SizedBox(height: 14),
                            _fieldLabel('Payment Note'),
                            PosTouchTextField(
                              controller: _paymentNoteCtrl,
                              maxLines: 3,
                              decoration: InputDecoration(
                                alignLabelWithHint: true,
                              ),
                            ),
                            SizedBox(height: 14),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.stretch,
                                    children: [
                                      _fieldLabel('Sale Note'),
                                      PosTouchTextField(
                                        controller: _saleNoteCtrl,
                                        maxLines: 3,
                                        decoration: InputDecoration(
                                          alignLabelWithHint: true,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.stretch,
                                    children: [
                                      _fieldLabel('Staff Note'),
                                      PosTouchTextField(
                                        controller: _staffNoteCtrl,
                                        maxLines: 3,
                                        decoration: InputDecoration(
                                          alignLabelWithHint: true,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      SizedBox(width: 16),
                      _PaymentSummaryPanel(
                        grandTotal: widget.grandTotal,
                        totalPaying: _totalPaying,
                        change: _change,
                        due: _due,
                      ),
                    ],
                  ),
                ),
              ),
    );
  }

  Widget _buildMixPaymentRow(int index) {
    final row = _mixRows[index];
    final methods = widget.paymentMethods.isNotEmpty
        ? widget.paymentMethods
        : [const PosPaymentMethod(id: '1', label: 'Cash', key: 'cash')];
    final selectedId = methods.any((m) => m.id == row.paidById)
        ? row.paidById
        : methods.first.id;
    final isCash = selectedId == '1';

    return Padding(
      padding: EdgeInsets.only(bottom: index < _mixRows.length - 1 ? 10 : 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _fieldLabel('Paying Amount', tooltip: 'Amount applied to sale'),
                PosTouchTextField(
                  controller: row.payingCtrl,
                  kind: PosTouchInputKind.amount,
                  textAlign: TextAlign.right,
                  decoration: InputDecoration(isDense: true),
                  onChanged: (_) => _onMixPayingAmountChanged(index),
                ),
              ],
            ),
          ),
          SizedBox(width: 10),
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _fieldLabel('Paid By'),
                DropdownButtonFormField<String>(
                  key: ValueKey('paid-by-$index-$selectedId'),
                  initialValue: selectedId,
                  isExpanded: true,
                  decoration: InputDecoration(isDense: true),
                  items: methods
                      .map(
                        (m) => DropdownMenuItem(
                          value: m.id,
                          child: Text(m.label),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => _onMixPaidByChanged(index, v),
                ),
              ],
            ),
          ),
          SizedBox(width: 10),
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (isCash)
                  _fieldLabel(
                    'Cash Received',
                    tooltip:
                        'Cash handed over by the customer. Example: sale is 300, customer gives 500 — enter 500.',
                  )
                else
                  SizedBox(height: 25),
                if (isCash)
                  PosTouchTextField(
                    controller: row.cashCtrl,
                    kind: PosTouchInputKind.amount,
                    textAlign: TextAlign.right,
                    decoration: InputDecoration(isDense: true),
                    onChanged: (_) => _onAmountChanged(),
                  )
                else
                  SizedBox(height: 48),
              ],
            ),
          ),
          if (_mixRows.length > 1) ...[
            SizedBox(width: 6),
            Padding(
              padding: const EdgeInsets.only(top: 24),
              child: IconButton(
                tooltip: 'Remove payment',
                style: IconButton.styleFrom(
                  backgroundColor: PosColors.red,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(40, 40),
                ),
                onPressed: () => _removeMixPaymentRow(index),
                icon: const Icon(Icons.close, size: 18),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _fieldLabel(String text, {String? tooltip}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Text(
            text,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
          if (tooltip != null) ...[
            SizedBox(width: 4),
            Tooltip(
              message: tooltip,
              child: Icon(
                Icons.info_outline,
                size: 16,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PaymentSummaryPanel extends StatelessWidget {
  const _PaymentSummaryPanel({
    required this.grandTotal,
    required this.totalPaying,
    required this.change,
    required this.due,
  });

  final double grandTotal;
  final double totalPaying;
  final double change;
  final double due;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 168,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      decoration: BoxDecoration(
        color: context.posBrand.primary,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _summaryBlock(context, 'Total Payable', grandTotal),
          SizedBox(height: 20),
          _summaryBlock(context, 'Total Paying', totalPaying),
          SizedBox(height: 20),
          _summaryBlock(context, 'Change', change),
          SizedBox(height: 20),
          _summaryBlock(context, 'Due', due),
        ],
      ),
    );
  }

  Widget _summaryBlock(BuildContext context, String label, double value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Theme.of(context).colorScheme.surface,
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
        SizedBox(height: 6),
        Text(
          formatPosMoney(value),
          style: TextStyle(
            color: Theme.of(context).colorScheme.surface,
            fontSize: 22,
            fontWeight: FontWeight.w500,
            height: 1.1,
          ),
        ),
      ],
    );
  }
}
