import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/app_providers.dart';

/// Signs the cashier out when the POS API goes offline and later comes back,
/// so reopening the backend does not keep an automatic session.
class ServerReconnectAuthGuard {
  ServerReconnectAuthGuard(this._ref);

  final Ref _ref;
  bool? _lastOnline;

  void start() {
    _ref.listen<AsyncValue<bool>>(
      isOnlineProvider,
      (previous, next) {
        unawaited(_onOnlineChanged(previous, next));
      },
    );
  }

  Future<void> _onOnlineChanged(
    AsyncValue<bool>? previous,
    AsyncValue<bool> next,
  ) async {
    final session = _ref.read(sessionServiceProvider);
    if (!session.isLoggedIn) {
      _lastOnline = next.valueOrNull;
      return;
    }

    final online = next.valueOrNull ?? false;
    final wasOnline = previous?.valueOrNull ?? _lastOnline;

    if (wasOnline == true && !online) {
      await session.markServerOfflineReauthPending();
    }

    if (wasOnline == false && online) {
      final signedOut = await session.applyServerOfflineReauthIfNeeded();
      if (signedOut) {
        _ref.read(sessionRevisionProvider.notifier).state++;
        _ref.invalidate(apiClientProvider);
      }
    }

    _lastOnline = online;
  }
}

final serverReconnectAuthGuardProvider = Provider<ServerReconnectAuthGuard>((ref) {
  final guard = ServerReconnectAuthGuard(ref);
  guard.start();
  return guard;
});
