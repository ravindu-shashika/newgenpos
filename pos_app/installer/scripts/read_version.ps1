# Reads version and build number from pos_app/pubspec.yaml.
# Usage: . .\read_version.ps1  then use $AppVersion and $AppBuild
param(
    [string]$PubspecPath = (Join-Path $PSScriptRoot "..\..\pubspec.yaml")
)

if (-not (Test-Path $PubspecPath)) {
    throw "pubspec.yaml not found at $PubspecPath"
}

$content = Get-Content -Path $PubspecPath -Raw
if ($content -match 'version:\s*(\d+\.\d+\.\d+)\+(\d+)') {
    $script:AppVersion = $Matches[1]
    $script:AppBuild = $Matches[2]
} else {
    throw "Could not parse version from pubspec.yaml (expected format: 0.1.0+1)"
}

Write-Output "AppVersion=$AppVersion"
Write-Output "AppBuild=$AppBuild"
