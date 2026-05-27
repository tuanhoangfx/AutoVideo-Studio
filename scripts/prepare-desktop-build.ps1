param(
  [switch]$SkipNextBuild
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$AppDir = Join-Path $Root "app"
$StandaloneDir = Join-Path $AppDir ".next\standalone"
$StaticSource = Join-Path $AppDir ".next\static"
$StaticTarget = Join-Path $StandaloneDir ".next\static"
$PublicSource = Join-Path $AppDir "public"
$PublicTarget = Join-Path $StandaloneDir "public"

function Write-Step([string]$Message) {
  Write-Host "==> $Message" -ForegroundColor Cyan
}

Push-Location $AppDir
try {
  if (-not $SkipNextBuild) {
    Write-Step "Building Next.js standalone app"
    pnpm build
  }

  if (-not (Test-Path $StandaloneDir)) {
    throw "Next standalone output not found at $StandaloneDir. Check next.config.mjs output='standalone'."
  }

  Write-Step "Copying Next static assets into standalone bundle"
  New-Item -ItemType Directory -Force -Path $StaticTarget | Out-Null
  Copy-Item -Path (Join-Path $StaticSource "*") -Destination $StaticTarget -Recurse -Force

  if (Test-Path $PublicSource) {
    Write-Step "Copying public assets into standalone bundle"
    New-Item -ItemType Directory -Force -Path $PublicTarget | Out-Null
    Copy-Item -Path (Join-Path $PublicSource "*") -Destination $PublicTarget -Recurse -Force
  }
} finally {
  Pop-Location
}

Write-Step "Desktop build assets are ready"
