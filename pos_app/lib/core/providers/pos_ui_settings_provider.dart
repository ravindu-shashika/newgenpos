import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/pos/models/pos_ui_settings.dart';
import '../repositories/pos_ui_settings_repository.dart';

final posUiSettingsRepositoryProvider =
    Provider<PosUiSettingsRepository>((ref) {
  return PosUiSettingsRepository();
});

final posUiSettingsProvider =
    StateNotifierProvider<PosUiSettingsNotifier, PosUiSettings>((ref) {
  return PosUiSettingsNotifier(ref.watch(posUiSettingsRepositoryProvider));
});

class PosUiSettingsNotifier extends StateNotifier<PosUiSettings> {
  PosUiSettingsNotifier(this._repo) : super(PosUiSettings.defaults()) {
    _load();
  }

  final PosUiSettingsRepository _repo;
  bool _loaded = false;

  Future<void> _load() async {
    state = await _repo.load();
    _loaded = true;
  }

  Future<void> ensureLoaded() async {
    if (_loaded) return;
    await _load();
  }

  Future<void> replace(PosUiSettings settings) async {
    state = settings;
    await _repo.save(settings);
  }

  Future<void> patch(PosUiSettings Function(PosUiSettings) fn) async {
    final next = fn(state);
    state = next;
    await _repo.save(next);
  }
}
