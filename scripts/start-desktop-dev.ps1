param(
  [int]$AppPort = 3021,
  [int]$WorkerPort = 8021
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$AppDir = Join-Path $Root "app"
$RuntimeDir = Join-Path $Root ".runtime"
$NextLog = Join-Path $RuntimeDir "desktop-next.log"
$NextErrorLog = Join-Path $RuntimeDir "desktop-next.err.log"
$NextCacheDir = Join-Path $AppDir ".next"

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

function Test-Port([int]$Port) {
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Stop-Port([int]$Port) {
  Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}

function Clear-NextCache {
  if (Test-Path $NextCacheDir) {
    Write-Host "==> Clearing stale Next.js cache" -ForegroundColor Yellow
    Remove-Item -Recurse -Force $NextCacheDir
  }
}

function Wait-For-App([string]$Url) {
  for ($i = 0; $i -lt 90; $i++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -TimeoutSec 2
      if ($response.StatusCode -eq 200) { return }
    } catch {}
    Start-Sleep -Seconds 1
  }
  throw "Next.js app did not become ready at $Url. Check $NextLog"
}

function Test-AppAssets([int]$Port) {
  try {
    $html = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/studio" -TimeoutSec 3
    if ($html.StatusCode -ne 200) { return $false }
    $match = [regex]::Match($html.Content, '/_next/static/[^"''<>\s]+\.css[^"''<>\s]*')
    if (-not $match.Success) { return $true }
    $asset = $match.Value.TrimEnd('\')
    $assetResponse = Invoke-WebRequest -Uri "http://127.0.0.1:$Port$asset" -TimeoutSec 3
    return $assetResponse.StatusCode -eq 200
  } catch {
    return $false
  }
}

if ((Test-Port $AppPort) -and -not (Test-AppAssets $AppPort)) {
  Write-Host "==> Restarting stale Next.js app on port $AppPort" -ForegroundColor Yellow
  Stop-Port $AppPort
  Start-Sleep -Seconds 2
  Clear-NextCache
}

if (-not (Test-Port $AppPort)) {
  Write-Host "==> Starting Next.js app on port $AppPort" -ForegroundColor Cyan
  Start-Process -FilePath "pnpm" -ArgumentList @("dev", "--port", "$AppPort") -WorkingDirectory $AppDir -RedirectStandardOutput $NextLog -RedirectStandardError $NextErrorLog -WindowStyle Hidden
}

Wait-For-App "http://127.0.0.1:$AppPort/studio"

Write-Host "==> Starting AutoVideo Desktop shell" -ForegroundColor Cyan
$env:AUTOVIDEO_APP_URL = "http://127.0.0.1:$AppPort/studio"
$env:AUTOVIDEO_WORKER_PORT = "$WorkerPort"

Push-Location $AppDir
try {
  pnpm desktop
} finally {
  Pop-Location
}
