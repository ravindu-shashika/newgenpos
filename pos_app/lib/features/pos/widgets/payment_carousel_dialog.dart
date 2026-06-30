import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import 'pos_toast.dart';
import '../pos_currency.dart';
import '../pos_helpers.dart';
import 'discount_entry_dialog.dart';
import 'finalize_sale_dialog.dart';
import 'payment_processing_layout.dart';
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

enum _MixFieldKind { amount, cardDigits, voucherCode, discount }

class _MixPaymentLineState {
  _MixPaymentLineState({required this.method})
      : amountCtrl = TextEditingController(),
        cardDigitsCtrl = TextEditingController(),
        voucherCodeCtrl = TextEditingController();

  final PosPaymentMethod method;
  final TextEditingController amountCtrl;
  final TextEditingController cardDigitsCtrl;
  final TextEditingController voucherCodeCtrl;
  String cardType = 'Visa';

  bool get isCard => method.key == 'card' || method.id == '3';
  bool get isVoucher =>
      method.key == 'gift_card' || method.id == '2' || method.key == 'voucher';

  String get rowLabel {
    switch (method.key) {
      case 'cash':
        return 'CASH';
      case 'card':
        return 'CARD';
      case 'gift_card':
        return 'VOUCHER';
      case 'cheque':
        return 'CHEQUE';
      case 'deposit':
        return 'DEPOSIT';
      default:
        return method.label.toUpperCase();
    }
  }

  void dispose() {
    amountCtrl.dispose();
    cardDigitsCtrl.dispose();
    voucherCodeCtrl.dispose();
  }
}

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
  bool showPrintInvoiceOption = true,
  bool defaultPrintInvoice = true,
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
  late final List<_CheckoutTab> _tabs;
  late int _selectedIndex;
  bool _busy = false;

  late String _orderDiscountType;
  late double _orderDiscountValue;
  late String? _couponCode;
  late int? _couponId;
  late double _couponDiscount;

  late final TextEditingController _cashReceivedCtrl;
  late final TextEditingController _discountCtrl;
  late final TextEditingController _cardNumberCtrl;
  late final TextEditingController _cardHolderCtrl;
  late final TextEditingController _chequeNoCtrl;
  late final TextEditingController _saleNoteCtrl;
  String _cardType = 'Visa';
  bool _printInvoice = false;
  bool _sendWhatsapp = false;
  late final List<_MixPaymentLineState> _mixLines;
  _MixPaymentLineState? _activeMixLine;
  _MixFieldKind _activeMixField = _MixFieldKind.amount;
  bool _cashFieldActive = true;

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
    if (method.key == 'mix') return 'Mixed';
    if (method.key == 'card') return 'Credit / Debit Card';
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

    _cashReceivedCtrl = TextEditingController(text: '0');
    _discountCtrl = TextEditingController(
      text: _orderDiscountValue == _orderDiscountValue.roundToDouble()
          ? _orderDiscountValue.toStringAsFixed(0)
          : _orderDiscountValue.toStringAsFixed(2),
    );
    _cardNumberCtrl = TextEditingController();
    _cardHolderCtrl = TextEditingController();
    _chequeNoCtrl = TextEditingController();
    _saleNoteCtrl = TextEditingController(text: widget.initialSaleNote);
    _printInvoice = widget.defaultPrintInvoice;
    _sendWhatsapp = widget.defaultSendWhatsapp;
    _mixLines = _buildMixLines();
    _activeMixLine = _mixLines.isNotEmpty ? _mixLines.first : null;
    _cashReceivedCtrl.addListener(() => setState(() {}));
    _discountCtrl.addListener(_onDiscountChanged);
    for (final line in _mixLines) {
      line.amountCtrl.addListener(() => setState(() {}));
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final due = _grandTotal;
      final text = due == due.roundToDouble()
          ? due.toStringAsFixed(0)
          : due.toStringAsFixed(2);
      _cashReceivedCtrl.text = text;
    });
  }

  List<_MixPaymentLineState> _buildMixLines() {
    final source = widget.mixMethods.isNotEmpty
        ? widget.mixMethods
        : widget.methods;
    final lines = <_MixPaymentLineState>[];
    final seen = <String>{};
    for (final method in source) {
      if (method.key == 'mix' || method.key == 'credit') continue;
      if (isExcludedPaymentMethod(method)) continue;
      if (!seen.add(method.key)) continue;
      lines.add(_MixPaymentLineState(method: method));
    }
    if (lines.isEmpty) {
      for (final key in ['cash', 'card', 'gift_card']) {
        final method = kPosPaymentMethods[key];
        if (method != null) lines.add(_MixPaymentLineState(method: method));
      }
    }
    return lines;
  }

  void _onDiscountChanged() {
    _orderDiscountType = 'Flat';
    _orderDiscountValue = double.tryParse(_discountCtrl.text.trim()) ?? 0;
    setState(() {});
  }

  String _formatDiscountValue(double v) {
    if (v == 0) return '0';
    return v % 1 == 0 ? v.toStringAsFixed(0) : v.toStringAsFixed(2);
  }

  void _syncDiscountCtrl() {
    _discountCtrl.text = _formatDiscountValue(_orderDiscountValue);
  }

  void _syncCashToGrandTotal() {
    final due = _grandTotal;
    final text = due % 1 == 0 ? due.toStringAsFixed(0) : due.toStringAsFixed(2);
    _cashReceivedCtrl.text = text;
    _cashReceivedCtrl.selection = TextSelection.collapsed(offset: text.length);
  }

  String get _discountAmountText {
    final amount = _orderDiscountType == 'Percentage'
        ? widget.subtotal * (_orderDiscountValue / 100)
        : _orderDiscountValue;
    if (amount <= 0) return formatPosMoney(0);
    return '-${formatPosMoney(amount)}';
  }

  String? get _couponDiscountText {
    if (_couponDiscount <= 0) return null;
    return '-${formatPosMoney(_couponDiscount)}';
  }

  Future<void> _openDiscountCouponModal({int initialTabIndex = 0}) async {
    final result = await showDiscountEntryDialog(
      context: context,
      subtotal: widget.subtotal,
      displaySubtotal: widget.subtotal + widget.lineTax,
      grandTotalBeforeCoupon: _grandTotalBeforeCoupon,
      initialDiscountType: _orderDiscountType,
      initialDiscountValue: _orderDiscountValue,
      coupons: widget.coupons,
      initialCouponCode: _couponCode ?? '',
      initialTabIndex: initialTabIndex,
    );
    if (result == null || !mounted) return;

    setState(() {
      _orderDiscountType = result.orderDiscountType;
      _orderDiscountValue = result.orderDiscountValue;
      _syncDiscountCtrl();

      if (result.couponCleared) {
        _couponCode = null;
        _couponId = null;
        _couponDiscount = 0;
      } else if (result.couponCode != null && result.couponCode!.isNotEmpty) {
        _couponCode = result.couponCode;
        _couponId = result.couponId;
        _couponDiscount = result.couponDiscount;
      }

      _syncCashToGrandTotal();
      _cashFieldActive = true;
      _activeMixField = _MixFieldKind.amount;
    });
  }

  void _onDiscountTap() => _openDiscountCouponModal(initialTabIndex: 0);

  void _onCouponTap() => _openDiscountCouponModal(initialTabIndex: 1);

  TextEditingController get _mixNumpadCtrl {
    if (_activeMixField == _MixFieldKind.discount) return _discountCtrl;
    final line = _activeMixLine ?? (_mixLines.isNotEmpty ? _mixLines.first : null);
    if (line == null) return _discountCtrl;
    switch (_activeMixField) {
      case _MixFieldKind.cardDigits:
        return line.cardDigitsCtrl;
      case _MixFieldKind.voucherCode:
        return line.voucherCodeCtrl;
      case _MixFieldKind.amount:
        return line.amountCtrl;
      case _MixFieldKind.discount:
        return _discountCtrl;
    }
  }

  bool get _mixNumpadAllowDecimal =>
      _activeMixField == _MixFieldKind.amount ||
      _activeMixField == _MixFieldKind.discount;

  int? get _mixNumpadMaxLength {
    if (_activeMixField == _MixFieldKind.cardDigits) return 4;
    return null;
  }

  void _focusMixField(_MixPaymentLineState line, _MixFieldKind field) {
    setState(() {
      _activeMixLine = line;
      _activeMixField = field;
    });
  }

  int _resolveInitialIndex() {
    final cashIdx = _tabs.indexWhere((t) => t.key == 'cash');
    return cashIdx >= 0 ? cashIdx : 0;
  }

  @override
  void dispose() {
    _cashReceivedCtrl.dispose();
    _discountCtrl.dispose();
    _cardNumberCtrl.dispose();
    _cardHolderCtrl.dispose();
    _chequeNoCtrl.dispose();
    _saleNoteCtrl.dispose();
    for (final line in _mixLines) {
      line.dispose();
    }
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

  void _clearCashReceived() {
    _cashReceivedCtrl.clear();
    _onAmountChanged();
  }

  String? get _paymentStatusHint {
    if (_canCompletePayment || _busy) return null;
    final key = _currentTab.key;
    if (key == 'cash' || _currentTab.method?.id == '1') {
      final short = _grandTotal - _cashReceived;
      if (short > 0.009) {
        return 'Need ${formatPosMoney(short)} more to complete';
      }
    }
    if (key == 'mix' && !_mixReady) {
      if (_mixOverpay > 0.009) {
        return 'Split is over by ${formatPosMoney(_mixOverpay)}';
      }
      return 'Allocate ${formatPosMoney(_mixRemaining)} across methods';
    }
    return null;
  }

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
    final labelStyle = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w700,
      letterSpacing: 0.8,
      color: Theme.of(context).colorScheme.onSurfaceVariant,
    );

    const amounts = kPosPaymentQuickCashAmounts;
    const columns = 5;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('QUICK DENOMINATIONS', style: labelStyle),
        SizedBox(height: 10),
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

  double get _mixAllocatedTotal {
    var sum = 0.0;
    for (final line in _mixLines) {
      sum += double.tryParse(line.amountCtrl.text.trim()) ?? 0;
    }
    return sum;
  }

  double get _mixRemaining =>
      (_grandTotal - _mixAllocatedTotal).clamp(0, double.infinity).toDouble();

  double get _mixOverpay =>
      (_mixAllocatedTotal - _grandTotal).clamp(0, double.infinity).toDouble();

  bool get _mixReady =>
      _mixAllocatedTotal > 0 &&
      _mixRemaining <= 0.009 &&
      _mixOverpay <= 0.009;

  void _clearMixLines() {
    for (final line in _mixLines) {
      line.amountCtrl.clear();
      line.cardDigitsCtrl.clear();
      line.voucherCodeCtrl.clear();
    }
    setState(() {});
  }

  void _fillMixRemaining(_MixPaymentLineState line) {
    final current = double.tryParse(line.amountCtrl.text.trim()) ?? 0;
    final others = _mixAllocatedTotal - current;
    final fill = (_grandTotal - others).clamp(0, double.infinity);
    final text = fill % 1 == 0
        ? fill.toStringAsFixed(0)
        : fill.toStringAsFixed(2);
    line.amountCtrl.text = text;
    line.amountCtrl.selection = TextSelection.collapsed(offset: text.length);
    _focusMixField(line, _MixFieldKind.amount);
    setState(() {});
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
      if (!_mixReady) {
        if (_mixOverpay > 0.009) {
          _snack('Split total exceeds amount due');
        } else {
          _snack(
            'Allocate ${formatPosMoney(_grandTotal)} across payment methods',
          );
        }
        return;
      }

      final mixPayments = normalizeMixPayments([
        for (final line in _mixLines)
          if ((double.tryParse(line.amountCtrl.text.trim()) ?? 0) > 0)
            MixPaymentLine(
              paidById: line.method.id,
              payingAmount: double.parse(line.amountCtrl.text.trim()),
              cashReceived: line.method.id == '1'
                  ? double.parse(line.amountCtrl.text.trim())
                  : double.parse(line.amountCtrl.text.trim()),
            ),
      ]);
      final totals = computeMixPaymentTotals(
        lines: mixPayments,
        grandTotal: _grandTotal,
      );
      _MixPaymentLineState? firstCard;
      for (final line in _mixLines) {
        if (line.isCard &&
            (double.tryParse(line.amountCtrl.text.trim()) ?? 0) > 0) {
          firstCard = line;
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
            cardNumber: firstCard?.cardDigitsCtrl.text.trim() ?? '',
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

  String get _money => formatPosMoney(_grandTotal);

  String get _invoiceLabel =>
      widget.orderLines.isEmpty
          ? 'Invoice'
          : 'Invoice: ${widget.orderLines.length}';

  bool get _canCompletePayment {
    final key = _currentTab.key;
    if (key == 'mix') return _mixReady;
    if (key == 'cash' || _currentTab.method?.id == '1') {
      return _cashReceived >= _grandTotal - 0.009;
    }
    return true;
  }

  TextEditingController get _activeNumpadCtrl {
    if (_currentTab.key == 'mix') return _mixNumpadCtrl;
    if (_currentTab.key == 'card' || _currentTab.method?.id == '3') {
      return _cardNumberCtrl;
    }
    return _cashReceivedCtrl;
  }

  bool get _numpadAllowDecimal {
    if (_currentTab.key == 'mix') return _mixNumpadAllowDecimal;
    if (_currentTab.key == 'card' || _currentTab.method?.id == '3') {
      return false;
    }
    return true;
  }

  int? get _numpadMaxLength {
    if (_currentTab.key == 'mix') return _mixNumpadMaxLength;
    if (_currentTab.key == 'card' || _currentTab.method?.id == '3') return 4;
    return null;
  }

  Widget _buildBillAdjustments() {
    return PaymentBillAdjustments(
      discountAmountText: _discountAmountText,
      onDiscountTap: _onDiscountTap,
      onCouponTap: _onCouponTap,
      couponCode: _couponCode,
      couponDiscountText: _couponDiscountText,
      onReturnCreditTap: widget.onReturnCreditTap,
    );
  }

  Widget _buildPaymentRightRail({required bool showAdjustments}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (showAdjustments) ...[
          _buildBillAdjustments(),
          const SizedBox(height: 10),
        ],
        Expanded(
          child: PaymentKeypadColumn(
            controller: _activeNumpadCtrl,
            onChanged: () => setState(() {}),
            allowDecimal: _numpadAllowDecimal,
            maxLength: _numpadMaxLength,
            clearButtonLabel: 'Clear',
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentBody() {
    final isCash = _currentTab.key == 'cash' || _currentTab.method?.id == '1';
    final isCard = _currentTab.key == 'card' || _currentTab.method?.id == '3';
    final isMix = _currentTab.key == 'mix';

    if (isMix) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(flex: 2, child: _buildSplitPanel()),
          const SizedBox(width: 16),
          Expanded(flex: 1, child: _buildPaymentRightRail(showAdjustments: true)),
        ],
      );
    }

    if (isCash) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                PaymentCashLiveSummary(
                  tenderedText: formatPosMoney(_cashReceived),
                  changeText: formatPosMoney(_cashChange),
                  isReady: _cashReceived >= _grandTotal - 0.009,
                ),
                const SizedBox(height: 12),
                PaymentCashQuickActions(
                  exactAmountText: _money,
                  onExactAmount: _applyExactChange,
                  onClear: _clearCashReceived,
                ),
                const SizedBox(height: 12),
                PaymentQuickCashGrid(
                  onAmount: _setTendered,
                  onBackspace: () {
                    final t = _cashReceivedCtrl.text;
                    if (t.isEmpty) return;
                    _cashReceivedCtrl.text = t.substring(0, t.length - 1);
                    _onAmountChanged();
                  },
                ),
                const SizedBox(height: 12),
                PaymentCashReceivedField(
                  controller: _cashReceivedCtrl,
                  active: _cashFieldActive,
                  onTap: () => setState(() {
                    _cashFieldActive = true;
                    _activeMixField = _MixFieldKind.amount;
                  }),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(flex: 1, child: _buildPaymentRightRail(showAdjustments: true)),
        ],
      );
    }

    if (isCard) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                PaymentAmountBanner(
                  label: 'AMOUNT TO CHARGE',
                  amountText: _money,
                ),
                const SizedBox(height: 14),
                PaymentCardDetailsFields(
                  cardType: _cardType,
                  onCardTypeChanged: (v) => setState(() => _cardType = v),
                  digitsController: _cardNumberCtrl,
                  digitsActive: _cashFieldActive,
                  onDigitsTap: () => setState(() => _cashFieldActive = true),
                ),
                const Spacer(),
                const PaymentReadyBanner(
                  message: 'Tap the digits field, then enter on the keypad.',
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(flex: 1, child: _buildPaymentRightRail(showAdjustments: true)),
        ],
      );
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(flex: 2, child: _buildLeftPanel(_currentTab.method!)),
        const SizedBox(width: 16),
        Expanded(flex: 1, child: _buildPaymentRightRail(showAdjustments: true)),
      ],
    );
  }


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
        body: Text(
          'No payment methods are configured for this terminal.',
          style: TextStyle(
            fontSize: 14,
            height: 1.5,
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
        primaryLabel: 'Close',
        onPrimary: () => Navigator.pop(context),
      );
    }

    final screenH = MediaQuery.sizeOf(context).height;
    final dialogHeight = (screenH * 0.88).clamp(560.0, 920.0);

    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      clipBehavior: Clip.antiAlias,
      child: SizedBox(
        width: kPosPaymentDialogWidth,
        height: dialogHeight,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            PaymentProcessingHeader(
              invoiceLabel: _invoiceLabel,
              totalText: _money,
              busy: _busy,
              onClose: () => Navigator.pop(context),
            ),
            PaymentMethodPillTabs(
              labels: [for (final t in _tabs) t.label],
              icons: [for (final t in _tabs) t.icon],
              selectedIndex: _selectedIndex,
              onChanged: (i) {
                setState(() {
                  _selectedIndex = i;
                  _cashFieldActive = true;
                  if (_tabs[i].key == 'mix' && _mixLines.isNotEmpty) {
                    _activeMixLine = _mixLines.first;
                    _activeMixField = _MixFieldKind.amount;
                  }
                });
              },
            ),
            const SizedBox(height: 14),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _buildPaymentBody(),
              ),
            ),
            PaymentFooterBar(
              showPrintOption: true,
              printInvoice: _printInvoice,
              onPrintChanged: (v) => setState(() => _printInvoice = v),
              canComplete: _canCompletePayment,
              busy: _busy,
              onComplete: _completePayment,
              statusHint: _paymentStatusHint,
              completeLabel: _printInvoice
                  ? 'COMPLETE & PRINT'
                  : 'COMPLETE SALE',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLeftPanel(PosPaymentMethod method) {
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
        style: TextStyle(fontSize: 15),
      ),
    );
  }

  Widget _buildSplitPanel() {
    final progress = _grandTotal <= 0
        ? 0.0
        : (_mixAllocatedTotal / _grandTotal).clamp(0.0, 1.0);
    final s = context.posStyles;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        PaymentAmountBanner(
          label: 'TO CHARGE',
          amountText: _money,
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Text(
              'Mixed Payment Split',
              style: s.titleMedium.copyWith(fontSize: 15, fontWeight: FontWeight.w800),
            ),
            const Spacer(),
            TextButton(
              onPressed: _clearMixLines,
              style: TextButton.styleFrom(foregroundColor: s.danger),
              child: const Text('Clear All'),
            ),
            if (_mixReady) ...[
              SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: s.success.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: s.success.withValues(alpha: 0.4)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.check_circle, size: 16, color: s.success),
                    SizedBox(width: 4),
                    Text(
                      'Complete',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: s.success,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
        SizedBox(height: 8),
        if (_mixLines.isEmpty)
          Expanded(
            child: Center(
              child: Text(
                'No payment methods configured for mixed payment.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          )
        else
          Expanded(
            child: ListView.separated(
            itemCount: _mixLines.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final line = _mixLines[index];
              final isActiveAmount = identical(_activeMixLine, line) &&
                  _activeMixField == _MixFieldKind.amount;
              return _MixedPaymentRow(
                line: line,
                isActiveAmount: isActiveAmount,
                isActiveDigits: identical(_activeMixLine, line) &&
                    _activeMixField == _MixFieldKind.cardDigits,
                isActiveVoucher: identical(_activeMixLine, line) &&
                    _activeMixField == _MixFieldKind.voucherCode,
                onFocusAmount: () =>
                    _focusMixField(line, _MixFieldKind.amount),
                onFocusDigits: () =>
                    _focusMixField(line, _MixFieldKind.cardDigits),
                onFocusVoucher: () =>
                    _focusMixField(line, _MixFieldKind.voucherCode),
                onFillRemaining: () => _fillMixRemaining(line),
                onCardTypeChanged: (type) =>
                    setState(() => line.cardType = type),
              );
            },
          ),
        ),
        SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 6,
            backgroundColor: s.border.withValues(alpha: 0.5),
            color: _mixReady ? s.success : s.accent,
          ),
        ),
        if (!_mixReady && _mixAllocatedTotal > 0) ...[
          SizedBox(height: 6),
          Text(
            _mixOverpay > 0.009
                ? 'Over by ${formatPosMoney(_mixOverpay)}'
                : 'Remaining ${formatPosMoney(_mixRemaining)}',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: _mixOverpay > 0.009 ? s.danger : s.accent,
            ),
          ),
        ],
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
            SizedBox(width: 12),
            Expanded(
              child: _AmountStatusBox(
                label: 'CHANGE DUE',
                value: formatPosMoney(_cashChange),
                valueColor: PosColors.red,
              ),
            ),
          ],
        ),
        SizedBox(height: 16),
        Expanded(child: _buildQuickCashButtons(_setTendered)),
      ],
    );
  }

  Widget _buildCardPanel() {
    const cardTypes = ['Visa', 'Master Card', 'Amex'];
    final digits = _cardNumberCtrl.text.trim();
    final masked = digits.isEmpty
        ? 'â€¢ â€¢ â€¢ â€¢'
        : digits.padRight(4, 'â€¢').split('').join(' ');

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
                  Text(
                    'MANUAL ENTRY',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.8,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    '${widget.terminalLabel} - ${widget.stationLabel}',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: context.posBrand.primary,
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  'Total Due',
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                Text(
                  _money,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              ],
            ),
          ],
        ),
        SizedBox(height: 14),
        Row(
          children: [
            Icon(Icons.lock_outline, size: 16, color: context.posBrand.primary),
            SizedBox(width: 6),
            Text(
              'SECURE TRANSACTION',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.6,
                color: context.posBrand.primary.withValues(alpha: 0.9),
              ),
            ),
          ],
        ),
        SizedBox(height: 18),
        Text(
          'Card Type',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
        SizedBox(height: 10),
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
        SizedBox(height: 18),
        Text(
          'Last 4 Digits',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
        SizedBox(height: 8),
        Container(
          height: 56,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: context.posBrand.primary, width: 1.5),
          ),
          child: Text(
            masked,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              letterSpacing: 6,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ),
        const Spacer(),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.verified_user_outlined,
                size: 14, color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.8)),
            SizedBox(width: 4),
            Text(
              'PCI Compliant',
              style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
            SizedBox(width: 16),
            Icon(Icons.shield_outlined,
                size: 14, color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.8)),
            SizedBox(width: 4),
            Text(
              'End-to-End Encryption',
              style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          ],
        ),
        SizedBox(height: 4),
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
          color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.95),
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
            fillColor: Theme.of(context).colorScheme.surface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Theme.of(context).dividerColor),
            ),
          ),
        ),
        const Spacer(),
        Text(
          'Enter the cheque number, then tap Complete Payment.',
          style: TextStyle(
            fontSize: 13,
            color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.9),
          ),
        ),
      ],
    );
  }
}

class _MixedPaymentRow extends StatelessWidget {
  const _MixedPaymentRow({
    required this.line,
    required this.isActiveAmount,
    required this.isActiveDigits,
    required this.isActiveVoucher,
    required this.onFocusAmount,
    required this.onFocusDigits,
    required this.onFocusVoucher,
    required this.onFillRemaining,
    required this.onCardTypeChanged,
  });

  final _MixPaymentLineState line;
  final bool isActiveAmount;
  final bool isActiveDigits;
  final bool isActiveVoucher;
  final VoidCallback onFocusAmount;
  final VoidCallback onFocusDigits;
  final VoidCallback onFocusVoucher;
  final VoidCallback onFillRemaining;
  final ValueChanged<String> onCardTypeChanged;

  static const _cardTypes = ['Visa', 'Master Card', 'Amex'];

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final borderColor = s.accent;

    InputDecoration amountDecoration({required bool active}) {
      return InputDecoration(
        labelText: line.rowLabel,
        prefixText: '$kPosCurrencySymbol ',
        isDense: true,
        filled: true,
        fillColor: Theme.of(context).colorScheme.surface,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(
            color: active ? borderColor : Theme.of(context).dividerColor,
            width: active ? 2 : 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: borderColor, width: 2),
        ),
      );
    }

    Widget amountField({bool showQuickFill = true}) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: TextField(
              controller: line.amountCtrl,
              readOnly: true,
              onTap: onFocusAmount,
              decoration: amountDecoration(active: isActiveAmount),
            ),
          ),
          if (showQuickFill)
            _MixFieldIconButton(
              tooltip: 'Fill remaining',
              icon: Icons.bolt_outlined,
              active: false,
              accent: true,
              onPressed: onFillRemaining,
            ),
        ],
      );
    }

    Widget digitsField() {
      return TextField(
        controller: line.cardDigitsCtrl,
        readOnly: true,
        onTap: onFocusDigits,
        maxLength: 4,
        decoration: InputDecoration(
          labelText: 'Digits',
          counterText: '',
          isDense: true,
          filled: true,
          fillColor: Theme.of(context).colorScheme.surface,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(
              color: isActiveDigits
                  ? borderColor
                  : Theme.of(context).dividerColor,
              width: isActiveDigits ? 2 : 1,
            ),
          ),
        ),
      );
    }

    if (line.isCard) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          amountField(),
          SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: line.cardType,
                  isExpanded: true,
                  decoration: InputDecoration(
                    labelText: 'Type',
                    isDense: true,
                    filled: true,
                    fillColor: Theme.of(context).colorScheme.surface,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 14,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  items: [
                    for (final type in _cardTypes)
                      DropdownMenuItem(value: type, child: Text(type)),
                  ],
                  onChanged: (v) {
                    if (v != null) onCardTypeChanged(v);
                  },
                ),
              ),
              SizedBox(width: 8),
              Expanded(child: digitsField()),
            ],
          ),
        ],
      );
    }

    if (line.isVoucher) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          amountField(),
          SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TextField(
                  controller: line.voucherCodeCtrl,
                  readOnly: true,
                  onTap: onFocusVoucher,
                  decoration: InputDecoration(
                    labelText: 'Voucher Code',
                    isDense: true,
                    filled: true,
                    fillColor: Theme.of(context).colorScheme.surface,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 14,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(
                        color: isActiveVoucher
                            ? borderColor
                            : Theme.of(context).dividerColor,
                        width: isActiveVoucher ? 2 : 1,
                      ),
                    ),
                  ),
                ),
              ),
              _MixFieldIconButton(
                tooltip: 'Enter code',
                icon: Icons.qr_code_scanner_outlined,
                active: isActiveVoucher,
                onPressed: onFocusVoucher,
              ),
            ],
          ),
        ],
      );
    }

    return amountField();
  }
}

class _MixFieldIconButton extends StatelessWidget {
  const _MixFieldIconButton({
    required this.tooltip,
    required this.icon,
    required this.active,
    required this.onPressed,
    this.accent = false,
  });

  final String tooltip;
  final IconData icon;
  final bool active;
  final VoidCallback onPressed;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final color = accent
        ? s.accent
        : (active ? s.accent : s.textMuted);
    return SizedBox(
      width: 48,
      height: 52,
      child: IconButton(
        tooltip: tooltip,
        onPressed: onPressed,
        padding: EdgeInsets.zero,
        constraints: const BoxConstraints.tightFor(width: 48, height: 52),
        style: IconButton.styleFrom(
          backgroundColor: active
              ? s.accent.withValues(alpha: 0.12)
              : (accent
                  ? s.accent.withValues(alpha: 0.08)
                  : null),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
        icon: Icon(icon, size: 22, color: color),
      ),
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
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Theme.of(context).dividerColor, width: 1),
        ),
      ),
      child: Row(
        children: [
          for (var i = 0; i < tabs.length; i++) ...[
            if (i > 0)
              Container(
                width: 1,
                height: 44,
                color: Theme.of(context).dividerColor,
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
        selected ? context.posBrand.primary : Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.85);
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
                SizedBox(width: 8),
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
            SizedBox(height: 10),
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              height: 3,
              margin: const EdgeInsets.symmetric(horizontal: 8),
              width: double.infinity,
              decoration: BoxDecoration(
                color: selected ? context.posBrand.primary : Colors.transparent,
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
        color: context.posBrand.primaryLight,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Theme.of(context).dividerColor.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: valueColor ?? Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ],
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
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: context.posBrand.primary, width: 1.5),
          ),
          child: Text(
            value,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ),
        Positioned(
          left: 12,
          top: -10,
          child: Container(
            color: Theme.of(context).colorScheme.surface,
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
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
      color: Theme.of(context).colorScheme.surface,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          height: 44,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Theme.of(context).colorScheme.onSurface,
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
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Column(
            children: [
              _SummaryLine(
                label: 'Balance Due',
                value: formatPosMoney(balanceDue),
              ),
              if (showTendered) ...[
                SizedBox(height: 12),
                _SummaryLine(
                  label: 'Tendered',
                  value: formatPosMoney(tendered),
                  valueColor: context.posBrand.primary,
                ),
              ],
              Padding(
                padding: EdgeInsets.symmetric(vertical: 14),
                child: Divider(height: 1, color: Theme.of(context).dividerColor),
              ),
              Row(
                children: [
                  Text(
                    'Change',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    formatPosMoney(change),
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: Theme.of(context).colorScheme.onSurface,
                      height: 1,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        SizedBox(height: 16),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: cardReaderActive
                  ? context.posBrand.primaryLight
                  : context.posBrand.chipInactive,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: cardReaderActive
                    ? context.posBrand.primary.withValues(alpha: 0.25)
                    : Theme.of(context).dividerColor,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.contactless_outlined,
                  size: 36,
                  color: cardReaderActive
                      ? context.posBrand.primary
                      : Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.45),
                ),
                SizedBox(height: 12),
                Text(
                  cardReaderActive
                      ? 'Waiting for card readerâ€¦\nTap, Insert, or Swipe to process payment via card.'
                      : 'Card reader inactive.\nSelect Card to process card payments.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: cardReaderActive
                        ? context.posBrand.primary
                        : Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
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
        Text(
          'Order Summary',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
        SizedBox(height: 14),
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
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                  ),
                  SizedBox(width: 12),
                  Text(
                    formatPosMoney(line.amount),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                ],
              );
            },
          ),
        ),
        Divider(height: 24, color: Theme.of(context).dividerColor),
        _SummaryLine(
          label: 'Subtotal',
          value: formatPosMoney(subtotal),
        ),
        if (taxTotal > 0) ...[
          SizedBox(height: 10),
          _SummaryLine(
            label: taxRate > 0
                ? 'Tax (${taxRate.toStringAsFixed(2)}%)'
                : 'Tax',
            value: formatPosMoney(taxTotal),
          ),
        ],
        if (discountTotal > 0) ...[
          SizedBox(height: 10),
          _SummaryLine(
            label: 'Discount',
            value: formatPosMoney(-discountTotal),
            valueColor: PosColors.red,
          ),
        ],
        if (shippingCost > 0) ...[
          SizedBox(height: 10),
          _SummaryLine(
            label: 'Shipping',
            value: formatPosMoney(shippingCost),
          ),
        ],
        SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: context.posBrand.primaryLight,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: context.posBrand.primary.withValues(alpha: 0.2),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'BALANCE DUE',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: context.posBrand.primary,
                  letterSpacing: 0.8,
                ),
              ),
              SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'LKR',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    formatPosMoney(balanceDue),
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: Theme.of(context).colorScheme.onSurface,
                      height: 1,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        SizedBox(height: 14),
        OutlinedButton.icon(
          onPressed: null,
          icon: Icon(
            Icons.lock_outline,
            size: 18,
            color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.6),
          ),
          label: Text(
            'Complete Payment',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.6),
            ),
          ),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(double.infinity, 48),
            backgroundColor: context.posBrand.chipInactive,
            side: BorderSide(color: Theme.of(context).dividerColor),
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
      color: selected ? context.posBrand.primary : Colors.white,
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
              color: selected ? context.posBrand.primary : Theme.of(context).dividerColor,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: selected ? Colors.white : Theme.of(context).colorScheme.onSurfaceVariant,
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
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: valueColor ?? Theme.of(context).colorScheme.onSurface,
          ),
        ),
      ],
    );
  }
}
