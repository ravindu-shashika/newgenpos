import 'package:drift/drift.dart';

import '../database/app_database.dart';

/// Contact details from locally cached `warehouses` table.
class WarehouseContact {
  const WarehouseContact({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    this.address,
  });

  final int id;
  final String name;
  final String? phone;
  final String? email;
  final String? address;

  String get formattedAddress {
    final lines = <String>[];
    final addr = address?.trim();
    if (addr != null && addr.isNotEmpty) {
      lines.addAll(addr.split('\n').map((s) => s.trim()).where((s) => s.isNotEmpty));
    }
    if (lines.isEmpty && name.isNotEmpty) {
      lines.add(name);
    }
    return lines.join('\n');
  }

  String get contactLine {
    final emailTrim = email?.trim();
    if (emailTrim != null && emailTrim.isNotEmpty) return emailTrim;
    return '';
  }
}

class WarehouseRepository {
  WarehouseRepository(this._db);

  final AppDatabase _db;

  Future<WarehouseContact?> getById(int? warehouseId) async {
    if (warehouseId == null) return null;
    final row = await (_db.select(_db.warehouses)
          ..where((w) => w.id.equals(warehouseId)))
        .getSingleOrNull();
    if (row == null) return null;
    return WarehouseContact(
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      address: row.address,
    );
  }

  Future<List<WarehouseContact>> listAll() async {
    final rows = await (_db.select(_db.warehouses)
          ..orderBy([(w) => OrderingTerm.asc(w.name)]))
        .get();
    return rows
        .map(
          (row) => WarehouseContact(
            id: row.id,
            name: row.name,
            phone: row.phone,
            email: row.email,
            address: row.address,
          ),
        )
        .toList();
  }
}
