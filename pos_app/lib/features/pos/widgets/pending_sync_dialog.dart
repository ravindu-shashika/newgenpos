import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/app_database.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/providers/product_grid_provider.dart';
import '../../../core/theme/pos_app_styles.dart';
import 'pos_professional_dialog.dart';
import 'pos_toast.dart';
import 'show_pos_dialog.dart';

class PendingSyncUiResult {
  const PendingSyncUiResult({
    required this.synced,
    required this.pendingAfter,
    required this.wasOnline,
    this.errorMessage,
  });

  final int synced;
  final int pendingAfter;
  final bool wasOnline;
  final String? errorMessage;
}

/// Sidebar + dialog actions for uploading locally queued sales.
class PosPendingSyncActions {
  PosPendingSyncActions._();

  static Future<PendingSyncUiResult> syncNow(WidgetRef ref) async {
    if (ref.read(salesSyncInProgressProvider)) {
      final pending = await ref.read(pendingSyncCountProvider.future);
      return PendingSyncUiResult(
        synced: 0,
        pendingAfter: pending,
        wasOnline: true,
      );
    }

    ref.read(salesSyncInProgressProvider.notifier).state = true;
    try {
      final result = await ref.read(syncServiceProvider).syncPending(
            retryFailed: true,
          );
      ref.invalidate(pendingSyncCountProvider);
      ref.invalidate(pendingSalesForUiProvider);
      ref.read(syncRevisionProvider.notifier).update((n) => n + 1);

      final pendingAfter = await ref.read(pendingSyncCountProvider.future);
      if (pendingAfter == 0 && result.synced > 0) {
        await _refreshStockFromServer(ref);
      }

      return PendingSyncUiResult(
        synced: result.synced,
        pendingAfter: pendingAfter,
        wasOnline: result.wasOnline,
        errorMessage: result.errorMessage,
      );
    } finally {
      ref.read(salesSyncInProgressProvider.notifier).state = false;
    }
  }

  static Future<void> _refreshStockFromServer(WidgetRef ref) async {
    final session = ref.read(sessionServiceProvider);
    final warehouseId = session.warehouseId;
    if (warehouseId == null) return;
    try {
      await ref.read(catalogDownloadServiceProvider).refreshResourceDelta(
            resource: 'product_stock',
            deviceId: session.deviceId,
            warehouseId: warehouseId,
          );
      await ref.read(catalogDownloadServiceProvider).refreshResourceDelta(
            resource: 'product_batches',
            deviceId: session.deviceId,
            warehouseId: warehouseId,
          );
      reloadProductGrid(ref);
    } catch (_) {}
  }

  static void showResultSnack(BuildContext context, PendingSyncUiResult result) {
    if (!result.wasOnline) {
      PosToast.show(
        context,
        result.errorMessage ?? 'No connection to server',
        type: PosToastType.error,
      );
      return;
    }

    if (result.pendingAfter > 0) {
      PosToast.show(
        context,
        result.errorMessage != null
            ? 'Sync failed: ${result.errorMessage} (${result.pendingAfter} remaining)'
            : '${result.pendingAfter} sale(s) still not synced',
        type: PosToastType.error,
      );
      return;
    }

    if (result.synced > 0) {
      PosToast.show(
        context,
        'Synced ${result.synced} sale(s) to server',
        type: PosToastType.success,
      );
    } else {
      PosToast.show(
        context,
        'No sales waiting to sync',
        type: PosToastType.info,
      );
    }
  }
}

Future<void> showPendingSyncDialog({
  required BuildContext context,
  required WidgetRef ref,
}) {
  return showPosDialog<void>(
    context: context,
    builder: (ctx) => const _PendingSyncDialog(),
  );
}

class _PendingSyncDialog extends ConsumerStatefulWidget {
  const _PendingSyncDialog();

  @override
  ConsumerState<_PendingSyncDialog> createState() => _PendingSyncDialogState();
}

class _PendingSyncDialogState extends ConsumerState<_PendingSyncDialog> {
  bool _syncing = false;

  Future<void> _syncNow() async {
    if (_syncing) return;
    setState(() => _syncing = true);
    try {
      final result = await PosPendingSyncActions.syncNow(ref);
      if (!mounted) return;
      PosPendingSyncActions.showResultSnack(context, result);
      if (result.pendingAfter == 0 && result.synced >= 0) {
        Navigator.pop(context);
      }
    } finally {
      if (mounted) setState(() => _syncing = false);
    }
  }

  String _statusLabel(String status) {
    return switch (status) {
      'queued' => 'Queued on server',
      'failed' => 'Failed',
      'pending' => 'Pending upload',
      _ => status,
    };
  }

  Color _statusColor(String status, PosAppStyles s) {
    return switch (status) {
      'failed' => s.danger,
      'queued' => s.accent,
      _ => s.textMuted,
    };
  }

  @override
  Widget build(BuildContext context) {
    final pendingAsync = ref.watch(pendingSyncCountProvider);
    final salesAsync = ref.watch(pendingSalesForUiProvider);
    final pending = pendingAsync.valueOrNull ?? 0;
    final sales = salesAsync.valueOrNull ?? const <LocalSale>[];
    final failedOrQueued =
        sales.where((s) => s.syncStatus == 'failed' || s.syncStatus == 'queued');
    final s = context.posStyles;
    final syncing = _syncing || ref.watch(salesSyncInProgressProvider);

    return PosProfessionalDialogShell(
      title: 'Pending sync',
      subtitle: 'Sales saved on this device',
      icon: Icons.cloud_upload_outlined,
      maxWidth: 520,
      maxBodyHeight: 360,
      onClose: syncing ? () {} : () => Navigator.pop(context),
      footer: Row(
        children: [
          OutlinedButton(
            onPressed: syncing ? null : () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          const Spacer(),
          FilledButton.icon(
            onPressed: syncing || pending == 0 ? null : _syncNow,
            icon: syncing
                ? SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: s.onBrand,
                    ),
                  )
                : const Icon(Icons.sync_rounded, size: 18),
            label: Text(syncing ? 'Syncing…' : 'Sync now'),
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
            decoration: BoxDecoration(
              color: pending > 0
                  ? s.danger.withValues(alpha: 0.1)
                  : s.success.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: pending > 0
                    ? s.danger.withValues(alpha: 0.35)
                    : s.success.withValues(alpha: 0.35),
              ),
            ),
            child: Column(
              children: [
                Text(
                  pending == 1 ? '1 sale pending' : '$pending sales pending',
                  style: s.titleMedium.copyWith(fontSize: 20),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  pending > 0
                      ? 'Upload queued sales when you are back online.'
                      : 'All sales are synced to the server.',
                  textAlign: TextAlign.center,
                  style: s.bodyMuted,
                ),
              ],
            ),
          ),
          if (failedOrQueued.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Details', style: s.titleMedium),
            const SizedBox(height: 8),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: failedOrQueued.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final sale = failedOrQueued.elementAt(index);
                  final refNo = sale.referenceNo ?? sale.clientUuid;
                  final err = sale.errorMessage;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    title: Text(
                      refNo,
                      style: s.body,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: err != null && err.isNotEmpty
                        ? Text(
                            err,
                            style: s.bodyMuted.copyWith(color: s.danger),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          )
                        : null,
                    trailing: Text(
                      _statusLabel(sale.syncStatus),
                      style: s.caption.copyWith(
                        color: _statusColor(sale.syncStatus, s),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
          if (pendingAsync.isLoading || salesAsync.isLoading) ...[
            const SizedBox(height: 16),
            const Center(child: CircularProgressIndicator()),
          ],
        ],
      ),
    );
  }
}
