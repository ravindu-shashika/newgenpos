import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/pos_theme.dart';
import '../../../core/providers/pos_ui_settings_provider.dart';
import 'pos_amount_numpad.dart';
import 'pos_touch_keyboard_controller.dart';
import 'pos_touch_text_keyboard.dart';

/// Compact numpad strip embedded inside a dialog body (not a fullscreen overlay).
class PosInlineTouchKeyboard extends ConsumerStatefulWidget {
  const PosInlineTouchKeyboard({super.key, required this.session});

  final PosTouchKeyboardSession session;

  @override
  ConsumerState<PosInlineTouchKeyboard> createState() =>
      _PosInlineTouchKeyboardState();
}

class _PosInlineTouchKeyboardState extends ConsumerState<PosInlineTouchKeyboard> {
  bool _quickCashInitial = true;

  @override
  void didUpdateWidget(covariant PosInlineTouchKeyboard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.session.focusNode != widget.session.focusNode) {
      _quickCashInitial = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    final kb = ref.watch(posTouchKeyboardControllerProvider);
    final session = widget.session;
    final divider = Theme.of(context).dividerColor;

    return Material(
      color: context.posStyles.cardBg,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Divider(height: 1, color: divider),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 6, 12, 6),
            child: session.kind == PosTouchInputKind.text
                ? PosTouchTextKeyboard(
                    controller: kb,
                    maxLines: session.maxLines,
                  )
                : _CompactNumericPanel(
                    controller: session.controller,
                    showQuickCash: session.kind == PosTouchInputKind.amount &&
                        session.showQuickCash,
                    quickCashInitial: _quickCashInitial,
                    onChanged: session.onChanged,
                    onQuickCashUsed: () {
                      if (_quickCashInitial) {
                        setState(() => _quickCashInitial = false);
                      }
                    },
                    onDone: kb.detach,
                  ),
          ),
        ],
      ),
    );
  }
}

/// Wrap screens/dialogs so the touch keyboard can appear above content.
class PosTouchKeyboardHost extends ConsumerWidget {
  const PosTouchKeyboardHost({
    super.key,
    required this.child,
    this.expand = true,
  });

  final Widget child;

  /// Full-screen POS register uses [StackFit.expand]. Dialogs should pass `false`.
  final bool expand;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(posUiSettingsProvider, (prev, next) {
      if (prev?.enableKeyboard == true && !next.enableKeyboard) {
        deferPosTouchKeyboardDetach(ref);
      }
    });

    final enabled = ref.watch(posUiSettingsProvider).enableKeyboard;
    final session = ref.watch(posTouchKeyboardControllerProvider).session;
    final route = ModalRoute.of(context);
    // Full-screen host: only when this route is on top (not behind a modal).
    final showOverlay = enabled &&
        session != null &&
        (!expand || (route?.isCurrent ?? true));

    return Stack(
      fit: expand ? StackFit.expand : StackFit.loose,
      clipBehavior: Clip.none,
      children: [
        child,
        if (showOverlay)
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _PosTouchKeyboardPanel(session: session, compact: !expand),
          ),
      ],
    );
  }
}

class _PosTouchKeyboardPanel extends ConsumerStatefulWidget {
  const _PosTouchKeyboardPanel({
    required this.session,
    this.compact = false,
  });

  final PosTouchKeyboardSession session;
  final bool compact;

  @override
  ConsumerState<_PosTouchKeyboardPanel> createState() =>
      _PosTouchKeyboardPanelState();
}

class _PosTouchKeyboardPanelState
    extends ConsumerState<_PosTouchKeyboardPanel> {
  bool _quickCashInitial = true;

  @override
  void didUpdateWidget(covariant _PosTouchKeyboardPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.session.focusNode != widget.session.focusNode) {
      _quickCashInitial = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    final kb = ref.watch(posTouchKeyboardControllerProvider);
    final session = widget.session;

    return Material(
      elevation: widget.compact ? 8 : 16,
      child: session.kind == PosTouchInputKind.text
          ? PosTouchTextKeyboard(
              controller: kb,
              maxLines: session.maxLines,
            )
          : widget.compact
              ? _CompactNumericPanel(
                  controller: session.controller,
                  showQuickCash: session.kind == PosTouchInputKind.amount &&
                      session.showQuickCash,
                  quickCashInitial: _quickCashInitial,
                  onChanged: session.onChanged,
                  onQuickCashUsed: () {
                    if (_quickCashInitial) {
                      setState(() => _quickCashInitial = false);
                    }
                  },
                  onDone: kb.detach,
                )
              : _NumericKeyboardPanel(
                  controller: session.controller,
                  showQuickCash: session.kind == PosTouchInputKind.amount &&
                      session.showQuickCash,
                  quickCashInitial: _quickCashInitial,
                  onChanged: session.onChanged,
                  onQuickCashUsed: () {
                    if (_quickCashInitial) {
                      setState(() => _quickCashInitial = false);
                    }
                  },
                  onDone: kb.detach,
                ),
    );
  }
}

/// Dialog-sized numpad — fixed height, no quick-cash row.
class _CompactNumericPanel extends StatelessWidget {
  const _CompactNumericPanel({
    required this.controller,
    required this.showQuickCash,
    required this.quickCashInitial,
    required this.onChanged,
    required this.onQuickCashUsed,
    required this.onDone,
  });

  final TextEditingController controller;
  final bool showQuickCash;
  final bool quickCashInitial;
  final VoidCallback? onChanged;
  final VoidCallback onQuickCashUsed;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 124,
          child: PosAmountNumpad(
            controller: controller,
            onChanged: onChanged,
            showQuickCash: false,
            quickCashInitial: quickCashInitial,
            onQuickCashUsed: onQuickCashUsed,
            fillHeight: true,
            compact: true,
          ),
        ),
        const SizedBox(height: 4),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: onDone,
            style: TextButton.styleFrom(
              foregroundColor: context.posBrand.buttonPrimary,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text('Done'),
          ),
        ),
      ],
    );
  }
}

class _NumericKeyboardPanel extends StatelessWidget {
  const _NumericKeyboardPanel({
    required this.controller,
    required this.showQuickCash,
    required this.quickCashInitial,
    required this.onChanged,
    required this.onQuickCashUsed,
    required this.onDone,
  });

  final TextEditingController controller;
  final bool showQuickCash;
  final bool quickCashInitial;
  final VoidCallback? onChanged;
  final VoidCallback onQuickCashUsed;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    final s = context.posStyles;
    return SafeArea(
      top: false,
      child: Container(
        color: s.cardBg,
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            PosAmountNumpad(
              controller: controller,
              onChanged: onChanged,
              showQuickCash: showQuickCash,
              quickCashInitial: quickCashInitial,
              onQuickCashUsed: onQuickCashUsed,
            ),
            SizedBox(height: 6),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton(
                onPressed: onDone,
                style: FilledButton.styleFrom(
                  backgroundColor: context.posBrand.buttonPrimary,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Done'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
