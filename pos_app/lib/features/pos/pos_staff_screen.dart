import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/providers/app_providers.dart';
import '../../core/theme/pos_theme.dart';
import 'models/staff_models.dart';
import 'pos_currency.dart';
import 'services/staff_service.dart';
import 'widgets/pos_professional_dialog.dart';
import 'widgets/show_pos_dialog.dart';

final billerOverviewProvider =
    FutureProvider.autoDispose<BillerOverview>((ref) async {
  final db = ref.watch(appDatabaseProvider);
  final billerId = ref.watch(sessionServiceProvider).billerId;
  return StaffService(db).load(currentBillerId: billerId);
});

class PosStaffScreen extends ConsumerStatefulWidget {
  const PosStaffScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  ConsumerState<PosStaffScreen> createState() => _PosStaffScreenState();
}

class _PosStaffScreenState extends ConsumerState<PosStaffScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';
  int _page = 0;
  static const _pageSize = 6;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    ref.invalidate(billerOverviewProvider);
    await ref.read(billerOverviewProvider.future);
  }

  List<BillerPerformanceRow> _filter(List<BillerPerformanceRow> rows) {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return rows;
    return rows
        .where((r) =>
            r.name.toLowerCase().contains(q) ||
            (r.companyName?.toLowerCase().contains(q) ?? false) ||
            r.id.toString().contains(q))
        .toList();
  }

  Future<void> _showTransactions(
    BillerPerformanceRow row,
    BillerStatsPeriod period,
  ) async {
    final service = StaffService(ref.read(appDatabaseProvider));
    final transactions = await service.loadTransactions(
      billerId: row.id,
      period: period,
    );
    if (!mounted) return;

    await showPosDialog<void>(
      context: context,
      builder: (ctx) => _BillerTransactionsDialog(
        biller: row,
        period: period,
        transactions: transactions,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final overviewAsync = ref.watch(billerOverviewProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: overviewAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load: $e')),
        data: (overview) {
          final filtered = _filter(overview.billers);
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
              ? <BillerPerformanceRow>[]
              : filtered.sublist(start, end);

          return RefreshIndicator(
            onRefresh: _refresh,
            color: context.posBrand.primary,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(28, 20, 28, 28),
              children: [
                Text(
                  'Billers',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Sales and transaction counts by biller',
                  style: TextStyle(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
                ),
                SizedBox(height: 16),
                _StaffSearchBar(
                  controller: _searchCtrl,
                  onChanged: (v) => setState(() {
                    _query = v;
                    _page = 0;
                  }),
                ),
                SizedBox(height: 16),
                _SummaryRow(overview: overview),
                SizedBox(height: 20),
                _BillerTable(
                  rows: pageRows,
                  totalCount: filtered.length,
                  page: safePage,
                  pageCount: pageCount,
                  onPageChanged: (p) => setState(() => _page = p),
                  onPeriodTap: _showTransactions,
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _StaffSearchBar extends StatelessWidget {
  const _StaffSearchBar({
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
        hintText: 'Search biller name or ID...',
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
  const _SummaryRow({required this.overview});

  final BillerOverview overview;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 980;
        final cards = [
          _StatCard(
            label: 'TOTAL BILLERS',
            value: '${overview.totalBillers}',
            subtext: 'Synced from server',
            valueColor: PosColors.blue,
          ),
          _PeriodStatCard(
            label: 'TODAY',
            stats: overview.todayTotal,
          ),
          _PeriodStatCard(
            label: 'LAST 7 DAYS',
            stats: overview.last7DaysTotal,
          ),
          _PeriodStatCard(
            label: 'THIS MONTH',
            stats: overview.monthTotal,
          ),
        ];

        if (wide) {
          return Row(
            children: [
              for (var i = 0; i < cards.length; i++) ...[
                if (i > 0) const SizedBox(width: 14),
                Expanded(child: cards[i]),
              ],
            ],
          );
        }

        return Column(
          children: [
            for (var i = 0; i < cards.length; i++) ...[
              if (i > 0) const SizedBox(height: 12),
              cards[i],
            ],
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
    this.subtext,
    this.valueColor,
  });

  final String label;
  final String value;
  final String? subtext;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
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
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: valueColor ?? Theme.of(context).colorScheme.onSurface,
              height: 1,
            ),
          ),
          if (subtext != null) ...[
            SizedBox(height: 6),
            Text(
              subtext!,
              style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          ],
        ],
      ),
    );
  }
}

class _PeriodStatCard extends StatelessWidget {
  const _PeriodStatCard({
    required this.label,
    required this.stats,
  });

  final String label;
  final BillerSalesStats stats;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
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
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          SizedBox(height: 8),
          Text(
            formatPosMoney(stats.sales),
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: PosColors.blue,
              height: 1,
            ),
          ),
          SizedBox(height: 6),
          Text(
            '${stats.transactions} transaction${stats.transactions == 1 ? '' : 's'}',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Color(0xFF2E7D32),
            ),
          ),
        ],
      ),
    );
  }
}

class _BillerTable extends StatelessWidget {
  const _BillerTable({
    required this.rows,
    required this.totalCount,
    required this.page,
    required this.pageCount,
    required this.onPageChanged,
    required this.onPeriodTap,
  });

  final List<BillerPerformanceRow> rows;
  final int totalCount;
  final int page;
  final int pageCount;
  final ValueChanged<int> onPageChanged;
  final void Function(BillerPerformanceRow row, BillerStatsPeriod period)
      onPeriodTap;

  @override
  Widget build(BuildContext context) {
    final start = totalCount == 0 ? 0 : page * _PosStaffScreenState._pageSize + 1;
    final end = math.min((page + 1) * _PosStaffScreenState._pageSize, totalCount);

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              color: context.posBrand.primaryLight.withValues(alpha: 0.5),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(11),
              ),
            ),
            child: const Row(
              children: [
                Expanded(flex: 4, child: _HeaderCell('BILLER')),
                Expanded(flex: 3, child: _HeaderCell('TODAY')),
                Expanded(flex: 3, child: _HeaderCell('LAST 7 DAYS')),
                Expanded(flex: 3, child: _HeaderCell('THIS MONTH')),
              ],
            ),
          ),
          if (rows.isEmpty)
            Padding(
              padding: EdgeInsets.all(40),
              child: Text(
                'No billers synced yet. Run a full POS data download.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            )
          else
            for (final row in rows)
              _BillerTableRow(row: row, onPeriodTap: onPeriodTap),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
            child: Row(
              children: [
                Text(
                  totalCount == 0
                      ? 'No billers'
                      : 'Showing $start-$end of $totalCount billers',
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
      style: TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.5,
        color: Theme.of(context).colorScheme.onSurfaceVariant,
      ),
    );
  }
}

class _BillerTableRow extends StatelessWidget {
  const _BillerTableRow({
    required this.row,
    required this.onPeriodTap,
  });

  final BillerPerformanceRow row;
  final void Function(BillerPerformanceRow row, BillerStatsPeriod period)
      onPeriodTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Theme.of(context).dividerColor)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 4,
            child: Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: row.isActive
                      ? context.posBrand.primaryLight
                      : context.posSurface.productIconBg,
                  child: Text(
                    row.name.isNotEmpty ? row.name[0].toUpperCase() : '?',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: row.isActive
                          ? context.posBrand.primary
                          : Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              row.name,
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
                          ),
                          if (row.isActive) ...[
                            SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: context.posBrand.primaryLight,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                'Active',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: context.posBrand.primary,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (row.companyName?.trim().isNotEmpty == true)
                        Text(
                          row.companyName!.trim(),
                          style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                        )
                      else
                        Text(
                          'ID ${row.id}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            flex: 3,
            child: _PeriodCell(
              stats: row.today,
              onTap: () => onPeriodTap(row, BillerStatsPeriod.today),
            ),
          ),
          Expanded(
            flex: 3,
            child: _PeriodCell(
              stats: row.last7Days,
              onTap: () => onPeriodTap(row, BillerStatsPeriod.last7Days),
            ),
          ),
          Expanded(
            flex: 3,
            child: _PeriodCell(
              stats: row.thisMonth,
              onTap: () => onPeriodTap(row, BillerStatsPeriod.month),
            ),
          ),
        ],
      ),
    );
  }
}

class _PeriodCell extends StatelessWidget {
  const _PeriodCell({
    required this.stats,
    required this.onTap,
  });

  final BillerSalesStats stats;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                formatPosMoney(stats.sales),
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                  color: PosColors.blue,
                ),
              ),
              Text(
                '${stats.transactions} txn${stats.transactions == 1 ? '' : 's'}',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2E7D32),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BillerTransactionsDialog extends StatelessWidget {
  const _BillerTransactionsDialog({
    required this.biller,
    required this.period,
    required this.transactions,
  });

  final BillerPerformanceRow biller;
  final BillerStatsPeriod period;
  final List<BillerTransactionRow> transactions;

  @override
  Widget build(BuildContext context) {
    final timeFmt = DateFormat('MMM d, h:mm a');

    return PosProfessionalDialogShell(
      title: biller.name,
      subtitle: period.label,
      icon: Icons.receipt_long_outlined,
      maxWidth: 560,
      maxBodyHeight: 400,
      footer: PosProfessionalDialogFooter(
        primaryLabel: 'Close',
        onPrimary: () => Navigator.pop(context),
      ),
      body: transactions.isEmpty
          ? const PosProfessionalEmptyState(
              message: 'No transactions in this period.',
              icon: Icons.receipt_outlined,
            )
          : ListView.separated(
              itemCount: transactions.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final txn = transactions[i];
                return Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).scaffoldBackgroundColor,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              txn.referenceLabel,
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              timeFmt.format(txn.createdAt),
                              style: TextStyle(
                                fontSize: 12,
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            formatPosMoney(txn.grandTotal),
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              color: PosColors.blue,
                            ),
                          ),
                          Text(
                            '${txn.itemCount} item${txn.itemCount == 1 ? '' : 's'}',
                            style: TextStyle(
                              fontSize: 11,
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
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
          context,
          icon: Icons.chevron_left,
          onTap: page > 0 ? () => onChanged(page - 1) : null,
        ),
        for (var i = 0; i < pageCount && i < 5; i++) ...[
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
    return Material(
      color: const Color(0xFFF3F4F6),
      borderRadius: BorderRadius.circular(6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: SizedBox(
          width: 32,
          height: 32,
          child: Icon(icon, size: 18, color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
      ),
    );
  }
}
