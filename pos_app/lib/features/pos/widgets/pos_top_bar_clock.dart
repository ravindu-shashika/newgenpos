import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/providers/pos_ui_settings_provider.dart';
import '../../../core/theme/pos_theme.dart';
import '../models/pos_ui_settings.dart';

/// Formats [dateTime] using the top-bar clock pattern from POS settings.
String formatPosTopBarDateTime(DateTime dateTime, String pattern) {
  try {
    return DateFormat(pattern).format(dateTime);
  } catch (_) {
    return DateFormat(PosUiSettings.defaultTopBarDateTimeFormat).format(dateTime);
  }
}

/// Live clock shown in [PosShellHeader].
class PosTopBarLiveClock extends ConsumerStatefulWidget {
  const PosTopBarLiveClock({super.key});

  @override
  ConsumerState<PosTopBarLiveClock> createState() => _PosTopBarLiveClockState();
}

class _PosTopBarLiveClockState extends ConsumerState<PosTopBarLiveClock> {
  late Timer _timer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pattern = ref.watch(
      posUiSettingsProvider.select((s) => s.topBarDateTimeFormat),
    );
    final text = formatPosTopBarDateTime(_now, pattern);

    return Text(
      text,
      style: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: context.posStyles.text,
        fontFeatures: const [FontFeature.tabularFigures()],
      ),
    );
  }
}
