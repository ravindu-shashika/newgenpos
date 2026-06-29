import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/pos/models/pos_device_settings.dart';
import '../../features/pos/models/pos_settings.dart';
import '../../features/pos/product_filter.dart';
import '../database/app_database.dart'
    show Biller, Brand, Category, Customer, LocalCoupon, Taxe, Warehouse;
import '../repositories/pos_settings_repository.dart';
import 'app_providers.dart';

class PosLocalMeta {
  PosLocalMeta({
    required this.customers,
    required this.billers,
    required this.warehouses,
    required this.categories,
    required this.brands,
    required this.taxes,
    required this.coupons,
  });

  final List<Customer> customers;
  final List<Biller> billers;
  final List<Warehouse> warehouses;
  final List<Category> categories;
  final List<Brand> brands;
  final List<Taxe> taxes;
  final List<LocalCoupon> coupons;
}

final posSettingsRepositoryProvider = Provider<PosSettingsRepository>((ref) {
  return PosSettingsRepository(ref.watch(appDatabaseProvider));
});

final posDeviceSettingsProvider = FutureProvider<PosDeviceSettings?>((ref) async {
  return ref.watch(posSettingsRepositoryProvider).loadDeviceSettings();
});

final posSettingsProvider = FutureProvider<PosSettings?>((ref) async {
  final bundle = await ref.watch(posDeviceSettingsProvider.future);
  return bundle?.pos;
});

final posLocalMetaProvider = FutureProvider<PosLocalMeta>((ref) async {
  final db = ref.watch(appDatabaseProvider);
  final customers = await db.select(db.customers).get();
  final billers = await db.select(db.billers).get();
  final warehouses = await db.select(db.warehouses).get();
  final categories = await db.select(db.categories).get();
  final brands = await db.select(db.brands).get();
  final taxes = await db.select(db.taxes).get();
  final coupons = await db.select(db.localCoupons).get();
  return PosLocalMeta(
    customers: customers,
    billers: billers,
    warehouses: warehouses,
    categories: categories,
    brands: brands,
    taxes: taxes,
    coupons: coupons,
  );
});

final productFilterProvider =
    StateProvider<ProductFilterState>((ref) => const ProductFilterState());
