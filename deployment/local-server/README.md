# Local Server Deployment Notes

## Goal

This folder documents how the AccrediCore package is expected to be delivered for customer-managed local servers.

## Repository Contents Expected By Customer

The customer clone should already include:

- `app-source/`
- `local-api/`
- `database/bootstrap/`
- `scripts/`
- `docs/`
- `config/`

## Delivered Separately

These values are intentionally not stored in Git and must be delivered through a separate secure channel:

- frontend `.env` values
- backend `.env` values
- customer-specific hostnames, ports, and credentials

## Minimum Local Installation Flow

1. Clone the repository.
2. Place the provided environment files in the expected locations.
3. Run the platform setup script from `scripts/setup/`.
4. Apply the required database bootstrap SQL from `database/bootstrap/`.
5. Start the local services using `scripts/start/`.
6. Validate the deployment using `scripts/health/` and the manual test guide in `docs/local-install/`.

## Recommended Validation

- run the DB contract audit in `local-api`
- verify frontend login page loads
- verify Supabase local endpoints respond
- verify manual smoke test accounts and flows from `docs/local-install/MANUAL-TEST-GUIDE.md`
