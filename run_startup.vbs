' run_startup.vbs
' Silently launches startup.ps1 without showing a PowerShell console window.
' Place a shortcut to this file in the Windows Startup folder (setup.ps1 does this).

Dim objShell
Set objShell = CreateObject("WScript.Shell")

' Resolve the directory containing this .vbs file (same as repo root).
Dim scriptDir
scriptDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

Dim psScript
psScript = scriptDir & "startup.ps1"

' -WindowStyle Hidden suppresses the console window entirely.
' -ExecutionPolicy Bypass applies to this invocation only (not a permanent change).
' -NoProfile skips loading the user profile for faster startup.
Dim cmd
cmd = "powershell.exe -NoProfile -WindowStyle Hidden " & _
      "-ExecutionPolicy Bypass " & _
      "-File """ & psScript & """"

' Run with window style 0 (SW_HIDE) and do not wait for completion (False),
' so the login process is not blocked.
objShell.Run cmd, 0, False
Set objShell = Nothing
