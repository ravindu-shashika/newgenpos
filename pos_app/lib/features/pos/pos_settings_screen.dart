import 'dart:async';
import 'dart:math' as math;

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/app_providers.dart';
import '../../core/providers/local_print_settings_provider.dart';
import '../../core/providers/pos_meta_provider.dart';
import '../../core/providers/pos_ui_settings_provider.dart';
import '../../core/providers/product_grid_provider.dart';
import '../../core/services/pos_window_service.dart';
import '../../core/sync/download_models.dart';
import '../../core/theme/pos_theme.dart';
import '../auth/download_screen.dart';
import '../auth/login_screen.dart';
import 'models/pos_settings.dart';
import 'models/pos_ui_settings.dart';
import 'pos_checkout_state.dart';
import 'pos_printer_settings_screen.dart';
import 'pos_server_settings_screen.dart';
import 'providers/pos_settings_subpage_provider.dart';
import 'widgets/pos_brand_logo.dart';
import 'widgets/pos_color_preset_picker.dart';
import 'widgets/pos_printer_settings_card.dart';
import 'widgets/pos_server_settings_card.dart';
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
  bool _advancedOpen = false;

  final _refPrefixCtrl = TextEditingController();
  final _refSeqCtrl = TextEditingController();

  static const _pageBg = Color(0xFFF8F9FC);

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

  String get _stationCode {
    final code = ref.read(sessionServiceProvider).terminalCode?.trim();
    if (code != null && code.isNotEmpty) return code.toUpperCase();
    return 'STATION 01';
  }

  String get _userInitials {
    final name = ref.read(sessionServiceProvider).userName?.trim();
    if (name == null || name.isEmpty) return 'TA';
    final parts = name.split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
    final list = parts.toList();
    if (list.length >= 2) {
      return '${list.first[0]}${list[1][0]}'.toUpperCase();
    }
    return name.substring(0, math.min(2, name.length)).toUpperCase();
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
    final brand = context.posBrand;

    _syncReferenceFields(uiSettings);

    final content = Column(
      children: [
        Expanded(
          child: _busy
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.fromLTRB(28, 24, 28, 28),
                  children: [
                    PosSettingsPageHeader(
                      title: 'Settings',
                      subtitle:
                          'Configure terminal identity, appearance, and maintenance',
                      badges: [
                        PosSettingsBadge(
                          icon: Icons.storefront_outlined,
                          label: session.terminalCode?.trim().toUpperCase() ??
                              'TERMINAL',
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
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final wide = constraints.maxWidth >= 900;
                        final stats = _SettingsStatsRow(
                          stationId: session.terminalCode?.trim().toUpperCase() ??
                              '—',
                          location: session.terminalName?.trim().isNotEmpty == true
                              ? session.terminalName!.trim()
                              : 'Not set',
                          warehouse: () {
                            final list = metaAsync.valueOrNull?.warehouses
                                .where((w) => w.id == session.warehouseId);
                            if (list == null || list.isEmpty) return '—';
                            return list.first.name;
                          }(),
                        );
                        final primaryColumn = Column(
                          children: [
                            stats,
                            const SizedBox(height: 16),
                            _TerminalIdentityCard(
                              stationId: session.terminalCode?.trim().toUpperCase() ??
                                  '—',
                              location: session.terminalName?.trim().isNotEmpty == true
                                  ? session.terminalName!.trim()
                                  : 'Not set',
                            ),
                            const SizedBox(height: 16),
                            _VisualsCard(
                              uiSettings: uiSettings,
                              onPatch: (fn) => ref
                                  .read(posUiSettingsProvider.notifier)
                                  .patch(fn),
                            ),
                            const SizedBox(height: 16),
                            _SidebarLogoCard(
                              logoPath: uiSettings.sidebarLogoPath,
                              onPick: () => unawaited(_pickSidebarLogo()),
                              onRemove: () => ref
                                  .read(posUiSettingsProvider.notifier)
                                  .patch(
                                    (s) => s.copyWith(clearSidebarLogo: true),
                                  ),
                            ),
                          ],
                        );
                        final secondaryColumn = Column(
                          children: [
                            _MaintenanceCard(
                              onRefresh: () =>
                                  unawaited(_openSync(PosDownloadMode.delta)),
                              onFullDownload: () =>
                                  unawaited(_openSync(PosDownloadMode.full)),
                              onReboot: () => unawaited(_rebootStation()),
                              onLogout: _logout,
                            ),
                            const SizedBox(height: 16),
                            _AdvancedSettingsCard(
                              open: _advancedOpen,
                              onToggle: () => setState(
                                () => _advancedOpen = !_advancedOpen,
                              ),
                              metaAsync: metaAsync,
                              checkout: checkout,
                              uiSettings: uiSettings,
                              posSettings: posSettings,
                              refPrefixCtrl: _refPrefixCtrl,
                              refSeqCtrl: _refSeqCtrl,
                              onCheckoutChanged: (s) => ref
                                  .read(posCheckoutProvider.notifier)
                                  .state = s,
                              onRefreshServerSettings: () =>
                                  unawaited(_refreshPosSettings()),
                            ),
                          ],
                        );
                        if (wide) {
                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(flex: 3, child: primaryColumn),
                              const SizedBox(width: 20),
                              Expanded(flex: 2, child: secondaryColumn),
                            ],
                          );
                        }
                        return Column(
                          children: [
                            primaryColumn,
                            const SizedBox(height: 16),
                            secondaryColumn,
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                    PosServerSettingsCard(accentColor: brand.primary),
                    const SizedBox(height: 16),
                    PosPrinterSettingsCard(accentColor: brand.primary),
                  ],
                ),
        ),
        _SettingsFooter(onSave: _saveAll),
      ],
    );

    if (widget.embedded) {
      return PosTouchKeyboardHost(child: content);
    }

    return PosTouchKeyboardHost(
      child: Scaffold(
        backgroundColor: _pageBg,
        body: content,
      ),
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
          const SizedBox(height: 14),
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
    return InputDecorator(
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: PosColors.pageBg,
        enabled: false,
        prefixIcon: prefixIcon != null ? Icon(prefixIcon) : null,
        suffixIcon: Icon(
          Icons.lock_outline,
          size: 18,
          color: PosColors.textMuted.withValues(alpha: 0.8),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(kPosButtonRadius),
          borderSide: const BorderSide(color: PosColors.border),
        ),
      ),
      child: Text(
        value,
        style: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: PosColors.textPrimary,
        ),
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
          const SizedBox(height: 20),
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
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
            ),
          const SizedBox(height: 20),
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
              const SizedBox(width: 12),
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
          const SizedBox(height: 20),
          const Text(
            'Font Size',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          ),
          Row(
            children: [
              const Text('A', style: TextStyle(fontSize: 12)),
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
              const Text('A', style: TextStyle(fontSize: 18)),
            ],
          ),
          const SizedBox(height: 8),
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
              variant: PosBrandLogoVariant.light,
            ),
          ),
          const SizedBox(height: 16),
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
                const SizedBox(width: 8),
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
    final brand = context.posBrand;
    return Material(
      color: light ? Colors.white : const Color(0xFF1A2B56),
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
              color: selected ? brand.primary : PosColors.border,
              width: selected ? 2 : 1,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: light ? PosColors.textPrimary : Colors.white,
            ),
          ),
        ),
      ),
    );
  }
}

class _MaintenanceCard extends StatelessWidget {
  const _MaintenanceCard({
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
    return PosSettingsSectionCard(
      icon: Icons.build_circle_outlined,
      title: 'Maintenance',
      subtitle: 'Sync catalog data and manage this terminal',
      child: Column(
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
      ),
    );
  }
}

class _SettingsFooter extends StatelessWidget {
  const _SettingsFooter({required this.onSave});

  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    final brand = context.posBrand;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: PosColors.border)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
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
              color: PosColors.pageBg,
              borderRadius: BorderRadius.circular(kPosButtonRadius),
              border: Border.all(color: PosColors.border),
            ),
            child: const Text(
              'v0.1.0',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: PosColors.textMuted,
              ),
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Changes to theme and terminal settings apply immediately after save.',
              style: TextStyle(fontSize: 12, color: PosColors.textMuted),
            ),
          ),
          FilledButton.icon(
            onPressed: onSave,
            icon: const Icon(Icons.save_outlined, size: 18),
            label: const Text('Save all changes'),
            style: FilledButton.styleFrom(
              backgroundColor: brand.buttonPrimary,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _AdvancedSettingsCard extends ConsumerWidget {
  const _AdvancedSettingsCard({
    required this.open,
    required this.onToggle,
    required this.metaAsync,
    required this.checkout,
    required this.uiSettings,
    required this.posSettings,
    required this.refPrefixCtrl,
    required this.refSeqCtrl,
    required this.onCheckoutChanged,
    required this.onRefreshServerSettings,
  });

  final bool open;
  final VoidCallback onToggle;
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
      title: 'Advanced options',
      subtitle: 'Warehouse, defaults, tax, and reference numbering',
      trailing: IconButton(
        tooltip: open ? 'Collapse' : 'Expand',
        onPressed: onToggle,
        icon: Icon(open ? Icons.expand_less : Icons.expand_more),
      ),
      child: open
          ? metaAsync.when(
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
                    decoration: const InputDecoration(
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
                  const SizedBox(height: 12),
                  DropdownButtonFormField<int?>(
                    key: ValueKey(
                      'default-customer-${uiSettings.defaultCustomerId}',
                    ),
                    initialValue: uiSettings.defaultCustomerId,
                    decoration: const InputDecoration(
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
                      if (v != null) {
                        onCheckoutChanged(checkout.copyWith(customerId: v));
                        ref.read(sessionServiceProvider).setCustomerId(v);
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<int?>(
                    key: ValueKey(
                      'default-biller-${uiSettings.defaultBillerId}',
                    ),
                    initialValue: uiSettings.defaultBillerId,
                    decoration: const InputDecoration(
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
                      if (v != null) {
                        onCheckoutChanged(checkout.copyWith(billerId: v));
                        ref.read(sessionServiceProvider).setBillerId(v);
                      }
                    },
                  ),
                  const SizedBox(height: 12),
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
                  const SizedBox(height: 8),
                  TextField(
                    controller: refPrefixCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Sale reference prefix',
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (v) => ref
                        .read(posUiSettingsProvider.notifier)
                        .patch(
                          (s) => s.copyWith(saleReferencePrefix: v.trim()),
                        ),
                  ),
                  const SizedBox(height: 10),
                  OutlinedButton(
                    onPressed: onRefreshServerSettings,
                    child: const Text('Refresh server POS settings'),
                  ),
                ],
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Text('$e'),
            )
          : Text(
              'Tap expand to configure warehouse, tax, return, exchange, keyboard, and sale reference options.',
              style: TextStyle(
                color: PosColors.textMuted.withValues(alpha: 0.95),
                fontSize: 13,
                height: 1.45,
              ),
            ),
    );
  }
}
