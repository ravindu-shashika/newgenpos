import 'dart:io' show NetworkInterface, Platform, Process;

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:network_info_plus/network_info_plus.dart';

/// Device MAC address and hostname for POS registration.
class DeviceIdentityService {
  DeviceIdentityService._();

  static Future<String> getMacAddress({String? fallbackDeviceId}) async {
    if (kIsWeb) {
      return _fallbackMac(fallbackDeviceId);
    }

    final candidates = <String>[];

    try {
      if (Platform.isWindows) {
        final mac = await _windowsMac();
        if (mac != null) candidates.add(mac);
      } else if (Platform.isLinux) {
        final mac = await _linuxMac();
        if (mac != null) candidates.add(mac);
      } else if (Platform.isMacOS) {
        final mac = await _macOsMac();
        if (mac != null) candidates.add(mac);
      }

      final wifiMac = await _wifiBssidMac();
      if (wifiMac != null) candidates.add(wifiMac);

      final interfaceMac = await _interfaceMac();
      if (interfaceMac != null) candidates.add(interfaceMac);
    } catch (_) {
      // Fall through to fallback.
    }

    for (final mac in candidates) {
      final normalized = normalizeMac(mac);
      if (normalized != null) return normalized;
    }

    return _fallbackMac(fallbackDeviceId);
  }

  static String getHostname() {
    if (kIsWeb) return 'Web POS';
    try {
      return Platform.localHostname;
    } catch (_) {
      return 'POS Device';
    }
  }

  static String? normalizeMac(String raw) {
    final hex = raw.replaceAll(RegExp(r'[^0-9A-Fa-f]'), '').toUpperCase();
    if (hex.length != 12) return null;
    return List.generate(6, (i) => hex.substring(i * 2, i * 2 + 2)).join(':');
  }

  static String _fallbackMac(String? deviceId) {
    final seed = (deviceId ?? 'pos-device')
        .replaceAll(RegExp(r'[^0-9A-Fa-f]'), '')
        .toUpperCase();
    final padded = '$seed${'0' * 12}'.substring(0, 12);
    return List.generate(6, (i) => padded.substring(i * 2, i * 2 + 2)).join(':');
  }

  static Future<String?> _windowsMac() async {
    final result = await Process.run('getmac', ['/fo', 'csv', '/nh']);
    if (result.exitCode != 0) return null;

    for (final line in (result.stdout as String).split('\n')) {
      final trimmed = line.trim();
      if (trimmed.isEmpty || trimmed.toLowerCase().contains('media disconnected')) {
        continue;
      }
      final parts = trimmed.split(',');
      if (parts.length >= 2) {
        final mac = normalizeMac(parts[1].replaceAll('"', '').trim());
        if (mac != null) return mac;
      }
    }
    return null;
  }

  static Future<String?> _linuxMac() async {
    final result = await Process.run('sh', [
      '-c',
      r"ip link | awk '/link\/ether/ {print $2; exit}'",
    ]);
    if (result.exitCode != 0) return null;
    return normalizeMac((result.stdout as String).trim());
  }

  static Future<String?> _macOsMac() async {
    final result = await Process.run('ifconfig', []);
    if (result.exitCode != 0) return null;

    final match = RegExp(r'ether ([0-9a-f:]{17})', caseSensitive: false)
        .firstMatch(result.stdout as String);
    return match != null ? normalizeMac(match.group(1)!) : null;
  }

  static Future<String?> _wifiBssidMac() async {
    try {
      final bssid = await NetworkInfo().getWifiBSSID();
      if (bssid == null || bssid == '02:00:00:00:00:00') return null;
      return normalizeMac(bssid);
    } catch (_) {
      return null;
    }
  }

  static Future<String?> _interfaceMac() async {
    try {
      final interfaces = await NetworkInterface.list(
        includeLinkLocal: true,
        includeLoopback: false,
      );
      for (final iface in interfaces) {
        final name = iface.name.toLowerCase();
        if (name.contains('loopback') || name == 'lo') continue;
        // dart:io does not expose MAC; kept for future platform support.
      }
    } catch (_) {}
    return null;
  }
}
