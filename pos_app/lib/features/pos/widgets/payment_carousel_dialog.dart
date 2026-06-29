import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import 'pos_toast.dart';
import '../pos_currency.dart';
import '../pos_helpers.dart';
import 'finalize_sale_dialog.dart';
import 'pos_amount_numpad.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

class PaymentOrderLine {
  const PaymentOrderLine({
    required this.name,
    required this.amount,
  });

  final String name;
  final double amount;
}

class _SplitPaymentEntry {
  _SplitPaymentEntry({
    required this.id,
    required this.paidById,
    required this.label,
    required this.subtitle,
    required this.amount,
    required this.icon,
    this.cardType,
    this.lastFour,
  });

  final String id;
  final String paidById;
  final String label;
  final String subtitle;
  final double amount;
  final IconData icon;
  final String? cardType;
  final String? lastFour;

  String get listTitle {
    if (paidById == '3' && lastFour != null && lastFour!.isNotEmpty) {
      return '$label ending $lastFour';
    }
    return label;
  }
}

enum _SplitInputMode { cash, card }

class PaymentCarouselResult {
  const PaymentCarouselResult({
    required this.finalize,
    required this.paidById,
    required this.orderDiscountType,
    required this.orderDiscountValue,
    this.couponCode,
    this.couponId,
    this.couponDiscount = 0,
    this.mixPayments,
    this.isHoldOrder = false,
  });

  final FinalizeSaleResult finalize;
  final String paidById;
  final String orderDiscountType;
  final double orderDiscountValue;
  final String? couponCode;
  final int? couponId;
  final double couponDiscount;
  final List<MixPaymentLine>? mixPayments;
  final bool isHoldOrder;
}

class _CheckoutTab {
  const _CheckoutTab({
    required this.key,
    required this.label,
    required this.icon,
    this.method,
  });

  final String key;
  final String label;
  final IconData icon;
  final PosPaymentMethod? method;
}

Future<PaymentCarouselResult?> showPaymentCarouselDialog({
  required BuildContext context,
  required List<PosPaymentMethod> methods,
  required double subtotal,
  required double lineTax,
  required double orderTaxRate,
  required double shippingCost,
  required String initialDiscountType,
  required double initialDiscountValue,
  required String initialCouponCode,
  int? initialCouponId,
  double initialCouponDiscount = 0,
  required List<LocalCouponRow> coupons,
  String initialSaleNote = '',
  String initialStaffNote = '',
  bool showPrintInvoiceOption = false,
  bool defaultPrintInvoice = false,
  bool showWhatsappOption = false,
  bool defaultSendWhatsapp = false,
  List<PosPaymentMethod> mixMethods = const [],
  double returnCredit = 0,
  VoidCallback? onReturnCreditTap,
  List<PaymentOrderLine> orderLines = const [],
  double discountTotal = 0,
  double orderTax = 0,
  String stationLabel = 'Station 01',
  String terminalLabel = 'Terminal 01',
}) {
  return showPosDialog<PaymentCarouselResult>(
    context: context,
    builder: (ctx) => _PaymentCarouselDialog(
      methods: methods.where((m) => !isExcludedPaymentMethod(m)).toList(),
      subtotal: subtotal,
      lineTax: lineTax,
      orderTaxRate: orderTaxRate,
      shippingCost: shippingCost,
      initialDiscountType: initialDiscountType,
      initialDiscountValue: initialDiscountValue,
      initialCouponCode: initialCouponCode,
      initialCouponId: initialCouponId,
      initialCouponDiscount: initialCouponDiscount,
      coupons: coupons,
      initialSaleNote: initialSaleNote,
      initialStaffNote: initialStaffNote,
      showPrintInvoiceOption: showPrintInvoiceOption,
      defaultPrintInvoice: defaultPrintInvoice,
      showWhatsappOption: showWhatsappOption,
      defaultSendWhatsapp: defaultSendWhatsapp,
      mixMethods: mixMethods,
      returnCredit: returnCredit,
      onReturnCreditTap: onReturnCreditTap,
      orderLines: orderLines,
      discountTotal: discountTotal,
      orderTax: orderTax,
      stationLabel: stationLabel,
      terminalLabel: terminalLabel,
    ),
  );
}

class _PaymentCarouselDialog extends StatefulWidget {
  const _PaymentCarouselDialog({
    required this.methods,
    required this.subtotal,
    required this.lineTax,
    required this.orderTaxRate,
    required this.shippingCost,
    required this.initialDiscountType,
    required this.initialDiscountValue,
    required this.initialCouponCode,
    required this.initialCouponId,
    required this.initialCouponDiscount,
    required this.coupons,
    required this.initialSaleNote,
    required this.initialStaffNote,
    required this.showPrintInvoiceOption,
    required this.defaultPrintInvoice,
    required this.showWhatsappOption,
    required this.defaultSendWhatsapp,
    required this.mixMethods,
    required this.returnCredit,
    this.onReturnCreditTap,
    this.orderLines = const [],
    this.discountTotal = 0,
    this.orderTax = 0,
    this.stationLabel = 'Station 01',
    this.terminalLabel = 'Terminal 01',
  });

  final List<PosPaymentMethod> methods;
  final double subtotal;
  final double lineTax;
  final double orderTaxRate;
  final double shippingCost;
  final String initialDiscountType;
  final double initialDiscountValue;
  final String initialCouponCode;
  final int? initialCouponId;
  final double initialCouponDiscount;
  final List<LocalCouponRow> coupons;
  final String initialSaleNote;
  final String initialStaffNote;
  final bool showPrintInvoiceOption;
  final bool defaultPrintInvoice;
  final bool showWhatsappOption;
  final bool defaultSendWhatsapp;
  final List<PosPaymentMethod> mixMethods;
  final double returnCredit;
  final VoidCallback? onReturnCreditTap;
  final List<PaymentOrderLine> orderLines;
  final double discountTotal;
  final double orderTax;
  final String stationLabel;
  final String terminalLabel;

  @override
  State<_PaymentCarouselDialog> createState() => _PaymentCarouselDialogState();
}

class _PaymentCarouselDialogState extends State<_PaymentCarouselDialog> {
  static const _panelHeight = 420.0;
  static const _splitPanelHeight = 540.0;
  static const _splitNumpadHeight = 196.0;

  late final List<_CheckoutTab> _tabs;
  late int _selectedIndex;
  bool _busy = false;

  late String _orderDiscountType;
  late double _orderDiscountValue;
  late String? _couponCode;
  late int? _couponId;
  late double _couponDiscount;

  late final TextEditingController _cashReceivedCtrl;
  late final TextEditingController _mixAmountCtrl;
  late final TextEditingController _cardNumberCtrl;
  late final TextEditingController _cardHolderCtrl;
  late final TextEditingController _chequeNoCtrl;
  late final TextEditingController _saleNoteCtrl;
  String _cardType = 'Visa';
  bool _printInvoice = false;
  bool _sendWhatsapp = false;
  final List<_SplitPaymentEntry> _splitPayments = [];
  int _splitPaymentSeq = 0;
  _SplitInputMode _splitInputMode = _SplitInputMode.cash;

  List<_CheckoutTab> _buildOrderedTabs() {
    final byKey = <String, PosPaymentMethod>{
      for (final method in widget.methods) method.key: method,
    };
    final tabs = <_CheckoutTab>[];
    for (final key in const ['cash', 'card', 'mix', 'points']) {
      final method = byKey.remove(key);
      if (method != null) {
        tabs.add(
          _CheckoutTab(
            key: method.key,
            label: _displayLabel(method),
            icon: paymentMethodIcon(method.key),
            method: method,
          ),
        );
      }
    }
    for (final method in byKey.values) {
      tabs.add(
        _CheckoutTab(
          key: method.key,
          label: _displayLabel(method),
          icon: paymentMethodIcon(method.key),
          method: method,
        ),
      );
    }
    return tabs;
  }

  String _displayLabel(PosPaymentMethod method) {
    if (method.key == 'mix') return 'Split Payment';
    if (method.key == 'card') return 'Credit/Debit Card';
    if (method.key == 'gift_card') return 'Gift Card';
    return method.label;
  }

  _CheckoutTab get _currentTab => _tabs[_selectedIndex];

  @override
  void initState() {
    super.initState();
    _tabs = _buildOrderedTabs();
    _selectedIndex = _resolveInitialIndex();

    _orderDiscountType = widget.initialDiscountType;
    _orderDiscountValue = widget.initialDiscountValue;
    _couponCode =
        widget.initialCouponCode.isEmpty ? null : widget.initialCouponCode;
    _couponId = widget.initialCouponId;
    _couponDiscount = widget.initialCouponDiscount;

    final total = '0';
    _cashReceivedCtrl = TextEditingController(text: total);
    _mixAmountCtrl = TextEditingController(text: total);
    _cardNumberCtrl = TextEditingController();
    _cardHolderCtrl = TextEditingController();
    _chequeNoCtrl = TextEditingController();
    _saleNoteCtrl = TextEditingController(text: widget.initialSaleNote);
    _printInvoice = widget.defaultPrintInvoice;
    _sendWhatsapp = widget.defaultSendWhatsapp;
    _cashReceivedCtrl.addListener(() => setState(() {}));
    _mixAmountCtrl.addListener(() => setState(() {}));
  }

  int _resolveInitialIndex() {
    final cashIdx = _tabs.indexWhere((t) => t.key == 'cash');
    return cashIdx >= 0 ? cashIdx : 0;
  }

  @override
  void dispose() {
    _cashReceivedCtrl.dispose();
    _mixAmountCtrl.dispose();
    _cardNumberCtrl.dispose();
    _cardHolderCtrl.dispose();
    _chequeNoCtrl.dispose();
    _saleNoteCtrl.dispose();
    super.dispose();
  }

  double get _discountAmount => _orderDiscountType == 'Percentage'
      ? widget.subtotal * (_orderDiscountValue / 100)
      : _orderDiscountValue;

  double get _grandTotalBeforeCoupon {
    final totalPrice = widget.subtotal + widget.lineTax;
    final orderTax =
        (totalPrice - _discountAmount) * (widget.orderTaxRate / 100);
    return totalPrice +
        orderTax +
        widget.shippingCost -
        _discountAmount;
  }

  double get _grandTotal =>
      (_grandTotalBeforeCoupon - _couponDiscount - widget.returnCredit)
          .clamp(0, double.infinity)
          .toDouble();

  double get _cashReceived =>
      double.tryParse(_cashReceivedCtrl.text.trim()) ?? 0;

  double get _cashPaid {
    if (_cashReceived >= _grandTotal) return _grandTotal;
    return _cashReceived < 0 ? 0 : _cashReceived;
  }

  double get _cashChange =>
      (_cashReceived - _cashPaid).clamp(0, double.infinity).toDouble();

  void _onAmountChanged() => setState(() {});

  void _setTendered(double amount) {
    final text = amount % 1 == 0
        ? amount.toStringAsFixed(0)
        : amount.toStringAsFixed(2);
    _cashReceivedCtrl.text = text;
    _cashReceivedCtrl.selection = TextSelection.collapsed(offset: text.length);
    _onAmountChanged();
  }

  void _applyExactChange() => _setTendered(_grandTotal);

  Widget _quickCashCell(int index, void Function(double) onTap) {
    if (index >= kPosPaymentQuickCashAmounts.length) {
      return const SizedBox.shrink();
    }
    final amount = kPosPaymentQuickCashAmounts[index];
    return _QuickCashButton(
      label: formatPosMoneyLabel(amount),
      onTap: () => onTap(amount.toDouble()),
    );
  }

  Widget _buildQuickCashButtons(void Function(double) onTap) {
    const labelStyle = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w700,
      letterSpacing: 0.8,
      color: PosColors.textMuted,
    );

    const amounts = kPosPaymentQuickCashAmounts;
    const columns = 5;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('QUICK DENOMINATIONS', style: labelStyle),
        const SizedBox(height: 10),
        LayoutBuilder(
          builder: (context, constraints) {
            const gap = 8.0;
            final rows = (amounts.length / columns).ceil();
            final rowHeight =
                ((constraints.maxHeight > 0 ? constraints.maxHeight : 120) -
                        gap * (rows - 1)) /
                    rows;
            return Column(
              children: [
                for (var r = 0; r < rows; r++) ...[
                  if (r > 0) const SizedBox(height: gap),
                  SizedBox(
                    height: rowHeight.clamp(40, 52),
                    child: Row(
                      children: [
                        for (var c = 0; c < columns; c++) ...[
                          if (c > 0) const SizedBox(width: gap),
                          Expanded(
                            child: _quickCashCell(r * columns + c, onTap),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ],
            );
          },
        ),
      ],
    );
  }

  void _holdOrder() {
    Navigator.pop(
      context,
      PaymentCarouselResult(
        isHoldOrder: true,
        paidById: '1',
        orderDiscountType: _orderDiscountType,
        orderDiscountValue: _orderDiscountValue,
        couponCode: _couponCode,
        couponId: _couponId,
        couponDiscount: _couponDiscount,
        finalize: const FinalizeSaleResult(
          paidAmount: 0,
          payingAmount: 0,
        ),
      ),
    );
  }

  double get _splitTotalPaying =>
      _splitPayments.fold<double>(0, (sum, entry) => sum + entry.amount);

  double get _splitRemaining =>
      (_grandTotal - _splitTotalPaying).clamp(0, double.infinity).toDouble();

  bool get _splitReady =>
      _splitPayments.isNotEmpty && _splitRemaining <= 0.009;

  void _syncMixAmountToRemaining() {
    final text = _splitRemaining.toStringAsFixed(2);
    _mixAmountCtrl.text = text;
    _mixAmountCtrl.selection = TextSelection.collapsed(offset: text.length);
  }

  void _setMixAmount(double amount) {
    final text =
        amount % 1 == 0 ? amount.toStringAsFixed(0) : amount.toStringAsFixed(2);
    _mixAmountCtrl.text = text;
    _mixAmountCtrl.selection = TextSelection.collapsed(offset: text.length);
    setState(() {});
  }

  double get _mixApplyAmount =>
      double.tryParse(_mixAmountCtrl.text.trim()) ?? 0;

  void _addSplitPayment({required bool isCash}) {
    final amount = _mixApplyAmount;
    if (amount <= 0) {
      _snack('Enter an amount to apply');
      return;
    }
    if (amount > _splitRemaining + 0.009) {
      _snack('Amount exceeds remaining balance');
      return;
    }

    if (isCash) {
      setState(() {
        _splitPayments.add(
          _SplitPaymentEntry(
            id: '${_splitPaymentSeq++}',
            paidById: '1',
            label: 'Cash',
            subtitle: 'Received',
            amount: amount,
            icon: Icons.payments_outlined,
          ),
        );
        _syncMixAmountToRemaining();
      });
      return;
    }

    final lastFour = _cardNumberCtrl.text.trim();
    setState(() {
      _splitPayments.add(
        _SplitPaymentEntry(
          id: '${_splitPaymentSeq++}',
          paidById: '3',
          label: _cardType,
          subtitle: 'Approved',
          amount: amount,
          icon: Icons.credit_card_outlined,
          cardType: _cardType,
          lastFour: lastFour.isEmpty ? null : lastFour,
        ),
      );
      _cardNumberCtrl.clear();
      _syncMixAmountToRemaining();
    });
  }

  void _resetSplitCardForm() {
    setState(() {
      _cardNumberCtrl.clear();
      _syncMixAmountToRemaining();
    });
  }

  String get _mixAmountLabel {
    final amount = _mixApplyAmount;
    return _splitInputMode == _SplitInputMode.cash
        ? 'Apply ${formatPosMoney(amount)} Cash →'
        : 'Save Card to Order';
  }

  void _removeSplitPayment(String id) {
    setState(() {
      _splitPayments.removeWhere((entry) => entry.id == id);
      _syncMixAmountToRemaining();
    });
  }

  PaymentCarouselResult _paymentResult({
    required String paidById,
    required FinalizeSaleResult finalize,
    List<MixPaymentLine>? mixPayments,
  }) {
    return PaymentCarouselResult(
      paidById: paidById,
      finalize: finalize,
      mixPayments: mixPayments,
      orderDiscountType: _orderDiscountType,
      orderDiscountValue: _orderDiscountValue,
      couponCode: _couponCode,
      couponId: _couponId,
      couponDiscount: _couponDiscount,
    );
  }

  Future<void> _completePayment() async {
    if (_busy) return;

    final method = _currentTab.method!;

    if (method.key == 'mix') {
      if (!_splitReady) {
        _snack('Add payments until remaining balance is ${formatPosMoney(0)}');
        return;
      }

      final mixPayments = normalizeMixPayments([
        for (final entry in _splitPayments)
          MixPaymentLine(
            paidById: entry.paidById,
            payingAmount: entry.amount,
            cashReceived: entry.paidById == '1' ? entry.amount : entry.amount,
          ),
      ]);
      final totals = computeMixPaymentTotals(
        lines: mixPayments,
        grandTotal: _grandTotal,
      );
      _SplitPaymentEntry? firstCard;
      for (final entry in _splitPayments) {
        if (entry.paidById == '3') {
          firstCard = entry;
          break;
        }
      }

      Navigator.pop(
        context,
        _paymentResult(
          paidById: mixPayments.first.paidById,
          finalize: FinalizeSaleResult(
            paidAmount: totals.totalPaying,
            payingAmount: totals.totalPaying,
            mixPayments: mixPayments,
            saleNote: _saleNoteCtrl.text.trim(),
            staffNote: widget.initialStaffNote,
            cardNumber: firstCard?.lastFour ?? '',
            cardHolderName: '',
            cardType: firstCard?.cardType ?? '',
            chequeNo: '',
            printInvoice: _printInvoice,
            sendWhatsapp: _sendWhatsapp,
          ),
          mixPayments: mixPayments,
        ),
      );
      return;
    }

    final isCash = method.key == 'cash' || method.id == '1';
    final paid = isCash ? _cashPaid : _grandTotal;
    final paying = isCash ? _cashReceived : _grandTotal;

    if (isCash && paid < _grandTotal) {
      _snack('Amount tendered must cover the total due');
      return;
    }

    Navigator.pop(
      context,
      _paymentResult(
        paidById: method.id,
        finalize: FinalizeSaleResult(
          paidAmount: paid,
          payingAmount: paying,
          saleNote: _saleNoteCtrl.text.trim(),
          staffNote: widget.initialStaffNote,
          cardNumber: method.key == 'card' ? _cardNumberCtrl.text.trim() : '',
          cardHolderName:
              method.key == 'card' ? _cardHolderCtrl.text.trim() : '',
          cardType: method.key == 'card' ? _cardType : '',
          chequeNo: method.key == 'cheque' ? _chequeNoCtrl.text.trim() : '',
          printInvoice: _printInvoice,
          sendWhatsapp: _sendWhatsapp,
        ),
      ),
    );
  }

  double get _taxTotal => widget.lineTax + widget.orderTax;

  String get _money => formatPosMoney(_grandTotal);

  void _snack(String msg) {
    PosToast.show(context, msg, type: PosToastType.info);
  }

  @override
  Widget build(BuildContext context) {
    if (_tabs.isEmpty) {
      return PosProfessionalDialog(
        title: 'Payment',
        subtitle: 'Terminal configuration',
        icon: Icons.payments_outlined,
        maxWidth: 440,
        maxBodyHeight: 80,
        body: const Text(
          'No payment methods are configured for this terminal.',
          style: TextStyle(
            fontSize: 14,
            height: 1.5,
            color: PosColors.textPrimary,
          ),
        ),
        primaryLabel: 'Close',
        onPrimary: () => Navigator.pop(context),
      );
    }

    final isCash = _currentTab.key == 'cash' || _currentTab.method?.id == '1';
    final isCard = _currentTab.key == 'card' || _currentTab.method?.id == '3';
    final isMix = _currentTab.key == 'mix';

    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      clipBehavior: Clip.antiAlias,
      child: SizedBox(
        width: 920,
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.sizeOf(context).height * 0.92,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 8, 0),
                child: Stack(
                  clipBehavior: Clip.none,
                  alignment: Alignment.topCenter,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(40, 8, 40, 0),
                      child: Column(
                        children: [
                          const Text(
                            'Select Payment Method',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              color: PosColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 14),
                          const Text(
                            'TOTAL DUE',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.1,
                              color: PosColors.textMuted,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _money,
                            style: const TextStyle(
                              fontSize: 40,
                              fontWeight: FontWeight.w800,
                              color: PosColors.blue,
                              height: 1.05,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Positioned(
                      right: 0,
                      top: 0,
                      child: IconButton(
                        onPressed: _busy ? null : () => Navigator.pop(context),
                        tooltip: 'Close',
                        icon: const Icon(
                          Icons.close_rounded,
                          color: PosColors.textMuted,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 18, 24, 0),
                child: _PaymentMethodTabs(
                  tabs: _tabs,
                  selectedIndex: _selectedIndex,
                  onChanged: (i) {
                    setState(() {
                      _selectedIndex = i;
                      if (_tabs[i].key == 'mix') {
                        _syncMixAmountToRemaining();
                      }
                    });
                  },
                ),
              ),
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 18, 24, 12),
                  child: SizedBox(
                    height: isMix ? _splitPanelHeight : _panelHeight,
                    child: isMix
                        ? Row(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Expanded(
                                flex: 11,
                                child: _buildLeftPanel(_currentTab.method!),
                              ),
                              const SizedBox(width: 20),
                              Expanded(
                                flex: 9,
                                child: _PaymentSplitSummaryPanel(
                                  totalDue: _grandTotal,
                                  payments: _splitPayments,
                                  remaining: _splitRemaining,
                                  canComplete: _splitReady,
                                  busy: _busy,
                                  applyLabel: _mixAmountLabel,
                                  showApplyButton:
                                      _splitInputMode == _SplitInputMode.cash,
                                  onApply: () =>
                                      _addSplitPayment(isCash: true),
                                  onRemove: _removeSplitPayment,
                                  onComplete: _completePayment,
                                ),
                              ),
                            ],
                          )
                        : isCard
                            ? Row(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Expanded(
                                    flex: 11,
                                    child: _buildCardPanel(),
                                  ),
                                  const SizedBox(width: 20),
                                  Expanded(
                                    flex: 9,
                                    child: _CardDigitNumpad(
                                      controller: _cardNumberCtrl,
                                      onChanged: () => setState(() {}),
                                    ),
                                  ),
                                ],
                              )
                            : isCash
                                ? Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.stretch,
                                    children: [
                                      Expanded(
                                        flex: 11,
                                        child: _buildCashPanel(),
                                      ),
                                      const SizedBox(width: 20),
                                      Expanded(
                                        flex: 9,
                                        child: PosAmountNumpad(
                                          controller: _cashReceivedCtrl,
                                          onChanged: _onAmountChanged,
                                          showQuickCash: false,
                                          showClearButton: true,
                                          fillHeight: true,
                                          largeTouch: true,
                                          keyOrder:
                                              PosNumpadKeyOrder.calculator,
                                          lightKeys: true,
                                        ),
                                      ),
                                    ],
                                  )
                                : _buildLeftPanel(_currentTab.method!),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                child: Row(
                  children: [
                    if (!isMix)
                      OutlinedButton.icon(
                        onPressed: _busy ? null : _holdOrder,
                        icon: const Icon(Icons.pause_circle_outline, size: 20),
                        label: const Text('Hold Order'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 52),
                          foregroundColor: PosColors.red,
                          side: BorderSide(
                            color: PosColors.red.withValues(alpha: 0.35),
                          ),
                          backgroundColor:
                              PosColors.red.withValues(alpha: 0.08),
                          padding: const EdgeInsets.symmetric(horizontal: 22),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    if (!isMix) const Spacer(),
                    if (!isMix)
                      SizedBox(
                        width: 340,
                        child: FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: PosColors.primary,
                            minimumSize: const Size(double.infinity, 56),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          onPressed: _busy ? null : _completePayment,
                          icon: _busy
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(Icons.check_circle_outline,
                                  size: 22),
                          label: Text(
                            _busy ? 'Processing…' : 'Complete Transaction',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
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
    );
  }

  Widget _buildLeftPanel(PosPaymentMethod method) {
    if (method.key == 'mix') {
      return _buildSplitPanel();
    }

    if (method.key == 'cash' || method.id == '1') {
      return _buildCashPanel();
    }

    if (method.key == 'card' || method.id == '3') {
      return _buildCardPanel();
    }

    if (method.key == 'gift_card' || method.id == '2') {
      return _buildGiftCardPanel();
    }

    if (method.key == 'cheque' || method.id == '4') {
      return _buildChequePanel();
    }

    return Center(
      child: Text(
        'Confirm payment of ${formatPosMoney(_grandTotal)} via ${method.label}.',
        textAlign: TextAlign.center,
        style: const TextStyle(fontSize: 15),
      ),
    );
  }

  Widget _buildSplitPanel() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _SplitInputModeTabs(
          mode: _splitInputMode,
          onChanged: (mode) => setState(() => _splitInputMode = mode),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: SingleChildScrollView(
            physics: const ClampingScrollPhysics(),
            child: _splitInputMode == _SplitInputMode.cash
                ? _buildSplitCashFields()
                : _buildSplitCardFields(),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: _splitNumpadHeight,
          child: PosAmountNumpad(
            controller: _mixAmountCtrl,
            onChanged: () => setState(() {}),
            showQuickCash: false,
            fillHeight: true,
            largeTouch: true,
          ),
        ),
        if (_splitInputMode == _SplitInputMode.card) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _resetSplitCardForm,
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 44),
                    side: const BorderSide(color: PosColors.border),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text('Cancel'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: FilledButton.icon(
                  onPressed: () => _addSplitPayment(isCash: false),
                  style: FilledButton.styleFrom(
                    backgroundColor: PosColors.primary,
                    minimumSize: const Size(0, 44),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  icon: const Icon(Icons.save_outlined, size: 18),
                  label: const Text(
                    'Save Card to Order',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildSplitCashFields() {
    final display = _mixAmountCtrl.text.trim().isEmpty
        ? '0.00'
        : (double.tryParse(_mixAmountCtrl.text.trim()) ?? 0)
            .toStringAsFixed(2);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _SplitCashAmountField(amount: display),
        const SizedBox(height: 14),
        _buildQuickCashButtons(_setMixAmount),
      ],
    );
  }

  Widget _buildSplitCardFields() {
    final display = _mixAmountCtrl.text.trim().isEmpty
        ? '0.00'
        : (double.tryParse(_mixAmountCtrl.text.trim()) ?? 0)
            .toStringAsFixed(2);
    const cardTypes = ['Visa', 'Amex', 'Master Card'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Expanded(
              child: Text(
                'Add Manual Card',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: PosColors.textPrimary,
                ),
              ),
            ),
            OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.contactless_outlined, size: 18),
              label: const Text('Swipe Card'),
              style: OutlinedButton.styleFrom(
                foregroundColor: PosColors.textPrimary,
                side: const BorderSide(color: PosColors.border),
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            for (final type in cardTypes) ...[
              Expanded(
                child: _SplitCardNetworkButton(
                  label: type == 'Master Card' ? 'MASTER' : type.toUpperCase(),
                  selected: _cardType == type,
                  onTap: () => setState(() => _cardType = type),
                ),
              ),
              if (type != cardTypes.last) const SizedBox(width: 8),
            ],
          ],
        ),
        const SizedBox(height: 12),
        _TenderedAmountField(
          label: 'Amount to Charge on Card',
          value: formatPosMoney(
            double.tryParse(display) ?? 0,
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _cardNumberCtrl,
          keyboardType: TextInputType.number,
          maxLength: 4,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            labelText: 'Last 4 Digits (Optional)',
            counterText: '',
            hintText: 'XXXX',
            helperText: 'Used for receipt identification.',
            helperMaxLines: 2,
            filled: true,
            fillColor: Colors.white,
            isDense: true,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: PosColors.border),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCashPanel() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: _AmountStatusBox(
                label: 'AMOUNT TENDERED',
                value: formatPosMoney(_cashReceived),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _AmountStatusBox(
                label: 'CHANGE DUE',
                value: formatPosMoney(_cashChange),
                valueColor: PosColors.red,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Expanded(child: _buildQuickCashButtons(_setTendered)),
      ],
    );
  }

  Widget _buildCardPanel() {
    const cardTypes = ['Visa', 'Master Card', 'Amex'];
    final digits = _cardNumberCtrl.text.trim();
    final masked = digits.isEmpty
        ? '• • • •'
        : digits.padRight(4, '•').split('').join(' ');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'MANUAL ENTRY',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.8,
                      color: PosColors.textMuted,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${widget.terminalLabel} - ${widget.stationLabel}',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: PosColors.primary,
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Text(
                  'Total Due',
                  style: TextStyle(
                    fontSize: 12,
                    color: PosColors.textMuted,
                  ),
                ),
                Text(
                  _money,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: PosColors.textPrimary,
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Icon(Icons.lock_outline, size: 16, color: PosColors.primary),
            const SizedBox(width: 6),
            Text(
              'SECURE TRANSACTION',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.6,
                color: PosColors.primary.withValues(alpha: 0.9),
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),
        const Text(
          'Card Type',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: PosColors.textPrimary,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            for (final type in cardTypes) ...[
              Expanded(
                child: _CardTypeButton(
                  label: type == 'Master Card' ? 'Mastercard' : type,
                  selected: _cardType == type,
                  onTap: () => setState(() => _cardType = type),
                ),
              ),
              if (type != cardTypes.last) const SizedBox(width: 8),
            ],
          ],
        ),
        const SizedBox(height: 18),
        const Text(
          'Last 4 Digits',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: PosColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          height: 56,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: PosColors.primary, width: 1.5),
          ),
          child: Text(
            masked,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              letterSpacing: 6,
              color: PosColors.textPrimary,
            ),
          ),
        ),
        const Spacer(),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.verified_user_outlined,
                size: 14, color: PosColors.textMuted.withValues(alpha: 0.8)),
            const SizedBox(width: 4),
            Text(
              'PCI Compliant',
              style: TextStyle(fontSize: 11, color: PosColors.textMuted),
            ),
            const SizedBox(width: 16),
            Icon(Icons.shield_outlined,
                size: 14, color: PosColors.textMuted.withValues(alpha: 0.8)),
            const SizedBox(width: 4),
            Text(
              'End-to-End Encryption',
              style: TextStyle(fontSize: 11, color: PosColors.textMuted),
            ),
          ],
        ),
        const SizedBox(height: 4),
      ],
    );
  }

  Widget _buildGiftCardPanel() {
    return Center(
      child: Text(
        'Enter gift card details or scan the card,\n'
        'then tap Complete Payment.',
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: 15,
          color: PosColors.textMuted.withValues(alpha: 0.95),
          height: 1.5,
        ),
      ),
    );
  }

  Widget _buildChequePanel() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: _chequeNoCtrl,
          decoration: InputDecoration(
            labelText: 'Cheque number',
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: PosColors.border),
            ),
          ),
        ),
        const Spacer(),
        Text(
          'Enter the cheque number, then tap Complete Payment.',
          style: TextStyle(
            fontSize: 13,
            color: PosColors.textMuted.withValues(alpha: 0.9),
          ),
        ),
      ],
    );
  }
}

class _PaymentMethodTabs extends StatelessWidget {
  const _PaymentMethodTabs({
    required this.tabs,
    required this.selectedIndex,
    required this.onChanged,
  });

  final List<_CheckoutTab> tabs;
  final int selectedIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: PosColors.border, width: 1),
        ),
      ),
      child: Row(
        children: [
          for (var i = 0; i < tabs.length; i++) ...[
            if (i > 0)
              Container(
                width: 1,
                height: 44,
                color: PosColors.border,
              ),
            Expanded(
              child: _PaymentMethodTab(
                label: tabs[i].label,
                icon: tabs[i].icon,
                selected: i == selectedIndex,
                onTap: () => onChanged(i),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PaymentMethodTab extends StatelessWidget {
  const _PaymentMethodTab({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color =
        selected ? PosColors.primary : PosColors.textMuted.withValues(alpha: 0.85);
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 12, 8, 0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 18, color: color),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: color,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              height: 3,
              margin: const EdgeInsets.symmetric(horizontal: 8),
              width: double.infinity,
              decoration: BoxDecoration(
                color: selected ? PosColors.primary : Colors.transparent,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AmountStatusBox extends StatelessWidget {
  const _AmountStatusBox({
    required this.label,
    required this.value,
    this.valueColor,
  });

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        color: PosColors.primaryLight,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: PosColors.border.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: PosColors.textMuted,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: valueColor ?? PosColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _CardDigitNumpad extends StatelessWidget {
  const _CardDigitNumpad({
    required this.controller,
    required this.onChanged,
  });

  final TextEditingController controller;
  final VoidCallback onChanged;

  static const _keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '', '0', '⌫',
  ];

  void _onKey(String key) {
    if (key == '⌫') {
      final current = controller.text;
      if (current.isEmpty) return;
      controller.text = current.substring(0, current.length - 1);
      onChanged();
      return;
    }
    if (key.isEmpty || controller.text.length >= 4) return;
    controller.text = controller.text + key;
    onChanged();
  }

  void _clear() {
    controller.clear();
    onChanged();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: GridView.count(
            crossAxisCount: 3,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              for (final key in _keys)
                key.isEmpty
                    ? const SizedBox.shrink()
                    : _PaymentNumpadKey(
                        label: key,
                        onPressed: () => _onKey(key),
                      ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Material(
          color: PosColors.red.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          child: InkWell(
            onTap: _clear,
            borderRadius: BorderRadius.circular(10),
            child: Container(
              height: 48,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: PosColors.red.withValues(alpha: 0.25)),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.delete_outline, color: PosColors.red, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Clear Current Field',
                    style: TextStyle(
                      color: PosColors.red,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _PaymentNumpadKey extends StatelessWidget {
  const _PaymentNumpadKey({
    required this.label,
    required this.onPressed,
  });

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final isBackspace = label == '⌫';
    return Material(
      color: isBackspace
          ? PosColors.red.withValues(alpha: 0.1)
          : PosColors.primaryLight,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isBackspace
                  ? PosColors.red.withValues(alpha: 0.35)
                  : PosColors.primary.withValues(alpha: 0.12),
            ),
          ),
          child: isBackspace
              ? const Icon(Icons.backspace_outlined,
                  color: PosColors.red, size: 22)
              : Text(
                  label,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                    color: PosColors.textPrimary,
                  ),
                ),
        ),
      ),
    );
  }
}

class _TenderedAmountField extends StatelessWidget {
  const _TenderedAmountField({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          height: 64,
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: PosColors.primary, width: 1.5),
          ),
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: PosColors.textPrimary,
            ),
          ),
        ),
        Positioned(
          left: 12,
          top: -10,
          child: Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: PosColors.textMuted,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _QuickCashButton extends StatelessWidget {
  const _QuickCashButton({
    required this.label,
    required this.onTap,
  });

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          height: 44,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: PosColors.border),
          ),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: PosColors.textPrimary,
            ),
          ),
        ),
      ),
    );
  }
}

class _PaymentCashSummaryPanel extends StatelessWidget {
  const _PaymentCashSummaryPanel({
    required this.balanceDue,
    required this.tendered,
    required this.change,
    required this.showTendered,
    required this.cardReaderActive,
  });

  final double balanceDue;
  final double tendered;
  final double change;
  final bool showTendered;
  final bool cardReaderActive;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: PosColors.border),
          ),
          child: Column(
            children: [
              _SummaryLine(
                label: 'Balance Due',
                value: formatPosMoney(balanceDue),
              ),
              if (showTendered) ...[
                const SizedBox(height: 12),
                _SummaryLine(
                  label: 'Tendered',
                  value: formatPosMoney(tendered),
                  valueColor: PosColors.primary,
                ),
              ],
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 14),
                child: Divider(height: 1, color: PosColors.border),
              ),
              Row(
                children: [
                  const Text(
                    'Change',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: PosColors.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    formatPosMoney(change),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: PosColors.textPrimary,
                      height: 1,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: cardReaderActive
                  ? PosColors.primaryLight
                  : PosColors.chipInactive,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: cardReaderActive
                    ? PosColors.primary.withValues(alpha: 0.25)
                    : PosColors.border,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.contactless_outlined,
                  size: 36,
                  color: cardReaderActive
                      ? PosColors.primary
                      : PosColors.textMuted.withValues(alpha: 0.45),
                ),
                const SizedBox(height: 12),
                Text(
                  cardReaderActive
                      ? 'Waiting for card reader…\nTap, Insert, or Swipe to process payment via card.'
                      : 'Card reader inactive.\nSelect Card to process card payments.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: cardReaderActive
                        ? PosColors.primary
                        : PosColors.textMuted.withValues(alpha: 0.7),
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _SplitInputModeTabs extends StatelessWidget {
  const _SplitInputModeTabs({
    required this.mode,
    required this.onChanged,
  });

  final _SplitInputMode mode;
  final ValueChanged<_SplitInputMode> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: PosColors.chipInactive,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: [
          Expanded(
            child: _SplitModeTab(
              label: 'Add Cash',
              selected: mode == _SplitInputMode.cash,
              onTap: () => onChanged(_SplitInputMode.cash),
            ),
          ),
          Expanded(
            child: _SplitModeTab(
              label: 'Add Card',
              selected: mode == _SplitInputMode.card,
              onTap: () => onChanged(_SplitInputMode.card),
            ),
          ),
        ],
      ),
    );
  }
}

class _SplitModeTab extends StatelessWidget {
  const _SplitModeTab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? Colors.white : Colors.transparent,
      borderRadius: BorderRadius.circular(20),
      elevation: selected ? 1 : 0,
      shadowColor: Colors.black12,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: SizedBox(
          height: 40,
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: selected ? PosColors.textPrimary : PosColors.textMuted,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SplitCashAmountField extends StatelessWidget {
  const _SplitCashAmountField({required this.amount});

  final String amount;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          height: 72,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: PosColors.primary, width: 1.5),
          ),
          child: Row(
            children: [
              const Text(
                kPosCurrencySymbol,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: PosColors.textMuted,
                ),
              ),
              const Spacer(),
              Text(
                amount,
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: PosColors.textPrimary,
                  height: 1,
                ),
              ),
            ],
          ),
        ),
        Positioned(
          left: 12,
          top: -10,
          child: Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: const Text(
              'Add Cash Amount',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: PosColors.textMuted,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _SplitCardNetworkButton extends StatelessWidget {
  const _SplitCardNetworkButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          height: 56,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: selected ? PosColors.primary : PosColors.border,
              width: selected ? 2 : 1,
            ),
          ),
          child: Stack(
            children: [
              Center(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: selected ? PosColors.primary : PosColors.textMuted,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
              if (selected)
                const Positioned(
                  top: 6,
                  right: 6,
                  child: Icon(
                    Icons.check_circle,
                    size: 16,
                    color: PosColors.primary,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PaymentSplitSummaryPanel extends StatelessWidget {
  const _PaymentSplitSummaryPanel({
    required this.totalDue,
    required this.payments,
    required this.remaining,
    required this.canComplete,
    required this.busy,
    required this.applyLabel,
    required this.showApplyButton,
    required this.onApply,
    required this.onRemove,
    required this.onComplete,
  });

  final double totalDue;
  final List<_SplitPaymentEntry> payments;
  final double remaining;
  final bool canComplete;
  final bool busy;
  final String applyLabel;
  final bool showApplyButton;
  final VoidCallback onApply;
  final ValueChanged<String> onRemove;
  final VoidCallback onComplete;

  static const _footerBg = Color(0xFF1F2937);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: PosColors.orderPanelBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: PosColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Total Due',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: PosColors.textMuted,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  formatPosMoney(totalDue),
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    color: PosColors.textPrimary,
                    height: 1,
                  ),
                ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 18),
            child: Divider(height: 1, color: PosColors.border),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 14, 18, 8),
            child: Text(
              'Payments Added',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: PosColors.textMuted.withValues(alpha: 0.95),
              ),
            ),
          ),
          Expanded(
            child: payments.isEmpty
                ? Center(
                    child: Text(
                      'No payments added yet',
                      style: TextStyle(
                        fontSize: 14,
                        color: PosColors.textMuted.withValues(alpha: 0.8),
                      ),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 18),
                    itemCount: payments.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final payment = payments[i];
                      return Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: PosColors.border),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              payment.icon,
                              size: 20,
                              color: PosColors.primary,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    payment.listTitle,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: PosColors.textPrimary,
                                    ),
                                  ),
                                  Text(
                                    payment.subtitle,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: PosColors.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              formatPosMoney(payment.amount),
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: PosColors.textPrimary,
                              ),
                            ),
                            IconButton(
                              onPressed: () => onRemove(payment.id),
                              icon: const Icon(
                                Icons.delete_outline,
                                color: PosColors.red,
                                size: 20,
                              ),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(
                                minWidth: 32,
                                minHeight: 32,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          if (showApplyButton) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 12),
              child: FilledButton(
                onPressed: busy ? null : onApply,
                style: FilledButton.styleFrom(
                  backgroundColor: PosColors.primary,
                  minimumSize: const Size(double.infinity, 48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: Text(
                  applyLabel,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
          Container(
            padding: const EdgeInsets.all(18),
            decoration: const BoxDecoration(
              color: _footerBg,
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(11)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text(
                      'Remaining Balance',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.white70,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      formatPosMoney(remaining),
                      style: const TextStyle(
                        fontSize: 30,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF34D399),
                        height: 1,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: canComplete
                        ? PosColors.primary
                        : const Color(0xFF9CA3AF),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 48),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  onPressed: canComplete && !busy ? onComplete : null,
                  icon: busy
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Icon(
                          canComplete ? Icons.check_circle_outline : Icons.lock_outline,
                          size: 18,
                        ),
                  label: Text(
                    busy ? 'Processing…' : 'Complete Order',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PaymentOrderSummaryPanel extends StatelessWidget {
  const _PaymentOrderSummaryPanel({
    required this.orderLines,
    required this.subtotal,
    required this.taxTotal,
    required this.taxRate,
    required this.discountTotal,
    required this.shippingCost,
    required this.balanceDue,
  });

  final List<PaymentOrderLine> orderLines;
  final double subtotal;
  final double taxTotal;
  final double taxRate;
  final double discountTotal;
  final double shippingCost;
  final double balanceDue;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Order Summary',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: PosColors.textPrimary,
          ),
        ),
        const SizedBox(height: 14),
        Expanded(
          child: ListView.separated(
            itemCount: orderLines.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final line = orderLines[i];
              return Row(
                children: [
                  Expanded(
                    child: Text(
                      line.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: PosColors.textPrimary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    formatPosMoney(line.amount),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: PosColors.textPrimary,
                    ),
                  ),
                ],
              );
            },
          ),
        ),
        const Divider(height: 24, color: PosColors.border),
        _SummaryLine(
          label: 'Subtotal',
          value: formatPosMoney(subtotal),
        ),
        if (taxTotal > 0) ...[
          const SizedBox(height: 10),
          _SummaryLine(
            label: taxRate > 0
                ? 'Tax (${taxRate.toStringAsFixed(2)}%)'
                : 'Tax',
            value: formatPosMoney(taxTotal),
          ),
        ],
        if (discountTotal > 0) ...[
          const SizedBox(height: 10),
          _SummaryLine(
            label: 'Discount',
            value: formatPosMoney(-discountTotal),
            valueColor: PosColors.red,
          ),
        ],
        if (shippingCost > 0) ...[
          const SizedBox(height: 10),
          _SummaryLine(
            label: 'Shipping',
            value: formatPosMoney(shippingCost),
          ),
        ],
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: PosColors.primaryLight,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: PosColors.primary.withValues(alpha: 0.2),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'BALANCE DUE',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: PosColors.primary,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    'LKR',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: PosColors.textMuted,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    formatPosMoney(balanceDue),
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: PosColors.textPrimary,
                      height: 1,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        OutlinedButton.icon(
          onPressed: null,
          icon: Icon(
            Icons.lock_outline,
            size: 18,
            color: PosColors.textMuted.withValues(alpha: 0.6),
          ),
          label: Text(
            'Complete Payment',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: PosColors.textMuted.withValues(alpha: 0.6),
            ),
          ),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(double.infinity, 48),
            backgroundColor: PosColors.chipInactive,
            side: const BorderSide(color: PosColors.border),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
      ],
    );
  }
}

class _CardTypeButton extends StatelessWidget {
  const _CardTypeButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? PosColors.primary : Colors.white,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          height: 44,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: selected ? PosColors.primary : PosColors.border,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: selected ? Colors.white : PosColors.textMuted,
              letterSpacing: 0.3,
            ),
          ),
        ),
      ),
    );
  }
}

class _SummaryLine extends StatelessWidget {
  const _SummaryLine({
    required this.label,
    required this.value,
    this.valueColor,
  });

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: PosColors.textMuted,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: valueColor ?? PosColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
