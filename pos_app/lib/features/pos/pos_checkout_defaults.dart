import '../../core/database/app_database.dart';
import 'models/pos_settings.dart';
import 'models/pos_ui_settings.dart';

typedef CheckoutPartyIds = ({
  int? customerId,
  int? billerId,
  int? warehouseId,
});

int? _positiveId(int? id) => (id != null && id > 0) ? id : null;

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
  int? customerId = _positiveId(ui.defaultCustomerId) ??
      _positiveId(settings?.customerId) ??
      _positiveId(syncMeta?.defaultCustomerId);
  if (includeSessionFallback) {
    customerId ??= _positiveId(sessionCustomerId);
  }

  int? billerId = _positiveId(ui.defaultBillerId) ??
      _positiveId(settings?.billerId) ??
      _positiveId(syncMeta?.defaultBillerId);
  if (includeSessionFallback) {
    billerId ??= _positiveId(sessionBillerId);
  }

  int? warehouseId = _positiveId(sessionWarehouseId) ??
      _positiveId(settings?.warehouseId) ??
      _positiveId(syncMeta?.warehouseId);

  // Prefer catalog rows that match resolved ids; otherwise first active row.
  customerId ??= customers.isNotEmpty ? customers.first.id : null;
  billerId ??= billers.isNotEmpty ? billers.first.id : null;
  warehouseId ??= warehouses.isNotEmpty ? warehouses.first.id : null;

  return (
    customerId: customerId,
    billerId: billerId,
    warehouseId: warehouseId,
  );
}
