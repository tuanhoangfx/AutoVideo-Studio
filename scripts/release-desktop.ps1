param(
  [string]$Version = "",
  [ValidateSet("", "patch", "minor", "major")]
  [string]$Bump = "",
  [switch]$Publish,
  [switch]$Fast,
  [switch]$SkipInstall,
  [switch]$SkipUiBuild,
  [Alias("SkipNextBuild")]
  [switch]$SkipNextBuild,
  [switch]$SkipWorker
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$AppDir = Join-Path $RepoRoot "app"
$DevRoot = if ($env:DEV_ROOT) { $env:DEV_ROOT } else { (Resolve-Path (Join-Path $RepoRoot "..\..")).Path }
$RunPnpm = Join-Path $DevRoot "Tool\scripts\run-pnpm.mjs"
$RunPnpmExec = Join-Path $DevRoot "Tool\scripts\run-pnpm-exec.mjs"
$GenLatestYml = Join-Path $DevRoot "Tool\scripts\gen-desktop-latest-yml.mjs"

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
      & node $RunPnpm install --frozen-lockfile
      if ($LASTEXITCODE -ne 0) { throw "pnpm install failed" }
    }
  }

  if ($Version.Trim()) {
    Invoke-Step "Set desktop version to $Version" {
      & node $RunPnpm version $Version --no-git-tag-version
      if ($LASTEXITCODE -ne 0) { throw "pnpm version failed" }
    }
  }

  if ($Bump.Trim()) {
    Invoke-Step "Bump desktop version ($Bump)" {
      & node $RunPnpm version $Bump --no-git-tag-version
      if ($LASTEXITCODE -ne 0) { throw "pnpm version bump failed" }
    }
  }

  if ($Fast) {
    $env:DESKTOP_RELEASE_SIGN = if ($env:DESKTOP_RELEASE_SIGN) { $env:DESKTOP_RELEASE_SIGN } else { "0" }
    if ($SkipWorker) { $env:DESKTOP_FORCE_WORKER = "0" }
    $skipUi = $SkipUiBuild -or $SkipNextBuild
    if ($skipUi) { $env:DESKTOP_FORCE_UI = "0"; $env:DESKTOP_FORCE_NEXT = "0" }
    Invoke-Step "Fast desktop pack (worker fingerprint + dir/nsis)" {
      $fastArgs = @((Join-Path $RepoRoot "scripts\run-desktop-dist-fast.mjs"))
      if (-not $skipUi) { $fastArgs += "--rebuild-ui" }
      if ($SkipWorker) { $fastArgs += "--skip-worker" }
      if ($env:DESKTOP_FORCE_WORKER -eq "1") { $fastArgs += "--force-worker" }
      if ($Publish) { $fastArgs += "--nsis" }
      & node @fastArgs
      if ($LASTEXITCODE -ne 0) { throw "desktop:dist:fast failed" }
    }
  } else {
    Invoke-Step "Build Vite desktop UI" {
      $prepareArgs = @("-ExecutionPolicy", "Bypass", "-File", (Join-Path $RepoRoot "scripts\prepare-desktop-build.ps1"))
      if ($SkipUiBuild -or $SkipNextBuild) { $prepareArgs += "-SkipUiBuild" }
      & powershell -NoProfile @prepareArgs
      if ($LASTEXITCODE -ne 0) { throw "desktop:prepare failed" }
    }

    if (-not $SkipWorker) {
      Invoke-Step "Build bundled worker executable" {
        & node $RunPnpm run desktop:worker
        if ($LASTEXITCODE -ne 0) { throw "desktop:worker failed" }
      }

      Invoke-Step "Worker smoke test (libx264)" {
        & (Join-Path $RepoRoot "scripts\test-worker-smoke.ps1")
      }
    } else {
      Write-Host "==> skip worker rebuild (SkipWorker)" -ForegroundColor Yellow
    }

    $pkg = Get-Content -LiteralPath (Join-Path $AppDir "package.json") -Raw | ConvertFrom-Json
    $ver = [string]$pkg.version
    $existingSetup = Join-Path $AppDir "dist-desktop\AutoVideo Studio Setup $ver.exe"

    if (Test-Path -LiteralPath $existingSetup) {
      Write-Host "==> reuse existing installer v$ver (SkipInstallerBuild)" -ForegroundColor Yellow
    } else {
      $PublishMode = "never"
      Invoke-Step "Build Windows installer (publish: $PublishMode)" {
        & node $RunPnpmExec electron-builder --win nsis --x64 --publish $PublishMode
        if ($LASTEXITCODE -ne 0) { throw "electron-builder failed ($LASTEXITCODE)" }
      }
    }
  }

  if ($Publish) {
    Invoke-Step "Publish installer to GitHub Releases" {
      & node $GenLatestYml --product-root $RepoRoot
      if ($LASTEXITCODE -ne 0) { throw "gen-desktop-latest-yml failed" }

      $pkg = Get-Content -LiteralPath (Join-Path $AppDir "package.json") -Raw | ConvertFrom-Json
      $ver = [string]$pkg.version
      $tag = "v$ver"
      $dist = Join-Path $AppDir "dist-desktop"
      $repo = "tuanhoangfx/AutoVideo-Studio"
      $ymlPath = Join-Path $dist "latest.yml"
      $ymlText = Get-Content -LiteralPath $ymlPath -Raw
      if ($ymlText -match '(?m)^path:\s*(.+)$') {
        $publishName = $Matches[1].Trim()
      } else {
        throw "latest.yml missing path field"
      }

      $localSetup = Join-Path $dist "AutoVideo Studio Setup $ver.exe"
      $publishSetup = Join-Path $dist $publishName
      $localBlockmap = Join-Path $dist "AutoVideo Studio Setup $ver.exe.blockmap"
      $publishBlockmap = "$publishSetup.blockmap"

      if (-not (Test-Path -LiteralPath $localSetup)) {
        throw "Installer not found: $localSetup"
      }
      Copy-Item -LiteralPath $localSetup -Destination $publishSetup -Force
      if (Test-Path -LiteralPath $localBlockmap) {
        Copy-Item -LiteralPath $localBlockmap -Destination $publishBlockmap -Force
      }

      $releaseExists = $false
      $prevEa = $ErrorActionPreference
      $ErrorActionPreference = "Continue"
      & gh release view $tag --repo $repo *> $null
      if ($LASTEXITCODE -eq 0) { $releaseExists = $true }
      $ErrorActionPreference = $prevEa

      if (-not $releaseExists) {
        $createArgs = @("release", "create", $tag, $publishSetup, "--repo", $repo, "--title", "AutoVideo Studio $ver", "--notes", "Desktop release $ver")
        if (Test-Path -LiteralPath $publishBlockmap) { $createArgs = @("release", "create", $tag, $publishSetup, $publishBlockmap, "--repo", $repo, "--title", "AutoVideo Studio $ver", "--notes", "Desktop release $ver") }
        & gh @createArgs
        if ($LASTEXITCODE -ne 0) { throw "gh release create failed" }
      } else {
        $uploadArgs = @("release", "upload", $tag, $publishSetup, "--repo", $repo, "--clobber")
        if (Test-Path -LiteralPath $publishBlockmap) { $uploadArgs = @("release", "upload", $tag, $publishSetup, $publishBlockmap, "--repo", $repo, "--clobber") }
        & gh @uploadArgs
        if ($LASTEXITCODE -ne 0) { throw "gh release upload failed" }
      }

      & gh release upload $tag $ymlPath --repo $repo --clobber
      if ($LASTEXITCODE -ne 0) { throw "gh release upload latest.yml failed" }
    }
  }
}
finally {
  Pop-Location
}
