import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/pos/models/local_database_settings.dart';
import '../repositories/local_database_settings_repository.dart';
import '../services/local_database_backup_service.dart';

final localDatabaseSettingsRepositoryProvider =
    Provider<LocalDatabaseSettingsRepository>((ref) {
  return LocalDatabaseSettingsRepository();
});

final localDatabaseSettingsProvider =
    StateNotifierProvider<LocalDatabaseSettingsNotifier, LocalDatabaseSettings>(
        (ref) {
  return LocalDatabaseSettingsNotifier(
    ref.watch(localDatabaseSettingsRepositoryProvider),
  );
});

final backupReminderDueProvider = StateProvider<bool>((ref) => false);

class LocalDatabaseSettingsNotifier
    extends StateNotifier<LocalDatabaseSettings> {
  LocalDatabaseSettingsNotifier(this._repo)
      : super(LocalDatabaseSettings.defaults()) {
    _load();
  }

  final LocalDatabaseSettingsRepository _repo;
  bool _loaded = false;

  Future<void> _load() async {
    state = await _repo.load();
    _loaded = true;
  }

  Future<void> ensureLoaded() async {
    if (_loaded) return;
    await _load();
  }

  Future<void> replace(LocalDatabaseSettings settings) async {
    state = settings;
    await _repo.save(settings);
  }

  Future<void> patch(LocalDatabaseSettings Function(LocalDatabaseSettings) fn) async {
    final next = fn(state);
    state = next;
    await _repo.save(next);
  }
}

final localDatabaseBackupServiceProvider =
    Provider<LocalDatabaseBackupService>((ref) {
  return LocalDatabaseBackupService(
    settingsRepository: ref.watch(localDatabaseSettingsRepositoryProvider),
  );
});
