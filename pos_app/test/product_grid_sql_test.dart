import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pos_app/core/database/app_database.dart';
import 'package:pos_app/core/pos_http/pos_api_client.dart';
import 'package:pos_app/core/repositories/product_lookup_repository.dart';
import 'package:pos_app/features/pos/product_filter.dart';

void main() {
  late AppDatabase db;
  late ProductLookupRepository repo;

  setUp(() async {
    db = AppDatabase.forTesting(NativeDatabase.memory());
    repo = ProductLookupRepository(db, PosApiClient(baseUrl: 'http://localhost'));

    await db.into(db.products).insert(
          ProductsCompanion.insert(
            id: const Value(1),
            name: 'Test Product',
            code: 'SKU001',
            featured: const Value(1),
            price: const Value(10),
          ),
        );
    await db.into(db.productStock).insert(
          ProductStockCompanion.insert(
            id: const Value(1),
            productId: 1,
            warehouseId: 1,
            qty: const Value(5),
          ),
        );
  });

  tearDown(() async {
    await db.close();
  });

  test('listInStockPage returns SQL-paginated products', () async {
    final page = await repo.listInStockPage(
      warehouseId: 1,
      filter: ProductGridFilter.featured,
      offset: 0,
      limit: 10,
    );

    expect(page.totalCount, 1);
    expect(page.items, hasLength(1));
    expect(page.items.first.name, 'Test Product');
    expect(page.items.first.warehouseQty, 5);
  });
}
