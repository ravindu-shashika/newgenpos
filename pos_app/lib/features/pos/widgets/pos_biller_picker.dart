import 'package:flutter/material.dart';

import '../../../core/database/app_database.dart';
import '../../../core/theme/pos_theme.dart';
import 'pos_professional_dialog.dart';
import 'pos_touch_keyboard_host.dart';
import 'pos_touch_text_field.dart';
import 'show_pos_dialog.dart';

Future<int?> showBillerSearchDialog({
  required BuildContext context,
  required List<Biller> billers,
  int? selectedId,
}) {
  return showPosDialog<int>(
    context: context,
    builder: (ctx) => PosTouchKeyboardHost(
      child: _BillerSearchDialog(
        billers: billers,
        selectedId: selectedId,
      ),
    ),
  );
}

class PosBillerPicker extends StatelessWidget {
  const PosBillerPicker({
    super.key,
    required this.billers,
    required this.value,
    required this.onChanged,
    this.compact = false,
  });

  final List<Biller> billers;
  final int? value;
  final ValueChanged<int?> onChanged;
  final bool compact;

  Biller? get _selected {
    for (final b in billers) {
      if (b.id == value) return b;
    }
    return null;
  }

  Future<void> _open(BuildContext context) async {
    final picked = await showBillerSearchDialog(
      context: context,
      billers: billers,
      selectedId: value,
    );
    if (picked != null) onChanged(picked);
  }

  @override
  Widget build(BuildContext context) {
    final selected = _selected;
    if (compact) {
      return PosHeaderSelectChip(
        icon: Icons.badge_outlined,
        label: 'Biller',
        value: selected?.name ?? 'Select',
        onTap: () => _open(context),
      );
    }

    return InkWell(
      onTap: () => _open(context),
      borderRadius: BorderRadius.circular(8),
      child: InputDecorator(
        decoration: const InputDecoration(
          labelText: 'Biller',
          isDense: true,
          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          suffixIcon: Icon(Icons.search, color: PosColors.primary),
          border: OutlineInputBorder(),
        ),
        child: Text(
          selected?.name ?? 'Select biller',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 14,
            color:
                selected == null ? PosColors.textMuted : PosColors.textPrimary,
          ),
        ),
      ),
    );
  }
}

class PosHeaderSelectChip extends StatelessWidget {
  const PosHeaderSelectChip({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final brand = context.posBrand;

    return Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(kPosButtonRadius),
        side: const BorderSide(color: PosColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          child: Row(
            children: [
              Icon(icon, size: 15, color: brand.primary),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.2,
                  color: brand.primary,
                ),
              ),
              Container(
                width: 1,
                height: 14,
                margin: const EdgeInsets.symmetric(horizontal: 8),
                color: PosColors.border,
              ),
              Expanded(
                child: Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: PosColors.textPrimary,
                  ),
                ),
              ),
              const Icon(Icons.expand_more, size: 18, color: PosColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}

class _BillerSearchDialog extends StatefulWidget {
  const _BillerSearchDialog({
    required this.billers,
    this.selectedId,
  });

  final List<Biller> billers;
  final int? selectedId;

  @override
  State<_BillerSearchDialog> createState() => _BillerSearchDialogState();
}

class _BillerSearchDialogState extends State<_BillerSearchDialog> {
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

  List<Biller> get _filtered {
    final q = _searchCtrl.text.trim().toLowerCase();
    if (q.isEmpty) return widget.billers;
    return widget.billers.where((b) {
      final haystack = [b.name, b.companyName ?? ''].join(' ').toLowerCase();
      return haystack.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final results = _filtered;

    return PosProfessionalDialogShell(
      title: 'Select biller',
      subtitle: 'Choose who served this sale',
      icon: Icons.badge_outlined,
      maxWidth: 520,
      maxBodyHeight: 380,
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
            decoration: posProfessionalSearchDecoration('Search biller…'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 14),
          Text(
            '${results.length} biller${results.length == 1 ? '' : 's'} found',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: PosColors.textMuted,
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: results.isEmpty
                ? const PosProfessionalEmptyState(
                    message: 'No billers match your search',
                  )
                : ListView.separated(
                    itemCount: results.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final b = results[i];
                      final selected = b.id == widget.selectedId;
                      return PosProfessionalPickerTile(
                        title: b.name,
                        subtitle: b.companyName?.trim().isNotEmpty == true
                            ? b.companyName!.trim()
                            : null,
                        selected: selected,
                        onTap: () => Navigator.pop(context, b.id),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
