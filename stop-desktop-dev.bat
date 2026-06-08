@echo off
setlocal
title AutoVideo Studio - Stop
cd /d "%~dp0"

echo Stopping AutoVideo worker / ports 8021-8026...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-desktop-workers.ps1"

echo.
echo Optional: close Electron / Next windows manually if still open.
pause
