import 'package:flutter/material.dart';

import '../../../core/database/app_database.dart';
import '../../../core/theme/pos_theme.dart';
import 'pos_professional_dialog.dart';
import 'pos_touch_keyboard_host.dart';
import 'pos_touch_text_field.dart';
import 'show_pos_dialog.dart';

Future<int?> showCustomerSearchDialog({
  required BuildContext context,
  required List<Customer> customers,
  int? selectedId,
}) {
  return showPosDialog<int>(
    context: context,
    builder: (ctx) => PosTouchKeyboardHost(
      expand: false,
      child: _CustomerSearchDialog(
        customers: customers,
        selectedId: selectedId,
      ),
    ),
  );
}

class PosCustomerPicker extends StatelessWidget {
  const PosCustomerPicker({
    super.key,
    required this.customers,
    required this.value,
    required this.onChanged,
    this.focusNode,
    this.decoration,
  });

  final List<Customer> customers;
  final int? value;
  final ValueChanged<int?> onChanged;
  final FocusNode? focusNode;
  final InputDecoration? decoration;

  Customer? get _selected {
    for (final c in customers) {
      if (c.id == value) return c;
    }
    return null;
  }

  Future<void> _open(BuildContext context) async {
    final picked = await showCustomerSearchDialog(
      context: context,
      customers: customers,
      selectedId: value,
    );
    if (picked != null) onChanged(picked);
  }

  @override
  Widget build(BuildContext context) {
    final selected = _selected;
    final baseDecoration = decoration ??
        InputDecoration(
          labelText: 'Customer',
          isDense: true,
          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        );

    return Focus(
      focusNode: focusNode,
      onFocusChange: (hasFocus) {
        if (hasFocus) {
          focusNode?.unfocus();
          _open(context);
        }
      },
      child: InkWell(
        onTap: () => _open(context),
        borderRadius: BorderRadius.circular(10),
        child: InputDecorator(
          decoration: baseDecoration.copyWith(
            suffixIcon: Icon(Icons.search, color: context.posBrand.primary),
          ),
          child: Text(
            selected?.name ?? 'Select customer',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 14,
              color: selected == null
                  ? Theme.of(context).colorScheme.onSurfaceVariant
                  : Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ),
      ),
    );
  }
}

class _CustomerSearchDialog extends StatefulWidget {
  const _CustomerSearchDialog({
    required this.customers,
    this.selectedId,
  });

  final List<Customer> customers;
  final int? selectedId;

  @override
  State<_CustomerSearchDialog> createState() => _CustomerSearchDialogState();
}

class _CustomerSearchDialogState extends State<_CustomerSearchDialog> {
  final _searchCtrl = TextEditingController();
  final _searchFocus = FocusNode();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _searchFocus.requestFocus();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  List<Customer> get _filtered {
    final q = _searchCtrl.text.trim().toLowerCase();
    if (q.isEmpty) return widget.customers;
    return widget.customers.where((c) {
      final haystack = [
        c.name,
        c.phoneNumber ?? '',
        c.email ?? '',
        c.city ?? '',
      ].join(' ').toLowerCase();
      return haystack.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final results = _filtered;

    return PosProfessionalDialogShell(
      title: 'Select customer',
      subtitle: 'Search by name, phone, or email',
      icon: Icons.person_search_outlined,
      maxWidth: 540,
      maxBodyHeight: 400,
      footer: PosProfessionalDialogFooter(
        secondaryLabel: 'Cancel',
        onSecondary: () => Navigator.pop(context),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          PosTouchTextField(
            controller: _searchCtrl,
            focusNode: _searchFocus,
            decoration: posProfessionalSearchDecoration(
              context,
              'Search by name, phone, email…',
            ),
            onChanged: (_) => setState(() {}),
          ),
          SizedBox(height: 14),
          Text(
            '${results.length} customer${results.length == 1 ? '' : 's'} found',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          SizedBox(height: 10),
          Expanded(
            child: results.isEmpty
                ? const PosProfessionalEmptyState(
                    message: 'No customers match your search',
                  )
                : ListView.separated(
                    itemCount: results.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final c = results[i];
                      final selected = c.id == widget.selectedId;
                      final subtitle = [
                        if (c.phoneNumber != null &&
                            c.phoneNumber!.trim().isNotEmpty)
                          c.phoneNumber!,
                        if (c.email != null && c.email!.trim().isNotEmpty)
                          c.email!,
                      ].join(' · ');

                      return PosProfessionalPickerTile(
                        title: c.name,
                        subtitle: subtitle.isEmpty ? null : subtitle,
                        selected: selected,
                        onTap: () => Navigator.pop(context, c.id),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
