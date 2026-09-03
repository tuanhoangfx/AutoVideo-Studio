param(
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$WorkerDir = Join-Path $Root "worker"
$VenvDir = Join-Path $WorkerDir ".venv"
$PythonExe = Join-Path $VenvDir "Scripts\python.exe"
$PipExe = Join-Path $VenvDir "Scripts\pip.exe"
$IconPath = Join-Path $Root "app\build\icon.ico"

function Write-Step([string]$Message) {
  Write-Host "==> $Message" -ForegroundColor Cyan
}

if (-not (Test-Path $PythonExe)) {
  Write-Step "Creating worker virtualenv"
  python -m venv $VenvDir
}

if (-not $SkipInstall) {
  Write-Step "Installing worker dependencies"
  & $PipExe install -r (Join-Path $WorkerDir "requirements.txt")
  & $PipExe install pyinstaller
}

Write-Step "Building desktop worker exe"
Push-Location $WorkerDir
try {
  & $PythonExe -m PyInstaller `
    --name autovideo-worker `
    --onedir `
    --clean `
    --noconfirm `
    --icon $IconPath `
    --paths $WorkerDir `
    --paths (Join-Path $Root "..\..\packages\video-pipeline-core\src") `
    --hidden-import video_pipeline_core `
    --hidden-import uvicorn.logging `
    --hidden-import uvicorn.loops.auto `
    --hidden-import uvicorn.protocols.http.auto `
    --hidden-import uvicorn.protocols.websockets.auto `
    --hidden-import uvicorn.lifespan.on `
    --hidden-import httptools `
    --hidden-import watchfiles `
    --hidden-import websockets `
    --collect-all imageio_ffmpeg `
    --collect-all edge_tts `
    --collect-all gtts `
    --collect-all google.generativeai `
    desktop_worker.py
} finally {
  Pop-Location
}

$Exe = Join-Path $WorkerDir "dist\autovideo-worker\autovideo-worker.exe"
if (-not (Test-Path $Exe)) {
  throw "Worker exe was not created at $Exe"
}

Write-Host "Worker exe ready: $Exe" -ForegroundColor Green

$FingerprintScript = Join-Path $PSScriptRoot "worker-fingerprint.mjs"
if (Test-Path -LiteralPath $FingerprintScript) {
  & node $FingerprintScript --write
  if ($LASTEXITCODE -ne 0) { throw "worker-fingerprint --write failed" }
}
