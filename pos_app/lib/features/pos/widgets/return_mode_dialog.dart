import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

enum ReturnEntryMode { withPastBill, withoutPastBill }

Future<ReturnEntryMode?> showReturnModeDialog(BuildContext context) {
  return showPosDialog<ReturnEntryMode>(
    context: context,
    builder: (ctx) => PosProfessionalDialogShell(
      title: 'Sale return',
      subtitle: 'Choose how to process the return',
      icon: Icons.undo_rounded,
      maxWidth: 480,
      onClose: () => Navigator.pop(context),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _ReturnModeTile(
            icon: Icons.receipt_long_outlined,
            title: 'With past bill',
            subtitle: 'Find original sale by reference and return items',
            onTap: () => Navigator.pop(context, ReturnEntryMode.withPastBill),
          ),
          SizedBox(height: 12),
          _ReturnModeTile(
            icon: Icons.qr_code_scanner,
            title: 'Without past bill',
            subtitle: 'Scan returned products — store credit issued',
            onTap: () =>
                Navigator.pop(context, ReturnEntryMode.withoutPastBill),
          ),
          SizedBox(height: 8),
          Text(
            'No cash refund. Credit can be settled on the next sale.',
            style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    ),
  );
}

class _ReturnModeTile extends StatelessWidget {
  const _ReturnModeTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).colorScheme.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: Theme.of(context).dividerColor),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: context.posBrand.primaryLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: context.posBrand.primary),
              ),
              SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }
}
