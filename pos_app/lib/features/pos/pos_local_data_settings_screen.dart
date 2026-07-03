import 'dart:async';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/database/local_database_config.dart';
import '../../core/providers/app_providers.dart';
import '../../core/providers/local_database_settings_provider.dart';
import '../../core/providers/local_reverb_settings_provider.dart';
import '../../core/sync/database_backup_scheduler.dart';
import '../../core/theme/pos_theme.dart';
import 'models/local_database_settings.dart';
import 'providers/pos_settings_subpage_provider.dart';
import 'widgets/pos_professional_dialog.dart';
import 'widgets/pos_settings_ui.dart';
import 'widgets/pos_toast.dart';

class PosLocalDataSettingsScreen extends ConsumerStatefulWidget {
  const PosLocalDataSettingsScreen({super.key});

  @override
  ConsumerState<PosLocalDataSettingsScreen> createState() =>
      _PosLocalDataSettingsScreenState();
}

class _PosLocalDataSettingsScreenState
    extends ConsumerState<PosLocalDataSettingsScreen> {
  bool _busy = false;
  String? _activeDbPath;
  String? _activeBackupDir;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => unawaited(_loadPaths()));
  }

  Future<void> _loadPaths() async {
    final settings = ref.read(localDatabaseSettingsProvider);
    final dbPath = ref.read(appDatabaseProvider).databaseFilePath ??
        await LocalDatabaseConfig.resolveDatabaseFilePath(settings);
    final backupDir = await LocalDatabaseConfig.resolveBackupDirectory(settings);
    if (!mounted) return;
    setState(() {
      _activeDbPath = dbPath;
      _activeBackupDir = backupDir;
    });
  }

  void _snack(String msg, {bool error = false, bool success = false}) {
    if (!mounted) return;
    PosToast.show(
      context,
      msg,
      type: error
          ? PosToastType.error
          : success
              ? PosToastType.success
              : PosToastType.info,
    );
  }

  Future<void> _pickDatabaseDirectory() async {
    final picked = await FilePicker.platform.getDirectoryPath(
      dialogTitle: 'Choose local database folder',
    );
    if (picked == null || picked.trim().isEmpty) return;

    final current = ref.read(localDatabaseSettingsProvider).databaseDirectory;
    if (current == picked) return;

    if (!mounted) return;
    final ok = await showPosConfirmDialog(
      context: context,
      title: 'Change database folder?',
      message:
          'The database will be copied to:\n$picked\n\n'
          'Restart the POS app after saving so the new location is used.',
      icon: Icons.folder_outlined,
      confirmLabel: 'Use this folder',
    );
    if (ok != true || !mounted) return;

    await ref.read(localDatabaseSettingsProvider.notifier).patch(
          (s) => s.copyWith(databaseDirectory: picked),
        );
    _snack('Database folder saved. Restart the app to apply.', success: true);
    await _loadPaths();
  }

  Future<void> _resetDatabaseDirectory() async {
    final ok = await showPosConfirmDialog(
      context: context,
      title: 'Use default folder?',
      message:
          'Restore the default app data folder for the local database.\n\n'
          'Restart the POS app after saving.',
      icon: Icons.restore_outlined,
      confirmLabel: 'Reset',
    );
    if (ok != true || !mounted) return;

    await ref.read(localDatabaseSettingsProvider.notifier).patch(
          (s) => s.copyWith(clearDatabaseDirectory: true),
        );
    _snack('Default database folder restored. Restart the app.', success: true);
    await _loadPaths();
  }

  Future<void> _pickBackupDirectory() async {
    final picked = await FilePicker.platform.getDirectoryPath(
      dialogTitle: 'Choose backup folder',
    );
    if (picked == null || picked.trim().isEmpty) return;

    await ref.read(localDatabaseSettingsProvider.notifier).patch(
          (s) => s.copyWith(backupDirectory: picked),
        );
    _snack('Backup folder saved', success: true);
    await _loadPaths();
  }

  Future<void> _resetBackupDirectory() async {
    await ref.read(localDatabaseSettingsProvider.notifier).patch(
          (s) => s.copyWith(clearBackupDirectory: true),
        );
    _snack('Default backup folder restored', success: true);
    await _loadPaths();
  }

  Future<void> _backupNow() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final ok =
          await ref.read(databaseBackupSchedulerProvider).runBackup(silent: false);
      if (!mounted) return;
      if (ok) {
        final settings = await ref
            .read(localDatabaseSettingsRepositoryProvider)
            .load();
        await ref
            .read(localDatabaseSettingsProvider.notifier)
            .replace(settings);
        _snack('Database backup created', success: true);
        await _loadPaths();
      } else {
        _snack('Backup failed. Check folder permissions.', error: true);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String _formatLastBackup(String? iso) {
    final dt = iso == null ? null : DateTime.tryParse(iso);
    if (dt == null) return 'Never';
    return DateFormat('MMM d, yyyy HH:mm').format(dt.toLocal());
  }

  String _backupModeLabel(LocalBackupMode mode) {
    switch (mode) {
      case LocalBackupMode.off:
        return 'Off';
      case LocalBackupMode.auto:
        return 'Automatic';
      case LocalBackupMode.remind:
        return 'Remind me';
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(localDatabaseSettingsProvider);
    final reverb = ref.watch(localReverbSettingsProvider);
    final dbPath = _activeDbPath ?? '…';
    final backupDir = _activeBackupDir ?? '…';

    return PosSettingsSubPageShell(
      title: 'Local data & backup',
      subtitle: 'Database location and backup schedule for this terminal',
      onBack: () => closePosSettingsSubPage(ref),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          PosSettingsSectionCard(
            icon: Icons.storage_outlined,
            title: 'Database location',
            subtitle: 'Where the offline SQLite database is stored',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _PathField(label: 'Database file', path: dbPath),
                const SizedBox(height: 8),
                _PathField(
                  label: 'Configured folder',
                  path: settings.databaseDirectory?.trim().isNotEmpty == true
                      ? settings.databaseDirectory!
                      : 'Default (app documents)',
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    OutlinedButton.icon(
                      onPressed: _busy ? null : () => unawaited(_pickDatabaseDirectory()),
                      icon: const Icon(Icons.folder_open_outlined, size: 18),
                      label: const Text('Change folder'),
                    ),
                    if (settings.databaseDirectory?.trim().isNotEmpty == true)
                      OutlinedButton.icon(
                        onPressed:
                            _busy ? null : () => unawaited(_resetDatabaseDirectory()),
                        icon: const Icon(Icons.restore_outlined, size: 18),
                        label: const Text('Use default'),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Changing the folder requires restarting the POS app. '
                  'Your existing database is copied on first launch.',
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          PosSettingsSectionCard(
            icon: Icons.backup_outlined,
            title: 'Backup',
            subtitle: 'Protect sales and catalog data on this device',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _PathField(label: 'Backup folder', path: backupDir),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    OutlinedButton.icon(
                      onPressed: _busy ? null : () => unawaited(_pickBackupDirectory()),
                      icon: const Icon(Icons.folder_open_outlined, size: 18),
                      label: const Text('Change backup folder'),
                    ),
                    if (settings.backupDirectory?.trim().isNotEmpty == true)
                      OutlinedButton.icon(
                        onPressed:
                            _busy ? null : () => unawaited(_resetBackupDirectory()),
                        icon: const Icon(Icons.restore_outlined, size: 18),
                        label: const Text('Use default'),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<LocalBackupMode>(
                  key: ValueKey('backup-mode-${settings.backupModeKey}'),
                  initialValue: settings.backupMode,
                  decoration: const InputDecoration(
                    labelText: 'Backup mode',
                    helperText:
                        'Automatic runs in the background. Remind shows a prompt when due.',
                    border: OutlineInputBorder(),
                  ),
                  items: LocalBackupMode.values
                      .map(
                        (mode) => DropdownMenuItem(
                          value: mode,
                          child: Text(_backupModeLabel(mode)),
                        ),
                      )
                      .toList(),
                  onChanged: (mode) {
                    if (mode == null) return;
                    ref.read(localDatabaseSettingsProvider.notifier).patch(
                          (s) => s.copyWith(backupMode: mode),
                        );
                  },
                ),
                if (settings.backupMode != LocalBackupMode.off) ...[
                  const SizedBox(height: 12),
                  DropdownButtonFormField<int>(
                    key: ValueKey('backup-interval-${settings.backupIntervalHours}'),
                    initialValue: settings.backupIntervalHours,
                    decoration: const InputDecoration(
                      labelText: 'Backup every',
                      border: OutlineInputBorder(),
                    ),
                    items: LocalDatabaseSettings.backupIntervalPresets
                        .map(
                          (hours) => DropdownMenuItem(
                            value: hours,
                            child: Text(
                              hours == 3
                                  ? 'Every 3 hours'
                                  : hours == 24
                                      ? 'Every 24 hours (daily)'
                                      : 'Every $hours hours',
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (hours) {
                      if (hours == null) return;
                      ref.read(localDatabaseSettingsProvider.notifier).patch(
                            (s) => s.copyWith(backupIntervalHours: hours),
                          );
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<int>(
                    key: ValueKey('backup-copies-${settings.maxBackupCopies}'),
                    initialValue: settings.maxBackupCopies,
                    decoration: const InputDecoration(
                      labelText: 'Keep recent copies',
                      helperText: 'Older backup files are removed automatically',
                      border: OutlineInputBorder(),
                    ),
                    items: LocalDatabaseSettings.maxBackupCopyPresets
                        .map(
                          (count) => DropdownMenuItem(
                            value: count,
                            child: Text(
                              '$count backup${count == 1 ? '' : 's'}',
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (count) {
                      if (count == null) return;
                      ref.read(localDatabaseSettingsProvider.notifier).patch(
                            (s) => s.copyWith(maxBackupCopies: count),
                          );
                    },
                  ),
                ],
                const SizedBox(height: 12),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Last backup'),
                  subtitle: Text(_formatLastBackup(settings.lastBackupAt)),
                ),
                const SizedBox(height: 8),
                FilledButton.icon(
                  onPressed: _busy ? null : () => unawaited(_backupNow()),
                  icon: _busy
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.backup_outlined, size: 18),
                  label: const Text('Backup now'),
                  style: FilledButton.styleFrom(
                    backgroundColor: context.posBrand.buttonPrimary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          PosSettingsSectionCard(
            icon: Icons.podcasts_outlined,
            title: 'Live stock sync',
            subtitle: 'Reverb WebSocket — configure on the Reverb setup page',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Reverb'),
                  subtitle: Text(
                    reverb.enableLiveStockSync
                        ? 'Enabled on this terminal'
                        : 'Disabled on this terminal',
                  ),
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: _busy
                      ? null
                      : () => openPosReverbSettings(ref),
                  icon: const Icon(Icons.settings_outlined, size: 18),
                  label: const Text('Open Reverb setup'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PathField extends StatelessWidget {
  const _PathField({required this.label, required this.path});

  final String label;
  final String path;

  @override
  Widget build(BuildContext context) {
    return InputDecorator(
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
      ),
      child: SelectableText(
        path,
        style: const TextStyle(fontSize: 13),
      ),
    );
  }
}
