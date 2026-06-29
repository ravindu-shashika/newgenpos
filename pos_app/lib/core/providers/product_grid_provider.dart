import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/pos/models/pos_ui_settings.dart';
import '../../features/pos/models/scanned_product.dart';
import 'app_providers.dart';
import 'pos_meta_provider.dart';
import 'pos_ui_settings_provider.dart';

class ProductGridState {
  const ProductGridState({
    this.products = const [],
    this.totalCount = 0,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = false,
    this.error,
  });

  final List<ScannedProduct> products;
  final int totalCount;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final Object? error;

  ProductGridState copyWith({
    List<ScannedProduct>? products,
    int? totalCount,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    Object? error,
    bool clearError = false,
  }) {
    return ProductGridState(
      products: products ?? this.products,
      totalCount: totalCount ?? this.totalCount,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

final productGridProvider =
    StateNotifierProvider<ProductGridNotifier, ProductGridState>((ref) {
  return ProductGridNotifier(ref);
});

class ProductGridNotifier extends StateNotifier<ProductGridState> {
  ProductGridNotifier(this._ref) : super(const ProductGridState()) {
    _ref.listen(productFilterProvider, (_, __) => reload());
    _ref.listen(
      posCheckoutProvider.select((checkout) => checkout.priceType),
      (_, __) => reload(),
    );
    _ref.listen(
      posCheckoutProvider.select((checkout) => checkout.warehouseId),
      (_, __) => reload(),
    );
    _ref.listen(sessionRevisionProvider, (_, __) => reload());
    _ref.listen(
      posUiSettingsProvider.select((settings) => settings.gridColumnCount),
      (_, __) => reload(),
    );
    reload();
  }

  final Ref _ref;
  int _generation = 0;

  int _pageSize() {
    final ui = _ref.read(posUiSettingsProvider);
    final serverColumns = _ref.read(posSettingsProvider).value?.productNumber;
    final columns = PosUiSettings.resolveGridColumnCount(
      localOverride: ui.gridColumnCount,
      serverProductNumber: serverColumns,
    );
    final serverPage = serverColumns ?? 15;
    return (columns * 4).clamp(serverPage, 60);
  }

  Future<void> reload() async {
    final generation = ++_generation;
    state = state.copyWith(
      isLoading: true,
      isLoadingMore: false,
      clearError: true,
    );
    await _fetch(append: false, generation: generation);
  }

  Future<void> loadMore() async {
    if (state.isLoading || state.isLoadingMore || !state.hasMore) {
      return;
    }
    final generation = _generation;
    state = state.copyWith(isLoadingMore: true, clearError: true);
    await _fetch(append: true, generation: generation);
  }

  Future<void> _fetch({
    required bool append,
    required int generation,
  }) async {
    try {
      final session = _ref.read(sessionServiceProvider);
      final warehouseId =
          _ref.read(posCheckoutProvider).warehouseId ?? session.warehouseId;
      if (warehouseId == null) {
        state = const ProductGridState();
        return;
      }

      final filter = _ref.read(productFilterProvider);
      final priceType = _ref.read(posCheckoutProvider).priceType;
      final page = await _ref.read(productLookupRepositoryProvider).listInStockPage(
            warehouseId: warehouseId,
            filter: filter.filter,
            filterId: filter.filterId,
            priceType: priceType,
            offset: append ? state.products.length : 0,
            limit: _pageSize(),
          );

      if (generation != _generation) return;

      final nextProducts =
          append ? [...state.products, ...page.items] : page.items;
      state = ProductGridState(
        products: nextProducts,
        totalCount: page.totalCount,
        hasMore: page.hasMore,
        isLoading: false,
        isLoadingMore: false,
      );
    } catch (e) {
      if (generation != _generation) return;
      state = state.copyWith(
        isLoading: false,
        isLoadingMore: false,
        error: e,
      );
    }
  }
}

void reloadProductGrid(WidgetRef ref) {
  ref.read(productGridProvider.notifier).reload();
}
