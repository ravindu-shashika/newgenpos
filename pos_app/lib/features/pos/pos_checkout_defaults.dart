import '../../core/database/app_database.dart';
import 'models/pos_settings.dart';
import 'models/pos_ui_settings.dart';

typedef CheckoutPartyIds = ({
  int? customerId,
  int? billerId,
  int? warehouseId,
});

int? _positiveId(int? id) => (id != null && id > 0) ? id : null;

int? _idInCatalog(int? id, Iterable<int> catalogIds) {
  final value = _positiveId(id);
  if (value == null) return null;
  return catalogIds.contains(value) ? value : null;
}

/// Resolves register customer / biller / warehouse for a new sale.
///
/// Only IDs present in the downloaded catalog are used. Defaults come from
/// local UI override → server POS settings → sync meta (never invents a
/// missing "Customer #N").
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
  final customerIds = customers.map((c) => c.id).toSet();
  final billerIds = billers.map((b) => b.id).toSet();
  final warehouseIds = warehouses.map((w) => w.id).toSet();

  // Prefer configured defaults, but only if they exist in downloaded data.
  int? customerId = _idInCatalog(ui.defaultCustomerId, customerIds) ??
      _idInCatalog(settings?.customerId, customerIds) ??
      _idInCatalog(syncMeta?.defaultCustomerId, customerIds);
  if (includeSessionFallback) {
    customerId ??= _idInCatalog(sessionCustomerId, customerIds);
  }

  int? billerId = _idInCatalog(ui.defaultBillerId, billerIds) ??
      _idInCatalog(settings?.billerId, billerIds) ??
      _idInCatalog(syncMeta?.defaultBillerId, billerIds);
  if (includeSessionFallback) {
    billerId ??= _idInCatalog(sessionBillerId, billerIds);
  }

  int? warehouseId = _idInCatalog(sessionWarehouseId, warehouseIds) ??
      _idInCatalog(settings?.warehouseId, warehouseIds) ??
      _idInCatalog(syncMeta?.warehouseId, warehouseIds);

  // Warehouse is required for stock — fall back to first downloaded warehouse.
  warehouseId ??= warehouses.isNotEmpty ? warehouses.first.id : null;

  // Do not invent a customer/biller when defaults are missing or not downloaded.
  return (
    customerId: customerId,
    billerId: billerId,
    warehouseId: warehouseId,
  );
}
