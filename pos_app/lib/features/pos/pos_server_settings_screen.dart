import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/pos_theme.dart';
import 'providers/pos_settings_subpage_provider.dart';
import 'widgets/pos_server_settings_form.dart';
import 'widgets/pos_settings_ui.dart';
import 'widgets/pos_touch_keyboard_host.dart';

/// Server / API settings — rendered inside [PosAppShell] (sidebar + header stay visible).
class PosServerSettingsScreen extends ConsumerWidget {
  const PosServerSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PosTouchKeyboardHost(
      child: ColoredBox(
        color: PosColors.pageBg,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(28, 24, 28, 28),
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Material(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(kPosButtonRadius),
                        child: InkWell(
                          onTap: () => closePosServerSettings(ref),
                          borderRadius: BorderRadius.circular(kPosButtonRadius),
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              borderRadius:
                                  BorderRadius.circular(kPosButtonRadius),
                              border: Border.all(color: PosColors.border),
                            ),
                            child: const Icon(
                              Icons.arrow_back_rounded,
                              size: 20,
                              color: PosColors.textPrimary,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      const Expanded(
                        child: PosSettingsPageHeader(
                          title: 'Server settings',
                          subtitle:
                              'Configure the POS API path used for sync, catalog, and health checks',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const PosSettingsSectionCard(
                    icon: Icons.dns_outlined,
                    title: 'API connection',
                    subtitle: 'Laravel POS API base URL for this terminal',
                    child: PosServerSettingsForm(pageLayout: true),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
