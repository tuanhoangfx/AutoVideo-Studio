param(
  [string]$Version = "",
  [ValidateSet("", "patch", "minor", "major")]
  [string]$Bump = "",
  [switch]$Publish,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$AppDir = Join-Path $RepoRoot "app"

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  Write-Host ""
  Write-Host "==> $Name" -ForegroundColor Cyan
  & $Action
}

if ($Publish -and -not $env:GH_TOKEN -and -not $env:GITHUB_TOKEN) {
  throw "Publishing to GitHub Releases requires GH_TOKEN or GITHUB_TOKEN in the current shell."
}

if ($Version.Trim() -and $Bump.Trim()) {
  throw "Use either -Version or -Bump, not both."
}

Push-Location $AppDir
try {
  if (-not $SkipInstall) {
    Invoke-Step "Install locked dependencies" {
      pnpm install --frozen-lockfile
    }
  }

  if ($Version.Trim()) {
    Invoke-Step "Set desktop version to $Version" {
      pnpm version $Version --no-git-tag-version
    }
  }

  if ($Bump.Trim()) {
    Invoke-Step "Bump desktop version ($Bump)" {
      pnpm version $Bump --no-git-tag-version
    }
  }

  Invoke-Step "Build bundled worker executable" {
    pnpm desktop:worker
  }

  Invoke-Step "Worker smoke test (libx264)" {
    & (Join-Path $RepoRoot "scripts\test-worker-smoke.ps1")
  }

  Invoke-Step "Build Next.js standalone app" {
    pnpm desktop:prepare
  }

  $PublishMode = if ($Publish) { "always" } else { "never" }
  Invoke-Step "Build Windows installer (publish: $PublishMode)" {
    pnpm exec electron-builder --win nsis --x64 --publish $PublishMode
  }
}
finally {
  Pop-Location
}
