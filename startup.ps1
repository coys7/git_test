﻿# startup.ps1
# Morning startup automation. Triggered by Task Scheduler on login or screen unlock.
# Opens Slack, Discord, and Chrome (7 tabs).

$RepoDir = if ($PSScriptRoot) { $PSScriptRoot } else { $pwd.Path }

# Only run during morning hours (5am - 12pm) so mid-day unlocks don't relaunch everything.
$hour = (Get-Date).Hour
if ($hour -lt 5 -or $hour -ge 12) { exit }

# ---------------------------------------------------------------------------
# Helper: Find Chrome executable
# ---------------------------------------------------------------------------
function Get-ChromePath {
    $candidates = @(
        "$env:PROGRAMFILES\Google\Chrome\Application\chrome.exe",
        "${env:PROGRAMFILES(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) { return $p }
    }
    return $null
}

# ---------------------------------------------------------------------------
# Helper: Find Discord Update.exe launcher
# ---------------------------------------------------------------------------
function Get-DiscordLauncher {
    $candidates = @(
        "$env:ProgramData\$env:USERNAME\Discord\Update.exe",
        "$env:LOCALAPPDATA\Discord\Update.exe"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) { return $p }
    }
    return $null
}

# ---------------------------------------------------------------------------
# 1. Launch Slack
# ---------------------------------------------------------------------------
$slackCandidates = @(
    "$env:LOCALAPPDATA\slack\slack.exe",
    "$env:LOCALAPPDATA\Programs\slack\slack.exe"
)
$slackPath = $slackCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($slackPath) {
    Start-Process $slackPath
} else {
    Write-Warning "Slack not found. Checked: $($slackCandidates -join ', ')"
}

# ---------------------------------------------------------------------------
# 2. Launch Discord
# ---------------------------------------------------------------------------
$discordLauncher = Get-DiscordLauncher
if ($discordLauncher) {
    Start-Process $discordLauncher -ArgumentList "--processStart", "Discord.exe"
} else {
    Write-Warning "Discord launcher not found. Checked ProgramData and LocalAppData."
}

# ---------------------------------------------------------------------------
# 3. Open Chrome with 7 tabs in one window
# ---------------------------------------------------------------------------
$chromePath = Get-ChromePath
if ($chromePath) {
    $tabs = @(
        "https://access.paylocity.com/",
        "https://app.sproutsocial.com/messages/smart",
        "https://x.com/home",
        "https://www.facebook.com/groups/TopstepCommunity/",
        "https://www.reddit.com/r/TopstepCommunity/"
    )
    # Array form of -ArgumentList correctly quotes each URL as a separate argument.
    # --new-window forces a fresh window even if Chrome is already running.
    Start-Process $chromePath -ArgumentList (@("--new-window") + $tabs)
} else {
    Write-Warning "Google Chrome not found. Skipping browser tabs."
}
