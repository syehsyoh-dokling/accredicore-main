-- Policy governance patch
-- Adds approval-chain workflow, explicit policy version archive, and
-- real audit logs for local Supabase testing.

ALTER TABLE public.policies
  ADD COLUMN IF NOT EXISTS chapter text,
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS submitted_for_approval_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS last_archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS change_summary text;

CREATE TABLE IF NOT EXISTS public.policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  title text NOT NULL,
  description text,
  content text NOT NULL,
  category text,
  chapter text,
  document_type text,
  change_summary text,
  archived_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  archived_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.policy_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  stage_order integer NOT NULL,
  stage_name text NOT NULL,
  required_role public.app_role NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  comments text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE (policy_id, stage_order)
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_agent text,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_policy_versions_policy_id
  ON public.policy_versions(policy_id, archived_at DESC);

CREATE INDEX IF NOT EXISTS idx_policy_approval_requests_policy_id
  ON public.policy_approval_requests(policy_id, stage_order);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record
  ON public.audit_logs(table_name, record_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_table_name text,
  p_record_id text,
  p_action text,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    user_id
  )
  VALUES (
    p_table_name,
    p_record_id,
    p_action,
    p_old_values,
    p_new_values,
    auth.uid()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_row_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record_id text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_record_id := COALESCE(OLD.id::text, NULL);
    PERFORM public.write_audit_log(TG_TABLE_NAME, v_record_id, 'DELETE', to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;

  v_record_id := COALESCE(NEW.id::text, NULL);

  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_log(TG_TABLE_NAME, v_record_id, 'INSERT', NULL, to_jsonb(NEW));
    RETURN NEW;
  END IF;

  PERFORM public.write_audit_log(TG_TABLE_NAME, v_record_id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_policies_changes ON public.policies;
CREATE TRIGGER audit_policies_changes
AFTER INSERT OR UPDATE OR DELETE ON public.policies
FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes();

DROP TRIGGER IF EXISTS audit_policy_versions_changes ON public.policy_versions;
CREATE TRIGGER audit_policy_versions_changes
AFTER INSERT OR UPDATE OR DELETE ON public.policy_versions
FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes();

DROP TRIGGER IF EXISTS audit_policy_approvals_changes ON public.policy_approval_requests;
CREATE TRIGGER audit_policy_approvals_changes
AFTER INSERT OR UPDATE OR DELETE ON public.policy_approval_requests
FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes();

DROP TRIGGER IF EXISTS audit_documents_changes ON public.documents;
CREATE TRIGGER audit_documents_changes
AFTER INSERT OR UPDATE OR DELETE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes();

DROP TRIGGER IF EXISTS audit_incidents_changes ON public.incidents;
CREATE TRIGGER audit_incidents_changes
AFTER INSERT OR UPDATE OR DELETE ON public.incidents
FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes();

DROP TRIGGER IF EXISTS audit_action_plans_changes ON public.action_plans;
CREATE TRIGGER audit_action_plans_changes
AFTER INSERT OR UPDATE OR DELETE ON public.action_plans
FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes();

CREATE OR REPLACE FUNCTION public.archive_policy_version(
  p_policy_id uuid,
  p_change_summary text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_policy public.policies%ROWTYPE;
  v_version_id uuid;
BEGIN
  SELECT *
  INTO v_policy
  FROM public.policies
  WHERE id = p_policy_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Policy % not found', p_policy_id;
  END IF;

  INSERT INTO public.policy_versions (
    policy_id,
    version_number,
    title,
    description,
    content,
    category,
    chapter,
    document_type,
    change_summary,
    archived_by
  )
  VALUES (
    v_policy.id,
    v_policy.version,
    v_policy.title,
    v_policy.description,
    v_policy.content,
    v_policy.category,
    v_policy.chapter,
    v_policy.document_type,
    COALESCE(p_change_summary, v_policy.change_summary),
    auth.uid()
  )
  RETURNING id INTO v_version_id;

  UPDATE public.policies
  SET last_archived_at = now()
  WHERE id = p_policy_id;

  RETURN v_version_id;
END;
$$;

DROP FUNCTION IF EXISTS public.submit_policy_for_approval(uuid, text);
CREATE FUNCTION public.submit_policy_for_approval(
  p_policy_id uuid,
  p_change_summary text DEFAULT NULL
)
RETURNS TABLE (
  approval_id uuid,
  stage_name text,
  request_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_policy public.policies%ROWTYPE;
BEGIN
  SELECT *
  INTO v_policy
  FROM public.policies
  WHERE id = p_policy_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Policy % not found', p_policy_id;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  DELETE FROM public.policy_approval_requests
  WHERE policy_approval_requests.policy_id = p_policy_id
    AND policy_approval_requests.status IN ('pending', 'queued', 'rejected');

  INSERT INTO public.policy_approval_requests (
    policy_id, stage_order, stage_name, required_role, status, requested_by, comments
  )
  VALUES
    (p_policy_id, 1, 'super_user_review', 'super_user', 'pending', auth.uid(), p_change_summary),
    (p_policy_id, 2, 'department_manager_approval', 'admin', 'queued', auth.uid(), p_change_summary),
    (p_policy_id, 3, 'executive_approval', 'system_admin', 'queued', auth.uid(), p_change_summary);

  UPDATE public.policies
  SET
    status = 'under_review',
    submitted_for_approval_at = now(),
    change_summary = p_change_summary
  WHERE id = p_policy_id;

  RETURN QUERY
  SELECT par.id, par.stage_name, par.status
  FROM public.policy_approval_requests par
  WHERE par.policy_id = p_policy_id
  ORDER BY par.stage_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_policy_approval(
  p_request_id uuid,
  p_decision text,
  p_comments text DEFAULT NULL
)
RETURNS TABLE (
  policy_id uuid,
  stage_name text,
  request_status text,
  policy_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request public.policy_approval_requests%ROWTYPE;
  v_next_request public.policy_approval_requests%ROWTYPE;
  v_decision text;
BEGIN
  v_decision := lower(trim(p_decision));

  IF v_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decision must be approved or rejected';
  END IF;

  SELECT *
  INTO v_request
  FROM public.policy_approval_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approval request % not found', p_request_id;
  END IF;

  IF v_request.status NOT IN ('pending', 'queued') THEN
    RAISE EXCEPTION 'Approval request % is already finalized', p_request_id;
  END IF;

  IF NOT public.has_role(auth.uid(), v_request.required_role) AND NOT public.is_elevated_role(auth.uid()) THEN
    RAISE EXCEPTION 'Insufficient permissions to review this stage';
  END IF;

  UPDATE public.policy_approval_requests
  SET
    status = v_decision,
    reviewed_by = auth.uid(),
    comments = COALESCE(p_comments, comments),
    reviewed_at = now()
  WHERE id = p_request_id;

  IF v_decision = 'rejected' THEN
    UPDATE public.policy_approval_requests
    SET status = 'cancelled'
    WHERE policy_approval_requests.policy_id = v_request.policy_id
      AND policy_approval_requests.stage_order > v_request.stage_order
      AND policy_approval_requests.status = 'queued';

    UPDATE public.policies
    SET status = 'draft'
    WHERE id = v_request.policy_id;

    RETURN QUERY
    SELECT v_request.policy_id, v_request.stage_name, v_decision, 'draft';
    RETURN;
  END IF;

  SELECT *
  INTO v_next_request
  FROM public.policy_approval_requests
  WHERE policy_approval_requests.policy_id = v_request.policy_id
    AND policy_approval_requests.stage_order > v_request.stage_order
    AND policy_approval_requests.status = 'queued'
  ORDER BY policy_approval_requests.stage_order
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.policy_approval_requests
    SET status = 'pending'
    WHERE id = v_next_request.id;

    RETURN QUERY
    SELECT v_request.policy_id, v_request.stage_name, v_decision, 'under_review';
    RETURN;
  END IF;

  UPDATE public.policies
  SET
    status = 'approved',
    approved_at = now(),
    approved_by = auth.uid()
  WHERE id = v_request.policy_id;

  RETURN QUERY
  SELECT v_request.policy_id, v_request.stage_name, v_decision, 'approved';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_policy_governance_summary(p_policy_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'policy_id', p_policy_id,
    'approvals', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', par.id,
          'stage_order', par.stage_order,
          'stage_name', par.stage_name,
          'required_role', par.required_role,
          'status', par.status,
          'requested_by', par.requested_by,
          'reviewed_by', par.reviewed_by,
          'comments', par.comments,
          'requested_at', par.requested_at,
          'reviewed_at', par.reviewed_at
        )
        ORDER BY par.stage_order
      )
      FROM public.policy_approval_requests par
      WHERE par.policy_id = p_policy_id
    ), '[]'::jsonb),
    'versions', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', pv.id,
          'version_number', pv.version_number,
          'change_summary', pv.change_summary,
          'archived_by', pv.archived_by,
          'archived_at', pv.archived_at
        )
        ORDER BY pv.archived_at DESC
      )
      FROM public.policy_versions pv
      WHERE pv.policy_id = p_policy_id
    ), '[]'::jsonb),
    'audit_logs', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', al.id,
          'action', al.action,
          'table_name', al.table_name,
          'record_id', al.record_id,
          'user_id', al.user_id,
          'created_at', al.created_at,
          'old_values', al.old_values,
          'new_values', al.new_values
        )
        ORDER BY al.created_at DESC
      )
      FROM public.audit_logs al
      WHERE al.table_name IN ('policies', 'policy_approval_requests', 'policy_versions')
        AND (
          (al.table_name = 'policies' AND al.record_id = p_policy_id::text)
          OR (al.table_name = 'policy_approval_requests' AND al.record_id IN (
            SELECT id::text FROM public.policy_approval_requests WHERE policy_id = p_policy_id
          ))
          OR (al.table_name = 'policy_versions' AND al.record_id IN (
            SELECT id::text FROM public.policy_versions WHERE policy_id = p_policy_id
          ))
        )
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "policy_versions_read_authenticated" ON public.policy_versions;
CREATE POLICY "policy_versions_read_authenticated"
ON public.policy_versions
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "policy_versions_manage_admin" ON public.policy_versions;
CREATE POLICY "policy_versions_manage_admin"
ON public.policy_versions
FOR ALL
TO authenticated
USING (public.is_elevated_role())
WITH CHECK (public.is_elevated_role());

DROP POLICY IF EXISTS "policy_approvals_read_authenticated" ON public.policy_approval_requests;
CREATE POLICY "policy_approvals_read_authenticated"
ON public.policy_approval_requests
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "policy_approvals_manage_elevated" ON public.policy_approval_requests;
CREATE POLICY "policy_approvals_manage_elevated"
ON public.policy_approval_requests
FOR ALL
TO authenticated
USING (public.is_elevated_role())
WITH CHECK (public.is_elevated_role());

DROP POLICY IF EXISTS "audit_logs_read_elevated" ON public.audit_logs;
CREATE POLICY "audit_logs_read_elevated"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_elevated_role());

DROP POLICY IF EXISTS "audit_logs_insert_system" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_system"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_elevated_role());
