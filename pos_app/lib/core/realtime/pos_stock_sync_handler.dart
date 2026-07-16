import 'dart:convert';

import 'package:drift/drift.dart';

import '../database/app_database.dart';

class PosStockSyncHandler {
  PosStockSyncHandler(this._db);

  final AppDatabase _db;

  Future<void> applyPayload(Map<String, dynamic> payload) async {
    final stock = payload['stock'];
    if (stock is List) {
      await upsertStockRows(
        stock.map((e) => Map<String, dynamic>.from(e as Map)).toList(),
      );
    }
    final batches = payload['batches'];
    if (batches is List && batches.isNotEmpty) {
      await upsertBatchRows(
        batches.map((e) => Map<String, dynamic>.from(e as Map)).toList(),
      );
    }
  }

  Future<void> applyEventData(String rawData) async {
    if (rawData.trim().isEmpty) return;
    final decoded = jsonDecode(rawData);
    if (decoded is Map<String, dynamic>) {
      await applyPayload(decoded);
      return;
    }
    if (decoded is Map) {
      await applyPayload(Map<String, dynamic>.from(decoded));
    }
  }

  Future<void> upsertStockRows(List<Map<String, dynamic>> rows) async {
    if (rows.isEmpty) return;
    await _db.batch((batch) {
      for (final m in rows) {
        batch.insert(
          _db.productStock,
          ProductStockCompanion.insert(
            id: Value(_int(m['id'])),
            productId: _int(m['product_id']),
            warehouseId: _int(m['warehouse_id']),
            variantId: Value(_intOrNull(m['variant_id'])),
            qty: Value(_dbl(m['qty'])),
            price: Value(_dblOrNull(m['price'])),
            maxPrice: Value(_dblOrNull(m['max_price'])),
            productBatchId: Value(_intOrNull(m['product_batch_id'])),
            imeiNumber: Value(m['imei_number']?.toString()),
            updatedAt: Value(m['updated_at']?.toString()),
          ),
          mode: InsertMode.insertOrReplace,
        );
      }
    });
  }

  Future<void> upsertBatchRows(List<Map<String, dynamic>> rows) async {
    if (rows.isEmpty) return;
    await _db.batch((batch) {
      for (final m in rows) {
        batch.insert(
          _db.productBatches,
          ProductBatchesCompanion.insert(
            id: Value(_int(m['id'])),
            productId: _int(m['product_id']),
            batchNo: m['batch_no']?.toString() ?? '',
            expiredDate: Value(m['expired_date']?.toString()),
            qty: Value(_dbl(m['qty'])),
            updatedAt: Value(m['updated_at']?.toString()),
          ),
          mode: InsertMode.insertOrReplace,
        );
      }
    });
  }

  static int _int(dynamic v) {
    if (v is int) return v;
    return int.parse(v.toString());
  }

  static int? _intOrNull(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    return int.tryParse(v.toString());
  }

  static double _dbl(dynamic v) {
    if (v is num) return v.toDouble();
    return double.parse(v.toString());
  }

  static double? _dblOrNull(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString());
  }
}
