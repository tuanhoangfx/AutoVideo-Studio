# Stop stale AutoVideo worker / desktop shell processes.
param(
  [switch]$ListOnly,
  [switch]$StopElectron,
  [switch]$SkipWorker
)

$ErrorActionPreference = "SilentlyContinue"

function Get-DesktopShellProcesses {
  $named = @(
    Get-Process electron, 'AutoVideo Studio' -ErrorAction SilentlyContinue |
      Where-Object { $_.ProcessName -like 'AutoVideo*' -or $_.MainWindowTitle -like '*AutoVideo*' }
  )
  $byCmd = @(
    Get-CimInstance Win32_Process -Filter "Name = 'electron.exe'" -ErrorAction SilentlyContinue |
      Where-Object { $_.CommandLine -match 'electron/main\.cjs' -or $_.CommandLine -match 'P0021-AutoVideo' }
  )
  $ids = @{}
  foreach ($p in $named) { $ids[$p.Id] = $p }
  foreach ($p in $byCmd) {
    $live = Get-Process -Id $p.ProcessId -ErrorAction SilentlyContinue
    if ($live) { $ids[$live.Id] = $live }
  }
  return @($ids.Values)
}

if ($ListOnly) {
  $procs = Get-DesktopShellProcesses
  if ($procs.Count -eq 0) {
    Write-Output '[]'
  } else {
    $procs | Select-Object Id, ProcessName, MainWindowHandle, MainWindowTitle | ConvertTo-Json -Compress
  }
  exit 0
}

if (-not $SkipWorker) {
$names = @("autovideo-worker", "uvicorn")
Get-Process | Where-Object {
  $names -contains $_.ProcessName -or $_.Path -like "*P0021-AutoVideo-Studio*uvicorn*"
} | ForEach-Object {
  Write-Host "Stopping PID $($_.Id) $($_.ProcessName)" -ForegroundColor Yellow
  Stop-Process -Id $_.Id -Force
}

foreach ($port in 8021..8026) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object {
      Write-Host "Freeing port $port (PID $_)" -ForegroundColor Yellow
      Stop-Process -Id $_ -Force
    }
}
}

if ($StopElectron) {
  Get-DesktopShellProcesses | ForEach-Object {
    Write-Host "Stopping desktop shell PID $($_.Id) $($_.ProcessName)" -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force
  }
}

Write-Host "Done. Restart AutoVideo Studio (desktop:dev)." -ForegroundColor Green
