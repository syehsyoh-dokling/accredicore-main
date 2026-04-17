-- Phase 2 stub for missing auth.uid()
-- Temporary compatibility function for local baseline

CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $function$
  SELECT '00000000-0000-0000-0000-000000000000'::uuid;
$function$;