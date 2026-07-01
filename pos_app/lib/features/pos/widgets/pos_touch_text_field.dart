import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/pos_ui_settings_provider.dart';
import 'pos_touch_keyboard_controller.dart';

/// Text/number field that uses the on-screen keyboard when enabled in settings.
class PosTouchTextField extends ConsumerStatefulWidget {
  const PosTouchTextField({
    super.key,
    required this.controller,
    this.focusNode,
    this.kind = PosTouchInputKind.text,
    this.showQuickCash = false,
    this.decoration,
    this.style,
    this.textAlign = TextAlign.start,
    this.maxLines = 1,
    this.minLines,
    this.autofocus = false,
    this.onChanged,
    this.onSubmitted,
    this.onTap,
    this.textCapitalization = TextCapitalization.none,
    this.readOnlyWhenKeyboardOff = false,
    this.suppressNativeKeyboard = false,
  });

  final TextEditingController controller;
  final FocusNode? focusNode;
  final PosTouchInputKind kind;
  final bool showQuickCash;
  final InputDecoration? decoration;
  final TextStyle? style;
  final TextAlign textAlign;
  final int maxLines;
  final int? minLines;
  final bool autofocus;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final VoidCallback? onTap;
  final TextCapitalization textCapitalization;
  final bool readOnlyWhenKeyboardOff;

  /// Scanner / HID input only — hides OS and touch keyboards.
  final bool suppressNativeKeyboard;

  @override
  ConsumerState<PosTouchTextField> createState() => _PosTouchTextFieldState();
}

class _PosTouchTextFieldState extends ConsumerState<PosTouchTextField> {
  late final FocusNode _focusNode;
  bool _ownsFocusNode = false;

  @override
  void initState() {
    super.initState();
    if (widget.focusNode != null) {
      _focusNode = widget.focusNode!;
    } else {
      _focusNode = FocusNode();
      _ownsFocusNode = true;
    }
    _focusNode.addListener(_onFocusChange);
    _syncScannerKeyHandler();
    if (widget.autofocus) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _focusNode.requestFocus();
      });
    }
  }

  @override
  void didUpdateWidget(covariant PosTouchTextField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.focusNode != widget.focusNode) {
      oldWidget.focusNode?.removeListener(_onFocusChange);
      oldWidget.focusNode?.onKeyEvent = null;
      if (_ownsFocusNode) {
        _focusNode.dispose();
      }
      _ownsFocusNode = widget.focusNode == null;
      if (widget.focusNode != null) {
        _focusNode = widget.focusNode!;
      } else {
        _focusNode = FocusNode();
      }
      _focusNode.addListener(_onFocusChange);
      _syncScannerKeyHandler();
    }
    if (oldWidget.suppressNativeKeyboard != widget.suppressNativeKeyboard) {
      _syncScannerKeyHandler();
      if (widget.suppressNativeKeyboard) {
        _hideNativeKeyboard();
        deferPosTouchKeyboardDetach(ref);
      } else if (_focusNode.hasFocus) {
        _activateInputKeyboard();
      }
    }
  }

  @override
  void dispose() {
    _focusNode.onKeyEvent = null;
    _focusNode.removeListener(_onFocusChange);
    if (_ownsFocusNode) _focusNode.dispose();
    super.dispose();
  }

  void _hideNativeKeyboard() {
    SystemChannels.textInput.invokeMethod('TextInput.hide');
  }

  void _syncScannerKeyHandler() {
    if (!widget.suppressNativeKeyboard) {
      _focusNode.onKeyEvent = null;
      return;
    }
    _focusNode.onKeyEvent = _handleScannerKey;
  }

  KeyEventResult _handleScannerKey(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent) return KeyEventResult.ignored;

    final key = event.logicalKey;
    if (key == LogicalKeyboardKey.enter || key == LogicalKeyboardKey.numpadEnter) {
      widget.onSubmitted?.call(widget.controller.text);
      return KeyEventResult.handled;
    }

    if (key == LogicalKeyboardKey.backspace) {
      final text = widget.controller.text;
      if (text.isNotEmpty) {
        widget.controller.text = text.substring(0, text.length - 1);
        widget.controller.selection = TextSelection.collapsed(
          offset: widget.controller.text.length,
        );
        widget.onChanged?.call(widget.controller.text);
      }
      return KeyEventResult.handled;
    }

    final char = event.character;
    if (char != null &&
        char.isNotEmpty &&
        !HardwareKeyboard.instance.isControlPressed &&
        !HardwareKeyboard.instance.isAltPressed) {
      widget.controller.text += char;
      widget.controller.selection = TextSelection.collapsed(
        offset: widget.controller.text.length,
      );
      widget.onChanged?.call(widget.controller.text);
      return KeyEventResult.handled;
    }

    return KeyEventResult.ignored;
  }

  void _onFocusChange() {
    if (!_focusNode.hasFocus) return;
    _activateInputKeyboard();
  }

  void _activateInputKeyboard() {
    Future<void>.microtask(() {
      if (!mounted || !_focusNode.hasFocus) return;
      if (widget.suppressNativeKeyboard) {
        _hideNativeKeyboard();
        deferPosTouchKeyboardDetach(ref);
        Future<void>.microtask(() {
          if (mounted && _focusNode.hasFocus) _hideNativeKeyboard();
        });
        return;
      }
      final enabled = ref.read(posUiSettingsProvider).enableKeyboard;
      if (enabled) {
        ref.read(posTouchKeyboardControllerProvider).attach(
              PosTouchKeyboardSession(
                controller: widget.controller,
                focusNode: _focusNode,
                kind: widget.kind,
                showQuickCash: widget.showQuickCash,
                onChanged: () => widget.onChanged?.call(widget.controller.text),
                maxLines: widget.maxLines,
              ),
            );
        return;
      }
      // Native OS keyboard — ensure TextInput is connected after barcode mode.
      _focusNode.requestFocus();
    });
  }

  @override
  Widget build(BuildContext context) {
    final touchKeyboard =
        ref.watch(posUiSettingsProvider).enableKeyboard &&
            !widget.suppressNativeKeyboard;
    final scannerOnly = widget.suppressNativeKeyboard;

    return TextField(
      controller: widget.controller,
      focusNode: _focusNode,
      readOnly: touchKeyboard || widget.readOnlyWhenKeyboardOff || scannerOnly,
      showCursor: true,
      autofocus: widget.autofocus,
      maxLines: widget.maxLines,
      minLines: widget.minLines,
      style: widget.style,
      textAlign: widget.textAlign,
      textCapitalization: widget.textCapitalization,
      keyboardType: touchKeyboard || scannerOnly
          ? TextInputType.none
          : _nativeKeyboardType(),
      enableInteractiveSelection: !scannerOnly,
      decoration: widget.decoration,
      onChanged: widget.onChanged,
      onSubmitted: widget.onSubmitted,
      onTap: () {
        if (scannerOnly) {
          _hideNativeKeyboard();
        } else {
          _activateInputKeyboard();
        }
        widget.onTap?.call();
        if (touchKeyboard) _focusNode.requestFocus();
      },
    );
  }

  TextInputType _nativeKeyboardType() {
    switch (widget.kind) {
      case PosTouchInputKind.number:
      case PosTouchInputKind.amount:
        return const TextInputType.numberWithOptions(decimal: true);
      case PosTouchInputKind.text:
        return TextInputType.text;
    }
  }
}
