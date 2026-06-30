import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:window_manager/window_manager.dart';
import 'package:win32/win32.dart';
import '../branding/pos_branding.dart';
import '../../features/pos/widgets/pos_professional_dialog.dart';
import '../../features/pos/widgets/show_pos_dialog.dart';

class PosWindowService with WindowListener {
  PosWindowService._();
  static final PosWindowService instance = PosWindowService._();

  bool _kioskActive = false;
  bool _windowMinimized = false;
  bool _listenerAttached = false;
  GlobalKey<NavigatorState>? _navigatorKey;
  Future<bool> Function(BuildContext context)? _beforeExit;

  /// Register cash-register close check before logout / app exit.
  void setBeforeExitHandler(Future<bool> Function(BuildContext context)? handler) {
    _beforeExit = handler;
  }

  /// Fires when kiosk mode toggles (custom title bar visibility).
  final ValueNotifier<bool> kioskActiveNotifier = ValueNotifier<bool>(false);

  /// Whether the window is currently maximized (Windows title bar).
  final ValueNotifier<bool> maximizedNotifier = ValueNotifier<bool>(false);

  bool get isKioskActive => _kioskActive;

  static bool get isSupported =>
      !kIsWeb && (Platform.isWindows || Platform.isLinux || Platform.isMacOS);

  void bindNavigator(GlobalKey<NavigatorState> key) {
    _navigatorKey = key;
  }

  Future<void> ensureInitialized() async {
    if (!isSupported) return;
    await windowManager.ensureInitialized();
    await windowManager.setTitle(PosBranding.appName);
    if (!_listenerAttached) {
      windowManager.addListener(this);
      _listenerAttached = true;
    }
    await windowManager.setPreventClose(true);
    await windowManager.setMinimizable(true);
  }

  /// Match native window chrome to the POS theme primary color.
  Future<void> applyThemeColor(Color color) async {
    if (!isSupported) return;
    await ensureInitialized();
    await windowManager.setBackgroundColor(color);
  }

  Future<void> enterKioskMode() async {
    if (!isSupported || _kioskActive) return;
    await ensureInitialized();

    await windowManager.setMinimizable(true);
    await windowManager.setMaximizable(true);
    await windowManager.setClosable(false);

    _kioskActive = true;
    kioskActiveNotifier.value = true;

    if (Platform.isWindows) {
      await windowManager.setTitleBarStyle(
        TitleBarStyle.hidden,
        windowButtonVisibility: false,
      );
      await windowManager.maximize();
      await _syncMaximizedState();
    } else {
      await windowManager.setFullScreen(true);
      await windowManager.setTitleBarStyle(TitleBarStyle.hidden);
    }
  }

  Future<void> exitKioskMode() async {
    if (!isSupported || !_kioskActive) return;

    await windowManager.setMinimizable(true);
    await windowManager.setMaximizable(true);
    await windowManager.setClosable(true);
    if (Platform.isWindows) {
      await windowManager.unmaximize();
    } else {
      await windowManager.setFullScreen(false);
    }
    await windowManager.setTitleBarStyle(TitleBarStyle.normal);
    _kioskActive = false;
    kioskActiveNotifier.value = false;
  }

  Future<void> toggleKioskMode() async {
    if (!isSupported) return;
    if (_kioskActive) {
      await exitKioskMode();
    } else {
      await enterKioskMode();
    }
  }

  Future<bool> confirmClose([BuildContext? context]) async {
    final ctx = context ?? _navigatorKey?.currentContext;
    if (ctx == null || !ctx.mounted) return false;

    final result = await showPosDialog<bool>(
      context: ctx,
      barrierDismissible: false,
      builder: (dialogContext) => PosProfessionalDialogShell(
        title: 'Close application?',
        subtitle: PosBranding.appName,
        icon: Icons.logout_rounded,
        maxWidth: 440,
        maxBodyHeight: 80,
        body: Text(
          'Are you sure you want to exit ${PosBranding.appName}?',
          style: TextStyle(
            fontSize: 14,
            height: 1.5,
            color: Theme.of(dialogContext).colorScheme.onSurface,
          ),
        ),
        footer: PosProfessionalDialogFooter(
          secondaryLabel: 'Cancel',
          primaryLabel: 'Close',
          primaryDestructive: true,
          onSecondary: () => Navigator.pop(dialogContext, false),
          onPrimary: () => Navigator.pop(dialogContext, true),
        ),
      ),
    );
    return result == true;
  }

  Future<void> requestClose([BuildContext? context]) async {
    final ctx = context ?? _navigatorKey?.currentContext;
    if (ctx == null || !ctx.mounted) return;
    if (_beforeExit != null && !await _beforeExit!(ctx)) return;
    if (!ctx.mounted) return;
    if (!await confirmClose(ctx)) return;
    await closeApp();
  }

  Future<void> toggleMaximize() async {
    if (!isSupported) return;
    await ensureInitialized();
    if (await windowManager.isMaximized()) {
      await windowManager.unmaximize();
    } else {
      await windowManager.maximize();
    }
    await _syncMaximizedState();
  }

  Future<void> _syncMaximizedState() async {
    if (!isSupported) return;
    try {
      maximizedNotifier.value = await windowManager.isMaximized();
    } catch (_) {}
  }

  Future<void> minimize() async {
    if (!isSupported) return;
    await ensureInitialized();

    try {
      await windowManager.setMinimizable(true);

      if (Platform.isWindows) {
        final ok = await _minimizeWindows();
        if (!ok) _windowMinimized = false;
        return;
      }

      _windowMinimized = true;
      if (await windowManager.isFullScreen()) {
        await windowManager.setFullScreen(false);
        await Future<void>.delayed(const Duration(milliseconds: 100));
      }
      await windowManager.minimize();
      if (!await _waitUntilMinimized()) {
        _windowMinimized = false;
      }
    } catch (_) {
      _windowMinimized = false;
    }
  }

  Future<bool> _minimizeWindows() async {
    _windowMinimized = true;

    if (await windowManager.isFullScreen()) {
      await windowManager.setFullScreen(false);
      await Future<void>.delayed(const Duration(milliseconds: 80));
    }

    await windowManager.setMinimizable(true);
    await windowManager.setMaximizable(true);

    final hwnd = await windowManager.getId();
    if (_showWindowMinimize(hwnd) && await _waitUntilMinimizedWindows(hwnd)) {
      return true;
    }

    if (await windowManager.isMaximized()) {
      await windowManager.unmaximize();
      await Future<void>.delayed(const Duration(milliseconds: 120));
      if (_showWindowMinimize(hwnd) && await _waitUntilMinimizedWindows(hwnd)) {
        return true;
      }
    }

    await windowManager.minimize();
    if (await _waitUntilMinimized()) return true;

    _windowMinimized = false;
    return false;
  }

  Future<bool> _waitUntilMinimized() async {
    for (var i = 0; i < 12; i++) {
      await Future<void>.delayed(const Duration(milliseconds: 50));
      if (await windowManager.isMinimized()) return true;
    }
    return false;
  }

  Future<bool> _waitUntilMinimizedWindows(int hwnd) async {
    for (var i = 0; i < 12; i++) {
      await Future<void>.delayed(const Duration(milliseconds: 50));
      if (_isWindowMinimizedHwnd(hwnd) || await windowManager.isMinimized()) {
        return true;
      }
    }
    return false;
  }

  bool _showWindowMinimize(int hwnd) {
    if (hwnd == 0) return false;
    return ShowWindow(hwnd, SW_MINIMIZE) != FALSE;
  }

  bool _isWindowMinimizedHwnd(int hwnd) {
    if (hwnd == 0) return false;
    return IsIconic(hwnd) != FALSE;
  }

  Future<void> _restoreKioskLayout() async {
    if (!isSupported || !_kioskActive || _windowMinimized) return;
    if (Platform.isWindows) {
      await windowManager.setTitleBarStyle(
        TitleBarStyle.hidden,
        windowButtonVisibility: false,
      );
      await windowManager.setMinimizable(true);
      await windowManager.setMaximizable(true);
      if (!await windowManager.isMaximized()) {
        await windowManager.maximize();
      }
      await _syncMaximizedState();
    } else {
      await windowManager.setFullScreen(true);
      await windowManager.setTitleBarStyle(TitleBarStyle.hidden);
    }
  }

  @override
  void onWindowMinimize() {
    _windowMinimized = true;
  }

  @override
  void onWindowMaximize() {
    maximizedNotifier.value = true;
  }

  @override
  void onWindowUnmaximize() {
    maximizedNotifier.value = false;
  }

  @override
  void onWindowRestore() {
    _windowMinimized = false;
    unawaited(_restoreKioskLayout());
  }

  Future<void> closeApp() async {
    if (!isSupported) return;
    await windowManager.destroy();
  }

  @override
  void onWindowClose() {
    unawaited(requestClose());
  }
}
