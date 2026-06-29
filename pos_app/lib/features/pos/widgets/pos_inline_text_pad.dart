import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';

/// Large inline alphanumeric pad for coupon codes and text entry.
class PosInlineTextPad extends StatelessWidget {
  const PosInlineTextPad({
    super.key,
    required this.controller,
    this.onChanged,
    this.fillHeight = true,
    this.largeTouch = true,
  });

  final TextEditingController controller;
  final VoidCallback? onChanged;
  final bool fillHeight;
  final bool largeTouch;

  static const _rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  void _insert(String value) {
    final text = controller.text;
    final sel = controller.selection;
    final start = sel.start >= 0 ? sel.start : text.length;
    final end = sel.end >= 0 ? sel.end : text.length;
    final next = text.replaceRange(start, end, value);
    controller.text = next;
    final offset = start + value.length;
    controller.selection = TextSelection.collapsed(offset: offset);
    onChanged?.call();
  }

  void _backspace() {
    final text = controller.text;
    final sel = controller.selection;
    if (!sel.isCollapsed) {
      final next = text.replaceRange(sel.start, sel.end, '');
      controller.text = next;
      controller.selection = TextSelection.collapsed(offset: sel.start);
      onChanged?.call();
      return;
    }
    if (sel.start <= 0) return;
    final next = text.replaceRange(sel.start - 1, sel.start, '');
    controller.text = next;
    controller.selection = TextSelection.collapsed(offset: sel.start - 1);
    onChanged?.call();
  }

  void _clear() {
    controller.clear();
    onChanged?.call();
  }

  @override
  Widget build(BuildContext context) {
    final keyHeight = largeTouch ? 52.0 : 44.0;
    final keyFont = largeTouch ? 20.0 : 16.0;

    Widget buildRows() {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final row in _rows)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  for (final key in row)
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: _PadKey(
                          label: key,
                          height: keyHeight,
                          fontSize: keyFont,
                          onPressed: () => _insert(key),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: _PadKey(
                  label: 'Space',
                  height: keyHeight,
                  fontSize: largeTouch ? 15 : 13,
                  onPressed: () => _insert(' '),
                ),
              ),
              const SizedBox(width: 8),
              _PadKey(
                label: '-',
                height: keyHeight,
                width: largeTouch ? 64 : 56,
                fontSize: keyFont,
                onPressed: () => _insert('-'),
              ),
              const SizedBox(width: 8),
              _PadKey(
                label: '_',
                height: keyHeight,
                width: largeTouch ? 64 : 56,
                fontSize: keyFont,
                onPressed: () => _insert('_'),
              ),
              const SizedBox(width: 8),
              _PadKey(
                label: '⌫',
                height: keyHeight,
                width: largeTouch ? 72 : 64,
                fontSize: keyFont,
                onPressed: _backspace,
              ),
              const SizedBox(width: 8),
              _PadKey(
                label: 'Clear',
                height: keyHeight,
                width: largeTouch ? 80 : 72,
                fontSize: largeTouch ? 14 : 13,
                color: PosColors.red.withValues(alpha: 0.12),
                foreground: PosColors.red,
                onPressed: _clear,
              ),
            ],
          ),
        ],
      );
    }

    if (fillHeight) {
      return LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: Align(
                alignment: Alignment.center,
                child: buildRows(),
              ),
            ),
          );
        },
      );
    }

    return buildRows();
  }
}

class PosCouponQuickBar extends StatelessWidget {
  const PosCouponQuickBar({
    super.key,
    required this.codes,
    required this.onSelect,
    this.largeTouch = true,
    this.columns = 2,
  });

  final List<String> codes;
  final ValueChanged<String> onSelect;
  final bool largeTouch;
  final int columns;

  @override
  Widget build(BuildContext context) {
    if (codes.isEmpty) return const SizedBox.shrink();

    final cols = columns.clamp(1, 3);
    final rows = (codes.length / cols).ceil();
    const gap = 8.0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final rowHeight =
            (constraints.maxHeight - gap * (rows - 1)) / rows;
        return Column(
          children: [
            for (var r = 0; r < rows; r++) ...[
              if (r > 0) const SizedBox(height: gap),
              SizedBox(
                height: rowHeight.clamp(40, double.infinity),
                child: Row(
                  children: [
                    for (var c = 0; c < cols; c++) ...[
                      if (c > 0) const SizedBox(width: gap),
                      Expanded(
                        child: _codeAt(r * cols + c),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ],
        );
      },
    );
  }

  Widget _codeAt(int index) {
    if (index >= codes.length) return const SizedBox.shrink();
    final code = codes[index];
    return Material(
      color: PosColors.primary.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: () => onSelect(code),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          alignment: Alignment.center,
          padding: EdgeInsets.symmetric(
            horizontal: largeTouch ? 12 : 8,
            vertical: largeTouch ? 10 : 8,
          ),
          child: Text(
            code,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: largeTouch ? 15 : 13,
              fontWeight: FontWeight.w700,
              color: PosColors.primary,
            ),
          ),
        ),
      ),
    );
  }
}

class _PadKey extends StatelessWidget {
  const _PadKey({
    required this.label,
    required this.onPressed,
    required this.height,
    this.width,
    this.fontSize = 16,
    this.color,
    this.foreground,
  });

  final String label;
  final VoidCallback onPressed;
  final double height;
  final double? width;
  final double fontSize;
  final Color? color;
  final Color? foreground;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
      child: Material(
        color: color ?? Colors.white,
        elevation: 1,
        shadowColor: Colors.black12,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            alignment: Alignment.center,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: color == null ? PosColors.border : Colors.transparent,
              ),
            ),
            child: Text(
              label,
              style: TextStyle(
                fontSize: fontSize,
                fontWeight: FontWeight.w700,
                color: foreground ?? PosColors.textPrimary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
