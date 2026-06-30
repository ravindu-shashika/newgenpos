import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'pos_nav_provider.dart';
import '../widgets/pos_sidebar.dart';

enum PosSettingsSubPage {
  main,
  terminal,
  appearance,
  checkout,
  maintenance,
  printer,
  server,
}

final posSettingsSubPageProvider =
    StateProvider<PosSettingsSubPage>((ref) => PosSettingsSubPage.main);

void openPosSettingsSubPage(WidgetRef ref, PosSettingsSubPage page) {
  ref.read(posNavSectionProvider.notifier).state = PosNavSection.settings;
  ref.read(posSettingsSubPageProvider.notifier).state = page;
}

void closePosSettingsSubPage(WidgetRef ref) {
  ref.read(posSettingsSubPageProvider.notifier).state = PosSettingsSubPage.main;
}

void openPosPrinterSettings(WidgetRef ref) {
  openPosSettingsSubPage(ref, PosSettingsSubPage.printer);
}

void closePosPrinterSettings(WidgetRef ref) => closePosSettingsSubPage(ref);

void openPosServerSettings(WidgetRef ref) {
  openPosSettingsSubPage(ref, PosSettingsSubPage.server);
}

void closePosServerSettings(WidgetRef ref) => closePosSettingsSubPage(ref);
