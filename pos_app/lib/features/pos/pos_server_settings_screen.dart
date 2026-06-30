import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'providers/pos_settings_subpage_provider.dart';
import 'widgets/pos_server_settings_form.dart';
import 'widgets/pos_settings_ui.dart';

/// Server / API settings — rendered inside [PosAppShell] (sidebar + header stay visible).
class PosServerSettingsScreen extends ConsumerWidget {
  const PosServerSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PosSettingsSubPageShell(
      title: 'Server settings',
      subtitle:
          'Configure the POS API path used for sync, catalog, and health checks',
      onBack: () => closePosSettingsSubPage(ref),
      child: const PosSettingsSectionCard(
        icon: Icons.dns_outlined,
        title: 'API connection',
        subtitle: 'Laravel POS API base URL for this terminal',
        child: PosServerSettingsForm(pageLayout: true),
      ),
    );
  }
}
