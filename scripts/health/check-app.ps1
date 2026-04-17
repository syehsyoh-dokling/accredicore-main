$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

Write-Host "Checking local database connectivity..."
Push-Location (Join-Path $repoRoot "local-api")
try {
  npm run check:env
  npm run check:db
  npm run audit:db
} finally {
  Pop-Location
}
