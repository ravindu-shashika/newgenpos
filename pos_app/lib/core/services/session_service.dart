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

  /// Registered with a usable server URL (loopback only allowed in dev builds).
  bool get hasUsableServerUrl {
    if (!AppConfig.hasStoredPosBaseUrl(posBaseUrl)) return false;
    if (AppConfig.isLoopbackPosUrl(posBaseUrl)) {
      return AppConfig.isDevelopment;
    }
    return true;
  }

  /// Effective POS API URL from device session (never invents localhost when
  /// a URL is already stored — including a bad loopback value we must fix).
  String get effectivePosBaseUrl =>
      AppConfig.resolvePosBaseUrl(posBaseUrl);

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
    // Do not touch posBaseUrl — keep the URL the user set at first-time setup.
    await _persist(
      DeviceSessionCompanion(
        id: const Value(1),
        posToken: Value(token),
      ),
    );
  }

  Future<void> savePosBaseUrl(String? url) async {
    final normalized = url == null || url.trim().isEmpty
        ? null
        : AppConfig.normalizePosBaseUrlInput(url);
    await _persist(
      DeviceSessionCompanion(
        id: const Value(1),
        posBaseUrl: Value(normalized),
      ),
    );
  }

  Future<void> markDeviceRegistered() async {
    // Preserve configured server URL (never reset to build-time localhost).
    await _persist(
      const DeviceSessionCompanion(
        id: Value(1),
        deviceRegistered: Value(true),
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
    await resetDeviceRegistration();
  }

  /// Full wipe of registration / tokens so the app shows Register again.
  /// Keeps [deviceId] so the terminal can be recognized if re-registered.
  Future<void> resetDeviceRegistration() async {
    await ensureLoaded();
    final deviceId = _row?.deviceId;
    await _persist(
      DeviceSessionCompanion(
        id: const Value(1),
        deviceRegistered: const Value(false),
        isProvisioned: const Value(false),
        posBaseUrl: const Value(null),
        terminalId: const Value(null),
        terminalCode: const Value(null),
        terminalName: const Value(null),
        posToken: const Value(null),
        activationToken: const Value(null),
        macAddress: const Value(null),
        clientToken: const Value(null),
        authToken: const Value(null),
        userName: const Value(null),
        userId: const Value(null),
        billerId: const Value(null),
        customerId: const Value(null),
        warehouseId: const Value(null),
        deviceId: deviceId == null || deviceId.isEmpty
            ? const Value.absent()
            : Value(deviceId),
      ),
    );
  }

  /// If an old build stored localhost after register, clear registration so
  /// the user must enter the real server URL again.
  Future<bool> repairInvalidServerUrlRegistration() async {
    await ensureLoaded();
    if (!isRegistered) return false;
    if (hasUsableServerUrl) return false;
    await resetDeviceRegistration();
    return true;
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

  Future<void> clearCustomerId() async {
    await _persist(
      const DeviceSessionCompanion(
        id: Value(1),
        customerId: Value(null),
      ),
    );
  }

  Future<void> setBillerId(int id) async {
    await _persist(
      DeviceSessionCompanion(id: const Value(1), billerId: Value(id)),
    );
  }

  Future<void> clearBillerId() async {
    await _persist(
      const DeviceSessionCompanion(
        id: Value(1),
        billerId: Value(null),
      ),
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
