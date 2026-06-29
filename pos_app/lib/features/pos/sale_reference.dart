import 'package:intl/intl.dart';

import 'models/pos_ui_settings.dart';

class SaleReferenceResult {
  const SaleReferenceResult({
    required this.reference,
    this.nextSequence,
  });

  final String reference;
  final int? nextSequence;
}

/// Build a sale reference using POS settings (legacy compact: posrYYYYMMDDhhmmss or posr1).
SaleReferenceResult generateSaleReference(
  PosUiSettings settings, {
  DateTime? at,
}) {
  final now = at ?? DateTime.now();
  var prefix = settings.saleReferencePrefix.trim();
  if (prefix.isEmpty) prefix = 'posr-';
  final compactPrefix = prefix.replaceAll('-', '').replaceAll(' ', '');

  if (settings.saleReferenceMode == 'sequential') {
    final seq = settings.saleReferenceNextSeq;
    final ref = '$compactPrefix$seq';
    return SaleReferenceResult(reference: ref, nextSequence: seq + 1);
  }

  final date = DateFormat('yyyyMMdd').format(now);
  final time = DateFormat('HHmmss').format(now);
  final ref = '$compactPrefix$date$time';
  return SaleReferenceResult(reference: ref);
}

/// Best reference string stored on a local sale (server wins when synced).
String resolveLocalSaleReference({
  required String clientUuid,
  String? referenceNo,
  String? serverReferenceNo,
}) {
  final server = serverReferenceNo?.trim();
  if (server != null && server.isNotEmpty) return server;
  final local = referenceNo?.trim();
  if (local != null && local.isNotEmpty) return local;
  return clientUuid;
}

/// Normalize for lookup (no dashes/spaces, lowercase).
String normalizeSaleReference(String? reference) {
  final raw = reference?.trim() ?? '';
  if (raw.isEmpty) return '';
  return raw.replaceAll('-', '').replaceAll(' ', '').toLowerCase();
}

/// Return credit bill ref: rr + yyyyMMdd + HHmmss.
String generateReturnReference({DateTime? at}) {
  final now = at ?? DateTime.now();
  final date = DateFormat('yyyyMMdd').format(now);
  final time = DateFormat('HHmmss').format(now);
  return 'rr$date$time';
}

/// Exchange invoice ref: exc + yyyyMMdd + HHmmss (same shape as sale refs).
String generateExchangeReference({DateTime? at}) {
  final now = at ?? DateTime.now();
  final date = DateFormat('yyyyMMdd').format(now);
  final time = DateFormat('HHmmss').format(now);
  return 'exc$date$time';
}

/// Single-line reference for UI/receipt (no dashes or spaces).
String formatSaleReferenceDisplay(String? reference) {
  final raw = reference?.trim() ?? '';
  if (raw.isEmpty) return '';
  return raw.replaceAll('-', '').replaceAll(' ', '').toUpperCase();
}
