import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/pos_theme.dart';
import '../../../core/providers/pos_ui_settings_provider.dart';
import 'pos_amount_numpad.dart';
import 'pos_touch_keyboard_controller.dart';
import 'pos_touch_text_keyboard.dart';

/// Wrap screens/dialogs so the touch keyboard can appear above content.
class PosTouchKeyboardHost extends ConsumerWidget {
  const PosTouchKeyboardHost({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(posUiSettingsProvider, (prev, next) {
      if (prev?.enableKeyboard == true && !next.enableKeyboard) {
        deferPosTouchKeyboardDetach(ref);
      }
    });

    final enabled = ref.watch(posUiSettingsProvider).enableKeyboard;
    final session = ref.watch(posTouchKeyboardControllerProvider).session;

    return Stack(
      fit: StackFit.expand,
      children: [
        child,
        if (enabled && session != null)
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _PosTouchKeyboardPanel(session: session),
          ),
      ],
    );
  }
}

class _PosTouchKeyboardPanel extends ConsumerStatefulWidget {
  const _PosTouchKeyboardPanel({required this.session});

  final PosTouchKeyboardSession session;

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
      elevation: 16,
      child: session.kind == PosTouchInputKind.text
          ? PosTouchTextKeyboard(
              controller: kb,
              maxLines: session.maxLines,
            )
          : _NumericKeyboardPanel(
              controller: session.controller,
              showQuickCash:
                  session.kind == PosTouchInputKind.amount && session.showQuickCash,
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
