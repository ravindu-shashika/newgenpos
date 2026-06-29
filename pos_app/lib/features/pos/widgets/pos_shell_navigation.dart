import 'package:flutter/material.dart';

import '../pos_inventory_screen.dart';
import '../pos_screen.dart';
import '../pos_settings_screen.dart';
import '../pos_staff_screen.dart';

/// Shared sidebar navigation — push or pop to the target screen.
class PosShellNavigation {
  PosShellNavigation(this.context);

  final BuildContext context;

  void goDashboard() {
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  void openRegister() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const PosScreen()),
    );
  }

  void openInventory() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const PosInventoryScreen()),
    );
  }

  void openStaff() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const PosStaffScreen()),
    );
  }

  Future<void> openSettings() async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const PosSettingsScreen()),
    );
  }
}
