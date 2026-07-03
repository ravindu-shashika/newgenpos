# Builds KOOBIYA POS Windows release and Inno Setup installer.
# Requires: Flutter SDK, Inno Setup 6 (ISCC.exe)

$ErrorActionPreference = "Stop"

$WindowsDir = $PSScriptRoot
$InstallerDir = Split-Path $WindowsDir -Parent
$PosAppDir = Split-Path $InstallerDir -Parent
$OutputDir = Join-Path $InstallerDir "output"

. (Join-Path $InstallerDir "scripts\read_version.ps1") -PubspecPath (Join-Path $PosAppDir "pubspec.yaml")

$ReleaseDir = Join-Path $PosAppDir "build\windows\x64\runner\Release"
$IsccCandidates = @(
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "$env:ProgramFiles\Inno Setup 6\ISCC.exe"
)

$Iscc = $IsccCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $Iscc) {
    throw "Inno Setup 6 not found. Install from https://jrsoftware.org/isinfo.php"
}

Push-Location $PosAppDir
try {
    Write-Host "==> flutter pub get"
    flutter pub get

    Write-Host "==> flutter build windows --release"
    flutter build windows --release

    if (-not (Test-Path (Join-Path $ReleaseDir "pos_app.exe"))) {
        throw "Release build missing: $ReleaseDir\pos_app.exe"
    }

    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

    Write-Host "==> Inno Setup (version $AppVersion build $AppBuild)"
    & $Iscc `
        "/DMyAppVersion=$AppVersion" `
        "/DMyAppBuild=$AppBuild" `
        (Join-Path $WindowsDir "koobiya_pos.iss")

    Write-Host ""
    Write-Host "Done. Installer output:"
    Get-ChildItem $OutputDir -Filter "KOOBIYA-POS-Setup-*.exe" | ForEach-Object { Write-Host "  $($_.FullName)" }
} finally {
    Pop-Location
}
