enum ProductGridFilter { all, featured, category, brand }

class ProductFilterState {
  const ProductFilterState({
    this.filter = ProductGridFilter.featured,
    this.filterId = 1,
    this.searchQuery = '',
  });

  final ProductGridFilter filter;
  final int filterId;

  /// Manual search text (search mode only). When non-empty, the product grid
  /// shows matching items instead of Featured/Category/Brand pages.
  final String searchQuery;

  bool get isSearching => searchQuery.trim().length >= 2;

  ProductFilterState copyWith({
    ProductGridFilter? filter,
    int? filterId,
    String? searchQuery,
  }) {
    return ProductFilterState(
      filter: filter ?? this.filter,
      filterId: filterId ?? this.filterId,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }
}
