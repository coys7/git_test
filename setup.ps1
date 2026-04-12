# setup.ps1
# One-time setup: sets PowerShell execution policy and registers a Task Scheduler
# task that fires on login AND screen unlock (covers waking from sleep).
#
# Run this once from the repo directory after cloning:
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1

#Requires -Version 5.0

$RepoDir = $PSScriptRoot
Write-Host ""
Write-Host "Morning Startup Agent - Setup" -ForegroundColor Cyan
Write-Host "Repo directory: $RepoDir" -ForegroundColor Gray
Write-Host ""

# ---------------------------------------------------------------------------
# 1. Validate required files exist in this repo folder
# ---------------------------------------------------------------------------
$requiredFiles = @("startup.ps1", "run_startup.vbs")
foreach ($f in $requiredFiles) {
    if (-not (Test-Path (Join-Path $RepoDir $f))) {
        Write-Error "Required file not found: $f`nMake sure setup.ps1 is run from the cloned repo directory."
        exit 1
    }
}
Write-Host "[OK] Required files found." -ForegroundColor Green

# ---------------------------------------------------------------------------
# 2. Check for Google Chrome (non-fatal warning)
# ---------------------------------------------------------------------------
$chromeCandidates = @(
    "$env:PROGRAMFILES\Google\Chrome\Application\chrome.exe",
    "${env:PROGRAMFILES(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$chromeFound = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($chromeFound) {
    Write-Host "[OK] Chrome found: $chromeFound" -ForegroundColor Green
} else {
    Write-Warning "Chrome not found. Browser tabs will be skipped until Chrome is installed."
}

# ---------------------------------------------------------------------------
# 3. Check for Obsidian (non-fatal warning)
# ---------------------------------------------------------------------------
$obsidianFound = @(
    "$env:LOCALAPPDATA\Programs\Obsidian\Obsidian.exe",
    "$env:LOCALAPPDATA\Obsidian\Obsidian.exe",
    "$env:PROGRAMFILES\Obsidian\Obsidian.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($obsidianFound) {
    Write-Host "[OK] Obsidian found: $obsidianFound" -ForegroundColor Green
} else {
    Write-Warning "Obsidian not found. It will be skipped until installed."
}

# ---------------------------------------------------------------------------
# 4. Set PowerShell execution policy for CurrentUser (no admin required)
# ---------------------------------------------------------------------------
try {
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    Write-Host "[OK] Execution policy set to RemoteSigned (CurrentUser)." -ForegroundColor Green
} catch {
    Write-Warning "Could not set execution policy: $_"
    Write-Host "      This may be locked by Group Policy. The startup script uses -ExecutionPolicy Bypass" -ForegroundColor Yellow
    Write-Host "      in run_startup.vbs as a fallback, so it should still work." -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
# 5. Remove old Startup folder shortcut if it exists (replaced by Task Scheduler)
# ---------------------------------------------------------------------------
$oldShortcut = Join-Path ([System.Environment]::GetFolderPath('Startup')) "MorningStartup.lnk"
if (Test-Path $oldShortcut) {
    Remove-Item $oldShortcut -Force
    Write-Host "[OK] Removed old Startup folder shortcut." -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# 6. Register Task Scheduler task (fires on login AND screen unlock)
# ---------------------------------------------------------------------------
$taskName = "MorningStartupAgent"
$vbsPath  = Join-Path $RepoDir "run_startup.vbs"
$userId   = "$env:USERDOMAIN\$env:USERNAME"

$taskXml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Opens morning work apps on login or screen unlock (5am-12pm only).</Description>
  </RegistrationInfo>
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
      <UserId>$userId</UserId>
    </LogonTrigger>
    <SessionStateChangeTrigger>
      <Enabled>true</Enabled>
      <StateChange>SessionUnlock</StateChange>
      <UserId>$userId</UserId>
    </SessionStateChangeTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>$userId</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <ExecutionTimeLimit>PT2M</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>wscript.exe</Command>
      <Arguments>"$vbsPath"</Arguments>
      <WorkingDirectory>$RepoDir</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
"@

try {
    Register-ScheduledTask -TaskName $taskName -Xml $taskXml -Force -ErrorAction Stop | Out-Null
    Write-Host "[OK] Task Scheduler task registered: $taskName" -ForegroundColor Green
} catch {
    Write-Error "Failed to register scheduled task: $_"
    exit 1
}

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "Setup complete! The startup agent will now run automatically when you" -ForegroundColor Cyan
Write-Host "log in OR wake the laptop from sleep and enter your PIN." -ForegroundColor Cyan
Write-Host "(Only fires between 5am and 12pm so mid-day unlocks are ignored.)" -ForegroundColor Gray
Write-Host ""
Write-Host "To test immediately, run:" -ForegroundColor White
Write-Host "  wscript.exe `"$vbsPath`"" -ForegroundColor Yellow
Write-Host ""
Write-Host "To remove the startup agent later, run:" -ForegroundColor White
Write-Host "  Unregister-ScheduledTask -TaskName MorningStartupAgent -Confirm:`$false" -ForegroundColor Yellow
Write-Host ""
