param(
  [int]$WorkerPort = 8021,
  [switch]$SkipVercelDeploy,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$AppDir = Join-Path $Root "app"
$WorkerDir = Join-Path $Root "worker"
$RuntimeDir = Join-Path $Root ".runtime"
$WorkerLog = Join-Path $RuntimeDir "worker.log"
$WorkerErrorLog = Join-Path $RuntimeDir "worker.err.log"
$TunnelLog = Join-Path $RuntimeDir "cloudflared.log"
$TunnelUrlFile = Join-Path $RuntimeDir "worker-url.txt"

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

function Write-Step([string]$Message) {
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Require-Command([string]$Name, [string]$InstallHint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name is not available. $InstallHint"
  }
}

function Wait-For-Worker([string]$Url) {
  for ($i = 0; $i -lt 60; $i++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -TimeoutSec 2
      if ($response.StatusCode -eq 200) { return }
    } catch {}
    Start-Sleep -Seconds 1
  }
  throw "Worker did not become ready at $Url. Check $WorkerLog"
}

function Wait-For-TunnelUrl {
  $pattern = "https://[-a-zA-Z0-9]+\.trycloudflare\.com"
  for ($i = 0; $i -lt 90; $i++) {
    if (Test-Path $TunnelLog) {
      $content = Get-Content $TunnelLog -Raw -ErrorAction SilentlyContinue
      $match = [regex]::Match($content, $pattern)
      if ($match.Success) { return $match.Value }
    }
    Start-Sleep -Seconds 1
  }
  throw "Cloudflare Tunnel URL was not found. Check $TunnelLog"
}

if (-not $SkipInstall) {
  if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Write-Step "Installing cloudflared with winget"
    Require-Command "winget" "Install winget or install cloudflared manually from Cloudflare."
    winget install --id Cloudflare.cloudflared --accept-package-agreements --accept-source-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
  }
}

Require-Command "python" "Install Python 3.12+."
Require-Command "cloudflared" "Install cloudflared or run this script without SkipInstall."
Require-Command "vercel" "Install and login Vercel CLI."

Write-Step "Preparing worker virtualenv"
if (-not (Test-Path (Join-Path $WorkerDir ".venv"))) {
  python -m venv (Join-Path $WorkerDir ".venv")
}
$PythonExe = Join-Path $WorkerDir ".venv\Scripts\python.exe"
$PipExe = Join-Path $WorkerDir ".venv\Scripts\pip.exe"
& $PipExe install -r (Join-Path $WorkerDir "requirements.txt")

Write-Step "Starting worker on port $WorkerPort"
$existing = Get-NetTCPConnection -LocalPort $WorkerPort -State Listen -ErrorAction SilentlyContinue
if ($existing) {
  Write-Step "Stopping stale worker process on port $WorkerPort"
  $existing | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
    Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 2
}
$workerArgs = @("-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "$WorkerPort")
Start-Process -FilePath $PythonExe -ArgumentList $workerArgs -WorkingDirectory $WorkerDir -RedirectStandardOutput $WorkerLog -RedirectStandardError $WorkerErrorLog -WindowStyle Hidden
Wait-For-Worker "http://127.0.0.1:$WorkerPort/"

Write-Step "Starting Cloudflare Quick Tunnel"
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
if (Test-Path $TunnelLog) { Remove-Item $TunnelLog -Force }
$tunnelArgs = @("tunnel", "--url", "http://127.0.0.1:$WorkerPort", "--logfile", $TunnelLog, "--loglevel", "info")
Start-Process -FilePath "cloudflared" -ArgumentList $tunnelArgs -WorkingDirectory $Root -WindowStyle Hidden
$TunnelUrl = Wait-For-TunnelUrl
$TunnelUrl | Set-Content -Path $TunnelUrlFile -Encoding UTF8
Write-Host "Public worker URL: $TunnelUrl" -ForegroundColor Green

if (-not $SkipVercelDeploy) {
  Write-Step "Updating Vercel NEXT_PUBLIC_WORKER_URL"
  Push-Location $AppDir
  try {
    vercel link --yes --scope "tuanhoangfxs-projects" --project "p0021-autovideo-studio"
    vercel env add NEXT_PUBLIC_WORKER_URL production --value $TunnelUrl --yes --force --no-sensitive
    vercel --prod --yes
  } finally {
    Pop-Location
  }
}

Write-Step "Ready"
Write-Host "Send users the Vercel URL after deploy completes. Keep this machine on." -ForegroundColor Yellow
Write-Host "Worker log: $WorkerLog"
Write-Host "Worker error log: $WorkerErrorLog"
Write-Host "Tunnel log: $TunnelLog"
Write-Host "Press Ctrl+C to stop watching. Close cloudflared/python from Task Manager if needed."

while ($true) {
  Start-Sleep -Seconds 3600
}
