import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import 'pos_touch_keyboard_controller.dart';

/// On-screen QWERTY keyboard with Shift / Caps for capital letters.
class PosTouchTextKeyboard extends StatefulWidget {
  const PosTouchTextKeyboard({
    super.key,
    required this.controller,
    this.maxLines = 1,
  });

  final PosTouchKeyboardController controller;
  final int maxLines;

  @override
  State<PosTouchTextKeyboard> createState() => _PosTouchTextKeyboardState();
}

class _PosTouchTextKeyboardState extends State<PosTouchTextKeyboard> {
  /// 0 = off, 1 = shift (next letter only), 2 = caps lock (sticky).
  int _shiftMode = 0;

  static const _digitRow = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  static const _letterRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', '@'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', '.', '-', '_'],
  ];

  bool get _upper => _shiftMode > 0;

  void _toggleShift() {
    setState(() {
      // Off → Shift (one letter) → Caps lock → Off
      _shiftMode = (_shiftMode + 1) % 3;
    });
  }

  void _insertKey(String key) {
    final isLetter = key.length == 1 &&
        key.toLowerCase() != key.toUpperCase() &&
        key.toLowerCase().codeUnitAt(0) >= 97 &&
        key.toLowerCase().codeUnitAt(0) <= 122;

    final text = isLetter && _upper ? key.toUpperCase() : key;
    widget.controller.insertText(text);

    // One-shot shift: return to lowercase after a letter.
    if (isLetter && _shiftMode == 1) {
      setState(() => _shiftMode = 0);
    }
  }

  String _displayLabel(String key) {
    final isLetter = key.length == 1 &&
        key.toLowerCase() != key.toUpperCase() &&
        key.toLowerCase().codeUnitAt(0) >= 97 &&
        key.toLowerCase().codeUnitAt(0) <= 122;
    if (isLetter && _upper) return key.toUpperCase();
    return key;
  }

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    final brand = context.posBrand;
    final shiftActive = _shiftMode > 0;
    final capsLock = _shiftMode == 2;

    return Focus(
      skipTraversal: true,
      canRequestFocus: false,
      descendantsAreFocusable: false,
      child: Material(
        elevation: 12,
        color: s.cardBg,
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildRow(
                  _digitRow.map(_displayLabel).toList(),
                  onKey: _insertKey,
                ),
                for (final row in _letterRows)
                  _buildRow(
                    row.map(_displayLabel).toList(),
                    onKey: (label) {
                      // Map displayed label back to base key for insert logic.
                      final base = label.toLowerCase();
                      _insertKey(base == '@' ||
                              base == '.' ||
                              base == '-' ||
                              base == '_'
                          ? label
                          : base);
                    },
                  ),
                Row(
                  children: [
                    _KeyButton(
                      label: capsLock ? 'CAPS' : '⇧',
                      width: 72,
                      color: shiftActive ? brand.buttonPrimary : null,
                      foreground: shiftActive ? Colors.white : null,
                      onPressed: _toggleShift,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      flex: 2,
                      child: _KeyButton(
                        label: 'Space',
                        onPressed: () => widget.controller.insertText(' '),
                      ),
                    ),
                    const SizedBox(width: 6),
                    _KeyButton(
                      label: '⌫',
                      width: 64,
                      onPressed: widget.controller.backspace,
                    ),
                    if (widget.maxLines > 1) ...[
                      const SizedBox(width: 6),
                      _KeyButton(
                        label: 'Enter',
                        width: 64,
                        onPressed: () => widget.controller.insertText('\n'),
                      ),
                    ],
                    const SizedBox(width: 6),
                    _KeyButton(
                      label: 'Done',
                      width: 72,
                      color: brand.buttonPrimary,
                      foreground: Colors.white,
                      onPressed: widget.controller.detach,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRow(
    List<String> keys, {
    required void Function(String key) onKey,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          for (final key in keys)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 3),
                child: _KeyButton(
                  label: key,
                  onPressed: () => onKey(key),
                ),
              ),
            ),
        ],
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
                  fontSize: label.length > 1 ? 12 : 16,
                  fontWeight: FontWeight.w700,
                  color: fg,
                ),
              ),
      ),
    );
  }
}
