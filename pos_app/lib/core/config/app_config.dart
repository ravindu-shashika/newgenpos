/// Set [AppConfig.runMode] to [AppRunMode.production] before release builds.
enum AppRunMode {
  development,
  production,
}

class AppConfig {
  AppConfig._();

  // ---------------------------------------------------------------------------
  // Change this single value to switch between development and production.
  // ---------------------------------------------------------------------------
  static const AppRunMode runMode = AppRunMode.development;

  /// Cloud API — development (Laravel APP_URL).
  static const String developmentAppUrl = 'http://127.0.0.1:8000';

  /// Cloud API — production (Laravel APP_URL, no trailing /pos).
  static const String productionAppUrl = 'https://kbt.newgenideas.com/api';

  static bool get isProduction => runMode == AppRunMode.production;

  static bool get isDevelopment => runMode == AppRunMode.development;

  static String get appUrl =>
      isProduction ? productionAppUrl : developmentAppUrl;

  static String get cloudBaseUrl => _normalizeRoot(appUrl);

  /// Cloud POS routes — `pos-api-new/routes/pos.php` mounted at `/pos`.
  static String get posBaseUrl => '$cloudBaseUrl/pos';

  /// Whether [url] points at this machine (loopback).
  static bool isLoopbackPosUrl(String? url) {
    final value = (url ?? '').toLowerCase();
    if (value.isEmpty) return false;
    return value.contains('127.0.0.1') ||
        value.contains('localhost') ||
        value.contains('0.0.0.0') ||
        value.contains('[::1]');
  }

  /// True when the device has a saved POS API URL ending with `/pos`.
  static bool hasStoredPosBaseUrl(String? stored) {
    final value = stored?.trim() ?? '';
    if (value.isEmpty) return false;
    final normalized = value.endsWith('/')
        ? value.substring(0, value.length - 1)
        : value;
    return normalized.toLowerCase().endsWith('/pos');
  }

  /// Saved URL is present and not loopback (safe for download / status).
  static bool hasUsablePosBaseUrl(String? stored) {
    if (!hasStoredPosBaseUrl(stored)) return false;
    return !isLoopbackPosUrl(stored);
  }

  /// Prefer the device-stored URL only. Never invent localhost when a real
  /// URL was configured. Falls back to build default only when nothing is stored.
  static String resolvePosBaseUrl([String? stored]) {
    final raw = stored?.trim() ?? '';
    if (raw.isNotEmpty) {
      var url = raw.endsWith('/') ? raw.substring(0, raw.length - 1) : raw;
      if (!url.toLowerCase().endsWith('/pos')) {
        url = '$url/pos';
      }
      return url;
    }
    return posBaseUrl;
  }

  /// Normalize user-entered API root for storage (must end with `/pos`).
  static String? normalizePosBaseUrlInput(String raw) {
    var url = raw.trim();
    if (url.isEmpty) return null;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://$url';
    }
    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    if (!url.toLowerCase().endsWith('/pos')) {
      url = '$url/pos';
    }
    return url;
  }

  /// Display label for a stored POS API URL (empty if not configured).
  static String displayPosBaseUrl([String? stored]) {
    if (!hasStoredPosBaseUrl(stored)) return '';
    return resolvePosBaseUrl(stored);
  }

  static String get environmentLabel =>
      isProduction ? 'production' : 'development';

  static String _normalizeRoot(String url) {
    var trimmed = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
    if (trimmed.toLowerCase().endsWith('/pos')) {
      trimmed = trimmed.substring(0, trimmed.length - 4);
    }
    return trimmed;
  }

  /// How often to call GET /pos/health for online status.
  static const Duration healthCheckInterval = Duration(minutes: 5);

  static const int maxSyncBatch = 20;

  static const int queueStatusPollAttempts = 8;

  static const Duration queueStatusPollDelay = Duration(seconds: 2);

  static const int downloadPageSizeResponsive = 500;
  static const int downloadPageSizeBulk = 2000;
  static const int dbWriteBatchSizeResponsive = 50;
  static const int dbWriteBatchSizeBulk = 300;
  static const int downloadParallelChunksResponsive = 1;
  static const int downloadParallelChunksBulk = 3;
  static const Duration downloadReceiveTimeoutResponsive =
      Duration(seconds: 120);
  static const Duration downloadReceiveTimeoutBulk = Duration(seconds: 300);

  static const int downloadPageSize = downloadPageSizeResponsive;
  static const int dbWriteBatchSize = dbWriteBatchSizeResponsive;

  static int downloadPageSizeFor({required bool bulk}) =>
      bulk ? downloadPageSizeBulk : downloadPageSizeResponsive;

  static int dbWriteBatchSizeFor({required bool bulk}) =>
      bulk ? dbWriteBatchSizeBulk : dbWriteBatchSizeResponsive;

  static int downloadParallelChunksFor({required bool bulk}) =>
      bulk ? downloadParallelChunksBulk : downloadParallelChunksResponsive;

  static Duration downloadReceiveTimeoutFor({required bool bulk}) =>
      bulk ? downloadReceiveTimeoutBulk : downloadReceiveTimeoutResponsive;
}
