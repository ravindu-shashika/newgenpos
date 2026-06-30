import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/pos/services/receipt_print_service.dart';
import '../config/app_config.dart';
import '../services/pos_connectivity_service.dart';
import 'app_providers.dart';
import 'local_print_settings_provider.dart';

final posConnectivityServiceProvider = Provider<PosConnectivityService>((ref) {
  return PosConnectivityService();
});

/// Network link, POS server, and printer — polled on an interval and via
/// [refreshPosLinkStatus].
class PosLinkStatus {
  const PosLinkStatus({
    required this.networkConnected,
    required this.serverOnline,
    required this.printerConnected,
  });

  final bool networkConnected;
  final bool serverOnline;
  final bool printerConnected;

  static const offline = PosLinkStatus(
    networkConnected: false,
    serverOnline: false,
    printerConnected: false,
  );
}

Future<bool> _probeBool(
  Future<bool> future, {
  Duration timeout = const Duration(seconds: 8),
}) async {
  try {
    return await future.timeout(timeout);
  } catch (_) {
    return false;
  }
}

class PosLinkStatusNotifier extends AsyncNotifier<PosLinkStatus> {
  Timer? _pollTimer;

  @override
  Future<PosLinkStatus> build() async {
    // Manual refresh hooks (printer settings, server settings, header tap).
    ref.watch(onlineRefreshTickProvider);
    ref.watch(printerRefreshTickProvider);

    ref.onDispose(() {
      _pollTimer?.cancel();
      _pollTimer = null;
    });

    _pollTimer ??= Timer.periodic(AppConfig.healthCheckInterval, (_) {
      // Re-probe without mutating tick providers from inside this notifier.
      ref.invalidateSelf();
    });

    return _probeLinkStatus();
  }

  Future<PosLinkStatus> _probeLinkStatus() async {
    final connectivity = ref.read(posConnectivityServiceProvider);
    final sync = ref.read(syncServiceProvider);
    await ref.read(localPrintSettingsProvider.notifier).ensureLoaded();
    final printSettings = ref.read(localPrintSettingsProvider);

    var network = false;
    var server = false;
    var printer = false;

    await Future.wait([
      _probeBool(connectivity.hasNetworkLink()).then((v) => network = v),
      _probeBool(sync.probeOnline(quiet: true)).then((v) => server = v),
      _probeBool(ReceiptPrintService.isPrinterAvailable(printSettings))
          .then((v) => printer = v),
    ]);

    return PosLinkStatus(
      networkConnected: network,
      serverOnline: server,
      printerConnected: printer,
    );
  }
}

final posLinkStatusProvider =
    AsyncNotifierProvider<PosLinkStatusNotifier, PosLinkStatus>(
  PosLinkStatusNotifier.new,
);

/// Refresh network, server, and printer status together.
void refreshPosLinkStatus(WidgetRef ref) {
  ref.read(onlineRefreshTickProvider.notifier).state++;
  ref.read(printerRefreshTickProvider.notifier).state++;
}
