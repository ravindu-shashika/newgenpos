import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../logging/app_logger.dart';
import '../providers/app_providers.dart';
import '../providers/local_database_settings_provider.dart';
import '../services/local_database_backup_service.dart';
import '../../features/pos/models/local_database_settings.dart';

/// Runs automatic backups or raises a reminder when backup is due.
class DatabaseBackupScheduler {
  DatabaseBackupScheduler(this._ref);

  final Ref _ref;
  Timer? _timer;
  bool _running = false;

  void start() {
    _restartTimer();
    _ref.listen<LocalDatabaseSettings>(localDatabaseSettingsProvider, (_, __) {
      _restartTimer();
      unawaited(_evaluateDue());
    });
  }

  void dispose() {
    _timer?.cancel();
    _timer = null;
  }

  void _restartTimer() {
    _timer?.cancel();
    _timer = null;

    final settings = _ref.read(localDatabaseSettingsProvider);
    if (settings.backupMode == LocalBackupMode.off) {
      _ref.read(backupReminderDueProvider.notifier).state = false;
      return;
    }

    _timer = Timer.periodic(const Duration(minutes: 15), (_) {
      unawaited(_evaluateDue());
    });

    Future<void>.delayed(const Duration(seconds: 25), () {
      unawaited(_evaluateDue());
    });
  }

  Future<void> _evaluateDue() async {
    if (_running) return;

    final session = _ref.read(sessionServiceProvider);
    if (!session.isLoggedIn) return;

    final settings = _ref.read(localDatabaseSettingsProvider);
    if (settings.backupMode == LocalBackupMode.off) {
      _ref.read(backupReminderDueProvider.notifier).state = false;
      return;
    }

    if (!LocalDatabaseBackupService.isBackupDue(settings)) {
      _ref.read(backupReminderDueProvider.notifier).state = false;
      return;
    }

    if (settings.backupMode == LocalBackupMode.remind) {
      _ref.read(backupReminderDueProvider.notifier).state = true;
      return;
    }

    await runBackup(silent: true);
  }

  Future<bool> runBackup({bool silent = false}) async {
    if (_running) return false;
    _running = true;
    try {
      final result = await _ref
          .read(localDatabaseBackupServiceProvider)
          .createBackup(_ref.read(appDatabaseProvider));
      _ref.read(backupReminderDueProvider.notifier).state = false;
      final settings =
          await _ref.read(localDatabaseSettingsRepositoryProvider).load();
      await _ref
          .read(localDatabaseSettingsProvider.notifier)
          .replace(settings);
      if (!silent) {
        AppLogger.info(
          'DatabaseBackupScheduler',
          'Backup saved to ${result.path}',
        );
      }
      return true;
    } catch (e, stack) {
      AppLogger.error('DatabaseBackupScheduler', 'Backup failed', e, stack);
      return false;
    } finally {
      _running = false;
    }
  }

  Future<void> snoozeReminder({Duration duration = const Duration(hours: 1)}) {
    final until = DateTime.now().add(duration).toUtc().toIso8601String();
    _ref.read(backupReminderDueProvider.notifier).state = false;
    return _ref.read(localDatabaseSettingsProvider.notifier).patch(
          (s) => s.copyWith(backupReminderSnoozedUntil: until),
        );
  }
}

final databaseBackupSchedulerProvider = Provider<DatabaseBackupScheduler>((ref) {
  final scheduler = DatabaseBackupScheduler(ref);
  scheduler.start();
  ref.onDispose(scheduler.dispose);
  return scheduler;
});
