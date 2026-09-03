param(
  [int]$WaitSeconds = 60,
  [switch]$KeepRunning
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$App = Join-Path $Root "app"
$Runtime = Join-Path $Root ".runtime"
$KillScript = Join-Path $Root "scripts\kill-desktop-workers.ps1"
New-Item -ItemType Directory -Force -Path $Runtime | Out-Null
$BootLog = Join-Path $Runtime "electron-boot.log"
Remove-Item $BootLog -ErrorAction SilentlyContinue

& $KillScript -StopElectron | Out-Null
Start-Sleep -Seconds 1

$env:AUTOVIDEO_APP_URL = "http://127.0.0.1:3021/studio"
$proc = Start-Process `
  -FilePath "node" `
  -ArgumentList "node_modules/electron/cli.js", "electron/main.cjs" `
  -WorkingDirectory $App `
  -PassThru

Start-Sleep -Seconds $WaitSeconds

$stdout = @()
if (Test-Path $BootLog) { $stdout = Get-Content $BootLog }
Write-Output "--- BOOT LOG ---"
$stdout

$listRaw = & $KillScript -ListOnly
$visible = $false
if ($listRaw) {
  try {
    $parsed = $listRaw | ConvertFrom-Json
    $rows = @($parsed)
    $visible = [bool]($rows | Where-Object { [int]$_.MainWindowHandle -gt 0 })
  } catch {
    $visible = $false
  }
}

if (-not $KeepRunning) {
  & $KillScript -StopElectron | Out-Null
  if (-not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
  }
}

$bootLine = $stdout | Where-Object { $_ -match '\[P0021\] renderer boot=' } | Select-Object -Last 1
if (-not $bootLine) {
  Write-Error "probe-electron-boot: missing renderer boot line (visible=$visible)"
  exit 1
}
if ($bootLine -notmatch 'rootChildren=([1-9]\d*)') {
  Write-Error ("probe-electron-boot: root empty or not mounted -- " + $bootLine)
  exit 1
}
if ($bootLine -match 'crash=yes' -or $bootLine -match 'boundary=yes') {
  Write-Error ("probe-electron-boot: crash overlay or lazy-screen boundary -- " + $bootLine)
  exit 1
}
$errToken = ''
if ($bootLine -match ' err=(.*) crash=') {
  $errToken = $Matches[1].Trim()
}
if ($errToken -ne '') {
  Write-Error ("probe-electron-boot: renderer error -- " + $errToken)
  exit 1
}
Write-Output ('probe-electron-boot: OK (' + $bootLine + ' visible=' + $visible + ')')
