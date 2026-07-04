import 'package:drift/drift.dart' show OrderingTerm;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/database/app_database.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/theme/pos_theme.dart';
import '../models/cart_line.dart';
import '../pos_checkout_state.dart';
import '../pos_currency.dart';
import '../sale_reference.dart';
import 'pos_professional_dialog.dart';
import 'pos_toast.dart';
import 'show_pos_dialog.dart';

/// Opens held (draft) bills. Tap a row to load it into the cart (cart must be empty).
Future<void> showHoldBillsDialog({
  required BuildContext context,
  required WidgetRef ref,
  VoidCallback? onBeforeLoad,
}) {
  return showPosDialog<void>(
    context: context,
    builder: (ctx) => _HoldBillsDialog(onBeforeLoad: onBeforeLoad),
  );
}

class _HoldBillsDialog extends ConsumerStatefulWidget {
  const _HoldBillsDialog({this.onBeforeLoad});

  final VoidCallback? onBeforeLoad;

  @override
  ConsumerState<_HoldBillsDialog> createState() => _HoldBillsDialogState();
}

class _HoldBillsDialogState extends ConsumerState<_HoldBillsDialog> {
  bool _loading = true;
  bool _busy = false;
  List<LocalSale> _drafts = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final db = ref.read(appDatabaseProvider);
    final sales = await (db.select(db.localSales)
          ..where((s) => s.saleStatus.equals(3))
          ..orderBy([(s) => OrderingTerm.desc(s.createdAt)])
          ..limit(50))
        .get();
    if (!mounted) return;
    setState(() {
      _drafts = sales;
      _loading = false;
    });
  }

  String _refLabel(LocalSale s) {
    return formatSaleReferenceDisplay(
      resolveLocalSaleReference(
        clientUuid: s.clientUuid,
        referenceNo: s.referenceNo,
        serverReferenceNo: s.serverReferenceNo,
      ),
    );
  }

  String _timeLabel(LocalSale s) {
    return DateFormat('dd MMM yyyy · HH:mm').format(s.createdAt.toLocal());
  }

  Future<void> _loadToCart(LocalSale sale) async {
    if (_busy) return;

    final checkout = ref.read(posCheckoutProvider);
    final cartBusy = checkout.lines.isNotEmpty ||
        checkout.returnLines.isNotEmpty ||
        checkout.hasReturnSession;
    if (cartBusy) {
      await showPosInfoDialog(
        context: context,
        title: 'Cart is not empty',
        message:
            'Cannot load hold bill until the cart is empty. Clear or complete the current sale first.',
        icon: Icons.shopping_cart_outlined,
      );
      return;
    }

    setState(() => _busy = true);
    try {
      final held = await ref
          .read(localSaleRepositoryProvider)
          .loadHeldSale(sale.clientUuid);
      if (held == null || held.lines.isEmpty) {
        if (mounted) {
          PosToast.show(
            context,
            'Could not load hold bill',
            type: PosToastType.error,
          );
        }
        return;
      }

      await ref
          .read(localSaleRepositoryProvider)
          .deleteHeldSale(held.clientUuid);

      final session = ref.read(sessionServiceProvider);
      if (held.customerId > 0) {
        await session.setCustomerId(held.customerId);
      }
      if (held.billerId != null && held.billerId! > 0) {
        await session.setBillerId(held.billerId!);
      }

      widget.onBeforeLoad?.call();

      ref.read(posCheckoutProvider.notifier).state = PosCheckoutState(
        lines: held.lines
            .map(
              (l) => CartLine(
                productId: l.productId,
                variantId: l.variantId,
                productBatchId: l.productBatchId,
                batchNo: l.batchNo,
                code: l.code,
                name: l.name,
                qty: l.qty,
                netUnitPrice: l.netUnitPrice,
                discount: l.discount,
                taxRate: l.taxRate,
                taxMethod: l.taxMethod,
                saleUnit: l.saleUnit,
                stockQty: l.stockQty,
              ),
            )
            .toList(),
        customerId: held.customerId,
        billerId: held.billerId,
        warehouseId: held.warehouseId,
        orderTaxRate: held.orderTaxRate,
        orderDiscountValue: held.orderDiscount,
        shippingCost: held.shippingCost,
        couponDiscount: held.couponDiscount,
        saleNote: held.saleNote,
        staffNote: held.staffNote,
        draftClientUuid: held.clientUuid,
        saleDate: DateTime.now(),
      );

      if (!mounted) return;
      Navigator.pop(context);
      final label = formatSaleReferenceDisplay(
        held.referenceNo ?? held.clientUuid,
      );
      PosToast.show(
        context,
        'Hold bill $label loaded to cart',
        type: PosToastType.success,
      );
    } catch (e) {
      if (mounted) {
        PosToast.show(
          context,
          'Failed to load hold bill: $e',
          type: PosToastType.error,
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;

    return PosProfessionalDialogShell(
      title: 'Hold bills',
      subtitle: 'Tap a bill to load it into the cart',
      icon: Icons.drafts_outlined,
      maxWidth: 520,
      maxBodyHeight: 440,
      onClose: _busy ? () {} : () => Navigator.pop(context),
      footer: PosProfessionalDialogFooter(
        primaryLabel: 'Close',
        primaryEnabled: !_busy,
        onPrimary: () => Navigator.pop(context),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _drafts.isEmpty
              ? Center(
                  child: Text(
                    'No hold bills',
                    style: s.bodyMuted,
                  ),
                )
              : ListView.separated(
                  itemCount: _drafts.length,
                  separatorBuilder: (_, __) => Divider(
                    height: 1,
                    color: s.border,
                  ),
                  itemBuilder: (_, i) {
                    final sale = _drafts[i];
                    final refNo = _refLabel(sale);
                    return ListTile(
                      enabled: !_busy,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 4,
                        vertical: 4,
                      ),
                      leading: CircleAvatar(
                        backgroundColor: s.accent.withValues(alpha: 0.12),
                        child: Icon(
                          Icons.drafts_outlined,
                          color: s.accent,
                          size: 20,
                        ),
                      ),
                      title: Text(
                        refNo.isNotEmpty ? refNo : sale.clientUuid,
                        style: s.body.copyWith(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(
                        _timeLabel(sale),
                        style: s.caption,
                      ),
                      trailing: Text(
                        formatPosMoney(sale.grandTotal),
                        style: s.body.copyWith(fontWeight: FontWeight.w700),
                      ),
                      onTap: _busy ? null : () => _loadToCart(sale),
                    );
                  },
                ),
    );
  }
}
