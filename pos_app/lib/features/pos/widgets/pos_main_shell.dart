import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/app_providers.dart';
import '../../../core/providers/pos_connectivity_providers.dart';
import '../../../core/providers/pos_ui_settings_provider.dart';
import '../providers/pos_register_actions_provider.dart';
import 'pending_sync_dialog.dart';
import 'pos_brand_logo.dart';
import 'pos_register_header_bar.dart';
import 'pos_sidebar.dart';
import 'pos_top_header.dart';

/// Shared layout — station label + sidebar + common connectivity header + page.
class PosMainShell extends ConsumerStatefulWidget {
  const PosMainShell({
    super.key,
    required this.activeSection,
    required this.child,
    required this.onDashboard,
    required this.onRegister,
    required this.onInventory,
    required this.onPrintLastReceipt,
    required this.onCashRegisterDetails,
    required this.onStaff,
    required this.onHistory,
    required this.onSettings,
    required this.onProfile,
    required this.onLogout,
    this.busy = false,
    this.syncing = false,
  });

  final PosNavSection activeSection;
  final Widget child;
  final VoidCallback onDashboard;
  final VoidCallback onRegister;
  final VoidCallback onInventory;
  final VoidCallback onPrintLastReceipt;
  final VoidCallback onCashRegisterDetails;
  final VoidCallback onStaff;
  final VoidCallback onHistory;
  final VoidCallback onSettings;
  final VoidCallback onProfile;
  final VoidCallback onLogout;
  final bool busy;
  final bool syncing;

  @override
  ConsumerState<PosMainShell> createState() => _PosMainShellState();
}

class _PosMainShellState extends ConsumerState<PosMainShell>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) refreshPosLinkStatus(ref);
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      refreshPosLinkStatus(ref);
    }
  }

  void _fireRegisterAction(
    WidgetRef ref,
    StateProvider<int> triggerProvider,
  ) {
    void fire() {
      ref.read(triggerProvider.notifier).update((n) => n + 1);
    }

    if (widget.activeSection != PosNavSection.register) {
      widget.onRegister();
      WidgetsBinding.instance.addPostFrameCallback((_) => fire());
    } else {
      fire();
    }
  }

  @override
  Widget build(BuildContext context) {
    final linkStatus = ref.watch(posLinkStatusProvider);
    final resolvedStatus = linkStatus.when(
      data: (status) => status,
      loading: () => linkStatus.valueOrNull,
      error: (_, __) => linkStatus.valueOrNull ?? PosLinkStatus.offline,
    );
    final initialLoad = linkStatus.isLoading && !linkStatus.hasValue;
    final sidebarLogoPath =
        ref.watch(posUiSettingsProvider.select((s) => s.sidebarLogoPath));
    final uiSettings = ref.watch(posUiSettingsProvider);
    final pendingAsync = ref.watch(pendingSyncCountProvider);
    final pendingSyncCount = pendingAsync.valueOrNull ?? 0;
    final syncingSales = ref.watch(salesSyncInProgressProvider);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          width: 68,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 10, bottom: 6),
                child: PosBrandLogo(
                  logoPath: sidebarLogoPath,
                  size: 44,
                  variant: PosBrandLogoVariant.sidebar,
                ),
              ),
              Expanded(
                child: PosSidebar(
                  activeSection: widget.activeSection,
                  onDashboard: widget.onDashboard,
                  onRegister: widget.onRegister,
                  onInventory: widget.onInventory,
                  onPrintLastReceipt: widget.onPrintLastReceipt,
                  onCashRegisterDetails: widget.onCashRegisterDetails,
                  onStaff: widget.onStaff,
                  onHistory: widget.onHistory,
                  onSettings: widget.onSettings,
                  onProfile: widget.onProfile,
                  onLogout: widget.onLogout,
                  onReturn: uiSettings.enableReturn
                      ? () => _fireRegisterAction(
                            ref,
                            posReturnSaleTriggerProvider,
                          )
                      : null,
                  onExchange: uiSettings.enableExchange
                      ? () => _fireRegisterAction(
                            ref,
                            posExchangeSaleTriggerProvider,
                          )
                      : null,
                  onPendingSync: () => showPendingSyncDialog(
                    context: context,
                    ref: ref,
                  ),
                  pendingSyncCount: pendingSyncCount,
                  syncingSales: syncingSales,
                  busy: widget.busy,
                  syncing: widget.syncing,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              PosShellHeader(
                height: widget.activeSection == PosNavSection.register
                    ? 44
                    : null,
                leading: widget.activeSection == PosNavSection.register
                    ? const PosRegisterHeaderBar()
                    : null,
                status: resolvedStatus,
                loading: initialLoad,
                onRefresh: () => refreshPosLinkStatus(ref),
              ),
              Expanded(child: widget.child),
            ],
          ),
        ),
      ],
    );
  }
}
