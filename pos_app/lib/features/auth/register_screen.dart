import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/logging/app_logger.dart';
import '../../core/providers/app_providers.dart';
import '../../core/services/device_identity_service.dart';
import 'setup_screen.dart';

/// First launch: auto-filled MAC, token, PC name — user selects warehouse only.
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _terminalIdCtrl = TextEditingController();
  final _tokenCtrl = TextEditingController();
  final _pcNameCtrl = TextEditingController();

  bool _loading = false;
  bool _loadingIdentity = true;
  bool _loadingWarehouses = false;
  String? _error;
  int? _selectedWarehouseId;
  List<Map<String, dynamic>> _warehouses = [];

  @override
  void initState() {
    super.initState();
    final session = ref.read(sessionServiceProvider);
    _selectedWarehouseId = session.warehouseId;
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadDeviceIdentity());
  }

  Future<void> _loadDeviceIdentity() async {
    final session = ref.read(sessionServiceProvider);
    await session.ensureDeviceId();

    try {
      final mac = session.macAddress ??
          await DeviceIdentityService.getMacAddress(
            fallbackDeviceId: session.deviceId,
          );
      final activationToken = await session.ensureActivationToken();
      final pcName = session.terminalName ?? DeviceIdentityService.getHostname();

      await session.saveMacAddress(mac);

      if (!mounted) return;
      setState(() {
        _terminalIdCtrl.text = mac;
        _tokenCtrl.text = activationToken;
        _pcNameCtrl.text = pcName;
        _loadingIdentity = false;
      });

      await _loadWarehouses();
    } catch (e, stack) {
      AppLogger.error('Register', 'Device identity failed', e, stack);
      if (!mounted) return;
      setState(() {
        _error = AppLogger.userMessage(e);
        _loadingIdentity = false;
      });
    }
  }

  Future<void> _loadWarehouses() async {
    setState(() {
      _loadingWarehouses = true;
      _error = null;
    });

    try {
      final api = ref.read(apiClientProvider);
      await api.health();
      final warehouses = await api.fetchWarehouses();

      if (!mounted) return;

      int? selected = _selectedWarehouseId;
      if (selected != null && !warehouses.any((w) => w['id'] == selected)) {
        selected = null;
      }
      selected ??= warehouses.isNotEmpty ? _intOrNull(warehouses.first['id']) : null;

      setState(() {
        _warehouses = warehouses;
        _selectedWarehouseId = selected;
        _loadingWarehouses = false;
      });
    } catch (e, stack) {
      AppLogger.error('Register', 'Load warehouses failed', e, stack);
      if (!mounted) return;
      setState(() {
        _warehouses = [];
        _selectedWarehouseId = null;
        _loadingWarehouses = false;
        _error = AppLogger.userMessage(e);
      });
    }
  }

  @override
  void dispose() {
    _terminalIdCtrl.dispose();
    _tokenCtrl.dispose();
    _pcNameCtrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    final macAddress = _terminalIdCtrl.text.trim();
    final activationToken = _tokenCtrl.text.trim();
    final pcName = _pcNameCtrl.text.trim();
    final warehouseId = _selectedWarehouseId;

    if (_loadingIdentity || macAddress.isEmpty || activationToken.isEmpty) {
      setState(() => _error = 'Device identity is still loading.');
      return;
    }
    if (warehouseId == null) {
      setState(() => _error = 'Select a warehouse.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final api = ref.read(apiClientProvider);
      final session = ref.read(sessionServiceProvider);

      await api.health();
      await session.ensureDeviceId();
      final clientToken = await session.ensureClientToken();

      final tokenRes = await api.registerPosDevice(
        macAddress: macAddress,
        activationToken: activationToken,
        deviceId: session.deviceId,
        clientToken: clientToken,
        warehouseId: warehouseId,
        name: pcName,
      );

      final posToken = tokenRes['pos_token']?.toString();
      if (posToken == null || posToken.isEmpty) {
        throw Exception('POS token was not returned by the server.');
      }

      final terminal = Map<String, dynamic>.from(
        tokenRes['terminal'] as Map? ?? {},
      );
      if (terminal.isEmpty) {
        throw Exception('Terminal registration failed.');
      }

      await session.savePosToken(posToken);
      api.setPosToken(posToken);

      await session.saveTerminal(
        id: _int(terminal['id']),
        code: terminal['code']?.toString() ?? macAddress,
        name: pcName,
        warehouseId: _intOrNull(terminal['warehouse_id']) ?? warehouseId,
      );
      await session.markDeviceRegistered();
      bumpSessionState(ref);

      if (!mounted) return;

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const SetupScreen()),
      );
    } catch (e, stack) {
      AppLogger.error('Register', 'Registration failed', e, stack);
      setState(() => _error = AppLogger.userMessage(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  int _int(dynamic v, {int fallback = 0}) {
    if (v == null) return fallback;
    if (v is int) return v;
    return int.tryParse(v.toString()) ?? fallback;
  }

  int? _intOrNull(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    return int.tryParse(v.toString());
  }

  InputDecoration _readOnlyDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      border: const OutlineInputBorder(),
      prefixIcon: Icon(icon),
      filled: true,
      fillColor: Theme.of(context).colorScheme.surfaceContainerHighest,
    );
  }

  @override
  Widget build(BuildContext context) {
    final canRegister = !_loadingIdentity &&
        !_loadingWarehouses &&
        _terminalIdCtrl.text.isNotEmpty &&
        _tokenCtrl.text.isNotEmpty &&
        _selectedWarehouseId != null &&
        _warehouses.isNotEmpty;

    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Icon(
                  Icons.point_of_sale,
                  size: 56,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(height: 16),
                Text(
                  'Register POS',
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Terminal ID and token are generated from this device. '
                  'Select a warehouse and tap Register.',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Warehouse',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.warehouse),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<int>(
                      value: _selectedWarehouseId,
                      isExpanded: true,
                      hint: Text(
                        _loadingWarehouses
                            ? 'Loading warehouses…'
                            : 'Select warehouse',
                      ),
                      items: _warehouses
                          .map(
                            (w) => DropdownMenuItem<int>(
                              value: _intOrNull(w['id']),
                              child: Text(w['name']?.toString() ?? 'Warehouse'),
                            ),
                          )
                          .where((item) => item.value != null)
                          .toList(),
                      onChanged: (_loadingWarehouses || _warehouses.isEmpty)
                          ? null
                          : (value) =>
                              setState(() => _selectedWarehouseId = value),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _terminalIdCtrl,
                  readOnly: true,
                  decoration: _readOnlyDecoration('Terminal ID (MAC)', Icons.tag),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _tokenCtrl,
                  readOnly: true,
                  decoration: _readOnlyDecoration('Token', Icons.vpn_key),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _pcNameCtrl,
                  readOnly: true,
                  decoration: _readOnlyDecoration('PC name', Icons.computer),
                ),
                if (_loadingIdentity) ...[
                  const SizedBox(height: 16),
                  const Center(child: CircularProgressIndicator()),
                  const SizedBox(height: 8),
                  const Text(
                    'Reading device MAC address…',
                    textAlign: TextAlign.center,
                  ),
                ],
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: Colors.red)),
                ],
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: (_loading || !canRegister) ? null : _register,
                  icon: _loading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.app_registration),
                  label: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(_loading ? 'Registering…' : 'Register'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
