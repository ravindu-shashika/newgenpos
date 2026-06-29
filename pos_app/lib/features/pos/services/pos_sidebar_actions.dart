import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/app_providers.dart';
import '../../../core/providers/local_print_settings_provider.dart';
import '../../../core/providers/pos_meta_provider.dart';
import '../models/cash_register_details.dart';
import '../widgets/cash_register_dialogs.dart';
import '../widgets/pos_toast.dart';
import '../widgets/pos_touch_keyboard_controller.dart';
import 'cash_register_day_end_print_service.dart';
import 'receipt_print_service.dart';

/// Sidebar quick actions available from any shell page.
class PosSidebarActions {
  PosSidebarActions._();

  static Future<void> printLastReceipt({
    required BuildContext context,
    required WidgetRef ref,
  }) async {
    try {
      final session = ref.read(sessionServiceProvider);
      final cashierName = session.userName?.trim() ?? '';
      final receipt = await ref.read(localSaleRepositoryProvider).getLastReceipt(
            cashierName: cashierName,
          );
      if (!context.mounted) return;
      if (receipt == null || receipt.lines.isEmpty) {
        PosToast.show(
          context,
          'No completed sale to print',
          type: PosToastType.error,
        );
        return;
      }
      final printSettings = ref.read(localPrintSettingsProvider);
      await ReceiptPrintService.printReceipt(
        receipt,
        printSettings: printSettings,
        cashierName: cashierName,
      );
      if (context.mounted) {
        PosToast.show(
          context,
          'Last receipt sent to printer',
          type: PosToastType.success,
        );
      }
    } catch (e) {
      if (context.mounted) {
        PosToast.show(context, 'Print failed: $e', type: PosToastType.error);
      }
    }
  }

  static Future<void> showCashRegisterDetails({
    required BuildContext context,
    required WidgetRef ref,
  }) async {
    final session = ref.read(sessionServiceProvider);
    final userId = session.userId;
    final service = ref.read(cashRegisterServiceProvider);
    final registerId = await service.getCachedRegisterId();

    if (userId == null || registerId == null) {
      if (context.mounted) {
        PosToast.show(
          context,
          'No open cash register',
          type: PosToastType.error,
        );
      }
      return;
    }

    final online = await ref.read(syncServiceProvider).probeOnline();
    if (!context.mounted) return;
    if (!online) {
      PosToast.show(
        context,
        'Connect to internet for cash register',
        type: PosToastType.error,
      );
      return;
    }

    ref.read(posTouchKeyboardControllerProvider).detach();

    await showCashRegisterDetailsDialog(
      context: context,
      service: service,
      registerId: registerId,
      userId: userId,
      onDayEndPrint: (details, actualCash) => _printDayEndSummary(
        ref,
        details,
        actualCash,
        registerId,
      ),
    );
  }

  static Future<void> _printDayEndSummary(
    WidgetRef ref,
    CashRegisterDetails details,
    double actualCash,
    int registerId,
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
