# startup.ps1
# Morning startup automation. Launched silently at login via run_startup.vbs.
# Opens Slack, Discord, Chrome (7 tabs), and VS Code with daily Markdown files.

$RepoDir = if ($PSScriptRoot) { $PSScriptRoot } else { $pwd.Path }

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
        "https://x.com/home",
        "https://www.facebook.com/groups/TopstepCommunity/",
        "https://app.sproutsocial.com/login",
        "https://www.notion.so/dd6ff140ea214118a749edc4b7392086?v=5769269863344975b8ee4dec5fc8276d",
        "https://docs.google.com/document/d/18EDky0v2gBvXwKeSaA-m6FnBCS840FMSqR5ufEKW5bw/edit?tab=t.2uv8x7eqvp1o",
        "https://dashboard.topstep.com/dashboard/admin/users?filterMode=simple&filterValue="
    )
    # Array form of -ArgumentList correctly quotes each URL as a separate argument.
    # --new-window forces a fresh window even if Chrome is already running.
    Start-Process $chromePath -ArgumentList (@("--new-window") + $tabs)
} else {
    Write-Warning "Google Chrome not found. Skipping browser tabs."
}

# ---------------------------------------------------------------------------
# 4. Open Obsidian
# ---------------------------------------------------------------------------
$obsidianCandidates = @(
    "$env:LOCALAPPDATA\Programs\Obsidian\Obsidian.exe",
    "$env:LOCALAPPDATA\Obsidian\Obsidian.exe",
    "$env:PROGRAMFILES\Obsidian\Obsidian.exe"
)
$obsidianPath = $obsidianCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($obsidianPath) {
    Start-Process $obsidianPath
} else {
    Write-Warning "Obsidian not found. Checked: $($obsidianCandidates -join ', ')"
}
