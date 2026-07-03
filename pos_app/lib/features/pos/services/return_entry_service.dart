import '../../../core/repositories/product_lookup_repository.dart';
import '../models/return_cart_line.dart';
import '../models/return_models.dart';
import '../models/scanned_product.dart';

class ReturnProductMatch {
  const ReturnProductMatch({
    required this.product,
    this.saleLine,
  });

  final ScannedProduct product;
  final ReturnSaleLookupLine? saleLine;
}

/// Unified return product lookup: barcode, code/alt_code, or name search.
class ReturnEntryService {
  ReturnEntryService(this._productLookup);

  final ProductLookupRepository _productLookup;

  Future<ScannedProduct?> lookupBarcode({
    required String barcode,
    required int warehouseId,
  }) {
    return _productLookup.lookupBarcodeExact(
      code: barcode.trim(),
      warehouseId: warehouseId,
    );
  }

  Future<ScannedProduct?> lookupCode({
    required String code,
    required int warehouseId,
    required int customerId,
  }) {
    return _productLookup.lookup(
      code: code.trim(),
      warehouseId: warehouseId,
      customerId: customerId,
    );
  }

  Future<List<ScannedProduct>> searchByName({
    required String query,
    required int warehouseId,
    int limit = 20,
  }) {
    return _productLookup.searchLocal(
      query: query.trim(),
      warehouseId: warehouseId,
      limit: limit,
    );
  }

  /// Resolve scanned/typed input to a product, optionally matching a sale line.
  Future<ReturnProductMatch?> resolveInput({
    required String input,
    required int warehouseId,
    required int customerId,
    ReturnSaleLookup? saleLookup,
    double alreadyReturnedInSession = 0,
    int? productSaleId,
  }) async {
    final term = input.trim();
    if (term.isEmpty) return null;

    ScannedProduct? product = await lookupBarcode(
      barcode: term,
      warehouseId: warehouseId,
    );
    product ??= await lookupCode(
      code: term,
      warehouseId: warehouseId,
      customerId: customerId,
    );

    if (product == null && term.length >= 2) {
      final hits = await searchByName(
        query: term,
        warehouseId: warehouseId,
        limit: 1,
      );
      if (hits.length == 1) {
        product = hits.first;
      }
    }

    if (product == null) return null;

    ReturnSaleLookupLine? saleLine;
    if (saleLookup != null) {
      saleLine = matchProductToSaleLine(
        product: product,
        lookup: saleLookup,
        productSaleId: productSaleId,
      );
      if (saleLine == null) {
        return null;
      }
      final maxQty = saleLine.returnableQty - alreadyReturnedInSession;
      if (maxQty <= 0) return null;
    }

    return ReturnProductMatch(product: product, saleLine: saleLine);
  }

  /// Match a scanned product to a returnable sale line when a bill is linked.
  ReturnSaleLookupLine? matchProductToSaleLine({
    required ScannedProduct product,
    required ReturnSaleLookup lookup,
    int? productSaleId,
  }) {
    if (productSaleId != null) {
      for (final line in lookup.lines) {
        if (line.productSaleId == productSaleId && line.returnableQty > 0) {
          return line;
        }
      }
    }

    ReturnSaleLookupLine? codeMatch;
    for (final line in lookup.lines) {
      if (line.returnableQty <= 0) continue;
      if (line.productId != product.productId) continue;

      final variantMatch = line.variantId == null ||
          line.variantId == product.variantId;
      final batchMatch = line.productBatchId == null ||
          line.productBatchId == product.productBatchId;
      if (!variantMatch || !batchMatch) continue;

      if (line.code == product.code) {
        return line;
      }
      codeMatch ??= line;
    }
    return codeMatch;
  }

  ReturnCartLine buildReturnLine({
    required ReturnProductMatch match,
    double qty = 1,
    bool isDamage = false,
  }) {
    if (match.saleLine != null) {
      return ReturnCartLine.fromLookupLine(
        match.saleLine!,
        qty: qty,
        isDamage: isDamage,
      );
    }
    return ReturnCartLine.fromScannedProduct(
      match.product,
      qty: qty,
      isDamage: isDamage,
    );
  }
}
