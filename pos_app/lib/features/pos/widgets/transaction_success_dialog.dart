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
  Future<void> Function()? onPrintReceipt,
}) {
  return showPosDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (ctx) => _TransactionSuccessDialog(
      transactionNo: transactionNo,
      refId: refId,
      changeDue: changeDue,
      onPrintReceipt: onPrintReceipt,
    ),
  );
}

class _TransactionSuccessDialog extends StatelessWidget {
  const _TransactionSuccessDialog({
    required this.transactionNo,
    required this.refId,
    required this.changeDue,
    this.onPrintReceipt,
  });

  final String transactionNo;
  final String refId;
  final double changeDue;
  final Future<void> Function()? onPrintReceipt;

  String get _displayTxnNo {
    final raw = transactionNo.trim();
    if (raw.isEmpty) return '—';
    return raw.startsWith('#') ? raw : '#$raw';
  }

  @override
  Widget build(BuildContext context) {
    return PosProfessionalDialogShell(
      title: 'Transaction complete',
      subtitle: 'Sale recorded successfully',
      icon: Icons.check_circle_outline_rounded,
      maxWidth: 480,
      maxBodyHeight: 320,
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
          const SizedBox(width: 12),
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
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: PosColors.textMuted,
                height: 1.4,
              ),
              children: [
                const TextSpan(text: 'Transaction No: '),
                TextSpan(
                  text: _displayTxnNo,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    color: PosColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'REF ID: $refId',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13,
              color: PosColors.textMuted,
              height: 1.4,
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 22),
            child: Divider(height: 1, color: PosColors.border),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            decoration: BoxDecoration(
              color: PosColors.primaryLight,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: PosColors.primary.withValues(alpha: 0.1),
              ),
            ),
            child: Column(
              children: [
                const Text(
                  'CHANGE DUE',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.1,
                    color: PosColors.primary,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  formatPosMoney(changeDue),
                  style: const TextStyle(
                    fontSize: 42,
                    fontWeight: FontWeight.w800,
                    color: PosColors.primary,
                    height: 1,
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
    final fg = filled ? Colors.white : PosColors.textPrimary;
    final bg = filled ? PosColors.primary : Colors.white;
    final border = filled ? PosColors.primary : PosColors.border;

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
              const SizedBox(height: 8),
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
