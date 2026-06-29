import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import '../pos_currency.dart';

enum PosQuickCashLayout { wrap, grid }

enum PosNumpadKeyOrder { phone, calculator }

/// Quick denomination buttons (50, 100, 500, …) for cash entry.
class PosQuickCashBar extends StatelessWidget {
  const PosQuickCashBar({
    super.key,
    required this.controller,
    this.onChanged,
    this.quickAmounts = kPosQuickCashAmounts,
    this.quickCashInitial = true,
    this.alwaysReplace = false,
    this.largeTouch = false,
    this.layout = PosQuickCashLayout.wrap,
    this.columns = 2,
    this.onQuickCashUsed,
  });

  final TextEditingController controller;
  final VoidCallback? onChanged;
  final List<int> quickAmounts;
  final bool quickCashInitial;
  final bool alwaysReplace;
  final bool largeTouch;
  final PosQuickCashLayout layout;
  final int columns;
  final VoidCallback? onQuickCashUsed;

  void _setValue(String value) {
    controller.text = value;
    controller.selection = TextSelection.collapsed(offset: value.length);
    onChanged?.call();
  }

  void _apply(int amount) {
    if (amount == 0) {
      _setValue('');
      onQuickCashUsed?.call();
      return;
    }
    if (!alwaysReplace && !quickCashInitial) {
      final current = double.tryParse(controller.text.trim()) ?? 0;
      _setValue((current + amount).toStringAsFixed(2));
    } else if (amount % 1 == 0) {
      _setValue(amount.toStringAsFixed(0));
    } else {
      _setValue(amount.toStringAsFixed(2));
    }
    onQuickCashUsed?.call();
  }

  List<({String label, int amount, bool danger})> get _items => [
        for (final amount in quickAmounts)
          (label: formatPosMoneyLabel(amount), amount: amount, danger: false),
        (label: 'Clear', amount: 0, danger: true),
      ];

  @override
  Widget build(BuildContext context) {
    if (layout == PosQuickCashLayout.grid) {
      final cols = columns.clamp(1, 4);
      final rows = (_items.length / cols).ceil();
      return LayoutBuilder(
        builder: (context, constraints) {
          const gap = 8.0;
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
                        Expanded(child: _itemAt(r * cols + c)),
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

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final item in _items)
          _QuickCashButton(
            label: item.label,
            isDanger: item.danger,
            largeTouch: largeTouch,
            expand: false,
            onPressed: () => _apply(item.amount),
          ),
      ],
    );
  }

  Widget _itemAt(int index) {
    if (index >= _items.length) {
      return const SizedBox.shrink();
    }
    final item = _items[index];
    return _QuickCashButton(
      label: item.label,
      isDanger: item.danger,
      largeTouch: largeTouch,
      expand: true,
      onPressed: () => _apply(item.amount),
    );
  }
}

/// Touch-friendly numeric keypad for currency entry on POS terminals.
class PosAmountNumpad extends StatefulWidget {
  const PosAmountNumpad({
    super.key,
    required this.controller,
    this.onChanged,
    this.showQuickCash = true,
    this.fillHeight = false,
    this.largeTouch = false,
    this.quickAmounts = kPosQuickCashAmounts,
    this.quickCashInitial = true,
    this.onQuickCashUsed,
    this.keyOrder = PosNumpadKeyOrder.phone,
    this.lightKeys = false,
    this.showClearButton = false,
  });

  final TextEditingController controller;
  final VoidCallback? onChanged;
  final bool showQuickCash;
  final bool fillHeight;
  final bool largeTouch;
  final List<int> quickAmounts;
  final bool quickCashInitial;
  final VoidCallback? onQuickCashUsed;
  final PosNumpadKeyOrder keyOrder;
  final bool lightKeys;
  final bool showClearButton;

  @override
  State<PosAmountNumpad> createState() => _PosAmountNumpadState();
}

class _PosAmountNumpadState extends State<PosAmountNumpad> {
  bool _firstKey = true;

  static const _keysPhone = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    '.', '0', '⌫',
  ];

  static const _keysCalculator = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '.', '0', '⌫',
  ];

  List<String> get _keys => widget.keyOrder == PosNumpadKeyOrder.calculator
      ? _keysCalculator
      : _keysPhone;

  @override
  void didUpdateWidget(covariant PosAmountNumpad oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.quickCashInitial && !widget.quickCashInitial && _firstKey) {
      setState(() => _firstKey = false);
    }
  }

  void _notify() => widget.onChanged?.call();

  void _setValue(String value) {
    widget.controller.text = value;
    widget.controller.selection =
        TextSelection.collapsed(offset: value.length);
    _notify();
  }

  void _afterQuickCash() {
    setState(() => _firstKey = false);
    widget.onQuickCashUsed?.call();
  }

  void _append(String key) {
    var text = widget.controller.text;
    if (_firstKey) {
      text = key == '.' ? '0.' : key;
      setState(() => _firstKey = false);
      widget.onQuickCashUsed?.call();
      _setValue(text);
      return;
    }

    if (key == '.') {
      if (text.contains('.')) return;
      if (text.isEmpty) text = '0';
      _setValue('$text.');
      return;
    }

    if (text == '0' && key != '.') {
      _setValue(key);
      return;
    }

    final dot = text.indexOf('.');
    if (dot >= 0 && text.length - dot > 2) return;

    _setValue('$text$key');
  }

  void _backspace() {
    final text = widget.controller.text;
    if (text.isEmpty) return;
    setState(() => _firstKey = false);
    widget.onQuickCashUsed?.call();
    _setValue(text.substring(0, text.length - 1));
  }

  void _clearAll() {
    setState(() => _firstKey = true);
    widget.onQuickCashUsed?.call();
    _setValue('');
  }

  void _onKey(String key) {
    if (key == '⌫') {
      _backspace();
    } else {
      _append(key);
    }
  }

  Widget _buildGrid() {
    const crossCount = 3;
    const rowCount = 4;
    const mainSpacing = 8.0;
    const crossSpacing = 8.0;

    Widget grid(double width, double height) {
      var aspectRatio = 1.65;
      if (widget.fillHeight && height > 0 && width > 0) {
        final cellHeight = (height - mainSpacing * (rowCount - 1)) / rowCount;
        final cellWidth =
            (width - crossSpacing * (crossCount - 1)) / crossCount;
        aspectRatio = cellWidth / cellHeight;
      }

      return GridView.count(
        shrinkWrap: !widget.fillHeight,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: crossCount,
        mainAxisSpacing: mainSpacing,
        crossAxisSpacing: crossSpacing,
        childAspectRatio: aspectRatio,
        children: [
          for (final key in _keys)
            _NumpadKey(
              label: key,
              largeTouch: widget.largeTouch,
              lightKeys: widget.lightKeys,
              onPressed: () => _onKey(key),
            ),
        ],
      );
    }

    if (widget.fillHeight) {
      return LayoutBuilder(
        builder: (context, constraints) => SizedBox(
          height: constraints.maxHeight,
          child: grid(constraints.maxWidth, constraints.maxHeight),
        ),
      );
    }

    return grid(0, 0);
  }

  Widget _buildClearButton() {
    return Material(
      color: PosColors.red.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: _clearAll,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          height: widget.largeTouch ? 52 : 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: PosColors.red.withValues(alpha: 0.25)),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.delete_outline, color: PosColors.red, size: 18),
              SizedBox(width: 8),
              Text(
                'Clear Amount Tendered',
                style: TextStyle(
                  color: PosColors.red,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.showQuickCash) ...[
          PosQuickCashBar(
            controller: widget.controller,
            onChanged: widget.onChanged,
            quickAmounts: widget.quickAmounts,
            quickCashInitial: widget.quickCashInitial,
            onQuickCashUsed: () {
              _afterQuickCash();
              widget.onQuickCashUsed?.call();
            },
          ),
          const SizedBox(height: 10),
        ],
        if (widget.fillHeight)
          Expanded(child: _buildGrid())
        else
          _buildGrid(),
        if (widget.showClearButton) ...[
          const SizedBox(height: 10),
          _buildClearButton(),
        ],
      ],
    );
  }
}

class PosAmountField extends StatefulWidget {
  const PosAmountField({
    super.key,
    required this.controller,
    required this.focusNode,
    this.decoration,
    this.onTap,
    this.largeTouch = false,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final InputDecoration? decoration;
  final VoidCallback? onTap;
  final bool largeTouch;

  @override
  State<PosAmountField> createState() => _PosAmountFieldState();
}

class _PosAmountFieldState extends State<PosAmountField> {
  @override
  void initState() {
    super.initState();
    widget.focusNode.addListener(_onFocus);
  }

  @override
  void didUpdateWidget(covariant PosAmountField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.focusNode != widget.focusNode) {
      oldWidget.focusNode.removeListener(_onFocus);
      widget.focusNode.addListener(_onFocus);
    }
  }

  @override
  void dispose() {
    widget.focusNode.removeListener(_onFocus);
    super.dispose();
  }

  void _onFocus() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final focused = widget.focusNode.hasFocus;
    return TextField(
      controller: widget.controller,
      focusNode: widget.focusNode,
      readOnly: true,
      showCursor: true,
      onTap: widget.onTap,
      style: TextStyle(
        fontSize: widget.largeTouch ? 26 : 20,
        fontWeight: FontWeight.w600,
      ),
      textAlign: TextAlign.right,
      decoration: widget.decoration ??
          InputDecoration(
            isDense: true,
            filled: true,
            fillColor: PosColors.primaryLight.withValues(alpha: 0.35),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: focused ? PosColors.primary : PosColors.border,
                width: focused ? 2 : 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: PosColors.primary, width: 2),
            ),
          ),
    );
  }
}

class _QuickCashButton extends StatelessWidget {
  const _QuickCashButton({
    required this.label,
    required this.onPressed,
    this.isDanger = false,
    this.largeTouch = false,
    this.expand = false,
  });

  final String label;
  final VoidCallback onPressed;
  final bool isDanger;
  final bool largeTouch;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final button = Material(
      color: isDanger ? PosColors.red.withValues(alpha: 0.12) : PosColors.primary,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          constraints: expand
              ? null
              : BoxConstraints(
                  minWidth: largeTouch ? 80 : 56,
                  minHeight: largeTouch ? 56 : 44,
                ),
          padding: EdgeInsets.symmetric(
            horizontal: largeTouch ? 20 : 14,
            vertical: largeTouch ? 14 : 10,
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: largeTouch ? 18 : 14,
              fontWeight: FontWeight.w700,
              color: isDanger ? PosColors.red : Colors.white,
            ),
          ),
        ),
      ),
    );

    if (expand) {
      return SizedBox.expand(child: button);
    }
    return button;
  }
}

class _NumpadKey extends StatelessWidget {
  const _NumpadKey({
    required this.label,
    required this.onPressed,
    this.largeTouch = false,
    this.lightKeys = false,
  });

  final String label;
  final VoidCallback onPressed;
  final bool largeTouch;
  final bool lightKeys;

  @override
  Widget build(BuildContext context) {
    final isBackspace = label == '⌫';
    final bg = isBackspace
        ? PosColors.red.withValues(alpha: 0.1)
        : (lightKeys ? PosColors.primaryLight : Colors.white);
    return Material(
      color: bg,
      elevation: isBackspace || lightKeys ? 0 : 1,
      shadowColor: Colors.black12,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isBackspace
                  ? PosColors.red.withValues(alpha: 0.35)
                  : (lightKeys
                      ? PosColors.primary.withValues(alpha: 0.12)
                      : PosColors.border),
            ),
          ),
          child: isBackspace
              ? const Icon(
                  Icons.backspace_outlined,
                  color: PosColors.red,
                  size: 22,
                )
              : Text(
                  label,
                  style: TextStyle(
                    fontSize: largeTouch ? 32 : 22,
                    fontWeight: FontWeight.w600,
                    color: PosColors.textPrimary,
                  ),
                ),
        ),
      ),
    );
  }
}
