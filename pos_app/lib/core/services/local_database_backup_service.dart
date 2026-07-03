import 'dart:io';

import 'package:intl/intl.dart';
import 'package:path/path.dart' as p;

import '../database/app_database.dart';
import '../database/local_database_config.dart';
import '../repositories/local_database_settings_repository.dart';
import '../../features/pos/models/local_database_settings.dart';

class LocalDatabaseBackupResult {
  const LocalDatabaseBackupResult({
    required this.path,
    required this.createdAt,
  });

  final String path;
  final DateTime createdAt;
}

class LocalDatabaseBackupService {
  LocalDatabaseBackupService({
    LocalDatabaseSettingsRepository? settingsRepository,
  }) : _settingsRepository =
            settingsRepository ?? LocalDatabaseSettingsRepository();

  final LocalDatabaseSettingsRepository _settingsRepository;

  Future<LocalDatabaseBackupResult> createBackup(AppDatabase db) async {
    final settings = await _settingsRepository.load();
    final backupDir = await LocalDatabaseConfig.resolveBackupDirectory(settings);
    final stamp = DateFormat('yyyyMMdd-HHmmss').format(DateTime.now());
    final destPath = p.join(backupDir, 'newgenpos-backup-$stamp.sqlite');
    final escaped = LocalDatabaseConfig.escapeSqlPath(destPath);

    await db.customStatement('PRAGMA wal_checkpoint(TRUNCATE);');
    await db.customStatement("VACUUM INTO '$escaped'");

    await _pruneOldBackups(backupDir, settings.maxBackupCopies);

    final createdAt = DateTime.now().toUtc();
    await _settingsRepository.save(
      settings.copyWith(
        lastBackupAt: createdAt.toIso8601String(),
        clearBackupReminderSnoozedUntil: true,
      ),
    );

    return LocalDatabaseBackupResult(path: destPath, createdAt: createdAt);
  }

  Future<void> _pruneOldBackups(String backupDir, int keepCount) async {
    final dir = Directory(backupDir);
    if (!dir.existsSync()) return;

    final files = dir
        .listSync()
        .whereType<File>()
        .where((f) => p.basename(f.path).startsWith('newgenpos-backup-'))
        .where((f) => f.path.endsWith('.sqlite'))
        .toList()
      ..sort(
        (a, b) => b.lastModifiedSync().compareTo(a.lastModifiedSync()),
      );

    for (var i = keepCount; i < files.length; i++) {
      try {
        await files[i].delete();
      } catch (_) {}
    }
  }

  static bool isBackupDue(LocalDatabaseSettings settings) {
    if (settings.backupMode == LocalBackupMode.off) return false;

    final snoozedUntil = _parseIso(settings.backupReminderSnoozedUntil);
    if (snoozedUntil != null && DateTime.now().isBefore(snoozedUntil)) {
      return false;
    }

    final last = _parseIso(settings.lastBackupAt);
    if (last == null) return true;

    final dueAt = last.add(Duration(hours: settings.backupIntervalHours));
    return !DateTime.now().isBefore(dueAt);
  }

  static DateTime? _parseIso(String? raw) {
    if (raw == null || raw.trim().isEmpty) return null;
    return DateTime.tryParse(raw);
  }
}
