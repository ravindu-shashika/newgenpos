import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/app_database.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/providers/pos_meta_provider.dart';
import '../pos_checkout_state.dart';
import '../pos_entry_mode.dart';
import 'pos_biller_picker.dart';
import 'pos_catalog_entry_bar.dart';
import 'pos_customer_picker.dart';

/// Register header — barcode/search + customer + biller selectors.
class PosRegisterHeaderBar extends ConsumerWidget {
  const PosRegisterHeaderBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(posCatalogEntryModeProvider);
    final checkout = ref.watch(posCheckoutProvider);
    final metaAsync = ref.watch(posLocalMetaProvider);

    return metaAsync.when(
      data: (meta) => _RegisterHeaderRow(
        mode: mode,
        checkout: checkout,
        customers: meta.customers,
        billers: meta.billers,
        onModeChanged: (m) =>
            ref.read(posCatalogEntryModeProvider.notifier).state = m,
        onCustomerChanged: (id) => _setCustomer(ref, checkout, id),
        onBillerChanged: (id) => _setBiller(ref, checkout, id),
      ),
      loading: () => _RegisterHeaderRow(
        mode: mode,
        checkout: checkout,
        customers: const [],
        billers: const [],
        onModeChanged: (m) =>
            ref.read(posCatalogEntryModeProvider.notifier).state = m,
        onCustomerChanged: (id) => _setCustomer(ref, checkout, id),
        onBillerChanged: (id) => _setBiller(ref, checkout, id),
      ),
      error: (_, __) => _RegisterHeaderRow(
        mode: mode,
        checkout: checkout,
        customers: const [],
        billers: const [],
        onModeChanged: (m) =>
            ref.read(posCatalogEntryModeProvider.notifier).state = m,
        onCustomerChanged: (id) => _setCustomer(ref, checkout, id),
        onBillerChanged: (id) => _setBiller(ref, checkout, id),
      ),
    );
  }

  void _setCustomer(WidgetRef ref, PosCheckoutState checkout, int? id) {
    if (id == null) return;
    ref.read(posCheckoutProvider.notifier).state =
        checkout.copyWith(customerId: id);
    ref.read(sessionServiceProvider).setCustomerId(id);
  }

  void _setBiller(WidgetRef ref, PosCheckoutState checkout, int? id) {
    if (id == null) return;
    ref.read(posCheckoutProvider.notifier).state =
        checkout.copyWith(billerId: id);
    ref.read(sessionServiceProvider).setBillerId(id);
  }
}

class _RegisterHeaderRow extends StatelessWidget {
  const _RegisterHeaderRow({
    required this.mode,
    required this.checkout,
    required this.customers,
    required this.billers,
    required this.onModeChanged,
    required this.onCustomerChanged,
    required this.onBillerChanged,
  });

  final PosCatalogEntryMode mode;
  final PosCheckoutState checkout;
  final List<Customer> customers;
  final List<Biller> billers;
  final ValueChanged<PosCatalogEntryMode> onModeChanged;
  final ValueChanged<int?> onCustomerChanged;
  final ValueChanged<int?> onBillerChanged;

  String _customerLabel() {
    for (final c in customers) {
      if (c.id == checkout.customerId) return c.name;
    }
    return 'Select';
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Flexible(
          flex: 3,
          child: PosCatalogModeSwitch(
            mode: mode,
            compact: true,
            onModeChanged: onModeChanged,
          ),
        ),
        const SizedBox(width: 8),
        Flexible(
          flex: 3,
          child: PosHeaderSelectChip(
            icon: Icons.person_outline,
            label: 'Customer',
            value: _customerLabel(),
            onTap: customers.isEmpty
                ? () {}
                : () async {
                    final picked = await showCustomerSearchDialog(
                      context: context,
                      customers: customers,
                      selectedId: checkout.customerId,
                    );
                    if (picked != null) onCustomerChanged(picked);
                  },
          ),
        ),
        const SizedBox(width: 8),
        Flexible(
          flex: 3,
          child: PosBillerPicker(
            compact: true,
            billers: billers,
            value: checkout.billerId,
            onChanged: onBillerChanged,
          ),
        ),
      ],
    );
  }
}
