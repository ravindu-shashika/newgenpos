import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import '../pos_currency.dart';

enum PosQuickCashLayout { wrap, grid }

enum PosNumpadKeyOrder { phone, calculator }

/// Visual style for amount entry keypads.
enum PosAmountNumpadStyle {
  /// Default POS dialogs (discount, coupon, etc.).
  standard,

  /// Payment modal — dark navy keys, white digits, red destructive keys.
  payment,
}

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
    this.compact = false,
    this.largeTouch = false,
    this.quickAmounts = kPosQuickCashAmounts,
    this.quickCashInitial = true,
    this.onQuickCashUsed,
    this.keyOrder = PosNumpadKeyOrder.phone,
    this.lightKeys = false,
    this.showClearButton = false,
    this.clearButtonLabel = 'Clear Amount Tendered',
    this.style = PosAmountNumpadStyle.standard,
    this.allowDecimal = true,
    this.maxLength,
  });

  final TextEditingController controller;
  final VoidCallback? onChanged;
  final bool showQuickCash;
  final bool fillHeight;
  final bool compact;
  final bool largeTouch;
  final List<int> quickAmounts;
  final bool quickCashInitial;
  final VoidCallback? onQuickCashUsed;
  final PosNumpadKeyOrder keyOrder;
  final bool lightKeys;
  final bool showClearButton;
  final String clearButtonLabel;
  final PosAmountNumpadStyle style;
  final bool allowDecimal;
  final int? maxLength;

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

  static const _keysInteger = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '', '0', '⌫',
  ];

  List<String> get _keys {
    if (!widget.allowDecimal) return _keysInteger;
    return widget.keyOrder == PosNumpadKeyOrder.calculator
        ? _keysCalculator
        : _keysPhone;
  }

  bool get _paymentStyle => widget.style == PosAmountNumpadStyle.payment;

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
    if (widget.maxLength != null &&
        widget.controller.text.length >= widget.maxLength!) {
      return;
    }

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

  Widget _keyAt(String key) {
    if (key.isEmpty) return const _NumpadKeyPlaceholder();
    return _NumpadKey(
      label: key,
      largeTouch: widget.largeTouch,
      compact: widget.compact,
      lightKeys: widget.lightKeys,
      style: widget.style,
      onPressed: () => _onKey(key),
    );
  }

  /// Column/Row layout scales with available space (avoids GridView clipping).
  Widget _buildGrid({required bool expandRows, double? fixedRowHeight}) {
    const crossCount = 3;
    const rowCount = 4;
    final mainSpacing = widget.compact ? 4.0 : 6.0;
    final crossSpacing = widget.compact ? 4.0 : 6.0;
    final keys = _keys;

    return Column(
      children: [
        for (var r = 0; r < rowCount; r++) ...[
          if (r > 0) SizedBox(height: mainSpacing),
          if (expandRows)
            Expanded(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  for (var c = 0; c < crossCount; c++) ...[
                    if (c > 0) SizedBox(width: crossSpacing),
                    Expanded(child: _keyAt(keys[r * crossCount + c])),
                  ],
                ],
              ),
            )
          else
            SizedBox(
              height: fixedRowHeight ?? (widget.largeTouch ? 52 : 44),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  for (var c = 0; c < crossCount; c++) ...[
                    if (c > 0) SizedBox(width: crossSpacing),
                    Expanded(child: _keyAt(keys[r * crossCount + c])),
                  ],
                ],
              ),
            ),
        ],
      ],
    );
  }

  Widget _buildClearButton({required double height}) {
    final danger = context.posStyles.danger;
    final iconSize = height < 40 ? 16.0 : 18.0;
    final fontSize = height < 40 ? 12.0 : 14.0;
    return Material(
      color: danger.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: _clearAll,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          height: height,
          alignment: Alignment.center,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: danger.withValues(alpha: 0.3)),
          ),
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.delete_outline, color: danger, size: iconSize),
                const SizedBox(width: 6),
                Text(
                  widget.clearButtonLabel,
                  style: TextStyle(
                    color: danger,
                    fontWeight: FontWeight.w700,
                    fontSize: fontSize,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.fillHeight) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
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
          _buildGrid(expandRows: false),
          if (widget.showClearButton) ...[
            const SizedBox(height: 8),
            _buildClearButton(height: widget.largeTouch ? 48 : 44),
          ],
        ],
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final maxH = constraints.maxHeight;
        final maxW = constraints.maxWidth;
        // Keep clear bar proportional so digit rows stay tall enough.
        var clearH = widget.showClearButton
            ? (widget.largeTouch ? 44.0 : 40.0)
            : 0.0;
        var gap = widget.showClearButton ? 8.0 : 0.0;
        if (maxH > 0 && maxH < 220 && widget.showClearButton) {
          clearH = 34;
          gap = 6;
        }

        final gridH = maxH > 0 ? (maxH - clearH - gap).clamp(0.0, maxH) : 0.0;
        // Prefer flexible rows; if height is tiny, use a scrollable min size.
        final minGridH = widget.largeTouch ? 168.0 : 140.0;
        final useScroll = gridH > 0 && gridH < minGridH;

        final grid = useScroll
            ? SingleChildScrollView(
                physics: const ClampingScrollPhysics(),
                child: SizedBox(
                  height: minGridH,
                  width: maxW,
                  child: _buildGrid(expandRows: true),
                ),
              )
            : _buildGrid(expandRows: true);

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
              const SizedBox(height: 8),
            ],
            Expanded(child: grid),
            if (widget.showClearButton) ...[
              SizedBox(height: gap),
              _buildClearButton(height: clearH),
            ],
          ],
        );
      },
    );
  }
}

/// Shared payment-modal numpad — cash, card digits, split amounts.
class PosPaymentNumpad extends StatelessWidget {
  const PosPaymentNumpad({
    super.key,
    required this.controller,
    this.onChanged,
    this.fillHeight = true,
    this.showClearButton = true,
    this.clearButtonLabel = 'Clear Amount Tendered',
    this.allowDecimal = true,
    this.maxLength,
    this.onQuickCashUsed,
    this.quickCashInitial = true,
  });

  final TextEditingController controller;
  final VoidCallback? onChanged;
  final bool fillHeight;
  final bool showClearButton;
  final String clearButtonLabel;
  final bool allowDecimal;
  final int? maxLength;
  final VoidCallback? onQuickCashUsed;
  final bool quickCashInitial;

  @override
  Widget build(BuildContext context) {
    return PosAmountNumpad(
      controller: controller,
      onChanged: onChanged,
      showQuickCash: false,
      fillHeight: fillHeight,
      largeTouch: true,
      quickCashInitial: quickCashInitial,
      onQuickCashUsed: onQuickCashUsed,
      keyOrder: PosNumpadKeyOrder.calculator,
      showClearButton: showClearButton,
      clearButtonLabel: clearButtonLabel,
      style: PosAmountNumpadStyle.payment,
      allowDecimal: allowDecimal,
      maxLength: maxLength,
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
            fillColor: context.posBrand.primaryLight.withValues(alpha: 0.35),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: focused ? context.posBrand.primary : Theme.of(context).dividerColor,
                width: focused ? 2 : 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: context.posBrand.primary, width: 2),
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
      color: isDanger ? PosColors.red.withValues(alpha: 0.12) : context.posBrand.primary,
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

class _NumpadKeyPlaceholder extends StatelessWidget {
  const _NumpadKeyPlaceholder();

  @override
  Widget build(BuildContext context) => const SizedBox.expand();
}

class _NumpadKey extends StatelessWidget {
  const _NumpadKey({
    required this.label,
    required this.onPressed,
    this.largeTouch = false,
    this.compact = false,
    this.lightKeys = false,
    this.style = PosAmountNumpadStyle.standard,
  });

  final String label;
  final VoidCallback onPressed;
  final bool largeTouch;
  final bool compact;
  final bool lightKeys;
  final PosAmountNumpadStyle style;

  @override
  Widget build(BuildContext context) {
    final isBackspace = label == '⌫';
    final payment = style == PosAmountNumpadStyle.payment;
    final brand = context.posBrand;

    final Color bg;
    final Color borderColor;
    final Color fg;

    if (isBackspace) {
      bg = context.posStyles.danger.withValues(alpha: 0.12);
      borderColor = context.posStyles.danger.withValues(alpha: 0.35);
      fg = context.posStyles.danger;
    } else if (payment) {
      final dark = Theme.of(context).brightness == Brightness.dark;
      if (dark) {
        bg = Theme.of(context).colorScheme.surfaceContainerHighest;
        borderColor = Theme.of(context).dividerColor;
        fg = Theme.of(context).colorScheme.onSurface;
      } else {
        bg = Color.alphaBlend(
          brand.primary.withValues(alpha: 0.55),
          Theme.of(context).colorScheme.surfaceContainerHighest,
        );
        borderColor = brand.primary.withValues(alpha: 0.35);
        fg = Colors.white;
      }
    } else if (lightKeys) {
      bg = brand.primaryLight;
      borderColor = brand.primary.withValues(alpha: 0.12);
      fg = Theme.of(context).colorScheme.onSurface;
    } else {
      final dark = Theme.of(context).brightness == Brightness.dark;
      if (dark) {
        bg = Theme.of(context).colorScheme.surfaceContainerHighest;
        borderColor = Theme.of(context).dividerColor;
        fg = Theme.of(context).colorScheme.onSurface;
      } else {
        bg = Colors.white;
        borderColor = Theme.of(context).dividerColor;
        fg = Theme.of(context).colorScheme.onSurface;
      }
    }

    final baseFont = compact
        ? 15.0
        : (largeTouch ? (payment ? 28.0 : 24.0) : 20.0);
    final baseIcon = compact ? 18.0 : (largeTouch ? 26.0 : 22.0);

    return Material(
      color: bg,
      elevation: isBackspace || lightKeys || payment ? 0 : 1,
      shadowColor: Colors.black12,
      borderRadius: BorderRadius.circular(8),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(8),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: borderColor),
          ),
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: isBackspace
                    ? Icon(
                        Icons.backspace_outlined,
                        color: fg,
                        size: baseIcon,
                      )
                    : Text(
                        label,
                        style: TextStyle(
                          fontSize: baseFont,
                          fontWeight: FontWeight.w700,
                          height: 1.0,
                          color: fg,
                        ),
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
