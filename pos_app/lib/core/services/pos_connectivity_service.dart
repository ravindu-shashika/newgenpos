import 'dart:async';
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:network_info_plus/network_info_plus.dart';

/// Device network link detection (separate from POS server health).
class PosConnectivityService {
  PosConnectivityService({
    Connectivity? connectivity,
    NetworkInfo? networkInfo,
  })  : _connectivity = connectivity ?? Connectivity(),
        _networkInfo = networkInfo ?? NetworkInfo();

  final Connectivity _connectivity;
  final NetworkInfo _networkInfo;

  static const _probeTimeout = Duration(seconds: 5);

  /// Wi‑Fi, Ethernet, mobile, or VPN interface is up.
  Future<bool> hasNetworkLink() async {
    try {
      final results = await _connectivity
          .checkConnectivity()
          .timeout(_probeTimeout);
      if (results.isNotEmpty &&
          results.any((r) => r != ConnectivityResult.none)) {
        return true;
      }
    } catch (_) {}

    try {
      final wifiIp = await _networkInfo.getWifiIP().timeout(_probeTimeout);
      if (wifiIp != null && wifiIp.isNotEmpty && wifiIp != '0.0.0.0') {
        return true;
      }
    } catch (_) {}

    try {
      final interfaces = await NetworkInterface.list(
        includeLinkLocal: false,
        type: InternetAddressType.IPv4,
      ).timeout(_probeTimeout);
      for (final iface in interfaces) {
        for (final addr in iface.addresses) {
          if (!addr.isLoopback && addr.address.isNotEmpty) {
            return true;
          }
        }
      }
    } catch (_) {}

    return false;
  }
}
