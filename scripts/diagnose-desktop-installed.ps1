# Diagnose packaged AutoVideo Studio on Windows (run after reboot / startup issues).
$ErrorActionPreference = "Continue"

$installRoots = @(
  "${env:ProgramFiles}\AutoVideo Studio",
  "${env:ProgramFiles(x86)}\AutoVideo Studio",
  "$env:LOCALAPPDATA\Programs\AutoVideo Studio"
)

$runtime = Join-Path $env:APPDATA "AutoVideo Studio\runtime"
$logs = @{
  workerOut = Join-Path $runtime "desktop-worker.log"
  workerErr = Join-Path $runtime "desktop-worker.err.log"
  nextOut   = Join-Path $runtime "desktop-next.log"
  nextErr   = Join-Path $runtime "desktop-next.err.log"
}

Write-Host "=== AutoVideo Studio — desktop diagnose ===" -ForegroundColor Cyan
Write-Host "Runtime: $runtime`n"

foreach ($root in $installRoots) {
  if (-not (Test-Path $root)) { continue }
  Write-Host "Install: $root" -ForegroundColor Green
  $workerExe = Join-Path $root "resources\worker-dist\autovideo-worker.exe"
  $appExe = Join-Path $root "AutoVideo Studio.exe"
  Write-Host "  App exe: $(if (Test-Path $appExe) { 'OK' } else { 'MISSING' })"
  Write-Host "  Worker:  $(if (Test-Path $workerExe) { 'OK — ' + $workerExe } else { 'MISSING — ' + $workerExe })"
  $internal = Join-Path $root "resources\worker-dist\_internal"
  if (Test-Path $internal) { Write-Host "  Worker _internal: OK" } else { Write-Host "  Worker _internal: MISSING (broken install)" -ForegroundColor Yellow }
}

Write-Host "`nLog tail (last 40 lines each):" -ForegroundColor Cyan
foreach ($pair in $logs.GetEnumerator()) {
  Write-Host "`n--- $($pair.Key) $($pair.Value) ---" -ForegroundColor DarkGray
  if (Test-Path $pair.Value) {
    Get-Content $pair.Value -Tail 40 -ErrorAction SilentlyContinue
  } else {
    Write-Host "(file not found — app may not have started yet)"
  }
}

Write-Host "`nPorts 8021-8026 (worker):" -ForegroundColor Cyan
foreach ($port in 8021..8026) {
  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($conn) {
    foreach ($c in $conn) {
      $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
      Write-Host "  Port $port in use — PID $($c.OwningProcess) $($proc.ProcessName)" -ForegroundColor Yellow
    }
  }
}

Write-Host "`nWorker processes:" -ForegroundColor Cyan
Get-Process -Name "autovideo-worker" -ErrorAction SilentlyContinue | Format-Table Id, ProcessName, Path -AutoSize

Write-Host "`nTip: Open AutoVideo Studio from Start menu — do NOT double-click autovideo-worker.exe." -ForegroundColor Green
