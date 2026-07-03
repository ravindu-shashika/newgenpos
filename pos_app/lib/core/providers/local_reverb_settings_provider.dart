import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/pos/models/local_reverb_settings.dart';
import '../repositories/local_reverb_settings_repository.dart';

final localReverbSettingsRepositoryProvider =
    Provider<LocalReverbSettingsRepository>((ref) {
  return LocalReverbSettingsRepository();
});

final localReverbSettingsProvider =
    StateNotifierProvider<LocalReverbSettingsNotifier, LocalReverbSettings>(
        (ref) {
  return LocalReverbSettingsNotifier(
    ref.watch(localReverbSettingsRepositoryProvider),
  );
});

class LocalReverbSettingsNotifier extends StateNotifier<LocalReverbSettings> {
  LocalReverbSettingsNotifier(this._repo)
      : super(LocalReverbSettings.defaults()) {
    _load();
  }

  final LocalReverbSettingsRepository _repo;
  bool _loaded = false;

  Future<void> _load() async {
    state = await _repo.load();
    _loaded = true;
  }

  Future<void> ensureLoaded() async {
    if (_loaded) return;
    await _load();
  }

  Future<void> replace(LocalReverbSettings settings) async {
    state = settings;
    await _repo.save(settings);
  }

  Future<void> patch(
    LocalReverbSettings Function(LocalReverbSettings) fn,
  ) async {
    final next = fn(state);
    state = next;
    await _repo.save(next);
  }
}
