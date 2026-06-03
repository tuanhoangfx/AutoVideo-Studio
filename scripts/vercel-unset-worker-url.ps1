# Remove NEXT_PUBLIC_WORKER_URL from Vercel (P0021 — local/desktop render only).
# Requires: vercel CLI logged in (vercel whoami)
param(
  [string]$Project = "p0021-autovideo-studio",
  [switch]$DryRun
)

$envs = @("production", "preview", "development")
$key = "NEXT_PUBLIC_WORKER_URL"

Write-Host "Project: $Project"
Write-Host "Unset: $key"

foreach ($env in $envs) {
  if ($DryRun) {
    Write-Host "[dry-run] vercel env rm $key $env --yes (cwd: app/)"
    continue
  }
  Push-Location (Join-Path $PSScriptRoot "..\app")
  try {
    vercel env rm $key $env --yes 2>&1 | ForEach-Object { Write-Host $_ }
  } catch {
    Write-Warning "$env : $_"
  } finally {
    Pop-Location
  }
}

Write-Host "Done. Redeploy production if UI still shows old worker URL."
