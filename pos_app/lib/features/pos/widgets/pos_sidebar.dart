import 'package:flutter/material.dart';

import '../../../core/services/pos_window_service.dart';
import '../../../core/theme/pos_theme.dart';

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
    required this.onPrintLastReceipt,
    required this.onCashRegisterDetails,
    required this.onStaff,
    required this.onHistory,
    required this.onSettings,
    required this.onProfile,
    required this.onLogout,
    this.onReturn,
    this.onExchange,
    this.busy = false,
    this.syncing = false,
  });

  final PosNavSection activeSection;
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
  final VoidCallback? onReturn;
  final VoidCallback? onExchange;
  final bool busy;
  final bool syncing;

  bool get _enabled => !busy && !syncing;

  @override
  Widget build(BuildContext context) {
    final brand = context.posBrand;
    return Material(
      color: brand.sidebarBg,
      child: Container(
        width: 68,
        decoration: const BoxDecoration(
          border: Border(right: BorderSide(color: PosColors.border)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 14),
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
                    if (onReturn != null)
                      _NavIcon(
                        icon: Icons.undo_rounded,
                        tooltip: 'Sale return',
                        onTap: _enabled ? onReturn : null,
                        enabled: _enabled,
                      ),
                    if (onExchange != null)
                      _NavIcon(
                        icon: Icons.swap_horiz_rounded,
                        tooltip: 'Sale exchange',
                        onTap: _enabled ? onExchange : null,
                        enabled: _enabled,
                      ),
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
              minimum: EdgeInsets.only(
                bottom: PosWindowService.isSupported &&
                        PosWindowService.instance.isKioskActive
                    ? 12
                    : 8,
              ),
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
  });

  final IconData icon;
  final String tooltip;
  final String? label;
  final VoidCallback? onTap;
  final bool active;
  final bool enabled;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final brand = context.posBrand;
    final inactiveColor = danger
        ? const Color(0xFFE53935)
        : PosColors.textMuted.withValues(alpha: enabled ? 0.85 : 0.35);

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
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: label == null ? 22 : 20, color: iconColor),
                  if (label != null) ...[
                    const SizedBox(height: 2),
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
            ),
          ),
        ),
      ),
    );
  }
}
