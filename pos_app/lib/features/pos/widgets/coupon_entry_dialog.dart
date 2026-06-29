import 'package:flutter/material.dart';

import '../pos_helpers.dart';
import 'discount_coupon_panels.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

class CouponEntryResult {
  const CouponEntryResult({
    this.couponCode,
    this.couponId,
    this.couponDiscount = 0,
  });

  final String? couponCode;
  final int? couponId;
  final double couponDiscount;

  bool get cleared => couponCode == null || couponCode!.isEmpty;
}

Future<CouponEntryResult?> showCouponEntryDialog({
  required BuildContext context,
  required double grandTotalBeforeCoupon,
  required List<LocalCouponRow> coupons,
  String initialCouponCode = '',
}) {
  return showPosDialog<CouponEntryResult>(
    context: context,
    builder: (ctx) => _CouponEntryDialog(
      grandTotalBeforeCoupon: grandTotalBeforeCoupon,
      coupons: coupons,
      initialCouponCode: initialCouponCode,
    ),
  );
}

class _CouponEntryDialog extends StatefulWidget {
  const _CouponEntryDialog({
    required this.grandTotalBeforeCoupon,
    required this.coupons,
    required this.initialCouponCode,
  });

  final double grandTotalBeforeCoupon;
  final List<LocalCouponRow> coupons;
  final String initialCouponCode;

  @override
  State<_CouponEntryDialog> createState() => _CouponEntryDialogState();
}

class _CouponEntryDialogState extends State<_CouponEntryDialog> {
  static const _panelHeight = 400.0;

  late final TextEditingController _couponCtrl;
  late final FocusNode _couponFocus;
  String? _errorText;

  @override
  void initState() {
    super.initState();
    _couponCtrl = TextEditingController(text: widget.initialCouponCode);
    _couponFocus = FocusNode();
    _couponCtrl.addListener(() => setState(() => _errorText = null));
  }

  @override
  void dispose() {
    _couponCtrl.dispose();
    _couponFocus.dispose();
    super.dispose();
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

  void _apply() {
    final code = _couponCtrl.text.trim();
    if (code.isEmpty) {
      Navigator.pop(context, const CouponEntryResult());
      return;
    }

    final result = applyCouponCode(
      code: code,
      coupons: widget.coupons,
      grandTotalBeforeCoupon: widget.grandTotalBeforeCoupon,
    );
    if (!result.ok) {
      setState(() => _errorText = result.message);
      return;
    }

    Navigator.pop(
      context,
      CouponEntryResult(
        couponCode: code,
        couponId: result.couponId,
        couponDiscount: result.discount,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PosProfessionalWideDialogShell(
      title: 'Coupon',
      subtitle: 'Apply a discount code to this sale',
      icon: Icons.confirmation_number_outlined,
      onClose: () => Navigator.pop(context),
      footer: PosProfessionalDialogFooter(
        secondaryLabel: 'Cancel',
        primaryLabel: 'Apply coupon',
        onSecondary: () => Navigator.pop(context),
        onPrimary: _apply,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
        child: SizedBox(
          height: _panelHeight,
          child: CouponEntryPanel(
            controller: _couponCtrl,
            focusNode: _couponFocus,
            grandTotalBeforeCoupon: widget.grandTotalBeforeCoupon,
            quickCodes: _quickCodes,
            errorText: _errorText,
            onChanged: () => setState(() => _errorText = null),
            onSelectCode: (code) {
              _couponCtrl.text = code;
              _couponCtrl.selection =
                  TextSelection.collapsed(offset: code.length);
              setState(() => _errorText = null);
            },
            panelHeight: _panelHeight,
          ),
        ),
      ),
    );
  }
}
