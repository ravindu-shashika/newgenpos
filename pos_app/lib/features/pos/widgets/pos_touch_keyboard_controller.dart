import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum PosTouchInputKind { text, number, amount }

class PosTouchKeyboardSession {
  const PosTouchKeyboardSession({
    required this.controller,
    required this.focusNode,
    required this.kind,
    this.showQuickCash = false,
    this.onChanged,
    this.maxLines = 1,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final PosTouchInputKind kind;
  final bool showQuickCash;
  final VoidCallback? onChanged;
  final int maxLines;
}

class PosTouchKeyboardController extends ChangeNotifier {
  PosTouchKeyboardSession? _session;
  VoidCallback? _focusListener;
  bool _notifyScheduled = false;

  PosTouchKeyboardSession? get session => _session;

  bool get isActive => _session != null;

  /// Always async — Riverpod rejects [notifyListeners] during widget build/update.
  void _safeNotify() {
    if (_notifyScheduled) return;
    _notifyScheduled = true;
    Future<void>.microtask(() {
      _notifyScheduled = false;
      notifyListeners();
    });
  }

  void _clearSession() {
    if (_session == null) return;
    if (_focusListener != null) {
      _session!.focusNode.removeListener(_focusListener!);
    }
    _session = null;
    _focusListener = null;
  }

  void attach(PosTouchKeyboardSession session) {
    if (_session?.focusNode == session.focusNode) return;
    _clearSession();
    _session = session;
    _focusListener = () {
      if (!session.focusNode.hasFocus) {
        Future<void>.microtask(detach);
      }
    };
    session.focusNode.addListener(_focusListener!);
    _safeNotify();
  }

  void detach() {
    if (_session == null) return;
    _clearSession();
    _safeNotify();
  }

  void insertText(String value) {
    final s = _session;
    if (s == null || value.isEmpty) return;
    final c = s.controller;
    final sel = c.selection;
    final start = sel.start >= 0 ? sel.start : c.text.length;
    final end = sel.end >= 0 ? sel.end : c.text.length;
    final next = c.text.replaceRange(start, end, value);
    c.text = next;
    final offset = start + value.length;
    c.selection = TextSelection.collapsed(offset: offset);
    s.onChanged?.call();
    _safeNotify();
  }

  void backspace() {
    final s = _session;
    if (s == null) return;
    final c = s.controller;
    final sel = c.selection;
    if (sel.start != sel.end) {
      final next = c.text.replaceRange(sel.start, sel.end, '');
      c.text = next;
      c.selection = TextSelection.collapsed(offset: sel.start);
      s.onChanged?.call();
      _safeNotify();
      return;
    }
    final index = sel.start;
    if (index <= 0) return;
    final next = c.text.replaceRange(index - 1, index, '');
    c.text = next;
    c.selection = TextSelection.collapsed(offset: index - 1);
    s.onChanged?.call();
    _safeNotify();
  }

  void replaceAll(String value) {
    final s = _session;
    if (s == null) return;
    s.controller.text = value;
    s.controller.selection =
        TextSelection.collapsed(offset: value.length);
    s.onChanged?.call();
    _safeNotify();
  }

  @override
  void dispose() {
    _clearSession();
    super.dispose();
  }
}

/// Detach touch keyboard without triggering Riverpod build-phase errors.
void deferPosTouchKeyboardDetach(WidgetRef ref) {
  Future<void>.microtask(() {
    ref.read(posTouchKeyboardControllerProvider).detach();
  });
}

final posTouchKeyboardControllerProvider =
    ChangeNotifierProvider<PosTouchKeyboardController>((ref) {
  final controller = PosTouchKeyboardController();
  ref.onDispose(controller.dispose);
  return controller;
});
