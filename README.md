# git_test
MY first github repo!
Hello Odin!

---

## Morning Startup Agent

Automatically launches your daily apps and opens your work files every time you log into Windows.

### What It Does

- Launches **Slack** and **Discord**
- Opens **Google Chrome** with 7 tabs: Paylocity, Twitter/X, Facebook Community, Sprout Social, Notion, Google Docs, and the Topstep dashboard
- Opens **VS Code** with `daily_tasks.md` and `project_ideas.md` ready to go

### First-Time Setup

1. Clone this repo to a local folder on your laptop (avoid network drives):
   ```
   git clone <repo-url> C:\Users\YourName\Projects\git_test
   ```
2. Open PowerShell in the repo folder and run:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\setup.ps1
   ```
3. That's it. The agent will run automatically on your next login.

### Test Without Logging Out

Double-click `run_startup.vbs`, or run from PowerShell:
```powershell
wscript.exe "C:\path\to\git_test\run_startup.vbs"
```

### Files

| File | Purpose |
|------|---------|
| `startup.ps1` | Main script — launches all apps and opens tabs |
| `run_startup.vbs` | Silent launcher (no console window) |
| `setup.ps1` | One-time setup — creates the login shortcut |
| `daily_tasks.md` | Your daily task list (edit each morning) |
| `project_ideas.md` | Running list of project ideas and statuses |

### Removing the Startup Agent

Delete the shortcut at:
```
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\MorningStartup.lnk
```
