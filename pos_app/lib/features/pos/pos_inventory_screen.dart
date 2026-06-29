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

final inventoryOverviewProvider =
    FutureProvider.autoDispose<InventoryOverview>((ref) async {
  final db = ref.watch(appDatabaseProvider);
  final warehouseId = ref.watch(sessionServiceProvider).warehouseId;
  return InventoryService(db).load(warehouseId: warehouseId);
});

class PosInventoryScreen extends ConsumerStatefulWidget {
  const PosInventoryScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  ConsumerState<PosInventoryScreen> createState() => _PosInventoryScreenState();
}

class _PosInventoryScreenState extends ConsumerState<PosInventoryScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';
  int _page = 0;
  static const _pageSize = 4;

  static const _pageBg = Color(0xFFF8F9FC);

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    ref.invalidate(inventoryOverviewProvider);
    await ref.read(inventoryOverviewProvider.future);
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

  void _showProductInfo() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Add or edit products on the server, then sync POS data to this terminal.',
        ),
      ),
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

  List<InventoryItemRow> _filter(List<InventoryItemRow> rows) {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return rows;
    return rows
        .where((r) =>
            r.name.toLowerCase().contains(q) ||
            r.code.toLowerCase().contains(q) ||
            r.categoryName.toLowerCase().contains(q))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final overviewAsync = ref.watch(inventoryOverviewProvider);

    final content = Column(
      children: [
        Expanded(
          child: overviewAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Failed to load: $e')),
            data: (overview) {
              final filtered = _filter(overview.items);
              final pageCount = filtered.isEmpty
                  ? 1
                  : ((filtered.length - 1) / _pageSize).floor() + 1;
              final safePage = _page.clamp(0, pageCount - 1);
              if (safePage != _page) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) setState(() => _page = safePage);
                });
              }
              final start = safePage * _pageSize;
              final end = math.min(start + _pageSize, filtered.length);
              final pageRows = filtered.isEmpty
                  ? <InventoryItemRow>[]
                  : filtered.sublist(start, end);

              return RefreshIndicator(
                onRefresh: _refresh,
                color: PosColors.primary,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(28, 20, 28, 88),
                  children: [
                    _InventorySearchBar(
                      controller: _searchCtrl,
                      onChanged: (v) => setState(() {
                        _query = v;
                        _page = 0;
                      }),
                    ),
                    const SizedBox(height: 16),
                    _SummaryRow(
                      overview: overview,
                      onSync: () =>
                          unawaited(_syncCatalog(PosDownloadMode.delta)),
                      onFullDownload: () =>
                          unawaited(_syncCatalog(PosDownloadMode.full)),
                    ),
                    const SizedBox(height: 20),
                    _InventoryTable(
                      rows: pageRows,
                      totalCount: filtered.length,
                      page: safePage,
                      pageCount: pageCount,
                      onPageChanged: (p) => setState(() => _page = p),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );

    final fab = FloatingActionButton(
      onPressed: _showProductInfo,
      backgroundColor: PosColors.primary,
      child: const Icon(Icons.add_box_outlined, color: Colors.white),
    );

    if (widget.embedded) {
      return Scaffold(
        backgroundColor: _pageBg,
        floatingActionButton: fab,
        body: content,
      );
    }

    return Scaffold(
      backgroundColor: _pageBg,
      floatingActionButton: fab,
      body: content,
    );
  }
}

class _InventorySearchBar extends StatelessWidget {
  const _InventorySearchBar({
    required this.controller,
    required this.onChanged,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: 'Search product name or SKU...',
        prefixIcon: const Icon(Icons.search, size: 20),
        filled: true,
        fillColor: PosColors.searchFill,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: const BorderSide(color: PosColors.searchBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: const BorderSide(color: PosColors.searchBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: const BorderSide(color: PosColors.primary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(vertical: 0),
        isDense: true,
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.overview,
    required this.onSync,
    required this.onFullDownload,
  });

  final InventoryOverview overview;
  final VoidCallback onSync;
  final VoidCallback onFullDownload;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 900;
        final cards = [
          _StatCard(
            label: 'TOTAL ITEMS',
            value: '${overview.totalItems}',
            subtext: '${overview.recentUpdateCount} synced locally',
            valueColor: PosColors.blue,
          ),
          _StatCard(
            label: 'LOW STOCK ALERTS',
            value: overview.lowStockCount.toString().padLeft(2, '0'),
            subtext: overview.lowStockCount == 0
                ? 'All items above threshold'
                : '${overview.lowStockCount} need attention',
            valueColor: overview.lowStockCount > 0
                ? const Color(0xFFE65100)
                : PosColors.textPrimary,
            progress: overview.totalItems <= 0
                ? 0
                : overview.inStockCount / overview.totalItems,
          ),
          _AdminCard(onSync: onSync, onFullDownload: onFullDownload),
        ];

        if (wide) {
          return Row(
            children: [
              Expanded(child: cards[0]),
              const SizedBox(width: 16),
              Expanded(child: cards[1]),
              const SizedBox(width: 16),
              Expanded(flex: 2, child: cards[2]),
            ],
          );
        }
        return Column(
          children: [
            cards[0],
            const SizedBox(height: 12),
            cards[1],
            const SizedBox(height: 12),
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
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: PosColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: PosColors.textMuted,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w800,
              color: valueColor ?? PosColors.textPrimary,
              height: 1,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtext,
            style: const TextStyle(fontSize: 12, color: PosColors.textMuted),
          ),
          if (progress != null) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress!.clamp(0, 1),
                minHeight: 6,
                backgroundColor: const Color(0xFFE5E9F2),
                color: PosColors.primary,
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
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: PosColors.primary,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Catalog Actions',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Sync stock levels from the server or re-download the full product catalog.',
            style: TextStyle(
              fontSize: 13,
              color: Colors.white.withValues(alpha: 0.85),
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
                  foregroundColor: PosColors.primary,
                ),
                child: const Text('Sync Inventory'),
              ),
              OutlinedButton(
                onPressed: onFullDownload,
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: Colors.white70),
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
    required this.pageCount,
    required this.onPageChanged,
  });

  final List<InventoryItemRow> rows;
  final int totalCount;
  final int page;
  final int pageCount;
  final ValueChanged<int> onPageChanged;

  @override
  Widget build(BuildContext context) {
    final start = totalCount == 0 ? 0 : page * 4 + 1;
    final end = math.min((page + 1) * 4, totalCount);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: PosColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              color: PosColors.primaryLight.withValues(alpha: 0.5),
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
            const Padding(
              padding: EdgeInsets.all(40),
              child: Text(
                'No products synced yet. Run a full POS data download.',
                textAlign: TextAlign.center,
                style: TextStyle(color: PosColors.textMuted),
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
                  style: const TextStyle(
                    fontSize: 12,
                    color: PosColors.textMuted,
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
      style: const TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.5,
        color: PosColors.textMuted,
      ),
    );
  }
}

class _InventoryTableRow extends StatelessWidget {
  const _InventoryTableRow({required this.row});

  final InventoryItemRow row;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: PosColors.border)),
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
                    color: PosColors.productIconBg,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Icons.inventory_2_outlined,
                    size: 20,
                    color: PosColors.primary.withValues(alpha: 0.7),
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
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        row.code,
                        style: const TextStyle(
                          fontSize: 12,
                          color: PosColors.textMuted,
                        ),
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
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(row.categoryName, style: const TextStyle(fontSize: 13)),
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
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 15,
                color: PosColors.blue,
              ),
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
    final Color dotColor;
    final Color textColor;
    switch (status) {
      case InventoryStockStatus.inStock:
        dotColor = const Color(0xFF43A047);
        textColor = const Color(0xFF2E7D32);
      case InventoryStockStatus.lowStock:
        dotColor = const Color(0xFFFF9800);
        textColor = const Color(0xFFE65100);
      case InventoryStockStatus.outOfStock:
        dotColor = PosColors.textMuted;
        textColor = PosColors.textMuted;
    }

    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
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
                style: const TextStyle(
                  fontSize: 11,
                  color: PosColors.textMuted,
                ),
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
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _pageBtn(
          icon: Icons.chevron_left,
          onTap: page > 0 ? () => onChanged(page - 1) : null,
        ),
        for (var i = 0; i < pageCount && i < 5; i++) ...[
          const SizedBox(width: 4),
          _pageNum(i, active: i == page),
        ],
        const SizedBox(width: 4),
        _pageBtn(
          icon: Icons.chevron_right,
          onTap: page < pageCount - 1 ? () => onChanged(page + 1) : null,
        ),
      ],
    );
  }

  Widget _pageNum(int index, {required bool active}) {
    return Material(
      color: active ? PosColors.primary : Colors.transparent,
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
                color: active ? Colors.white : PosColors.textMuted,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _pageBtn({required IconData icon, VoidCallback? onTap}) {
    return Material(
      color: const Color(0xFFF3F4F6),
      borderRadius: BorderRadius.circular(6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: SizedBox(
          width: 32,
          height: 32,
          child: Icon(icon, size: 18, color: PosColors.textMuted),
        ),
      ),
    );
  }
}
