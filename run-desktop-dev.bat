@echo off
setlocal
title AutoVideo Studio - Desktop Dev
cd /d "%~dp0"

echo.
echo  AutoVideo Studio (P0021) - Desktop dev
echo  Next.js :3021  +  Worker :8021  +  Electron
echo.

where pnpm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] pnpm not found. Install Node 20+ and run: corepack enable
  pause
  exit /b 1
)

if not exist "worker\.venv\Scripts\python.exe" (
  echo [WARN] Worker venv missing. First-time setup:
  echo   cd worker
  echo   python -m venv .venv
  echo   .venv\Scripts\pip install -r requirements.txt
  echo.
  set /p CONT=Continue anyway? Worker may use autovideo-worker.exe if built [Y/N]:
  if /i not "%CONT%"=="Y" exit /b 1
)

if not exist "app\node_modules" (
  echo ==^> pnpm install in app...
  pushd app
  call pnpm install
  if errorlevel 1 (
    popd
    pause
    exit /b 1
  )
  popd
)

echo ==^> Starting desktop shell...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-desktop-dev.ps1"
set EXIT=%ERRORLEVEL%

if not "%EXIT%"=="0" (
  echo.
  echo [ERROR] Desktop dev exited with code %EXIT%
  echo Logs: %~dp0.runtime\desktop-next.log
  echo        %~dp0.runtime\desktop-next.err.log
  echo Stop stale processes: stop-desktop-dev.bat
)

pause
exit /b %EXIT%
