import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../widgets/pos_sidebar.dart';

/// Active main-shell page — sidebar updates this instead of pushing routes.
final posNavSectionProvider =
    StateProvider<PosNavSection>((ref) => PosNavSection.dashboard);

/// Page index for [PageView] inside the app shell (history is a dialog only).
int posSectionPageIndex(PosNavSection section) {
  switch (section) {
    case PosNavSection.dashboard:
      return 0;
    case PosNavSection.register:
      return 1;
    case PosNavSection.inventory:
      return 2;
    case PosNavSection.staff:
      return 3;
    case PosNavSection.settings:
      return 4;
    case PosNavSection.history:
      return 0;
  }
}

PosNavSection posPageIndexSection(int index) {
  switch (index) {
    case 1:
      return PosNavSection.register;
    case 2:
      return PosNavSection.inventory;
    case 3:
      return PosNavSection.staff;
    case 4:
      return PosNavSection.settings;
    default:
      return PosNavSection.dashboard;
  }
}
