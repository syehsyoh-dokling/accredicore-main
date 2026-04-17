$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$frontendRoot = Join-Path $repoRoot "app-source"

Write-Host "Ensuring local Supabase stack is running..."
Push-Location $frontendRoot
try {
  npx supabase start | Out-Host
} finally {
  Pop-Location
}

Write-Host "Starting local edge functions in a new PowerShell window..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendRoot'; npx supabase functions serve"

Write-Host "Starting frontend in a new PowerShell window..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendRoot'; npm run dev -- --host 127.0.0.1 --port 4173"

Write-Host "Frontend expected at http://127.0.0.1:4173"
Write-Host "Login page expected at http://127.0.0.1:4173/auth"
Write-Host "Supabase API expected at http://127.0.0.1:54321"
Write-Host "Supabase Studio expected at http://127.0.0.1:54323"
