-- Phase 2 stub for missing generate_totp_code
-- Temporary compatibility function for local baseline

CREATE OR REPLACE FUNCTION public.generate_totp_code(p_secret text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Temporary stub only.
  -- Real TOTP implementation should replace this later.
  RETURN '';
END;
$function$;