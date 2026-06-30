import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/app_providers.dart';
import '../../core/services/pos_window_service.dart';
import '../../core/theme/pos_theme.dart';
import '../auth/login_screen.dart';
import 'models/dashboard_models.dart';
import 'pos_currency.dart';
import 'pos_screen.dart';
import 'pos_inventory_screen.dart';
import 'pos_settings_screen.dart';
import 'pos_staff_screen.dart';
import 'providers/pos_nav_provider.dart';
import 'widgets/pos_sidebar.dart';
import 'services/dashboard_stats_service.dart';
import 'widgets/pos_professional_dialog.dart';
import 'widgets/show_pos_dialog.dart';

final dashboardStatsProvider =
    FutureProvider.autoDispose<DashboardStats>((ref) async {
  final db = ref.watch(appDatabaseProvider);
  return DashboardStatsService(db).load();
});

enum _TrendPeriod { week, month, year }

class PosDashboardScreen extends ConsumerStatefulWidget {
  const PosDashboardScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  ConsumerState<PosDashboardScreen> createState() => _PosDashboardScreenState();
}

class _PosDashboardScreenState extends ConsumerState<PosDashboardScreen> {
  _TrendPeriod _trendPeriod = _TrendPeriod.week;
  static const _accent = PosColors.blue;

  Future<void> _refresh() async {
    ref.invalidate(dashboardStatsProvider);
    await ref.read(dashboardStatsProvider.future);
  }

  void _openRegister() {
    if (widget.embedded) {
      ref.read(posNavSectionProvider.notifier).state = PosNavSection.register;
      return;
    }
    Navigator.of(context)
        .push(MaterialPageRoute(builder: (_) => const PosScreen()))
        .then((_) {
      if (mounted) _refresh();
    });
  }

  void _openSettings() {
    if (widget.embedded) {
      ref.read(posNavSectionProvider.notifier).state = PosNavSection.settings;
      return;
    }
    unawaited(Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const PosSettingsScreen()),
    ));
  }

  void _openInventory() {
    if (widget.embedded) {
      ref.read(posNavSectionProvider.notifier).state = PosNavSection.inventory;
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const PosInventoryScreen()),
    );
  }

  void _openStaff() {
    if (widget.embedded) {
      ref.read(posNavSectionProvider.notifier).state = PosNavSection.staff;
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const PosStaffScreen()),
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

  Future<void> _showRecentTransactions() async {
    final stats = await ref.read(dashboardStatsProvider.future);
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
    await PosWindowService.instance.exitKioskMode();
    await ref.read(sessionServiceProvider).clear();
    bumpSessionState(ref);
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  String get _terminalTitle {
    final session = ref.read(sessionServiceProvider);
    final name = session.terminalName?.trim();
    if (name != null && name.isNotEmpty) return name;
    final code = session.terminalCode?.trim();
    if (code != null && code.isNotEmpty) return code;
    return 'Terminal Station';
  }

  String get _stationCode {
    final code = ref.read(sessionServiceProvider).terminalCode?.trim();
    if (code != null && code.isNotEmpty) return code.toUpperCase();
    return 'STATION 01';
  }

  String get _operatorLabel {
    final session = ref.read(sessionServiceProvider);
    final name = session.userName?.trim();
    if (name != null && name.isNotEmpty) return name;
    final id = session.userId;
    if (id != null) return 'Operator #$id';
    return 'Operator';
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
    final statsAsync = ref.watch(dashboardStatsProvider);
    final content = statsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Failed to load: $e')),
      data: (stats) => RefreshIndicator(
        onRefresh: _refresh,
        color: _accent,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(28, 24, 28, 16),
          children: [
            _KpiGrid(stats: stats),
            SizedBox(height: 24),
            _RevenueTrendsCard(
              points: stats.dailyRevenue,
              period: _trendPeriod,
              onPeriodChanged: (p) => setState(() => _trendPeriod = p),
            ),
            SizedBox(height: 24),
            LayoutBuilder(
              builder: (context, constraints) {
                final wide = constraints.maxWidth >= 960;
                final topProducts =
                    _TopProductsCard(products: stats.topProducts);
                final staff = _StaffPerformanceCard(
                  staff: stats.staffPerformance,
                  onTap: _openStaff,
                );
                if (wide) {
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: topProducts),
                      SizedBox(width: 20),
                      Expanded(child: staff),
                    ],
                  );
                }
                return Column(
                  children: [
                    topProducts,
                    SizedBox(height: 20),
                    staff,
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );

    if (widget.embedded) return content;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: content,
    );
  }
}

class _KpiGrid extends StatelessWidget {
  const _KpiGrid({required this.stats});

  final DashboardStats stats;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 1000;
        final cards = [
          _KpiCard(
            title: 'Net Sales',
            value: formatPosMoney(stats.totalSales),
            valueColor: PosColors.blue,
            subtext:
                'vs. ${formatPosMoney(stats.yesterdayTotalSales)} yesterday',
            trend: stats.salesGrowthPercent,
          ),
          _KpiCard(
            title: 'Gross Profit',
            value: formatPosMoney(stats.grossProfit),
            subtext:
                'Margin: ${stats.grossProfitMarginPercent.toStringAsFixed(1)}%',
            trend: stats.grossProfitGrowthPercent,
          ),
          _KpiCard(
            title: 'Transactions',
            value: '${stats.transactionCount}',
            subtext: 'Peak time: ${stats.peakHourLabel}',
            trend: stats.transactionGrowthPercent,
          ),
          _KpiCard(
            title: 'Avg. Order Value',
            value: formatPosMoney(stats.avgOrderValue),
            subtext:
                'Basket size: ${stats.avgBasketSize.toStringAsFixed(1)} items',
            trend: stats.avgOrderGrowthPercent,
          ),
        ];

        if (wide) {
          return Row(
            children: [
              for (var i = 0; i < cards.length; i++) ...[
                Expanded(child: cards[i]),
                if (i < cards.length - 1) const SizedBox(width: 16),
              ],
            ],
          );
        }
        return Column(
          children: [
            for (var i = 0; i < cards.length; i++) ...[
              cards[i],
              if (i < cards.length - 1) const SizedBox(height: 12),
            ],
          ],
        );
      },
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({
    required this.title,
    required this.value,
    required this.subtext,
    this.valueColor,
    this.trend,
  });

  final String title;
  final String value;
  final String subtext;
  final Color? valueColor;
  final double? trend;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const Spacer(),
              if (trend != null) _TrendPill(percent: trend!),
            ],
          ),
          SizedBox(height: 10),
          Text(
            value,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: valueColor ?? Theme.of(context).colorScheme.onSurface,
              height: 1.1,
            ),
          ),
          SizedBox(height: 6),
          Text(
            subtext,
            style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _TrendPill extends StatelessWidget {
  const _TrendPill({required this.percent});

  final double percent;

  @override
  Widget build(BuildContext context) {
    final positive = percent >= 0;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: positive ? const Color(0xFFE8F5E9) : const Color(0xFFFEE2E2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '${positive ? '+' : ''}${percent.toStringAsFixed(1)}%',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: positive ? const Color(0xFF2E7D32) : PosColors.red,
        ),
      ),
    );
  }
}

class _RevenueTrendsCard extends StatelessWidget {
  const _RevenueTrendsCard({
    required this.points,
    required this.period,
    required this.onPeriodChanged,
  });

  final List<DailyRevenuePoint> points;
  final _TrendPeriod period;
  final ValueChanged<_TrendPeriod> onPeriodChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Revenue Trends',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Daily revenue performance over the last 7 days',
                      style: TextStyle(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              _PeriodToggle(period: period, onChanged: onPeriodChanged),
            ],
          ),
          SizedBox(height: 24),
          SizedBox(
            height: 200,
            child: _WeeklyRevenueChart(points: points),
          ),
        ],
      ),
    );
  }
}

class _PeriodToggle extends StatelessWidget {
  const _PeriodToggle({
    required this.period,
    required this.onChanged,
  });

  final _TrendPeriod period;
  final ValueChanged<_TrendPeriod> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF3F5FA),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _periodBtn(context, 'Last 7 Days', _TrendPeriod.week),
          _periodBtn(context, 'Month', _TrendPeriod.month),
          _periodBtn(context, 'Year', _TrendPeriod.year),
        ],
      ),
    );
  }

  Widget _periodBtn(BuildContext context, String label, _TrendPeriod value) {
    final active = period == value;
    return Material(
      color: active ? PosColors.blue : Colors.transparent,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: () => onChanged(value),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: active ? Colors.white : Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      ),
    );
  }
}

class _WeeklyRevenueChart extends StatelessWidget {
  const _WeeklyRevenueChart({required this.points});

  final List<DailyRevenuePoint> points;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _WeeklyRevenuePainter(points: points),
      child: Padding(
        padding: const EdgeInsets.only(top: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            for (final p in points)
              Text(
                p.label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: p.isToday ? FontWeight.w800 : FontWeight.w500,
                  color: p.isToday ? Theme.of(context).colorScheme.onSurface : Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _WeeklyRevenuePainter extends CustomPainter {
  _WeeklyRevenuePainter({required this.points});

  final List<DailyRevenuePoint> points;

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;

    final maxY = points.fold<double>(0, (m, p) => math.max(m, p.amount));
    final yMax = maxY <= 0 ? 1.0 : maxY * 1.2;
    const left = 8.0;
    final right = size.width - 8;
    const top = 8.0;
    final bottom = size.height - 28;
    final chartH = bottom - top;
    final chartW = right - left;

    final coords = <Offset>[];
    for (var i = 0; i < points.length; i++) {
      final x = left + (chartW * i / math.max(1, points.length - 1));
      final y = bottom - (points[i].amount / yMax) * chartH;
      coords.add(Offset(x, y));
    }

    if (coords.length < 2) {
      if (coords.isNotEmpty) {
        canvas.drawCircle(coords.first, 5, Paint()..color = PosColors.blue);
      }
      return;
    }

    final fillPath = Path()..moveTo(coords.first.dx, bottom);
    for (final p in coords) {
      fillPath.lineTo(p.dx, p.dy);
    }
    fillPath.lineTo(coords.last.dx, bottom);
    fillPath.close();

    canvas.drawPath(
      fillPath,
      Paint()
        ..shader = ui.Gradient.linear(
          const Offset(0, top),
          Offset(0, bottom),
          [
            PosColors.blue.withValues(alpha: 0.2),
            PosColors.blue.withValues(alpha: 0.02),
          ],
        ),
    );

    final linePath = Path()..moveTo(coords.first.dx, coords.first.dy);
    for (var i = 0; i < coords.length - 1; i++) {
      final p0 = coords[i];
      final p1 = coords[i + 1];
      final cx = (p0.dx + p1.dx) / 2;
      linePath.cubicTo(cx, p0.dy, cx, p1.dy, p1.dx, p1.dy);
    }
    canvas.drawPath(
      linePath,
      Paint()
        ..color = PosColors.blue
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant _WeeklyRevenuePainter oldDelegate) =>
      oldDelegate.points != points;
}

class _TopProductsCard extends StatelessWidget {
  const _TopProductsCard({required this.products});

  final List<TopProductRow> products;

  @override
  Widget build(BuildContext context) {
    return _DashboardPanel(
      title: 'Top Selling Products',
      trailing: TextButton(
        onPressed: () {},
        child: const Text('View All'),
      ),
      child: products.isEmpty
          ? Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: Text(
                'No product sales recorded today.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            )
          : Column(
              children: [
                const _ProductTableHeader(),
                for (final p in products) _ProductTableRow(product: p),
              ],
            ),
    );
  }
}

class _ProductTableHeader extends StatelessWidget {
  const _ProductTableHeader();

  @override
  Widget build(BuildContext context) {
    final style = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w700,
      color: Theme.of(context).colorScheme.onSurfaceVariant,
      letterSpacing: 0.3,
    );
    return Padding(
      padding: EdgeInsets.fromLTRB(4, 8, 4, 10),
      child: Row(
        children: [
          Expanded(flex: 5, child: Text('Product Name', style: style)),
          Expanded(flex: 2, child: Text('Qty Sold', style: style)),
          Expanded(
            flex: 3,
            child: Text('Revenue', style: style, textAlign: TextAlign.right),
          ),
        ],
      ),
    );
  }
}

class _ProductTableRow extends StatelessWidget {
  const _ProductTableRow({required this.product});

  final TopProductRow product;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Expanded(
            flex: 5,
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: context.posSurface.productIconBg,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: Icon(
                    Icons.shopping_bag_outlined,
                    size: 18,
                    color: PosColors.blue.withValues(alpha: 0.7),
                  ),
                ),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    product.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              product.qtySold == product.qtySold.roundToDouble()
                  ? '${product.qtySold.toInt()}'
                  : product.qtySold.toStringAsFixed(1),
              style: TextStyle(fontSize: 14),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              formatPosMoney(product.revenue),
              textAlign: TextAlign.right,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 14,
                color: PosColors.blue,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StaffPerformanceCard extends StatelessWidget {
  const _StaffPerformanceCard({
    required this.staff,
    this.onTap,
  });

  final List<StaffPerformanceRow> staff;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final panel = _DashboardPanel(
      title: 'Staff Performance',
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.calendar_today_outlined,
              size: 14, color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.8)),
          SizedBox(width: 6),
          Text(
            'TODAY',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              letterSpacing: 0.5,
            ),
          ),
          if (onTap != null) ...[
            SizedBox(width: 8),
            Icon(Icons.chevron_right,
                size: 18, color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.7)),
          ],
        ],
      ),
      child: staff.isEmpty
          ? Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: Text(
                'No staff sales recorded today.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            )
          : Column(
              children: [
                for (final member in staff)
                  _StaffRow(member: member, highlight: member.rank == 1),
              ],
            ),
    );
    if (onTap == null) return panel;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: panel,
      ),
    );
  }
}

class _StaffRow extends StatelessWidget {
  const _StaffRow({required this.member, this.highlight = false});

  final StaffPerformanceRow member;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: highlight ? context.posBrand.primaryLight : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: highlight ? PosColors.blue.withValues(alpha: 0.2) : Theme.of(context).dividerColor,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: context.posSurface.productIconBg,
                    child: Text(
                      member.name.isNotEmpty
                          ? member.name[0].toUpperCase()
                          : '?',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        color: PosColors.blue,
                      ),
                    ),
                  ),
                  if (member.rank != null)
                    Positioned(
                      right: -4,
                      bottom: -2,
                      child: CircleAvatar(
                        radius: 9,
                        backgroundColor:
                            member.rank == 1 ? PosColors.blue : Theme.of(context).colorScheme.onSurfaceVariant,
                        child: Text(
                          '${member.rank}',
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.surface,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      member.name,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      '${member.transactionCount} transactions',
                      style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                formatPosMoney(member.totalSales),
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ],
          ),
          SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: member.progress,
              minHeight: 6,
              backgroundColor: const Color(0xFFE5E9F2),
              color: highlight ? PosColors.blue : Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _DashboardPanel extends StatelessWidget {
  const _DashboardPanel({
    required this.title,
    required this.child,
    this.trailing,
  });

  final String title;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
              const Spacer(),
              if (trailing != null) trailing!,
            ],
          ),
          SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

