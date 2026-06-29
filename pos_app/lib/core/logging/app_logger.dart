import 'dart:developer' as developer;

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

/// Central logging for POS app — debug console + dart developer log.
class AppLogger {
  AppLogger._();

  static const String _root = 'PosApp';

  static void info(String tag, String message, [Object? detail]) {
    final line = detail == null ? message : '$message | $detail';
    developer.log(line, name: '$_root/$tag');
    if (kDebugMode) {
      debugPrint('[$tag] $line');
    }
  }

  static void warning(String tag, String message, [Object? detail]) {
    final line = detail == null ? message : '$message | $detail';
    developer.log(line, name: '$_root/$tag', level: 900);
    if (kDebugMode) {
      debugPrint('[$tag] WARN: $line');
    }
  }

  static void error(
    String tag,
    String message, [
    Object? error,
    StackTrace? stackTrace,
  ]) {
    developer.log(
      message,
      name: '$_root/$tag',
      error: error,
      stackTrace: stackTrace,
      level: 1000,
    );
    if (kDebugMode) {
      debugPrint('[$tag] ERROR: $message');
      if (error != null) debugPrint('  cause: $error');
      if (stackTrace != null) {
        try {
          debugPrint('  $stackTrace');
        } catch (_) {
          debugPrint('  (stack trace unavailable)');
        }
      }
    }
  }

  /// Short message safe to show in UI (not full Dio stack trace).
  static String userMessage(Object error) {
    if (error is DioException) {
      return _dioUserMessage(error);
    }
    final text = error.toString();
    if (text.startsWith('Exception: ')) {
      return text.substring('Exception: '.length);
    }
    return text;
  }

  static void logDio(DioException e, {required String tag, String? context}) {
    final buf = StringBuffer();
    if (context != null && context.isNotEmpty) {
      buf.writeln('context: $context');
    }
    buf.writeln('${e.requestOptions.method} ${e.requestOptions.uri}');
    buf.writeln('type: ${e.type}');
    if (e.response != null) {
      buf.writeln('status: ${e.response?.statusCode}');
      buf.writeln('body: ${e.response?.data}');
    } else {
      buf.writeln('message: ${e.message}');
    }
    error(tag, buf.toString().trim(), e, e.stackTrace);
  }

  static String _dioUserMessage(DioException e) {
    final serverMsg = _extractServerMessage(e.response?.data);
    if (serverMsg != null && serverMsg.isNotEmpty) {
      return serverMsg;
    }

    final status = e.response?.statusCode;
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timed out. Check server and network.';
      case DioExceptionType.connectionError:
        return 'Cannot reach server at ${e.requestOptions.baseUrl}.';
      case DioExceptionType.badResponse:
        if (status == 401) {
          return 'Unauthorized. Re-register or activate terminal.';
        }
        if (status == 403) {
          return 'Access denied. Terminal may not be active.';
        }
        if (status == 404) {
          return 'API not found (${e.requestOptions.path}).';
        }
        if (status != null && status >= 500) {
          return 'Server error ($status). Check Laravel storage/logs.';
        }
        return 'Request failed${status != null ? ' (HTTP $status)' : ''}.';
      case DioExceptionType.cancel:
        return 'Request cancelled.';
      default:
        return e.message ?? 'Network request failed.';
    }
  }

  static String? _extractServerMessage(dynamic data) {
    if (data is Map) {
      final message = data['message'];
      if (message is String && message.isNotEmpty) return message;
      final error = data['error'];
      if (error is String && error.isNotEmpty) return error;
    }
    if (data is String && data.isNotEmpty && data.length < 400) {
      return data;
    }
    return null;
  }
}
