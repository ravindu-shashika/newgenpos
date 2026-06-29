import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Increment to request return / exchange from the sidebar (PosScreen listens).
final posReturnSaleTriggerProvider = StateProvider<int>((ref) => 0);

final posExchangeSaleTriggerProvider = StateProvider<int>((ref) => 0);
