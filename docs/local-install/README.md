# Local Deployment Runbook

## Delivery Intent

This repository is intended to be cloned by customer IT teams and run on their own local infrastructure.

The Git package should include:

- frontend source in `app-source`
- local API source in `local-api`
- SQL bootstrap files in `database/bootstrap`
- setup/start/health scripts in `scripts`
- installation and test documentation in `docs`

The Git package should not include:

- real `.env` files
- local caches or temp folders
- `node_modules`
- generated build artifacts

## Backend Shape

This local package uses two complementary backend layers:

- `app-source` uses Supabase for auth, tables, RPC functions, storage, and edge functions
- `local-api` provides a lightweight local Express API for health checks and selected local PostgreSQL endpoints

For the supported local flow, the frontend is configured through environment variables and can point to a local Supabase stack.

## Ready For Customer Local Setup

- frontend can be installed and started locally
- local Supabase-compatible database bootstrap files are included
- `local-api` source and DB audit scripts are included
- Windows setup/start/health scripts are included
- manual smoke/UAT guide is included

## Windows Setup

1. Run `powershell -ExecutionPolicy Bypass -File scripts/setup/setup-env-win.ps1`
2. Review:
   - `app-source/.env.local`
   - `local-api/.env`
3. Install frontend dependencies:
   - `cd app-source`
   - `npm install`
4. Install local API dependencies if needed:
   - `cd ../local-api`
   - `npm install`

## Validation Commands

- Apply the local frontend contract patch when you need to rebuild local PostgreSQL:
  - `& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h localhost -p 5432 -U postgres -d accredicore -f database/bootstrap/008_phase3_frontend_contract_patch.sql`
- DB env check:
  - `cd local-api`
  - `npm run check:env`
- DB connectivity:
  - `npm run check:db`
- DB contract audit:
  - `npm run audit:db`
- Combined health check:
  - `powershell -ExecutionPolicy Bypass -File scripts/health/check-app.ps1`

## Start Local Services

- `powershell -ExecutionPolicy Bypass -File scripts/start/start-win.ps1`

Expected endpoints:

- Frontend: `http://127.0.0.1:4173`
- Local API health: `http://localhost:3001/api/health`

## Packaging Notes

Before shipping this repository to a customer, confirm:

1. `.env` files are delivered separately
2. `docs/local-install/MANUAL-TEST-GUIDE.md` matches the seeded roles and test flow
3. `database/bootstrap` contains the latest contract and authorization patches
4. no temp folders or machine-local dependency folders are committed
