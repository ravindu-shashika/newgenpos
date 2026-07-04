; NEWGENID POS — Windows installer (Inno Setup 6)
; Build with: pos_app\installer\windows\build_installer.ps1

#ifndef MyAppVersion
  #define MyAppVersion "0.1.0"
#endif

#ifndef MyAppBuild
  #define MyAppBuild "1"
#endif

#define MyAppName "NEWGENID POS"
#define MyAppPublisher "NEWGENID"
#define MyAppURL "https://newgenid.com"
#define MyAppExeName "pos_app.exe"
#define MyAppId "{{8F3C2A1B-4D5E-6F7A-8B9C-0D1E2F3A4B5C}"

[Setup]
AppId={#MyAppId}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\NEWGENIDPOS
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=
OutputDir=..\output
OutputBaseFilename=NEWGENIDPOS-Setup-{#MyAppVersion}
SetupIconFile=..\..\windows\runner\resources\app_icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
VersionInfoVersion={#MyAppVersion}.{#MyAppBuild}
VersionInfoProductVersion={#MyAppVersion}.{#MyAppBuild}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} Terminal
VersionInfoProductName={#MyAppName}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "..\..\build\windows\x64\runner\Release\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

; Clear local POS data on uninstall so reinstall shows Register screen.
[UninstallDelete]
Type: files; Name: "{userdocs}\newgenpos.sqlite"
Type: files; Name: "{userdocs}\newgenpos.sqlite-wal"
Type: files; Name: "{userdocs}\newgenpos.sqlite-shm"
Type: files; Name: "{userdocs}\pos.sqlite"
Type: files; Name: "{userdocs}\pos.sqlite-wal"
Type: files; Name: "{userdocs}\pos.sqlite-shm"
Type: filesandordirs; Name: "{userdocs}\backups"
Type: filesandordirs; Name: "{localappdata}\pos_app"
Type: filesandordirs; Name: "{userappdata}\pos_app"
