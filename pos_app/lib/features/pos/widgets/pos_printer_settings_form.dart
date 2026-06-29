import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:printing/printing.dart';

import '../../../core/providers/app_providers.dart';
import '../../../core/providers/local_print_settings_provider.dart';
import '../../../core/repositories/warehouse_repository.dart';
import '../../../core/theme/pos_theme.dart';
import '../models/local_print_settings.dart';
import '../test_print_screen.dart';
import 'pos_toast.dart';

/// All printer & receipt template settings on one scrollable form.
class PosPrinterSettingsForm extends ConsumerStatefulWidget {
  const PosPrinterSettingsForm({
    super.key,
    this.compactSections = false,
    this.pageLayout = false,
  });

  /// When true, section titles use smaller spacing (embedded card).
  final bool compactSections;

  /// Full settings page — tighter section styling inside the white card.
  final bool pageLayout;

  @override
  ConsumerState<PosPrinterSettingsForm> createState() =>
      _PosPrinterSettingsFormState();
}

class _PosPrinterSettingsFormState
    extends ConsumerState<PosPrinterSettingsForm> {
  final _receiptTitle = TextEditingController();
  final _headerTitle = TextEditingController();
  final _headerText = TextEditingController();
  final _warehouseAddress = TextEditingController();
  final _phoneNumber = TextEditingController();
  final _contactLine = TextEditingController();
  final _itemsSectionTitle = TextEditingController();
  final _footerTitle = TextEditingController();
  final _footerText = TextEditingController();
  final _softwareCredit = TextEditingController();
  final _widthCtrl = TextEditingController();
  final _heightCtrl = TextEditingController();
  final _logoWidthCtrl = TextEditingController();
  final _logoHeightCtrl = TextEditingController();
  final _dateFormatCtrl = TextEditingController();
  final _prefixCtrl = TextEditingController();
  final _primaryColorCtrl = TextEditingController();
  final _vatCtrl = TextEditingController();

  bool _formReady = false;
  String? _loadedWarehouseName;
  bool _warehouseLoadAttempted = false;
  List<Printer> _printers = [];
  bool _printersLoading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initForm());
  }

  Future<void> _initForm() async {
    await ref.read(localPrintSettingsProvider.notifier).ensureLoaded();
    if (!mounted) return;
    _syncControllers(ref.read(localPrintSettingsProvider));
    setState(() => _formReady = true);
    await _loadFromLocalWarehouse(onlyIfEmpty: true);
    await _loadPrinters();
  }

  Future<void> _loadPrinters() async {
    setState(() => _printersLoading = true);
    try {
      final printers = await Printing.listPrinters();
      if (!mounted) return;
      setState(() => _printers = printers);
    } catch (_) {
      if (mounted) setState(() => _printers = []);
    } finally {
      if (mounted) setState(() => _printersLoading = false);
    }
  }

  @override
  void dispose() {
    _receiptTitle.dispose();
    _headerTitle.dispose();
    _headerText.dispose();
    _warehouseAddress.dispose();
    _phoneNumber.dispose();
    _contactLine.dispose();
    _itemsSectionTitle.dispose();
    _footerTitle.dispose();
    _footerText.dispose();
    _softwareCredit.dispose();
    _widthCtrl.dispose();
    _heightCtrl.dispose();
    _logoWidthCtrl.dispose();
    _logoHeightCtrl.dispose();
    _dateFormatCtrl.dispose();
    _prefixCtrl.dispose();
    _primaryColorCtrl.dispose();
    _vatCtrl.dispose();
    super.dispose();
  }

  void _syncControllers(LocalPrintSettings s) {
    _receiptTitle.text = s.receiptTitle;
    _headerTitle.text = s.headerTitle;
    _headerText.text = s.headerText;
    _warehouseAddress.text = s.warehouseAddress;
    _phoneNumber.text = s.phoneNumber;
    _contactLine.text = s.contactLine;
    _itemsSectionTitle.text = s.itemsSectionTitle;
    _footerTitle.text = s.footerTitle;
    _footerText.text = s.footerText;
    _softwareCredit.text = s.softwareCredit;
    _widthCtrl.text = s.pageWidthMm.toString();
    _heightCtrl.text = s.pageHeightMm.toString();
    _logoWidthCtrl.text = s.logoWidth.toString();
    _logoHeightCtrl.text = s.logoHeight.toString();
    _dateFormatCtrl.text = s.dateFormat;
    _prefixCtrl.text = s.referencePrefix;
    _primaryColorCtrl.text = s.primaryColor;
    _vatCtrl.text = s.vatRegistrationNo;
  }

  LocalPrintSettings _readForm(LocalPrintSettings base) {
    return base.copyWith(
      receiptTitle: _receiptTitle.text.trim(),
      headerTitle: _headerTitle.text.trim(),
      headerText: _headerText.text.trim(),
      warehouseAddress: _warehouseAddress.text.trim(),
      phoneNumber: _phoneNumber.text.trim(),
      contactLine: _contactLine.text.trim(),
      itemsSectionTitle: _itemsSectionTitle.text.trim().isEmpty
          ? base.itemsSectionTitle
          : _itemsSectionTitle.text.trim(),
      footerTitle: _footerTitle.text.trim(),
      footerText: _footerText.text.trim(),
      softwareCredit: _softwareCredit.text.trim(),
      pageWidthMm: double.tryParse(_widthCtrl.text) ?? base.pageWidthMm,
      pageHeightMm: double.tryParse(_heightCtrl.text) ?? base.pageHeightMm,
      logoWidth: double.tryParse(_logoWidthCtrl.text) ?? base.logoWidth,
      logoHeight: double.tryParse(_logoHeightCtrl.text) ?? base.logoHeight,
      dateFormat: _dateFormatCtrl.text.trim().isEmpty
          ? base.dateFormat
          : _dateFormatCtrl.text.trim(),
      referencePrefix: _prefixCtrl.text.trim(),
      primaryColor: _primaryColorCtrl.text.trim(),
      vatRegistrationNo: _vatCtrl.text.trim(),
    );
  }

  Future<void> _save(LocalPrintSettings base) async {
    final next = _readForm(base);
    await ref.read(localPrintSettingsProvider.notifier).replace(next);
    ref.read(printerRefreshTickProvider.notifier).state++;
    _syncControllers(next);
    if (mounted) {
      PosToast.show(context, 'Printer settings saved',
          type: PosToastType.success);
    }
  }

  void _applyWarehouseToForm(WarehouseContact contact) {
    _warehouseAddress.text = contact.formattedAddress;
    _phoneNumber.text = contact.phone?.trim() ?? '';
    _contactLine.text = contact.contactLine;
    final title = _receiptTitle.text.trim();
    if (title.isEmpty || title == 'PosLanka.lk') {
      _receiptTitle.text = contact.name;
    }
    _loadedWarehouseName = contact.name;
  }

  Future<void> _loadFromLocalWarehouse({bool onlyIfEmpty = false}) async {
    if (_warehouseLoadAttempted && onlyIfEmpty) return;
    _warehouseLoadAttempted = true;

    final session = ref.read(sessionServiceProvider);
    final contact = await ref
        .read(warehouseRepositoryProvider)
        .getById(session.warehouseId);

    if (!mounted) return;

    if (contact == null) {
      setState(() => _loadedWarehouseName = null);
      if (!onlyIfEmpty && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Warehouse not found in local DB — run catalog sync first',
            ),
          ),
        );
      }
      return;
    }

    if (onlyIfEmpty) {
      final saved = ref.read(localPrintSettingsProvider);
      final hasContact = saved.warehouseAddress.trim().isNotEmpty ||
          saved.phoneNumber.trim().isNotEmpty ||
          saved.contactLine.trim().isNotEmpty;
      if (hasContact) {
        setState(() => _loadedWarehouseName = contact.name);
        return;
      }
    }

    setState(() => _applyWarehouseToForm(contact));

    if (!onlyIfEmpty && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Loaded contact from ${contact.name}')),
      );
    }
  }

  Future<void> _pickLogo(LocalPrintSettings base) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: false,
    );
    if (result == null || result.files.isEmpty) return;
    final path = result.files.single.path;
    if (path == null) return;
    await ref
        .read(localPrintSettingsProvider.notifier)
        .replace(base.copyWith(logoPath: path));
  }

  InputDecoration _fieldDecoration({
    required String label,
    String? hint,
    String? helper,
  }) {
    final radius = BorderRadius.circular(widget.pageLayout ? 10 : 8);
    return InputDecoration(
      labelText: label,
      hintText: hint,
      helperText: helper,
      filled: true,
      fillColor: widget.pageLayout ? Colors.white : PosColors.searchFill,
      border: OutlineInputBorder(borderRadius: radius),
      enabledBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: const BorderSide(color: PosColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: const BorderSide(color: PosColors.primary, width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!_formReady) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 32),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    final settings = ref.watch(localPrintSettingsProvider);
    final sectionGap =
        widget.pageLayout ? 22.0 : (widget.compactSections ? 16.0 : 20.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _SectionLabel('Paper size', pageLayout: widget.pageLayout),
        const SizedBox(height: 8),
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(
              value: '58mm',
              label: Text('58 mm'),
              icon: Icon(Icons.check, size: 16),
            ),
            ButtonSegment(
              value: '80mm',
              label: Text('80 mm'),
              icon: Icon(Icons.check, size: 16),
            ),
            ButtonSegment(
              value: 'a4',
              label: Text('A4'),
              icon: Icon(Icons.check, size: 16),
            ),
          ],
          selected: {settings.paperSize},
          showSelectedIcon: true,
          style: ButtonStyle(
            visualDensity: VisualDensity.compact,
            padding: WidgetStateProperty.all(
              const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
          ),
          onSelectionChanged: (v) async {
            final next = settings.withPaperSize(v.first);
            _widthCtrl.text = next.pageWidthMm.toString();
            _heightCtrl.text = next.pageHeightMm.toString();
            await ref.read(localPrintSettingsProvider.notifier).replace(next);
          },
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _widthCtrl,
                decoration: _fieldDecoration(label: 'Print width (mm)'),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                controller: _heightCtrl,
                decoration: _fieldDecoration(label: 'Roll height (mm)'),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: sectionGap),
        const Divider(height: 1, color: PosColors.border),
        SizedBox(height: sectionGap),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text(
            'Direct print',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
          subtitle: const Text(
            'Send receipts to the default printer without showing the print dialog',
            style: TextStyle(fontSize: 12, height: 1.35),
          ),
          value: settings.directPrint,
          activeTrackColor: PosColors.primary.withValues(alpha: 0.35),
          activeThumbColor: PosColors.primary,
          onChanged: (v) async {
            await ref
                .read(localPrintSettingsProvider.notifier)
                .replace(settings.copyWith(directPrint: v));
          },
        ),
        const SizedBox(height: 8),
        if (_printersLoading)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_printers.isEmpty)
          Text(
            'No printers found. Set your receipt printer as Windows default, then refresh.',
            style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
          )
        else
          DropdownButtonFormField<String>(
            initialValue: settings.printerUrl.isEmpty
                ? ''
                : (_printers.any((p) => p.url == settings.printerUrl)
                    ? settings.printerUrl
                    : ''),
            decoration: _fieldDecoration(
              label: 'Default receipt printer',
              helper:
                  'Used for direct print after each sale (e.g. XP-80C thermal)',
            ),
            items: [
              const DropdownMenuItem(
                value: '',
                child: Text('Windows default printer'),
              ),
              ..._printers.map(
                (p) => DropdownMenuItem(
                  value: p.url,
                  child: Text(
                    p.isDefault ? '${p.name} (default)' : p.name,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ],
            onChanged: (url) async {
              if (url == null) return;
              final name = url.isEmpty
                  ? ''
                  : _printers.firstWhere((p) => p.url == url).name;
              await ref.read(localPrintSettingsProvider.notifier).replace(
                    settings.copyWith(printerUrl: url, printerName: name),
                  );
              ref.read(printerRefreshTickProvider.notifier).state++;
            },
          ),
        if (settings.printerName.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            'Selected: ${settings.printerName}',
            style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
          ),
        ],
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            onPressed: _printersLoading ? null : _loadPrinters,
            icon: const Icon(Icons.refresh, size: 18),
            label: const Text('Refresh printer list'),
          ),
        ),
        SizedBox(height: sectionGap),
        const Divider(height: 1, color: PosColors.border),
        SizedBox(height: sectionGap),
        _SectionLabel('Receipt logo', pageLayout: widget.pageLayout),
        const SizedBox(height: 10),
        if (settings.logoPath != null && settings.logoPath!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              settings.logoPath!,
              style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        OutlinedButton.icon(
          onPressed: () => _pickLogo(settings),
          icon: const Icon(Icons.image_outlined, size: 18),
          label: const Text('Choose logo'),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(double.infinity, 48),
            alignment: Alignment.centerLeft,
          ),
        ),
        if (settings.logoPath != null) ...[
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: () => ref
                  .read(localPrintSettingsProvider.notifier)
                  .replace(settings.copyWith(clearLogo: true)),
              icon: const Icon(Icons.close, size: 16),
              label: const Text('Remove logo'),
            ),
          ),
        ],
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _logoWidthCtrl,
                decoration: _fieldDecoration(label: 'Logo width (pt)'),
                keyboardType: TextInputType.number,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                controller: _logoHeightCtrl,
                decoration: _fieldDecoration(label: 'Logo height (pt)'),
                keyboardType: TextInputType.number,
              ),
            ),
          ],
        ),
        SizedBox(height: sectionGap),
        const Divider(height: 1, color: PosColors.border),
        SizedBox(height: sectionGap),
        _SectionLabel('Receipt header', pageLayout: widget.pageLayout),
        const SizedBox(height: 10),
        if (_loadedWarehouseName != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              children: [
                Icon(Icons.store_outlined,
                    size: 18, color: Colors.grey.shade700),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Warehouse: $_loadedWarehouseName',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade800),
                  ),
                ),
                TextButton(
                  onPressed: () => _loadFromLocalWarehouse(onlyIfEmpty: false),
                  child: const Text('Reload from DB'),
                ),
              ],
            ),
          )
        else
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: OutlinedButton.icon(
              onPressed: () => _loadFromLocalWarehouse(onlyIfEmpty: false),
              icon: const Icon(Icons.download_outlined, size: 18),
              label: const Text('Load from local warehouse'),
            ),
          ),
        TextField(
          controller: _receiptTitle,
          decoration: _fieldDecoration(
            label: 'Business name',
            hint: 'PosLanka.lk',
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _headerTitle,
          decoration: _fieldDecoration(label: 'Header title'),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _headerText,
          decoration: _fieldDecoration(label: 'Header text'),
          maxLines: 2,
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _warehouseAddress,
          decoration: _fieldDecoration(
            label: 'Address (one line per row)',
            hint: 'Colombo\nSri Lanka',
          ),
          maxLines: 3,
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _phoneNumber,
          decoration: _fieldDecoration(
            label: 'Phone',
            hint: '+94763549080',
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _contactLine,
          decoration: _fieldDecoration(
            label: 'Email / website',
            hint: 'admin@shop.lk / www.shop.lk',
          ),
        ),
        SizedBox(height: sectionGap),
        const Divider(height: 1, color: PosColors.border),
        SizedBox(height: sectionGap),
        _SectionLabel('Receipt body & footer', pageLayout: widget.pageLayout),
        const SizedBox(height: 10),
        TextField(
          controller: _itemsSectionTitle,
          decoration: _fieldDecoration(
            label: 'Items section title',
            hint: 'INVOICE ITEMS',
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _footerTitle,
          decoration: _fieldDecoration(
            label: 'Footer message',
            hint: 'Thank You! Come Again!',
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _footerText,
          decoration: _fieldDecoration(label: 'Footer text'),
          maxLines: 8,
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _softwareCredit,
          decoration: _fieldDecoration(
            label: 'Software credit line',
            hint: 'Software by ',
          ),
        ),
        SizedBox(height: sectionGap),
        const Divider(height: 1, color: PosColors.border),
        SizedBox(height: sectionGap),
        _SectionLabel('Numbering & date', pageLayout: widget.pageLayout),
        const SizedBox(height: 10),
        TextField(
          controller: _prefixCtrl,
          decoration: _fieldDecoration(
            label: 'Invoice reference prefix',
            hint: 'REF, INV',
            helper:
                'Used on printed invoice number. Enable auto numbering below for auto numbers.',
          ),
        ),
        const SizedBox(height: 10),
        DropdownButtonFormField<String>(
          initialValue: settings.numberingType,
          decoration: _fieldDecoration(label: 'Numbering type'),
          items: const [
            DropdownMenuItem(value: 'sequential', child: Text('Sequential')),
            DropdownMenuItem(value: 'random', child: Text('Random')),
          ],
          onChanged: (v) {
            if (v == null) return;
            ref.read(localPrintSettingsProvider.notifier).replace(
                  settings.copyWith(numberingType: v),
                );
          },
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _dateFormatCtrl,
          decoration: _fieldDecoration(
            label: 'Date format',
            hint: 'yyyy-MM-dd HH:mm',
          ),
        ),
        SizedBox(height: sectionGap),
        const Divider(height: 1, color: PosColors.border),
        SizedBox(height: sectionGap),
        _SectionLabel('Colors & VAT', pageLayout: widget.pageLayout),
        const SizedBox(height: 10),
        TextField(
          controller: _primaryColorCtrl,
          decoration: _fieldDecoration(
            label: 'Primary color',
            hint: '#000000',
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _vatCtrl,
          decoration: _fieldDecoration(label: 'VAT registration number'),
        ),
        SizedBox(height: sectionGap),
        const Divider(height: 1, color: PosColors.border),
        SizedBox(height: sectionGap),
        _SectionLabel('Display options', pageLayout: widget.pageLayout),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: PosColors.pageBg,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: PosColors.border),
          ),
          child: Column(
            children: [
              CheckboxListTile(
                title: const Text(
                  'Select all',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                value: settings.allOptionsSelected,
                onChanged: (v) async {
                  await ref.read(localPrintSettingsProvider.notifier).replace(
                        settings.withAllOptions(v ?? false),
                      );
                },
              ),
              const Divider(height: 1),
              ...PrintOptionKeys.toggleable.map(
                (key) => CheckboxListTile(
                  dense: true,
                  title: Text(
                    PrintOptionKeys.labels[key] ?? key,
                    style: const TextStyle(fontSize: 13),
                  ),
                  value: settings.option(key),
                  onChanged: (v) async {
                    await ref.read(localPrintSettingsProvider.notifier).replace(
                          settings.withOption(key, v ?? false),
                        );
                  },
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Wrap(
          spacing: 10,
          runSpacing: 8,
          children: [
            FilledButton.icon(
              onPressed: () => _save(settings),
              icon: const Icon(Icons.save_outlined, size: 18),
              label: const Text('Save printer settings'),
            ),
            OutlinedButton.icon(
              onPressed: () async {
                await _save(settings);
                if (!mounted) return;
                await Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const TestPrintScreen(),
                  ),
                );
              },
              icon: const Icon(Icons.print_outlined, size: 18),
              label: const Text('Test print'),
            ),
          ],
        ),
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text, {this.pageLayout = false});

  final String text;
  final bool pageLayout;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: pageLayout ? 14 : 13,
        fontWeight: FontWeight.w700,
        color: PosColors.textMuted,
      ),
    );
  }
}
