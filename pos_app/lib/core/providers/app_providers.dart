import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../pos_http/pos_api_client.dart';
import '../config/app_config.dart';
import '../database/app_database.dart';
import '../repositories/local_auth_repository.dart';
import '../repositories/local_cash_register_repository.dart';
import '../repositories/local_exchange_repository.dart';
import '../repositories/local_return_repository.dart';
import '../repositories/local_sale_repository.dart';
import '../repositories/product_lookup_repository.dart';
import '../repositories/warehouse_repository.dart';
import '../../features/pos/models/scanned_product.dart';
import '../services/session_service.dart';
import '../sync/sync_service.dart';
import '../sync/catalog_download_service.dart';
import '../../features/pos/pos_checkout_state.dart';
import '../../features/pos/services/cash_register_service.dart';
import 'pos_meta_provider.dart';

final appDatabaseProvider = Provider<AppDatabase>((ref) {
  throw UnimplementedError('AppDatabase must be overridden in main()');
});

final sessionServiceProvider = Provider<SessionService>((ref) {
  throw UnimplementedError('SessionService must be overridden in main()');
});

/// Bump after register / reset / logout so [PosApp] home route updates.
final sessionRevisionProvider = StateProvider<int>((ref) => 0);

/// Bump after background or manual sales sync so pending/online providers refresh.
final syncRevisionProvider = StateProvider<int>((ref) => 0);

/// True while sidebar / dialog is uploading pending sales.
final salesSyncInProgressProvider = StateProvider<bool>((ref) => false);

void bumpSessionState(WidgetRef ref) {
  ref.read(sessionRevisionProvider.notifier).state++;
  ref.invalidate(apiClientProvider);
}

final apiClientProvider = Provider<PosApiClient>((ref) {
  final session = ref.watch(sessionServiceProvider);
  return PosApiClient(
    posToken: session.posToken,
    baseUrl: AppConfig.resolvePosBaseUrl(session.posBaseUrl),
  );
});

final localCashRegisterRepositoryProvider =
    Provider<LocalCashRegisterRepository>((ref) {
  return LocalCashRegisterRepository(ref.watch(appDatabaseProvider));
});

final cashRegisterServiceProvider = Provider<CashRegisterService>((ref) {
  return CashRegisterService(
    ref.watch(apiClientProvider),
    ref.watch(localCashRegisterRepositoryProvider),
  );
});

/// Increment to re-run [isOnlineProvider] (manual refresh / periodic poll).
final onlineRefreshTickProvider = StateProvider<int>((ref) => 0);

final localAuthRepositoryProvider = Provider<LocalAuthRepository>((ref) {
  return LocalAuthRepository(ref.watch(appDatabaseProvider));
});

final catalogDownloadServiceProvider = Provider<CatalogDownloadService>((ref) {
  return CatalogDownloadService(
    ref.watch(appDatabaseProvider),
    ref.watch(apiClientProvider),
    ref.watch(localAuthRepositoryProvider),
    ref.watch(posSettingsRepositoryProvider),
  );
});

final productLookupRepositoryProvider = Provider<ProductLookupRepository>((ref) {
  return ProductLookupRepository(
    ref.watch(appDatabaseProvider),
    ref.watch(apiClientProvider),
  );
});

final localSaleRepositoryProvider = Provider<LocalSaleRepository>((ref) {
  return LocalSaleRepository(ref.watch(appDatabaseProvider));
});

final localReturnRepositoryProvider = Provider<LocalReturnRepository>((ref) {
  return LocalReturnRepository(
    ref.watch(appDatabaseProvider),
    ref.watch(localSaleRepositoryProvider),
  );
});

final localExchangeRepositoryProvider = Provider<LocalExchangeRepository>((ref) {
  return LocalExchangeRepository(
    ref.watch(appDatabaseProvider),
    ref.watch(localSaleRepositoryProvider),
  );
});

final warehouseRepositoryProvider = Provider<WarehouseRepository>((ref) {
  return WarehouseRepository(ref.watch(appDatabaseProvider));
});

final syncServiceProvider = Provider<SyncService>((ref) {
  final session = ref.watch(sessionServiceProvider);
  final api = ref.watch(apiClientProvider);
  final sales = ref.watch(localSaleRepositoryProvider);
  final returns = ref.watch(localReturnRepositoryProvider);
  final exchanges = ref.watch(localExchangeRepositoryProvider);
  final cashRegisters = ref.watch(localCashRegisterRepositoryProvider);

  return SyncService(
    api: api,
    deviceId: session.deviceId,
    terminalCode: session.terminalCode,
    userId: session.userId,
    loadPendingSales: ({bool includeFailed = true}) =>
        sales.loadPendingSyncPayloads(includeFailed: includeFailed),
    loadUnsyncedUuids: sales.loadUnsyncedClientUuids,
    markSaleSynced: (uuid, {required status, serverSaleId, referenceNo, error}) {
      return sales.markSynced(
        uuid,
        status: status,
        serverSaleId: serverSaleId,
        referenceNo: referenceNo,
        error: error,
      );
    },
    markManySaleSynced: sales.markManySynced,
    loadPendingReturns: ({bool includeFailed = true}) =>
        returns.loadPendingSyncPayloads(includeFailed: includeFailed),
    markReturnSynced: (uuid, {required status, serverSaleId, referenceNo, error}) {
      return returns.markSynced(
        uuid,
        status: status,
        serverReturnId: serverSaleId,
        referenceNo: referenceNo,
        error: error,
      );
    },
    loadPendingExchanges: ({bool includeFailed = true}) =>
        exchanges.loadPendingSyncPayloads(includeFailed: includeFailed),
    markExchangeSynced: (uuid, {required status, serverSaleId, referenceNo, error}) {
      return exchanges.markSynced(
        uuid,
        status: status,
        serverExchangeId: serverSaleId,
        referenceNo: referenceNo,
        error: error,
      );
    },
    syncCashRegisters: () => cashRegisters.syncPendingRegisters(api),
    onSyncComplete: () {
      ref.read(syncRevisionProvider.notifier).state++;
    },
  );
});

final posCheckoutProvider =
    StateProvider<PosCheckoutState>((ref) => const PosCheckoutState());

/// Back-compat alias for cart lines only.
final cartProvider = Provider<PosCheckoutState>(
  (ref) => ref.watch(posCheckoutProvider),
);

/// First page only — prefer [productGridProvider] for the POS catalog grid.
final warehouseProductsProvider = FutureProvider<List<ScannedProduct>>((ref) async {
  ref.watch(sessionRevisionProvider);
  ref.watch(productFilterProvider);
  ref.watch(posCheckoutProvider);
  final session = ref.watch(sessionServiceProvider);
  final priceType = ref.watch(posCheckoutProvider).priceType;
  final warehouseId = session.warehouseId;
  if (warehouseId == null) return [];
  final filter = ref.watch(productFilterProvider);
  return ref.read(productLookupRepositoryProvider).listInStock(
        warehouseId: warehouseId,
        filter: filter.filter,
        filterId: filter.filterId,
        priceType: priceType,
      );
});

final pendingSyncCountProvider = FutureProvider<int>((ref) async {
  ref.watch(syncRevisionProvider);
  final db = ref.watch(appDatabaseProvider);
  return db.countPendingSales();
});

final isOnlineProvider = FutureProvider<bool>((ref) async {
  ref.watch(syncRevisionProvider);
  ref.watch(onlineRefreshTickProvider);
  final sync = ref.watch(syncServiceProvider);
  return sync.probeOnline(quiet: true);
});
