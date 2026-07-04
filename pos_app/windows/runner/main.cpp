#include <flutter/dart_project.h>
#include <flutter/flutter_view_controller.h>
#include <windows.h>

#include "flutter_window.h"
#include "utils.h"

namespace {

// Named mutex: only one NEWGENID POS process may run.
constexpr const wchar_t kSingleInstanceMutexName[] =
    L"Local\\NewgenidPosSingleInstanceMutex";

// Must match win32_window.cpp window class.
constexpr const wchar_t kPosWindowClassName[] = L"NEWGENIDPOS_WIN32_WINDOW";
constexpr const wchar_t kPosWindowTitle[] = L"NEWGENID POS";

// Held for the process lifetime; released automatically on exit.
HANDLE g_single_instance_mutex = nullptr;

bool TryBecomeSingleInstance() {
  g_single_instance_mutex =
      ::CreateMutexW(nullptr, TRUE, kSingleInstanceMutexName);
  if (g_single_instance_mutex == nullptr) {
    return true;
  }
  if (::GetLastError() == ERROR_ALREADY_EXISTS) {
    ::CloseHandle(g_single_instance_mutex);
    g_single_instance_mutex = nullptr;
    return false;
  }
  return true;
}

void ActivateExistingPosWindow() {
  HWND hwnd = ::FindWindowW(kPosWindowClassName, nullptr);
  if (hwnd == nullptr) {
    hwnd = ::FindWindowW(nullptr, kPosWindowTitle);
  }
  if (hwnd == nullptr) {
    return;
  }

  if (::IsIconic(hwnd)) {
    ::ShowWindow(hwnd, SW_RESTORE);
  } else {
    ::ShowWindow(hwnd, SW_SHOW);
  }

  // Allow this process to set the foreground window of the existing instance.
  const HWND foreground = ::GetForegroundWindow();
  const DWORD foreground_tid =
      foreground != nullptr ? ::GetWindowThreadProcessId(foreground, nullptr)
                            : 0;
  const DWORD this_tid = ::GetCurrentThreadId();
  const bool attached =
      foreground_tid != 0 && foreground_tid != this_tid &&
      ::AttachThreadInput(foreground_tid, this_tid, TRUE) != FALSE;

  ::BringWindowToTop(hwnd);
  ::SetForegroundWindow(hwnd);
  ::SetActiveWindow(hwnd);
  ::SetFocus(hwnd);

  if (attached) {
    ::AttachThreadInput(foreground_tid, this_tid, FALSE);
  }
}

}  // namespace

int APIENTRY wWinMain(_In_ HINSTANCE instance, _In_opt_ HINSTANCE prev,
                      _In_ wchar_t *command_line, _In_ int show_command) {
  // Single process: if already running, restore that window and exit.
  if (!TryBecomeSingleInstance()) {
    ActivateExistingPosWindow();
    return EXIT_SUCCESS;
  }

  // Attach to console when present (e.g., 'flutter run') or create a
  // new console when running with a debugger.
  if (!::AttachConsole(ATTACH_PARENT_PROCESS) && ::IsDebuggerPresent()) {
    CreateAndAttachConsole();
  }

  // Initialize COM, so that it is available for use in the library and/or
  // plugins.
  ::CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);

  flutter::DartProject project(L"data");

  std::vector<std::string> command_line_arguments =
      GetCommandLineArguments();

  project.set_dart_entrypoint_arguments(std::move(command_line_arguments));

  FlutterWindow window(project);
  Win32Window::Point origin(10, 10);
  Win32Window::Size size(1280, 720);
  if (!window.Create(kPosWindowTitle, origin, size)) {
    return EXIT_FAILURE;
  }
  // Kiosk POS blocks close from Flutter (window_manager); do not quit on WM_DESTROY.
  window.SetQuitOnClose(false);

  ::MSG msg;
  while (::GetMessage(&msg, nullptr, 0, 0)) {
    ::TranslateMessage(&msg);
    ::DispatchMessage(&msg);
  }

  ::CoUninitialize();
  return EXIT_SUCCESS;
}
