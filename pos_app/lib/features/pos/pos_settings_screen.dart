import 'dart:async';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/app_providers.dart';
import '../../core/providers/local_print_settings_provider.dart';
import '../../core/providers/pos_meta_provider.dart';
import '../../core/providers/pos_ui_settings_provider.dart';
import '../../core/providers/product_grid_provider.dart';
import '../../core/services/pos_window_service.dart';
import '../../core/services/session_service.dart';
import '../../core/sync/download_models.dart';
import '../../core/theme/pos_theme.dart';
import '../auth/download_screen.dart';
import '../auth/login_screen.dart';
import 'models/pos_settings.dart';
import 'models/pos_ui_settings.dart';
import 'pos_checkout_defaults.dart';
import 'pos_checkout_state.dart';
import 'pos_printer_settings_screen.dart';
import 'pos_server_settings_screen.dart';
import 'providers/pos_settings_subpage_provider.dart';
import 'widgets/pos_brand_logo.dart';
import 'widgets/pos_color_preset_picker.dart';
import 'widgets/pos_touch_keyboard_controller.dart';
import 'widgets/pos_touch_keyboard_host.dart';
import 'widgets/pos_professional_dialog.dart';
import 'widgets/pos_settings_ui.dart';
import 'widgets/pos_toast.dart';

/// Terminal settings — Precision Terminal mockup layout.
class PosSettingsScreen extends ConsumerStatefulWidget {
  const PosSettingsScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  ConsumerState<PosSettingsScreen> createState() => _PosSettingsScreenState();
}

class _PosSettingsScreenState extends ConsumerState<PosSettingsScreen> {
  bool _busy = false;

  final _refPrefixCtrl = TextEditingController();
  final _refSeqCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrapFields());
  }

  void _bootstrapFields() {
    unawaited(ref.read(localPrintSettingsProvider.notifier).ensureLoaded());
  }

  @override
  void dispose() {
    _refPrefixCtrl.dispose();
    _refSeqCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickSidebarLogo() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: false,
    );
    if (result == null || result.files.isEmpty) return;
    final path = result.files.single.path;
    if (path == null) return;
    await ref.read(posUiSettingsProvider.notifier).patch(
          (s) => s.copyWith(sidebarLogoPath: path),
        );
    _snack('Sidebar logo saved', success: true);
  }

  Future<void> _refreshPosSettings() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final online = await ref.read(syncServiceProvider).probeOnline();
      if (!online) {
        _snack('Connect to internet to refresh POS settings', error: true);
        return;
      }
      await ref
          .read(posSettingsRepositoryProvider)
          .refreshFromBootstrap(ref.read(apiClientProvider));
      ref.invalidate(posDeviceSettingsProvider);
      ref.invalidate(posSettingsProvider);
      _snack('POS settings updated from server', success: true);
    } catch (e) {
      _snack('Failed to refresh settings: $e', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _openSync(PosDownloadMode mode) async {
    final online = await ref.read(syncServiceProvider).probeOnline();
    if (!mounted) return;
    if (!online) {
      _snack('Connect to internet to sync data', error: true);
      return;
    }
    final ok = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => DownloadScreen(
          mode: mode,
          inApp: true,
          autoStart: mode == PosDownloadMode.delta,
        ),
      ),
    );
    if (ok == true && mounted) {
      reloadProductGrid(ref);
      ref.invalidate(posLocalMetaProvider);
      ref.read(syncRevisionProvider.notifier).state++;
      if (mode == PosDownloadMode.full) {
        ref.read(posCheckoutProvider.notifier).state =
            const PosCheckoutState();
      }
      try {
        await ref
            .read(posSettingsRepositoryProvider)
            .refreshFromBootstrap(ref.read(apiClientProvider));
        ref.invalidate(posDeviceSettingsProvider);
        ref.invalidate(posSettingsProvider);
      } catch (_) {}
      _snack(
        mode == PosDownloadMode.full
            ? 'All POS data re-downloaded'
            : 'Latest data synced',
        success: true,
      );
    }
  }

  Future<void> _saveAll() async {
    _snack('All changes saved', success: true);
  }

  Future<void> _logout() async {
    final ok = await showPosConfirmDialog(
      context: context,
      title: 'Sign out?',
      message: 'Return to the login screen?',
      icon: Icons.logout_rounded,
      confirmLabel: 'Sign out',
    );
    if (ok != true || !mounted) return;
    await PosWindowService.instance.exitKioskMode();
    await ref.read(sessionServiceProvider).clear();
    bumpSessionState(ref);
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  Future<void> _rebootStation() async {
    await PosWindowService.instance.exitKioskMode();
    await Future<void>.delayed(const Duration(milliseconds: 400));
    await PosWindowService.instance.enterKioskMode();
    if (mounted) _snack('Station display restarted');
  }

  void _snack(String msg, {bool error = false, bool success = false}) {
    if (!mounted) return;
    PosToast.show(
      context,
      msg,
      type: error
          ? PosToastType.error
          : success
              ? PosToastType.success
              : PosToastType.info,
    );
  }

  void _syncReferenceFields(PosUiSettings ui) {
    if (_refPrefixCtrl.text != ui.saleReferencePrefix) {
      _refPrefixCtrl.text = ui.saleReferencePrefix;
    }
    final seqText = ui.saleReferenceNextSeq.toString();
    if (_refSeqCtrl.text != seqText) _refSeqCtrl.text = seqText;
  }

  @override
  Widget build(BuildContext context) {
    final subPage = ref.watch(posSettingsSubPageProvider);
    if (subPage == PosSettingsSubPage.printer) {
      return const PosPrinterSettingsScreen();
    }
    if (subPage == PosSettingsSubPage.server) {
      return const PosServerSettingsScreen();
    }

    final uiSettings = ref.watch(posUiSettingsProvider);
    final posSettings = ref.watch(posSettingsProvider).value;
    final metaAsync = ref.watch(posLocalMetaProvider);
    final checkout = ref.watch(posCheckoutProvider);
    final session = ref.watch(sessionServiceProvider);

    _syncReferenceFields(uiSettings);

    final Widget body;
    if (subPage == PosSettingsSubPage.main) {
      body = _SettingsHub(
        busy: _busy,
        session: session,
        metaAsync: metaAsync,
        onOpen: (page) => openPosSettingsSubPage(ref, page),
      );
    } else if (subPage == PosSettingsSubPage.terminal) {
      body = PosSettingsSubPageShell(
        title: 'Terminal identity',
        subtitle: 'Station details assigned to this device',
        onBack: () => closePosSettingsSubPage(ref),
        child: _TerminalIdentityCard(
          stationId: session.terminalCode?.trim().toUpperCase() ?? '—',
          location: session.terminalName?.trim().isNotEmpty == true
              ? session.terminalName!.trim()
              : 'Not set',
        ),
      );
    } else if (subPage == PosSettingsSubPage.appearance) {
      body = PosSettingsSubPageShell(
        title: 'Appearance & theme',
        subtitle: 'Brand colors, dark mode, font size, and sidebar logo',
        onBack: () => closePosSettingsSubPage(ref),
        child: Column(
          children: [
            _VisualsCard(
              uiSettings: uiSettings,
              onPatch: (fn) =>
                  ref.read(posUiSettingsProvider.notifier).patch(fn),
            ),
            const SizedBox(height: 16),
            _SidebarLogoCard(
              logoPath: uiSettings.sidebarLogoPath,
              onPick: () => unawaited(_pickSidebarLogo()),
              onRemove: () => ref.read(posUiSettingsProvider.notifier).patch(
                    (s) => s.copyWith(clearSidebarLogo: true),
                  ),
            ),
          ],
        ),
      );
    } else if (subPage == PosSettingsSubPage.checkout) {
      body = PosSettingsSubPageShell(
        title: 'Checkout & POS',
        subtitle: 'Warehouse, defaults, tax, returns, and sale reference',
        onBack: () => closePosSettingsSubPage(ref),
        child: _CheckoutOptionsCard(
          metaAsync: metaAsync,
          checkout: checkout,
          uiSettings: uiSettings,
          posSettings: posSettings,
          refPrefixCtrl: _refPrefixCtrl,
          refSeqCtrl: _refSeqCtrl,
          onCheckoutChanged: (s) =>
              ref.read(posCheckoutProvider.notifier).state = s,
          onRefreshServerSettings: () => unawaited(_refreshPosSettings()),
        ),
      );
    } else if (subPage == PosSettingsSubPage.maintenance) {
      body = PosSettingsSubPageShell(
        title: 'Maintenance',
        subtitle: 'Sync catalog data and manage this terminal',
        onBack: () => closePosSettingsSubPage(ref),
        child: _MaintenanceActions(
          onRefresh: () => unawaited(_openSync(PosDownloadMode.delta)),
          onFullDownload: () => unawaited(_openSync(PosDownloadMode.full)),
          onReboot: () => unawaited(_rebootStation()),
          onLogout: _logout,
        ),
      );
    } else {
      body = const SizedBox.shrink();
    }

    final content = Column(
      children: [
        Expanded(
          child: _busy
              ? const Center(child: CircularProgressIndicator())
              : body,
        ),
        if (subPage == PosSettingsSubPage.main) _SettingsFooter(onSave: _saveAll),
      ],
    );

    if (widget.embedded) {
      return PosTouchKeyboardHost(child: content);
    }

    return PosTouchKeyboardHost(
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        body: content,
      ),
    );
  }
}

class _SettingsHub extends StatelessWidget {
  const _SettingsHub({
    required this.busy,
    required this.session,
    required this.metaAsync,
    required this.onOpen,
  });

  final bool busy;
  final SessionService session;
  final AsyncValue<PosLocalMeta> metaAsync;
  final ValueChanged<PosSettingsSubPage> onOpen;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(28, 24, 28, 28),
      children: [
        PosSettingsPageHeader(
          title: 'Settings',
          subtitle: 'Choose a category to configure this terminal',
          badges: [
            PosSettingsBadge(
              icon: Icons.storefront_outlined,
              label: session.terminalCode?.trim().toUpperCase() ?? 'TERMINAL',
            ),
            PosSettingsBadge(
              icon: Icons.person_outline,
              label: session.userName?.trim().isNotEmpty == true
                  ? session.userName!.trim()
                  : 'Operator',
            ),
          ],
        ),
        const SizedBox(height: 22),
        _SettingsStatsRow(
          stationId: session.terminalCode?.trim().toUpperCase() ?? '—',
          location: session.terminalName?.trim().isNotEmpty == true
              ? session.terminalName!.trim()
              : 'Not set',
          warehouse: () {
            final list = metaAsync.valueOrNull?.warehouses
                .where((w) => w.id == session.warehouseId);
            if (list == null || list.isEmpty) return '—';
            return list.first.name;
          }(),
        ),
        const SizedBox(height: 22),
        PosSettingsMenuTile(
          icon: Icons.badge_outlined,
          title: 'Terminal identity',
          subtitle: 'Station ID and location on receipts',
          onTap: busy ? () {} : () => onOpen(PosSettingsSubPage.terminal),
        ),
        const SizedBox(height: 10),
        PosSettingsMenuTile(
          icon: Icons.palette_outlined,
          title: 'Appearance & theme',
          subtitle: 'Colors, dark mode, font size, sidebar logo',
          onTap: busy ? () {} : () => onOpen(PosSettingsSubPage.appearance),
        ),
        const SizedBox(height: 10),
        PosSettingsMenuTile(
          icon: Icons.tune_outlined,
          title: 'Checkout & POS',
          subtitle: 'Warehouse, defaults, tax, returns, keyboard',
          onTap: busy ? () {} : () => onOpen(PosSettingsSubPage.checkout),
        ),
        const SizedBox(height: 10),
        PosSettingsMenuTile(
          icon: Icons.dns_outlined,
          title: 'Server & API',
          subtitle: 'API URL, connection test, and sync path',
          onTap: busy ? () {} : () => onOpen(PosSettingsSubPage.server),
        ),
        const SizedBox(height: 10),
        PosSettingsMenuTile(
          icon: Icons.print_outlined,
          title: 'Printer & receipts',
          subtitle: 'Paper size, receipt layout, logo, direct print',
          onTap: busy ? () {} : () => onOpen(PosSettingsSubPage.printer),
        ),
        const SizedBox(height: 10),
        PosSettingsMenuTile(
          icon: Icons.build_circle_outlined,
          title: 'Maintenance',
          subtitle: 'Sync data, reboot station, sign out',
          onTap: busy ? () {} : () => onOpen(PosSettingsSubPage.maintenance),
        ),
      ],
    );
  }
}

class _SettingsStatsRow extends StatelessWidget {
  const _SettingsStatsRow({
    required this.stationId,
    required this.location,
    required this.warehouse,
  });

  final String stationId;
  final String location;
  final String warehouse;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final narrow = constraints.maxWidth < 640;
        final tiles = [
          PosSettingsStatTile(
            icon: Icons.badge_outlined,
            label: 'STATION',
            value: stationId.isEmpty ? '—' : stationId,
          ),
          PosSettingsStatTile(
            icon: Icons.place_outlined,
            label: 'LOCATION',
            value: location.isEmpty ? 'Not set' : location,
          ),
          PosSettingsStatTile(
            icon: Icons.warehouse_outlined,
            label: 'WAREHOUSE',
            value: warehouse,
          ),
        ];
        if (narrow) {
          return Column(
            children: [
              for (var i = 0; i < tiles.length; i++) ...[
                if (i > 0) const SizedBox(height: 10),
                tiles[i],
              ],
            ],
          );
        }
        return Row(
          children: [
            for (var i = 0; i < tiles.length; i++) ...[
              if (i > 0) const SizedBox(width: 12),
              Expanded(child: tiles[i]),
            ],
          ],
        );
      },
    );
  }
}

class _TerminalIdentityCard extends StatelessWidget {
  const _TerminalIdentityCard({
    required this.stationId,
    required this.location,
  });

  final String stationId;
  final String location;

  @override
  Widget build(BuildContext context) {
    return PosSettingsSectionCard(
      icon: Icons.badge_outlined,
      title: 'Terminal identity',
      subtitle: 'Assigned automatically to this device — shown on receipts',
      child: Column(
        children: [
          _ReadOnlySettingField(
            label: 'Station ID',
            value: stationId,
          ),
          SizedBox(height: 14),
          _ReadOnlySettingField(
            label: 'Location',
            value: location,
            prefixIcon: Icons.place_outlined,
          ),
        ],
      ),
    );
  }
}

class _ReadOnlySettingField extends StatelessWidget {
  const _ReadOnlySettingField({
    required this.label,
    required this.value,
    this.prefixIcon,
  });

  final String label;
  final String value;
  final IconData? prefixIcon;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return InputDecorator(
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: s.textMuted),
        filled: true,
        fillColor: s.inputFill,
        enabled: false,
        prefixIcon: prefixIcon != null
            ? Icon(prefixIcon, color: s.textMuted)
            : null,
        suffixIcon: Icon(
          Icons.lock_outline,
          size: 18,
          color: s.textMuted,
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(kPosButtonRadius),
          borderSide: BorderSide(color: s.border),
        ),
      ),
      child: Text(
        value,
        style: s.titleMedium.copyWith(fontSize: 15),
      ),
    );
  }
}

class _VisualsCard extends StatelessWidget {
  const _VisualsCard({
    required this.uiSettings,
    required this.onPatch,
  });

  final PosUiSettings uiSettings;
  final Future<void> Function(PosUiSettings Function(PosUiSettings)) onPatch;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final buttonHex = uiSettings.buttonPrimaryColor.trim().isEmpty
        ? uiSettings.themePrimaryColor
        : uiSettings.buttonPrimaryColor;

    return PosSettingsSectionCard(
      icon: Icons.palette_outlined,
      title: 'Visuals & theme',
      subtitle: 'Brand colors, appearance, and font size',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          PosColorPresetPicker(
            label: 'Theme color',
            selectedHex: uiSettings.themePrimaryColor,
            onChanged: (hex) => unawaited(
              onPatch((s) => s.copyWith(themePrimaryColor: hex)),
            ),
          ),
          SizedBox(height: 20),
          PosColorPresetPicker(
            label: 'Button color',
            selectedHex: buttonHex,
            onChanged: (hex) {
              final sameAsTheme =
                  hex.toUpperCase() == uiSettings.themePrimaryColor.toUpperCase();
              unawaited(
                onPatch(
                  (s) => s.copyWith(
                    buttonPrimaryColor: sameAsTheme ? '' : hex,
                    clearButtonPrimaryColor: sameAsTheme,
                  ),
                ),
              );
            },
          ),
          if (uiSettings.buttonPrimaryColor.trim().isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                'Using theme color for buttons',
                style: s.caption.copyWith(fontSize: 12),
              ),
            ),
          SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _ThemeOption(
                  label: 'Light Mode',
                  selected: !uiSettings.darkMode,
                  light: true,
                  onTap: () => unawaited(
                    onPatch((s) => s.copyWith(darkMode: false)),
                  ),
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: _ThemeOption(
                  label: 'Dark Mode',
                  selected: uiSettings.darkMode,
                  light: false,
                  onTap: () => unawaited(
                    onPatch((s) => s.copyWith(darkMode: true)),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 20),
          Text(
            'Font Size',
            style: s.titleMedium.copyWith(fontSize: 13),
          ),
          Row(
            children: [
              Text('A', style: TextStyle(fontSize: 12, color: s.textMuted)),
              Expanded(
                child: Slider(
                  value: uiSettings.fontScale,
                  min: 0.85,
                  max: 1.2,
                  onChanged: (v) => unawaited(
                    onPatch((s) => s.copyWith(fontScale: v)),
                  ),
                ),
              ),
              Text('A', style: TextStyle(fontSize: 18, color: s.text)),
            ],
          ),
          SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: OutlinedButton(
              onPressed: () => unawaited(
                onPatch(
                  (s) => s.copyWith(
                    themePrimaryColor: '#002C76',
                    clearButtonPrimaryColor: true,
                    darkMode: false,
                    fontScale: 1.0,
                  ),
                ),
              ),
              child: const Text('Reset theme defaults'),
            ),
          ),
        ],
      ),
    );
  }
}

class _SidebarLogoCard extends StatelessWidget {
  const _SidebarLogoCard({
    required this.logoPath,
    required this.onPick,
    required this.onRemove,
  });

  final String? logoPath;
  final VoidCallback onPick;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return PosSettingsSectionCard(
      icon: Icons.image_outlined,
      title: 'Sidebar logo',
      subtitle: 'Displayed at the top of the navigation bar',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: PosBrandLogo(
              logoPath: logoPath,
              size: 72,
              variant: PosBrandLogoVariant.sidebar,
            ),
          ),
          SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onPick,
                  icon: const Icon(Icons.upload_file_outlined),
                  label: Text(logoPath == null ? 'Choose logo' : 'Change logo'),
                ),
              ),
              if (logoPath != null && logoPath!.isNotEmpty) ...[
                SizedBox(width: 8),
                IconButton(
                  tooltip: 'Remove logo',
                  onPressed: onRemove,
                  icon: const Icon(Icons.delete_outline),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _ThemeOption extends StatelessWidget {
  const _ThemeOption({
    required this.label,
    required this.selected,
    required this.light,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final bool light;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final lightPreviewBg = const Color(0xFFF8FAFC);
    final lightPreviewFg = const Color(0xFF1A2B56);
    final darkPreviewBg = const Color(0xFF1E293B);
    final darkPreviewFg = Colors.white;

    return Material(
      color: light ? lightPreviewBg : darkPreviewBg,
      borderRadius: BorderRadius.circular(kPosButtonRadius),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(kPosButtonRadius),
        child: Container(
          height: 72,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(kPosButtonRadius),
            border: Border.all(
              color: selected ? s.accent : s.border,
              width: selected ? 2 : 1,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: light ? lightPreviewFg : darkPreviewFg,
            ),
          ),
        ),
      ),
    );
  }
}

class _MaintenanceActions extends StatelessWidget {
  const _MaintenanceActions({
    required this.onRefresh,
    required this.onFullDownload,
    required this.onReboot,
    required this.onLogout,
  });

  final VoidCallback onRefresh;
  final VoidCallback onFullDownload;
  final VoidCallback onReboot;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        PosSettingsActionTile(
          icon: Icons.sync_outlined,
          title: 'Refresh data',
          subtitle: 'Download latest changes from the server',
          onTap: onRefresh,
        ),
        const SizedBox(height: 8),
        PosSettingsActionTile(
          icon: Icons.cloud_download_outlined,
          title: 'Full download',
          subtitle: 'Re-download the complete product catalog',
          onTap: onFullDownload,
        ),
        const PosSettingsDivider(),
        PosSettingsActionTile(
          icon: Icons.restart_alt_outlined,
          title: 'Reboot station',
          subtitle: 'Restart the POS application',
          onTap: onReboot,
        ),
        const SizedBox(height: 8),
        PosSettingsActionTile(
          icon: Icons.logout_outlined,
          title: 'Log out',
          subtitle: 'Sign out of this terminal',
          onTap: onLogout,
          destructive: true,
        ),
      ],
    );
  }
}

class _SettingsFooter extends StatelessWidget {
  const _SettingsFooter({required this.onSave});

  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
      decoration: BoxDecoration(
        color: s.cardBg,
        border: Border(top: BorderSide(color: s.border)),
        boxShadow: [
          BoxShadow(
            color: s.shadowColor.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: s.elevatedBg,
              borderRadius: BorderRadius.circular(kPosButtonRadius),
              border: Border.all(color: s.border),
            ),
            child: Text(
              'v0.1.0',
              style: s.caption.copyWith(
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'Changes to theme and terminal settings apply immediately after save.',
              style: s.caption.copyWith(fontSize: 12),
            ),
          ),
          FilledButton.icon(
            onPressed: onSave,
            icon: const Icon(Icons.save_outlined, size: 18),
            label: const Text('Save all changes'),
            style: FilledButton.styleFrom(
              backgroundColor: context.posBrand.buttonPrimary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _CheckoutOptionsCard extends ConsumerWidget {
  const _CheckoutOptionsCard({
    required this.metaAsync,
    required this.checkout,
    required this.uiSettings,
    required this.posSettings,
    required this.refPrefixCtrl,
    required this.refSeqCtrl,
    required this.onCheckoutChanged,
    required this.onRefreshServerSettings,
  });

  final AsyncValue<PosLocalMeta> metaAsync;
  final PosCheckoutState checkout;
  final PosUiSettings uiSettings;
  final PosSettings? posSettings;
  final TextEditingController refPrefixCtrl;
  final TextEditingController refSeqCtrl;
  final ValueChanged<PosCheckoutState> onCheckoutChanged;
  final VoidCallback onRefreshServerSettings;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PosSettingsSectionCard(
      icon: Icons.tune_outlined,
      title: 'Checkout options',
      subtitle: 'Warehouse, defaults, tax, and reference numbering',
      child: metaAsync.when(
        data: (meta) => Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  DropdownButtonFormField<int>(
                    key: ValueKey(
                      checkout.warehouseId ??
                          ref.read(sessionServiceProvider).warehouseId,
                    ),
                    initialValue: checkout.warehouseId ??
                        ref.read(sessionServiceProvider).warehouseId,
                    decoration: InputDecoration(
                      labelText: 'Warehouse',
                      border: OutlineInputBorder(),
                    ),
                    items: meta.warehouses
                        .map(
                          (w) => DropdownMenuItem(
                            value: w.id,
                            child: Text(w.name),
                          ),
                        )
                        .toList(),
                    onChanged: (v) {
                      if (v == null) return;
                      onCheckoutChanged(checkout.copyWith(warehouseId: v));
                      ref.read(sessionServiceProvider).setWarehouseId(v);
                      reloadProductGrid(ref);
                    },
                  ),
                  SizedBox(height: 12),
                  DropdownButtonFormField<int?>(
                    key: ValueKey(
                      'default-customer-${uiSettings.defaultCustomerId}',
                    ),
                    initialValue: uiSettings.defaultCustomerId,
                    decoration: InputDecoration(
                      labelText: 'Default customer',
                      border: OutlineInputBorder(),
                    ),
                    items: [
                      const DropdownMenuItem<int?>(
                        value: null,
                        child: Text('Use server default'),
                      ),
                      ...meta.customers.map(
                        (c) => DropdownMenuItem(
                          value: c.id,
                          child: Text(c.name),
                        ),
                      ),
                    ],
                    onChanged: (v) async {
                      await ref.read(posUiSettingsProvider.notifier).patch(
                            (s) => v == null
                                ? s.copyWith(clearDefaultCustomerId: true)
                                : s.copyWith(defaultCustomerId: v),
                          );
                      final ui = ref.read(posUiSettingsProvider);
                      final settings =
                          await ref.read(posSettingsProvider.future);
                      final syncMeta =
                          await ref.read(appDatabaseProvider).getSyncMeta();
                      final session = ref.read(sessionServiceProvider);
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
                      onCheckoutChanged(
                        checkout.copyWith(customerId: parties.customerId),
                      );
                      if (parties.customerId != null) {
                        await session.setCustomerId(parties.customerId!);
                      }
                    },
                  ),
                  SizedBox(height: 12),
                  DropdownButtonFormField<int?>(
                    key: ValueKey(
                      'default-biller-${uiSettings.defaultBillerId}',
                    ),
                    initialValue: uiSettings.defaultBillerId,
                    decoration: InputDecoration(
                      labelText: 'Default biller',
                      border: OutlineInputBorder(),
                    ),
                    items: [
                      const DropdownMenuItem<int?>(
                        value: null,
                        child: Text('Use server default'),
                      ),
                      ...meta.billers.map(
                        (b) => DropdownMenuItem(
                          value: b.id,
                          child: Text(b.name),
                        ),
                      ),
                    ],
                    onChanged: (v) async {
                      await ref.read(posUiSettingsProvider.notifier).patch(
                            (s) => v == null
                                ? s.copyWith(clearDefaultBillerId: true)
                                : s.copyWith(defaultBillerId: v),
                          );
                      final ui = ref.read(posUiSettingsProvider);
                      final settings =
                          await ref.read(posSettingsProvider.future);
                      final syncMeta =
                          await ref.read(appDatabaseProvider).getSyncMeta();
                      final session = ref.read(sessionServiceProvider);
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
                      onCheckoutChanged(
                        checkout.copyWith(billerId: parties.billerId),
                      );
                      if (parties.billerId != null) {
                        await session.setBillerId(parties.billerId!);
                      }
                    },
                  ),
                  SizedBox(height: 12),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Enable tax'),
                    value: uiSettings.enableTax,
                    onChanged: (v) => ref
                        .read(posUiSettingsProvider.notifier)
                        .patch((s) => s.copyWith(enableTax: v)),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Enable shipping'),
                    value: uiSettings.enableShipping,
                    onChanged: (v) => ref
                        .read(posUiSettingsProvider.notifier)
                        .patch((s) => s.copyWith(enableShipping: v)),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Enable return'),
                    subtitle: const Text(
                      'Return sales and settle store credit at checkout',
                      style: TextStyle(fontSize: 12),
                    ),
                    value: uiSettings.enableReturn,
                    onChanged: (v) => ref
                        .read(posUiSettingsProvider.notifier)
                        .patch((s) => s.copyWith(enableReturn: v)),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Enable exchange'),
                    subtitle: const Text(
                      'Exchange returned items for new products on a sale',
                      style: TextStyle(fontSize: 12),
                    ),
                    value: uiSettings.enableExchange,
                    onChanged: (v) => ref
                        .read(posUiSettingsProvider.notifier)
                        .patch((s) => s.copyWith(enableExchange: v)),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Points payment'),
                    subtitle: const Text(
                      'Show Points tab in checkout payment',
                      style: TextStyle(fontSize: 12),
                    ),
                    value: uiSettings.enablePointsPayment,
                    onChanged: (v) => ref
                        .read(posUiSettingsProvider.notifier)
                        .patch((s) => s.copyWith(enablePointsPayment: v)),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Confirm quantity on add'),
                    subtitle: const Text(
                      'Show qty and unit discount modal when scanning or selecting a product',
                      style: TextStyle(fontSize: 12),
                    ),
                    value: uiSettings.enableAddItemModal,
                    onChanged: (v) => ref
                        .read(posUiSettingsProvider.notifier)
                        .patch((s) => s.copyWith(enableAddItemModal: v)),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('On-screen keyboard'),
                    value: uiSettings.enableKeyboard,
                    onChanged: (v) {
                      ref
                          .read(posUiSettingsProvider.notifier)
                          .patch((s) => s.copyWith(enableKeyboard: v));
                      if (!v) {
                        deferPosTouchKeyboardDetach(ref);
                      }
                    },
                  ),
                  SizedBox(height: 8),
                  TextField(
                    controller: refPrefixCtrl,
                    decoration: InputDecoration(
                      labelText: 'Sale reference prefix',
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (v) => ref
                        .read(posUiSettingsProvider.notifier)
                        .patch(
                          (s) => s.copyWith(saleReferencePrefix: v.trim()),
                        ),
                  ),
                  SizedBox(height: 10),
                  OutlinedButton(
                    onPressed: onRefreshServerSettings,
                    child: const Text('Refresh server POS settings'),
                  ),
                ],
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Text('$e'),
            ),
    );
  }
}
