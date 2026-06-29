class CartLineUnitOption {
  const CartLineUnitOption({
    required this.name,
    required this.operator,
    required this.operationValue,
  });

  final String name;
  final String operator;
  final double operationValue;
}

class CartLinePriceOption {
  const CartLinePriceOption({
    required this.label,
    required this.basePrice,
  });

  final String label;
  final double basePrice;
}

class CartLineEditContext {
  const CartLineEditContext({
    required this.productType,
    required this.retailPrice,
    required this.wholesalePrice,
    required this.units,
    required this.priceOptions,
  });

  final String productType;
  final double retailPrice;
  final double wholesalePrice;
  final List<CartLineUnitOption> units;
  final List<CartLinePriceOption> priceOptions;

  bool get isStandard => productType == 'standard' && units.length > 1;
}
