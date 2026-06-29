import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/pos_http/pos_api_client.dart';
import '../models/cash_register_details.dart';

class CashRegisterService {
  CashRegisterService(this._api);

  static const _registerIdKey = 'open_cash_register_id';

  final PosApiClient _api;

  Future<int?> getCachedRegisterId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt(_registerIdKey);
  }

  Future<void> cacheRegisterId(int? id) async {
    final prefs = await SharedPreferences.getInstance();
    if (id == null) {
      await prefs.remove(_registerIdKey);
    } else {
      await prefs.setInt(_registerIdKey, id);
    }
  }

  Future<int?> checkOpenRegister({
    required int warehouseId,
    required int userId,
  }) async {
    final res = await _api.checkCashRegister(
      warehouseId: warehouseId,
      userId: userId,
    );
    final open = res['open'] == true;
    final id = res['cash_register_id'];
    if (open && id != null) {
      final registerId = id is int ? id : int.tryParse(id.toString());
      await cacheRegisterId(registerId);
      return registerId;
    }
    await cacheRegisterId(null);
    return null;
  }

  Future<int> openRegister({
    required int warehouseId,
    required int userId,
    required double cashInHand,
  }) async {
    final res = await _api.openCashRegister(
      warehouseId: warehouseId,
      userId: userId,
      cashInHand: cashInHand,
    );
    final id = res['cash_register_id'];
    final registerId = id is int ? id : int.parse(id.toString());
    await cacheRegisterId(registerId);
    return registerId;
  }

  Future<CashRegisterDetails> getDetails({
    required int registerId,
    required int userId,
  }) async {
    final res = await _api.cashRegisterDetails(
      registerId: registerId,
      userId: userId,
    );
    return CashRegisterDetails.fromJson(res);
  }

  Future<void> closeRegister({
    required int registerId,
    required int userId,
    required double closingBalance,
    required double actualCash,
  }) async {
    await _api.closeCashRegister(
      registerId: registerId,
      userId: userId,
      closingBalance: closingBalance,
      actualCash: actualCash,
    );
    await cacheRegisterId(null);
  }
}
