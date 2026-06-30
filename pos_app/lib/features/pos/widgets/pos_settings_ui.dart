import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/pos_theme.dart';

/// Shared modern settings page chrome.
class PosSettingsPageHeader extends StatelessWidget {
  const PosSettingsPageHeader({
    super.key,
    required this.title,
    required this.subtitle,
    this.badges = const [],
  });

  final String title;
  final String subtitle;
  final List<Widget> badges;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: s.titleLarge.copyWith(fontSize: 26, height: 1.15)),
        SizedBox(height: 6),
        Text(
          subtitle,
          style: s.bodyMuted.copyWith(fontSize: 14, height: 1.4),
        ),
        if (badges.isNotEmpty) ...[
          SizedBox(height: 14),
          Wrap(spacing: 8, runSpacing: 8, children: badges),
        ],
      ],
    );
  }
}

class PosSettingsBadge extends StatelessWidget {
  const PosSettingsBadge({
    super.key,
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: s.cardBg,
        borderRadius: BorderRadius.circular(kPosButtonRadius),
        border: Border.all(color: s.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: s.accent),
          SizedBox(width: 6),
          Text(
            label,
            style: s.caption.copyWith(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: s.text,
            ),
          ),
        ],
      ),
    );
  }
}

class PosSettingsStatTile extends StatelessWidget {
  const PosSettingsStatTile({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: s.cardBg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: s.border),
        boxShadow: [
          BoxShadow(
            color: s.shadowColor.withValues(alpha: 0.06),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: s.accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(kPosButtonRadius),
            ),
            child: Icon(icon, size: 20, color: s.accent),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: s.caption.copyWith(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.3,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: s.titleMedium.copyWith(fontSize: 14),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class PosSettingsSectionCard extends StatelessWidget {
  const PosSettingsSectionCard({
    super.key,
    required this.icon,
    required this.title,
    required this.child,
    this.subtitle,
    this.trailing,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Container(
      decoration: BoxDecoration(
        color: s.cardBg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: s.border),
        boxShadow: [
          BoxShadow(
            color: s.shadowColor.withValues(alpha: 0.08),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 12, 0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: s.accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(kPosButtonRadius),
                  ),
                  child: Icon(icon, size: 22, color: s.accent),
                ),
                SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: s.titleMedium.copyWith(fontSize: 17, height: 1.2),
                      ),
                      if (subtitle != null && subtitle!.isNotEmpty) ...[
                        SizedBox(height: 4),
                        Text(
                          subtitle!,
                          style: s.bodyMuted.copyWith(fontSize: 13, height: 1.35),
                        ),
                      ],
                    ],
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
            child: child,
          ),
        ],
      ),
    );
  }
}

class PosSettingsActionTile extends StatelessWidget {
  const PosSettingsActionTile({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.destructive = false,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final accent = destructive ? s.danger : s.accent;
    final bg = destructive
        ? s.danger.withValues(alpha: 0.1)
        : s.accent.withValues(alpha: 0.1);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(kPosButtonRadius),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: s.elevatedBg,
            borderRadius: BorderRadius.circular(kPosButtonRadius),
            border: Border.all(color: s.border),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(kPosButtonRadius),
                ),
                child: Icon(icon, size: 20, color: accent),
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: s.titleMedium.copyWith(
                        fontSize: 14,
                        color: destructive ? s.danger : s.text,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: s.caption.copyWith(fontSize: 12),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: s.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}

class PosSettingsDivider extends StatelessWidget {
  const PosSettingsDivider({super.key});

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Divider(height: 1, color: s.border.withValues(alpha: 0.8)),
    );
  }
}

/// Hub row — opens a settings sub-page.
class PosSettingsMenuTile extends StatelessWidget {
  const PosSettingsMenuTile({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return PosSettingsActionTile(
      icon: icon,
      title: title,
      subtitle: subtitle,
      onTap: onTap,
    );
  }
}

/// Scrollable sub-page with back navigation to the settings hub.
class PosSettingsSubPageShell extends ConsumerWidget {
  const PosSettingsSubPageShell({
    super.key,
    required this.title,
    required this.subtitle,
    required this.onBack,
    required this.child,
  });

  final String title;
  final String subtitle;
  final VoidCallback onBack;
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = context.posStyles;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(28, 24, 28, 28),
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Material(
                    color: s.cardBg,
                    borderRadius: BorderRadius.circular(kPosButtonRadius),
                    child: InkWell(
                      onTap: onBack,
                      borderRadius: BorderRadius.circular(kPosButtonRadius),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          borderRadius:
                              BorderRadius.circular(kPosButtonRadius),
                          border: Border.all(color: s.border),
                        ),
                        child: Icon(
                          Icons.arrow_back_rounded,
                          size: 20,
                          color: s.text,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: PosSettingsPageHeader(
                      title: title,
                      subtitle: subtitle,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              child,
            ],
          ),
        ),
      ],
    );
  }
}
