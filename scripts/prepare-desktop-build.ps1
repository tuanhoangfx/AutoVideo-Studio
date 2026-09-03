param(
  [switch]$SkipUiBuild
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$AppDir = Join-Path $Root "app"
$DistDir = Join-Path $AppDir "dist"
$DevRoot = if ($env:DEV_ROOT) { $env:DEV_ROOT } else { (Resolve-Path (Join-Path $Root "..\..")).Path }
$RunPnpm = Join-Path $DevRoot "Tool\scripts\run-pnpm.mjs"

function Write-Step([string]$Message) {
  Write-Host "==> $Message" -ForegroundColor Cyan
}

Push-Location $AppDir
try {
  if (-not $SkipUiBuild) {
    Write-Step "Building Vite UI (desktop bundle)"
    $env:AUTOVIDEO_DESKTOP_BUILD = "1"
    & node (Join-Path $AppDir "scripts\build.mjs") --desktop
    if ($LASTEXITCODE -ne 0) { throw "vite desktop build failed (exit $LASTEXITCODE)" }
    Remove-Item Env:AUTOVIDEO_DESKTOP_BUILD -ErrorAction SilentlyContinue
  }

  if (-not (Test-Path (Join-Path $DistDir "index.html"))) {
    throw "Vite dist missing at $DistDir. Check scripts/build.mjs output."
  }

  $indexHtml = Get-Content (Join-Path $DistDir "index.html") -Raw
  if ($indexHtml -match 'src="/assets/') {
    throw "Desktop build produced absolute /assets/ URLs; file protocol would black-screen."
  }
} finally {
  Pop-Location
}

Write-Step "Desktop build assets are ready"
