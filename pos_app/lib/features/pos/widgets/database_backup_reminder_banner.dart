import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/local_database_settings_provider.dart';
import '../../../core/sync/database_backup_scheduler.dart';
import '../../../core/theme/pos_theme.dart';
import '../providers/pos_settings_subpage_provider.dart';
import 'pos_toast.dart';

class DatabaseBackupReminderBanner extends ConsumerWidget {
  const DatabaseBackupReminderBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final due = ref.watch(backupReminderDueProvider);
    if (!due) return const SizedBox.shrink();

    return Material(
      elevation: 2,
      color: context.posBrand.primaryLight.withValues(alpha: 0.95),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              Icon(
                Icons.backup_outlined,
                color: context.posBrand.primary,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Local database backup is due. Create a backup now?',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              ),
              TextButton(
                onPressed: () {
                  unawaited(
                    ref.read(databaseBackupSchedulerProvider).snoozeReminder(),
                  );
                },
                child: const Text('Later'),
              ),
              const SizedBox(width: 4),
              FilledButton(
                onPressed: () => unawaited(_backupNow(context, ref)),
                style: FilledButton.styleFrom(
                  backgroundColor: context.posBrand.buttonPrimary,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Backup now'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _backupNow(BuildContext context, WidgetRef ref) async {
    final ok = await ref.read(databaseBackupSchedulerProvider).runBackup();
    if (!context.mounted) return;
    PosToast.show(
      context,
      ok ? 'Database backup created' : 'Backup failed',
      type: ok ? PosToastType.success : PosToastType.error,
    );
    if (ok) {
      final settings =
          await ref.read(localDatabaseSettingsRepositoryProvider).load();
      await ref.read(localDatabaseSettingsProvider.notifier).replace(settings);
    }
  }
}

void openLocalDataSettingsFromReminder(WidgetRef ref) {
  openPosSettingsSubPage(ref, PosSettingsSubPage.localData);
}
