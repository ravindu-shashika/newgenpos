import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

enum CheckoutPartyDialogResult {
  cancelled,
  setDefaults,
}

Future<CheckoutPartyDialogResult?> showCheckoutPartyRequiredDialog({
  required BuildContext context,
  required bool missingCustomer,
  required bool missingBiller,
  String? defaultCustomerLabel,
  String? defaultBillerLabel,
  bool canApplyDefaults = true,
}) {
  final missing = <String>[
    if (missingCustomer) 'Customer',
    if (missingBiller) 'Biller',
  ];
  final missingText = missing.join(' and ');

  return showPosDialog<CheckoutPartyDialogResult>(
    context: context,
    builder: (ctx) {
      final scheme = Theme.of(ctx).colorScheme;

      return PosProfessionalDialogShell(
        title: 'Customer & biller required',
        subtitle: 'Select both before checkout',
        icon: Icons.warning_amber_rounded,
        maxWidth: 460,
        maxBodyHeight: 280,
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '$missingText not selected. Choose them on the register header or apply the defaults from server POS settings.',
              style: TextStyle(
                fontSize: 14,
                height: 1.5,
                color: scheme.onSurface,
              ),
            ),
            const SizedBox(height: 16),
            if (missingCustomer)
              _MissingPartyRow(
                icon: Icons.person_outline,
                label: 'Customer',
                defaultLabel: defaultCustomerLabel,
              ),
            if (missingCustomer && missingBiller) const SizedBox(height: 8),
            if (missingBiller)
              _MissingPartyRow(
                icon: Icons.badge_outlined,
                label: 'Biller',
                defaultLabel: defaultBillerLabel,
              ),
            if (!canApplyDefaults) ...[
              const SizedBox(height: 14),
              Text(
                'No default customer or biller is configured in server POS settings.',
                style: TextStyle(
                  fontSize: 13,
                  height: 1.45,
                  color: scheme.error,
                ),
              ),
            ],
          ],
        ),
        footer: PosProfessionalDialogFooter(
          secondaryLabel: 'Cancel',
          primaryLabel: 'Set as default',
          primaryEnabled: canApplyDefaults,
          onSecondary: () =>
              Navigator.of(ctx).pop(CheckoutPartyDialogResult.cancelled),
          onPrimary: canApplyDefaults
              ? () => Navigator.of(ctx).pop(CheckoutPartyDialogResult.setDefaults)
              : null,
        ),
      );
    },
  );
}

class _MissingPartyRow extends StatelessWidget {
  const _MissingPartyRow({
    required this.icon,
    required this.label,
    this.defaultLabel,
  });

  final IconData icon;
  final String label;
  final String? defaultLabel;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final brand = context.posBrand;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: scheme.errorContainer.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: scheme.error.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: scheme.error),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$label not selected',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: scheme.onSurface,
                  ),
                ),
                if (defaultLabel != null && defaultLabel!.trim().isNotEmpty)
                  Text(
                    'Server default: ${defaultLabel!.trim()}',
                    style: TextStyle(
                      fontSize: 12,
                      color: brand.primary,
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
