import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

const kPosShortcuts = <Map<String, String>>[
  {'action': 'Focus search', 'keys': 'Shift + S'},
  {'action': 'Focus customer', 'keys': 'Shift + C'},
  {'action': 'Save draft', 'keys': 'Shift + D'},
  {'action': 'Cash payment', 'keys': 'Shift + F'},
  {'action': 'Save — discount tab', 'keys': 'Shift + E'},
  {'action': 'Save — coupon tab', 'keys': 'Shift + K'},
  {'action': 'Shipping cost', 'keys': 'Shift + Q'},
  {'action': 'Order tax', 'keys': 'Shift + X'},
];

Future<void> showPosShortcuts(
  BuildContext context, {
  bool showShipping = true,
  bool showTax = true,
}) {
  final shortcuts = kPosShortcuts.where((s) {
    final action = s['action']!;
    if (!showShipping && action == 'Shipping cost') return false;
    if (!showTax && action == 'Order tax') return false;
    return true;
  }).toList();

  return showPosDialog<void>(
    context: context,
    builder: (ctx) => PosProfessionalDialog(
      title: 'Keyboard Shortcuts',
      subtitle: 'Quick actions on the register',
      icon: Icons.keyboard_outlined,
      maxWidth: 460,
      maxBodyHeight: 360,
      primaryLabel: 'Close',
      onPrimary: () => Navigator.pop(ctx),
      body: ListView.separated(
        shrinkWrap: true,
        itemCount: shortcuts.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) {
          final s = shortcuts[i];
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    s['action']!,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: context.posBrand.primaryLight,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    s['keys']!,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: context.posBrand.primary,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    ),
  );
}
