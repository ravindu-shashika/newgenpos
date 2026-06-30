import 'package:dio/dio.dart';

import '../logging/app_logger.dart';

/// Logs HTTP requests, responses, and errors for debugging.
class DioLoggingInterceptor extends Interceptor {
  DioLoggingInterceptor({required this.tag});

  final String tag;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.extra['quiet'] != true) {
      AppLogger.info(tag, '→ ${options.method} ${options.uri.path}');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response<dynamic> response, ResponseInterceptorHandler handler) {
    if (response.requestOptions.extra['quiet'] != true) {
      AppLogger.info(
        tag,
        '← ${response.statusCode} ${response.requestOptions.uri.path}',
      );
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.requestOptions.extra['quiet'] != true) {
      AppLogger.logDio(err, tag: tag);
    }
    handler.next(err);
  }
}
