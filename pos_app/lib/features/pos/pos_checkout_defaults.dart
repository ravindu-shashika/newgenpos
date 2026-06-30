import '../../core/database/app_database.dart';
import 'models/pos_settings.dart';
import 'models/pos_ui_settings.dart';

typedef CheckoutPartyIds = ({
  int? customerId,
  int? billerId,
  int? warehouseId,
});

/// Resolves register customer / biller / warehouse for a new sale.
///
/// Priority: local UI default → server POS settings → sync meta → optional
/// session fallback → first catalog row.
CheckoutPartyIds resolveCheckoutPartyIds({
  required PosUiSettings ui,
  PosSettings? settings,
  SyncMetaData? syncMeta,
  int? sessionCustomerId,
  int? sessionBillerId,
  int? sessionWarehouseId,
  required List<Customer> customers,
  required List<Biller> billers,
  required List<Warehouse> warehouses,
  bool includeSessionFallback = true,
}) {
  int? customerId = ui.defaultCustomerId ??
      settings?.customerId ??
      syncMeta?.defaultCustomerId;
  if (includeSessionFallback) {
    customerId ??= sessionCustomerId;
  }

  int? billerId = ui.defaultBillerId ??
      settings?.billerId ??
      syncMeta?.defaultBillerId;
  if (includeSessionFallback) {
    billerId ??= sessionBillerId;
  }

  int? warehouseId = sessionWarehouseId ??
      settings?.warehouseId ??
      syncMeta?.warehouseId;

  customerId ??= customers.isNotEmpty ? customers.first.id : null;
  billerId ??= billers.isNotEmpty ? billers.first.id : null;
  warehouseId ??= warehouses.isNotEmpty ? warehouses.first.id : null;

  return (
    customerId: customerId,
    billerId: billerId,
    warehouseId: warehouseId,
  );
}
