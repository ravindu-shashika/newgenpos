import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Previously polled product_stock / product_batches via POST /setup/download
/// when Reverb was offline. That is no longer needed:
/// - Local sales already update warehouse stock in SQLite
/// - Live multi-terminal stock uses Reverb (`pos.stock.updated`)
/// - Manual catalog/stock sync remains available from Inventory / Settings
///
/// Provider kept so [PosAppShell] watch sites stay valid.
class PosStockFallbackScheduler {
  PosStockFallbackScheduler(this._ref);

  // ignore: unused_field
  final Ref _ref;

  void start() {}

  void dispose() {}
}

final posStockFallbackSchedulerProvider =
    Provider<PosStockFallbackScheduler>((ref) {
  final scheduler = PosStockFallbackScheduler(ref);
  scheduler.start();
  ref.onDispose(scheduler.dispose);
  return scheduler;
});
