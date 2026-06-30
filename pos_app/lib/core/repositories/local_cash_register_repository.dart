import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';

import '../../features/pos/models/cash_register_details.dart';
import '../database/app_database.dart';
import '../pos_http/pos_api_client.dart';

class LocalCashRegisterRepository {
  LocalCashRegisterRepository(this._db);

  final AppDatabase _db;
  static const _uuid = Uuid();

  Future<LocalCashRegister?> getOpenRegister({
    required int userId,
    required int warehouseId,
  }) async {
    return (_db.select(_db.localCashRegisters)
          ..where((r) =>
              r.userId.equals(userId) &
              r.warehouseId.equals(warehouseId) &
              r.isOpen.equals(true))
          ..orderBy([(r) => OrderingTerm.desc(r.openedAt)])
          ..limit(1))
        .getSingleOrNull();
  }

  Future<LocalCashRegister?> getById(int id) {
    return (_db.select(_db.localCashRegisters)
          ..where((r) => r.id.equals(id)))
        .getSingleOrNull();
  }

  Future<int?> getOpenRegisterIdForUser(int userId) async {
    final row = await (_db.select(_db.localCashRegisters)
          ..where((r) => r.userId.equals(userId) & r.isOpen.equals(true))
          ..orderBy([(r) => OrderingTerm.desc(r.openedAt)])
          ..limit(1))
        .getSingleOrNull();
    return row?.id;
  }

  Future<int?> serverIdForLocal(int localId) async {
    final row = await getById(localId);
    return row?.serverRegisterId;
  }

  Future<int> openRegister({
    required int userId,
    required int warehouseId,
    required double cashInHand,
  }) async {
    final existing = await getOpenRegister(
      userId: userId,
      warehouseId: warehouseId,
    );
    if (existing != null) return existing.id;

    return _db.into(_db.localCashRegisters).insert(
          LocalCashRegistersCompanion.insert(
            clientUuid: _uuid.v4(),
            userId: userId,
            warehouseId: warehouseId,
            cashInHand: cashInHand,
            isOpen: const Value(true),
            syncStatus: const Value('pending_open'),
          ),
        );
  }

  Future<void> closeRegister({
    required int localId,
    required double closingBalance,
    required double actualCash,
  }) async {
    await (_db.update(_db.localCashRegisters)..where((r) => r.id.equals(localId)))
        .write(
      LocalCashRegistersCompanion(
        isOpen: const Value(false),
        closingBalance: Value(closingBalance),
        actualCash: Value(actualCash),
        closedAt: Value(DateTime.now()),
        syncStatus: const Value('pending_close'),
      ),
    );
  }

  Future<CashRegisterDetails> computeDetails(int localId) async {
    final reg = await getById(localId);
    if (reg == null) {
      throw StateError('Cash register $localId not found');
    }

    final sales = await (_db.select(_db.localSales)
          ..where((s) =>
              s.localCashRegisterId.equals(localId) & s.saleStatus.equals(1))
          ..orderBy([(s) => OrderingTerm.asc(s.createdAt)]))
        .get();

    var totalSaleAmount = 0.0;
    var totalPayment = 0.0;
    var cashPayment = 0.0;
    var creditCardPayment = 0.0;
    var chequePayment = 0.0;
    var giftCardPayment = 0.0;
    var depositPayment = 0.0;
    var paypalPayment = 0.0;
    final customMethods = <String, double>{};

    for (final sale in sales) {
      totalSaleAmount += sale.grandTotal;
      totalPayment += sale.paidAmount;

      if (sale.payloadJson == null || sale.payloadJson!.isEmpty) continue;
      try {
        final map = jsonDecode(sale.payloadJson!) as Map<String, dynamic>;
        _accumulatePayments(
          map,
          onCash: (v) => cashPayment += v,
          onCard: (v) => creditCardPayment += v,
          onCheque: (v) => chequePayment += v,
          onGiftCard: (v) => giftCardPayment += v,
          onDeposit: (v) => depositPayment += v,
          onPaypal: (v) => paypalPayment += v,
          onCustom: (key, v) =>
              customMethods[key] = (customMethods[key] ?? 0) + v,
        );
      } catch (_) {}
    }

    final sessionEnd = reg.closedAt ?? DateTime.now();
    final returns = await (_db.select(_db.localReturns)
          ..where((r) =>
              r.warehouseId.equals(reg.warehouseId) &
              r.createdAt.isBiggerOrEqualValue(reg.openedAt) &
              r.createdAt.isSmallerOrEqualValue(sessionEnd)))
        .get();

    var totalSaleReturn = 0.0;
    for (final ret in returns) {
      totalSaleReturn += ret.grandTotal;
    }

    const totalExpense = 0.0;
    const totalSupplierPayment = 0.0;
    final totalCash = reg.cashInHand +
        totalPayment -
        (totalSaleReturn + totalExpense + totalSupplierPayment);

    return CashRegisterDetails(
      cashInHand: reg.cashInHand,
      totalSaleAmount: totalSaleAmount,
      totalPayment: totalPayment,
      cashPayment: cashPayment,
      creditCardPayment: creditCardPayment,
      chequePayment: chequePayment,
      giftCardPayment: giftCardPayment,
      depositPayment: depositPayment,
      paypalPayment: paypalPayment,
      totalSaleReturn: totalSaleReturn,
      totalExpense: totalExpense,
      totalSupplierPayment: totalSupplierPayment,
      totalCash: totalCash,
      status: reg.isOpen,
      customMethods: customMethods,
    );
  }

  void _accumulatePayments(
    Map<String, dynamic> map, {
    required void Function(double) onCash,
    required void Function(double) onCard,
    required void Function(double) onCheque,
    required void Function(double) onGiftCard,
    required void Function(double) onDeposit,
    required void Function(double) onPaypal,
    required void Function(String key, double) onCustom,
  }) {
    final paidByRaw = map['paid_by_id'];
    final paidAmountRaw = map['paid_amount'];

    if (paidByRaw is List && paidAmountRaw is List) {
      for (var i = 0; i < paidByRaw.length; i++) {
        final amount = i < paidAmountRaw.length
            ? _dbl(paidAmountRaw[i])
            : _dbl(map['paid_amount']);
        _routePayment(paidByRaw[i], amount, onCash, onCard, onCheque,
            onGiftCard, onDeposit, onPaypal, onCustom);
      }
      return;
    }

    final amount = paidAmountRaw is List
        ? paidAmountRaw.fold<double>(0, (s, v) => s + _dbl(v))
        : _dbl(paidAmountRaw ?? map['grand_total']);
    _routePayment(paidByRaw, amount, onCash, onCard, onCheque, onGiftCard,
        onDeposit, onPaypal, onCustom);
  }

  void _routePayment(
    dynamic paidBy,
    double amount,
    void Function(double) onCash,
    void Function(double) onCard,
    void Function(double) onCheque,
    void Function(double) onGiftCard,
    void Function(double) onDeposit,
    void Function(double) onPaypal,
    void Function(String key, double) onCustom,
  ) {
    final id = paidBy?.toString() ?? '1';
    switch (id) {
      case '1':
        onCash(amount);
      case '3':
        onCard(amount);
      case '4':
        onCheque(amount);
      case '2':
        onGiftCard(amount);
      case '6':
        onDeposit(amount);
      case '5':
      case 'paypal':
        onPaypal(amount);
      default:
        final key = '${id}_payment';
        onCustom(key, amount);
    }
  }

  static double _dbl(dynamic v) {
    if (v is num) return v.toDouble();
    return double.tryParse(v?.toString() ?? '') ?? 0;
  }

  Future<int> importOpenFromServer({
    required int serverRegisterId,
    required int userId,
    required int warehouseId,
    required double cashInHand,
  }) async {
    final existing = await getOpenRegister(
      userId: userId,
      warehouseId: warehouseId,
    );
    if (existing != null) {
      if (existing.serverRegisterId == null) {
        await (_db.update(_db.localCashRegisters)
              ..where((r) => r.id.equals(existing.id)))
            .write(
          LocalCashRegistersCompanion(
            serverRegisterId: Value(serverRegisterId),
            syncStatus: const Value('synced'),
            syncedAt: Value(DateTime.now()),
          ),
        );
        await _attachServerRegisterId(existing.id, serverRegisterId);
      }
      return existing.id;
    }

    final localId = await _db.into(_db.localCashRegisters).insert(
          LocalCashRegistersCompanion.insert(
            clientUuid: _uuid.v4(),
            serverRegisterId: Value(serverRegisterId),
            userId: userId,
            warehouseId: warehouseId,
            cashInHand: cashInHand,
            isOpen: const Value(true),
            syncStatus: const Value('synced'),
            syncedAt: Value(DateTime.now()),
          ),
        );
    return localId;
  }

  Future<void> syncPendingRegisters(PosApiClient api) async {
    final pendingOpen = await (_db.select(_db.localCashRegisters)
          ..where((r) => r.syncStatus.equals('pending_open')))
        .get();

    for (final reg in pendingOpen) {
      try {
        final check = await api.checkCashRegister(
          warehouseId: reg.warehouseId,
          userId: reg.userId,
        );
        int? serverId;
        if (check['open'] == true && check['cash_register_id'] != null) {
          final raw = check['cash_register_id'];
          serverId = raw is int ? raw : int.tryParse(raw.toString());
        } else {
          final res = await api.openCashRegister(
            warehouseId: reg.warehouseId,
            userId: reg.userId,
            cashInHand: reg.cashInHand,
          );
          final raw = res['cash_register_id'];
          serverId = raw is int ? raw : int.tryParse(raw.toString());
        }
        if (serverId == null) continue;

        await (_db.update(_db.localCashRegisters)
              ..where((r) => r.id.equals(reg.id)))
            .write(
          LocalCashRegistersCompanion(
            serverRegisterId: Value(serverId),
            syncStatus: const Value('synced'),
            syncedAt: Value(DateTime.now()),
            errorMessage: const Value(null),
          ),
        );
        await _attachServerRegisterId(reg.id, serverId);
      } catch (e) {
        await (_db.update(_db.localCashRegisters)
              ..where((r) => r.id.equals(reg.id)))
            .write(
          LocalCashRegistersCompanion(
            errorMessage: Value(e.toString()),
          ),
        );
      }
    }

    final pendingClose = await (_db.select(_db.localCashRegisters)
          ..where((r) => r.syncStatus.equals('pending_close')))
        .get();

    for (final reg in pendingClose) {
      var serverId = reg.serverRegisterId;
      if (serverId == null) {
        final refreshed = await getById(reg.id);
        serverId = refreshed?.serverRegisterId;
      }
      if (serverId == null) continue;

      try {
        await api.closeCashRegister(
          registerId: serverId,
          userId: reg.userId,
          closingBalance: reg.closingBalance ?? 0,
          actualCash: reg.actualCash ?? 0,
        );
        await (_db.update(_db.localCashRegisters)
              ..where((r) => r.id.equals(reg.id)))
            .write(
          LocalCashRegistersCompanion(
            syncStatus: const Value('closed_synced'),
            syncedAt: Value(DateTime.now()),
            errorMessage: const Value(null),
          ),
        );
      } catch (e) {
        await (_db.update(_db.localCashRegisters)
              ..where((r) => r.id.equals(reg.id)))
            .write(
          LocalCashRegistersCompanion(
            errorMessage: Value(e.toString()),
          ),
        );
      }
    }
  }

  Future<void> _attachServerRegisterId(int localId, int serverId) async {
    final sales = await (_db.select(_db.localSales)
          ..where((s) => s.localCashRegisterId.equals(localId)))
        .get();

    for (final sale in sales) {
      if (sale.payloadJson == null || sale.payloadJson!.isEmpty) continue;
      try {
        final payload =
            Map<String, dynamic>.from(jsonDecode(sale.payloadJson!) as Map);
        payload['cash_register_id'] = serverId;
        await (_db.update(_db.localSales)
              ..where((s) => s.id.equals(sale.id)))
            .write(
          LocalSalesCompanion(
            payloadJson: Value(jsonEncode(payload)),
          ),
        );
      } catch (_) {}
    }
  }
}
