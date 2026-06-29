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

/// Network link, POS server, and printer — polled via [onlineRefreshTickProvider].
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

Future<PosLinkStatus> _loadPosLinkStatus(Ref ref) async {
  ref.watch(onlineRefreshTickProvider);
  ref.watch(printerRefreshTickProvider);

  final connectivity = ref.read(posConnectivityServiceProvider);
  final sync = ref.read(syncServiceProvider);
  await ref.read(localPrintSettingsProvider.notifier).ensureLoaded();
  final printSettings = ref.read(localPrintSettingsProvider);

  var network = false;
  var server = false;
  var printer = false;

  await Future.wait([
    _probeBool(connectivity.hasNetworkLink()).then((v) => network = v),
    _probeBool(sync.probeOnline(force: true)).then((v) => server = v),
    _probeBool(ReceiptPrintService.isPrinterAvailable(printSettings))
        .then((v) => printer = v),
  ]);

  return PosLinkStatus(
    networkConnected: network,
    serverOnline: server,
    printerConnected: printer,
  );
}

final posLinkStatusProvider = FutureProvider<PosLinkStatus>((ref) async {
  final timer = Timer.periodic(AppConfig.healthCheckInterval, (_) {
    ref.read(onlineRefreshTickProvider.notifier).state++;
    ref.read(printerRefreshTickProvider.notifier).state++;
  });
  ref.onDispose(timer.cancel);

  return _loadPosLinkStatus(ref);
});

/// Refresh network, server, and printer status together.
void refreshPosLinkStatus(WidgetRef ref) {
  Future<void>.microtask(() {
    ref.read(onlineRefreshTickProvider.notifier).state++;
    ref.read(printerRefreshTickProvider.notifier).state++;
  });
}
