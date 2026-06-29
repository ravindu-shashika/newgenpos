import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'pos_nav_provider.dart';
import '../widgets/pos_sidebar.dart';

enum PosSettingsSubPage { main, printer, server }

final posSettingsSubPageProvider =
    StateProvider<PosSettingsSubPage>((ref) => PosSettingsSubPage.main);

void _openSettingsSubPage(WidgetRef ref, PosSettingsSubPage page) {
  ref.read(posNavSectionProvider.notifier).state = PosNavSection.settings;
  ref.read(posSettingsSubPageProvider.notifier).state = page;
}

/// Opens printer settings inside the main shell (sidebar + header stay visible).
void openPosPrinterSettings(WidgetRef ref) {
  _openSettingsSubPage(ref, PosSettingsSubPage.printer);
}

void closePosPrinterSettings(WidgetRef ref) {
  ref.read(posSettingsSubPageProvider.notifier).state = PosSettingsSubPage.main;
}

/// Opens server / API settings inside the main shell.
void openPosServerSettings(WidgetRef ref) {
  _openSettingsSubPage(ref, PosSettingsSubPage.server);
}

void closePosServerSettings(WidgetRef ref) {
  ref.read(posSettingsSubPageProvider.notifier).state = PosSettingsSubPage.main;
}
