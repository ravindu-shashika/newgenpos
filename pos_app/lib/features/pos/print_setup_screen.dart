import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'providers/pos_settings_subpage_provider.dart';

/// Legacy entry — opens printer settings inside the main app shell.
class PrintSetupScreen extends ConsumerWidget {
  const PrintSetupScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      openPosPrinterSettings(ref);
      if (context.mounted) {
        Navigator.of(context).pop();
      }
    });
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
