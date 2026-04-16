-- Fix 1: Restrict profiles table access (profiles_public_read)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_user'::app_role) OR 
  public.has_role(auth.uid(), 'system_admin'::app_role)
);

-- Fix 2: Add authorization checks to MFA and token functions (security_definer_funcs)

-- Fix generate_backup_codes - only allow users to manage their own MFA
CREATE OR REPLACE FUNCTION public.generate_backup_codes(p_user_id uuid)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    backup_codes text[];
BEGIN
    -- SECURITY CHECK: Only allow users to manage their own MFA
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Cannot manage MFA for other users';
    END IF;
    
    -- Generate 5 unique backup codes
    backup_codes := ARRAY(
        SELECT encode(public.gen_random_bytes(12), 'hex')
        FROM generate_series(1, 5)
    );

    -- Store backup codes (hashed)
    UPDATE public.mfa_configurations
    SET backup_codes = array(
        SELECT public.crypt(code, public.gen_salt('bf'))
        FROM unnest(backup_codes) AS code
    )
    WHERE user_id = p_user_id;

    RETURN backup_codes;
END;
$function$;

-- Fix verify_mfa_token - only allow users to verify their own MFA
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
    -- SECURITY CHECK: Only allow users to verify their own MFA
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Cannot verify MFA for other users';
    END IF;
    
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
            -- Use a hypothetical TOTP verification
            is_valid := (
                p_token = public.generate_totp_code(mfa_config.totp_secret) OR
                p_token = ANY(
                    SELECT code 
                    FROM unnest(mfa_config.backup_codes) AS code 
                    WHERE public.crypt(p_token, code) = code
                )
            );

            -- If backup code used, remove it
            IF is_valid AND p_token = ANY(mfa_config.backup_codes) THEN
                UPDATE public.mfa_configurations
                SET backup_codes = array_remove(backup_codes, p_token)
                WHERE user_id = p_user_id;
            END IF;

        WHEN 'sms' THEN
            is_valid := false;

        WHEN 'email' THEN
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

-- Fix generate_access_token - only allow for own user or system admins
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
    -- SECURITY CHECK: Only allow for own user or system admins
    IF p_user_id != auth.uid() AND NOT (
        SELECT EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('system_admin'::public.app_role, 'super_user'::public.app_role)
        )
    ) THEN
        RAISE EXCEPTION 'Cannot generate tokens for other users';
    END IF;

    -- Generate a cryptographically secure token
    new_token := encode(public.gen_random_bytes(32), 'hex');
    token_hash := public.crypt(new_token, public.gen_salt('bf'));

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