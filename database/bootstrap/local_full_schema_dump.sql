--
-- PostgreSQL database dump
--

\restrict jYWbSJMGctzpEaGNctfhesXTTHbQBFCSdhWqfYAAX5dRzUVhn2Bxj6f199bSTjW

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
    'user',
    'developer',
    'team',
    'client'
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
-- Name: get_current_user_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_user_role() RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    (
      SELECT role
      FROM public.user_roles
      WHERE user_id = auth.uid()
      ORDER BY
        CASE role
          WHEN 'system_admin' THEN 1
          WHEN 'super_user' THEN 2
          WHEN 'admin' THEN 3
          WHEN 'developer' THEN 4
          WHEN 'team' THEN 5
          WHEN 'client' THEN 6
          ELSE 7
        END
      LIMIT 1
    ),
    'user'::public.app_role
  );
$$;


--
-- Name: get_department_compliance_summary(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_department_compliance_summary(dept_id integer DEFAULT NULL::integer) RETURNS TABLE(department_name text, total_controls bigint, completed_controls bigint, in_progress_controls bigint, not_started_controls bigint, compliance_percentage numeric)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT
    d.name AS department_name,
    COUNT(c.id)::bigint AS total_controls,
    COUNT(*) FILTER (WHERE ap.status = 'completed')::bigint AS completed_controls,
    COUNT(*) FILTER (WHERE ap.status = 'in_progress')::bigint AS in_progress_controls,
    COUNT(*) FILTER (
      WHERE ap.status IS NULL OR ap.status IN ('not_started', 'pending')
    )::bigint AS not_started_controls,
    CASE
      WHEN COUNT(c.id) = 0 THEN 0
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE ap.status = 'completed')::numeric / COUNT(c.id)::numeric) * 100,
        2
      )
    END AS compliance_percentage
  FROM public.departments d
  CROSS JOIN public.controls c
  LEFT JOIN public.facilities f
    ON f.department_id = d.id
   AND f.is_active = true
  LEFT JOIN public.audit_progress ap
    ON ap.facility_id = f.id
   AND ap.control_id = c.id
  WHERE d.is_active = true
    AND (dept_id IS NULL OR d.id = dept_id)
  GROUP BY d.id, d.name
  ORDER BY d.name;
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
-- Name: update_audit_progress(integer, uuid, bigint, text, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_audit_progress(p_facility_id integer, p_user_id uuid, p_control_id bigint, p_status text, p_progress_percentage integer, p_notes text DEFAULT NULL::text) RETURNS TABLE(id integer, progress_percentage integer, status text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_row public.audit_progress%ROWTYPE;
BEGIN
  INSERT INTO public.audit_progress (
    facility_id,
    user_id,
    control_id,
    status,
    progress_percentage,
    notes,
    completed_at,
    updated_at
  )
  VALUES (
    p_facility_id,
    p_user_id,
    p_control_id,
    p_status,
    p_progress_percentage,
    p_notes,
    CASE WHEN p_status = 'completed' THEN now() ELSE NULL END,
    now()
  )
  ON CONFLICT (facility_id, control_id)
  DO UPDATE SET
    user_id = EXCLUDED.user_id,
    status = EXCLUDED.status,
    progress_percentage = EXCLUDED.progress_percentage,
    notes = EXCLUDED.notes,
    completed_at = CASE
      WHEN EXCLUDED.status = 'completed' THEN now()
      ELSE public.audit_progress.completed_at
    END,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN QUERY
  SELECT v_row.id, v_row.progress_percentage, v_row.status;
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
-- Name: action_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.action_plans (
    id integer NOT NULL,
    incident_id integer NOT NULL,
    plan text NOT NULL,
    status text DEFAULT 'proposed'::text NOT NULL,
    proposer_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: action_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.action_plans ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.action_plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: audit_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_progress (
    id integer NOT NULL,
    facility_id integer NOT NULL,
    control_id bigint NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'not_started'::text NOT NULL,
    progress_percentage integer DEFAULT 0 NOT NULL,
    notes text,
    due_date timestamp with time zone,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    evidence_files text[] DEFAULT ARRAY[]::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.audit_progress ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.audit_progress_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: audit_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    audit_type text NOT NULL,
    department text NOT NULL,
    scheduled_date date NOT NULL,
    scheduled_time text,
    duration_days integer DEFAULT 1,
    priority text DEFAULT 'medium'::text NOT NULL,
    auditor_name text,
    auditor_company text,
    status text DEFAULT 'scheduled'::text NOT NULL,
    created_by uuid NOT NULL,
    assigned_to uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: compliance_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compliance_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    policy_id uuid,
    title text NOT NULL,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    assigned_to uuid,
    due_date timestamp with time zone,
    completed_date timestamp with time zone,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
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
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    manager_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.departments ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.departments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    file_path text DEFAULT ''::text NOT NULL,
    storage_bucket text DEFAULT 'documents'::text NOT NULL,
    original_filename text DEFAULT 'document.txt'::text NOT NULL,
    mime_type text DEFAULT 'text/plain'::text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    version integer DEFAULT 1 NOT NULL,
    file_size bigint,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: facilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facilities (
    id integer NOT NULL,
    name text NOT NULL,
    department_id integer,
    location text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: facilities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.facilities ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.facilities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: improvement_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.improvement_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    root_cause_id uuid,
    incident_id integer,
    status text DEFAULT 'proposed'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    assigned_to uuid,
    team_id bigint,
    created_by uuid NOT NULL,
    target_completion_date timestamp with time zone,
    actual_completion_date timestamp with time zone,
    action_items jsonb DEFAULT '[]'::jsonb,
    success_metrics jsonb DEFAULT '[]'::jsonb,
    budget_allocated numeric,
    budget_spent numeric,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: incidents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incidents (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    created_by uuid NOT NULL,
    team_id bigint,
    assigned_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: incidents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.incidents ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.incidents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: investigation_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investigation_notes (
    id integer NOT NULL,
    incident_id integer NOT NULL,
    note text NOT NULL,
    author_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: investigation_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.investigation_notes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.investigation_notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


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
-- Name: policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    content text DEFAULT ''::text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: policy_manual_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policy_manual_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    policy_id text NOT NULL,
    policy_title text NOT NULL,
    policy_content text DEFAULT ''::text NOT NULL,
    section text DEFAULT 'Policy Manuals'::text NOT NULL,
    assigned_to uuid,
    assigned_by uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    change_notes text,
    task_description text,
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    file_path text,
    file_size bigint,
    original_filename text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: policy_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policy_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    title_ar text,
    description text,
    description_ar text,
    content text DEFAULT ''::text NOT NULL,
    content_ar text,
    category text DEFAULT 'general'::text NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    file_path text,
    file_size bigint,
    mime_type text,
    storage_bucket text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_login timestamp with time zone
);


--
-- Name: project_quality_plan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_quality_plan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category text NOT NULL,
    title text NOT NULL,
    description text,
    details jsonb DEFAULT '{}'::jsonb,
    order_index integer DEFAULT 0 NOT NULL,
    team_id bigint,
    created_by uuid,
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
-- Name: root_cause_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.root_cause_analyses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    problem text NOT NULL,
    incident_id integer,
    status text DEFAULT 'draft'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    team_id bigint,
    created_by uuid NOT NULL,
    completed_at timestamp with time zone,
    root_causes jsonb DEFAULT '[]'::jsonb,
    contributing_factors jsonb DEFAULT '[]'::jsonb,
    why_analysis jsonb DEFAULT '[]'::jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: task_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: task_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    progress_percentage integer DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
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
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    id integer NOT NULL,
    team_id bigint,
    user_id uuid,
    role text DEFAULT 'member'::text NOT NULL,
    permissions text[] DEFAULT ARRAY[]::text[],
    is_active boolean DEFAULT true NOT NULL,
    joined_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: team_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.team_members ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.team_members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
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
-- Name: action_plans action_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_plans
    ADD CONSTRAINT action_plans_pkey PRIMARY KEY (id);


--
-- Name: audit_progress audit_progress_facility_id_control_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_progress
    ADD CONSTRAINT audit_progress_facility_id_control_id_key UNIQUE (facility_id, control_id);


--
-- Name: audit_progress audit_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_progress
    ADD CONSTRAINT audit_progress_pkey PRIMARY KEY (id);


--
-- Name: audit_schedules audit_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_schedules
    ADD CONSTRAINT audit_schedules_pkey PRIMARY KEY (id);


--
-- Name: compliance_records compliance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_records
    ADD CONSTRAINT compliance_records_pkey PRIMARY KEY (id);


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
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: facilities facilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_pkey PRIMARY KEY (id);


--
-- Name: improvement_plans improvement_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.improvement_plans
    ADD CONSTRAINT improvement_plans_pkey PRIMARY KEY (id);


--
-- Name: incidents incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);


--
-- Name: investigation_notes investigation_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investigation_notes
    ADD CONSTRAINT investigation_notes_pkey PRIMARY KEY (id);


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
-- Name: policies policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_pkey PRIMARY KEY (id);


--
-- Name: policy_manual_tasks policy_manual_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_manual_tasks
    ADD CONSTRAINT policy_manual_tasks_pkey PRIMARY KEY (id);


--
-- Name: policy_templates policy_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_templates
    ADD CONSTRAINT policy_templates_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: project_quality_plan project_quality_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_quality_plan
    ADD CONSTRAINT project_quality_plan_pkey PRIMARY KEY (id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: root_cause_analyses root_cause_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.root_cause_analyses
    ADD CONSTRAINT root_cause_analyses_pkey PRIMARY KEY (id);


--
-- Name: task_comments task_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_pkey PRIMARY KEY (id);


--
-- Name: task_progress task_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_progress
    ADD CONSTRAINT task_progress_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_team_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_user_id_key UNIQUE (team_id, user_id);


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
-- Name: action_plans update_action_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_action_plans_updated_at BEFORE UPDATE ON public.action_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_schedules update_audit_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_audit_schedules_updated_at BEFORE UPDATE ON public.audit_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: departments update_departments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documents update_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: facilities update_facilities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON public.facilities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: improvement_plans update_improvement_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_improvement_plans_updated_at BEFORE UPDATE ON public.improvement_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: incidents update_incidents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: policies update_policies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: policy_manual_tasks update_policy_manual_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_policy_manual_tasks_updated_at BEFORE UPDATE ON public.policy_manual_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: policy_templates update_policy_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_policy_templates_updated_at BEFORE UPDATE ON public.policy_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: project_quality_plan update_project_quality_plan_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_project_quality_plan_updated_at BEFORE UPDATE ON public.project_quality_plan FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: resources update_resources_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: root_cause_analyses update_root_cause_analyses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_root_cause_analyses_updated_at BEFORE UPDATE ON public.root_cause_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: access_tokens access_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_tokens
    ADD CONSTRAINT access_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: action_plans action_plans_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_plans
    ADD CONSTRAINT action_plans_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;


--
-- Name: action_plans action_plans_proposer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_plans
    ADD CONSTRAINT action_plans_proposer_id_fkey FOREIGN KEY (proposer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: audit_progress audit_progress_control_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_progress
    ADD CONSTRAINT audit_progress_control_id_fkey FOREIGN KEY (control_id) REFERENCES public.controls(id) ON DELETE CASCADE;


--
-- Name: audit_progress audit_progress_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_progress
    ADD CONSTRAINT audit_progress_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON DELETE CASCADE;


--
-- Name: audit_progress audit_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_progress
    ADD CONSTRAINT audit_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: audit_schedules audit_schedules_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_schedules
    ADD CONSTRAINT audit_schedules_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);


--
-- Name: audit_schedules audit_schedules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_schedules
    ADD CONSTRAINT audit_schedules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: compliance_records compliance_records_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_records
    ADD CONSTRAINT compliance_records_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);


--
-- Name: compliance_records compliance_records_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_records
    ADD CONSTRAINT compliance_records_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: compliance_records compliance_records_policy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_records
    ADD CONSTRAINT compliance_records_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.policies(id) ON DELETE SET NULL;


--
-- Name: departments departments_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.profiles(id);


--
-- Name: documents documents_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: facilities facilities_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: improvement_plans improvement_plans_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.improvement_plans
    ADD CONSTRAINT improvement_plans_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: improvement_plans improvement_plans_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.improvement_plans
    ADD CONSTRAINT improvement_plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: improvement_plans improvement_plans_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.improvement_plans
    ADD CONSTRAINT improvement_plans_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE SET NULL;


--
-- Name: improvement_plans improvement_plans_root_cause_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.improvement_plans
    ADD CONSTRAINT improvement_plans_root_cause_id_fkey FOREIGN KEY (root_cause_id) REFERENCES public.root_cause_analyses(id) ON DELETE SET NULL;


--
-- Name: improvement_plans improvement_plans_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.improvement_plans
    ADD CONSTRAINT improvement_plans_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: incidents incidents_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: incidents incidents_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: incidents incidents_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: investigation_notes investigation_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investigation_notes
    ADD CONSTRAINT investigation_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: investigation_notes investigation_notes_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investigation_notes
    ADD CONSTRAINT investigation_notes_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;


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
-- Name: policies policies_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: policy_manual_tasks policy_manual_tasks_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_manual_tasks
    ADD CONSTRAINT policy_manual_tasks_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id);


--
-- Name: policy_manual_tasks policy_manual_tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_manual_tasks
    ADD CONSTRAINT policy_manual_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);


--
-- Name: policy_templates policy_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_templates
    ADD CONSTRAINT policy_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: project_quality_plan project_quality_plan_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_quality_plan
    ADD CONSTRAINT project_quality_plan_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: project_quality_plan project_quality_plan_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_quality_plan
    ADD CONSTRAINT project_quality_plan_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: root_cause_analyses root_cause_analyses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.root_cause_analyses
    ADD CONSTRAINT root_cause_analyses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: root_cause_analyses root_cause_analyses_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.root_cause_analyses
    ADD CONSTRAINT root_cause_analyses_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE SET NULL;


--
-- Name: root_cause_analyses root_cause_analyses_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.root_cause_analyses
    ADD CONSTRAINT root_cause_analyses_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: task_comments task_comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_comments task_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: task_progress task_progress_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_progress
    ADD CONSTRAINT task_progress_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_progress task_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_progress
    ADD CONSTRAINT task_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


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
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


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

\unrestrict jYWbSJMGctzpEaGNctfhesXTTHbQBFCSdhWqfYAAX5dRzUVhn2Bxj6f199bSTjW

