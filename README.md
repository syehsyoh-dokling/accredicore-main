# AccrediCore Main

Main application repository for AccrediCore.

This repository is prepared as a distributable local-deployment package for hospital customers who may run the system on local servers, private networks, or offline environments.

`.env` files are intentionally excluded from Git and are delivered separately.

## Structure

- `app-source/` - frontend application, Supabase config, edge functions, and app scripts
- `local-api/` - lightweight local Express API for health checks and local PostgreSQL access
- `database/` - bootstrap SQL, migration bundles, and audit artifacts for local database setup
- `deployment/` - deployment notes for local server, Windows, Linux, macOS, and container targets
- `scripts/` - bootstrap, setup, start, health, diagnostics, backup, and update scripts
- `config/` - runtime and environment templates, including example env files
- `docs/` - installation runbooks, local setup, and manual test guides
- `installer-support/` - installer validation and environment precheck support
- `manifests/` - packaging and release metadata
- `assets/` - branding, icons, and supporting visual assets
- `tests/` - smoke, integration, installer-precheck, and UAT test folders

## Local Delivery Checklist

The repository should contain everything needed for a customer-side local setup except:

- actual `.env` values
- machine-specific caches
- generated build output
- local `node_modules`

Use these entry points when preparing a customer deployment:

- setup guide: `docs/local-install/README.md`
- local server packaging notes: `deployment/local-server/README.md`
- manual validation guide: `docs/local-install/MANUAL-TEST-GUIDE.md`
