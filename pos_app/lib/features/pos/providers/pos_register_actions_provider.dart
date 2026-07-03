import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Increment to request return from the sidebar (PosScreen listens).
final posReturnSaleTriggerProvider = StateProvider<int>((ref) => 0);
