# Worker smoke test (CPU encoder for CI / machines without stable NVENC).
$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$WorkerDir = Join-Path $RepoRoot "worker"
$Python = Join-Path $WorkerDir ".venv\Scripts\python.exe"
if (-not (Test-Path $Python)) {
  throw "Worker venv not found. Run: cd worker; python -m venv .venv; .venv\Scripts\pip install -r requirements.txt"
}

$env:AUTOVIDEO_VIDEO_ENCODER = "libx264"
$env:PYTHONIOENCODING = "utf-8"

Push-Location $WorkerDir
try {
  & $Python scripts\smoke_e2e.py
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "Worker smoke OK" -ForegroundColor Green
}
finally {
  Pop-Location
}
