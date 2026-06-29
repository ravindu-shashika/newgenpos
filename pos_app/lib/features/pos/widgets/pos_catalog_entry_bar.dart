import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import '../models/scanned_product.dart';
import '../pos_currency.dart';
import '../pos_entry_mode.dart';
import 'pos_touch_text_field.dart';

/// Barcode scan vs product search — segmented control + input field.
class PosCatalogEntryBar extends StatelessWidget {
  const PosCatalogEntryBar({
    super.key,
    required this.mode,
    required this.controller,
    required this.focusNode,
    required this.searchResults,
    required this.showResults,
    required this.onModeChanged,
    required this.onChanged,
    required this.onSubmitted,
    required this.onPickResult,
    this.showModeSwitch = true,
  });

  final PosCatalogEntryMode mode;
  final TextEditingController controller;
  final FocusNode focusNode;
  final List<ScannedProduct> searchResults;
  final bool showResults;
  final ValueChanged<PosCatalogEntryMode> onModeChanged;
  final ValueChanged<String> onChanged;
  final ValueChanged<String> onSubmitted;
  final ValueChanged<ScannedProduct> onPickResult;
  final bool showModeSwitch;

  @override
  Widget build(BuildContext context) {
    final isBarcode = mode == PosCatalogEntryMode.barcode;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (showModeSwitch) ...[
          PosCatalogModeSwitch(mode: mode, onModeChanged: onModeChanged),
          const SizedBox(height: 10),
        ],
        Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              decoration: BoxDecoration(
                color: PosColors.searchFill,
                borderRadius: BorderRadius.zero,
                border: Border.all(
                  color: isBarcode
                      ? PosColors.primary.withValues(alpha: 0.35)
                      : PosColors.searchBorder,
                  width: isBarcode ? 1.5 : 1,
                ),
              ),
              child: PosTouchTextField(
                controller: controller,
                focusNode: focusNode,
                autofocus: isBarcode,
                suppressNativeKeyboard: isBarcode,
                decoration: InputDecoration(
                  hintText: isBarcode
                      ? 'Scan barcode…'
                      : 'Search name or code…',
                  prefixIcon: Icon(
                    isBarcode ? Icons.qr_code_scanner : Icons.search,
                    color: isBarcode ? PosColors.primary : PosColors.textMuted,
                  ),
                  suffixIcon: isBarcode
                      ? Padding(
                          padding: const EdgeInsets.only(right: 12),
                          child: Icon(
                            Icons.sensors,
                            size: 18,
                            color: PosColors.primary.withValues(alpha: 0.7),
                          ),
                        )
                      : null,
                  suffixIconConstraints: isBarcode
                      ? const BoxConstraints(minWidth: 32, minHeight: 32)
                      : null,
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onChanged: onChanged,
                onSubmitted: onSubmitted,
              ),
            ),
            if (!isBarcode && showResults && searchResults.isNotEmpty)
              Positioned(
                left: 0,
                right: 0,
                top: 52,
                child: Material(
                  elevation: 8,
                  borderRadius: BorderRadius.circular(10),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 260),
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: searchResults.length,
                      itemBuilder: (_, i) {
                        final p = searchResults[i];
                        return ListTile(
                          dense: true,
                          title: Text(
                            p.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          subtitle: Text(
                            '${p.code} · ${formatPosMoney(p.price)} · '
                            'Qty ${p.warehouseQty.toStringAsFixed(0)}',
                          ),
                          onTap: () => onPickResult(p),
                        );
                      },
                    ),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class PosCatalogModeSwitch extends StatelessWidget {
  const PosCatalogModeSwitch({
    super.key,
    required this.mode,
    required this.onModeChanged,
    this.compact = false,
  });

  final PosCatalogEntryMode mode;
  final ValueChanged<PosCatalogEntryMode> onModeChanged;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final chipHeight = compact ? 32.0 : 38.0;
    final fontSize = compact ? 12.0 : 13.0;
    final iconSize = compact ? 14.0 : 16.0;
    const radius = BorderRadius.all(Radius.circular(kPosButtonRadius));

    return Container(
      height: chipHeight,
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: radius,
        border: Border.all(color: PosColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: _ModeChip(
              label: 'Barcode',
              icon: Icons.qr_code_scanner,
              selected: mode == PosCatalogEntryMode.barcode,
              height: chipHeight - 4,
              fontSize: fontSize,
              iconSize: iconSize,
              onTap: () => onModeChanged(PosCatalogEntryMode.barcode),
            ),
          ),
          Expanded(
            child: _ModeChip(
              label: 'Search',
              icon: Icons.search,
              selected: mode == PosCatalogEntryMode.search,
              height: chipHeight - 4,
              fontSize: fontSize,
              iconSize: iconSize,
              onTap: () => onModeChanged(PosCatalogEntryMode.search),
            ),
          ),
        ],
      ),
    );
  }
}

class _ModeChip extends StatelessWidget {
  const _ModeChip({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
    this.height = 38,
    this.fontSize = 13,
    this.iconSize = 16,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;
  final double height;
  final double fontSize;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    final brand = context.posBrand;
    const radius = BorderRadius.all(Radius.circular(kPosButtonRadius - 1));

    return Material(
      color: selected ? brand.primaryLight.withValues(alpha: 0.55) : Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: radius,
        side: BorderSide(
          color: selected ? brand.primary.withValues(alpha: 0.35) : Colors.transparent,
          width: 1,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: radius,
        child: SizedBox(
          height: height,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: iconSize,
                color: selected ? brand.primary : PosColors.textMuted,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: fontSize,
                  fontWeight: FontWeight.w600,
                  color: selected ? brand.primary : PosColors.textMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
