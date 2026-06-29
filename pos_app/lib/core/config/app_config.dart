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

  /// Cloud API — production (Laravel APP_URL).
  static const String productionAppUrl = 'https://pos.yourcompany.com';

  static bool get isProduction => runMode == AppRunMode.production;

  static bool get isDevelopment => runMode == AppRunMode.development;

  static String get appUrl =>
      isProduction ? productionAppUrl : developmentAppUrl;

  static String get cloudBaseUrl => _normalizeRoot(appUrl);

  /// Cloud POS routes — `pos-api-new/routes/pos.php` mounted at `/pos`.
  static String get posBaseUrl => '$cloudBaseUrl/pos';

  /// Device-stored POS base URL, or [posBaseUrl] when unset/invalid.
  static String resolvePosBaseUrl([String? stored]) {
    var url = (stored != null && stored.trim().isNotEmpty)
        ? stored.trim()
        : posBaseUrl;
    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    if (!url.endsWith('/pos')) {
      return posBaseUrl;
    }
    return url;
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
    if (!url.endsWith('/pos')) {
      url = '$url/pos';
    }
    return url;
  }

  /// Display label for a stored or default POS API URL.
  static String displayPosBaseUrl([String? stored]) =>
      resolvePosBaseUrl(stored);

  static String get environmentLabel =>
      isProduction ? 'production' : 'development';

  static String _normalizeRoot(String url) {
    var trimmed = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
    if (trimmed.endsWith('/pos')) {
      trimmed = trimmed.substring(0, trimmed.length - 4);
    }
    return trimmed;
  }

  /// How often to call GET /pos/health for online status.
  static const Duration healthCheckInterval = Duration(minutes: 5);

  static const int maxSyncBatch = 20;

  /// After server accepts a sale into the queue, poll sync-status this many times.
  /// Status polls after queue accept (only while sales still processing).
  static const int queueStatusPollAttempts = 8;

  static const Duration queueStatusPollDelay = Duration(seconds: 2);

  static const int downloadPageSize = 500;
  static const int dbWriteBatchSize = 50;
}
