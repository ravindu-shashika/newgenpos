import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
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
  bool _closing = false;
  String _appTitle = PosBranding.appName;
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
  bool get isClosing => _closing;

  static bool get isSupported =>
      !kIsWeb && (Platform.isWindows || Platform.isLinux || Platform.isMacOS);

  void bindNavigator(GlobalKey<NavigatorState> key) {
    _navigatorKey = key;
  }

  Future<void> ensureInitialized() async {
    if (!isSupported) return;
    await windowManager.ensureInitialized();
    await windowManager.setTitle(_appTitle);
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

  Future<void> setAppTitle(String title) async {
    final trimmed = title.trim();
    _appTitle = trimmed.isEmpty ? PosBranding.appName : trimmed;
    if (!isSupported) return;
    await ensureInitialized();
    await windowManager.setTitle(_appTitle);
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
        subtitle: _appTitle,
        icon: Icons.logout_rounded,
        maxWidth: 440,
        maxBodyHeight: 80,
        body: Text(
          'Are you sure you want to exit $_appTitle?',
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
    if (_closing) return;
    final ctx = context ?? _navigatorKey?.currentContext;
    if (ctx == null || !ctx.mounted) return;
    if (_beforeExit != null && !await _beforeExit!(ctx)) return;
    if (!ctx.mounted) return;
    if (!await confirmClose(ctx)) return;
    if (!ctx.mounted) {
      await closeApp();
      return;
    }
    await closeApp(ctx);
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

  Future<void> closeApp([BuildContext? context]) async {
    if (_closing) return;
    _closing = true;

    final ctx = context ?? _navigatorKey?.currentContext;
    if (ctx != null && ctx.mounted) {
      _showClosingOverlay(ctx);
      // Let the closing UI paint before native teardown (can take a few seconds).
      await SchedulerBinding.instance.endOfFrame;
      await Future<void>.delayed(const Duration(milliseconds: 80));
      await SchedulerBinding.instance.endOfFrame;
    }

    if (!isSupported) {
      _closing = false;
      return;
    }

    try {
      await windowManager.setPreventClose(false);
      await windowManager.setClosable(true);
      await windowManager.destroy();
    } catch (_) {
      _closing = false;
    }
  }

  void _showClosingOverlay(BuildContext context) {
    unawaited(
      showGeneralDialog<void>(
        context: context,
        useRootNavigator: true,
        barrierDismissible: false,
        barrierLabel: 'Closing',
        barrierColor: Colors.black.withValues(alpha: 0.72),
        transitionDuration: const Duration(milliseconds: 220),
        pageBuilder: (dialogContext, _, __) {
          return const Material(
            type: MaterialType.transparency,
            child: SizedBox.expand(
              child: _PosClosingOverlay(),
            ),
          );
        },
        transitionBuilder: (_, animation, __, child) {
          final curved = CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutCubic,
          );
          return FadeTransition(
            opacity: curved,
            child: ScaleTransition(
              scale: Tween<double>(begin: 0.94, end: 1).animate(curved),
              child: child,
            ),
          );
        },
      ),
    );
  }

  @override
  void onWindowClose() {
    unawaited(requestClose());
  }
}

/// Full-window feedback while the desktop process tears down.
class _PosClosingOverlay extends StatefulWidget {
  const _PosClosingOverlay();

  @override
  State<_PosClosingOverlay> createState() => _PosClosingOverlayState();
}

class _PosClosingOverlayState extends State<_PosClosingOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;

    return ColoredBox(
      color: Colors.transparent,
      child: Center(
        child: AnimatedBuilder(
          animation: _pulse,
          builder: (context, child) {
            final t = Curves.easeInOut.transform(_pulse.value);
            return Transform.scale(
              scale: 0.98 + (0.04 * t),
              child: child,
            );
          },
          child: Container(
            width: 280,
            padding: const EdgeInsets.fromLTRB(28, 32, 28, 28),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(18),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black38,
                  blurRadius: 28,
                  offset: Offset(0, 12),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 44,
                  height: 44,
                  child: CircularProgressIndicator(
                    strokeWidth: 3.2,
                    color: primary,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Closing…',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.2,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Please wait while the POS shuts down',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
