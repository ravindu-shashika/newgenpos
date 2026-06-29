import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/app_providers.dart';
import '../../core/services/pos_window_service.dart';
import '../auth/login_screen.dart';
import 'pos_dashboard_screen.dart';
import 'pos_inventory_screen.dart';
import 'pos_screen.dart';
import 'pos_settings_screen.dart';
import 'pos_staff_screen.dart';
import 'providers/pos_nav_provider.dart';
import 'providers/pos_settings_subpage_provider.dart';
import 'services/cash_register_exit_guard.dart';
import 'services/dashboard_stats_service.dart';
import 'services/pos_sidebar_actions.dart';
import 'widgets/pos_main_shell.dart';
import 'widgets/pos_sidebar.dart';
import 'widgets/pos_professional_dialog.dart';
import 'widgets/pos_window_title_bar.dart';

/// Single host after login — persistent sidebar + sliding page content.
class PosAppShell extends ConsumerStatefulWidget {
  const PosAppShell({super.key});

  @override
  ConsumerState<PosAppShell> createState() => _PosAppShellState();
}

class _PosAppShellState extends ConsumerState<PosAppShell> {
  static const _pageBg = Color(0xFFF8F9FC);

  late final PageController _pageController;
  bool _pageSyncing = false;

  @override
  void initState() {
    super.initState();
    final initial = ref.read(posNavSectionProvider);
    _pageController = PageController(
      initialPage: posSectionPageIndex(initial),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await PosWindowService.instance.enterKioskMode();
      PosWindowService.instance.setBeforeExitHandler((ctx) async {
        if (!mounted) return false;
        return CashRegisterExitGuard.ensureClosed(ref: ref, context: ctx);
      });
    });
  }

  @override
  void dispose() {
    PosWindowService.instance.setBeforeExitHandler(null);
    _pageController.dispose();
    super.dispose();
  }

  void _selectSection(PosNavSection section) {
    if (section == PosNavSection.history) {
      unawaited(_showRecentTransactions());
      return;
    }
    ref.read(posNavSectionProvider.notifier).state = section;
    final target = posSectionPageIndex(section);
    if (_pageController.hasClients &&
        (_pageController.page?.round() ?? target) != target) {
      _pageSyncing = true;
      _pageController
          .animateToPage(
            target,
            duration: const Duration(milliseconds: 320),
            curve: Curves.easeInOutCubic,
          )
          .whenComplete(() {
        if (mounted) setState(() => _pageSyncing = false);
      });
    }
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

  Future<void> _showRecentTransactions() async {
    final db = ref.read(appDatabaseProvider);
    final stats = await DashboardStatsService(db).load();
    if (!mounted) return;
    await showRecentTransactionsDialog(
      context: context,
      transactions: stats.recentTransactions,
    );
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

    if (!await CashRegisterExitGuard.ensureClosed(ref: ref, context: context)) {
      return;
    }

    await PosWindowService.instance.exitKioskMode();
    await ref.read(sessionServiceProvider).clear();
    bumpSessionState(ref);
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final section = ref.watch(posNavSectionProvider);

    ref.listen<PosNavSection>(posNavSectionProvider, (previous, next) {
      if (next != PosNavSection.settings) {
        ref.read(posSettingsSubPageProvider.notifier).state =
            PosSettingsSubPage.main;
      }
      if (_pageSyncing || previous == next) return;
      final target = posSectionPageIndex(next);
      if (next == PosNavSection.history) return;
      if (!_pageController.hasClients) return;
      if ((_pageController.page?.round() ?? target) == target) return;
      _pageSyncing = true;
      _pageController
          .animateToPage(
            target,
            duration: const Duration(milliseconds: 320),
            curve: Curves.easeInOutCubic,
          )
          .whenComplete(() {
        if (mounted) setState(() => _pageSyncing = false);
      });
    });

    return Scaffold(
      backgroundColor: _pageBg,
      body: ValueListenableBuilder<bool>(
        valueListenable: PosWindowService.instance.kioskActiveNotifier,
        builder: (context, kioskActive, _) {
          final shell = PosMainShell(
            activeSection: section,
            onDashboard: () => _selectSection(PosNavSection.dashboard),
            onRegister: () => _selectSection(PosNavSection.register),
            onInventory: () => _selectSection(PosNavSection.inventory),
            onPrintLastReceipt: () => unawaited(
              PosSidebarActions.printLastReceipt(context: context, ref: ref),
            ),
            onCashRegisterDetails: () => unawaited(
              PosSidebarActions.showCashRegisterDetails(
                context: context,
                ref: ref,
              ),
            ),
            onStaff: () => _selectSection(PosNavSection.staff),
            onHistory: () => _selectSection(PosNavSection.history),
            onSettings: () => _selectSection(PosNavSection.settings),
            onProfile: _showOperatorProfile,
            onLogout: _logout,
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              onPageChanged: (index) {
                if (_pageSyncing) return;
                final mapped = posPageIndexSection(index);
                final current = ref.read(posNavSectionProvider);
                if (current == PosNavSection.history) return;
                if (current != mapped) {
                  ref.read(posNavSectionProvider.notifier).state = mapped;
                }
              },
              children: const [
                _ShellPage(child: PosDashboardScreen(embedded: true)),
                _ShellPage(child: PosScreen(embedded: true)),
                _ShellPage(child: PosInventoryScreen(embedded: true)),
                _ShellPage(child: PosStaffScreen(embedded: true)),
                _ShellPage(child: PosSettingsScreen(embedded: true)),
              ],
            ),
          );

          if (!PosWindowService.isSupported || !kioskActive) {
            return shell;
          }

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const PosWindowTitleBar(),
              Expanded(child: shell),
            ],
          );
        },
      ),
    );
  }
}

/// Keeps page state alive when switching sidebar sections.
class _ShellPage extends StatefulWidget {
  const _ShellPage({required this.child});

  final Widget child;

  @override
  State<_ShellPage> createState() => _ShellPageState();
}

class _ShellPageState extends State<_ShellPage>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return widget.child;
  }
}
