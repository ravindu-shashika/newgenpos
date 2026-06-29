import 'dart:async';

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
import 'models/return_models.dart';
import 'models/scanned_product.dart';
import 'pos_checkout_state.dart';
import 'pos_helpers.dart';
import 'sale_reference.dart';
import 'pos_totals.dart';
import 'pos_currency.dart';
import 'pos_entry_mode.dart';
import 'product_filter.dart';
import '../../core/theme/pos_theme.dart';
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
import 'widgets/discount_entry_dialog.dart';
import 'widgets/payment_carousel_dialog.dart';
import 'widgets/transaction_success_dialog.dart';
import 'services/return_receipt_print_service.dart';
import 'widgets/return_credit_dialog.dart';
import 'widgets/return_sale_dialog.dart';
import 'widgets/return_mode_dialog.dart';
import 'widgets/return_without_bill_dialog.dart';
import 'widgets/exchange_sale_dialog.dart';
import 'widgets/pos_professional_dialog.dart';
import 'widgets/pos_toast.dart';
import 'widgets/show_pos_dialog.dart';
import 'widgets/pos_touch_keyboard_controller.dart';
import 'widgets/pos_touch_keyboard_host.dart';
import 'widgets/pos_customer_picker.dart';
import 'widgets/pos_touch_text_field.dart';
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
  final _searchFocus = FocusNode();
  final _catalogScrollCtrl = ScrollController();
  Timer? _searchDebounce;
  Timer? _onlinePollTimer;
  List<ScannedProduct> _searchResults = [];
  bool _searchOpen = false;
  bool _busy = false;
  bool _syncing = false;
  bool _initialized = false;
  int? _openCashRegisterId;
  bool _returnFlowActive = false;
  bool _exchangeFlowActive = false;
  ProviderSubscription<int>? _returnTriggerSub;
  ProviderSubscription<int>? _exchangeTriggerSub;

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
        _exchangeTriggerSub = ref.listenManual<int>(
          posExchangeSaleTriggerProvider,
          (prev, next) {
            if (prev == null || next <= prev) return;
            unawaited(_showExchangeSale());
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
      await _applyPosSettings(settings, persistSession: false);
      await _ensureCashRegisterOpen(settings);
    } catch (_) {}
  }

  Future<void> _ensureCashRegisterOpen(PosSettings? settings) async {
    if (settings?.cashRegister != true) return;

    final session = ref.read(sessionServiceProvider);
    final userId = session.userId;
    final warehouseId = session.warehouseId ?? _checkout.warehouseId;
    if (userId == null || warehouseId == null) return;

    final service = ref.read(cashRegisterServiceProvider);
    _openCashRegisterId = await service.getCachedRegisterId();

    final online = await ref.read(syncServiceProvider).probeOnline();
    if (!online) {
      if (_openCashRegisterId == null && mounted) {
        _showSnack('Connect to internet to open cash register', error: true);
      }
      return;
    }

    try {
      final openId = await service.checkOpenRegister(
        warehouseId: warehouseId,
        userId: userId,
      );
      if (!mounted) return;
      if (openId != null) {
        setState(() => _openCashRegisterId = openId);
        return;
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
        final id = await service.getCachedRegisterId();
        setState(() => _openCashRegisterId = id);
      }
    } catch (e) {
      if (mounted) _showSnack('Cash register check failed: $e', error: true);
    }
  }

  Future<void> _showCashRegisterDetails({bool requireClose = false}) async {
    final session = ref.read(sessionServiceProvider);
    final userId = session.userId;
    final registerId = _openCashRegisterId ??
        await ref.read(cashRegisterServiceProvider).getCachedRegisterId();
    if (userId == null || registerId == null) {
      _showSnack('No open cash register', error: true);
      return;
    }

    final online = await ref.read(syncServiceProvider).probeOnline();
    if (!online) {
      _showSnack('Connect to internet for cash register', error: true);
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

    int? customerId = settings?.customerId ??
        ui.defaultCustomerId ??
        syncMeta?.defaultCustomerId ??
        session.customerId;
    int? billerId = settings?.billerId ??
        ui.defaultBillerId ??
        syncMeta?.defaultBillerId ??
        session.billerId;
    int? warehouseId = session.warehouseId ??
        settings?.warehouseId ??
        syncMeta?.warehouseId;

    customerId ??= meta.customers.isNotEmpty ? meta.customers.first.id : null;
    billerId ??= meta.billers.isNotEmpty ? meta.billers.first.id : null;
    warehouseId ??=
        meta.warehouses.isNotEmpty ? meta.warehouses.first.id : null;

    if (persistSession) {
      if (customerId != null) await session.setCustomerId(customerId);
      if (billerId != null) await session.setBillerId(billerId);
    }

    _setCheckout(checkout.copyWith(
      customerId: customerId,
      billerId: billerId,
      warehouseId: warehouseId,
      saleDate: DateTime.now(),
    ));
  }

  @override
  void dispose() {
    _returnTriggerSub?.close();
    _exchangeTriggerSub?.close();
    WidgetsBinding.instance.removeObserver(this);
    _onlinePollTimer?.cancel();
    _catalogScrollCtrl.removeListener(_onCatalogScroll);
    _catalogScrollCtrl.dispose();
    _scanCtrl.dispose();
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
      returnCredit: ui.enableReturn ? checkout.returnCreditApplied : 0,
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
      final registerId =
          _openCashRegisterId ?? await service.getCachedRegisterId();
      if (registerId != null) {
        final online = await ref.read(syncServiceProvider).probeOnline();
        if (!online) {
          _showSnack(
            'Connect to internet and close cash register before logout',
            error: true,
          );
          return;
        }
        final closed = await showCashRegisterDetailsDialog(
          context: context,
          service: service,
          registerId: registerId,
          userId: ref.read(sessionServiceProvider).userId!,
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

  bool _tryAddToCart(ScannedProduct product, {double qty = 1}) {
    final inCart = checkoutQtyForProduct(
      _checkout.lines,
      productId: product.productId,
      variantId: product.variantId,
    );
    final message = stockLimitMessage(
      productName: product.name,
      available: product.warehouseQty,
      requested: inCart + qty,
    );
    if (message != null) {
      _showSnack(message, error: true);
      return false;
    }

    _setCheckout(_checkout.addProduct(CartLine(
      productId: product.productId,
      variantId: product.variantId,
      code: product.code,
      name: product.name,
      netUnitPrice: product.price,
      taxRate: product.taxRate,
      taxMethod: product.taxMethod,
      qty: qty,
      stockQty: product.warehouseQty,
    )));
    return true;
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
        );
    if (!mounted) return;

    final otherQty = checkoutQtyForProduct(
      checkout.lines,
      productId: updated.productId,
      variantId: updated.variantId,
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
        );
    if (!mounted) return;

    final otherQty = checkoutQtyForProduct(
      checkout.lines,
      productId: line.productId,
      variantId: line.variantId,
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
    final totals = <String, ({int productId, int? variantId, String name, double qty})>{};

    for (final line in _checkout.lines) {
      final key = '${line.productId}_${line.variantId ?? 0}';
      final existing = totals[key];
      totals[key] = (
        productId: line.productId,
        variantId: line.variantId,
        name: line.name,
        qty: (existing?.qty ?? 0) + line.qty,
      );
    }

    for (final entry in totals.values) {
      final available = await repo.getWarehouseQty(
        warehouseId: warehouseId,
        productId: entry.productId,
        variantId: entry.variantId,
      );
      final message = stockLimitMessage(
        productName: entry.name,
        available: available,
        requested: entry.qty,
      );
      if (message != null) return message;
    }
    return null;
  }

  int? get _warehouseId =>
      _checkout.warehouseId ?? ref.read(sessionServiceProvider).warehouseId;

  void _focusEntryField() {
    if (!mounted) return;
    _searchFocus.requestFocus();
    if (ref.read(posCatalogEntryModeProvider) == PosCatalogEntryMode.barcode) {
      SystemChannels.textInput.invokeMethod('TextInput.hide');
    }
  }

  void _clearEntryField({bool refocus = true}) {
    _scanCtrl.clear();
    setState(() {
      _searchResults = [];
      _searchOpen = false;
    });
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
    if (term.length < 2) {
      setState(() {
        _searchResults = [];
        _searchOpen = false;
      });
      return;
    }

    _searchDebounce = Timer(const Duration(milliseconds: 220), () async {
      final warehouseId = _warehouseId;
      if (warehouseId == null || !mounted) return;

      try {
        final items =
            await ref.read(productLookupRepositoryProvider).searchLocal(
                  query: term,
                  warehouseId: warehouseId,
                  priceType: _checkout.priceType,
                );
        if (!mounted) return;
        setState(() {
          _searchResults = items;
          _searchOpen = items.isNotEmpty;
        });
      } catch (_) {
        if (!mounted) return;
        setState(() {
          _searchResults = [];
          _searchOpen = false;
        });
      }
    });
  }

  void _pickSearchResult(ScannedProduct product) {
    if (!_tryAddToCart(product)) return;
    _clearEntryField();
  }

  Future<void> _handleBarcodeSubmit([String? codeOverride]) async {
    final term = (codeOverride ?? _scanCtrl.text).trim();
    if (term.isEmpty) return;

    final warehouseId = _warehouseId;
    if (warehouseId == null) {
      _showSnack('Warehouse not configured', error: true);
      return;
    }

    try {
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
        _scanCtrl.selection = TextSelection(
          baseOffset: 0,
          extentOffset: _scanCtrl.text.length,
        );
        _focusEntryField();
        return;
      }

      if (_tryAddToCart(product)) {
        _clearEntryField();
      }
    } catch (e) {
      if (mounted) _showSnack('Scan error: $e', error: true);
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

    if (_searchResults.length == 1) {
      _pickSearchResult(_searchResults.first);
      return;
    }

    setState(() => _busy = true);
    try {
      final exact = await ref.read(productLookupRepositoryProvider).lookup(
            code: term,
            warehouseId: warehouseId,
            customerId: customerId,
            priceType: _checkout.priceType,
          );
      if (exact != null) {
        _pickSearchResult(exact);
        return;
      }

      final items = await ref.read(productLookupRepositoryProvider).searchLocal(
            query: term,
            warehouseId: warehouseId,
            priceType: _checkout.priceType,
          );

      if (!mounted) return;
      if (items.isEmpty) {
        _showSnack('No product found for "$term"', error: true);
        setState(() {
          _searchResults = [];
          _searchOpen = false;
        });
        return;
      }

      if (items.length == 1) {
        _pickSearchResult(items.first);
        return;
      }

      setState(() {
        _searchResults = items;
        _searchOpen = true;
      });
    } catch (e) {
      _showSnack('Search error: $e', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
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
    if (_checkout.isEmpty) {
      _showSnack('Add at least one product', error: true);
      return;
    }
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
      final cashRegisterId = _openCashRegisterId ??
          await ref.read(cashRegisterServiceProvider).getCachedRegisterId();
      await ref.read(localSaleRepositoryProvider).saveCheckout(
            clientUuid: clientUuid,
            referenceNo: referenceNo,
            warehouseId: warehouseId,
            customerId: customerId,
            billerId: _checkout.billerId ?? session.billerId,
            userId: session.userId,
            cashRegisterId: cashRegisterId,
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
        await showTransactionSuccessDialog(
          context: context,
          transactionNo: formatSaleReferenceDisplay(referenceNo),
          refId: clientUuid,
          changeDue: changeDue,
          onPrintReceipt: () => _printLastReceipt(),
        );
      }

      _setCheckout(_checkout.clearCart());
      reloadProductGrid(ref);

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

  Future<void> _refreshStockFromServer() async {
    final session = ref.read(sessionServiceProvider);
    final warehouseId = session.warehouseId;
    if (warehouseId == null) return;
    try {
      await ref.read(catalogDownloadServiceProvider).refreshResourceDelta(
            resource: 'product_stock',
            deviceId: session.deviceId,
            warehouseId: warehouseId,
          );
      if (mounted) reloadProductGrid(ref);
    } catch (_) {}
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
        if (!mounted) return;

        if (syncResult.failed > 0) {
          _showSnack(
            syncResult.errorMessage ??
                'Sale saved locally — sync failed. Retry from Settings or next bill.',
            error: true,
          );
        } else if (syncResult.synced > 0) {
          unawaited(_refreshStockFromServer());
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
      showPrintInvoiceOption: settings?.showPrintInvoice ?? false,
      defaultPrintInvoice: settings?.showPrintInvoice ?? false,
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
      printInvoice: result.printInvoice,
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
      showPrintInvoiceOption: settings?.showPrintInvoice ?? false,
      defaultPrintInvoice: settings?.showPrintInvoice ?? false,
      showWhatsappOption: uiSettings.enableWhatsapp,
      defaultSendWhatsapp: settings?.sendSms ?? false,
      mixMethods: _paymentMethodsForMix(),
      returnCredit: uiSettings.enableReturn ? totals.returnCredit : 0,
      onReturnCreditTap:
          uiSettings.enableReturn ? _showReturnCreditPicker : null,
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
      printInvoice: result.finalize.printInvoice,
    );
  }

  Future<void> _showPaymentModal(String paidById, String label) async {
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
      showPrintInvoiceOption: settings?.showPrintInvoice ?? false,
      defaultPrintInvoice: settings?.showPrintInvoice ?? false,
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
      printInvoice: result.printInvoice,
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
      final mode = await showReturnModeDialog(context);
      if (mode == null || !mounted) return;

      SavedReturnResult? result;
      if (mode == ReturnEntryMode.withPastBill) {
        result = await showReturnSaleDialog(
          context: context,
          returnRepo: ref.read(localReturnRepositoryProvider),
          warehouseId: warehouseId,
          customerId: customerId,
        );
      } else {
        result = await showReturnWithoutBillDialog(
          context: context,
          returnRepo: ref.read(localReturnRepositoryProvider),
          productLookup: ref.read(productLookupRepositoryProvider),
          warehouseId: warehouseId,
          customerId: customerId,
          billerId: _checkout.billerId ?? session.billerId,
        );
      }

      if (result == null || !mounted) return;

      await _printReturnReceipt(result);
      _showSnack(
        'Return ${formatSaleReferenceDisplay(result.referenceNo)} — '
        'credit ${formatPosMoney(result.creditRemaining)}',
        success: true,
      );
      ref.read(syncRevisionProvider.notifier).state++;
      _syncSalesInBackground();
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

  Future<void> _showExchangeSale() async {
    if (!ref.read(posUiSettingsProvider).enableExchange) return;
    if (_exchangeFlowActive) return;
    _exchangeFlowActive = true;

    try {
      final session = ref.read(sessionServiceProvider);
      final warehouseId = session.warehouseId;
      final customerId = _checkout.customerId;
      if (warehouseId == null || customerId == null) {
        _showSnack('Customer and warehouse required', error: true);
        return;
      }

      ref.read(posTouchKeyboardControllerProvider).detach();
      await Future<void>.delayed(Duration.zero);
      if (!mounted) return;

      final ok = await showExchangeSaleDialog(
        context: context,
        returnRepo: ref.read(localReturnRepositoryProvider),
        exchangeRepo: ref.read(localExchangeRepositoryProvider),
        productLookup: ref.read(productLookupRepositoryProvider),
        warehouseId: warehouseId,
        customerId: customerId,
      );

      if (ok == true && mounted) {
        _showSnack('Exchange saved', success: true);
        ref.read(syncRevisionProvider.notifier).state++;
        _syncSalesInBackground();
      }
    } finally {
      _exchangeFlowActive = false;
    }
  }

  Future<void> _showReturnCreditPicker() async {
    final session = ref.read(sessionServiceProvider);
    final warehouseId = session.warehouseId;
    final customerId = _checkout.customerId;
    if (warehouseId == null || customerId == null || _checkout.isEmpty) {
      _showSnack('Add products and select customer first', error: true);
      return;
    }

    final credits = await ref.read(localReturnRepositoryProvider).loadPendingCredits(
          warehouseId: warehouseId,
          customerId: customerId,
        );

    if (!mounted) return;
    final beforeCredit = _checkout.returnCreditApplied;
    final maxApply = _calcTotals(_checkout.copyWith(returnSettlements: []))
            .grandTotal -
        beforeCredit;

    final applied = await showReturnCreditDialog(
      context: context,
      credits: credits,
      maxApply: maxApply > 0 ? maxApply : 0,
      initial: _checkout.returnSettlements,
      onLookupReference: (refNo) => ref
          .read(localReturnRepositoryProvider)
          .lookupCreditByReference(
            referenceNo: refNo,
            warehouseId: warehouseId,
            customerId: customerId,
          ),
      onManualAmount: (amount) => ref
          .read(localReturnRepositoryProvider)
          .distributeManualSettlement(
            credits: credits,
            amount: amount,
            maxApply: maxApply > 0 ? maxApply : 0,
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
            decoration: const InputDecoration(
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
      ref.read(productFilterProvider.notifier).state = ProductFilterState(
        filter: type,
        filterId: picked,
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
        subtitle: 'Drafts and completed sales at this terminal',
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
                labelColor: PosColors.primary,
                unselectedLabelColor: PosColors.textMuted,
                indicatorColor: PosColors.primary,
                tabs: const [
                  Tab(text: 'Drafts'),
                  Tab(text: 'Sales'),
                ],
              ),
              const SizedBox(height: 8),
              Expanded(
                child: TabBarView(
                  children: [
                    _recentList(drafts, empty: 'No drafts'),
                    _recentList(completed, empty: 'No sales yet'),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _clearCart() async {
    if (_checkout.isEmpty) return;
    final ok = await showPosConfirmDialog(
      context: context,
      title: 'Clear cart?',
      message: 'Remove all items and cancel this sale?',
      icon: Icons.remove_shopping_cart_outlined,
      confirmLabel: 'Clear',
      destructive: true,
    );
    if (ok == true) _setCheckout(_checkout.clearCart());
  }

  Widget _recentList(List<LocalSale> items, {required String empty}) {
    if (items.isEmpty) return Center(child: Text(empty));
    return ListView.builder(
      itemCount: items.length,
      itemBuilder: (_, i) {
        final s = items[i];
        final ref = formatSaleReferenceDisplay(
          resolveLocalSaleReference(
            clientUuid: s.clientUuid,
            referenceNo: s.referenceNo,
            serverReferenceNo: s.serverReferenceNo,
          ),
        );
        return ListTile(
          title: Text(ref.isNotEmpty ? ref : s.clientUuid),
          subtitle:
              Text('${s.syncStatus} · ${s.saleStatus == 3 ? 'draft' : 'sale'}'),
          trailing: Text(formatPosMoney(s.grandTotal)),
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
      final pendingAfter = await ref.read(pendingSyncCountProvider.future);
      if (pendingAfter == 0 && result.synced > 0) {
        await _refreshStockFromServer();
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
        const VerticalDivider(
          width: 1,
          thickness: 1,
          color: PosColors.border,
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
        const SingleActivator(LogicalKeyboardKey.keyS, shift: true): () =>
            _searchFocus.requestFocus(),
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
                backgroundColor: PosColors.pageBg,
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
    await ref.read(sessionServiceProvider).setCustomerId(picked);
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
      color: PosColors.catalogBg,
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
            const LinearProgressIndicator(minHeight: 2),
          Expanded(
            child: grid.isLoading && products.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : grid.error != null && products.isEmpty
                    ? Center(child: Text('$grid.error'))
                    : products.isEmpty
                        ? const Center(
                            child: Text(
                              'No products — try Featured, Category, or Brand, or sync data',
                              style: TextStyle(color: PosColors.textMuted),
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
                                    mainAxisSpacing: 8,
                                    crossAxisSpacing: 8,
                                    childAspectRatio: 2.35,
                                  ),
                                  delegate: SliverChildBuilderDelegate(
                                    (context, i) => PosProductCard(
                                      product: products[i],
                                      onTap: () => _tryAddToCart(products[i]),
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
            active: filter.filter == ProductGridFilter.featured,
            onTap: () {
              ref.read(productFilterProvider.notifier).state =
                  const ProductFilterState(filter: ProductGridFilter.featured);
            },
          ),
          PosQuickFilterChip(
            label: 'Category',
            colors: const [Color(0xFF9B7FD4), Color(0xFF5B45A0)],
            active: filter.filter == ProductGridFilter.category,
            onTap: meta == null
                ? () {}
                : () => unawaited(
                      _showFilterPicker(ProductGridFilter.category, meta),
                    ),
          ),
          PosQuickFilterChip(
            label: 'Brand',
            colors: const [Color(0xFF4DD0E1), Color(0xFF00838F)],
            active: filter.filter == ProductGridFilter.brand,
            onTap: meta == null
                ? () {}
                : () => unawaited(
                      _showFilterPicker(ProductGridFilter.brand, meta),
                    ),
          ),
        ],
      ),
    );
  }

  Widget _buildCheckout(
    PosCheckoutState checkout,
    PosTotals totals,
  ) {
    final ui = ref.watch(posUiSettingsProvider);
    final taxRate = ui.enableTax ? checkout.orderTaxRate : 0.0;
    final orderRef = generateSaleReference(ui);
    final orderTime = checkout.saleDate ?? DateTime.now();
    final subtotalWithLineTax = totals.subtotal + totals.lineTax;
    final hasOrderDiscount = totals.orderDiscount > 0;
    final hasPromoDiscount = totals.couponDiscount > 0;
    final hasReturnCredit = totals.returnCredit > 0;

    return ColoredBox(
      color: PosColors.orderPanelBg,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 16, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const Text(
                      'Current Order',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: PosColors.textPrimary,
                      ),
                    ),
                    const Spacer(),
                    TextButton.icon(
                      onPressed:
                          checkout.isEmpty || _busy ? null : _clearCart,
                      icon: const Icon(Icons.delete_outline, size: 18),
                      label: const Text('Clear'),
                      style: TextButton.styleFrom(
                        foregroundColor: PosColors.red,
                        textStyle: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
                if (!checkout.isEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: PosColors.primary,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Order #${formatSaleReferenceDisplay(orderRef.reference)}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          DateFormat('MMM d, h:mm a').format(orderTime),
                          maxLines: 1,
                          softWrap: false,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.white.withValues(alpha: 0.85),
                          ),
                        ),
                      ],
                    ),
                  ),
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
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: PosColors.border)),
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
                  const SizedBox(height: 8),
                  _orderSummaryRow(
                    'Discount',
                    -totals.orderDiscount,
                    valueColor: PosColors.red,
                  ),
                ],
                if (hasPromoDiscount) ...[
                  const SizedBox(height: 8),
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
                  const SizedBox(height: 8),
                  _orderSummaryRow(
                    'Return credit',
                    -totals.returnCredit,
                    valueColor: PosColors.primary,
                  ),
                ],
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _checkout.isEmpty || _busy
                            ? null
                            : _showCouponModal,
                        icon: const Icon(Icons.local_offer_outlined, size: 18),
                        label: const Text('Coupon'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 46),
                          foregroundColor: hasPromoDiscount
                              ? PosColors.primary
                              : PosColors.textPrimary,
                          side: BorderSide(
                            color: hasPromoDiscount
                                ? PosColors.primary
                                : PosColors.border,
                          ),
                          backgroundColor: hasPromoDiscount
                              ? PosColors.primaryLight
                              : Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _checkout.isEmpty || _busy
                            ? null
                            : _showDiscountModal,
                        icon: const Icon(Icons.discount_outlined, size: 18),
                        label: const Text('Discount'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 46),
                          foregroundColor: hasOrderDiscount
                              ? PosColors.primary
                              : PosColors.textPrimary,
                          side: BorderSide(
                            color: hasOrderDiscount
                                ? PosColors.primary
                                : PosColors.border,
                          ),
                          backgroundColor: hasOrderDiscount
                              ? PosColors.primaryLight
                              : Colors.white,
                        ),
                      ),
                    ),
                    if (ui.enableReturn) ...[
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _checkout.isEmpty || _busy
                              ? null
                              : _showReturnCreditPicker,
                          icon: const Icon(
                            Icons.account_balance_wallet_outlined,
                            size: 18,
                          ),
                          label: Text(
                            hasReturnCredit ? 'Return credit' : 'Settle return',
                          ),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size(0, 46),
                            foregroundColor: hasReturnCredit
                                ? PosColors.primary
                                : PosColors.textPrimary,
                            side: BorderSide(
                              color: hasReturnCredit
                                  ? PosColors.primary
                                  : PosColors.border,
                            ),
                            backgroundColor: hasReturnCredit
                                ? PosColors.primaryLight
                                : Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 14),
                PosPayButton(
                  disabled: _checkout.isEmpty || _busy,
                  onPressed: _showSavePaymentCarousel,
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
    return Row(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: PosColors.textMuted,
          ),
        ),
        const Spacer(),
        Flexible(
          child: Text(
            formatPosMoney(amount),
            maxLines: 1,
            softWrap: false,
            overflow: TextOverflow.fade,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: valueColor ?? PosColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCartRow(PosCheckoutState checkout, CartLine line) {
    return PosCartLineCard(
      name: line.name,
      unitPrice: line.netUnitPrice,
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
