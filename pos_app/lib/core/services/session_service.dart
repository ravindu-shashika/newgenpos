import 'dart:math';

import 'package:drift/drift.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../config/app_config.dart';
import '../database/app_database.dart';

/// Device registration, tokens, and login state — stored in Drift (newgenpos.sqlite).
class SessionService {
  SessionService(this._db);

  final AppDatabase _db;
  DeviceSessionData? _row;
  bool _loaded = false;

  static const _legacyMigratedKey = 'drift_session_migrated';

  Future<void> ensureLoaded() async {
    if (_loaded) return;
    await _db.ensureDeviceSessionRow();
    _row = await _db.getDeviceSession();
    _loaded = true;
  }

  /// One-time copy from SharedPreferences for upgrades before Drift session.
  Future<void> migrateFromSharedPreferencesIfNeeded() async {
    await ensureLoaded();
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getBool(_legacyMigratedKey) == true) return;

    final hasLegacy = prefs.containsKey('device_id') ||
        prefs.containsKey('pos_token') ||
        prefs.containsKey('device_registered');
    if (hasLegacy) {
      await _db.upsertDeviceSession(
        DeviceSessionCompanion(
          id: const Value(1),
          authToken: Value(prefs.getString('auth_token')),
          deviceId: Value(prefs.getString('device_id')),
          warehouseId: Value(prefs.getInt('warehouse_id')),
          customerId: Value(prefs.getInt('customer_id')),
          billerId: Value(prefs.getInt('biller_id')),
          userName: Value(prefs.getString('user_name')),
          userId: Value(prefs.getInt('user_id')),
          isProvisioned: Value(prefs.getBool('is_provisioned') ?? false),
          terminalId: Value(prefs.getInt('terminal_id')),
          terminalCode: Value(prefs.getString('terminal_code')),
          terminalName: Value(prefs.getString('terminal_name')),
          posToken: Value(prefs.getString('pos_token')),
          clientToken: Value(prefs.getString('client_token')),
          activationToken: Value(prefs.getString('activation_token')),
          macAddress: Value(prefs.getString('mac_address')),
          posBaseUrl: Value(prefs.getString('pos_base_url')),
          deviceRegistered: Value(prefs.getBool('device_registered') ?? false),
        ),
      );
      _row = await _db.getDeviceSession();
    }

    await prefs.setBool(_legacyMigratedKey, true);
  }

  String? get token => _row?.authToken;
  String? get posToken => _row?.posToken;
  String? get clientToken => _row?.clientToken;
  String? get activationToken => _row?.activationToken;
  String? get macAddress => _row?.macAddress;
  String? get posBaseUrl => _row?.posBaseUrl;
  String get deviceId => _row?.deviceId ?? const Uuid().v4();
  int? get warehouseId => _row?.warehouseId;
  int? get customerId => _row?.customerId;
  int? get billerId => _row?.billerId;
  String? get userName => _row?.userName;
  int? get userId => _row?.userId;
  bool get isProvisioned => _row?.isProvisioned ?? false;
  int? get terminalId => _row?.terminalId;
  String? get terminalCode => _row?.terminalCode;
  String? get terminalName => _row?.terminalName;
  bool get isTerminalRegistered => terminalId != null && terminalCode != null;
  bool get isRegistered => _row?.deviceRegistered ?? false;
  bool get isLoggedIn => userId != null;

  Future<void> ensureDeviceId() async {
    await ensureLoaded();
    final needsDeviceId =
        _row?.deviceId == null || _row!.deviceId!.isEmpty;
    final needsClientToken =
        _row?.clientToken == null || _row!.clientToken!.isEmpty;
    if (!needsDeviceId && !needsClientToken) return;

    await _persist(
      DeviceSessionCompanion(
        id: const Value(1),
        deviceId:
            needsDeviceId ? Value(const Uuid().v4()) : const Value.absent(),
        clientToken:
            needsClientToken ? Value(const Uuid().v4()) : const Value.absent(),
      ),
    );
  }

  Future<String> ensureClientToken() async {
    await ensureDeviceId();
    return _row!.clientToken!;
  }

  Future<String> ensureActivationToken() async {
    await ensureDeviceId();
    if (_row?.activationToken == null || _row!.activationToken!.isEmpty) {
      await _persist(
        DeviceSessionCompanion(
          id: const Value(1),
          activationToken: Value(_generateToken()),
        ),
      );
    }
    return _row!.activationToken!;
  }

  Future<void> saveMacAddress(String mac) async {
    await _persist(
      DeviceSessionCompanion(id: const Value(1), macAddress: Value(mac)),
    );
  }

  static String _generateToken() {
    const chars =
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = Random.secure();
    return List.generate(32, (_) => chars[random.nextInt(chars.length)]).join();
  }

  Future<void> saveLogin({
    required String token,
    required String userName,
    int? warehouseId,
    int? userId,
    int? billerId,
  }) async {
    await _persist(
      DeviceSessionCompanion(
        id: const Value(1),
        authToken: Value(token),
        userName: Value(userName),
        warehouseId: Value(warehouseId),
        userId: Value(userId),
        billerId: Value(billerId),
      ),
    );
    await ensureDeviceId();
  }

  Future<void> saveLocalLogin({
    required int userId,
    required String userName,
    required int warehouseId,
    int? billerId,
  }) async {
    await _persist(
      DeviceSessionCompanion(
        id: const Value(1),
        userId: Value(userId),
        userName: Value(userName),
        warehouseId: Value(warehouseId),
        billerId: Value(billerId),
      ),
    );
    await ensureDeviceId();
  }

  Future<void> saveProvision() async {
    await _persist(
      DeviceSessionCompanion(
        id: const Value(1),
        isProvisioned: const Value(true),
      ),
    );
    await ensureDeviceId();
  }

  Future<void> savePosToken(String token) async {
    await _persist(
      DeviceSessionCompanion(
        id: const Value(1),
        posToken: Value(token),
        posBaseUrl: Value(AppConfig.posBaseUrl),
      ),
    );
  }

  Future<void> savePosBaseUrl(String? url) async {
    await _persist(
      DeviceSessionCompanion(
        id: const Value(1),
        posBaseUrl: url == null || url.trim().isEmpty
            ? const Value(null)
            : Value(url.trim()),
      ),
    );
  }

  Future<void> markDeviceRegistered() async {
    await _persist(
      DeviceSessionCompanion(
        id: const Value(1),
        deviceRegistered: const Value(true),
        posBaseUrl: Value(AppConfig.posBaseUrl),
      ),
    );
  }

  Future<void> saveTerminal({
    required int id,
    required String code,
    String? name,
    int? warehouseId,
  }) async {
    await _persist(
      DeviceSessionCompanion(
        id: const Value(1),
        terminalId: Value(id),
        terminalCode: Value(code),
        terminalName: Value(name),
        warehouseId: Value(warehouseId),
      ),
    );
    await ensureDeviceId();
  }

  Future<void> resetProvision() async {
    await _persist(
      const DeviceSessionCompanion(
        id: Value(1),
        deviceRegistered: Value(false),
        isProvisioned: Value(false),
        posBaseUrl: Value(null),
        terminalId: Value(null),
        terminalCode: Value(null),
        terminalName: Value(null),
        posToken: Value(null),
        activationToken: Value(null),
        macAddress: Value(null),
        clientToken: Value(null),
      ),
    );
    await clear();
  }

  Future<void> setWarehouseId(int id) async {
    await _persist(
      DeviceSessionCompanion(id: const Value(1), warehouseId: Value(id)),
    );
  }

  Future<void> setCustomerId(int id) async {
    await _persist(
      DeviceSessionCompanion(id: const Value(1), customerId: Value(id)),
    );
  }

  Future<void> setBillerId(int id) async {
    await _persist(
      DeviceSessionCompanion(id: const Value(1), billerId: Value(id)),
    );
  }

  Future<void> clear() async {
    await _persist(
      const DeviceSessionCompanion(
        id: Value(1),
        authToken: Value(null),
        userName: Value(null),
        userId: Value(null),
        billerId: Value(null),
      ),
    );
  }

  Future<void> _persist(DeviceSessionCompanion companion) async {
    await ensureLoaded();
    await _db.upsertDeviceSession(companion);
    _row = await _db.getDeviceSession();
  }
}
