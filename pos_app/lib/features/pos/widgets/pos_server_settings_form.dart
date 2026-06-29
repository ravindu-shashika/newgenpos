import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/pos_http/pos_api_client.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/providers/pos_connectivity_providers.dart';
import '../../../core/theme/pos_theme.dart';
import 'pos_toast.dart';
import 'pos_touch_keyboard_controller.dart';
import 'pos_touch_text_field.dart';

/// Server API URL configuration — test connection and save to device session.
class PosServerSettingsForm extends ConsumerStatefulWidget {
  const PosServerSettingsForm({super.key, this.pageLayout = false});

  final bool pageLayout;

  @override
  ConsumerState<PosServerSettingsForm> createState() =>
      _PosServerSettingsFormState();
}

class _PosServerSettingsFormState extends ConsumerState<PosServerSettingsForm> {
  final _urlCtrl = TextEditingController();
  bool _formReady = false;
  bool _busy = false;
  bool? _lastTestOk;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initForm());
  }

  Future<void> _initForm() async {
    await ref.read(sessionServiceProvider).ensureLoaded();
    if (!mounted) return;
    _loadFromSession();
    setState(() => _formReady = true);
  }

  void _loadFromSession() {
    final session = ref.read(sessionServiceProvider);
    _urlCtrl.text = AppConfig.displayPosBaseUrl(session.posBaseUrl);
  }

  @override
  void dispose() {
    _urlCtrl.dispose();
    super.dispose();
  }

  String? _normalizedInput() =>
      AppConfig.normalizePosBaseUrlInput(_urlCtrl.text);

  Future<void> _testConnection() async {
    final url = _normalizedInput();
    if (url == null) {
      PosToast.show(context, 'Enter a valid server URL', type: PosToastType.error);
      return;
    }
    setState(() {
      _busy = true;
      _lastTestOk = null;
    });
    try {
      final session = ref.read(sessionServiceProvider);
      final client = PosApiClient(
        baseUrl: url,
        posToken: session.posToken,
      );
      final health = await client.health();
      final online = health['online'];
      final ok = online == true ||
          online == 1 ||
          online == '1' ||
          online == 'true';
      if (!mounted) return;
      setState(() => _lastTestOk = ok);
      PosToast.show(
        context,
        ok ? 'Server reachable' : 'Server responded but is offline',
        type: ok ? PosToastType.success : PosToastType.error,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _lastTestOk = false);
      PosToast.show(context, 'Connection failed: $e', type: PosToastType.error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _save() async {
    final url = _normalizedInput();
    if (url == null) {
      PosToast.show(context, 'Enter a valid server URL', type: PosToastType.error);
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(sessionServiceProvider).savePosBaseUrl(url);
      bumpSessionState(ref);
      refreshPosLinkStatus(ref);
      if (!mounted) return;
      PosToast.show(context, 'Server settings saved', type: PosToastType.success);
    } catch (e) {
      if (!mounted) return;
      PosToast.show(context, 'Failed to save: $e', type: PosToastType.error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _useBuildDefault() {
    _urlCtrl.text = AppConfig.posBaseUrl;
    setState(() => _lastTestOk = null);
  }

  void _clearCustomUrl() {
    _urlCtrl.text = AppConfig.posBaseUrl;
    setState(() => _lastTestOk = null);
  }

  @override
  Widget build(BuildContext context) {
    if (!_formReady) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    final brand = context.posBrand;
    final buildDefault = AppConfig.posBaseUrl;
    final envLabel = AppConfig.environmentLabel;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'POS API path',
          style: TextStyle(
            fontSize: widget.pageLayout ? 13 : 12,
            fontWeight: FontWeight.w700,
            color: PosColors.textPrimary,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Full URL to the POS API (must end with /pos). '
          'Example: http://127.0.0.1:8000/pos',
          style: const TextStyle(fontSize: 12, color: PosColors.textMuted),
        ),
        const SizedBox(height: 12),
        PosTouchTextField(
          controller: _urlCtrl,
          kind: PosTouchInputKind.text,
          decoration: const InputDecoration(
            labelText: 'Server API URL',
            hintText: 'http://127.0.0.1:8000/pos',
            border: OutlineInputBorder(),
            isDense: true,
          ),
          onChanged: (_) => setState(() => _lastTestOk = null),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            OutlinedButton.icon(
              onPressed: _busy ? null : _useBuildDefault,
              icon: const Icon(Icons.restore_outlined, size: 18),
              label: Text('Use $envLabel default'),
            ),
            if (_lastTestOk != null)
              _StatusPill(
                ok: _lastTestOk!,
                label: _lastTestOk! ? 'Last test: OK' : 'Last test: Failed',
              ),
          ],
        ),
        const SizedBox(height: 8),
        _SummaryChip(
          icon: Icons.code_outlined,
          label: 'Build default',
          value: buildDefault,
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _busy ? null : _testConnection,
                icon: _busy
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.wifi_tethering_outlined, size: 18),
                label: const Text('Test connection'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: FilledButton.icon(
                onPressed: _busy ? null : _save,
                style: FilledButton.styleFrom(
                  backgroundColor: brand.buttonPrimary,
                  foregroundColor: Colors.white,
                ),
                icon: const Icon(Icons.save_outlined, size: 18),
                label: const Text('Save server settings'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        TextButton(
          onPressed: _busy ? null : _clearCustomUrl,
          child: const Text('Reset form to current default'),
        ),
      ],
    );
  }
}

class _SummaryChip extends StatelessWidget {
  const _SummaryChip({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final brand = context.posBrand;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: PosColors.pageBg,
        borderRadius: BorderRadius.circular(kPosButtonRadius),
        border: Border.all(color: PosColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: brand.primary),
          const SizedBox(width: 10),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              color: PosColors.textMuted,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              value,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.end,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: PosColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.ok, required this.label});

  final bool ok;
  final String label;

  @override
  Widget build(BuildContext context) {
    final color = ok ? const Color(0xFF047857) : PosColors.red;
    final bg = ok
        ? const Color(0xFFECFDF5)
        : PosColors.red.withValues(alpha: 0.08);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(kPosButtonRadius),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            ok ? Icons.check_circle_outline : Icons.error_outline,
            size: 16,
            color: color,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
