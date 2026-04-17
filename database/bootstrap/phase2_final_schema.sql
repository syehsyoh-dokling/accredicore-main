--
-- PostgreSQL database dump
--

\restrict 35FefpYtQ9a2fCGFrz2cyl2bqTl3UcAR2k1oBLWXV0vKN5pYLgRbPQEohKwLnTc

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'system_admin',
    'super_user',
    'admin',
    'user'
);


--
-- Name: app_role_extended; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role_extended AS ENUM (
    'system_admin',
    'super_user',
    'admin',
    'user',
    'team',
    'client'
);


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  SELECT '00000000-0000-0000-0000-000000000000'::uuid;
$$;


--
-- Name: generate_access_token(uuid, interval, inet, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_access_token(p_user_id uuid, p_duration interval DEFAULT '01:00:00'::interval, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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
$$;


--
-- Name: generate_backup_codes(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_backup_codes(p_user_id uuid) RETURNS text[]
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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
$$;


--
-- Name: generate_totp_code(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_totp_code(p_secret text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  -- Temporary stub only.
  -- Real TOTP implementation should replace this later.
  RETURN '';
END;
$$;


--
-- Name: generate_totp_secret(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_totp_secret() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
    RETURN encode(public.gen_random_bytes(20), 'base32');
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
    );
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;


--
-- Name: notify_task_assignment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_task_assignment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Notify when task is assigned to a user
    IF TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL THEN
        -- We'll handle notifications through the frontend for now
        -- since we don't have a notifications table yet
        NULL;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: notify_task_comment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_task_comment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    task_record RECORD;
BEGIN
    -- Get task details
    SELECT * INTO task_record FROM public.tasks WHERE id = NEW.task_id;
    
    -- Notify task assignee if different from commenter
    IF task_record.assigned_to IS NOT NULL AND task_record.assigned_to != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, title, message, type, related_task_id)
        VALUES (
            task_record.assigned_to,
            'New Comment on Task',
            'A comment was added to task: ' || task_record.title,
            'comment_added',
            NEW.task_id
        );
    END IF;
    
    -- Notify task creator if different from commenter and assignee
    IF task_record.assigned_by != NEW.user_id AND task_record.assigned_by != task_record.assigned_to THEN
        INSERT INTO public.notifications (user_id, title, message, type, related_task_id)
        VALUES (
            task_record.assigned_by,
            'New Comment on Task',
            'A comment was added to task: ' || task_record.title,
            'comment_added',
            NEW.task_id
        );
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: update_audit_schedules_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_audit_schedules_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_documents_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_documents_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_last_login(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_last_login() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.profiles 
    SET last_login = now() 
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: validate_access_token(text, inet); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_access_token(p_token text, p_ip_address inet DEFAULT NULL::inet) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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
        token_hash = public.crypt(p_token, token_hash) AND
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
    WHERE token_hash = public.crypt(p_token, token_hash);

    RETURN matching_token.user_id;
END;
$$;


--
-- Name: verify_mfa_token(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_mfa_token(p_user_id uuid, p_token text, p_method text DEFAULT 'totp'::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    id uuid NOT NULL,
    email text,
    raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.access_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    ip_address inet,
    user_agent text,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: controls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.controls (
    id bigint NOT NULL,
    control_number text NOT NULL,
    title text NOT NULL,
    description text,
    domain text NOT NULL,
    category text,
    sub_category text,
    compliance_standards text[],
    risk_level text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT controls_risk_level_check CHECK ((risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])))
);


--
-- Name: controls_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.controls_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: controls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.controls_id_seq OWNED BY public.controls.id;


--
-- Name: mfa_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mfa_configurations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    is_mfa_enabled boolean DEFAULT false NOT NULL,
    totp_secret text,
    backup_codes text[] DEFAULT ARRAY[]::text[],
    failed_attempts integer DEFAULT 0 NOT NULL,
    last_mfa_challenge_time timestamp with time zone,
    lockout_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    related_task_id uuid,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['task_assigned'::text, 'task_updated'::text, 'task_completed'::text, 'comment_added'::text, 'deadline_reminder'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    title_ar text,
    description text,
    description_ar text,
    category text NOT NULL,
    type text NOT NULL,
    organization text NOT NULL,
    publication_date date,
    version text,
    language text DEFAULT 'en'::text NOT NULL,
    url text,
    file_path text,
    tags text[],
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL,
    file_size bigint,
    mime_type text,
    storage_bucket text,
    original_filename text,
    CONSTRAINT resources_type_check CHECK ((type = ANY (ARRAY['standard'::text, 'guideline'::text, 'regulation'::text, 'manual'::text, 'reference'::text])))
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    assigned_to uuid,
    assigned_by uuid NOT NULL,
    team_id bigint,
    status text DEFAULT 'pending'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tasks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT tasks_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id bigint NOT NULL,
    name text NOT NULL,
    name_ar text,
    description text,
    description_ar text,
    department text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: teams_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.teams ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.teams_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: controls id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controls ALTER COLUMN id SET DEFAULT nextval('public.controls_id_seq'::regclass);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: access_tokens access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_tokens
    ADD CONSTRAINT access_tokens_pkey PRIMARY KEY (id);


--
-- Name: controls controls_control_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controls
    ADD CONSTRAINT controls_control_number_key UNIQUE (control_number);


--
-- Name: controls controls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controls
    ADD CONSTRAINT controls_pkey PRIMARY KEY (id);


--
-- Name: mfa_configurations mfa_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_configurations
    ADD CONSTRAINT mfa_configurations_pkey PRIMARY KEY (id);


--
-- Name: mfa_configurations mfa_configurations_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_configurations
    ADD CONSTRAINT mfa_configurations_user_id_key UNIQUE (user_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_access_tokens_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_tokens_active ON public.access_tokens USING btree (is_active);


--
-- Name: idx_access_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_tokens_user_id ON public.access_tokens USING btree (user_id);


--
-- Name: idx_mfa_configurations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mfa_configurations_user_id ON public.mfa_configurations USING btree (user_id);


--
-- Name: idx_resources_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resources_active ON public.resources USING btree (is_active);


--
-- Name: idx_resources_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resources_category ON public.resources USING btree (category);


--
-- Name: idx_resources_organization; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resources_organization ON public.resources USING btree (organization);


--
-- Name: idx_resources_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resources_tags ON public.resources USING gin (tags);


--
-- Name: idx_resources_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resources_type ON public.resources USING btree (type);


--
-- Name: resources update_resources_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: access_tokens access_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_tokens
    ADD CONSTRAINT access_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: mfa_configurations mfa_configurations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_configurations
    ADD CONSTRAINT mfa_configurations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_related_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_task_id_fkey FOREIGN KEY (related_task_id) REFERENCES public.tasks(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id);


--
-- Name: tasks tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);


--
-- Name: tasks tasks_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: controls; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.controls ENABLE ROW LEVEL SECURITY;

--
-- Name: resources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict 35FefpYtQ9a2fCGFrz2cyl2bqTl3UcAR2k1oBLWXV0vKN5pYLgRbPQEohKwLnTc

