import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import '../../features/pos/models/local_database_settings.dart';
import 'app_database.dart';

class LocalDatabaseConfig {
  LocalDatabaseConfig._();

  static Future<String> defaultDatabaseDirectory() async {
    final dir = await getApplicationDocumentsDirectory();
    return dir.path;
  }

  static Future<String> resolveDatabaseDirectory(
    LocalDatabaseSettings settings,
  ) async {
    final custom = settings.databaseDirectory?.trim();
    if (custom != null && custom.isNotEmpty) {
      final dir = Directory(custom);
      if (!dir.existsSync()) {
        await dir.create(recursive: true);
      }
      return custom;
    }
    return defaultDatabaseDirectory();
  }

  static Future<String> resolveDatabaseFilePath(
    LocalDatabaseSettings settings,
  ) async {
    final dir = await resolveDatabaseDirectory(settings);
    return p.join(dir, kLocalDatabaseFileName);
  }

  static Future<String> resolveBackupDirectory(
    LocalDatabaseSettings settings,
  ) async {
    final custom = settings.backupDirectory?.trim();
    if (custom != null && custom.isNotEmpty) {
      final dir = Directory(custom);
      if (!dir.existsSync()) {
        await dir.create(recursive: true);
      }
      return custom;
    }
    final dbDir = await resolveDatabaseDirectory(settings);
    final backupDir = p.join(dbDir, 'backups');
    await Directory(backupDir).create(recursive: true);
    return backupDir;
  }

  /// Copies the default DB into a new custom folder when the user changes path.
  static Future<void> migrateDatabaseIfNeeded(
    LocalDatabaseSettings settings,
  ) async {
    final custom = settings.databaseDirectory?.trim();
    if (custom == null || custom.isEmpty) return;

    final targetFile = File(await resolveDatabaseFilePath(settings));
    if (targetFile.existsSync()) return;

    final defaultDir = await defaultDatabaseDirectory();
    final defaultFile = File(p.join(defaultDir, kLocalDatabaseFileName));
    final legacyFile = File(p.join(defaultDir, 'pos.sqlite'));

    File? source;
    if (defaultFile.existsSync()) {
      source = defaultFile;
    } else if (legacyFile.existsSync()) {
      source = legacyFile;
    }
    if (source == null) return;

    await targetFile.parent.create(recursive: true);
    await source.copy(targetFile.path);

    for (final suffix in ['-wal', '-shm']) {
      final sidecar = File('${source.path}$suffix');
      if (sidecar.existsSync()) {
        await sidecar.copy('${targetFile.path}$suffix');
      }
    }
  }

  static String escapeSqlPath(String path) => path.replaceAll("'", "''");
}
