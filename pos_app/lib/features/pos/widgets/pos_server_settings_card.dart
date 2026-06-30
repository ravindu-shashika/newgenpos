import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/providers/pos_connectivity_providers.dart';
import '../../../core/theme/pos_theme.dart';
import '../providers/pos_settings_subpage_provider.dart';
import 'pos_settings_ui.dart';

/// Server summary on Settings — opens full API setup via the gear icon.
class PosServerSettingsCard extends ConsumerWidget {
  const PosServerSettingsCard({super.key});

  void _openServerSettings(BuildContext context, WidgetRef ref) {
    openPosServerSettings(ref);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = context.posStyles;
    ref.watch(sessionRevisionProvider);
    final session = ref.read(sessionServiceProvider);
    final linkStatus = ref.watch(posLinkStatusProvider);
    final serverOnline = linkStatus.valueOrNull?.serverOnline ?? false;
    final apiUrl = AppConfig.displayPosBaseUrl(session.posBaseUrl);
    final usingCustom = session.posBaseUrl?.trim().isNotEmpty == true;

    return PosSettingsSectionCard(
      icon: Icons.dns_outlined,
      title: 'Server & API',
      subtitle: 'POS API path for sync, catalog download, and online sales',
      trailing: IconButton(
        tooltip: 'Open server settings',
        onPressed: () => _openServerSettings(context, ref),
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
            icon: Icons.link_outlined,
            label: 'API URL',
            value: apiUrl,
          ),
          SizedBox(height: 8),
          _SummaryChip(
            icon: Icons.cloud_outlined,
            label: 'Source',
            value: usingCustom ? 'Custom URL' : 'Build default',
          ),
          SizedBox(height: 8),
          _SummaryChip(
            icon: Icons.monitor_heart_outlined,
            label: 'Server status',
            value: linkStatus.isLoading && !linkStatus.hasValue
                ? 'Checking…'
                : serverOnline
                    ? 'Online'
                    : 'Offline',
            highlight: serverOnline,
          ),
          SizedBox(height: 14),
          PosSettingsActionTile(
            icon: Icons.settings_ethernet_outlined,
            title: 'Configure server',
            subtitle: 'Set API path, test connection, and save',
            onTap: () => _openServerSettings(context, ref),
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
              maxLines: 2,
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
