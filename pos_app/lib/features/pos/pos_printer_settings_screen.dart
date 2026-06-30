import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'providers/pos_settings_subpage_provider.dart';
import 'widgets/pos_printer_settings_form.dart';
import 'widgets/pos_settings_ui.dart';

/// Printer settings content area — rendered inside [PosAppShell] (sidebar + header).
class PosPrinterSettingsScreen extends ConsumerWidget {
  const PosPrinterSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PosSettingsSubPageShell(
      title: 'Printer settings',
      subtitle: 'Configure receipt paper, layout, logo, and print behavior',
      onBack: () => closePosSettingsSubPage(ref),
      child: const PosSettingsSectionCard(
        icon: Icons.receipt_long_outlined,
        title: 'Receipt & printer',
        subtitle: 'All options for printing sales and returns',
        child: PosPrinterSettingsForm(pageLayout: true),
      ),
    );
  }
}
