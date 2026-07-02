import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/app_providers.dart';
import '../../core/services/pos_window_service.dart';
import '../../core/sync/download_models.dart';
import '../../core/theme/pos_theme.dart';
import '../auth/download_screen.dart';
import '../auth/login_screen.dart';
import 'models/inventory_models.dart';
import 'pos_currency.dart';
import 'services/inventory_service.dart';
import 'widgets/pos_professional_dialog.dart';
import 'widgets/show_pos_dialog.dart';

final inventorySummaryProvider =
    FutureProvider.autoDispose<InventorySummary>((ref) async {
  final db = ref.watch(appDatabaseProvider);
  final warehouseId = ref.watch(sessionServiceProvider).warehouseId;
  return InventoryService(db).loadSummary(warehouseId: warehouseId);
});

final inventoryListProvider = FutureProvider.autoDispose
    .family<InventoryListPage, InventoryListQuery>((ref, query) async {
  final db = ref.watch(appDatabaseProvider);
  final warehouseId = ref.watch(sessionServiceProvider).warehouseId;
  return InventoryService(db).loadPage(
    warehouseId: warehouseId,
    search: query.search,
    offset: query.page * query.pageSize,
    limit: query.pageSize,
  );
});

class PosInventoryScreen extends ConsumerStatefulWidget {
  const PosInventoryScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  ConsumerState<PosInventoryScreen> createState() => _PosInventoryScreenState();
}

class _PosInventoryScreenState extends ConsumerState<PosInventoryScreen> {
  final _searchCtrl = TextEditingController();
  String _searchDraft = '';
  String _searchQuery = '';
  int _page = 0;
  static const _pageSize = 4;
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    _searchCtrl.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    final value = _searchCtrl.text;
    if (value == _searchDraft) return;
    setState(() => _searchDraft = value);
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 220), () {
      if (!mounted) return;
      setState(() {
        _searchQuery = _searchDraft.trim();
        _page = 0;
      });
    });
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchCtrl.removeListener(_onSearchChanged);
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    ref.invalidate(inventorySummaryProvider);
    ref.invalidate(inventoryListProvider);
    await Future.wait([
      ref.read(inventorySummaryProvider.future),
      ref.read(
        inventoryListProvider(
          InventoryListQuery(
            search: _searchQuery,
            page: _page,
            pageSize: _pageSize,
          ),
        ).future,
      ),
    ]);
  }

  Future<void> _syncCatalog(PosDownloadMode mode) async {
    final online = await ref.read(syncServiceProvider).probeOnline();
    if (!mounted) return;
    if (!online) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Connect to internet to sync inventory')),
      );
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
      await _refresh();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            mode == PosDownloadMode.full
                ? 'Inventory fully re-downloaded'
                : 'Inventory synced',
          ),
        ),
      );
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

  String get _stationCode {
    final code = ref.read(sessionServiceProvider).terminalCode?.trim();
    if (code != null && code.isNotEmpty) return code.toUpperCase();
    return 'STATION 01';
  }

  String get _terminalTitle {
    final session = ref.read(sessionServiceProvider);
    final name = session.terminalName?.trim();
    if (name != null && name.isNotEmpty) return name;
    return 'Precision Terminal';
  }

  String get _userInitials {
    final name = ref.read(sessionServiceProvider).userName?.trim();
    if (name == null || name.isEmpty) return 'OP';
    final parts = name.split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
    final list = parts.toList();
    if (list.length >= 2) {
      return '${list.first[0]}${list[1][0]}'.toUpperCase();
    }
    return name.substring(0, math.min(2, name.length)).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final summaryAsync = ref.watch(inventorySummaryProvider);
    final listQuery = InventoryListQuery(
      search: _searchQuery,
      page: _page,
      pageSize: _pageSize,
    );
    final listAsync = ref.watch(inventoryListProvider(listQuery));

    final content = Column(
      children: [
        Expanded(
          child: summaryAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Failed to load: $e')),
            data: (summary) {
              return listAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Failed to load: $e')),
                data: (listPage) {
                  final pageCount = listPage.totalCount == 0
                      ? 1
                      : ((listPage.totalCount - 1) / _pageSize).floor() + 1;
                  final safePage = _page.clamp(0, pageCount - 1);
                  if (safePage != _page) {
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      if (mounted) setState(() => _page = safePage);
                    });
                  }

                  return RefreshIndicator(
                    onRefresh: _refresh,
                    color: context.posBrand.primary,
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(28, 20, 28, 28),
                      children: [
                        _InventorySearchBar(controller: _searchCtrl),
                        SizedBox(height: 16),
                        _SummaryRow(
                          summary: summary,
                          onSync: () =>
                              unawaited(_syncCatalog(PosDownloadMode.delta)),
                          onFullDownload: () =>
                              unawaited(_syncCatalog(PosDownloadMode.full)),
                        ),
                        SizedBox(height: 20),
                        _InventoryTable(
                          rows: listPage.items,
                          totalCount: listPage.totalCount,
                          page: safePage,
                          pageSize: _pageSize,
                          pageCount: pageCount,
                          onPageChanged: (p) => setState(() => _page = p),
                        ),
                      ],
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );

    if (widget.embedded) {
      return Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        body: content,
      );
    }

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: content,
    );
  }
}

class _InventorySearchBar extends StatelessWidget {
  const _InventorySearchBar({required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      decoration: InputDecoration(
        hintText: 'Search product name or SKU...',
        prefixIcon: const Icon(Icons.search, size: 20),
        filled: true,
        fillColor: Theme.of(context).colorScheme.surfaceContainerHighest,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide(color: Theme.of(context).dividerColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide(color: Theme.of(context).dividerColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide(color: context.posBrand.primary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(vertical: 0),
        isDense: true,
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.summary,
    required this.onSync,
    required this.onFullDownload,
  });

  final InventorySummary summary;
  final VoidCallback onSync;
  final VoidCallback onFullDownload;

  @override
  Widget build(BuildContext context) {
    final styles = context.posStyles;
    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 900;
        final cards = [
          _StatCard(
            label: 'TOTAL ITEMS',
            value: '${summary.totalItems}',
            subtext: '${summary.recentUpdateCount} synced locally',
            valueColor: styles.accent,
          ),
          _StatCard(
            label: 'LOW STOCK ALERTS',
            value: summary.lowStockCount.toString().padLeft(2, '0'),
            subtext: summary.lowStockCount == 0
                ? 'All items above threshold'
                : '${summary.lowStockCount} need attention',
            valueColor:
                summary.lowStockCount > 0 ? styles.danger : styles.text,
            progress: summary.totalItems <= 0
                ? 0
                : summary.inStockCount / summary.totalItems,
          ),
          _AdminCard(onSync: onSync, onFullDownload: onFullDownload),
        ];

        if (wide) {
          return Row(
            children: [
              Expanded(child: cards[0]),
              SizedBox(width: 16),
              Expanded(child: cards[1]),
              SizedBox(width: 16),
              Expanded(flex: 2, child: cards[2]),
            ],
          );
        }
        return Column(
          children: [
            cards[0],
            SizedBox(height: 12),
            cards[1],
            SizedBox(height: 12),
            cards[2],
          ],
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.subtext,
    this.valueColor,
    this.progress,
  });

  final String label;
  final String value;
  final String subtext;
  final Color? valueColor;
  final double? progress;

  @override
  Widget build(BuildContext context) {
    final styles = context.posStyles;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: styles.cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: styles.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: styles.textMuted,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w800,
              color: valueColor ?? styles.text,
              height: 1,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtext,
            style: styles.caption,
          ),
          if (progress != null) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress!.clamp(0, 1),
                minHeight: 6,
                backgroundColor: styles.inputFill,
                color: styles.accent,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _AdminCard extends StatelessWidget {
  const _AdminCard({
    required this.onSync,
    required this.onFullDownload,
  });

  final VoidCallback onSync;
  final VoidCallback onFullDownload;

  @override
  Widget build(BuildContext context) {
    final styles = context.posStyles;
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: context.posBrand.primary,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Catalog Actions',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: styles.onBrand,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Sync stock levels from the server or re-download the full product catalog.',
            style: TextStyle(
              fontSize: 13,
              color: styles.onBrandMuted,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 8,
            children: [
              FilledButton(
                onPressed: onSync,
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: context.posBrand.primary,
                ),
                child: const Text('Sync Inventory'),
              ),
              OutlinedButton(
                onPressed: onFullDownload,
                style: OutlinedButton.styleFrom(
                  foregroundColor: styles.onBrand,
                  side: BorderSide(color: styles.onBrandMuted),
                ),
                child: const Text('Full Re-download'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InventoryTable extends StatelessWidget {
  const _InventoryTable({
    required this.rows,
    required this.totalCount,
    required this.page,
    required this.pageSize,
    required this.pageCount,
    required this.onPageChanged,
  });

  final List<InventoryItemRow> rows;
  final int totalCount;
  final int page;
  final int pageSize;
  final int pageCount;
  final ValueChanged<int> onPageChanged;

  @override
  Widget build(BuildContext context) {
    final styles = context.posStyles;
    final start = totalCount == 0 ? 0 : page * pageSize + 1;
    final end = math.min((page + 1) * pageSize, totalCount);

    return Container(
      decoration: BoxDecoration(
        color: styles.cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: styles.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              color: styles.elevatedBg,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(11),
              ),
            ),
            child: const Row(
              children: [
                Expanded(flex: 4, child: _HeaderCell('PRODUCT NAME')),
                Expanded(flex: 2, child: _HeaderCell('SKU / ID')),
                Expanded(flex: 2, child: _HeaderCell('CATEGORY')),
                Expanded(flex: 3, child: _HeaderCell('STOCK STATUS')),
                Expanded(flex: 2, child: _HeaderCell('PRICE')),
              ],
            ),
          ),
          if (rows.isEmpty)
            Padding(
              padding: EdgeInsets.all(40),
              child: Text(
                'No products synced yet. Run a full POS data download.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            )
          else
            for (final row in rows) _InventoryTableRow(row: row),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
            child: Row(
              children: [
                Text(
                  totalCount == 0
                      ? 'No products'
                      : 'Showing $start-$end of $totalCount Products',
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const Spacer(),
                _Pagination(
                  page: page,
                  pageCount: pageCount,
                  onChanged: onPageChanged,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeaderCell extends StatelessWidget {
  const _HeaderCell(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: context.posStyles.caption.copyWith(
        fontSize: 10,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.5,
      ),
    );
  }
}

class _InventoryTableRow extends StatelessWidget {
  const _InventoryTableRow({required this.row});

  final InventoryItemRow row;

  @override
  Widget build(BuildContext context) {
    final styles = context.posStyles;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: styles.border)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            flex: 4,
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: context.posSurface.productIconBg,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Icons.inventory_2_outlined,
                    size: 20,
                    color: styles.accent,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        row.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: styles.body.copyWith(fontWeight: FontWeight.w700),
                      ),
                      Text(
                        row.code,
                        style: styles.caption,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              row.code,
              style: styles.body.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(row.categoryName, style: styles.body),
          ),
          Expanded(
            flex: 3,
            child: _StockStatus(
              status: row.status,
              label: row.statusLabel,
              detail: row.statusDetail,
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              formatPosMoney(row.price),
              style: styles.productPrice.copyWith(fontSize: 15),
            ),
          ),
        ],
      ),
    );
  }
}

class _StockStatus extends StatelessWidget {
  const _StockStatus({
    required this.status,
    required this.label,
    required this.detail,
  });

  final InventoryStockStatus status;
  final String label;
  final String detail;

  @override
  Widget build(BuildContext context) {
    final styles = context.posStyles;
    final Color dotColor;
    final Color textColor;
    switch (status) {
      case InventoryStockStatus.inStock:
        dotColor = styles.success;
        textColor = styles.success;
      case InventoryStockStatus.lowStock:
        dotColor = const Color(0xFFFFB74D);
        textColor = styles.isDark
            ? const Color(0xFFFFCC80)
            : const Color(0xFFE65100);
      case InventoryStockStatus.outOfStock:
        dotColor = styles.textMuted;
        textColor = styles.textMuted;
    }

    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
        ),
        SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: textColor,
                ),
              ),
              Text(
                detail,
                style: styles.caption,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Pagination extends StatelessWidget {
  const _Pagination({
    required this.page,
    required this.pageCount,
    required this.onChanged,
  });

  final int page;
  final int pageCount;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final window = math.min(5, pageCount);
    final startPage = pageCount <= window
        ? 0
        : math.max(0, math.min(page - 2, pageCount - window));

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _pageBtn(
          context,
          icon: Icons.chevron_left,
          onTap: page > 0 ? () => onChanged(page - 1) : null,
        ),
        for (var i = startPage; i < startPage + window; i++) ...[
          SizedBox(width: 4),
          _pageNum(context, i, active: i == page),
        ],
        SizedBox(width: 4),
        _pageBtn(
          context,
          icon: Icons.chevron_right,
          onTap: page < pageCount - 1 ? () => onChanged(page + 1) : null,
        ),
      ],
    );
  }

  Widget _pageNum(BuildContext context, int index, {required bool active}) {
    return Material(
      color: active ? context.posBrand.primary : Colors.transparent,
      borderRadius: BorderRadius.circular(6),
      child: InkWell(
        onTap: () => onChanged(index),
        borderRadius: BorderRadius.circular(6),
        child: SizedBox(
          width: 32,
          height: 32,
          child: Center(
            child: Text(
              '${index + 1}',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: active ? Colors.white : Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _pageBtn(BuildContext context, {required IconData icon, VoidCallback? onTap}) {
    final styles = context.posStyles;
    return Material(
      color: styles.inputFill,
      borderRadius: BorderRadius.circular(6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: SizedBox(
          width: 32,
          height: 32,
          child: Icon(icon, size: 18, color: styles.textMuted),
        ),
      ),
    );
  }
}
