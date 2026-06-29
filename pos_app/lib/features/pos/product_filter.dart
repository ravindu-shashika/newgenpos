enum ProductGridFilter { all, featured, category, brand }

class ProductFilterState {
  const ProductFilterState({
    this.filter = ProductGridFilter.featured,
    this.filterId = 1,
  });

  final ProductGridFilter filter;
  final int filterId;

  ProductFilterState copyWith({
    ProductGridFilter? filter,
    int? filterId,
  }) {
    return ProductFilterState(
      filter: filter ?? this.filter,
      filterId: filterId ?? this.filterId,
    );
  }
}
