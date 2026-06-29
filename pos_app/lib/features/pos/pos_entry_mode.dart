import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Catalog input mode on the register screen.
enum PosCatalogEntryMode {
  /// Scanner / exact barcode — indexed lookup, auto-add to cart.
  barcode,

  /// Name or partial code search with suggestions.
  search,
}

final posCatalogEntryModeProvider = StateProvider<PosCatalogEntryMode>(
  (ref) => PosCatalogEntryMode.barcode,
);
