import 'dart:async';

import '../../../core/pos_http/pos_api_client.dart';
import '../../../core/repositories/local_cash_register_repository.dart';
import '../models/cash_register_details.dart';

/// Local cash register session (offline-first).
class OpenCashRegisterSession {
  const OpenCashRegisterSession({
    required this.localId,
    this.serverId,
  });

  final int localId;
  final int? serverId;

  int? get payloadRegisterId => serverId;
}

class CashRegisterService {
  CashRegisterService(this._api, this._repo);

  final PosApiClient _api;
  final LocalCashRegisterRepository _repo;

  Future<int?> getOpenRegisterId({
    required int userId,
    int? warehouseId,
  }) async {
    if (warehouseId != null) {
      final local = await _repo.getOpenRegister(
        userId: userId,
        warehouseId: warehouseId,
      );
      return local?.id;
    }
    return _repo.getOpenRegisterIdForUser(userId);
  }

  Future<OpenCashRegisterSession?> getOpenSession({
    required int warehouseId,
    required int userId,
  }) async {
    final local = await _repo.getOpenRegister(
      userId: userId,
      warehouseId: warehouseId,
    );
    if (local == null) return null;
    return OpenCashRegisterSession(
      localId: local.id,
      serverId: local.serverRegisterId,
    );
  }

  Future<int?> checkOpenRegister({
    required int warehouseId,
    required int userId,
  }) async {
    final local = await _repo.getOpenRegister(
      userId: userId,
      warehouseId: warehouseId,
    );
    if (local != null) return local.id;

    try {
      final res = await _api.checkCashRegister(
        warehouseId: warehouseId,
        userId: userId,
      );
      if (res['open'] == true && res['cash_register_id'] != null) {
        final raw = res['cash_register_id'];
        final serverId = raw is int ? raw : int.tryParse(raw.toString());
        if (serverId != null) {
          return _repo.importOpenFromServer(
            serverRegisterId: serverId,
            userId: userId,
            warehouseId: warehouseId,
            cashInHand: 0,
          );
        }
      }
    } catch (_) {}

    return null;
  }

  Future<int> openRegister({
    required int warehouseId,
    required int userId,
    required double cashInHand,
  }) async {
    final localId = await _repo.openRegister(
      userId: userId,
      warehouseId: warehouseId,
      cashInHand: cashInHand,
    );
    unawaited(_trySyncOpen());
    return localId;
  }

  Future<void> _trySyncOpen() async {
    try {
      await _repo.syncPendingRegisters(_api);
    } catch (_) {}
  }

  Future<CashRegisterDetails> getDetails({
    required int registerId,
    required int userId,
  }) async {
    final local = await _repo.getById(registerId);
    if (local != null) {
      return _repo.computeDetails(registerId);
    }

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
    final local = await _repo.getById(registerId);
    if (local != null) {
      await _repo.closeRegister(
        localId: registerId,
        closingBalance: closingBalance,
        actualCash: actualCash,
      );
      unawaited(_repo.syncPendingRegisters(_api));
      return;
    }

    await _api.closeCashRegister(
      registerId: registerId,
      userId: userId,
      closingBalance: closingBalance,
      actualCash: actualCash,
    );
  }

  Future<int?> serverIdForLocal(int localId) =>
      _repo.serverIdForLocal(localId);
}
