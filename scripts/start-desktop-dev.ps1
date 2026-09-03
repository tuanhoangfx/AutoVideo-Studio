param(
  [int]$AppPort = 3021,
  [int]$WorkerPort = 8021,
  [switch]$Wait
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$AppDir = Join-Path $Root "app"
$RuntimeDir = Join-Path $Root ".runtime"
$ViteLog = Join-Path $RuntimeDir "desktop-vite.log"
$ViteErrorLog = Join-Path $RuntimeDir "desktop-vite.err.log"

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

function Test-Port([int]$Port) {
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Wait-For-App([string]$Url) {
  for ($i = 0; $i -lt 90; $i++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -TimeoutSec 2
      if ($response.StatusCode -eq 200) { return }
    } catch {}
    Start-Sleep -Seconds 1
  }
  throw "Vite app did not become ready at $Url. Check $ViteLog"
}

if (Test-Port $AppPort) {
  Write-Host "==> Vite already listening on $AppPort — keeping warm (no Stop-Port)" -ForegroundColor Green
} else {
  Write-Host "==> Starting Vite dev server on port $AppPort" -ForegroundColor Cyan
  Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "pnpm dev") -WorkingDirectory $AppDir -RedirectStandardOutput $ViteLog -RedirectStandardError $ViteErrorLog -WindowStyle Hidden
}

Wait-For-App "http://127.0.0.1:$AppPort/studio"

$AuthProbeUrl = "http://127.0.0.1:$AppPort/api/hub/auth/resolve-login"
try {
  $probe = Invoke-WebRequest -Uri $AuthProbeUrl -Method POST -ContentType "application/json" -Body '{"loginId":""}' -TimeoutSec 8
  if ($probe.StatusCode -eq 404) {
    throw "Hub auth API missing (404). Check vite.config.ts hub-auth-dev-api plugin."
  }
  Write-Host "==> Hub auth API OK at $AuthProbeUrl (HTTP $($probe.StatusCode))" -ForegroundColor Green
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 400) {
    Write-Host "==> Hub auth API OK at $AuthProbeUrl (HTTP 400 empty loginId)" -ForegroundColor Green
  } else {
    Write-Host "==> WARN: Hub auth probe failed - $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

Write-Host "==> App $AppPort | Worker $WorkerPort | Auth $AuthProbeUrl" -ForegroundColor Cyan

Write-Host "==> Starting AutoVideo Desktop shell" -ForegroundColor Cyan
$env:AUTOVIDEO_APP_URL = "http://127.0.0.1:$AppPort/studio"
$env:AUTOVIDEO_WORKER_PORT = "$WorkerPort"
if (-not $env:AUTOVIDEO_VIDEO_ENCODER) { $env:AUTOVIDEO_VIDEO_ENCODER = "libx264" }
if (-not $env:AUTOVIDEO_RENDER_WORKERS) { $env:AUTOVIDEO_RENDER_WORKERS = '1' }

Push-Location $AppDir
try {
  if ($Wait) {
    pnpm desktop
  } else {
    $launcher = Start-Process -FilePath "pnpm" -ArgumentList @("desktop") -WorkingDirectory $AppDir -PassThru -WindowStyle Normal
    Write-Host "==> Desktop shell launched (pid=$($launcher.Id), detached)" -ForegroundColor Green
  }
} finally {
  Pop-Location
}
