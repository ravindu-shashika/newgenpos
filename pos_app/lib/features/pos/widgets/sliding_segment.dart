import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';

class SlidingSegmentOption {
  const SlidingSegmentOption({
    required this.label,
    this.icon,
  });

  final String label;
  final IconData? icon;
}

/// Horizontally scrollable segmented control with a sliding pill indicator.
class SlidingSegment extends StatefulWidget {
  const SlidingSegment({
    super.key,
    required this.segments,
    required this.selectedIndex,
    required this.onChanged,
    this.color,
    this.largeTouch = false,
  });

  final List<SlidingSegmentOption> segments;
  final int selectedIndex;
  final ValueChanged<int> onChanged;
  final Color? color;
  final bool largeTouch;

  @override
  State<SlidingSegment> createState() => _SlidingSegmentState();
}

class _SlidingSegmentState extends State<SlidingSegment> {
  final _scrollCtrl = ScrollController();
  final _segmentKeys = <GlobalKey>[];
  double _indicatorLeft = 0;
  double _indicatorWidth = 0;

  @override
  void initState() {
    super.initState();
    _syncKeys();
    WidgetsBinding.instance.addPostFrameCallback((_) => _updateIndicator());
  }

  @override
  void didUpdateWidget(covariant SlidingSegment oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.segments.length != widget.segments.length) {
      _syncKeys();
    }
    if (oldWidget.selectedIndex != widget.selectedIndex) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _updateIndicator();
        _scrollSelectedIntoView();
      });
    }
  }

  void _syncKeys() {
    _segmentKeys
      ..clear()
      ..addAll(List.generate(widget.segments.length, (_) => GlobalKey()));
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _scrollSelectedIntoView() {
    if (!_scrollCtrl.hasClients) return;
    final key = _segmentKeys[widget.selectedIndex];
    final ctx = key.currentContext;
    if (ctx == null) return;
    Scrollable.ensureVisible(
      ctx,
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOutCubic,
      alignment: 0.5,
    );
  }

  void _updateIndicator() {
    if (!mounted || widget.segments.isEmpty) return;
    final index = widget.selectedIndex.clamp(0, widget.segments.length - 1);
    final key = _segmentKeys[index];
    final box = key.currentContext?.findRenderObject() as RenderBox?;
    final stackBox = context.findRenderObject() as RenderBox?;
    if (box == null || stackBox == null || !box.hasSize) return;

    final segmentPos = box.localToGlobal(Offset.zero, ancestor: stackBox);
    setState(() {
      _indicatorLeft = segmentPos.dx;
      _indicatorWidth = box.size.width;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.segments.isEmpty) {
      return const SizedBox.shrink();
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _updateIndicator());

        final accentColor = widget.color ?? context.posBrand.primary;
        final barHeight = widget.largeTouch ? 56.0 : 44.0;
        final inset = widget.largeTouch ? 4.0 : 3.0;
        final iconSize = widget.largeTouch ? 22.0 : 18.0;
        final fontSize = widget.largeTouch ? 16.0 : 13.0;
        final hPad = widget.largeTouch ? 20.0 : 14.0;
        final vPad = widget.largeTouch ? 12.0 : 8.0;

        return Container(
          height: barHeight,
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: BorderRadius.circular(widget.largeTouch ? 12 : 10),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              AnimatedPositioned(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOutCubic,
                left: _indicatorLeft,
                width: _indicatorWidth > 0 ? _indicatorWidth : 0,
                top: inset,
                bottom: inset,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: accentColor,
                    borderRadius: BorderRadius.circular(widget.largeTouch ? 10 : 8),
                    boxShadow: [
                      BoxShadow(
                        color: accentColor.withValues(alpha: 0.28),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                ),
              ),
              SingleChildScrollView(
                controller: _scrollCtrl,
                scrollDirection: Axis.horizontal,
                padding: EdgeInsets.symmetric(horizontal: inset, vertical: inset),
                child: Row(
                  children: List.generate(widget.segments.length, (i) {
                    final seg = widget.segments[i];
                    final selected = i == widget.selectedIndex;
                    return Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: widget.largeTouch ? 3 : 2,
                      ),
                      child: Material(
                        key: _segmentKeys[i],
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () => widget.onChanged(i),
                          borderRadius: BorderRadius.circular(
                            widget.largeTouch ? 10 : 8,
                          ),
                          child: Padding(
                            padding: EdgeInsets.symmetric(
                              horizontal: hPad,
                              vertical: vPad,
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (seg.icon != null) ...[
                                  Icon(
                                    seg.icon,
                                    size: iconSize,
                                    color: selected
                                        ? Colors.white
                                        : Theme.of(context).colorScheme.onSurfaceVariant,
                                  ),
                                  SizedBox(width: widget.largeTouch ? 8 : 6),
                                ],
                                Text(
                                  seg.label,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: fontSize,
                                    color: selected
                                        ? Colors.white
                                        : Theme.of(context).colorScheme.onSurface,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
