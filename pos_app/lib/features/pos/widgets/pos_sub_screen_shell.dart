import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';

/// Scaffold for screens opened from the POS (print setup, settings, etc.).
/// Keeps a visible back control in fullscreen / hidden title-bar mode.
class PosSubScreenShell extends StatelessWidget {
  const PosSubScreenShell({
    super.key,
    required this.title,
    required this.body,
    this.actions = const [],
    this.busy = false,
    this.onBack,
    this.backIcon = Icons.arrow_back,
    this.backTooltip = 'Back',
  });

  final String title;
  final Widget body;
  final List<Widget> actions;
  final bool busy;
  final VoidCallback? onBack;
  final IconData backIcon;
  final String backTooltip;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: PosColors.pageBg,
      child: SafeArea(
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Material(
            color: Colors.white,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  height: 56,
                  child: Row(
                    children: [
                      IconButton(
                        tooltip: backTooltip,
                        onPressed: busy
                            ? null
                            : (onBack ?? () => Navigator.maybePop(context)),
                        icon: Icon(backIcon, size: 26),
                      ),
                      Expanded(
                        child: Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: PosColors.slate,
                          ),
                        ),
                      ),
                      ...actions,
                    ],
                  ),
                ),
                Container(height: 1, color: PosColors.border),
              ],
            ),
          ),
          Expanded(
            child: Material(
              color: PosColors.pageBg,
              child: body,
            ),
          ),
        ],
        ),
      ),
    );
  }
}
