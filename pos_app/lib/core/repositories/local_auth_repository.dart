import 'package:bcrypt/bcrypt.dart';
import 'package:drift/drift.dart';

import '../database/app_database.dart';

class LocalAuthRepository {
  LocalAuthRepository(this._db);

  final AppDatabase _db;

  /// Match [pin] against all local users' access PIN (or legacy password hash).
  Future<LocalUser?> verifyByPin(String pin) async {
    if (pin.isEmpty) return null;

    final users = await _db.select(_db.localUsers).get();
    LocalUser? match;

    for (final user in users) {
      if (!_pinMatches(user, pin)) continue;
      if (match != null) return null;
      match = user;
    }

    return match;
  }

  bool _pinMatches(LocalUser user, String pin) {
    final pinHash = user.accessPinHash?.trim();
    if (pinHash != null && pinHash.isNotEmpty) {
      return BCrypt.checkpw(pin, pinHash);
    }
    if (user.passwordHash.isNotEmpty) {
      return BCrypt.checkpw(pin, user.passwordHash);
    }
    return false;
  }

  Future<void> upsertUsers(List<Map<String, dynamic>> rows) async {
    await _db.transaction(() async {
      for (final m in rows) {
        await _upsertOne(m);
      }
    });
  }

  Future<void> replaceUsers(List<Map<String, dynamic>> rows) async {
    await _db.transaction(() async {
      await _db.delete(_db.localUsers).go();
      for (final raw in rows) {
        final m = Map<String, dynamic>.from(raw as Map);
        await _upsertOne(m);
      }
    });
  }

  Future<void> _upsertOne(Map<String, dynamic> m) async {
    final id = _int(m['id']);
    if (id <= 0) return;

    // API may send password / access_pin (hashes) or *_hash keys from snapshots.
    final passHash = (m['password'] ?? m['password_hash'])?.toString().trim();
    final pinHash =
        (m['access_pin'] ?? m['access_pin_hash'])?.toString().trim();
    final hasPass = passHash != null && passHash.isNotEmpty;
    final hasPin = pinHash != null && pinHash.isNotEmpty;
    if (!hasPass && !hasPin) {
      // Still store the user so the device shows operators; PIN can be set later.
      // Without either hash they cannot sign in until the next sync with PIN.
    }

    await _db.into(_db.localUsers).insertOnConflictUpdate(
          LocalUsersCompanion.insert(
            id: Value(id),
            name: m['name']?.toString() ??
                m['username']?.toString() ??
                'User $id',
            username: Value(m['username']?.toString()),
            email: Value(m['email']?.toString()),
            passwordHash: hasPass ? passHash! : '',
            accessPinHash: Value(hasPin ? pinHash : null),
            warehouseId: Value(_intOrNull(m['warehouse_id'])),
            roleId: Value(_intOrNull(m['role_id'])),
            billerId: Value(_intOrNull(m['biller_id'])),
            updatedAt: Value(m['updated_at']?.toString()),
          ),
        );
  }

  Future<int> countUsers() async {
    final rows = await _db.select(_db.localUsers).get();
    return rows.length;
  }

  Future<int> countUsersWithPin() async {
    final rows = await _db.select(_db.localUsers).get();
    return rows.where((u) {
      final pin = u.accessPinHash?.trim();
      if (pin != null && pin.isNotEmpty) return true;
      return u.passwordHash.trim().isNotEmpty;
    }).length;
  }

  int _int(dynamic v, {int fallback = 0}) {
    if (v == null) return fallback;
    if (v is int) return v;
    return int.tryParse(v.toString()) ?? fallback;
  }

  int? _intOrNull(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    return int.tryParse(v.toString());
  }
}
