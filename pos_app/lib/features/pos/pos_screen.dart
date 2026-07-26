import 'dart:async';
import 'dart:math' as math;

import 'package:intl/intl.dart';

import 'package:drift/drift.dart' show OrderingTerm;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/app_config.dart';
import '../../core/services/pos_window_service.dart';
import '../../core/providers/app_providers.dart';
import '../../core/providers/pos_connectivity_providers.dart';
import '../../core/database/app_database.dart';
import '../../core/providers/pos_meta_provider.dart';
import '../../core/providers/product_grid_provider.dart';
import '../../core/sync/download_models.dart';
import '../auth/download_screen.dart';
import '../auth/login_screen.dart';
import 'models/cart_line.dart';
import 'models/pos_settings.dart';
import 'models/pos_ui_settings.dart';
import 'models/return_cart_line.dart';
import 'models/return_models.dart';
import 'models/scanned_product.dart';
import 'services/return_entry_service.dart';
import 'pos_checkout_defaults.dart';
import 'pos_checkout_state.dart';
import 'cart_line_calc.dart';
import 'pos_helpers.dart';
import 'sale_reference.dart';
import 'pos_totals.dart';
import 'pos_currency.dart';
import 'pos_entry_mode.dart';
import 'product_filter.dart';
import '../../core/theme/pos_theme.dart';
import '../../core/theme/pos_app_styles.dart';
import 'models/cash_register_details.dart';
import 'services/cash_register_day_end_print_service.dart';
import 'services/receipt_print_service.dart';
import 'widgets/cart_line_edit_dialog.dart';
import 'widgets/cash_register_dialogs.dart';
import 'pos_settings_screen.dart';
import 'providers/pos_register_actions_provider.dart';
import 'providers/pos_nav_provider.dart';
import 'providers/pos_settings_subpage_provider.dart';
import 'widgets/pos_sidebar.dart';
import 'print_setup_screen.dart';
import '../../core/providers/local_print_settings_provider.dart';
import '../../core/providers/pos_ui_settings_provider.dart';
import 'widgets/finalize_sale_dialog.dart';
import 'widgets/coupon_entry_dialog.dart';
import 'widgets/add_item_entry_dialog.dart';
import 'widgets/discount_entry_dialog.dart';
import 'widgets/payment_carousel_dialog.dart';
import 'widgets/transaction_success_dialog.dart';
import 'services/return_receipt_print_service.dart';
import 'widgets/return_credit_amount_dialog.dart';
import 'widgets/return_credit_dialog.dart';
import 'widgets/return_session_panel.dart';
import 'widgets/issue_return_bill_dialog.dart';
import 'widgets/pos_professional_dialog.dart';
import 'widgets/sale_bill_detail_dialog.dart';
import 'widgets/pos_toast.dart';
import 'widgets/show_pos_dialog.dart';
import 'widgets/pos_touch_keyboard_controller.dart';
import 'widgets/pos_touch_keyboard_host.dart';
import 'widgets/pos_customer_picker.dart';
import 'widgets/checkout_party_required_dialog.dart';
import 'widgets/pos_touch_text_field.dart';
import 'widgets/pos_batch_picker_dialog.dart';
import 'widgets/pos_catalog_entry_bar.dart';
import 'widgets/pos_ui_widgets.dart';

class PosScreen extends ConsumerStatefulWidget {
  const PosScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  ConsumerState<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends ConsumerState<PosScreen>
    with WidgetsBindingObserver {
  final _scanCtrl = TextEditingController();
  final _returnScanCtrl = TextEditingController();
  final _searchFocus = FocusNode();
  final _catalogScrollCtrl = ScrollController();
  Timer? _searchDebounce;
  Timer? _onlinePollTimer;
  List<ScannedProduct> _searchResults = [];
  bool _searchOpen = false;
  bool _busy = false;
  bool _syncing = false;
  bool _initialized = false;
  bool _barcodeBusy = false;
  String? _lastBarcodeTerm;
  DateTime? _lastBarcodeAt;
  int? _openCashRegisterId;
  bool _returnFlowActive = false;
  ProviderSubscription<int>? _returnTriggerSub;
  ProviderSubscription<int>? _issueReturnBillTriggerSub;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _catalogScrollCtrl.addListener(_onCatalogScroll);
    if (widget.embedded) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _returnTriggerSub = ref.listenManual<int>(
          posReturnSaleTriggerProvider,
          (prev, next) {
            if (prev == null || next <= prev) return;
            unawaited(_showReturnFlow());
          },
        );
        _issueReturnBillTriggerSub = ref.listenManual<int>(
          posIssueReturnBillTriggerProvider,
          (prev, next) {
            if (prev == null || next <= prev) return;
            unawaited(_showIssueReturnBillFlow());
          },
        );
      });
    }
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!widget.embedded) {
        await PosWindowService.instance.enterKioskMode();
      }
      if (!mounted) return;
      // Let kiosk padding/layout settle before blocking modals appear.
      await Future<void>.delayed(const Duration(milliseconds: 150));
      if (!mounted) return;
      _initCheckoutDefaults();
      _refreshOnlineStatus();
      _focusEntryField();
      _onlinePollTimer = Timer.periodic(
        AppConfig.healthCheckInterval,
        (_) => _refreshOnlineStatus(),
      );
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _refreshOnlineStatus();
    }
  }

  void _refreshOnlineStatus() {
    refreshPosLinkStatus(ref);
  }

  Future<void> _toggleFullscreen() async {
    await PosWindowService.instance.toggleKioskMode();
  }

  Future<void> _initCheckoutDefaults() async {
    if (_initialized) return;
    _initialized = true;
    try {
      PosSettings? settings;
      final online = await ref.read(syncServiceProvider).probeOnline();
      if (online) {
        settings = await _fetchAndCachePosSettings();
      } else {
        settings = await ref.read(posSettingsProvider.future);
      }
      // Apply admin/server defaults (and local UI overrides) to register + session.
      await _applyPosSettings(settings, persistSession: true);
      await _ensureCashRegisterOpen(settings);
    } catch (_) {
      try {
        final settings = await ref.read(posSettingsProvider.future);
        await _applyPosSettings(settings, persistSession: true);
      } catch (_) {}
    }
  }

  Future<void> _ensureCashRegisterOpen(PosSettings? settings) async {
    if (settings?.cashRegister != true) return;

    final session = ref.read(sessionServiceProvider);
    final userId = session.userId;
    final warehouseId = session.warehouseId ?? _checkout.warehouseId;
    if (userId == null || warehouseId == null) return;

    final service = ref.read(cashRegisterServiceProvider);
    _openCashRegisterId = await service.getOpenRegisterId(
      userId: userId,
      warehouseId: warehouseId,
    );

    if (_openCashRegisterId != null) {
      if (mounted) setState(() {});
      return;
    }

    try {
      final online = await ref.read(syncServiceProvider).probeOnline();
      if (online) {
        final openId = await service.checkOpenRegister(
          warehouseId: warehouseId,
          userId: userId,
        );
        if (!mounted) return;
        if (openId != null) {
          setState(() => _openCashRegisterId = openId);
          return;
        }
      }

      final meta = await ref.read(posLocalMetaProvider.future);
      String? warehouseName;
      for (final w in meta.warehouses) {
        if (w.id == warehouseId) {
          warehouseName = w.name;
          break;
        }
      }

      if (!mounted) return;
      await Future<void>.delayed(Duration.zero);
      if (!mounted) return;
      ref.read(posTouchKeyboardControllerProvider).detach();
      final opened = await showOpenCashRegisterDialog(
        context: context,
        service: service,
        warehouseId: warehouseId,
        userId: userId,
        warehouseName: warehouseName,
      );
      if (!mounted) return;
      if (opened) {
        final id = await service.getOpenRegisterId(
          userId: userId,
          warehouseId: warehouseId,
        );
        setState(() => _openCashRegisterId = id);
      }
    } catch (e) {
      if (mounted) _showSnack('Cash register check failed: $e', error: true);
    }
  }

  Future<void> _showCashRegisterDetails({bool requireClose = false}) async {
    final session = ref.read(sessionServiceProvider);
    final userId = session.userId;
    final warehouseId = session.warehouseId ?? _checkout.warehouseId;
    if (userId == null) {
      _showSnack('No open cash register', error: true);
      return;
    }
    final service = ref.read(cashRegisterServiceProvider);
    final registerId = _openCashRegisterId ??
        await service.getOpenRegisterId(
          userId: userId,
          warehouseId: warehouseId,
        );
    if (registerId == null) {
      _showSnack('No open cash register', error: true);
      return;
    }

    ref.read(posTouchKeyboardControllerProvider).detach();
    final closed = await showCashRegisterDetailsDialog(
      context: context,
      service: ref.read(cashRegisterServiceProvider),
      registerId: registerId,
      userId: userId,
      requireClose: requireClose,
      onDayEndPrint: _printDayEndSummary,
    );
    if (!mounted) return;
    if (closed) {
      setState(() => _openCashRegisterId = null);
    }
  }

  Future<PosSettings?> _fetchAndCachePosSettings() async {
    final bundle = await ref
        .read(posSettingsRepositoryProvider)
        .refreshFromBootstrap(ref.read(apiClientProvider));
    ref.invalidate(posDeviceSettingsProvider);
    ref.invalidate(posSettingsProvider);
    return bundle.pos;
  }

  Future<void> _applyPosSettings(
    PosSettings? settings, {
    bool persistSession = true,
  }) async {
    final session = ref.read(sessionServiceProvider);
    final meta = await ref.read(posLocalMetaProvider.future);
    final syncMeta = await ref.read(appDatabaseProvider).getSyncMeta();
    final checkout = ref.read(posCheckoutProvider);
    final ui = ref.read(posUiSettingsProvider);

    final parties = resolveCheckoutPartyIds(
      ui: ui,
      settings: settings,
      syncMeta: syncMeta,
      sessionCustomerId: session.customerId,
      sessionBillerId: session.billerId,
      sessionWarehouseId: session.warehouseId,
      customers: meta.customers,
      billers: meta.billers,
      warehouses: meta.warehouses,
      includeSessionFallback: true,
    );

    if (persistSession) {
      if (parties.customerId != null) {
        await session.setCustomerId(parties.customerId!);
      } else {
        await session.clearCustomerId();
      }
      if (parties.billerId != null) {
        await session.setBillerId(parties.billerId!);
      } else {
        await session.clearBillerId();
      }
    }

    _setCheckout(checkout.copyWith(
      customerId: parties.customerId,
      billerId: parties.billerId,
      warehouseId: parties.warehouseId,
      clearCustomerId: parties.customerId == null,
      clearBillerId: parties.billerId == null,
      saleDate: DateTime.now(),
    ));
  }

  CheckoutPartyIds _resolveServerCheckoutParties({
    required PosSettings? settings,
    required SyncMetaData? syncMeta,
    required List<Customer> customers,
    required List<Biller> billers,
    required List<Warehouse> warehouses,
    required int? sessionWarehouseId,
  }) {
    final ui = ref.read(posUiSettingsProvider);
    return resolveCheckoutPartyIds(
      ui: ui,
      settings: settings,
      syncMeta: syncMeta,
      sessionCustomerId: null,
      sessionBillerId: null,
      sessionWarehouseId: sessionWarehouseId,
      customers: customers,
      billers: billers,
      warehouses: warehouses,
      includeSessionFallback: false,
      useUiDefaults: false,
    );
  }

  String? _catalogPartyName({
    required int? id,
    required Iterable<({int id, String name})> items,
  }) {
    if (id == null) return null;
    for (final item in items) {
      if (item.id == id) return item.name;
    }
    return null;
  }

  Future<bool> _applyServerCheckoutDefaults() async {
    PosSettings? settings = ref.read(posSettingsProvider).value;
    final link = ref.read(posLinkStatusProvider).valueOrNull;
    if (link?.serverOnline == true) {
      try {
        settings = await _fetchAndCachePosSettings() ?? settings;
      } catch (_) {}
    }
    if (!mounted) return false;

    final meta = await ref.read(posLocalMetaProvider.future);
    final syncMeta = await ref.read(appDatabaseProvider).getSyncMeta();
    final session = ref.read(sessionServiceProvider);
    final checkout = ref.read(posCheckoutProvider);

    final parties = _resolveServerCheckoutParties(
      settings: settings,
      syncMeta: syncMeta,
      customers: meta.customers,
      billers: meta.billers,
      warehouses: meta.warehouses,
      sessionWarehouseId: session.warehouseId,
    );

    final missingBefore = checkoutPartyMissingParts(
      checkoutCustomerId: checkout.customerId,
      checkoutBillerId: checkout.billerId,
    );

    final customerId = checkout.customerId ??
        (missingBefore.missingCustomer ? parties.customerId : null);
    final billerId = checkout.billerId ??
        (missingBefore.missingBiller ? parties.billerId : null);

    if ((missingBefore.missingCustomer && customerId == null) ||
        (missingBefore.missingBiller && billerId == null)) {
      _showSnack(
        pleaseSelectCheckoutPartiesMessage(
          missingCustomer: missingBefore.missingCustomer && customerId == null,
          missingBiller: missingBefore.missingBiller && billerId == null,
        ),
        error: true,
      );
      return false;
    }

    if (customerId != null) await session.setCustomerId(customerId);
    if (billerId != null) await session.setBillerId(billerId);

    _setCheckout(checkout.copyWith(
      customerId: customerId,
      billerId: billerId,
      warehouseId: parties.warehouseId ?? checkout.warehouseId,
      clearCustomerId: customerId == null,
      clearBillerId: billerId == null,
    ));

    if (!checkoutPartiesMissing(
      checkoutCustomerId: customerId,
      checkoutBillerId: billerId,
    )) {
      _showSnack('Default customer and biller applied');
    }
    return true;
  }

  Future<bool> _ensureCheckoutParties() async {
    var checkout = ref.read(posCheckoutProvider);
    if (!checkoutPartiesMissing(
      checkoutCustomerId: checkout.customerId,
      checkoutBillerId: checkout.billerId,
    )) {
      return true;
    }

    while (mounted) {
      checkout = ref.read(posCheckoutProvider);
      final missing = checkoutPartyMissingParts(
        checkoutCustomerId: checkout.customerId,
        checkoutBillerId: checkout.billerId,
      );
      if (!missing.missingCustomer && !missing.missingBiller) return true;

      final meta = await ref.read(posLocalMetaProvider.future);
      final settings = ref.read(posSettingsProvider).value;
      final syncMeta = await ref.read(appDatabaseProvider).getSyncMeta();
      if (!mounted) return false;

      final serverParties = _resolveServerCheckoutParties(
        settings: settings,
        syncMeta: syncMeta,
        customers: meta.customers,
        billers: meta.billers,
        warehouses: meta.warehouses,
        sessionWarehouseId: ref.read(sessionServiceProvider).warehouseId,
      );

      final canApplyDefaults =
          (!missing.missingCustomer || serverParties.customerId != null) &&
              (!missing.missingBiller || serverParties.billerId != null);

      final result = await showCheckoutPartyRequiredDialog(
        context: context,
        missingCustomer: missing.missingCustomer,
        missingBiller: missing.missingBiller,
        defaultCustomerLabel: missing.missingCustomer
            ? _catalogPartyName(
                id: serverParties.customerId,
                items: meta.customers
                    .map((c) => (id: c.id, name: c.name))
                    .toList(),
              )
            : null,
        defaultBillerLabel: missing.missingBiller
            ? _catalogPartyName(
                id: serverParties.billerId,
                items: meta.billers
                    .map((b) => (id: b.id, name: b.name))
                    .toList(),
              )
            : null,
        canApplyDefaults: canApplyDefaults,
      );
      if (!mounted ||
          result == null ||
          result == CheckoutPartyDialogResult.cancelled) {
        _showSnack(
          pleaseSelectCheckoutPartiesMessage(
            missingCustomer: missing.missingCustomer,
            missingBiller: missing.missingBiller,
          ),
          error: true,
        );
        return false;
      }

      final applied = await _applyServerCheckoutDefaults();
      if (!applied) continue;

      checkout = ref.read(posCheckoutProvider);
      if (!checkoutPartiesMissing(
        checkoutCustomerId: checkout.customerId,
        checkoutBillerId: checkout.billerId,
      )) {
        return true;
      }
    }
    return false;
  }

  Future<void> _resetCheckoutForNewSale() async {
    final session = ref.read(sessionServiceProvider);
    final meta = await ref.read(posLocalMetaProvider.future);
    final syncMeta = await ref.read(appDatabaseProvider).getSyncMeta();
    final ui = ref.read(posUiSettingsProvider);
    final settings = await ref.read(posSettingsProvider.future);

    final parties = resolveCheckoutPartyIds(
      ui: ui,
      settings: settings,
      syncMeta: syncMeta,
      sessionCustomerId: session.customerId,
      sessionBillerId: session.billerId,
      sessionWarehouseId: session.warehouseId,
      customers: meta.customers,
      billers: meta.billers,
      warehouses: meta.warehouses,
      includeSessionFallback: false,
    );

    _setCheckout(PosCheckoutState(
      customerId: parties.customerId,
      billerId: parties.billerId,
      warehouseId: parties.warehouseId,
      saleDate: DateTime.now(),
    ));
    if (mounted) {
      setState(() {});
    }
  }

  Future<ReturnSaleLookup?> _serverSaleLookup(String referenceNo) async {
    try {
      final data = await ref
          .read(apiClientProvider)
          .lookupSaleForReturn(referenceNo: referenceNo);
      return ReturnSaleLookup.fromJson(data);
    } catch (_) {
      return null;
    }
  }

  void _clearReturnSession() {
    _returnScanCtrl.clear();
    _setCheckout(_checkout.clearReturnSession());
    if (mounted) setState(() {});
  }

  Future<void> _editReturnCredit() async {
    final checkout = _checkout;
    if (!checkout.hasReturnSession || checkout.returnLines.isEmpty) return;

    final maxAmount = checkout.returnLinesTotal;
    final amount = await showReturnCreditAmountDialog(
      context: context,
      maxAmount: maxAmount,
      initialAmount: checkout.returnCreditFromSession,
    );
    if (amount == null || !mounted) return;

    _setCheckout(checkout.copyWith(returnCreditOverride: amount));
    setState(() {});
  }

  void _startReturnSession(ReturnCheckoutSessionStart start) {
    _setCheckout(_checkout.startReturnSession(start));
    if (mounted) setState(() {});
  }

  ReturnEntryService get _returnEntryService =>
      ReturnEntryService(ref.read(productLookupRepositoryProvider));

  Future<void> _handleReturnScanSubmit(String input) async {
    final warehouseId = _warehouseId;
    final customerId = _checkout.customerId;
    if (warehouseId == null || customerId == null) {
      _showSnack('Customer and warehouse required', error: true);
      return;
    }
    if (!_checkout.hasReturnSession) return;

    final term = input.trim();
    if (term.isEmpty) return;

    setState(() => _busy = true);
    try {
      var match = await _returnEntryService.resolveInput(
        input: term,
        warehouseId: warehouseId,
        customerId: customerId,
        saleLookup: _checkout.originalSaleLookup,
      );

      if (match == null && term.length >= 2) {
        final hits = await _returnEntryService.searchByName(
          query: term,
          warehouseId: warehouseId,
        );
        if (hits.length > 1 && mounted) {
          final picked = await showPosDialog<ScannedProduct>(
            context: context,
            builder: (ctx) => SimpleDialog(
              title: const Text('Select product'),
              children: [
                for (final p in hits.take(12))
                  SimpleDialogOption(
                    onPressed: () => Navigator.pop(context, p),
                    child: ListTile(
                      title: Text(p.name),
                      subtitle: Text(p.code),
                    ),
                  ),
              ],
            ),
          );
          if (picked == null) return;
          match = ReturnProductMatch(
            product: picked,
            saleLine: _returnEntryService.matchProductToSaleLine(
              product: picked,
              lookup: _checkout.originalSaleLookup!,
            ),
          );
        } else if (hits.length == 1) {
          final product = hits.first;
          match = ReturnProductMatch(
            product: product,
            saleLine: _checkout.originalSaleLookup != null
                ? _returnEntryService.matchProductToSaleLine(
                    product: product,
                    lookup: _checkout.originalSaleLookup!,
                  )
                : null,
          );
        }
      }

      if (match == null) {
        _showSnack('Product not found or not on original sale', error: true);
        return;
      }

      if (_checkout.originalSaleLookup != null && match.saleLine == null) {
        _showSnack('Product not found on original sale', error: true);
        return;
      }

      final saleLine = match.saleLine;
      if (saleLine != null) {
        final inSession = _checkout.returnQtyInSessionForSaleLine(
          saleLine.productSaleId,
        );
        if (inSession >= saleLine.returnableQty) {
          _showSnack('Max returnable qty reached for this line', error: true);
          return;
        }
      }

      final cartLine = _returnEntryService.buildReturnLine(match: match);
      _setCheckout(_checkout.addReturnLine(cartLine));
      _returnScanCtrl.clear();
    } catch (e) {
      _showSnack('Return scan error: $e', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    _returnTriggerSub?.close();
    _issueReturnBillTriggerSub?.close();
    WidgetsBinding.instance.removeObserver(this);
    _onlinePollTimer?.cancel();
    _catalogScrollCtrl.removeListener(_onCatalogScroll);
    _catalogScrollCtrl.dispose();
    _scanCtrl.dispose();
    _returnScanCtrl.dispose();
    _searchDebounce?.cancel();
    _searchFocus.dispose();
    super.dispose();
  }

  void _onCatalogScroll() {
    if (!_catalogScrollCtrl.hasClients) return;
    final position = _catalogScrollCtrl.position;
    if (position.pixels < position.maxScrollExtent - 320) return;
    ref.read(productGridProvider.notifier).loadMore();
  }

  PosCheckoutState get _checkout => ref.read(posCheckoutProvider);

  void _setCheckout(PosCheckoutState state) {
    ref.read(posCheckoutProvider.notifier).state = state;
  }

  PosTotals _calcTotals(PosCheckoutState checkout) {
    final ui = ref.read(posUiSettingsProvider);
    return calcPosTotals(
      lines: checkout.lines,
      orderDiscountValue: checkout.orderDiscountValue,
      orderDiscountType: checkout.orderDiscountType,
      orderTaxRate: ui.enableTax ? checkout.orderTaxRate : 0,
      shippingCost: ui.enableShipping ? checkout.shippingCost : 0,
      couponDiscount: checkout.couponDiscount,
      returnSettlementCredit:
          ui.enableReturn ? checkout.returnCreditApplied : 0,
      returnSessionCredit:
          ui.enableReturn ? checkout.returnCreditFromSession : 0,
    );
  }

  PosTotals get _totals => _calcTotals(_checkout);

  Future<void> _openCatalogSync(PosDownloadMode mode) async {
    final online = await ref.read(syncServiceProvider).probeOnline();
    if (!mounted) return;
    if (!online) {
      _showSnack('Connect to internet to download latest data', error: true);
      return;
    }
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => DownloadScreen(
          mode: mode,
          inApp: true,
          autoStart: mode == PosDownloadMode.delta,
        ),
      ),
    );
    if (result == true && mounted) {
      reloadProductGrid(ref);
      ref.invalidate(posLocalMetaProvider);
      ref.read(syncRevisionProvider.notifier).state++;
      if (mode == PosDownloadMode.full) {
        _setCheckout(const PosCheckoutState());
      }
      try {
        await _fetchAndCachePosSettings();
        final settings = ref.read(posSettingsProvider).value ??
            await ref.read(posSettingsProvider.future);
        await _applyPosSettings(settings);
      } catch (_) {}
      _showSnack(mode == PosDownloadMode.full
          ? 'All POS data re-downloaded'
          : 'Latest data synced');
    }
  }

  Future<void> _printDayEndSummary(
    CashRegisterDetails details,
    double actualCash,
  ) async {
    final printSettings = ref.read(localPrintSettingsProvider);
    final session = ref.read(sessionServiceProvider);
    final meta = ref.read(posLocalMetaProvider).value;
    String? warehouseName;
    final whId = session.warehouseId;
    if (meta != null && whId != null) {
      for (final w in meta.warehouses) {
        if (w.id == whId) {
          warehouseName = w.name;
          break;
        }
      }
    }
    await CashRegisterDayEndPrintService.printDayEndSummary(
      details: details,
      actualCash: actualCash,
      printSettings: printSettings,
      cashierName: session.userName,
      warehouseName: warehouseName,
      registerId: _openCashRegisterId,
    );
  }

  void _goDashboard() {
    if (widget.embedded) {
      ref.read(posNavSectionProvider.notifier).state =
          PosNavSection.dashboard;
      return;
    }
    if (Navigator.canPop(context)) {
      Navigator.pop(context);
    }
  }

  String get _stationCode {
    final code = ref.read(sessionServiceProvider).terminalCode?.trim();
    if (code != null && code.isNotEmpty) return code.toUpperCase();
    return 'STATION 01';
  }

  void _showOperatorProfile() {
    final session = ref.read(sessionServiceProvider);
    final name = session.userName?.trim();
    final id = session.userId;
    final message = name != null && name.isNotEmpty
        ? '$name${id != null ? '\nID: $id' : ''}'
        : (id != null ? 'Operator #$id' : 'Signed in');
    showPosInfoDialog(
      context: context,
      title: 'Operator',
      message: message,
      icon: Icons.person_outline,
    );
  }

  Future<void> _openSettings() async {
    if (widget.embedded) {
      ref.read(posNavSectionProvider.notifier).state =
          PosNavSection.settings;
      return;
    }
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const PosSettingsScreen()),
    );
  }

  Future<void> _openPrintSetup() async {
    if (widget.embedded) {
      openPosPrinterSettings(ref);
      return;
    }
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const PrintSetupScreen()),
    );
  }

  Future<void> _logout() async {
    final settings = ref.read(posSettingsProvider).value ??
        await ref.read(posSettingsProvider.future);
    if (settings?.cashRegister == true) {
      final service = ref.read(cashRegisterServiceProvider);
      final session = ref.read(sessionServiceProvider);
      final registerId = _openCashRegisterId ??
          await service.getOpenRegisterId(
            userId: session.userId ?? 0,
            warehouseId: session.warehouseId ?? _checkout.warehouseId,
          );
      if (registerId != null) {
        final closed = await showCashRegisterDetailsDialog(
          context: context,
          service: service,
          registerId: registerId,
          userId: session.userId!,
          requireClose: true,
          onDayEndPrint: _printDayEndSummary,
        );
        if (!closed || !mounted) return;
        setState(() => _openCashRegisterId = null);
      }
    }

    await PosWindowService.instance.exitKioskMode();
    await ref.read(sessionServiceProvider).clear();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  Future<bool> _tryAddToCart(ScannedProduct product, {double qty = 1}) async {
    final warehouseId = _warehouseId;
    if (warehouseId == null) {
      _showSnack('Warehouse not configured', error: true);
      return false;
    }

    var resolved = product;
    if (product.isBatch && product.productBatchId == null) {
      final options = await ref
          .read(productLookupRepositoryProvider)
          .listBatchOptions(
            productId: product.productId,
            warehouseId: warehouseId,
          );
      if (options.isEmpty) {
        _showSnack('No batch stock for "${product.name}"', error: true);
        return false;
      }
      if (options.length > 1) {
        if (!mounted) return false;
        final picked = await showBatchPickerDialog(
          context: context,
          productName: product.name,
          options: options,
        );
        if (picked == null) return false;
        resolved = product.copyWith(
          productBatchId: picked.batchId,
          batchNo: picked.batchNo,
          warehouseQty: picked.qty,
          price: picked.price ?? product.price,
          maxPrice: picked.maxPrice ?? product.maxPrice,
        );
      } else {
        final only = options.first;
        resolved = product.copyWith(
          productBatchId: only.batchId,
          batchNo: only.batchNo,
          warehouseQty: only.qty,
          price: only.price ?? product.price,
          maxPrice: only.maxPrice ?? product.maxPrice,
        );
      }
    }

    final inCart = checkoutQtyForProduct(
      _checkout.lines,
      productId: resolved.productId,
      variantId: resolved.variantId,
      productBatchId: resolved.productBatchId,
    );

    var addQty = qty;
    // Default item discount from max_price − price; modal can override.
    var unitDiscount = defaultUnitDiscount(resolved);

    if (ref.read(posUiSettingsProvider).enableAddItemModal) {
      if (!mounted) return false;

      final entry = await showAddItemEntryDialog(
        context: context,
        product: resolved,
        availableStock: resolved.warehouseQty,
        initialUnitDiscount: defaultUnitDiscount(resolved),
      );
      if (entry == null) return false;
      addQty = entry.qty;
      unitDiscount = entry.unitDiscount;
    }

    final message = stockLimitMessage(
      productName: resolved.name,
      available: resolved.warehouseQty,
      requested: inCart + addQty,
    );
    if (message != null) {
      _showSnack(message, error: true);
      return false;
    }

    final listPrice = listUnitPrice(resolved);

    final draft = CartLine(
      productId: resolved.productId,
      variantId: resolved.variantId,
      productBatchId: resolved.productBatchId,
      batchNo: resolved.batchNo,
      code: resolved.code,
      name: resolved.name,
      netUnitPrice: resolved.price,
      netUnitCost: resolved.cost,
      taxRate: resolved.taxRate,
      taxMethod: resolved.taxMethod,
      qty: addQty,
      stockQty: resolved.warehouseQty,
    );

    final line = applyCartLineEdit(
      line: draft,
      qty: addQty,
      unitDiscount: unitDiscount,
      rowUnitPrice: listPrice,
      taxRate: resolved.taxRate,
      taxMethod: resolved.taxMethod,
      saleUnit: draft.saleUnit,
    );

    _setCheckout(_checkout.addProduct(line));
    return true;
  }

  void _applyDiscountEntryResult(DiscountEntryResult result) {
    var next = _checkout.copyWith(
      orderDiscountType: result.orderDiscountType,
      orderDiscountValue: result.orderDiscountValue,
    );

    if (result.couponCleared) {
      next = next.copyWith(clearCoupon: true);
    } else if (result.couponCode != null && result.couponCode!.isNotEmpty) {
      next = next.copyWith(
        couponCode: result.couponCode,
        couponId: result.couponId,
        couponDiscount: result.couponDiscount,
      );
    }

    _setCheckout(next);
  }

  Future<void> _updateCartLine(
    PosCheckoutState checkout,
    CartLine updated,
  ) async {
    if (updated.qty <= 0) {
      _setCheckout(checkout.updateQty(updated.lineKey, updated.qty));
      return;
    }

    final warehouseId = _warehouseId;
    if (warehouseId == null) {
      _showSnack('Warehouse not set', error: true);
      return;
    }

    final available = await ref.read(productLookupRepositoryProvider).getWarehouseQty(
          warehouseId: warehouseId,
          productId: updated.productId,
          variantId: updated.variantId,
          productBatchId: updated.productBatchId,
        );
    if (!mounted) return;

    final otherQty = checkoutQtyForProduct(
      checkout.lines,
      productId: updated.productId,
      variantId: updated.variantId,
      productBatchId: updated.productBatchId,
      excludeLineKey: updated.lineKey,
    );
    final message = stockLimitMessage(
      productName: updated.name,
      available: available,
      requested: otherQty + updated.qty,
    );
    if (message != null) {
      _showSnack(message, error: true);
      return;
    }

    _setCheckout(
      checkout.copyWith(
        lines: checkout.lines
            .map(
              (l) => l.lineKey == updated.lineKey
                  ? updated.copyWith(stockQty: available)
                  : l,
            )
            .where((l) => l.qty > 0)
            .toList(),
      ),
    );
  }

  Future<void> _editCartLine(PosCheckoutState checkout, CartLine line) async {
    if (_busy) return;

    try {
      final editContext = await ref
          .read(productLookupRepositoryProvider)
          .loadCartLineEditContext(
            productId: line.productId,
            variantId: line.variantId,
          );
      if (!mounted) return;
      if (editContext == null) {
        _showSnack('Could not load product details', error: true);
        return;
      }

      final meta = await ref.read(posLocalMetaProvider.future);
      if (!mounted) return;

      ref.read(posTouchKeyboardControllerProvider).detach();
      final updated = await showCartLineEditDialog(
        context: context,
        line: line,
        editContext: editContext,
        taxes: meta.taxes,
      );
      if (updated == null || !mounted) return;
      await _updateCartLine(checkout, updated);
    } catch (e) {
      if (mounted) _showSnack('Could not edit line: $e', error: true);
    }
  }

  Future<void> _changeLineQty(
    PosCheckoutState checkout,
    CartLine line,
    double newQty,
  ) async {
    if (newQty <= 0) {
      _setCheckout(checkout.updateQty(line.lineKey, newQty));
      return;
    }

    final warehouseId = _warehouseId;
    if (warehouseId == null) {
      _showSnack('Warehouse not set', error: true);
      return;
    }

    final available = await ref.read(productLookupRepositoryProvider).getWarehouseQty(
          warehouseId: warehouseId,
          productId: line.productId,
          variantId: line.variantId,
          productBatchId: line.productBatchId,
        );
    if (!mounted) return;

    final otherQty = checkoutQtyForProduct(
      checkout.lines,
      productId: line.productId,
      variantId: line.variantId,
      productBatchId: line.productBatchId,
      excludeLineKey: line.lineKey,
    );
    final message = stockLimitMessage(
      productName: line.name,
      available: available,
      requested: otherQty + newQty,
    );
    if (message != null) {
      _showSnack(message, error: true);
      return;
    }

    _setCheckout(
      checkout.copyWith(
        lines: checkout.lines
            .map(
              (l) => l.lineKey == line.lineKey
                  ? l.copyWith(qty: newQty, stockQty: available)
                  : l,
            )
            .where((l) => l.qty > 0)
            .toList(),
      ),
    );
  }

  Future<String?> _validateCheckoutStock(int warehouseId) async {
    final repo = ref.read(productLookupRepositoryProvider);
    final uniqueKeys = <String, ({int productId, int? variantId, int? productBatchId})>{};
    for (final line in _checkout.lines) {
      final key =
          '${line.productId}_${line.variantId ?? 0}_${line.productBatchId ?? 0}';
      uniqueKeys[key] = (
        productId: line.productId,
        variantId: line.variantId,
        productBatchId: line.productBatchId,
      );
    }

    final stockByKey = await repo.getWarehouseQtyBatch(
      warehouseId: warehouseId,
      keys: uniqueKeys.values.toList(),
    );

    for (final line in _checkout.lines) {
      final stockKey = line.productBatchId != null
          ? '${line.productId}_${line.variantId ?? 0}_${line.productBatchId}'
          : '${line.productId}_${line.variantId ?? 0}';
      final available = stockByKey[stockKey] ?? 0;
      final inCart = checkoutQtyForProduct(
        _checkout.lines,
        productId: line.productId,
        variantId: line.variantId,
        productBatchId: line.productBatchId,
      );
      final message = stockLimitMessage(
        productName: line.name,
        available: available,
        requested: inCart,
      );
      if (message != null) return message;
    }
    return null;
  }

  int? get _warehouseId =>
      _checkout.warehouseId ?? ref.read(sessionServiceProvider).warehouseId;

  void _focusEntryField() {
    if (!mounted) return;
    final isSearch =
        ref.read(posCatalogEntryModeProvider) == PosCatalogEntryMode.search;
    if (!isSearch) {
      _searchFocus.requestFocus();
      SystemChannels.textInput.invokeMethod('TextInput.hide');
      return;
    }
    // Refocus so PosTouchTextField re-attaches keyboard after leaving barcode mode.
    _searchFocus.unfocus();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _searchFocus.requestFocus();
    });
  }

  void _clearEntryField({bool refocus = true}) {
    _scanCtrl.clear();
    setState(() {
      _searchResults = [];
      _searchOpen = false;
    });
    final filter = ref.read(productFilterProvider);
    if (filter.searchQuery.isNotEmpty) {
      ref.read(productFilterProvider.notifier).state =
          filter.copyWith(searchQuery: '');
    }
    if (refocus) _focusEntryField();
  }

  void _setEntryMode(PosCatalogEntryMode mode) {
    if (ref.read(posCatalogEntryModeProvider) == mode) return;
    ref.read(posCatalogEntryModeProvider.notifier).state = mode;
  }

  void _onEntryModeChanged(PosCatalogEntryMode? previous, PosCatalogEntryMode next) {
    if (previous == null || previous == next) return;
    _searchDebounce?.cancel();
    if (next == PosCatalogEntryMode.barcode) {
      ref.read(posTouchKeyboardControllerProvider).detach();
      SystemChannels.textInput.invokeMethod('TextInput.hide');
    }
    _clearEntryField();
    if (next == PosCatalogEntryMode.search) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _focusEntryField();
      });
    }
  }

  void _onEntryChanged(String value) {
    if (ref.read(posCatalogEntryModeProvider) != PosCatalogEntryMode.search) {
      return;
    }
    _onSearchChanged(value);
  }

  void _onEntrySubmitted(String value) {
    if (ref.read(posCatalogEntryModeProvider) == PosCatalogEntryMode.barcode) {
      unawaited(_handleBarcodeSubmit(value));
    } else {
      unawaited(_handleSearchSubmit(value));
    }
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    final term = value.trim();
    // Manual search only: drive the product grid (no dropdown overlay).
    if (term.length < 2) {
      setState(() {
        _searchResults = [];
        _searchOpen = false;
      });
      final filter = ref.read(productFilterProvider);
      if (filter.searchQuery.isNotEmpty) {
        ref.read(productFilterProvider.notifier).state =
            filter.copyWith(searchQuery: '');
      }
      return;
    }

    _searchDebounce = Timer(const Duration(milliseconds: 220), () {
      if (!mounted) return;
      if (ref.read(posCatalogEntryModeProvider) != PosCatalogEntryMode.search) {
        return;
      }
      setState(() {
        _searchResults = [];
        _searchOpen = false;
      });
      ref.read(productFilterProvider.notifier).state =
          ref.read(productFilterProvider).copyWith(searchQuery: term);
    });
  }

  void _pickSearchResult(ScannedProduct product) {
    unawaited(_tryAddToCart(product).then((added) {
      if (added && mounted) _clearEntryField();
    }));
  }

  Future<bool> _tryApplyReturnBillFromScan(String term) async {
    final ui = ref.read(posUiSettingsProvider);
    if (!ui.enableReturn || !ui.enableReturnBillSettle) return false;
    if (_checkout.hasReturnSession) return false;

    final trimmed = term.trim();
    if (trimmed.isEmpty) return false;

    if (_checkout.lines.isEmpty) {
      final maybeReturn = normalizeSaleReference(trimmed).startsWith('rr');
      if (maybeReturn) {
        _showSnack('Add sale items first, then scan return bill', error: true);
        return true;
      }
      return false;
    }

    final session = ref.read(sessionServiceProvider);
    final warehouseId = session.warehouseId ?? _checkout.warehouseId;
    final customerId = _checkout.customerId;
    if (warehouseId == null || customerId == null) return false;

    final credit = await ref
        .read(localReturnRepositoryProvider)
        .lookupCreditByReference(
          referenceNo: trimmed,
          warehouseId: warehouseId,
          customerId: customerId,
        );
    if (credit == null) return false;

    if (_checkout.returnSettlements
        .any((s) => s.returnClientUuid == credit.clientUuid)) {
      _showSnack('Return bill already applied', error: true);
      return true;
    }

    final maxApply = _calcTotals(_checkout).grandTotal;
    final apply =
        credit.creditRemaining.clamp(0, maxApply).toDouble();
    if (apply <= 0) {
      _showSnack('Nothing left to apply from this return bill', error: true);
      return true;
    }

    _setCheckout(
      _checkout.copyWith(
        returnSettlements: [
          ..._checkout.returnSettlements,
          AppliedReturnSettlement(
            returnClientUuid: credit.clientUuid,
            returnReferenceNo: credit.referenceNo,
            amount: apply,
            returnId: credit.returnId,
          ),
        ],
      ),
    );
    _showSnack(
      'Return bill ${formatSaleReferenceDisplay(credit.referenceNo)} applied — '
      'credit ${formatPosMoney(apply)}',
      success: true,
    );
    return true;
  }

  Future<void> _handleBarcodeSubmit([String? codeOverride]) async {
    final term = (codeOverride ?? _scanCtrl.text).trim();
    if (term.isEmpty) return;

    // Scanners often fire Enter twice or re-send the same code — ignore duplicates.
    final now = DateTime.now();
    if (_barcodeBusy) {
      _scanCtrl.clear();
      return;
    }
    if (_lastBarcodeTerm == term &&
        _lastBarcodeAt != null &&
        now.difference(_lastBarcodeAt!) < const Duration(milliseconds: 900)) {
      _scanCtrl.clear();
      return;
    }

    final warehouseId = _warehouseId;
    if (warehouseId == null) {
      _showSnack('Warehouse not configured', error: true);
      return;
    }

    _barcodeBusy = true;
    // Clear immediately so the next scan cannot re-submit this buffer.
    _scanCtrl.clear();

    try {
      if (await _tryApplyReturnBillFromScan(term)) {
        if (mounted) _focusEntryField();
        return;
      }

      final product = await ref
          .read(productLookupRepositoryProvider)
          .lookupBarcodeExact(
            code: term,
            warehouseId: warehouseId,
            priceType: _checkout.priceType,
          );

      if (!mounted) return;

      if (product == null) {
        _showSnack('No product for barcode "$term"', error: true);
        _scanCtrl.text = term;
        _scanCtrl.selection = TextSelection(
          baseOffset: 0,
          extentOffset: _scanCtrl.text.length,
        );
        _focusEntryField();
        return;
      }

      _lastBarcodeTerm = term;
      _lastBarcodeAt = DateTime.now();
      // Add to cart as soon as product is identified (no modal delay unless enabled).
      await _tryAddToCart(product);
      if (mounted) _focusEntryField();
    } catch (e) {
      if (mounted) _showSnack('Scan error: $e', error: true);
    } finally {
      _barcodeBusy = false;
    }
  }

  Future<void> _handleSearchSubmit([String? codeOverride]) async {
    final term = (codeOverride ?? _scanCtrl.text).trim();
    if (term.isEmpty) return;

    final session = ref.read(sessionServiceProvider);
    final warehouseId = _warehouseId;
    final customerId = _checkout.customerId ?? session.customerId;
    if (warehouseId == null || customerId == null) {
      _showSnack('Select customer first', error: true);
      return;
    }

    // Keep results in the product grid (no dropdown).
    ref.read(productFilterProvider.notifier).state =
        ref.read(productFilterProvider).copyWith(searchQuery: term);
    setState(() {
      _searchResults = [];
      _searchOpen = false;
    });

    setState(() => _busy = true);
    try {
      if (await _tryApplyReturnBillFromScan(term)) {
        return;
      }

      // Prefer search so a base product code expands all variants in the grid.
      final items = await ref.read(productLookupRepositoryProvider).searchLocal(
            query: term,
            warehouseId: warehouseId,
            priceType: _checkout.priceType,
            limit: 100,
          );

      if (!mounted) return;
      if (items.isEmpty) {
        final exact = await ref.read(productLookupRepositoryProvider).lookup(
              code: term,
              warehouseId: warehouseId,
              customerId: customerId,
              priceType: _checkout.priceType,
            );
        if (!mounted) return;
        if (exact == null) {
          _showSnack('No product found for "$term"', error: true);
          return;
        }
        _pickSearchResult(exact);
        return;
      }

      // Single match: add to cart. Multiple (e.g. all sizes): stay on grid.
      if (items.length == 1) {
        _pickSearchResult(items.first);
      }
    } catch (e) {
      _showSnack('Search error: $e', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _completeReturnOnly({
    required String paidById,
    required double paidAmount,
    bool? printInvoice,
  }) async {
    if (!await _ensureCheckoutParties()) return;

    final session = ref.read(sessionServiceProvider);
    final warehouseId = session.warehouseId;
    final customerId = _checkout.customerId;
    if (warehouseId == null || customerId == null) {
      _showSnack('Customer and warehouse required', error: true);
      return;
    }

    setState(() => _busy = true);
    try {
      final result = await ref
          .read(localReturnRepositoryProvider)
          .saveReturnFromCartLines(
            lines: _checkout.returnLines,
            warehouseId: warehouseId,
            customerId: customerId,
            lookup: _checkout.originalSaleLookup,
            billerId: _checkout.billerId ?? session.billerId,
            creditAmount: _checkout.returnCreditOverride != null
                ? _checkout.returnCreditFromSession
                : null,
          );

      if (!mounted) return;
      final ui = ref.read(posUiSettingsProvider);
      if (ui.enablePrint) {
        await _printReturnReceipt(result);
      }

      await showTransactionSuccessDialog(
        context: context,
        transactionNo: formatSaleReferenceDisplay(result.referenceNo),
        refId: result.clientUuid,
        changeDue: 0,
      );

      await _resetCheckoutForNewSale();
      ref.read(syncRevisionProvider.notifier).state++;
      _syncSalesInBackground();
      _showSnack(
        'Return ${formatSaleReferenceDisplay(result.referenceNo)} completed',
        success: true,
      );
    } catch (e) {
      _showSnack('Return failed: $e', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _completeReturnPlusSale({
    required String paidById,
    required double paidAmount,
    double? payingAmount,
    bool isDraft = false,
    String paymentReceiver = '',
    String paymentNote = '',
    String cardNumber = '',
    String cardHolderName = '',
    String cardType = '',
    String chequeNo = '',
    List<MixPaymentLine>? mixPayments,
    bool? printInvoice,
  }) async {
    final session = ref.read(sessionServiceProvider);
    final warehouseId = session.warehouseId;
    final customerId = _checkout.customerId;
    if (warehouseId == null || customerId == null) {
      _showSnack('Customer and warehouse required', error: true);
      return;
    }

    setState(() => _busy = true);
    try {
      final stockError = await _validateCheckoutStock(warehouseId);
      if (!mounted) return;
      if (stockError != null) {
        _showSnack(stockError, error: true);
        return;
      }

      final returnResult = await ref
          .read(localReturnRepositoryProvider)
          .saveReturnFromCartLines(
            lines: _checkout.returnLines,
            warehouseId: warehouseId,
            customerId: customerId,
            lookup: _checkout.originalSaleLookup,
            billerId: _checkout.billerId ?? session.billerId,
            creditAmount: _checkout.returnCreditOverride != null
                ? _checkout.returnCreditFromSession
                : null,
          );

      final saleGrand = _calcTotals(
        _checkout.copyWith(clearReturnSession: true),
      ).saleGrandTotal;
      final settlementAmount = math.min(
        returnResult.creditRemaining,
        saleGrand,
      );

      final settlements = [
        ..._checkout.returnSettlements,
        if (settlementAmount > 0)
          AppliedReturnSettlement(
            returnClientUuid: returnResult.clientUuid,
            returnReferenceNo: returnResult.referenceNo,
            amount: settlementAmount,
          ),
      ];

      _setCheckout(
        _checkout.copyWith(
          clearReturnSession: true,
          returnSettlements: settlements,
        ),
      );
    } catch (e) {
      if (mounted) setState(() => _busy = false);
      _showSnack('Checkout failed: $e', error: true);
      return;
    }

    if (!mounted) return;
    await _completeSale(
      paidById: paidById,
      paidAmount: paidAmount,
      payingAmount: payingAmount,
      isDraft: isDraft,
      paymentReceiver: paymentReceiver,
      paymentNote: paymentNote,
      cardNumber: cardNumber,
      cardHolderName: cardHolderName,
      cardType: cardType,
      chequeNo: chequeNo,
      mixPayments: mixPayments,
      printInvoice: printInvoice,
    );
  }

  Future<void> _completeSale({
    required String paidById,
    required double paidAmount,
    double? payingAmount,
    bool isDraft = false,
    String paymentReceiver = '',
    String paymentNote = '',
    String cardNumber = '',
    String cardHolderName = '',
    String cardType = '',
    String chequeNo = '',
    List<MixPaymentLine>? mixPayments,
    bool? printInvoice,
  }) async {
    final checkout = _checkout;
    final hasReturnLines =
        checkout.hasReturnSession && checkout.returnLines.isNotEmpty;
    final hasSaleLines = checkout.lines.isNotEmpty;

    if (!checkout.canCheckout) {
      _showSnack('Add at least one product', error: true);
      return;
    }

    if (!await _ensureCheckoutParties()) return;

    if (hasReturnLines && !hasSaleLines) {
      await _completeReturnOnly(
        paidById: paidById,
        paidAmount: paidAmount,
        printInvoice: printInvoice,
      );
      return;
    }

    if (hasReturnLines && hasSaleLines) {
      await _completeReturnPlusSale(
        paidById: paidById,
        paidAmount: paidAmount,
        payingAmount: payingAmount,
        isDraft: isDraft,
        paymentReceiver: paymentReceiver,
        paymentNote: paymentNote,
        cardNumber: cardNumber,
        cardHolderName: cardHolderName,
        cardType: cardType,
        chequeNo: chequeNo,
        mixPayments: mixPayments,
        printInvoice: printInvoice,
      );
      return;
    }

    if (checkout.isEmpty) {
      _showSnack('Add at least one product', error: true);
      return;
    }
    final session = ref.read(sessionServiceProvider);
    final warehouseId = session.warehouseId;
    final customerId = _checkout.customerId;
    final billerId = _checkout.billerId;
    if (warehouseId == null || customerId == null || billerId == null) {
      _showSnack(
        pleaseSelectCheckoutPartiesMessage(
          missingCustomer: customerId == null,
          missingBiller: billerId == null,
        ),
        error: true,
      );
      return;
    }

    setState(() => _busy = true);
    try {
      final stockError = await _validateCheckoutStock(warehouseId);
      if (!mounted) return;
      if (stockError != null) {
        _showSnack(stockError, error: true);
        return;
      }

      final totals = _totals;
      final ui = ref.read(posUiSettingsProvider);
      final clientUuid = newClientUuid();
      final lines = List<CartLine>.from(_checkout.lines);

      String referenceNo;
      if (isDraft) {
        referenceNo =
            'hold-${DateFormat('yyyyMMdd-HHmmss').format(DateTime.now())}';
      } else {
        final generated = generateSaleReference(ui);
        referenceNo = generated.reference;
        if (generated.nextSequence != null) {
          await ref.read(posUiSettingsProvider.notifier).patch(
                (s) => s.copyWith(
                  saleReferenceNextSeq: generated.nextSequence,
                ),
              );
        }
      }

      final normalizedMix = !isDraft && mixPayments != null
          ? normalizeMixPayments(mixPayments)
          : <MixPaymentLine>[];
      final applied = isDraft
          ? 0.0
          : (normalizedMix.isNotEmpty
              ? normalizedMix.fold<double>(
                  0, (sum, line) => sum + line.payingAmount)
              : paidAmount);
      final tendered = isDraft ? 0.0 : (payingAmount ?? applied);
      final changeDue = isDraft
          ? 0.0
          : (tendered - applied).clamp(0, double.infinity).toDouble();
      final cashRegisterService = ref.read(cashRegisterServiceProvider);
      final localCashRegisterId = _openCashRegisterId ??
          await cashRegisterService.getOpenRegisterId(
            userId: session.userId ?? 0,
            warehouseId: warehouseId,
          );
      final serverCashRegisterId = localCashRegisterId != null
          ? await cashRegisterService.serverIdForLocal(localCashRegisterId)
          : null;
      await ref.read(localSaleRepositoryProvider).saveCheckout(
            clientUuid: clientUuid,
            referenceNo: referenceNo,
            warehouseId: warehouseId,
            customerId: customerId,
            billerId: _checkout.billerId ?? session.billerId,
            userId: session.userId,
            localCashRegisterId: localCashRegisterId,
            serverCashRegisterId: serverCashRegisterId,
            lines: lines,
            paidAmount: applied,
            payingAmount: isDraft ? 0 : tendered,
            totals: totals,
            orderTaxRate:
                ui.enableTax ? _checkout.orderTaxRate : 0,
            paidById: paidById,
            isDraft: isDraft,
            saleNote: _checkout.saleNote,
            staffNote: _checkout.staffNote,
            paymentReceiver: paymentReceiver,
            paymentNote: paymentNote,
            cardNumber: cardNumber,
            cardHolderName: cardHolderName,
            cardType: cardType,
            chequeNo: chequeNo,
            mixPayments: normalizedMix.isNotEmpty ? normalizedMix : null,
            returnSettlements: ui.enableReturn
                ? _checkout.returnSettlements
                    .map((s) => s.toSyncJson())
                    .toList()
                : [],
          );

      if (!isDraft && ui.enableReturn) {
        for (final settlement in _checkout.returnSettlements) {
          await ref
              .read(localReturnRepositoryProvider)
              .applyLocalSettlement(
                settlement.returnClientUuid,
                settlement.amount,
              );
        }
        await session.setCustomerId(customerId);
      }

      if (!isDraft && mounted) {
        final autoPrint = printInvoice == true && ui.shouldAutoPrintBill;
        if (autoPrint) {
          try {
            final cashierName = session.userName?.trim() ?? '';
            final receipt =
                await ref.read(localSaleRepositoryProvider).getLastReceipt(
                      cashierName: cashierName,
                    );
            if (receipt != null && receipt.lines.isNotEmpty) {
              final printSettings = ref.read(localPrintSettingsProvider);
              await ReceiptPrintService.printReceipt(
                receipt,
                printSettings: printSettings,
                cashierName: cashierName,
                silent: true,
              );
            }
          } catch (_) {}
        }

        await showTransactionSuccessDialog(
          context: context,
          transactionNo: formatSaleReferenceDisplay(referenceNo),
          refId: clientUuid,
          changeDue: changeDue,
          cashReceived: changeDue > 0.009 ? tendered : null,
          // Silent/auto-print already sent the receipt — only show New bill.
          onPrintReceipt: (ui.enablePrint && !autoPrint)
              ? () => _printLastReceipt()
              : null,
        );
      }

      await _resetCheckoutForNewSale();
      reloadProductGrid(ref);
      // Refresh dashboard / staff / inventory without waiting for server sync.
      ref.read(syncRevisionProvider.notifier).state++;

      if (isDraft) {
        _showSnack('Sale held as draft', success: true);
      }

      _syncSalesInBackground(isDraft: isDraft);
    } catch (e) {
      _showSnack('Checkout failed: $e', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Push sales to server without blocking checkout (no success toasts).
  void _syncSalesInBackground({bool isDraft = false}) {
    if (isDraft) return;

    unawaited(Future<void>(() async {
      try {
        final syncResult = await ref.read(syncServiceProvider).syncPending(
              retryFailed: true,
              background: true,
            );
        ref.invalidate(pendingSyncCountProvider);
        ref.read(syncRevisionProvider.notifier).update((n) => n + 1);
        if (!mounted) return;

        if (syncResult.failed > 0) {
          _showSnack(
            syncResult.errorMessage ??
                'Sale saved locally — sync failed. Retry from Settings or next bill.',
            error: true,
          );
        }
      } catch (e) {
        if (mounted) {
          _showSnack('Sync failed: $e', error: true);
        }
      }
    }));
  }

  List<PosPaymentMethod> _paymentMethodsForMix() {
    final settings = ref.read(posSettingsProvider).value;
    final uiSettings = ref.read(posUiSettingsProvider);
    final options = applyLocalPaymentOptionOverrides(
      serverOptions:
          settings?.paymentOptions ?? const ['cash', 'card', 'cheque', 'deposit'],
      enablePointsPayment: uiSettings.enablePointsPayment,
    );
    final groups = resolvePaymentButtonGroups(options);
    final methods = <PosPaymentMethod>[];
    final seen = <String>{};
    for (final method in [...groups.primary, ...groups.more]) {
      if (seen.add(method.key)) methods.add(method);
    }
    return methods;
  }

  Future<void> _showMixPaymentModal() async {
    if (!await _ensureCheckoutParties()) return;

    final totals = _totals;
    final settings = ref.read(posSettingsProvider).value;
    final uiSettings = ref.read(posUiSettingsProvider);

    final result = await showFinalizeSaleDialog(
      context: context,
      grandTotal: totals.grandTotal,
      paymentLabel: 'Mix',
      paidById: '1',
      initialSaleNote: _checkout.saleNote,
      initialStaffNote: _checkout.staffNote,
      printOnComplete: uiSettings.shouldAutoPrintBill,
      showWhatsappOption: uiSettings.enableWhatsapp,
      defaultSendWhatsapp: settings?.sendSms ?? false,
      isMixPayment: true,
      paymentMethods: _paymentMethodsForMix(),
    );

    if (result == null || !mounted) return;
    _setCheckout(_checkout.copyWith(
      saleNote: result.saleNote,
      staffNote: result.staffNote,
    ));
    await _completeSale(
      paidById: result.mixPayments?.first.paidById ?? '1',
      paidAmount: result.paidAmount,
      payingAmount: result.payingAmount,
      mixPayments: result.mixPayments,
      paymentReceiver: result.paymentReceiver,
      paymentNote: result.paymentNote,
      cardNumber: result.cardNumber,
      cardHolderName: result.cardHolderName,
      cardType: result.cardType,
      chequeNo: result.chequeNo,
      printInvoice: uiSettings.shouldAutoPrintBill,
    );
  }

  Future<void> _holdSale(PosTotals totals) async {
    await _completeSale(
      paidById: '1',
      paidAmount: totals.grandTotal,
      isDraft: true,
    );
    if (mounted) _showSnack('Sale held as draft');
  }

  Future<void> _showSavePaymentCarousel() async {
    final totals = _totals;

    if (_checkout.returnSessionMode == ReturnSessionMode.returnOnly &&
        _checkout.returnLines.isNotEmpty &&
        _checkout.lines.isEmpty) {
      await _completeReturnOnly(paidById: '1', paidAmount: 0);
      return;
    }

    if (!await _ensureCheckoutParties()) return;

    final settings = ref.read(posSettingsProvider).value;
    final uiSettings = ref.read(posUiSettingsProvider);
    final meta = await ref.read(posLocalMetaProvider.future);
    if (!mounted) return;
    final options = applyLocalPaymentOptionOverrides(
      serverOptions:
          settings?.paymentOptions ?? const ['cash', 'card', 'cheque', 'deposit'],
      enablePointsPayment: uiSettings.enablePointsPayment,
    );
    final methods = resolveSavePaymentMethods(options);
    final coupons = meta.coupons
        .map(
          (c) => LocalCouponRow(
            id: c.id,
            code: c.code,
            type: c.type,
            amount: c.amount,
            minimumAmount: c.minimumAmount,
            quantity: c.quantity,
            used: c.used,
            expiredDate: c.expiredDate,
          ),
        )
        .toList();

    final session = ref.read(sessionServiceProvider);
    final stationLabel =
        session.terminalCode?.trim().toUpperCase() ?? 'STATION 01';
    final terminalLabel =
        session.terminalName?.trim().isNotEmpty == true
            ? session.terminalName!.trim()
            : 'Terminal 01';
    final orderRef = generateSaleReference(uiSettings);

    final result = await showPaymentCarouselDialog(
      context: context,
      methods: methods,
      subtotal: totals.subtotal,
      lineTax: totals.lineTax,
      orderTaxRate: _checkout.orderTaxRate,
      shippingCost: totals.shippingCost,
      initialDiscountType: _checkout.orderDiscountType,
      initialDiscountValue: _checkout.orderDiscountValue,
      initialCouponCode: _checkout.couponCode ?? '',
      initialCouponId: _checkout.couponId,
      initialCouponDiscount: totals.couponDiscount,
      coupons: coupons,
      initialSaleNote: _checkout.saleNote,
      initialStaffNote: _checkout.staffNote,
      printOnComplete: uiSettings.shouldAutoPrintBill,
      showWhatsappOption: uiSettings.enableWhatsapp,
      defaultSendWhatsapp: settings?.sendSms ?? false,
      mixMethods: _paymentMethodsForMix(),
      returnCredit: uiSettings.enableReturn ? totals.returnCredit : 0,
      allowZeroBalanceComplete: totals.balanceDue <= 0.009 &&
          _checkout.returnLines.isNotEmpty,
      orderLines: [
        for (final line in _checkout.lines)
          PaymentOrderLine(
            name: line.name,
            amount: line.netUnitPrice * line.qty + line.lineTax,
          ),
      ],
      discountTotal: totals.orderDiscount +
          totals.couponDiscount +
          totals.lineDiscount,
      orderTax: totals.orderTax,
      stationLabel: stationLabel,
      terminalLabel: terminalLabel,
      orderReference:
          'Order #${formatSaleReferenceDisplay(orderRef.reference)}',
    );

    if (result == null || !mounted) return;

    if (result.isHoldOrder) {
      _setCheckout(_checkout.copyWith(
        orderDiscountType: result.orderDiscountType,
        orderDiscountValue: result.orderDiscountValue,
        couponCode: result.couponCode,
        couponId: result.couponId,
        couponDiscount: result.couponDiscount,
      ));
      await _completeSale(
        paidById: result.paidById,
        paidAmount: totals.grandTotal,
        isDraft: true,
      );
      return;
    }

    _setCheckout(_checkout.copyWith(
      orderDiscountType: result.orderDiscountType,
      orderDiscountValue: result.orderDiscountValue,
      couponCode: result.couponCode,
      couponId: result.couponId,
      couponDiscount: result.couponDiscount,
      saleNote: result.finalize.saleNote,
      staffNote: result.finalize.staffNote,
    ));
    await _completeSale(
      paidById: result.paidById,
      paidAmount: result.finalize.paidAmount,
      payingAmount: result.finalize.payingAmount,
      mixPayments: result.mixPayments,
      paymentReceiver: result.finalize.paymentReceiver,
      paymentNote: result.finalize.paymentNote,
      cardNumber: result.finalize.cardNumber,
      cardHolderName: result.finalize.cardHolderName,
      cardType: result.finalize.cardType,
      chequeNo: result.finalize.chequeNo,
      printInvoice: uiSettings.shouldAutoPrintBill
          ? result.finalize.printInvoice
          : false,
    );
  }

  Future<void> _showPaymentModal(String paidById, String label) async {
    if (!await _ensureCheckoutParties()) return;

    final totals = _totals;
    final settings = ref.read(posSettingsProvider).value;
    final uiSettings = ref.read(posUiSettingsProvider);

    final result = await showFinalizeSaleDialog(
      context: context,
      grandTotal: totals.grandTotal,
      paymentLabel: label,
      paidById: paidById,
      initialSaleNote: _checkout.saleNote,
      initialStaffNote: _checkout.staffNote,
      printOnComplete: uiSettings.shouldAutoPrintBill,
      showWhatsappOption: uiSettings.enableWhatsapp,
      defaultSendWhatsapp: settings?.sendSms ?? false,
    );

    if (result == null || !mounted) return;
    _setCheckout(_checkout.copyWith(
      saleNote: result.saleNote,
      staffNote: result.staffNote,
    ));
    await _completeSale(
      paidById: paidById,
      paidAmount: result.paidAmount,
      payingAmount: result.payingAmount,
      paymentReceiver: result.paymentReceiver,
      paymentNote: result.paymentNote,
      cardNumber: result.cardNumber,
      cardHolderName: result.cardHolderName,
      cardType: result.cardType,
      chequeNo: result.chequeNo,
      printInvoice: uiSettings.shouldAutoPrintBill,
    );
  }

  Future<void> _showIssueReturnBillFlow() async {
    final ui = ref.read(posUiSettingsProvider);
    if (!ui.enableReturn || !ui.enableIssueReturnBill) return;

    final session = ref.read(sessionServiceProvider);
    final warehouseId = session.warehouseId;
    final customerId = _checkout.customerId;
    if (warehouseId == null || customerId == null) {
      _showSnack('Customer and warehouse required', error: true);
      return;
    }

    ref.read(posTouchKeyboardControllerProvider).detach();
    if (!mounted) return;

    final result = await showIssueReturnBillDialog(
      context: context,
      ref: ref,
      warehouseId: warehouseId,
      customerId: customerId,
      billerId: _checkout.billerId ?? session.billerId,
    );

    if (result == null || !mounted) return;
    ref.read(syncRevisionProvider.notifier).state++;
    _syncSalesInBackground();
    _showSnack(
      'Return bill ${formatSaleReferenceDisplay(result.referenceNo)} issued',
      success: true,
    );
  }

  Future<void> _showReturnFlow() async {
    if (!ref.read(posUiSettingsProvider).enableReturn) return;
    if (_returnFlowActive) return;
    _returnFlowActive = true;

    try {
      final session = ref.read(sessionServiceProvider);
      final warehouseId = session.warehouseId;
      final customerId = _checkout.customerId;
      if (warehouseId == null || customerId == null) {
        _showSnack('Customer and warehouse required', error: true);
        return;
      }

      ref.read(posTouchKeyboardControllerProvider).detach();
      if (!mounted) return;

      _startReturnSession(
        const ReturnCheckoutSessionStart(
          mode: ReturnSessionMode.returnAndSale,
        ),
      );
      _showSnack(
        'Return session started — scan items to return',
        success: true,
      );
    } finally {
      _returnFlowActive = false;
    }
  }

  Future<void> _printReturnReceipt(SavedReturnResult result) async {
    try {
      final session = ref.read(sessionServiceProvider);
      final meta = ref.read(posLocalMetaProvider).value;
      String? customerName;
      String? warehouseName;
      final customerId = _checkout.customerId;
      final warehouseId = session.warehouseId ?? _checkout.warehouseId;
      if (meta != null && customerId != null) {
        for (final c in meta.customers) {
          if (c.id == customerId) {
            customerName = c.name;
            break;
          }
        }
      }
      if (meta != null && warehouseId != null) {
        for (final w in meta.warehouses) {
          if (w.id == warehouseId) {
            warehouseName = w.name;
            break;
          }
        }
      }

      final printSettings = ref.read(localPrintSettingsProvider);
      await ReturnReceiptPrintService.printReturnReceipt(
        result,
        printSettings: printSettings,
        customerName: customerName,
        cashierName: session.userName,
        warehouseName: warehouseName,
      );
    } catch (e) {
      if (mounted) {
        _showSnack('Return saved but print failed: $e', error: true);
      }
    }
  }

  Future<void> _showReturnSale() async {
    await _showReturnFlow();
  }

  Future<void> _showReturnCreditPicker() async {
    final session = ref.read(sessionServiceProvider);
    final warehouseId = session.warehouseId;
    final customerId = _checkout.customerId;
    if (warehouseId == null || customerId == null || _checkout.isEmpty) {
      _showSnack('Add products and select customer first', error: true);
      return;
    }

    if (!mounted) return;
    ref.read(posTouchKeyboardControllerProvider).detach();
    final beforeCredit = _checkout.returnCreditApplied;
    final maxApply = _calcTotals(_checkout.copyWith(returnSettlements: []))
            .grandTotal -
        beforeCredit;

    final applied = await showReturnCreditDialog(
      context: context,
      maxApply: maxApply > 0 ? maxApply : 0,
      initial: _checkout.returnSettlements,
      onLookupReference: (refNo) => ref
          .read(localReturnRepositoryProvider)
          .lookupCreditByReference(
            referenceNo: refNo,
            warehouseId: warehouseId,
            customerId: customerId,
          ),
    );
    if (applied == null || !mounted) return;
    _setCheckout(_checkout.copyWith(returnSettlements: applied));
  }

  Future<void> _showDiscountModal() async {
    final totals = _totals;
    final meta = await ref.read(posLocalMetaProvider.future);
    if (!mounted) return;
    final coupons = meta.coupons
        .map(
          (c) => LocalCouponRow(
            id: c.id,
            code: c.code,
            type: c.type,
            amount: c.amount,
            minimumAmount: c.minimumAmount,
            quantity: c.quantity,
            used: c.used,
            expiredDate: c.expiredDate,
          ),
        )
        .toList();

    final result = await showDiscountEntryDialog(
      context: context,
      subtotal: totals.subtotal,
      displaySubtotal: totals.subtotal + totals.lineTax,
      grandTotalBeforeCoupon: totals.grandTotal + totals.couponDiscount,
      initialDiscountType: _checkout.orderDiscountType,
      initialDiscountValue: _checkout.orderDiscountValue,
      coupons: coupons,
      initialCouponCode: _checkout.couponCode ?? '',
    );
    if (result == null || !mounted) return;

    _applyDiscountEntryResult(result);
  }

  Future<void> _showCouponModal() async {
    final totals = _totals;
    final meta = await ref.read(posLocalMetaProvider.future);
    if (!mounted) return;
    final coupons = meta.coupons
        .map(
          (c) => LocalCouponRow(
            id: c.id,
            code: c.code,
            type: c.type,
            amount: c.amount,
            minimumAmount: c.minimumAmount,
            quantity: c.quantity,
            used: c.used,
            expiredDate: c.expiredDate,
          ),
        )
        .toList();

    final result = await showCouponEntryDialog(
      context: context,
      grandTotalBeforeCoupon: totals.grandTotal + totals.couponDiscount,
      coupons: coupons,
      initialCouponCode: _checkout.couponCode ?? '',
    );
    if (result == null || !mounted) return;

    if (result.cleared) {
      _setCheckout(_checkout.copyWith(clearCoupon: true));
      return;
    }

    _setCheckout(_checkout.copyWith(
      couponCode: result.couponCode,
      couponId: result.couponId,
      couponDiscount: result.couponDiscount,
    ));
  }

  Future<void> _showShippingModal() async {
    if (!ref.read(posUiSettingsProvider).enableShipping) return;
    var amount = _checkout.shippingCost;
    final amountCtrl = TextEditingController(text: amount.toString());
    await showPosDialog<void>(
      context: context,
      builder: (ctx) => PosTouchKeyboardHost(
        expand: false,
        child: PosProfessionalDialogShell(
          title: 'Shipping cost',
          subtitle: 'Add delivery charge to this sale',
          icon: Icons.local_shipping_outlined,
          maxWidth: 420,
          maxBodyHeight: 120,
          footer: PosProfessionalDialogFooter(
            secondaryLabel: 'Cancel',
            primaryLabel: 'Apply',
            onSecondary: () => Navigator.pop(ctx),
            onPrimary: () {
              _setCheckout(_checkout.copyWith(shippingCost: amount));
              Navigator.pop(ctx);
            },
          ),
          body: PosTouchTextField(
            controller: amountCtrl,
            kind: PosTouchInputKind.number,
            decoration: InputDecoration(
              labelText: 'Amount',
              border: OutlineInputBorder(),
            ),
            onChanged: (v) => amount = double.tryParse(v) ?? 0,
          ),
        ),
      ),
    );
    amountCtrl.dispose();
  }

  Future<void> _showFilterPicker(
      ProductGridFilter type, PosLocalMeta meta) async {
    final picked = await showPosDialog<int>(
      context: context,
      builder: (ctx) {
        final items = type == ProductGridFilter.brand
            ? meta.brands
            : meta.categories;
        return PosProfessionalDialogShell(
          title: 'Choose ${type.name}',
          subtitle: 'Filter products in the catalog',
          icon: type == ProductGridFilter.brand
              ? Icons.branding_watermark_outlined
              : Icons.category_outlined,
          maxWidth: 460,
          maxBodyHeight: 360,
          footer: PosProfessionalDialogFooter(
            secondaryLabel: 'Cancel',
            onSecondary: () => Navigator.pop(ctx),
          ),
          body: ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final name = type == ProductGridFilter.brand
                  ? meta.brands[i].name
                  : meta.categories[i].name;
              final id = type == ProductGridFilter.brand
                  ? meta.brands[i].id
                  : meta.categories[i].id;
              return PosProfessionalPickerTile(
                title: name,
                selected: false,
                onTap: () => Navigator.pop(ctx, id),
              );
            },
          ),
        );
      },
    );
    if (picked != null) {
      _scanCtrl.clear();
      ref.read(productFilterProvider.notifier).state = ProductFilterState(
        filter: type,
        filterId: picked,
        searchQuery: '',
      );
    }
  }

  Future<void> _printLastReceipt() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final session = ref.read(sessionServiceProvider);
      final cashierName = session.userName?.trim() ?? '';
      final receipt =
          await ref.read(localSaleRepositoryProvider).getLastReceipt(
                cashierName: cashierName,
              );
      if (!mounted) return;
      if (receipt == null || receipt.lines.isEmpty) {
        _showSnack('No completed sale to print', error: true);
        return;
      }
      final printSettings = ref.read(localPrintSettingsProvider);
      await ReceiptPrintService.printReceipt(
        receipt,
        printSettings: printSettings,
        cashierName: cashierName,
      );
    } catch (e) {
      if (mounted) _showSnack('Print failed: $e', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _showRecent() async {
    final db = ref.read(appDatabaseProvider);
    final sales = await (db.select(db.localSales)
          ..orderBy([(s) => OrderingTerm.desc(s.createdAt)])
          ..limit(30))
        .get();
    final drafts = sales.where((s) => s.saleStatus == 3).toList();
    final completed = sales.where((s) => s.saleStatus != 3).toList();

    if (!mounted) return;
    await showPosDialog<void>(
      context: context,
      builder: (ctx) => PosProfessionalDialogShell(
        title: 'Recent transactions',
        subtitle: 'Tap a draft to load · tap a sale to view items',
        icon: Icons.receipt_long_outlined,
        maxWidth: 560,
        maxBodyHeight: 420,
        footer: PosProfessionalDialogFooter(
          primaryLabel: 'Close',
          onPrimary: () => Navigator.pop(ctx),
        ),
        body: DefaultTabController(
          length: 2,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TabBar(
                labelColor: context.posBrand.primary,
                unselectedLabelColor: Theme.of(context).colorScheme.onSurfaceVariant,
                indicatorColor: context.posBrand.primary,
                tabs: const [
                  Tab(text: 'Drafts / Hold'),
                  Tab(text: 'Sales'),
                ],
              ),
              SizedBox(height: 8),
              Expanded(
                child: TabBarView(
                  children: [
                    _recentList(
                      drafts,
                      empty: 'No held bills',
                      onDraftTap: (sale) {
                        Navigator.pop(ctx);
                        unawaited(_resumeHeldSale(sale));
                      },
                    ),
                    _recentList(
                      completed,
                      empty: 'No sales yet',
                      db: db,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Restore a held (draft) bill into the cart. Cart must be empty.
  Future<void> _resumeHeldSale(LocalSale sale) async {
    final cartBusy = _checkout.lines.isNotEmpty ||
        _checkout.returnLines.isNotEmpty ||
        _checkout.hasReturnSession;
    if (cartBusy) {
      await showPosInfoDialog(
        context: context,
        title: 'Cart is not empty',
        message:
            'Cannot load hold bill until the cart is empty. Clear or complete the current sale first.',
        icon: Icons.shopping_cart_outlined,
      );
      return;
    }

    setState(() => _busy = true);
    try {
      final held = await ref
          .read(localSaleRepositoryProvider)
          .loadHeldSale(sale.clientUuid);
      if (held == null || held.lines.isEmpty) {
        if (mounted) {
          _showSnack('Could not load hold bill', error: true);
        }
        return;
      }

      await ref
          .read(localSaleRepositoryProvider)
          .deleteHeldSale(held.clientUuid);

      final session = ref.read(sessionServiceProvider);
      if (held.customerId > 0) {
        await session.setCustomerId(held.customerId);
      }
      if (held.billerId != null && held.billerId! > 0) {
        await session.setBillerId(held.billerId!);
      }

      _setCheckout(
        PosCheckoutState(
          lines: held.lines
              .map(
                (l) => CartLine(
                  productId: l.productId,
                  variantId: l.variantId,
                  productBatchId: l.productBatchId,
                  batchNo: l.batchNo,
                  code: l.code,
                  name: l.name,
                  qty: l.qty,
                  netUnitPrice: l.netUnitPrice,
                  netUnitCost: l.netUnitCost,
                  discount: l.discount,
                  taxRate: l.taxRate,
                  taxMethod: l.taxMethod,
                  saleUnit: l.saleUnit,
                  stockQty: l.stockQty,
                ),
              )
              .toList(),
          customerId: held.customerId,
          billerId: held.billerId,
          warehouseId: held.warehouseId,
          orderTaxRate: held.orderTaxRate,
          orderDiscountValue: held.orderDiscount,
          shippingCost: held.shippingCost,
          couponDiscount: held.couponDiscount,
          saleNote: held.saleNote,
          staffNote: held.staffNote,
          draftClientUuid: held.clientUuid,
          saleDate: DateTime.now(),
        ),
      );

      if (mounted) {
        setState(() {});
        final label = formatSaleReferenceDisplay(
          held.referenceNo ?? held.clientUuid,
        );
        _showSnack('Hold bill $label loaded to cart', success: true);
      }
    } catch (e) {
      if (mounted) _showSnack('Failed to load hold bill: $e', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _clearCart() async {
    if (!_checkout.canCheckout) return;
    final ok = await showPosConfirmDialog(
      context: context,
      title: 'Clear cart?',
      message: 'Remove all items and cancel this checkout?',
      icon: Icons.remove_shopping_cart_outlined,
      confirmLabel: 'Clear',
      destructive: true,
    );
    if (ok == true) await _resetCheckoutForNewSale();
  }

  Widget _recentList(
    List<LocalSale> items, {
    required String empty,
    void Function(LocalSale sale)? onDraftTap,
    AppDatabase? db,
  }) {
    if (items.isEmpty) return Center(child: Text(empty));
    return ListView.builder(
      itemCount: items.length,
      itemBuilder: (_, i) {
        final s = items[i];
        final isDraft = s.saleStatus == 3;
        final refNo = formatSaleReferenceDisplay(
          resolveLocalSaleReference(
            clientUuid: s.clientUuid,
            referenceNo: s.referenceNo,
            serverReferenceNo: s.serverReferenceNo,
          ),
        );
        return ListTile(
          title: Text(refNo.isNotEmpty ? refNo : s.clientUuid),
          subtitle: Text(
            isDraft
                ? 'Hold bill · tap to load'
                : '${s.itemCount} item${s.itemCount == 1 ? '' : 's'} · tap for details',
          ),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(formatPosMoney(s.grandTotal)),
              if (!isDraft && db != null) ...[
                SizedBox(width: 4),
                Icon(
                  Icons.chevron_right,
                  size: 20,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ],
            ],
          ),
          onTap: isDraft && onDraftTap != null
              ? () => onDraftTap(s)
              : (!isDraft && db != null
                  ? () => showSaleBillDetailDialog(
                        context: context,
                        db: db,
                        localSaleId: s.id,
                      )
                  : null),
        );
      },
    );
  }

  void _showSnack(String text, {bool error = false, bool success = false}) {
    PosToast.show(
      context,
      text,
      type: error
          ? PosToastType.error
          : success
              ? PosToastType.success
              : PosToastType.info,
    );
  }

  Future<void> _syncPendingSales({bool manual = false}) async {
    if (_syncing) return;
    setState(() => _syncing = true);
    try {
      final result = await ref.read(syncServiceProvider).syncPending(
            retryFailed: manual,
          );
      ref.invalidate(pendingSyncCountProvider);
      ref.read(syncRevisionProvider.notifier).update((n) => n + 1);
      if (!mounted) return;

      if (!result.wasOnline) {
        if (manual) {
          _showSnack(
            result.errorMessage ?? 'No connection to server',
            error: true,
          );
        }
        return;
      }

      if (result.errorMessage != null &&
          result.synced == 0 &&
          result.attempted == 0) {
        if (manual) _showSnack(result.errorMessage!, error: true);
        return;
      }

      final pending = await ref.read(pendingSyncCountProvider.future);
      if (pending > 0) {
        if (manual) {
          final localError = await ref
              .read(localSaleRepositoryProvider)
              .latestFailedSyncError();
          final detail = result.errorMessage ??
              localError ??
              (result.failedMessages.isNotEmpty
                  ? result.failedMessages.first
                  : null);
          _showSnack(
            detail != null
                ? 'Sync failed: $detail ($pending remaining)'
                : '$pending sale(s) still not synced',
            error: true,
          );
        }
      } else if (manual) {
        if (result.synced > 0) {
          _showSnack('Synced ${result.synced} sale(s) to server');
        } else if (result.queued > 0) {
          _showSnack(
            'Sent ${result.queued} sale(s) to server queue — processing…',
          );
        } else if (result.attempted == 0) {
          _showSnack('No sales waiting to sync');
        } else {
          _showSnack('All sales synced');
        }
      }
    } catch (e) {
      if (manual && mounted) {
        _showSnack('Sync error: $e', error: true);
      }
    } finally {
      if (mounted) setState(() => _syncing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<PosCatalogEntryMode>(
      posCatalogEntryModeProvider,
      _onEntryModeChanged,
    );

    final checkout = ref.watch(posCheckoutProvider);
    final totals = _calcTotals(checkout);
    final metaAsync = ref.watch(posLocalMetaProvider);

    final registerBody = Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(flex: 7, child: _buildCatalog()),
        VerticalDivider(
          width: 1,
          thickness: 1,
          color: Theme.of(context).dividerColor,
        ),
        Expanded(
          flex: 4,
          child: metaAsync.when(
            data: (meta) => _buildCheckout(checkout, totals),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('$e')),
          ),
        ),
      ],
    );

    final host = PosTouchKeyboardHost(
      child: CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.keyS, shift: true): () {
            _setEntryMode(PosCatalogEntryMode.search);
            _focusEntryField();
          },
        const SingleActivator(LogicalKeyboardKey.keyC, shift: true): () {
            unawaited(_pickCustomer());
          },
        const SingleActivator(LogicalKeyboardKey.keyD, shift: true): () =>
            _completeSale(
                paidById: '1', paidAmount: totals.grandTotal, isDraft: true),
        const SingleActivator(LogicalKeyboardKey.keyF, shift: true): () =>
            _showPaymentModal('1', 'Cash'),
        const SingleActivator(LogicalKeyboardKey.keyE, shift: true):
            _showDiscountModal,
        const SingleActivator(LogicalKeyboardKey.keyK, shift: true):
            _showCouponModal,
        const SingleActivator(LogicalKeyboardKey.keyQ, shift: true): () {
            if (ref.read(posUiSettingsProvider).enableShipping) {
              _showShippingModal();
            }
          },
      },
      child: Focus(
        autofocus: true,
        child: widget.embedded
            ? registerBody
            : Scaffold(
                backgroundColor: Theme.of(context).scaffoldBackgroundColor,
                resizeToAvoidBottomInset: false,
                body: registerBody,
              ),
      ),
      ),
    );

    return host;
  }

  Future<void> _pickCustomer() async {
    final meta = await ref.read(posLocalMetaProvider.future);
    if (!mounted) return;
    final checkout = ref.read(posCheckoutProvider);
    final picked = await showCustomerSearchDialog(
      context: context,
      customers: meta.customers,
      selectedId: checkout.customerId,
    );
    if (!mounted || picked == null) return;
    _setCheckout(checkout.copyWith(customerId: picked));
  }

  Widget _buildHeaderSearchField() {
    final entryMode = ref.watch(posCatalogEntryModeProvider);
    return PosCatalogEntryBar(
      mode: entryMode,
      showModeSwitch: false,
      controller: _scanCtrl,
      focusNode: _searchFocus,
      searchResults: _searchResults,
      showResults: _searchOpen,
      onModeChanged: _setEntryMode,
      onChanged: _onEntryChanged,
      onSubmitted: _onEntrySubmitted,
      onPickResult: _pickSearchResult,
      onClear: () {
        _clearEntryField();
      },
    );
  }

  Widget _buildCatalog() {
    final grid = ref.watch(productGridProvider);
    ref.listen<bool>(
      productGridProvider.select((state) => state.isLoading),
      (previous, next) {
        if (next && previous != true && _catalogScrollCtrl.hasClients) {
          _catalogScrollCtrl.jumpTo(0);
        }
      },
    );
    final filter = ref.watch(productFilterProvider);
    final metaAsync = ref.watch(posLocalMetaProvider);
    final uiSettings = ref.watch(posUiSettingsProvider);
    final serverColumns = ref.watch(posSettingsProvider).value?.productNumber;
    final gridColumns = PosUiSettings.resolveGridColumnCount(
      localOverride: uiSettings.gridColumnCount,
      serverProductNumber: serverColumns,
    );
    final products = grid.products;

    return ColoredBox(
      color: context.posStyles.catalogBg,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
            child: _buildHeaderSearchField(),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
            child: metaAsync.when(
              data: (meta) => _buildCategoryTabs(filter, meta),
              loading: () => _buildCategoryTabs(filter, null),
              error: (_, __) => _buildCategoryTabs(filter, null),
            ),
          ),
          if (grid.isLoading && products.isNotEmpty)
            LinearProgressIndicator(minHeight: 2),
          Expanded(
            child: grid.isLoading && products.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : grid.error != null && products.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.error_outline,
                                size: 40,
                                color: Theme.of(context).colorScheme.error,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'Failed to load products',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '${grid.error}',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurfaceVariant,
                                ),
                              ),
                              const SizedBox(height: 16),
                              OutlinedButton.icon(
                                onPressed: () => ref
                                    .read(productGridProvider.notifier)
                                    .reload(),
                                icon: const Icon(Icons.refresh),
                                label: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : products.isEmpty
                        ? Center(
                            child: Text(
                              'No products — try Featured, Category, or Brand, or sync data',
                              style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                            ),
                          )
                        : CustomScrollView(
                            controller: _catalogScrollCtrl,
                            cacheExtent: 600,
                            slivers: [
                              SliverPadding(
                                padding:
                                    const EdgeInsets.fromLTRB(12, 0, 12, 12),
                                sliver: SliverGrid(
                                  gridDelegate:
                                      SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: gridColumns,
                                    mainAxisSpacing: 10,
                                    crossAxisSpacing: 10,
                                    childAspectRatio: 0.78,
                                  ),
                                  delegate: SliverChildBuilderDelegate(
                                    (context, i) => PosProductCard(
                                      product: products[i],
                                      onTap: () => unawaited(_tryAddToCart(products[i])),
                                    ),
                                    childCount: products.length,
                                    addAutomaticKeepAlives: false,
                                    addRepaintBoundaries: true,
                                  ),
                                ),
                              ),
                              if (grid.hasMore || grid.isLoadingMore)
                                SliverToBoxAdapter(
                                  child: Padding(
                                    padding: const EdgeInsets.fromLTRB(
                                        12, 0, 12, 16),
                                    child: Center(
                                      child: grid.isLoadingMore
                                          ? const Padding(
                                              padding: EdgeInsets.all(12),
                                              child:
                                                  CircularProgressIndicator(),
                                            )
                                          : OutlinedButton.icon(
                                              onPressed: () => ref
                                                  .read(productGridProvider
                                                      .notifier)
                                                  .loadMore(),
                                              icon: const Icon(
                                                  Icons.expand_more),
                                              label: Text(
                                                'Load more (${products.length} of ${grid.totalCount})',
                                              ),
                                            ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryTabs(ProductFilterState filter, PosLocalMeta? meta) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          PosQuickFilterChip(
            label: 'Featured',
            colors: const [Color(0xFFFF7043), Color(0xFFC62828)],
            active: !filter.isSearching &&
                filter.filter == ProductGridFilter.featured,
            onTap: () {
              _scanCtrl.clear();
              ref.read(productFilterProvider.notifier).state =
                  const ProductFilterState(filter: ProductGridFilter.featured);
            },
          ),
          PosQuickFilterChip(
            label: 'Category',
            colors: const [Color(0xFF9B7FD4), Color(0xFF5B45A0)],
            active: !filter.isSearching &&
                filter.filter == ProductGridFilter.category,
            onTap: meta == null
                ? () {}
                : () {
                    _scanCtrl.clear();
                    unawaited(
                      _showFilterPicker(ProductGridFilter.category, meta),
                    );
                  },
          ),
          PosQuickFilterChip(
            label: 'Brand',
            colors: const [Color(0xFF4DD0E1), Color(0xFF00838F)],
            active: !filter.isSearching &&
                filter.filter == ProductGridFilter.brand,
            onTap: meta == null
                ? () {}
                : () {
                    _scanCtrl.clear();
                    unawaited(
                      _showFilterPicker(ProductGridFilter.brand, meta),
                    );
                  },
          ),
        ],
      ),
    );
  }

  Widget _buildCheckout(
    PosCheckoutState checkout,
    PosTotals totals,
  ) {
    final styles = context.posStyles;
    final ui = ref.watch(posUiSettingsProvider);
    final taxRate = ui.enableTax ? checkout.orderTaxRate : 0.0;
    final orderRef = generateSaleReference(ui);
    final orderTime = checkout.saleDate ?? DateTime.now();
    final subtotalWithLineTax = totals.subtotal + totals.lineTax;
    final hasOrderDiscount = totals.orderDiscount > 0;
    final hasPromoDiscount = totals.couponDiscount > 0;
    final hasReturnCredit = totals.returnCredit > 0;
    final hasReturnSession = checkout.hasReturnSession;

    return ColoredBox(
      color: context.posSurface.orderPanelBg,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (hasReturnSession)
            ReturnSessionPanel(
              returnLines: checkout.returnLines,
              totals: totals,
              scanController: _returnScanCtrl,
              onScanSubmit: (v) => unawaited(_handleReturnScanSubmit(v)),
              onRemoveLine: (key) {
                _setCheckout(checkout.removeReturnLine(key));
                setState(() {});
              },
              onUpdateQty: (key, qty) {
                _setCheckout(checkout.updateReturnQty(key, qty));
                setState(() {});
              },
              onCancelSession: _clearReturnSession,
              onReturnCreditTap: () => unawaited(_editReturnCredit()),
              busy: _busy,
              title: 'Return items',
              showScanField: checkout.returnLines.isEmpty ||
                  checkout.originalSaleLookup == null,
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 16, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Text(
                      'Current Order',
                      style: styles.titleLarge,
                    ),
                    const Spacer(),
                    TextButton.icon(
                      onPressed:
                          !checkout.canCheckout || _busy ? null : _clearCart,
                      icon: const Icon(Icons.delete_outline, size: 20),
                      label: const Text('Clear'),
                      style: TextButton.styleFrom(
                        foregroundColor: PosColors.red,
                        minimumSize: const Size(0, 44),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                        textStyle: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
                if (!checkout.isEmpty) ...[
                  SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: context.posBrand.primary,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Order #${formatSaleReferenceDisplay(orderRef.reference)}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: styles.onBrand,
                            ),
                          ),
                        ),
                        SizedBox(width: 8),
                        Text(
                          DateFormat('MMM d, h:mm a').format(orderTime),
                          maxLines: 1,
                          softWrap: false,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: styles.onBrandMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (ui.enableReturn &&
                      ui.enableReturnBillSettle &&
                      checkout.returnSettlements.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        for (final settlement in checkout.returnSettlements)
                          InputChip(
                            label: Text(
                              '${formatSaleReferenceDisplay(settlement.returnReferenceNo)} '
                              '−${formatPosMoney(settlement.amount)}',
                              style: const TextStyle(fontSize: 12),
                            ),
                            deleteIcon: const Icon(Icons.close, size: 16),
                            onDeleted: _busy
                                ? null
                                : () {
                                    _setCheckout(
                                      checkout.copyWith(
                                        returnSettlements: checkout
                                            .returnSettlements
                                            .where(
                                              (s) =>
                                                  s.returnClientUuid !=
                                                  settlement.returnClientUuid,
                                            )
                                            .toList(),
                                      ),
                                    );
                                    setState(() {});
                                  },
                          ),
                      ],
                    ),
                  ],
                ],
              ],
            ),
          ),
          Expanded(
            child: checkout.isEmpty
                ? const PosOrderEmptyState()
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: checkout.lines.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) =>
                        _buildCartRow(checkout, checkout.lines[i]),
                  ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
            ),
            child: Column(
              children: [
                PosGrandTotalBanner(
                  subtotal: subtotalWithLineTax,
                  taxLabel: taxRate > 0
                      ? 'Tax (${taxRate.toStringAsFixed(1)}%)'
                      : null,
                  taxAmount: taxRate > 0 ? totals.totalTax : null,
                  total: totals.grandTotal,
                ),
                if (hasOrderDiscount) ...[
                  SizedBox(height: 8),
                  _orderSummaryRow(
                    'Discount',
                    -totals.orderDiscount,
                    valueColor: PosColors.red,
                  ),
                ],
                if (hasPromoDiscount) ...[
                  SizedBox(height: 8),
                  _orderSummaryRow(
                    checkout.couponCode != null &&
                            checkout.couponCode!.isNotEmpty
                        ? 'Coupon (${checkout.couponCode})'
                        : 'Coupon',
                    -totals.couponDiscount,
                    valueColor: PosColors.red,
                  ),
                ],
                if (hasReturnCredit) ...[
                  SizedBox(height: 8),
                  _orderSummaryRow(
                    'Return credit',
                    -totals.returnCredit,
                    valueColor: styles.accent,
                  ),
                ],
                SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: PosPayButton(
                        label: 'HOLD',
                        icon: Icons.pause_circle_outline,
                        backgroundColor: PosColors.amber,
                        foregroundColor: const Color(0xFF1A1A1A),
                        disabled: _checkout.isEmpty || _busy,
                        onPressed: () => unawaited(_holdSale(totals)),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: PosPayButton(
                        label: 'CHECKOUT',
                        icon: Icons.point_of_sale_rounded,
                        disabled: !_checkout.canCheckout || _busy,
                        onPressed: _showSavePaymentCarousel,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _orderSummaryRow(
    String label,
    double amount, {
    Color? valueColor,
  }) {
    final styles = context.posStyles;
    return Row(
      children: [
        Text(label, style: styles.bodyMuted),
        const Spacer(),
        Flexible(
          child: Text(
            formatPosMoney(amount),
            maxLines: 1,
            softWrap: false,
            overflow: TextOverflow.fade,
            textAlign: TextAlign.right,
            style: styles.moneyMedium.copyWith(
              color: valueColor ?? styles.text,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCartRow(PosCheckoutState checkout, CartLine line) {
    return PosCartLineCard(
      name: line.name,
      unitPrice: rowUnitPriceForLine(line),
      unitDiscount: unitDiscountForLine(line),
      qty: line.qty,
      lineTotal: line.subtotal,
      enabled: !_busy,
      onEdit: () => unawaited(_editCartLine(checkout, line)),
      onDecrement: () =>
          unawaited(_changeLineQty(checkout, line, line.qty - 1)),
      onIncrement: () =>
          unawaited(_changeLineQty(checkout, line, line.qty + 1)),
    );
  }
}
