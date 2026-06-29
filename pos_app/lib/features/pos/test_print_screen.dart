import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:printing/printing.dart';

import '../../core/providers/app_providers.dart';
import '../../core/providers/local_print_settings_provider.dart';
import 'models/local_receipt.dart';
import 'providers/pos_settings_subpage_provider.dart';
import 'services/receipt_print_service.dart';
import 'widgets/pos_sub_screen_shell.dart';

/// Test print using local [localPrintSettingsProvider] only.
class TestPrintScreen extends ConsumerStatefulWidget {
  const TestPrintScreen({super.key});

  @override
  ConsumerState<TestPrintScreen> createState() => _TestPrintScreenState();
}

class _TestPrintScreenState extends ConsumerState<TestPrintScreen> {
  bool _printing = false;

  String get _cashierName =>
      ref.read(sessionServiceProvider).userName?.trim() ?? '';

  LocalReceipt get _previewReceipt =>
      LocalReceipt.samplePreview(cashierName: _cashierName);

  Future<void> _print() async {
    final printSettings = ref.read(localPrintSettingsProvider);
    setState(() => _printing = true);
    try {
      await ReceiptPrintService.printReceipt(
        _previewReceipt,
        printSettings: printSettings,
        jobName: 'test-print-empty',
        cashierName: _cashierName,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Print failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _printing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final printSettings = ref.watch(localPrintSettingsProvider);

    return PosSubScreenShell(
      title: 'Test print',
      busy: _printing,
      actions: [
        IconButton(
          tooltip: 'Print setup',
          icon: const Icon(Icons.tune),
          onPressed: _printing
              ? null
              : () {
                  Navigator.of(context).pop();
                  openPosPrinterSettings(ref);
                },
        ),
      ],
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Material(
            color: Colors.white,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Local print template',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${printSettings.paperSize} · '
                    '${printSettings.pageWidthMm} mm · '
                    'PosLanka-style preview',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Only checked options in Print setup appear on the receipt.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: PdfPreview(
              canChangeOrientation: false,
              canChangePageFormat: false,
              canDebug: false,
              pdfFileName: 'test-print-empty.pdf',
              build: (_) => ReceiptPrintService.buildReceiptPdf(
                _previewReceipt,
                printSettings: printSettings,
                cashierName: _cashierName,
              ),
            ),
          ),
          Material(
            elevation: 8,
            color: Colors.white,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: FilledButton.icon(
                onPressed: _printing ? null : _print,
                icon: _printing
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.print),
                label: Text(_printing ? 'Printing…' : 'Print test receipt'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
