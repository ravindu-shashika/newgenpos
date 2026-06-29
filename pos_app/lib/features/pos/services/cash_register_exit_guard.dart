import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/app_providers.dart';
import '../../../core/providers/local_print_settings_provider.dart';
import '../../../core/providers/pos_meta_provider.dart';
import '../models/cash_register_details.dart';
import '../models/pos_settings.dart';
import '../widgets/cash_register_dialogs.dart';
import '../widgets/pos_touch_keyboard_controller.dart';
import 'cash_register_day_end_print_service.dart';

/// Blocks logout / app close until an open cash register is closed.
class CashRegisterExitGuard {
  CashRegisterExitGuard._();

  /// Returns `true` when exit may continue (register closed or not enabled).
  static Future<bool> ensureClosed({
    required WidgetRef ref,
    required BuildContext context,
  }) async {
    PosSettings? settings = ref.read(posSettingsProvider).value;
    settings ??= await ref.read(posSettingsProvider.future);
    if (settings?.cashRegister != true) return true;

    final session = ref.read(sessionServiceProvider);
    final userId = session.userId;
    if (userId == null) return true;

    final service = ref.read(cashRegisterServiceProvider);
    final registerId = await service.getCachedRegisterId();
    if (registerId == null) return true;

    final online = await ref.read(syncServiceProvider).probeOnline();
    if (!online) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Connect to internet and close cash register before exiting',
            ),
          ),
        );
      }
      return false;
    }

    if (!context.mounted) return false;

    ref.read(posTouchKeyboardControllerProvider).detach();

    return showCashRegisterDetailsDialog(
      context: context,
      service: service,
      registerId: registerId,
      userId: userId,
      requireClose: true,
      onDayEndPrint: (details, actualCash) =>
          _printDayEndSummary(ref, details, actualCash, registerId),
    );
  }

  static Future<void> _printDayEndSummary(
    WidgetRef ref,
    CashRegisterDetails details,
    double actualCash,
    int? registerId,
  ) async {
    final printSettings = ref.read(localPrintSettingsProvider);
    final session = ref.read(sessionServiceProvider);
    final meta = ref.read(posLocalMetaProvider).value;
    String? warehouseName;
    final whId = session.warehouseId;
    if (meta != null && whId != null) {
      for (final w in meta.warehouses) {
        if (w.id == whId) {
          warehouseName = w.name;
          break;
        }
      }
    }
    await CashRegisterDayEndPrintService.printDayEndSummary(
      details: details,
      actualCash: actualCash,
      printSettings: printSettings,
      cashierName: session.userName,
      warehouseName: warehouseName,
      registerId: registerId,
    );
  }
}
