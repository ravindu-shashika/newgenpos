import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import 'pos_touch_keyboard_controller.dart';

class PosTouchTextKeyboard extends StatelessWidget {
  const PosTouchTextKeyboard({
    super.key,
    required this.controller,
    this.maxLines = 1,
  });

  final PosTouchKeyboardController controller;
  final int maxLines;

  static const _rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', '@'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', '.', '-', '_'],
  ];

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return Material(
      elevation: 12,
      color: s.cardBg,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (final row in _rows)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    children: [
                      for (final key in row)
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 3),
                            child: _KeyButton(
                              label: key,
                              onPressed: () => controller.insertText(key),
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
                    child: _KeyButton(
                      label: 'Space',
                      onPressed: () => controller.insertText(' '),
                    ),
                  ),
                  SizedBox(width: 6),
                  _KeyButton(
                    label: '⌫',
                    width: 72,
                    onPressed: controller.backspace,
                  ),
                  SizedBox(width: 6),
                  if (maxLines > 1)
                    _KeyButton(
                      label: 'Enter',
                      width: 72,
                      onPressed: () => controller.insertText('\n'),
                    ),
                  SizedBox(width: 6),
                  _KeyButton(
                    label: 'Done',
                    width: 72,
                    color: context.posBrand.buttonPrimary,
                    foreground: Colors.white,
                    onPressed: controller.detach,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _KeyButton extends StatelessWidget {
  const _KeyButton({
    required this.label,
    required this.onPressed,
    this.width,
    this.color,
    this.foreground,
  });

  final String label;
  final VoidCallback onPressed;
  final double? width;
  final Color? color;
  final Color? foreground;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final isBranded = color != null;
    final bg = color ?? (context.isPosDark ? s.inputFill : Colors.white);
    final fg = foreground ?? s.text;
    final borderColor = isBranded ? Colors.transparent : s.border;

    return SizedBox(
      width: width,
      height: 44,
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: fg,
          padding: EdgeInsets.zero,
          elevation: context.isPosDark ? 0 : 1,
          shadowColor: Colors.black12,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: BorderSide(color: borderColor),
          ),
        ),
        child: label == '⌫'
            ? Icon(Icons.backspace_outlined, size: 20, color: fg)
            : Text(
                label,
                style: TextStyle(
                  fontSize: label.length > 1 ? 13 : 16,
                  fontWeight: FontWeight.w700,
                  color: fg,
                ),
              ),
      ),
    );
  }
}
