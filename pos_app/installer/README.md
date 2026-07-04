# NEWGENID POS — cross-platform desktop installers

Packages the Flutter **pos_app** terminal for Windows, macOS, and Linux.

| Platform | Tool | Output |
|----------|------|--------|
| Windows | Inno Setup 6 | `installer/output/NEWGENIDPOS-Setup-{version}.exe` |
| macOS | `hdiutil` | `installer/output/NEWGENID-POS-{version}-macos.dmg` |
| Linux | `dpkg-deb` | `installer/output/newgenidpos_{version}_amd64.deb` |

Version is read from [`pubspec.yaml`](../pubspec.yaml) (`0.1.0+1` → version `0.1.0`, build `1`).

## Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) with desktop enabled
- **Windows:** [Inno Setup 6](https://jrsoftware.org/isinfo.php)
- **Linux:** `dpkg-deb`, GTK3 dev libraries for Flutter Linux build
- **macOS:** Xcode command-line tools (`hdiutil`)

## Quick build

### Windows

```powershell
cd pos_app\installer
.\build_release.ps1
```

Or:

```powershell
cd pos_app\installer\windows
.\build_installer.ps1
```

### macOS / Linux

```bash
cd pos_app/installer
chmod +x build_release.sh macos/build_dmg.sh linux/build_deb.sh scripts/read_version.sh
./build_release.sh
```

## After install

1. Launch **NEWGENID POS**
2. **Settings → Server & API** — set your Laravel POS API URL (`https://your-domain.com/pos`)
3. Register / log in and download catalog
4. **Settings → Reverb setup** — configure live stock sync if using Reverb

Local SQLite data stays in the user app data folder and is **not** removed on uninstall.

## CI

GitHub Actions workflow [`.github/workflows/pos-app-release.yml`](../../.github/workflows/pos-app-release.yml) builds all three platforms on demand or when a tag `pos-v*` is pushed.

## Folder layout

```
installer/
  build_release.ps1      # Windows entry
  build_release.sh       # macOS / Linux entry
  output/                # built installers (gitignored)
  scripts/
    read_version.ps1
    read_version.sh
  windows/
    newgenidpos.iss
    build_installer.ps1
  macos/
    build_dmg.sh
  linux/
    build_deb.sh
    debian/
```

## Notes

- Inno Setup is **Windows only**; macOS and Linux use native packagers above.
- Code signing / notarization (Windows/macOS) is not included in v1 — add before wide public distribution.
- Internal executable name remains `pos_app.exe` / `pos_app`; display name is **NEWGENID POS** (customizable in Settings → Appearance).
- Windows installs to `{autopf}\NEWGENIDPOS` by default.
