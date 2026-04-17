# Database Bootstrap Assets

This folder contains the local database artifacts required to bootstrap AccrediCore on a customer-managed server.

## Included Files

- numbered patch files such as `001_...` through `012_...` for staged recovery and compatibility work
- `merged_supabase_migrations.sql` as a consolidated migration reference
- `phase1_final_schema.sql` and `phase2_final_schema.sql` as milestone snapshots
- `local_full_schema_dump.sql` as the latest schema-only dump exported from the working local database

## Recommended Usage

1. Use the numbered patch files when rebuilding the database step by step.
2. Use `local_full_schema_dump.sql` when you need a single schema snapshot of the current local database structure.
3. Keep environment-specific secrets and data outside this folder.

## Notes

- the dump is schema-only and does not contain application data
- customer-specific seed data and `.env` values should be delivered separately
