import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';

/// Preset color swatches for theme customization in Settings.
class PosColorPresetPicker extends StatefulWidget {
  const PosColorPresetPicker({
    super.key,
    required this.label,
    required this.selectedHex,
    required this.onChanged,
    this.allowCustomHex = true,
  });

  final String label;
  final String selectedHex;
  final ValueChanged<String> onChanged;
  final bool allowCustomHex;

  @override
  State<PosColorPresetPicker> createState() => _PosColorPresetPickerState();
}

class _PosColorPresetPickerState extends State<PosColorPresetPicker> {
  late final TextEditingController _hexCtrl;

  @override
  void initState() {
    super.initState();
    _hexCtrl = TextEditingController(text: widget.selectedHex);
  }

  @override
  void didUpdateWidget(covariant PosColorPresetPicker oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedHex != widget.selectedHex &&
        _hexCtrl.text != widget.selectedHex) {
      _hexCtrl.text = widget.selectedHex;
    }
  }

  @override
  void dispose() {
    _hexCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final selected =
        parsePosHexColor(widget.selectedHex, PosColors.primary);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Text(
              widget.label,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: PosColors.textPrimary,
              ),
            ),
            const Spacer(),
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: selected,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: PosColors.border),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: PosThemePresets.swatches.entries.map((entry) {
            final hex = colorToPosHex(entry.value);
            final isSelected =
                widget.selectedHex.toUpperCase() == hex.toUpperCase();
            return _Swatch(
              color: entry.value,
              label: entry.key,
              selected: isSelected,
              onTap: () => widget.onChanged(hex),
            );
          }).toList(),
        ),
        if (widget.allowCustomHex) ...[
          const SizedBox(height: 10),
          TextField(
            controller: _hexCtrl,
            decoration: const InputDecoration(
              labelText: 'Custom hex',
              hintText: '#002C76',
              isDense: true,
            ),
            onSubmitted: (v) {
              final parsed = parsePosHexColor(v, selected);
              widget.onChanged(colorToPosHex(parsed));
            },
          ),
        ],
      ],
    );
  }
}

class _Swatch extends StatelessWidget {
  const _Swatch({
    required this.color,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final Color color;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(4),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(4),
            border: Border.all(
              color: selected ? color : PosColors.border,
              width: selected ? 2 : 1,
            ),
            color: selected ? color.withValues(alpha: 0.08) : Colors.white,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(3),
                  border: Border.all(color: PosColors.border),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: PosColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
