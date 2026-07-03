import 'dart:convert';

enum LocalBackupMode {
  off,
  auto,
  remind,
}

class LocalDatabaseSettings {
  const LocalDatabaseSettings({
    this.databaseDirectory,
    this.backupDirectory,
    this.backupMode = LocalBackupMode.remind,
    this.backupIntervalHours = defaultBackupIntervalHours,
    this.maxBackupCopies = defaultMaxBackupCopies,
    this.lastBackupAt,
    this.backupReminderSnoozedUntil,
  });

  /// Empty = app documents folder.
  final String? databaseDirectory;

  /// Empty = `{databaseDirectory}/backups`.
  final String? backupDirectory;

  final LocalBackupMode backupMode;
  final int backupIntervalHours;
  final int maxBackupCopies;
  final String? lastBackupAt;
  final String? backupReminderSnoozedUntil;

  static const defaultBackupIntervalHours = 24;
  static const defaultMaxBackupCopies = 3;
  static const backupIntervalPresets = [3, 6, 12, 24, 48, 72];
  static const maxBackupCopyPresets = [1, 2, 3, 5, 7, 10, 20];

  static int resolveBackupIntervalHours(int? raw) {
    final value = raw ?? defaultBackupIntervalHours;
    if (!backupIntervalPresets.contains(value)) {
      return defaultBackupIntervalHours;
    }
    return value;
  }

  static int resolveMaxBackupCopies(int? raw) {
    final value = raw ?? defaultMaxBackupCopies;
    if (!maxBackupCopyPresets.contains(value)) {
      return defaultMaxBackupCopies;
    }
    return value;
  }

  static LocalBackupMode parseBackupMode(String? raw) {
    switch (raw?.trim().toLowerCase()) {
      case 'auto':
        return LocalBackupMode.auto;
      case 'remind':
        return LocalBackupMode.remind;
      default:
        return LocalBackupMode.off;
    }
  }

  String get backupModeKey {
    switch (backupMode) {
      case LocalBackupMode.auto:
        return 'auto';
      case LocalBackupMode.remind:
        return 'remind';
      case LocalBackupMode.off:
        return 'off';
    }
  }

  LocalDatabaseSettings copyWith({
    String? databaseDirectory,
    bool clearDatabaseDirectory = false,
    String? backupDirectory,
    bool clearBackupDirectory = false,
    LocalBackupMode? backupMode,
    int? backupIntervalHours,
    int? maxBackupCopies,
    String? lastBackupAt,
    bool clearLastBackupAt = false,
    String? backupReminderSnoozedUntil,
    bool clearBackupReminderSnoozedUntil = false,
  }) {
    return LocalDatabaseSettings(
      databaseDirectory: clearDatabaseDirectory
          ? null
          : (databaseDirectory ?? this.databaseDirectory),
      backupDirectory: clearBackupDirectory
          ? null
          : (backupDirectory ?? this.backupDirectory),
      backupMode: backupMode ?? this.backupMode,
      backupIntervalHours: backupIntervalHours ?? this.backupIntervalHours,
      maxBackupCopies: maxBackupCopies ?? this.maxBackupCopies,
      lastBackupAt:
          clearLastBackupAt ? null : (lastBackupAt ?? this.lastBackupAt),
      backupReminderSnoozedUntil: clearBackupReminderSnoozedUntil
          ? null
          : (backupReminderSnoozedUntil ?? this.backupReminderSnoozedUntil),
    );
  }

  factory LocalDatabaseSettings.defaults() => const LocalDatabaseSettings();

  factory LocalDatabaseSettings.fromJson(Map<String, dynamic> json) {
    return LocalDatabaseSettings(
      databaseDirectory: _nonEmpty(json['database_directory']),
      backupDirectory: _nonEmpty(json['backup_directory']),
      backupMode: parseBackupMode(json['backup_mode']?.toString()),
      backupIntervalHours: resolveBackupIntervalHours(
        _intOrNull(json['backup_interval_hours']),
      ),
      maxBackupCopies: resolveMaxBackupCopies(
        _intOrNull(json['max_backup_copies']),
      ),
      lastBackupAt: json['last_backup_at']?.toString(),
      backupReminderSnoozedUntil:
          json['backup_reminder_snoozed_until']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        if (databaseDirectory != null)
          'database_directory': databaseDirectory,
        if (backupDirectory != null) 'backup_directory': backupDirectory,
        'backup_mode': backupModeKey,
        'backup_interval_hours': backupIntervalHours,
        'max_backup_copies': maxBackupCopies,
        if (lastBackupAt != null) 'last_backup_at': lastBackupAt,
        if (backupReminderSnoozedUntil != null)
          'backup_reminder_snoozed_until': backupReminderSnoozedUntil,
      };

  String encode() => jsonEncode(toJson());

  static LocalDatabaseSettings decode(String raw) =>
      LocalDatabaseSettings.fromJson(jsonDecode(raw) as Map<String, dynamic>);

  static String? _nonEmpty(dynamic value) {
    final text = value?.toString().trim();
    if (text == null || text.isEmpty) return null;
    return text;
  }

  static int? _intOrNull(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    return int.tryParse(value.toString());
  }
}
