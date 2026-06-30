import 'package:flutter/material.dart';

import '../../../core/theme/pos_theme.dart';
import 'pos_professional_dialog.dart';
import 'show_pos_dialog.dart';

Future<void> showPosCalculator(BuildContext context) {
  return showPosDialog<void>(
    context: context,
    builder: (ctx) => const _PosCalculatorDialog(),
  );
}

class _PosCalculatorDialog extends StatefulWidget {
  const _PosCalculatorDialog();

  @override
  State<_PosCalculatorDialog> createState() => _PosCalculatorDialogState();
}

class _PosCalculatorDialogState extends State<_PosCalculatorDialog> {
  String _display = '0';

  void _tap(String v) {
    setState(() {
      if (v == 'AC') {
        _display = '0';
      } else if (v == 'CE') {
        _display = _display.length <= 1 ? '0' : _display.substring(0, _display.length - 1);
      } else if (v == '=') {
        try {
          final expr = _display.replaceAll('×', '*').replaceAll('÷', '/');
          // ignore: avoid_dynamic_calls
          _display = _formatResult(_evalSimple(expr));
        } catch (_) {
          _display = 'Err';
        }
      } else {
        _display = _display == '0' || _display == 'Err' ? v : '$_display$v';
      }
    });
  }

  double _evalSimple(String expr) {
    final parts = expr.split(RegExp(r'(?<=[+\-*/])|(?=[+\-*/])'));
    if (parts.length < 3) return double.tryParse(expr) ?? 0;
    var acc = double.tryParse(parts[0].trim()) ?? 0;
    for (var i = 1; i < parts.length - 1; i += 2) {
      final op = parts[i].trim();
      final n = double.tryParse(parts[i + 1].trim()) ?? 0;
      switch (op) {
        case '+':
          acc += n;
        case '-':
          acc -= n;
        case '*':
          acc *= n;
        case '/':
          acc = n == 0 ? acc : acc / n;
      }
    }
    return acc;
  }

  String _formatResult(double v) {
    if (v == v.roundToDouble()) return v.toStringAsFixed(0);
    return v.toStringAsFixed(2);
  }

  @override
  Widget build(BuildContext context) {
    final keys = [
      'AC', 'CE', '%', '÷',
      '7', '8', '9', '×',
      '4', '5', '6', '-',
      '1', '2', '3', '+',
      '0', '.', '=',
    ];
    return PosProfessionalDialogShell(
      title: 'Calculator',
      subtitle: 'Quick amount helper',
      icon: Icons.calculate_outlined,
      maxWidth: 320,
      maxBodyHeight: 420,
      footer: PosProfessionalDialogFooter(
        primaryLabel: 'Close',
        onPrimary: () => Navigator.pop(context),
      ),
      body: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            alignment: Alignment.centerRight,
            child: Text(
              _display,
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
          ),
          SizedBox(height: 12),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 4,
            mainAxisSpacing: 6,
            crossAxisSpacing: 6,
            children: keys.map((k) {
              return FilledButton.tonal(
                onPressed: () => _tap(k),
                style: FilledButton.styleFrom(
                  backgroundColor: context.posBrand.primaryLight,
                  foregroundColor: context.posBrand.primary,
                ),
                child: Text(k),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
