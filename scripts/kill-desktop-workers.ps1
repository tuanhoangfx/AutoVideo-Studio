# Stop stale AutoVideo worker processes (python uvicorn / autovideo-worker.exe on 8021-8025).
$ErrorActionPreference = "SilentlyContinue"
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
Write-Host "Done. Restart AutoVideo Studio (desktop:dev)." -ForegroundColor Green
