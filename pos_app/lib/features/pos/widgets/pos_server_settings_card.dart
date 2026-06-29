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
  const PosServerSettingsCard({super.key, this.accentColor});

  final Color? accentColor;

  void _openServerSettings(BuildContext context, WidgetRef ref) {
    openPosServerSettings(ref);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
          backgroundColor: (accentColor ?? context.posBrand.primary)
              .withValues(alpha: 0.1),
          foregroundColor: accentColor ?? context.posBrand.primary,
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
          const SizedBox(height: 8),
          _SummaryChip(
            icon: Icons.cloud_outlined,
            label: 'Source',
            value: usingCustom ? 'Custom URL' : 'Build default',
          ),
          const SizedBox(height: 8),
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
          const SizedBox(height: 14),
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
    final brand = context.posBrand;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: PosColors.pageBg,
        borderRadius: BorderRadius.circular(kPosButtonRadius),
        border: Border.all(color: PosColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: brand.primary),
          const SizedBox(width: 10),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              color: PosColors.textMuted,
              fontWeight: FontWeight.w500,
            ),
          ),
          const Spacer(),
          if (highlight)
            Container(
              margin: const EdgeInsets.only(right: 8),
              width: 7,
              height: 7,
              decoration: const BoxDecoration(
                color: PosColors.teal,
                shape: BoxShape.circle,
              ),
            ),
          Flexible(
            child: Text(
              value,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: PosColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
