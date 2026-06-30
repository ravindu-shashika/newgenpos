import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import '../pos_currency.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

/// Post-checkout success screen — terminal mockup step 4.
Future<void> showTransactionSuccessDialog({
  required BuildContext context,
  required String transactionNo,
  required String refId,
  required double changeDue,
  double? cashReceived,
  Future<void> Function()? onPrintReceipt,
}) {
  return showPosDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (ctx) => _TransactionSuccessDialog(
      transactionNo: transactionNo,
      refId: refId,
      changeDue: changeDue,
      cashReceived: cashReceived,
      onPrintReceipt: onPrintReceipt,
    ),
  );
}

class _TransactionSuccessDialog extends StatelessWidget {
  const _TransactionSuccessDialog({
    required this.transactionNo,
    required this.refId,
    required this.changeDue,
    this.cashReceived,
    this.onPrintReceipt,
  });

  final String transactionNo;
  final String refId;
  final double changeDue;
  final double? cashReceived;
  final Future<void> Function()? onPrintReceipt;

  String get _displayTxnNo {
    final raw = transactionNo.trim();
    if (raw.isEmpty) return '—';
    return raw.startsWith('#') ? raw : '#$raw';
  }

  bool get _hasChange => changeDue > 0.009;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;

    return PosProfessionalDialogShell(
      title: 'Transaction complete',
      subtitle: 'Sale recorded successfully',
      icon: Icons.check_circle_outline_rounded,
      maxWidth: 480,
      maxBodyHeight: 360,
      onClose: () => Navigator.pop(context),
      footer: Row(
        children: [
          Expanded(
            child: _SuccessActionButton(
              icon: Icons.print_outlined,
              label: 'Print receipt',
              filled: false,
              onPressed: () async {
                Navigator.pop(context);
                await onPrintReceipt?.call();
              },
            ),
          ),
          SizedBox(width: 12),
          Expanded(
            child: _SuccessActionButton(
              icon: Icons.add,
              label: 'New sale',
              filled: true,
              onPressed: () => Navigator.pop(context),
            ),
          ),
        ],
      ),
      body: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          RichText(
            textAlign: TextAlign.center,
            text: TextSpan(
              style: s.bodyMuted.copyWith(fontSize: 15, height: 1.4),
              children: [
                const TextSpan(text: 'Transaction No: '),
                TextSpan(
                  text: _displayTxnNo,
                  style: s.body.copyWith(fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
          SizedBox(height: 4),
          Text(
            'REF ID: $refId',
            textAlign: TextAlign.center,
            style: s.caption.copyWith(fontSize: 13, height: 1.4),
          ),
          Padding(
            padding: EdgeInsets.symmetric(vertical: 22),
            child: Divider(height: 1, color: s.border),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            decoration: BoxDecoration(
              color: _hasChange
                  ? s.success.withValues(alpha: 0.12)
                  : s.accent.withValues(alpha: context.isPosDark ? 0.14 : 0.1),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: _hasChange
                    ? s.success.withValues(alpha: 0.45)
                    : s.accent.withValues(alpha: 0.35),
                width: _hasChange ? 2 : 1,
              ),
            ),
            child: Column(
              children: [
                Text(
                  _hasChange ? 'GIVE CUSTOMER' : 'CHANGE DUE',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                    color: _hasChange ? s.success : s.accent,
                  ),
                ),
                SizedBox(height: 10),
                Text(
                  formatPosMoney(changeDue),
                  style: TextStyle(
                    fontSize: 44,
                    fontWeight: FontWeight.w800,
                    color: s.text,
                    height: 1,
                  ),
                ),
                if (_hasChange) ...[
                  SizedBox(height: 10),
                  Text(
                    'Return this amount to the customer',
                    textAlign: TextAlign.center,
                    style: s.bodyMuted.copyWith(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (cashReceived != null && cashReceived! > 0.009) ...[
                    SizedBox(height: 6),
                    Text(
                      'Cash received ${formatPosMoney(cashReceived!)}',
                      textAlign: TextAlign.center,
                      style: s.caption.copyWith(fontSize: 12),
                    ),
                  ],
                ] else ...[
                  SizedBox(height: 8),
                  Text(
                    'No change required',
                    style: s.bodyMuted.copyWith(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SuccessActionButton extends StatelessWidget {
  const _SuccessActionButton({
    required this.icon,
    required this.label,
    required this.filled,
    required this.onPressed,
  });

  final IconData icon;
  final String label;
  final bool filled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final fg = filled ? s.onBrand : s.text;
    final bg = filled ? context.posBrand.buttonPrimary : s.secondaryBtnBg;
    final border = filled ? context.posBrand.buttonPrimary : s.border;

    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          height: 88,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: border, width: filled ? 0 : 1),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 22, color: fg),
              SizedBox(height: 8),
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: fg,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
