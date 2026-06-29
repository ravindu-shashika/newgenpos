import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/pos/models/local_print_settings.dart';
import '../../features/pos/services/receipt_print_service.dart';
import '../repositories/local_print_settings_repository.dart';

/// Increment to re-run [isPrinterConnectedProvider].
final printerRefreshTickProvider = StateProvider<int>((ref) => 0);

final isPrinterConnectedProvider = FutureProvider<bool>((ref) async {
  ref.watch(printerRefreshTickProvider);
  final settings = ref.watch(localPrintSettingsProvider);
  return ReceiptPrintService.isPrinterAvailable(settings);
});

final localPrintSettingsRepositoryProvider =
    Provider<LocalPrintSettingsRepository>((ref) {
  return LocalPrintSettingsRepository();
});

final localPrintSettingsProvider =
    StateNotifierProvider<LocalPrintSettingsNotifier, LocalPrintSettings>(
        (ref) {
  return LocalPrintSettingsNotifier(
    ref.watch(localPrintSettingsRepositoryProvider),
  );
});

class LocalPrintSettingsNotifier extends StateNotifier<LocalPrintSettings> {
  LocalPrintSettingsNotifier(this._repo)
      : super(LocalPrintSettings.defaults()) {
    _load();
  }

  final LocalPrintSettingsRepository _repo;
  bool _loaded = false;

  Future<void> _load() async {
    state = await _repo.load();
    _loaded = true;
  }

  Future<void> ensureLoaded() async {
    if (_loaded) return;
    await _load();
  }

  Future<void> replace(LocalPrintSettings settings) async {
    state = settings;
    await _repo.save(settings);
  }

  Future<void> patch(LocalPrintSettings Function(LocalPrintSettings) fn) async {
    final next = fn(state);
    state = next;
    await _repo.save(next);
  }
}
