import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/branding/pos_branding.dart';
import 'core/database/app_database.dart';
import 'core/providers/pos_ui_settings_provider.dart';
import 'core/services/pos_window_service.dart';
import 'core/providers/app_providers.dart';
import 'core/services/session_service.dart';
import 'core/theme/pos_theme.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/register_screen.dart';
import 'features/auth/setup_screen.dart';
import 'features/pos/models/pos_ui_settings.dart';
import 'features/pos/pos_app_shell.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await PosWindowService.instance.ensureInitialized();
  PosWindowService.instance.bindNavigator(rootNavigatorKey);

  final db = AppDatabase();
  final session = SessionService(db);
  await session.ensureLoaded();
  await session.migrateFromSharedPreferencesIfNeeded();

  if (!session.isRegistered &&
      session.isTerminalRegistered &&
      session.posToken != null &&
      session.posToken!.isNotEmpty) {
    await session.markDeviceRegistered();
  }

  runApp(
    ProviderScope(
      overrides: [
        appDatabaseProvider.overrideWithValue(db),
        sessionServiceProvider.overrideWithValue(session),
      ],
      child: const PosApp(),
    ),
  );
}

class PosApp extends ConsumerStatefulWidget {
  const PosApp({super.key});

  @override
  ConsumerState<PosApp> createState() => _PosAppState();
}

class _PosAppState extends ConsumerState<PosApp> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _syncWindowTheme());
  }

  void _syncWindowTheme() {
    if (!mounted) return;
    final uiSettings = ref.read(posUiSettingsProvider);
    final primary = resolvePosBrandTheme(uiSettings).primary;
    unawaited(PosWindowService.instance.applyThemeColor(primary));
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(sessionRevisionProvider);
    ref.listen<PosUiSettings>(posUiSettingsProvider, (_, __) {
      _syncWindowTheme();
    });

    final session = ref.watch(sessionServiceProvider);
    final uiSettings = ref.watch(posUiSettingsProvider);

    return MaterialApp(
      navigatorKey: rootNavigatorKey,
      title: PosBranding.appName,
      debugShowCheckedModeBanner: false,
      theme: buildPosTheme(uiSettings),
      home: !session.isRegistered
          ? const RegisterScreen()
          : !session.isProvisioned
              ? const SetupScreen()
              : session.isLoggedIn
                  ? const PosAppShell()
                  : const LoginScreen(),
    );
  }
}
