import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import '../pos_helpers.dart';
import 'discount_coupon_panels.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

class DiscountEntryResult {
  const DiscountEntryResult({
    required this.orderDiscountType,
    required this.orderDiscountValue,
    this.couponCode,
    this.couponId,
    this.couponDiscount = 0,
    this.couponCleared = false,
  });

  final String orderDiscountType;
  final double orderDiscountValue;
  final String? couponCode;
  final int? couponId;
  final double couponDiscount;
  final bool couponCleared;
}

Future<DiscountEntryResult?> showDiscountEntryDialog({
  required BuildContext context,
  required double subtotal,
  required String initialDiscountType,
  required double initialDiscountValue,
  double? displaySubtotal,
  List<LocalCouponRow> coupons = const [],
  String initialCouponCode = '',
  double grandTotalBeforeCoupon = 0,
}) {
  return showPosDialog<DiscountEntryResult>(
    context: context,
    builder: (ctx) => _AddDiscountDialog(
      subtotal: subtotal,
      displaySubtotal: displaySubtotal ?? subtotal,
      initialDiscountType: initialDiscountType,
      initialDiscountValue: initialDiscountValue,
      coupons: coupons,
      initialCouponCode: initialCouponCode,
      grandTotalBeforeCoupon: grandTotalBeforeCoupon > 0
          ? grandTotalBeforeCoupon
          : (displaySubtotal ?? subtotal),
    ),
  );
}

class _AddDiscountDialog extends StatefulWidget {
  const _AddDiscountDialog({
    required this.subtotal,
    required this.displaySubtotal,
    required this.initialDiscountType,
    required this.initialDiscountValue,
    required this.coupons,
    required this.initialCouponCode,
    required this.grandTotalBeforeCoupon,
  });

  final double subtotal;
  final double displaySubtotal;
  final String initialDiscountType;
  final double initialDiscountValue;
  final List<LocalCouponRow> coupons;
  final String initialCouponCode;
  final double grandTotalBeforeCoupon;

  @override
  State<_AddDiscountDialog> createState() => _AddDiscountDialogState();
}

class _AddDiscountDialogState extends State<_AddDiscountDialog> {
  static const _panelHeight = 420.0;

  late int _tabIndex;
  late String _discountType;
  late final TextEditingController _discountCtrl;
  late final FocusNode _discountFocus;
  late final TextEditingController _couponCtrl;
  late final FocusNode _couponFocus;
  String? _couponError;

  @override
  void initState() {
    super.initState();
    _tabIndex = 0;
    _discountType = widget.initialDiscountType;
    _discountCtrl = TextEditingController(
      text: _formatDiscountValue(widget.initialDiscountValue),
    );
    _discountFocus = FocusNode();
    _couponCtrl = TextEditingController(text: widget.initialCouponCode);
    _couponFocus = FocusNode();
    _discountCtrl.addListener(() => setState(() {}));
    _couponCtrl.addListener(() {
      setState(() => _couponError = null);
    });
  }

  @override
  void dispose() {
    _discountCtrl.dispose();
    _discountFocus.dispose();
    _couponCtrl.dispose();
    _couponFocus.dispose();
    super.dispose();
  }

  String _formatDiscountValue(double v) {
    if (v == 0) return '0';
    return v % 1 == 0 ? v.toStringAsFixed(0) : v.toStringAsFixed(2);
  }

  List<String> get _quickCodes {
    final seen = <String>{};
    final codes = <String>[];
    for (final c in widget.coupons) {
      final code = c.code.trim();
      if (code.isEmpty || seen.contains(code)) continue;
      seen.add(code);
      codes.add(code);
      if (codes.length >= 8) break;
    }
    return codes;
  }

  ({double discount, String? code, int? id}) get _couponPreview {
    final code = _couponCtrl.text.trim();
    if (code.isEmpty) {
      return (discount: 0.0, code: null, id: null);
    }
    final result = applyCouponCode(
      code: code,
      coupons: widget.coupons,
      grandTotalBeforeCoupon: widget.grandTotalBeforeCoupon,
    );
    if (!result.ok) {
      return (discount: 0.0, code: null, id: null);
    }
    return (discount: result.discount, code: code, id: result.couponId);
  }

  void _apply() {
    if (_tabIndex == 0) {
      Navigator.pop(
        context,
        DiscountEntryResult(
          orderDiscountType: _discountType,
          orderDiscountValue: double.tryParse(_discountCtrl.text.trim()) ?? 0,
        ),
      );
      return;
    }

    final code = _couponCtrl.text.trim();
    if (code.isEmpty) {
      Navigator.pop(
        context,
        const DiscountEntryResult(
          orderDiscountType: 'Flat',
          orderDiscountValue: 0,
          couponCleared: true,
        ),
      );
      return;
    }

    final result = applyCouponCode(
      code: code,
      coupons: widget.coupons,
      grandTotalBeforeCoupon: widget.grandTotalBeforeCoupon,
    );
    if (!result.ok) {
      setState(() => _couponError = result.message);
      return;
    }

    Navigator.pop(
      context,
      DiscountEntryResult(
        orderDiscountType: _discountType,
        orderDiscountValue:
            double.tryParse(_discountCtrl.text.trim()) ?? 0,
        couponCode: code,
        couponId: result.couponId,
        couponDiscount: result.discount,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final preview = _couponPreview;

    return PosProfessionalWideDialogShell(
      title: 'Add discount',
      subtitle: 'Order discount or coupon code',
      icon: Icons.local_offer_outlined,
      maxWidth: 960,
      onClose: () => Navigator.pop(context),
      headerExtra: Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
        child: _DialogTabBar(
          selectedIndex: _tabIndex,
          onChanged: (i) => setState(() => _tabIndex = i),
        ),
      ),
      footer: PosProfessionalDialogFooter(
        secondaryLabel: 'Cancel',
        primaryLabel: _tabIndex == 0 ? 'Apply discount' : 'Apply coupon',
        onSecondary: () => Navigator.pop(context),
        onPrimary: _apply,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 18, 24, 8),
        child: SizedBox(
          height: _panelHeight,
          child: _tabIndex == 0
              ? DiscountEntryPanel(
                  controller: _discountCtrl,
                  focusNode: _discountFocus,
                  subtotal: widget.subtotal,
                  displaySubtotal: widget.displaySubtotal,
                  discountType: _discountType,
                  onTypeChanged: (type) => setState(() => _discountType = type),
                  onChanged: () => setState(() {}),
                  panelHeight: _panelHeight,
                )
              : CouponEntryPanel(
                  controller: _couponCtrl,
                  focusNode: _couponFocus,
                  grandTotalBeforeCoupon: widget.grandTotalBeforeCoupon,
                  quickCodes: _quickCodes,
                  errorText: _couponError,
                  previewDiscount: preview.discount,
                  previewCode: preview.code,
                  onChanged: () => setState(() => _couponError = null),
                  onSelectCode: (code) {
                    _couponCtrl.text = code;
                    _couponCtrl.selection =
                        TextSelection.collapsed(offset: code.length);
                    setState(() => _couponError = null);
                  },
                  panelHeight: _panelHeight,
                ),
        ),
      ),
    );
  }
}

class _DialogTabBar extends StatelessWidget {
  const _DialogTabBar({
    required this.selectedIndex,
    required this.onChanged,
  });

  final int selectedIndex;
  final ValueChanged<int> onChanged;

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
            child: _TabButton(
              label: 'Discount',
              selected: selectedIndex == 0,
              onTap: () => onChanged(0),
            ),
          ),
          Expanded(
            child: _TabButton(
              label: 'Coupons',
              selected: selectedIndex == 1,
              onTap: () => onChanged(1),
            ),
          ),
        ],
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
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
