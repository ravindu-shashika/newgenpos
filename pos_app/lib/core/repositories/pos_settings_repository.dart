import 'dart:convert';

import 'package:drift/drift.dart';

import '../../features/pos/models/invoice_settings.dart';
import '../../features/pos/models/pos_device_settings.dart';
import '../../features/pos/models/pos_settings.dart';
import '../database/app_database.dart';
import '../logging/app_logger.dart';
import '../pos_http/pos_api_client.dart';

class PosSettingsRepository {
  PosSettingsRepository(this._db);

  final AppDatabase _db;

  Future<PosDeviceSettings?> loadDeviceSettings() async {
    final meta = await _db.getSyncMeta();
    final raw = meta?.posSettingsJson;
    if (raw == null || raw.isEmpty) return null;
    try {
      return _parseStoredJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (e, stack) {
      AppLogger.error('PosSettings', 'Failed to parse cached settings', e, stack);
      return null;
    }
  }

  Future<PosSettings?> load() async {
    final bundle = await loadDeviceSettings();
    return bundle?.pos;
  }

  Future<void> saveDeviceSettings(PosDeviceSettings settings) async {
    final blob = <String, dynamic>{
      'pos_setting': settings.pos.toJson(),
      if (settings.invoice != null) 'invoice_setting': settings.invoice!.toJson(),
      if (settings.siteTitle != null && settings.siteTitle!.isNotEmpty)
        'general_setting': {'site_title': settings.siteTitle},
    };
    final json = jsonEncode(blob);

    final updated = await _db.updateSyncMetaPosSettings(
      posSettingsJson: json,
      defaultCustomerId: settings.pos.customerId,
      defaultBillerId: settings.pos.billerId,
    );
    if (updated > 0) return;

    final session = await _db.getDeviceSession();
    final existing = await _db.getSyncMeta();
    final deviceId = existing?.deviceId ?? session?.deviceId;
    final warehouseId =
        existing?.warehouseId ?? session?.warehouseId ?? settings.pos.warehouseId;

    if (deviceId == null || warehouseId == null) {
      AppLogger.warning(
        'PosSettings',
        'Could not cache settings locally — run catalog download first',
      );
      return;
    }

    await _db.upsertSyncMeta(SyncMetaCompanion.insert(
      id: const Value(1),
      deviceId: deviceId,
      warehouseId: warehouseId,
      defaultCustomerId: Value(settings.pos.customerId),
      defaultBillerId: Value(settings.pos.billerId),
      posSettingsJson: Value(json),
    ));
  }

  Future<void> save(PosSettings settings) async {
    final existing = await loadDeviceSettings();
    await saveDeviceSettings(
      PosDeviceSettings(
        pos: settings,
        invoice: existing?.invoice,
        siteTitle: existing?.siteTitle,
      ),
    );
  }

  Future<void> saveFromJsonMap(Map<String, dynamic> json) async {
    await save(PosSettings.fromJson(json));
  }

  /// Settings download chunk: `{ general_setting, pos_setting, invoice_setting }`.
  Future<void> saveFromDownloadRow(Map<String, dynamic> row) async {
    final device = parseBootstrapPayload(row);
    await saveDeviceSettings(device);
  }

  PosDeviceSettings parseBootstrapPayload(Map<String, dynamic> data) {
    final posMap = <String, dynamic>{};

    final pos = data['pos_setting'];
    if (pos is Map) {
      posMap.addAll(Map<String, dynamic>.from(pos));
    }

    void merge(String bootstrapKey, String settingKey) {
      final value = data[bootstrapKey];
      if (value != null) {
        posMap[settingKey] = value;
      }
    }

    merge('default_customer_id', 'customer_id');
    merge('default_biller_id', 'biller_id');
    merge('default_warehouse_id', 'warehouse_id');

    InvoiceSettings? invoice;
    final invoiceRaw = data['invoice_setting'];
    if (invoiceRaw is Map) {
      invoice = InvoiceSettings.fromJson(Map<String, dynamic>.from(invoiceRaw));
    }

    String? siteTitle;
    final general = data['general_setting'];
    if (general is Map) {
      siteTitle = general['site_title']?.toString();
    }

    return PosDeviceSettings(
      pos: PosSettings.fromJson(posMap),
      invoice: invoice,
      siteTitle: siteTitle,
    );
  }

  /// Pull latest POS + invoice settings from `GET /pos/bootstrap` and cache locally.
  Future<PosDeviceSettings> refreshFromBootstrap(PosApiClient api) async {
    final data = await api.bootstrap();
    final settings = parseBootstrapPayload(data);
    await saveDeviceSettings(settings);
    AppLogger.info(
      'PosSettings',
      'Refreshed from server',
      'customer=${settings.pos.customerId} biller=${settings.pos.billerId} '
          'print=${settings.pos.showPrintInvoice} thermal=${settings.thermalSize} '
          'payments=${settings.pos.paymentOptions.join(",")}',
    );
    return settings;
  }

  PosDeviceSettings _parseStoredJson(Map<String, dynamic> map) {
    if (map.containsKey('pos_setting')) {
      return parseBootstrapPayload(map);
    }
    return PosDeviceSettings(pos: PosSettings.fromJson(map));
  }
}
