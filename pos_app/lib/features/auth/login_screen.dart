import 'dart:async';

import 'package:drift/drift.dart' show OrderingTerm;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/logging/app_logger.dart';
import '../../core/providers/app_providers.dart';
import '../../core/providers/pos_meta_provider.dart';
import '../../core/providers/pos_ui_settings_provider.dart';
import '../../core/branding/pos_branding.dart';
import '../../core/theme/pos_theme.dart';
import '../pos/models/pos_settings.dart';
import '../pos/pos_app_shell.dart';
import '../pos/widgets/pos_professional_dialog.dart';
import '../pos/widgets/show_pos_dialog.dart';
import '../../core/sync/download_models.dart';
import 'download_screen.dart';
import 'register_screen.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _pinCtrl = TextEditingController();
  final _pinFocus = FocusNode();

  bool _loading = false;
  String? _error;
  bool _hasLocalUsers = false;
  int _localUserCount = 0;
  bool _online = false;
  bool _probing = false;
  late Timer _clockTimer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkLocalUsers();
      _probeConnection();
      _pinFocus.requestFocus();
    });
  }

  @override
  void dispose() {
    _clockTimer.cancel();
    _pinFocus.dispose();
    _pinCtrl.dispose();
    super.dispose();
  }

  void _numpadInput(String key) {
    final ctrl = _pinCtrl;
    if (key == 'CLEAR') {
      ctrl.clear();
      setState(() {});
      return;
    }
    if (key == '⌫') {
      final text = ctrl.text;
      if (text.isEmpty) return;
      ctrl.text = text.substring(0, text.length - 1);
      ctrl.selection = TextSelection.collapsed(offset: ctrl.text.length);
      setState(() {});
      return;
    }
    ctrl.text = '${ctrl.text}$key';
    ctrl.selection = TextSelection.collapsed(offset: ctrl.text.length);
    setState(() {});
  }

  Future<void> _checkLocalUsers() async {
    final db = ref.read(appDatabaseProvider);
    final users = await db.select(db.localUsers).get();
    if (!mounted) return;
    setState(() {
      _localUserCount = users.length;
      _hasLocalUsers = users.isNotEmpty;
    });
  }

  Future<void> _probeConnection() async {
    if (_probing) return;
    setState(() => _probing = true);
    try {
      final online = await ref.read(syncServiceProvider).probeOnline();
      if (mounted) setState(() => _online = online);
    } catch (_) {
      if (mounted) setState(() => _online = false);
    } finally {
      if (mounted) setState(() => _probing = false);
    }
  }

  Future<void> _login() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final session = ref.read(sessionServiceProvider);
      final localAuth = ref.read(localAuthRepositoryProvider);

      final db = ref.read(appDatabaseProvider);
      final users = await db.select(db.localUsers).get();
      if (users.isEmpty) {
        throw Exception(
          'No users on this device. Download POS data first, then sign in.',
        );
      }

      final user = await localAuth.verifyByPin(_pinCtrl.text);
      if (user == null) {
        throw Exception(
          'Invalid access PIN. Set a POS Access PIN in User List and sync data.',
        );
      }

      final warehouseId = user.warehouseId ??
          session.warehouseId ??
          (await ref.read(appDatabaseProvider).getSyncMeta())?.warehouseId;
      if (warehouseId == null) {
        throw Exception('No warehouse configured. Re-run data download.');
      }

      PosSettings? settings;
      try {
        final online = await ref.read(syncServiceProvider).probeOnline();
        if (online) {
          final bundle = await ref
              .read(posSettingsRepositoryProvider)
              .refreshFromBootstrap(ref.read(apiClientProvider));
          settings = bundle.pos;
        }
      } catch (_) {}
      settings ??= await ref.read(posSettingsRepositoryProvider).load();
      final syncMeta = await db.getSyncMeta();
      final billerId =
          user.billerId ?? settings?.billerId ?? syncMeta?.defaultBillerId;

      await session.saveLocalLogin(
        userId: user.id,
        userName: user.name,
        warehouseId: warehouseId,
        billerId: billerId,
      );

      final firstCustomer = await (db.select(db.customers)
            ..orderBy([(c) => OrderingTerm.asc(c.id)])
            ..limit(1))
          .getSingleOrNull();
      final customerId = settings?.customerId ??
          syncMeta?.defaultCustomerId ??
          firstCustomer?.id;
      if (customerId != null) {
        await session.setCustomerId(customerId);
      }

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const PosAppShell()),
      );
    } catch (e, stack) {
      AppLogger.error('Login', 'Login failed', e, stack);
      setState(() => _error = AppLogger.userMessage(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openDownload(PosDownloadMode mode) async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => DownloadScreen(
          mode: mode,
          autoStart: mode == PosDownloadMode.delta,
        ),
      ),
    );
    if (!mounted) return;
    if (result == true) {
      await _checkLocalUsers();
      await _probeConnection();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            mode == PosDownloadMode.full
                ? 'Full download complete'
                : 'Changes synced',
          ),
        ),
      );
    }
  }

  Future<void> _reRegister() async {
    await ref.read(sessionServiceProvider).resetProvision();
    bumpSessionState(ref);
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const RegisterScreen()),
      (_) => false,
    );
  }

  void _showCredentialsHelp() {
    showPosDialog<void>(
      context: context,
      builder: (ctx) => PosProfessionalDialogShell(
        title: 'Security credentials',
        subtitle: 'Operator sign-in',
        icon: Icons.lock_outline_rounded,
        maxWidth: 460,
        maxBodyHeight: 140,
        body: Text(
          'Each operator needs a POS Access PIN set in User List on the server. '
          'Sync POS data to this terminal, then enter your PIN to sign in.',
          style: TextStyle(
            fontSize: 14,
            height: 1.5,
            color: Theme.of(ctx).colorScheme.onSurface,
          ),
        ),
        footer: PosProfessionalDialogFooter(
          secondaryLabel: 'Close',
          primaryLabel: 'Full re-download',
          onSecondary: () => Navigator.pop(ctx),
          onPrimary: () {
            Navigator.pop(ctx);
            _openDownload(PosDownloadMode.full);
          },
        ),
      ),
    );
  }

  String get _terminalLabel {
    final session = ref.read(sessionServiceProvider);
    final code = session.terminalCode?.trim();
    if (code != null && code.isNotEmpty) return code.toUpperCase();
    final id = session.deviceId;
    if (id.length >= 8) return 'TERMINAL_${id.substring(0, 4).toUpperCase()}';
    return 'TERMINAL_01';
  }

  String get _stationTitle {
    final session = ref.read(sessionServiceProvider);
    final name = session.terminalName?.trim();
    if (name != null && name.isNotEmpty) return name.toUpperCase();
    final code = session.terminalCode?.trim();
    if (code != null && code.isNotEmpty) return code.toUpperCase();
    return PosBranding.appName.toUpperCase();
  }

  String get _healthLabel {
    if (!_hasLocalUsers) return 'NO LOCAL USERS';
    if (_online) return 'NOMINAL';
    return 'OFFLINE';
  }

  Color get _healthColor {
    if (!_hasLocalUsers) return PosColors.orange;
    if (_online) return PosColors.loginAccent;
    return Theme.of(context).colorScheme.onSurfaceVariant;
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(sessionRevisionProvider);
    final timeStr = '${DateFormat('HH:mm:ss').format(_now)} UTC';

    final uiSettings = ref.watch(posUiSettingsProvider);

    return Theme(
      data: buildLoginTheme(uiSettings),
      child: Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            _LoginTopBar(
              terminalLabel: _terminalLabel,
              online: _online,
              probing: _probing,
              onRefresh: _loading ? null : () => _openDownload(PosDownloadMode.delta),
              onPowerMenu: _loading ? null : _showPowerMenu,
            ),
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 420),
                    child: _LoginCard(
                      stationTitle: _stationTitle,
                      pinCtrl: _pinCtrl,
                      pinFocus: _pinFocus,
                      onNumpad: _numpadInput,
                      loading: _loading,
                      error: _error,
                      hasLocalUsers: _hasLocalUsers,
                      localUserCount: _localUserCount,
                      onLogin: _login,
                      onForgot: _showCredentialsHelp,
                    ),
                  ),
                ),
              ),
            ),
            _StatusFooter(
              healthLabel: _healthLabel,
              healthColor: _healthColor,
              timeLabel: timeStr,
            ),
            const _SecurityFooter(),
          ],
        ),
      ),
      ),
    );
  }

  void _showPowerMenu() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.sync),
              title: const Text('Sync changes only'),
              onTap: () {
                Navigator.pop(ctx);
                _openDownload(PosDownloadMode.delta);
              },
            ),
            ListTile(
              leading: const Icon(Icons.cloud_download_outlined),
              title: const Text('Full re-download'),
              onTap: () {
                Navigator.pop(ctx);
                _openDownload(PosDownloadMode.full);
              },
            ),
            ListTile(
              leading: const Icon(Icons.power_settings_new, color: PosColors.red),
              title: const Text('Re-register device'),
              onTap: () {
                Navigator.pop(ctx);
                _reRegister();
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _LoginTopBar extends StatelessWidget {
  const _LoginTopBar({
    required this.terminalLabel,
    required this.online,
    required this.probing,
    this.onRefresh,
    this.onPowerMenu,
  });

  final String terminalLabel;
  final bool online;
  final bool probing;
  final VoidCallback? onRefresh;
  final VoidCallback? onPowerMenu;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: context.posSurface.loginHeaderBg,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 10, 12, 10),
        child: Row(
          children: [
            Text(
              terminalLabel,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.6,
                color: context.posSurface.loginText,
              ),
            ),
            const Spacer(),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.sensors,
                  size: 16,
                  color: online ? context.posSurface.loginText : context.posSurface.loginTextMuted,
                ),
                SizedBox(width: 6),
                Text(
                  online ? 'ACTIVE_LINK' : 'OFFLINE',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.4,
                    color: online ? context.posSurface.loginText : context.posSurface.loginTextMuted,
                  ),
                ),
                SizedBox(width: 14),
                IconButton(
                  tooltip: 'Sync',
                  onPressed: probing ? null : onRefresh,
                  icon: probing
                      ? SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: context.posSurface.loginText,
                          ),
                        )
                      : const Icon(Icons.refresh, size: 20),
                  color: context.posSurface.loginText,
                ),
                IconButton(
                  tooltip: 'Terminal options',
                  onPressed: onPowerMenu,
                  icon: const Icon(Icons.power_settings_new, size: 20),
                  color: context.posSurface.loginText,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _LoginCard extends StatelessWidget {
  const _LoginCard({
    required this.stationTitle,
    required this.pinCtrl,
    required this.pinFocus,
    required this.onNumpad,
    required this.loading,
    required this.error,
    required this.hasLocalUsers,
    required this.localUserCount,
    required this.onLogin,
    required this.onForgot,
  });

  final String stationTitle;
  final TextEditingController pinCtrl;
  final FocusNode pinFocus;
  final void Function(String key) onNumpad;
  final bool loading;
  final String? error;
  final bool hasLocalUsers;
  final int localUserCount;
  final VoidCallback onLogin;
  final VoidCallback onForgot;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(28, 32, 28, 28),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 32,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: PosColors.loginAccent,
              borderRadius: BorderRadius.circular(14),
            ),
            alignment: Alignment.center,
            child: Text(
              '>_',
              style: TextStyle(
                color: Theme.of(context).colorScheme.surface,
                fontSize: 22,
                fontWeight: FontWeight.w700,
                fontFamily: 'Consolas',
              ),
            ),
          ),
          SizedBox(height: 18),
          Text(
            stationTitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
              color: context.posSurface.loginText,
              height: 1.1,
            ),
          ),
          SizedBox(height: 6),
          Text(
            'OPERATIONAL TERMINAL',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.6,
              color: context.posSurface.loginTextMuted,
            ),
          ),
          SizedBox(height: 28),
          _CredentialField(
            label: 'ACCESS PIN',
            controller: pinCtrl,
            focusNode: pinFocus,
            active: true,
            obscure: true,
            hint: '••••••••',
            trailing: Icons.lock_outline,
            onTap: () => pinFocus.requestFocus(),
            onSubmitted: onLogin,
          ),
          if (!hasLocalUsers) ...[
            SizedBox(height: 12),
            Text(
              'No users on device — run Full re-download from terminal menu.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: Colors.orange.shade800),
            ),
          ] else if (localUserCount > 0) ...[
            SizedBox(height: 8),
            Text(
              '$localUserCount operator${localUserCount == 1 ? '' : 's'} registered locally',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          ],
          SizedBox(height: 20),
          _LoginNumpad(onKey: onNumpad),
          SizedBox(height: 8),
          _LoginNumpadActions(onKey: onNumpad),
          if (error != null) ...[
            SizedBox(height: 12),
            Text(
              error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: PosColors.red, fontSize: 13),
            ),
          ],
          SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: FilledButton(
              onPressed: loading ? null : onLogin,
              style: FilledButton.styleFrom(
                backgroundColor: PosColors.loginAccent,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: loading
                  ? SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Theme.of(context).colorScheme.surface,
                      ),
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'INITIALIZE SESSION',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.8,
                          ),
                        ),
                        SizedBox(width: 10),
                        Icon(Icons.login, size: 20),
                      ],
                    ),
            ),
          ),
          SizedBox(height: 14),
          TextButton(
            onPressed: loading ? null : onForgot,
            style: TextButton.styleFrom(
              foregroundColor: PosColors.loginAccent,
              textStyle: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
            child: const Text('Forgot access PIN?'),
          ),
        ],
      ),
    );
  }
}

class _CredentialField extends StatelessWidget {
  const _CredentialField({
    required this.label,
    required this.controller,
    required this.focusNode,
    required this.active,
    required this.obscure,
    required this.hint,
    required this.trailing,
    required this.onTap,
    this.onSubmitted,
  });

  final String label;
  final TextEditingController controller;
  final FocusNode focusNode;
  final bool active;
  final bool obscure;
  final String hint;
  final IconData trailing;
  final VoidCallback onTap;
  final VoidCallback? onSubmitted;

  static const _fieldFill = PosColors.loginFieldFill;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.2,
            color: context.posSurface.loginTextMuted,
          ),
        ),
        SizedBox(height: 8),
        Material(
          color: _fieldFill,
          borderRadius: BorderRadius.circular(12),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: active
                      ? PosColors.loginAccent
                      : context.posSurface.loginFieldBorder,
                  width: 1.5,
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: controller,
                      focusNode: focusNode,
                      obscureText: obscure,
                      obscuringCharacter: '•',
                      onTap: onTap,
                      onSubmitted: onSubmitted == null
                          ? null
                          : (_) => onSubmitted!(),
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: context.posSurface.loginText,
                      ),
                      decoration: InputDecoration(
                        hintText: hint,
                        hintStyle: TextStyle(
                          color: context.posSurface.loginTextMuted,
                        ),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding:
                            const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  Icon(
                    trailing,
                    size: 20,
                    color: context.posSurface.loginTextMuted,
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _LoginNumpad extends StatelessWidget {
  const _LoginNumpad({required this.onKey});

  final void Function(String key) onKey;

  @override
  Widget build(BuildContext context) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    return Column(
      children: [
        for (var row = 0; row < 3; row++)
          Padding(
            padding: EdgeInsets.only(bottom: row < 2 ? 8 : 0),
            child: Row(
              children: [
                for (var col = 0; col < 3; col++) ...[
                  Expanded(
                    child: _NumpadKey(
                      label: keys[row * 3 + col],
                      onTap: () => onKey(keys[row * 3 + col]),
                    ),
                  ),
                  if (col < 2) const SizedBox(width: 8),
                ],
              ],
            ),
          ),
      ],
    );
  }
}

class _LoginNumpadActions extends StatelessWidget {
  const _LoginNumpadActions({required this.onKey});

  final void Function(String key) onKey;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _NumpadKey(
            label: 'CLEAR',
            small: true,
            onTap: () => onKey('CLEAR'),
          ),
        ),
        SizedBox(width: 8),
        Expanded(
          child: _NumpadKey(
            label: '0',
            onTap: () => onKey('0'),
          ),
        ),
        SizedBox(width: 8),
        Expanded(
          child: _NumpadKey(
            label: '⌫',
            onTap: () => onKey('⌫'),
          ),
        ),
      ],
    );
  }
}

class _NumpadKey extends StatelessWidget {
  const _NumpadKey({
    required this.label,
    required this.onTap,
    this.small = false,
  });

  final String label;
  final VoidCallback onTap;
  final bool small;

  static const _numpadFill = PosColors.loginNumpadFill;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: _numpadFill,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          height: 52,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: context.posSurface.loginNumpadBorder),
          ),
          child: label == '⌫'
              ? Icon(
                  Icons.backspace_outlined,
                  size: 20,
                  color: context.posSurface.loginText,
                )
              : Text(
                  label,
                  style: TextStyle(
                    fontSize: small ? 12 : 18,
                    fontWeight: FontWeight.w700,
                    letterSpacing: small ? 0.6 : 0,
                    color: context.posSurface.loginText,
                  ),
                ),
        ),
      ),
    );
  }
}

class _StatusFooter extends StatelessWidget {
  const _StatusFooter({
    required this.healthLabel,
    required this.healthColor,
    required this.timeLabel,
  });

  final String healthLabel;
  final Color healthColor;
  final String timeLabel;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: context.posSurface.loginPillBg,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: context.posSurface.loginFieldBorder),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: healthColor,
                shape: BoxShape.circle,
              ),
            ),
            SizedBox(width: 8),
            Text(
              'SYSTEM HEALTH: ',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: context.posSurface.loginTextMuted,
                letterSpacing: 0.3,
              ),
            ),
            Text(
              healthLabel,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: healthColor == PosColors.loginAccent
                    ? context.posSurface.loginText
                    : healthColor,
                letterSpacing: 0.3,
              ),
            ),
            SizedBox(width: 12),
            Container(
              width: 1,
              height: 14,
              color: context.posSurface.loginNumpadBorder,
            ),
            SizedBox(width: 12),
            Text(
              timeLabel,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: context.posSurface.loginTextMuted,
                letterSpacing: 0.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SecurityFooter extends StatelessWidget {
  const _SecurityFooter();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(32, 0, 32, 16),
      child: Text(
        'Security level 4 active. All terminal interactions are monitored '
        'and encrypted by Station Command protocols.',
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: 10,
          height: 1.4,
          color: context.posSurface.loginTextMuted,
        ),
      ),
    );
  }
}
