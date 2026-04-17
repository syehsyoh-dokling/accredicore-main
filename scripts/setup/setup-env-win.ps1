$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

$frontendExample = Join-Path $repoRoot "app-source\.env.example"
$frontendTarget = Join-Path $repoRoot "app-source\.env.local"
$apiExample = Join-Path $repoRoot "local-api\.env.example"
$apiTarget = Join-Path $repoRoot "local-api\.env"

if (-not (Test-Path $frontendTarget)) {
  Copy-Item $frontendExample $frontendTarget
  Write-Host "Created $frontendTarget"
} else {
  Write-Host "$frontendTarget already exists"
}

if (-not (Test-Path $apiTarget)) {
  Copy-Item $apiExample $apiTarget
  Write-Host "Created $apiTarget"
} else {
  Write-Host "$apiTarget already exists"
}

Write-Host "Review app-source/.env.local and local-api/.env before running the app."
