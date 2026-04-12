# setup.ps1
# One-time setup: sets PowerShell execution policy and creates the Windows
# Startup folder shortcut so startup.ps1 runs automatically on every login.
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
# 3. Check for VS Code (non-fatal warning)
# ---------------------------------------------------------------------------
$codeFound = (Get-Command code -ErrorAction SilentlyContinue) -or
             (Test-Path "$env:PROGRAMFILES\Microsoft VS Code\Code.exe")
if ($codeFound) {
    Write-Host "[OK] VS Code found." -ForegroundColor Green
} else {
    Write-Warning "VS Code not found. Markdown files will not open until VS Code is installed."
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
# 5. Create shortcut in the Windows Startup folder
# ---------------------------------------------------------------------------
$startupFolder = [System.Environment]::GetFolderPath('Startup')
$shortcutPath  = Join-Path $startupFolder "MorningStartup.lnk"
$vbsPath       = Join-Path $RepoDir "run_startup.vbs"

try {
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath       = "wscript.exe"
    $Shortcut.Arguments        = "`"$vbsPath`""
    $Shortcut.WorkingDirectory = $RepoDir
    $Shortcut.Description      = "Morning Startup Automation"
    $Shortcut.WindowStyle      = 7  # 7 = minimized (suppresses any window flash)
    $Shortcut.Save()
} catch {
    Write-Error "Failed to create shortcut: $_"
    exit 1
}

if (Test-Path $shortcutPath) {
    Write-Host "[OK] Startup shortcut created: $shortcutPath" -ForegroundColor Green
} else {
    Write-Error "Shortcut was not created. Check permissions on: $startupFolder"
    exit 1
}

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "Setup complete! The startup agent will run automatically on next login." -ForegroundColor Cyan
Write-Host ""
Write-Host "To test immediately (without logging out), run:" -ForegroundColor White
Write-Host "  wscript.exe `"$vbsPath`"" -ForegroundColor Yellow
Write-Host ""
Write-Host "To remove the startup agent later, delete:" -ForegroundColor White
Write-Host "  $shortcutPath" -ForegroundColor Yellow
Write-Host ""
