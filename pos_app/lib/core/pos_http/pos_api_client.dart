import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../sync/download_models.dart';
import 'dio_logging_interceptor.dart';

/// HTTP client for the cloud POS API (`/pos/*` — `routes/pos.php`). Offline data
/// lives in Drift (`newgenpos.sqlite`); sales sync back when online.
class PosApiClient {
  PosApiClient({Dio? dio, String? posToken, String? baseUrl})
      : _dio = dio ??
            _createDio(
              baseUrl ?? AppConfig.posBaseUrl,
              tag: 'POS',
              receiveTimeout: const Duration(seconds: 120),
            ) {
    if (posToken != null && posToken.isNotEmpty) {
      setPosToken(posToken);
    }
  }

  final Dio _dio;

  static Dio _createDio(
    String baseUrl, {
    required String tag,
    required Duration receiveTimeout,
  }) {
    final dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: receiveTimeout,
        headers: {'Accept': 'application/json'},
      ),
    );
    dio.interceptors.add(DioLoggingInterceptor(tag: tag));
    return dio;
  }

  void setPosToken(String? token) {
    if (token == null || token.isEmpty) {
      _dio.options.headers.remove('Authorization');
    } else {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }

  void setBaseUrl(String url) {
    final trimmed = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
    _dio.options.baseUrl =
        trimmed.endsWith('/pos') ? trimmed : '$trimmed/pos';
  }

  Future<Map<String, dynamic>> health({bool quiet = false}) async {
    final res = await _dio.get(
      '/health',
      options: Options(extra: {'quiet': quiet}),
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<List<Map<String, dynamic>>> fetchWarehouses() async {
    final res = await _dio.get('/warehouses');
    final data = Map<String, dynamic>.from(res.data as Map);
    final items = data['warehouses'] as List<dynamic>? ?? [];
    return items.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<Map<String, dynamic>> checkTerminalStatus({
    String? macAddress,
    String? deviceId,
  }) async {
    if ((macAddress == null || macAddress.trim().isEmpty) &&
        (deviceId == null || deviceId.trim().isEmpty)) {
      throw ArgumentError('macAddress or deviceId is required');
    }

    final res = await _dio.post('/terminal/status', data: {
      if (macAddress != null && macAddress.trim().isNotEmpty)
        'mac_address': macAddress.trim(),
      if (deviceId != null && deviceId.trim().isNotEmpty)
        'device_id': deviceId.trim(),
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> registerPosDevice({
    required String macAddress,
    required String activationToken,
    required String deviceId,
    required String clientToken,
    required int warehouseId,
    String? name,
  }) async {
    final res = await _dio.post('/register', data: {
      'mac_address': macAddress,
      'activation_token': activationToken,
      'device_id': deviceId,
      'client_token': clientToken,
      'warehouse_id': warehouseId,
      if (name != null && name.isNotEmpty) 'name': name,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> issuePosToken({
    String? code,
    int? terminalId,
    required String activationToken,
    required String deviceId,
    required String clientToken,
    String? name,
  }) async {
    if ((code == null || code.trim().isEmpty) && terminalId == null) {
      throw ArgumentError('code or terminalId is required');
    }

    final res = await _dio.post('/auth/token', data: {
      if (code != null && code.trim().isNotEmpty) 'code': code.trim(),
      if (terminalId != null) 'terminal_id': terminalId,
      'activation_token': activationToken.trim(),
      'device_id': deviceId,
      'client_token': clientToken,
      if (name != null && name.isNotEmpty) 'name': name,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> posMe() async {
    final res = await _dio.get('/auth/me');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> bootstrap() async {
    final res = await _dio.get('/bootstrap');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> checkCashRegister({
    required int warehouseId,
    required int userId,
  }) async {
    final res = await _dio.get(
      '/cash-register/check/$warehouseId',
      queryParameters: {'user_id': userId},
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> openCashRegister({
    required int warehouseId,
    required int userId,
    required double cashInHand,
  }) async {
    final res = await _dio.post('/cash-register/open', data: {
      'warehouse_id': warehouseId,
      'user_id': userId,
      'cash_in_hand': cashInHand,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> cashRegisterDetails({
    required int registerId,
    required int userId,
  }) async {
    final res = await _dio.get(
      '/cash-register/$registerId/details',
      queryParameters: {'user_id': userId},
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> closeCashRegister({
    required int registerId,
    required int userId,
    required double closingBalance,
    required double actualCash,
  }) async {
    final res = await _dio.post('/cash-register/close', data: {
      'cash_register_id': registerId,
      'user_id': userId,
      'closing_balance': closingBalance,
      'actual_cash': actualCash,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> catalog({
    required int warehouseId,
    String? since,
  }) async {
    final res = await _dio.get(
      '/catalog',
      queryParameters: {
        'warehouse_id': warehouseId,
        if (since != null) 'since': since,
      },
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> scan({
    required String code,
    required int warehouseId,
    required int customerId,
    double qty = 1,
  }) async {
    final res = await _dio.get(
      '/scan',
      queryParameters: {
        'code': code,
        'warehouse_id': warehouseId,
        'customer_id': customerId,
        'qty': qty,
      },
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<List<Map<String, dynamic>>> syncSales({
    required String deviceId,
    required List<Map<String, dynamic>> sales,
    String? terminalCode,
    int? userId,
  }) async {
    final res = await _dio.post(
      '/sales/sync',
      data: {
        'device_id': deviceId,
        if (terminalCode != null) 'terminal_code': terminalCode,
        if (userId != null) 'user_id': userId,
        'sales': sales,
      },
    );
    final data = Map<String, dynamic>.from(res.data as Map);
    final results = data['results'] as List<dynamic>? ?? [];
    return results.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<List<Map<String, dynamic>>> syncSaleStatus({
    required List<String> clientUuids,
    int? userId,
  }) async {
    final res = await _dio.post(
      '/sales/sync-status',
      data: {
        'client_uuids': clientUuids,
        if (userId != null) 'user_id': userId,
      },
    );
    final data = Map<String, dynamic>.from(res.data as Map);
    final items = data['items'] as List<dynamic>? ?? [];
    return items.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<Map<String, dynamic>> downloadManifest({
    String? username,
    String? password,
    int? warehouseId,
    PosDownloadMode mode = PosDownloadMode.full,
    String? since,
  }) async {
    final res = await _dio.post(
      '/setup/manifest',
      data: {
        if (username != null) 'username': username,
        if (password != null) 'password': password,
        if (warehouseId != null) 'warehouse_id': warehouseId,
        'mode': mode == PosDownloadMode.delta ? 'delta' : 'full',
        if (since != null) 'since': since,
      },
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> downloadChunk({
    String? username,
    String? password,
    required String resource,
    required int page,
    int? warehouseId,
    int? perPage,
    PosDownloadMode mode = PosDownloadMode.full,
    String? since,
  }) async {
    final res = await _dio.post(
      '/setup/download',
      data: {
        if (username != null) 'username': username,
        if (password != null) 'password': password,
        'resource': resource,
        'page': page,
        if (warehouseId != null) 'warehouse_id': warehouseId,
        if (perPage != null) 'per_page': perPage,
        'mode': mode == PosDownloadMode.delta ? 'delta' : 'full',
        if (since != null) 'since': since,
      },
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> lookupSaleForReturn({
    required String referenceNo,
  }) async {
    final res = await _dio.get(
      '/sales/return-lookup',
      queryParameters: {'reference_no': referenceNo},
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<List<Map<String, dynamic>>> fetchReturnCredits({
    required int warehouseId,
    int? customerId,
  }) async {
    final res = await _dio.get(
      '/returns/credits',
      queryParameters: {
        'warehouse_id': warehouseId,
        if (customerId != null) 'customer_id': customerId,
      },
    );
    final data = Map<String, dynamic>.from(res.data as Map);
    final items = data['items'] as List<dynamic>? ?? [];
    return items.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<Map<String, dynamic>?> lookupReturnCredit({
    required String referenceNo,
    required int warehouseId,
    int? customerId,
  }) async {
    final res = await _dio.get(
      '/returns/lookup',
      queryParameters: {
        'reference_no': referenceNo,
        'warehouse_id': warehouseId,
        if (customerId != null) 'customer_id': customerId,
      },
    );
    final data = Map<String, dynamic>.from(res.data as Map);
    final item = data['item'];
    if (item == null) return null;
    return Map<String, dynamic>.from(item as Map);
  }

  Future<List<Map<String, dynamic>>> syncReturns({
    required String deviceId,
    required List<Map<String, dynamic>> returns,
    String? terminalCode,
    int? userId,
  }) async {
    final res = await _dio.post(
      '/returns/sync',
      data: {
        'device_id': deviceId,
        if (terminalCode != null) 'terminal_code': terminalCode,
        if (userId != null) 'user_id': userId,
        'returns': returns,
      },
    );
    final data = Map<String, dynamic>.from(res.data as Map);
    final results = data['results'] as List<dynamic>? ?? [];
    return results.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<List<Map<String, dynamic>>> syncReturnStatus({
    required List<String> clientUuids,
    int? userId,
  }) async {
    final res = await _dio.post(
      '/returns/sync-status',
      data: {
        'client_uuids': clientUuids,
        if (userId != null) 'user_id': userId,
      },
    );
    final data = Map<String, dynamic>.from(res.data as Map);
    final items = data['items'] as List<dynamic>? ?? [];
    return items.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<List<Map<String, dynamic>>> syncExchanges({
    required String deviceId,
    required List<Map<String, dynamic>> exchanges,
    String? terminalCode,
    int? userId,
  }) async {
    final res = await _dio.post(
      '/exchanges/sync',
      data: {
        'device_id': deviceId,
        if (terminalCode != null) 'terminal_code': terminalCode,
        if (userId != null) 'user_id': userId,
        'exchanges': exchanges,
      },
    );
    final data = Map<String, dynamic>.from(res.data as Map);
    final results = data['results'] as List<dynamic>? ?? [];
    return results.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<List<Map<String, dynamic>>> searchProducts({
    required String query,
    required int warehouseId,
    int limit = 20,
  }) async {
    final res = await _dio.get(
      '/search',
      queryParameters: {
        'q': query,
        'warehouse_id': warehouseId,
        'limit': limit,
      },
    );
    final data = Map<String, dynamic>.from(res.data as Map);
    final items = data['items'] as List<dynamic>? ?? [];
    return items.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }
}
