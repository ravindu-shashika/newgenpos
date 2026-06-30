import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/local_print_settings_provider.dart';
import '../../../core/theme/pos_theme.dart';
import '../providers/pos_settings_subpage_provider.dart';
import 'pos_settings_ui.dart';

/// Printer summary on Settings — opens full settings via the gear icon.
class PosPrinterSettingsCard extends ConsumerWidget {
  const PosPrinterSettingsCard({super.key});

  void _openPrinterSettings(BuildContext context, WidgetRef ref) {
    openPosPrinterSettings(ref);
  }

  String _paperLabel(String size) {
    switch (size) {
      case '58mm':
        return '58 mm';
      case 'a4':
        return 'A4';
      default:
        return '80 mm';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = context.posStyles;
    final settings = ref.watch(localPrintSettingsProvider);
    final printerLabel = settings.printerName.trim().isNotEmpty
        ? settings.printerName
        : 'Windows default';

    return PosSettingsSectionCard(
      icon: Icons.print_outlined,
      title: 'Printer & receipts',
      subtitle: 'Paper size, direct print, header, footer, and logo',
      trailing: IconButton(
        tooltip: 'Open printer settings',
        onPressed: () => _openPrinterSettings(context, ref),
        icon: const Icon(Icons.settings_outlined),
        style: IconButton.styleFrom(
          backgroundColor: s.accent.withValues(alpha: 0.1),
          foregroundColor: s.accent,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _SummaryChip(
            icon: Icons.straighten_outlined,
            label: 'Paper',
            value: _paperLabel(settings.paperSize),
          ),
          SizedBox(height: 8),
          _SummaryChip(
            icon: Icons.flash_on_outlined,
            label: 'Direct print',
            value: settings.directPrint ? 'Enabled' : 'Disabled',
            highlight: settings.directPrint,
          ),
          SizedBox(height: 8),
          _SummaryChip(
            icon: Icons.print_rounded,
            label: 'Printer',
            value: printerLabel,
          ),
          SizedBox(height: 14),
          PosSettingsActionTile(
            icon: Icons.tune_outlined,
            title: 'Configure printer',
            subtitle: 'Receipt layout, logo, numbering, and display options',
            onTap: () => _openPrinterSettings(context, ref),
          ),
        ],
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  const _SummaryChip({
    required this.icon,
    required this.label,
    required this.value,
    this.highlight = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: s.elevatedBg,
        borderRadius: BorderRadius.circular(kPosButtonRadius),
        border: Border.all(color: s.border),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: s.accent),
          SizedBox(width: 10),
          Text(
            label,
            style: s.bodyMuted.copyWith(fontSize: 13),
          ),
          const Spacer(),
          if (highlight)
            Container(
              margin: const EdgeInsets.only(right: 8),
              width: 7,
              height: 7,
              decoration: BoxDecoration(
                color: s.success,
                shape: BoxShape.circle,
              ),
            ),
          Flexible(
            child: Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.right,
              style: s.titleMedium.copyWith(fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
