import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import 'pos_brand_logo.dart';

enum PosNavSection {
  dashboard,
  register,
  inventory,
  staff,
  history,
  settings,
}

/// Light left rail with full nav icons — POS terminal mockup.
class PosSidebar extends StatelessWidget {
  const PosSidebar({
    super.key,
    required this.activeSection,
    required this.onDashboard,
    required this.onRegister,
    required this.onInventory,
    this.onPrintLastReceipt,
    required this.onCashRegisterDetails,
    required this.onStaff,
    required this.onHistory,
    required this.onSettings,
    required this.onProfile,
    required this.onLogout,
    this.onReturn,
    this.onPendingSync,
    this.pendingSyncCount = 0,
    this.onHoldBills,
    this.holdBillsCount = 0,
    this.syncingSales = false,
    this.busy = false,
    this.syncing = false,
    this.sidebarLogoPath,
  });

  final PosNavSection activeSection;
  final VoidCallback onDashboard;
  final VoidCallback onRegister;
  final VoidCallback onInventory;
  final VoidCallback? onPrintLastReceipt;
  final VoidCallback onCashRegisterDetails;
  final VoidCallback onStaff;
  final VoidCallback onHistory;
  final VoidCallback onSettings;
  final VoidCallback onProfile;
  final VoidCallback onLogout;
  final VoidCallback? onReturn;
  final VoidCallback? onPendingSync;
  final int pendingSyncCount;
  final VoidCallback? onHoldBills;
  final int holdBillsCount;
  final bool syncingSales;
  final bool busy;
  final bool syncing;
  final String? sidebarLogoPath;

  bool get _enabled => !busy && !syncing;

  @override
  Widget build(BuildContext context) {
    final brand = context.posBrand;
    return Material(
      color: brand.sidebarBg,
      child: SizedBox(
        width: 68,
        child: Container(
          decoration: BoxDecoration(
            border: Border(right: BorderSide(color: Theme.of(context).dividerColor)),
          ),
          child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 10, bottom: 8),
              child: PosBrandLogo(
                logoPath: sidebarLogoPath,
                size: 44,
                variant: PosBrandLogoVariant.sidebar,
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                physics: const ClampingScrollPhysics(),
                child: Column(
                  children: [
                    _NavIcon(
                      icon: Icons.desktop_windows_outlined,
                      tooltip: 'Dashboard',
                      active: activeSection == PosNavSection.dashboard,
                      onTap: onDashboard,
                    ),
                    _NavIcon(
                      icon: Icons.shopping_cart_outlined,
                      label: 'POS',
                      tooltip: 'POS',
                      active: activeSection == PosNavSection.register,
                      onTap: onRegister,
                    ),
                    _NavIcon(
                      icon: Icons.inventory_2_outlined,
                      tooltip: 'Inventory',
                      active: activeSection == PosNavSection.inventory,
                      onTap: _enabled ? onInventory : null,
                      enabled: _enabled,
                    ),
                    _NavIcon(
                      icon: Icons.badge_outlined,
                      tooltip: 'Staff',
                      active: activeSection == PosNavSection.staff,
                      onTap: _enabled ? onStaff : null,
                      enabled: _enabled,
                    ),
                    _NavIcon(
                      icon: Icons.history_rounded,
                      tooltip: 'Transaction history',
                      active: activeSection == PosNavSection.history,
                      onTap: _enabled ? onHistory : null,
                      enabled: _enabled,
                    ),
                    _NavIcon(
                      icon: syncingSales
                          ? Icons.sync_rounded
                          : Icons.cloud_upload_outlined,
                      tooltip: pendingSyncCount > 0
                          ? 'Pending sync ($pendingSyncCount)'
                          : 'Pending sync',
                      badgeCount: pendingSyncCount,
                      onTap: _enabled && !syncingSales ? onPendingSync : null,
                      enabled: _enabled && !syncingSales,
                    ),
                    _NavIcon(
                      icon: Icons.drafts_outlined,
                      tooltip: holdBillsCount > 0
                          ? 'Hold bills ($holdBillsCount)'
                          : 'Hold bills',
                      badgeCount: holdBillsCount,
                      onTap: _enabled ? onHoldBills : null,
                      enabled: _enabled,
                    ),
                    if (onReturn != null)
                      _NavIcon(
                        icon: Icons.undo_rounded,
                        tooltip: 'Sale return',
                        onTap: _enabled ? onReturn : null,
                        enabled: _enabled,
                      ),
                    if (onPrintLastReceipt != null)
                      _NavIcon(
                        icon: Icons.receipt_long_outlined,
                        tooltip: 'Print last receipt',
                        onTap: _enabled ? onPrintLastReceipt : null,
                        enabled: _enabled,
                      ),
                    _NavIcon(
                      icon: Icons.point_of_sale_outlined,
                      tooltip: 'Cash register details',
                      onTap: _enabled ? onCashRegisterDetails : null,
                      enabled: _enabled,
                    ),
                    _NavIcon(
                      icon: Icons.settings_outlined,
                      tooltip: 'Settings',
                      active: activeSection == PosNavSection.settings,
                      onTap: _enabled ? onSettings : null,
                      enabled: _enabled,
                    ),
                  ],
                ),
              ),
            ),
            SafeArea(
              top: false,
              minimum: const EdgeInsets.only(bottom: 4),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _NavIcon(
                    icon: Icons.person_outline,
                    tooltip: 'Operator profile',
                    onTap: _enabled ? onProfile : null,
                    enabled: _enabled,
                  ),
                  _NavIcon(
                    icon: Icons.logout_rounded,
                    tooltip: 'Sign out',
                    onTap: _enabled ? onLogout : null,
                    enabled: _enabled,
                    danger: true,
                  ),
                ],
              ),
            ),
          ],
          ),
        ),
      ),
    );
  }
}

class _NavIcon extends StatelessWidget {
  const _NavIcon({
    required this.icon,
    required this.tooltip,
    this.label,
    this.onTap,
    this.active = false,
    this.enabled = true,
    this.danger = false,
    this.badgeCount = 0,
    this.statusDotColor,
  });

  final IconData icon;
  final String tooltip;
  final String? label;
  final VoidCallback? onTap;
  final bool active;
  final bool enabled;
  final bool danger;
  final int badgeCount;
  final Color? statusDotColor;

  @override
  Widget build(BuildContext context) {
    final brand = context.posBrand;
    final sidebarIsLight = brand.sidebarBg.computeLuminance() > 0.55;
    final inactiveColor = danger
        ? (sidebarIsLight ? const Color(0xFFE53935) : const Color(0xFFF87171))
        : (sidebarIsLight
            ? Theme.of(context)
                .colorScheme
                .onSurfaceVariant
                .withValues(alpha: enabled ? 0.85 : 0.35)
            : Colors.white.withValues(alpha: enabled ? 0.82 : 0.32));

    final Color bg = active ? brand.primary : Colors.transparent;
    final Color iconColor = active ? Colors.white : inactiveColor;
    final Color labelColor = active ? Colors.white : inactiveColor;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      child: Tooltip(
        message: tooltip,
        child: Material(
          color: bg,
          borderRadius: BorderRadius.circular(kPosButtonRadius),
          child: InkWell(
            onTap: enabled ? onTap : null,
            borderRadius: BorderRadius.circular(kPosButtonRadius),
            child: SizedBox(
              width: 48,
              height: label == null ? 48 : 52,
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(icon, size: label == null ? 22 : 20, color: iconColor),
                      if (label != null) ...[
                        SizedBox(height: 2),
                        Text(
                          label!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.2,
                            color: labelColor,
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (badgeCount > 0)
                    Positioned(
                      right: 2,
                      top: 0,
                      child: Container(
                        constraints: const BoxConstraints(
                          minWidth: 18,
                          minHeight: 18,
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDC2626),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: brand.sidebarBg,
                            width: 1.5,
                          ),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          badgeCount > 99 ? '99+' : '$badgeCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            height: 1.1,
                          ),
                        ),
                      ),
                    ),
                  if (statusDotColor != null)
                    Positioned(
                      right: 6,
                      top: 6,
                      child: Container(
                        width: 9,
                        height: 9,
                        decoration: BoxDecoration(
                          color: statusDotColor,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: brand.sidebarBg,
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
