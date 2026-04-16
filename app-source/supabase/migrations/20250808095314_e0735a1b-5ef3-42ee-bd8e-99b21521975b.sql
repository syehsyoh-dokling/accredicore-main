-- PHASE 1: Critical Database Security Fixes

-- 1. Remove unused tables that have no RLS policies
DROP TABLE IF EXISTS "Team Members Table" CASCADE;
DROP TABLE IF EXISTS "Team Table" CASCADE;

-- 2. Fix database functions - Add proper search_path security
CREATE OR REPLACE FUNCTION public.get_page_translation(p_page_key text, p_language user_language DEFAULT 'en'::user_language)
RETURNS TABLE(title text, content text, metadata jsonb)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY 
    SELECT 
        pt.title, 
        pt.content, 
        pt.metadata
    FROM public.page_translations pt
    WHERE pt.page_key = p_page_key 
    AND pt.language = p_language;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_access_attempt(p_user_id uuid, p_table_name text, p_operation text, p_access_result text, p_additional_context jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_user_email text;
    v_user_role app_role;
BEGIN
    -- Fetch user details
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = p_user_id;

    SELECT role INTO v_user_role 
    FROM public.profiles 
    WHERE user_id = p_user_id;

    -- Insert audit log
    INSERT INTO public.access_audit_logs (
        user_id, 
        user_email, 
        user_role, 
        table_name, 
        operation, 
        access_result, 
        additional_context
    ) VALUES (
        p_user_id,
        v_user_email,
        v_user_role,
        p_table_name,
        p_operation,
        p_access_result,
        p_additional_context
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_totp_secret()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN encode(gen_random_bytes(20), 'base32');
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_backup_codes(p_user_id uuid)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    backup_codes text[];
BEGIN
    -- Generate 5 unique backup codes
    backup_codes := ARRAY(
        SELECT encode(gen_random_bytes(12), 'hex')
        FROM generate_series(1, 5)
    );

    -- Store backup codes (hashed)
    UPDATE public.mfa_configurations
    SET backup_codes = array(
        SELECT crypt(code, gen_salt('bf'))
        FROM unnest(backup_codes) AS code
    )
    WHERE user_id = p_user_id;

    RETURN backup_codes;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_mfa_token(p_user_id uuid, p_token text, p_method text DEFAULT 'totp'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    mfa_config record;
    is_valid boolean := false;
BEGIN
    -- Fetch MFA configuration
    SELECT * INTO mfa_config
    FROM public.mfa_configurations
    WHERE user_id = p_user_id AND is_mfa_enabled = true;

    -- Check if MFA is enabled
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Method-specific verification
    CASE p_method
        WHEN 'totp' THEN
            -- Use a hypothetical TOTP verification (would typically use an external library)
            is_valid := (
                p_token = public.generate_totp_code(mfa_config.totp_secret) OR
                p_token = ANY(
                    -- Check backup codes (one-time use)
                    SELECT code 
                    FROM unnest(mfa_config.backup_codes) AS code 
                    WHERE crypt(p_token, code) = code
                )
            );

            -- If backup code used, remove it
            IF is_valid AND p_token = ANY(mfa_config.backup_codes) THEN
                UPDATE public.mfa_configurations
                SET backup_codes = array_remove(backup_codes, p_token)
                WHERE user_id = p_user_id;
            END IF;

        WHEN 'sms' THEN
            -- Placeholder for SMS verification logic
            is_valid := false;

        WHEN 'email' THEN
            -- Placeholder for email verification logic
            is_valid := false;

        ELSE
            is_valid := false;
    END CASE;

    -- Update MFA attempt tracking
    IF is_valid THEN
        UPDATE public.mfa_configurations
        SET 
            failed_attempts = 0,
            last_mfa_challenge_time = NOW(),
            lockout_until = NULL
        WHERE user_id = p_user_id;
    ELSE
        UPDATE public.mfa_configurations
        SET 
            failed_attempts = failed_attempts + 1,
            lockout_until = CASE 
                WHEN failed_attempts >= 5 THEN NOW() + INTERVAL '15 minutes'
                ELSE lockout_until 
            END
        WHERE user_id = p_user_id;
    END IF;

    RETURN is_valid;
END;
$function$;

-- 3. Fix inconsistent has_role function - keep only the secure version
DROP FUNCTION IF EXISTS public.has_role(user_id bigint, role_name text);
DROP FUNCTION IF EXISTS public.has_role();

-- Ensure the secure has_role function is properly defined
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- 4. Secure other functions
CREATE OR REPLACE FUNCTION public.generate_access_token(p_user_id uuid, p_duration interval DEFAULT '01:00:00'::interval, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    new_token text;
    token_hash text;
BEGIN
    -- Generate a cryptographically secure token
    new_token := encode(gen_random_bytes(32), 'hex');
    token_hash := crypt(new_token, gen_salt('bf'));

    -- Invalidate previous active tokens for this user
    UPDATE public.access_tokens
    SET is_active = false
    WHERE user_id = p_user_id AND is_active = true;

    -- Insert new token
    INSERT INTO public.access_tokens (
        user_id, 
        token_hash, 
        expires_at, 
        ip_address, 
        user_agent
    ) VALUES (
        p_user_id,
        token_hash,
        NOW() + p_duration,
        p_ip_address,
        p_user_agent
    );

    RETURN new_token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_access_token(p_token text, p_ip_address inet DEFAULT NULL::inet)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    matching_token record;
BEGIN
    -- Find and validate the token
    SELECT 
        user_id, 
        expires_at, 
        is_active,
        ip_address
    INTO matching_token
    FROM public.access_tokens
    WHERE 
        token_hash = crypt(p_token, token_hash) AND
        is_active = true AND
        expires_at > NOW();

    -- Check token validity
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired token';
    END IF;

    -- Optional IP address validation
    IF p_ip_address IS NOT NULL AND matching_token.ip_address IS NOT NULL 
       AND p_ip_address != matching_token.ip_address THEN
        RAISE EXCEPTION 'Token IP mismatch';
    END IF;

    -- Update last used timestamp
    UPDATE public.access_tokens
    SET last_used_at = NOW()
    WHERE token_hash = crypt(p_token, token_hash);

    RETURN matching_token.user_id;
END;
$function$;