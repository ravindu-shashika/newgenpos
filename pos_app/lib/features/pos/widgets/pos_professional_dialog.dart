import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/pos_theme.dart';
import '../models/dashboard_models.dart';
import '../pos_currency.dart';
import 'show_pos_dialog.dart';

/// Wide modal shell for checkout flows (payment, discount, returns).
class PosProfessionalWideDialogShell extends StatelessWidget {
  const PosProfessionalWideDialogShell({
    super.key,
    required this.title,
    required this.body,
    this.subtitle,
    this.icon = Icons.info_outline,
    this.onClose,
    this.footer,
    this.headerExtra,
    this.maxWidth = 920,
    this.maxHeightFactor = 0.92,
  });

  final String title;
  final String? subtitle;
  final IconData icon;
  final Widget body;
  final VoidCallback? onClose;
  final Widget? footer;
  final Widget? headerExtra;
  final double maxWidth;
  final double maxHeightFactor;

  @override
  Widget build(BuildContext context) {
    final maxHeight = MediaQuery.sizeOf(context).height * maxHeightFactor;

    return Dialog(
      elevation: 20,
      shadowColor: Colors.black26,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      clipBehavior: Clip.antiAlias,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth, maxHeight: maxHeight),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            PosProfessionalDialogHeader(
              title: title,
              subtitle: subtitle,
              icon: icon,
              onClose: onClose ?? () => Navigator.of(context).pop(),
            ),
            Divider(height: 1, color: Theme.of(context).dividerColor),
            if (headerExtra != null) headerExtra!,
            Flexible(child: body),
            if (footer != null) ...[
              Divider(height: 1, color: Theme.of(context).dividerColor),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 18),
                child: footer!,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Branded modal shell — header, scrollable body, optional footer.
class PosProfessionalDialogShell extends StatelessWidget {
  const PosProfessionalDialogShell({
    super.key,
    required this.title,
    required this.body,
    this.subtitle,
    this.icon = Icons.info_outline,
    this.onClose,
    this.footer,
    this.maxWidth = 500,
    this.maxBodyHeight = 420,
  });

  final String title;
  final String? subtitle;
  final IconData icon;
  final Widget body;
  final VoidCallback? onClose;
  final Widget? footer;
  final double maxWidth;
  final double maxBodyHeight;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      elevation: 20,
      shadowColor: Colors.black26,
      insetPadding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            PosProfessionalDialogHeader(
              title: title,
              subtitle: subtitle,
              icon: icon,
              onClose: onClose ?? () => Navigator.of(context).pop(),
            ),
            Divider(height: 1, color: Theme.of(context).dividerColor),
            Flexible(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 280),
                curve: Curves.easeOutCubic,
                constraints: BoxConstraints(maxHeight: maxBodyHeight),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 24, 20),
                  child: body,
                ),
              ),
            ),
            if (footer != null) ...[
              Divider(height: 1, color: Theme.of(context).dividerColor),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 18),
                child: footer!,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class PosProfessionalDialogHeader extends StatelessWidget {
  const PosProfessionalDialogHeader({
    super.key,
    required this.title,
    required this.icon,
    required this.onClose,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final IconData icon;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 12, 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: s.accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: s.accent, size: 22),
          ),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: s.titleLarge,
                ),
                if (subtitle != null && subtitle!.isNotEmpty) ...[
                  SizedBox(height: 4),
                  Text(
                    subtitle!,
                    style: s.bodyMuted.copyWith(fontSize: 13),
                  ),
                ],
              ],
            ),
          ),
          IconButton(
            onPressed: onClose,
            tooltip: 'Close',
            icon: const Icon(Icons.close, size: 20),
            color: s.textMuted,
            visualDensity: VisualDensity.compact,
          ),
        ],
      ),
    );
  }
}

class PosProfessionalDialogFooter extends StatelessWidget {
  const PosProfessionalDialogFooter({
    super.key,
    this.secondaryLabel,
    this.primaryLabel,
    this.onSecondary,
    this.onPrimary,
    this.primaryDestructive = false,
    this.primaryEnabled = true,
    this.primaryLoading = false,
  });

  final String? secondaryLabel;
  final String? primaryLabel;
  final VoidCallback? onSecondary;
  final VoidCallback? onPrimary;
  final bool primaryDestructive;
  final bool primaryEnabled;
  final bool primaryLoading;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        if (secondaryLabel != null)
          OutlinedButton(
            onPressed: onSecondary ?? () => Navigator.of(context).pop(),
            child: Text(secondaryLabel!),
          ),
        const Spacer(),
        if (primaryLabel != null)
          FilledButton(
            onPressed:
                primaryEnabled && !primaryLoading ? onPrimary : null,
            style: primaryDestructive
                ? FilledButton.styleFrom(
                    backgroundColor: PosColors.red,
                    foregroundColor: Colors.white,
                  )
                : null,
            child: primaryLoading
                ? SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Theme.of(context).colorScheme.surface,
                    ),
                  )
                : Text(
                    primaryLabel!,
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
          ),
      ],
    );
  }
}

/// Branded modal with standard Close / optional secondary actions.
class PosProfessionalDialog extends StatelessWidget {
  const PosProfessionalDialog({
    super.key,
    required this.title,
    required this.body,
    this.subtitle,
    this.icon = Icons.info_outline,
    this.primaryLabel = 'Close',
    this.secondaryLabel,
    this.onPrimary,
    this.onSecondary,
    this.maxWidth = 500,
    this.maxBodyHeight = 420,
  });

  final String title;
  final String? subtitle;
  final IconData icon;
  final Widget body;
  final String primaryLabel;
  final String? secondaryLabel;
  final VoidCallback? onPrimary;
  final VoidCallback? onSecondary;
  final double maxWidth;
  final double maxBodyHeight;

  @override
  Widget build(BuildContext context) {
    return PosProfessionalDialogShell(
      title: title,
      subtitle: subtitle,
      icon: icon,
      maxWidth: maxWidth,
      maxBodyHeight: maxBodyHeight,
      body: body,
      footer: PosProfessionalDialogFooter(
        secondaryLabel: secondaryLabel,
        primaryLabel: primaryLabel,
        onSecondary: onSecondary,
        onPrimary: onPrimary ?? () => Navigator.of(context).pop(),
      ),
    );
  }
}

InputDecoration posProfessionalSearchDecoration(BuildContext context, String hint) {
  return InputDecoration(
    hintText: hint,
    filled: true,
    fillColor: Theme.of(context).colorScheme.surfaceContainerHighest,
    prefixIcon: Icon(Icons.search, color: context.posBrand.primary, size: 22),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Theme.of(context).dividerColor),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Theme.of(context).dividerColor),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: context.posBrand.primary, width: 1.5),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
  );
}

class PosProfessionalPickerTile extends StatelessWidget {
  const PosProfessionalPickerTile({
    super.key,
    required this.title,
    this.subtitle,
    required this.selected,
    required this.onTap,
  });

  final String title;
  final String? subtitle;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? context.posBrand.primaryLight.withValues(alpha: 0.55)
          : Theme.of(context).scaffoldBackgroundColor,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: selected ? context.posBrand.primary : Theme.of(context).dividerColor,
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight:
                            selected ? FontWeight.w800 : FontWeight.w600,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                    if (subtitle != null && subtitle!.trim().isNotEmpty) ...[
                      SizedBox(height: 3),
                      Text(
                        subtitle!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (selected)
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: context.posBrand.primary,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.check, size: 16, color: Theme.of(context).colorScheme.surface),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class PosProfessionalEmptyState extends StatelessWidget {
  const PosProfessionalEmptyState({
    super.key,
    required this.message,
    this.icon = Icons.search_off_outlined,
  });

  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 40, color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.6)),
          SizedBox(height: 12),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

Future<bool?> showPosConfirmDialog({
  required BuildContext context,
  required String title,
  String? subtitle,
  String? message,
  IconData icon = Icons.help_outline_rounded,
  String confirmLabel = 'Confirm',
  String cancelLabel = 'Cancel',
  bool destructive = false,
}) {
  return showPosDialog<bool>(
    context: context,
    builder: (ctx) => PosProfessionalDialogShell(
      title: title,
      subtitle: subtitle,
      icon: icon,
      maxWidth: 440,
      maxBodyHeight: 160,
      body: message == null
          ? const SizedBox.shrink()
          : Text(
              message,
              style: TextStyle(
                fontSize: 14,
                height: 1.5,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
      footer: PosProfessionalDialogFooter(
        secondaryLabel: cancelLabel,
        primaryLabel: confirmLabel,
        primaryDestructive: destructive,
        onSecondary: () => Navigator.pop(ctx, false),
        onPrimary: () => Navigator.pop(ctx, true),
      ),
    ),
  );
}

Future<void> showPosInfoDialog({
  required BuildContext context,
  required String title,
  String? subtitle,
  required String message,
  IconData icon = Icons.person_outline,
  String closeLabel = 'Close',
}) {
  return showPosDialog<void>(
    context: context,
    builder: (ctx) => PosProfessionalDialog(
      title: title,
      subtitle: subtitle,
      icon: icon,
      primaryLabel: closeLabel,
      onPrimary: () => Navigator.pop(ctx),
      maxWidth: 420,
      maxBodyHeight: 120,
      body: Text(
        message,
        style: TextStyle(
          fontSize: 14,
          height: 1.5,
          color: Theme.of(context).colorScheme.onSurface,
        ),
      ),
    ),
  );
}

Future<void> showRecentTransactionsDialog({
  required BuildContext context,
  required List<DashboardTransaction> transactions,
}) {
  return showPosDialog<void>(
    context: context,
    builder: (ctx) => PosProfessionalDialog(
      title: 'Recent Transactions',
      subtitle: 'Today at this terminal',
      icon: Icons.receipt_long_outlined,
      body: transactions.isEmpty
          ? const _RecentTransactionsEmpty()
          : _RecentTransactionsList(transactions: transactions),
      primaryLabel: 'Close',
      onPrimary: () => Navigator.pop(ctx),
    ),
  );
}

class _RecentTransactionsEmpty extends StatelessWidget {
  const _RecentTransactionsEmpty();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: context.posBrand.primaryLight.withValues(alpha: 0.65),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.point_of_sale_outlined,
              size: 36,
              color: context.posBrand.primary.withValues(alpha: 0.75),
            ),
          ),
          SizedBox(height: 18),
          Text(
            'No sales recorded today yet',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Completed transactions will appear here once you finish a sale.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              height: 1.45,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _RecentTransactionsList extends StatelessWidget {
  const _RecentTransactionsList({required this.transactions});

  final List<DashboardTransaction> transactions;

  @override
  Widget build(BuildContext context) {
    final timeFmt = DateFormat('h:mm a');

    return ListView.separated(
      shrinkWrap: true,
      itemCount: transactions.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, i) {
        final t = transactions[i];
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: context.posBrand.primaryLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Text(
                  t.paymentIcon,
                  style: TextStyle(fontSize: 18),
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t.orderId,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                    SizedBox(height: 4),
                    Row(
                      children: [
                        Text(
                          t.paymentLabel,
                          style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                        ),
                        Text(
                          ' · ',
                          style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                        Text(
                          timeFmt.format(t.createdAt),
                          style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                        ),
                        if (t.itemCount > 0) ...[
                          Text(
                            ' · ',
                            style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                          ),
                          Text(
                            '${t.itemCount} item${t.itemCount == 1 ? '' : 's'}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              SizedBox(width: 8),
              Text(
                formatPosMoney(t.total),
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: context.posBrand.primary,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
