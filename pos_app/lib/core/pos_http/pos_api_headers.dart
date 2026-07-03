import '../config/app_config.dart';

/// Standard HTTP headers sent on every POS app API request.
class PosApiHeaders {
  PosApiHeaders._();

  /// Keep in sync with [pubspec.yaml] `version` (major.minor.patch).
  static const String clientVersion = '0.1.0';

  static const String userAgent =
      'NewGenPOS/$clientVersion (pos_app; Flutter)';

  /// Default headers for `/pos/*` requests.
  static Map<String, String> forPosBaseUrl(String posBaseUrl) => {
        'Accept': 'application/json',
        'User-Agent': userAgent,
        'Referer': refererForPosBaseUrl(posBaseUrl),
      };

  /// Referer derived from a full auth URL (e.g. broadcasting auth endpoint).
  static Map<String, String> forAuthEndpoint(String authEndpoint) {
    final uri = Uri.parse(authEndpoint.trim());
    final portPart =
        uri.hasPort && uri.port != 80 && uri.port != 443 ? ':${uri.port}' : '';
    final referer = '${uri.scheme}://${uri.host}$portPart/';
    return {
      'Accept': 'application/json',
      'User-Agent': userAgent,
      'Referer': referer,
    };
  }

  /// Site root URL used as Referer (`APP_URL/`), from a `/pos` base URL.
  static String refererForPosBaseUrl(String posBaseUrl) {
    var url = posBaseUrl.trim();
    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    if (url.endsWith('/pos')) {
      url = url.substring(0, url.length - 4);
    }
    if (url.isEmpty) {
      url = AppConfig.cloudBaseUrl;
    }
    return '$url/';
  }
}
