import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/app_config.dart';
import '../../core/logging/app_logger.dart';
import '../../core/pos_http/pos_api_client.dart';
import '../../core/providers/app_providers.dart';
import '../../core/services/device_identity_service.dart';
import 'setup_screen.dart';

/// First launch: set server URL, then register terminal (MAC + token + warehouse).
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _serverUrlCtrl = TextEditingController();
  final _terminalIdCtrl = TextEditingController();
  final _tokenCtrl = TextEditingController();
  final _pcNameCtrl = TextEditingController();

  bool _loading = false;
  bool _loadingIdentity = true;
  bool _connecting = false;
  bool _loadingWarehouses = false;
  bool _serverConnected = false;
  String? _error;
  int? _selectedWarehouseId;
  List<Map<String, dynamic>> _warehouses = [];

  @override
  void initState() {
    super.initState();
    final session = ref.read(sessionServiceProvider);
    _selectedWarehouseId = session.warehouseId;
    // Only pre-fill a previously saved URL — never force local IP on first install.
    final stored = session.posBaseUrl?.trim();
    if (stored != null && stored.isNotEmpty) {
      _serverUrlCtrl.text = AppConfig.displayPosBaseUrl(stored);
    } else if (AppConfig.isProduction) {
      _serverUrlCtrl.text = AppConfig.posBaseUrl;
    } else {
      _serverUrlCtrl.text = '';
    }
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

      // Resume warehouse list only when a custom URL was already saved.
      if (session.posBaseUrl?.trim().isNotEmpty == true) {
        await _connectAndLoadWarehouses(auto: true);
      }
    } catch (e, stack) {
      AppLogger.error('Register', 'Device identity failed', e, stack);
      if (!mounted) return;
      setState(() {
        _error = AppLogger.userMessage(e);
        _loadingIdentity = false;
      });
    }
  }

  Future<void> _connectAndLoadWarehouses({bool auto = false}) async {
    final url = AppConfig.normalizePosBaseUrlInput(_serverUrlCtrl.text);
    if (url == null) {
      setState(() {
        _error = 'Enter the POS server URL (example: https://your-domain.com/api/pos)';
        _serverConnected = false;
        _warehouses = [];
        _selectedWarehouseId = null;
      });
      return;
    }

    // Block accidental use of loopback on a fresh install unless user typed it.
    if (!auto && AppConfig.isLoopbackPosUrl(url) && AppConfig.isProduction) {
      setState(() {
        _error =
            'Localhost / 127.0.0.1 is not allowed for production. Enter your public server URL.';
      });
      return;
    }

    setState(() {
      _connecting = true;
      _loadingWarehouses = true;
      _error = null;
    });

    try {
      final session = ref.read(sessionServiceProvider);
      await session.savePosBaseUrl(url);
      bumpSessionState(ref);

      final api = PosApiClient(baseUrl: url, posToken: session.posToken);
      await api.health();
      final warehouses = await api.fetchWarehouses();

      if (!mounted) return;

      int? selected = _selectedWarehouseId;
      if (selected != null && !warehouses.any((w) => w['id'] == selected)) {
        selected = null;
      }
      selected ??=
          warehouses.isNotEmpty ? _intOrNull(warehouses.first['id']) : null;

      setState(() {
        _warehouses = warehouses;
        _selectedWarehouseId = selected;
        _serverConnected = true;
        _connecting = false;
        _loadingWarehouses = false;
        _error = warehouses.isEmpty
            ? 'Server connected but no warehouses were returned.'
            : null;
      });
    } catch (e, stack) {
      AppLogger.error('Register', 'Connect / load warehouses failed', e, stack);
      if (!mounted) return;
      setState(() {
        _warehouses = [];
        _selectedWarehouseId = null;
        _serverConnected = false;
        _connecting = false;
        _loadingWarehouses = false;
        _error = AppLogger.userMessage(e);
      });
    }
  }

  @override
  void dispose() {
    _serverUrlCtrl.dispose();
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
    final url = AppConfig.normalizePosBaseUrlInput(_serverUrlCtrl.text);

    if (url == null) {
      setState(() => _error = 'Enter and connect to the POS server URL first.');
      return;
    }
    if (_loadingIdentity || macAddress.isEmpty || activationToken.isEmpty) {
      setState(() => _error = 'Device identity is still loading.');
      return;
    }
    if (!_serverConnected || warehouseId == null) {
      setState(
        () => _error = 'Connect to the server and select a warehouse.',
      );
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final session = ref.read(sessionServiceProvider);
      await session.savePosBaseUrl(url);
      bumpSessionState(ref);

      final api = PosApiClient(baseUrl: url, posToken: session.posToken);

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
      // Re-assert configured URL so status/download never fall back to localhost.
      await session.savePosBaseUrl(url);
      api.setPosToken(posToken);
      api.setBaseUrl(url);

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
        !_connecting &&
        !_loadingWarehouses &&
        _serverConnected &&
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
                  'Enter your POS server URL first, connect, then select a warehouse.',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: _serverUrlCtrl,
                  keyboardType: TextInputType.url,
                  autocorrect: false,
                  enabled: !_loading && !_connecting,
                  decoration: InputDecoration(
                    labelText: 'POS server URL *',
                    hintText: 'https://your-domain.com/api/pos',
                    helperText:
                        'Full API path ending with /pos (not a local IP unless you run the API on this PC)',
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.cloud_outlined),
                  ),
                  onChanged: (_) {
                    if (_serverConnected || _error != null) {
                      setState(() {
                        _serverConnected = false;
                        _warehouses = [];
                        _selectedWarehouseId = null;
                        _error = null;
                      });
                    }
                  },
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: (_loading || _connecting || _loadingIdentity)
                      ? null
                      : () => _connectAndLoadWarehouses(),
                  icon: _connecting || _loadingWarehouses
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Icon(
                          _serverConnected
                              ? Icons.check_circle_outline
                              : Icons.link,
                        ),
                  label: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      _connecting || _loadingWarehouses
                          ? 'Connecting…'
                          : _serverConnected
                              ? 'Connected — refresh warehouses'
                              : 'Connect to server',
                    ),
                  ),
                ),
                const SizedBox(height: 16),
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
                        !_serverConnected
                            ? 'Connect to server first'
                            : _loadingWarehouses
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
                      onChanged: (!_serverConnected ||
                              _loadingWarehouses ||
                              _warehouses.isEmpty)
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
                  decoration:
                      _readOnlyDecoration('Terminal ID (MAC)', Icons.tag),
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
