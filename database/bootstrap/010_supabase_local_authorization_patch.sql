-- Supabase local authorization hardening patch
-- Enables RLS and applies role-aware policies so local testing better reflects
-- the intended production behavior.

CREATE OR REPLACE FUNCTION public.is_elevated_role(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('system_admin', 'super_user', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_member(_team_id bigint, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = _team_id
      AND tm.user_id = _user_id
      AND tm.is_active = true
  );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_manual_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_quality_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.root_cause_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.improvement_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_elevated_role())
WITH CHECK (auth.uid() = id OR public.is_elevated_role());

DROP POLICY IF EXISTS "user_roles_select_authenticated" ON public.user_roles;
CREATE POLICY "user_roles_select_authenticated"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "user_roles_manage_admin" ON public.user_roles;
CREATE POLICY "user_roles_manage_admin"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_elevated_role())
WITH CHECK (public.is_elevated_role());

DROP POLICY IF EXISTS "reference_tables_read_authenticated_departments" ON public.departments;
CREATE POLICY "reference_tables_read_authenticated_departments"
ON public.departments
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "reference_tables_manage_admin_departments" ON public.departments;
CREATE POLICY "reference_tables_manage_admin_departments"
ON public.departments
FOR ALL
TO authenticated
USING (public.is_elevated_role())
WITH CHECK (public.is_elevated_role());

DROP POLICY IF EXISTS "reference_tables_read_authenticated_controls" ON public.controls;
CREATE POLICY "reference_tables_read_authenticated_controls"
ON public.controls
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "reference_tables_manage_admin_controls" ON public.controls;
CREATE POLICY "reference_tables_manage_admin_controls"
ON public.controls
FOR ALL
TO authenticated
USING (public.is_elevated_role())
WITH CHECK (public.is_elevated_role());

DROP POLICY IF EXISTS "reference_tables_read_authenticated_facilities" ON public.facilities;
CREATE POLICY "reference_tables_read_authenticated_facilities"
ON public.facilities
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "reference_tables_manage_admin_facilities" ON public.facilities;
CREATE POLICY "reference_tables_manage_admin_facilities"
ON public.facilities
FOR ALL
TO authenticated
USING (public.is_elevated_role())
WITH CHECK (public.is_elevated_role());

DROP POLICY IF EXISTS "teams_read_authenticated" ON public.teams;
CREATE POLICY "teams_read_authenticated"
ON public.teams
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "teams_manage_admin" ON public.teams;
CREATE POLICY "teams_manage_admin"
ON public.teams
FOR ALL
TO authenticated
USING (public.is_elevated_role())
WITH CHECK (public.is_elevated_role());

DROP POLICY IF EXISTS "team_members_read_authenticated" ON public.team_members;
CREATE POLICY "team_members_read_authenticated"
ON public.team_members
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "team_members_manage_admin" ON public.team_members;
CREATE POLICY "team_members_manage_admin"
ON public.team_members
FOR ALL
TO authenticated
USING (public.is_elevated_role())
WITH CHECK (public.is_elevated_role());

DROP POLICY IF EXISTS "tasks_read_relevant" ON public.tasks;
CREATE POLICY "tasks_read_relevant"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  public.is_elevated_role()
  OR assigned_to = auth.uid()
  OR assigned_by = auth.uid()
  OR (team_id IS NOT NULL AND public.is_team_member(team_id))
);

DROP POLICY IF EXISTS "tasks_insert_admin" ON public.tasks;
CREATE POLICY "tasks_insert_admin"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_elevated_role()
  AND assigned_by = auth.uid()
);

DROP POLICY IF EXISTS "tasks_update_relevant" ON public.tasks;
CREATE POLICY "tasks_update_relevant"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  public.is_elevated_role()
  OR assigned_to = auth.uid()
  OR assigned_by = auth.uid()
)
WITH CHECK (
  public.is_elevated_role()
  OR assigned_to = auth.uid()
  OR assigned_by = auth.uid()
);

DROP POLICY IF EXISTS "task_comments_read_relevant" ON public.task_comments;
CREATE POLICY "task_comments_read_relevant"
ON public.task_comments
FOR SELECT
TO authenticated
USING (
  public.is_elevated_role()
  OR EXISTS (
    SELECT 1
    FROM public.tasks t
    WHERE t.id = task_comments.task_id
      AND (
        t.assigned_to = auth.uid()
        OR t.assigned_by = auth.uid()
        OR (t.team_id IS NOT NULL AND public.is_team_member(t.team_id))
      )
  )
);

DROP POLICY IF EXISTS "task_comments_insert_relevant" ON public.task_comments;
CREATE POLICY "task_comments_insert_relevant"
ON public.task_comments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    public.is_elevated_role()
    OR EXISTS (
      SELECT 1
      FROM public.tasks t
      WHERE t.id = task_comments.task_id
        AND (
          t.assigned_to = auth.uid()
          OR t.assigned_by = auth.uid()
          OR (t.team_id IS NOT NULL AND public.is_team_member(t.team_id))
        )
    )
  )
);

DROP POLICY IF EXISTS "task_progress_read_relevant" ON public.task_progress;
CREATE POLICY "task_progress_read_relevant"
ON public.task_progress
FOR SELECT
TO authenticated
USING (
  public.is_elevated_role()
  OR EXISTS (
    SELECT 1
    FROM public.tasks t
    WHERE t.id = task_progress.task_id
      AND (
        t.assigned_to = auth.uid()
        OR t.assigned_by = auth.uid()
        OR (t.team_id IS NOT NULL AND public.is_team_member(t.team_id))
      )
  )
);

DROP POLICY IF EXISTS "task_progress_insert_relevant" ON public.task_progress;
CREATE POLICY "task_progress_insert_relevant"
ON public.task_progress
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    public.is_elevated_role()
    OR EXISTS (
      SELECT 1
      FROM public.tasks t
      WHERE t.id = task_progress.task_id
        AND (
          t.assigned_to = auth.uid()
          OR t.assigned_by = auth.uid()
          OR (t.team_id IS NOT NULL AND public.is_team_member(t.team_id))
        )
    )
  )
);

DROP POLICY IF EXISTS "audit_progress_read_authenticated" ON public.audit_progress;
CREATE POLICY "audit_progress_read_authenticated"
ON public.audit_progress
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "audit_progress_manage_admin" ON public.audit_progress;
CREATE POLICY "audit_progress_manage_admin"
ON public.audit_progress
FOR ALL
TO authenticated
USING (public.is_elevated_role())
WITH CHECK (public.is_elevated_role());

DROP POLICY IF EXISTS "audit_schedules_read_authenticated" ON public.audit_schedules;
CREATE POLICY "audit_schedules_read_authenticated"
ON public.audit_schedules
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "audit_schedules_manage_admin" ON public.audit_schedules;
CREATE POLICY "audit_schedules_manage_admin"
ON public.audit_schedules
FOR ALL
TO authenticated
USING (public.is_elevated_role())
WITH CHECK (public.is_elevated_role());

DROP POLICY IF EXISTS "policies_read_authenticated" ON public.policies;
CREATE POLICY "policies_read_authenticated"
ON public.policies
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "policies_manage_admin" ON public.policies;
CREATE POLICY "policies_manage_admin"
ON public.policies
FOR ALL
TO authenticated
USING (public.is_elevated_role())
WITH CHECK (public.is_elevated_role());

DROP POLICY IF EXISTS "policy_templates_read_authenticated" ON public.policy_templates;
CREATE POLICY "policy_templates_read_authenticated"
ON public.policy_templates
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "policy_templates_manage_admin" ON public.policy_templates;
CREATE POLICY "policy_templates_manage_admin"
ON public.policy_templates
FOR ALL
TO authenticated
USING (public.is_elevated_role())
WITH CHECK (public.is_elevated_role());

DROP POLICY IF EXISTS "documents_read_authenticated" ON public.documents;
CREATE POLICY "documents_read_authenticated"
ON public.documents
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "documents_manage_admin" ON public.documents;
CREATE POLICY "documents_manage_admin"
ON public.documents
FOR ALL
TO authenticated
USING (public.is_elevated_role())
WITH CHECK (public.is_elevated_role());

DROP POLICY IF EXISTS "policy_manual_tasks_read_relevant" ON public.policy_manual_tasks;
CREATE POLICY "policy_manual_tasks_read_relevant"
ON public.policy_manual_tasks
FOR SELECT
TO authenticated
USING (
  public.is_elevated_role()
  OR assigned_to = auth.uid()
  OR assigned_by = auth.uid()
);

DROP POLICY IF EXISTS "policy_manual_tasks_manage_admin" ON public.policy_manual_tasks;
CREATE POLICY "policy_manual_tasks_manage_admin"
ON public.policy_manual_tasks
FOR ALL
TO authenticated
USING (
  public.is_elevated_role()
  OR assigned_to = auth.uid()
)
WITH CHECK (
  public.is_elevated_role()
  OR assigned_to = auth.uid()
);

DROP POLICY IF EXISTS "project_quality_plan_read_authenticated" ON public.project_quality_plan;
CREATE POLICY "project_quality_plan_read_authenticated"
ON public.project_quality_plan
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "project_quality_plan_manage_admin" ON public.project_quality_plan;
CREATE POLICY "project_quality_plan_manage_admin"
ON public.project_quality_plan
FOR ALL
TO authenticated
USING (public.is_elevated_role())
WITH CHECK (public.is_elevated_role());

DROP POLICY IF EXISTS "incidents_read_relevant" ON public.incidents;
CREATE POLICY "incidents_read_relevant"
ON public.incidents
FOR SELECT
TO authenticated
USING (
  public.is_elevated_role()
  OR created_by = auth.uid()
  OR assigned_user_id = auth.uid()
  OR (team_id IS NOT NULL AND public.is_team_member(team_id))
);

DROP POLICY IF EXISTS "incidents_insert_authenticated" ON public.incidents;
CREATE POLICY "incidents_insert_authenticated"
ON public.incidents
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "incidents_update_relevant" ON public.incidents;
CREATE POLICY "incidents_update_relevant"
ON public.incidents
FOR UPDATE
TO authenticated
USING (
  public.is_elevated_role()
  OR created_by = auth.uid()
  OR assigned_user_id = auth.uid()
)
WITH CHECK (
  public.is_elevated_role()
  OR created_by = auth.uid()
  OR assigned_user_id = auth.uid()
);

DROP POLICY IF EXISTS "incident_notes_read_relevant" ON public.investigation_notes;
CREATE POLICY "incident_notes_read_relevant"
ON public.investigation_notes
FOR SELECT
TO authenticated
USING (
  public.is_elevated_role()
  OR EXISTS (
    SELECT 1
    FROM public.incidents i
    WHERE i.id = investigation_notes.incident_id
      AND (
        i.created_by = auth.uid()
        OR i.assigned_user_id = auth.uid()
        OR (i.team_id IS NOT NULL AND public.is_team_member(i.team_id))
      )
  )
);

DROP POLICY IF EXISTS "incident_notes_insert_relevant" ON public.investigation_notes;
CREATE POLICY "incident_notes_insert_relevant"
ON public.investigation_notes
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND (
    public.is_elevated_role()
    OR EXISTS (
      SELECT 1
      FROM public.incidents i
      WHERE i.id = investigation_notes.incident_id
        AND (
          i.created_by = auth.uid()
          OR i.assigned_user_id = auth.uid()
          OR (i.team_id IS NOT NULL AND public.is_team_member(i.team_id))
        )
    )
  )
);

DROP POLICY IF EXISTS "action_plans_read_relevant" ON public.action_plans;
CREATE POLICY "action_plans_read_relevant"
ON public.action_plans
FOR SELECT
TO authenticated
USING (
  public.is_elevated_role()
  OR EXISTS (
    SELECT 1
    FROM public.incidents i
    WHERE i.id = action_plans.incident_id
      AND (
        i.created_by = auth.uid()
        OR i.assigned_user_id = auth.uid()
        OR (i.team_id IS NOT NULL AND public.is_team_member(i.team_id))
      )
  )
);

DROP POLICY IF EXISTS "action_plans_insert_relevant" ON public.action_plans;
CREATE POLICY "action_plans_insert_relevant"
ON public.action_plans
FOR INSERT
TO authenticated
WITH CHECK (
  proposer_id = auth.uid()
  AND (
    public.is_elevated_role()
    OR EXISTS (
      SELECT 1
      FROM public.incidents i
      WHERE i.id = action_plans.incident_id
        AND (
          i.created_by = auth.uid()
          OR i.assigned_user_id = auth.uid()
          OR (i.team_id IS NOT NULL AND public.is_team_member(i.team_id))
        )
    )
  )
);

DROP POLICY IF EXISTS "action_plans_update_relevant" ON public.action_plans;
CREATE POLICY "action_plans_update_relevant"
ON public.action_plans
FOR UPDATE
TO authenticated
USING (
  public.is_elevated_role()
  OR proposer_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.incidents i
    WHERE i.id = action_plans.incident_id
      AND (
        i.created_by = auth.uid()
        OR i.assigned_user_id = auth.uid()
        OR (i.team_id IS NOT NULL AND public.is_team_member(i.team_id))
      )
  )
)
WITH CHECK (
  public.is_elevated_role()
  OR proposer_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.incidents i
    WHERE i.id = action_plans.incident_id
      AND (
        i.created_by = auth.uid()
        OR i.assigned_user_id = auth.uid()
        OR (i.team_id IS NOT NULL AND public.is_team_member(i.team_id))
      )
  )
);

DROP POLICY IF EXISTS "root_cause_read_relevant" ON public.root_cause_analyses;
CREATE POLICY "root_cause_read_relevant"
ON public.root_cause_analyses
FOR SELECT
TO authenticated
USING (
  public.is_elevated_role()
  OR created_by = auth.uid()
  OR (team_id IS NOT NULL AND public.is_team_member(team_id))
);

DROP POLICY IF EXISTS "root_cause_insert_authenticated" ON public.root_cause_analyses;
CREATE POLICY "root_cause_insert_authenticated"
ON public.root_cause_analyses
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "root_cause_update_relevant" ON public.root_cause_analyses;
CREATE POLICY "root_cause_update_relevant"
ON public.root_cause_analyses
FOR UPDATE
TO authenticated
USING (
  public.is_elevated_role()
  OR created_by = auth.uid()
)
WITH CHECK (
  public.is_elevated_role()
  OR created_by = auth.uid()
);

DROP POLICY IF EXISTS "improvement_plans_read_relevant" ON public.improvement_plans;
CREATE POLICY "improvement_plans_read_relevant"
ON public.improvement_plans
FOR SELECT
TO authenticated
USING (
  public.is_elevated_role()
  OR created_by = auth.uid()
  OR assigned_to = auth.uid()
  OR (team_id IS NOT NULL AND public.is_team_member(team_id))
);

DROP POLICY IF EXISTS "improvement_plans_insert_relevant" ON public.improvement_plans;
CREATE POLICY "improvement_plans_insert_relevant"
ON public.improvement_plans
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.is_elevated_role()
    OR assigned_to IS NULL
    OR assigned_to = auth.uid()
  )
);

DROP POLICY IF EXISTS "improvement_plans_update_relevant" ON public.improvement_plans;
CREATE POLICY "improvement_plans_update_relevant"
ON public.improvement_plans
FOR UPDATE
TO authenticated
USING (
  public.is_elevated_role()
  OR created_by = auth.uid()
  OR assigned_to = auth.uid()
)
WITH CHECK (
  public.is_elevated_role()
  OR created_by = auth.uid()
  OR assigned_to = auth.uid()
);

DROP POLICY IF EXISTS "compliance_records_read_relevant" ON public.compliance_records;
CREATE POLICY "compliance_records_read_relevant"
ON public.compliance_records
FOR SELECT
TO authenticated
USING (
  public.is_elevated_role()
  OR assigned_to = auth.uid()
  OR created_by = auth.uid()
);

DROP POLICY IF EXISTS "compliance_records_manage_relevant" ON public.compliance_records;
CREATE POLICY "compliance_records_manage_relevant"
ON public.compliance_records
FOR ALL
TO authenticated
USING (
  public.is_elevated_role()
  OR assigned_to = auth.uid()
  OR created_by = auth.uid()
)
WITH CHECK (
  public.is_elevated_role()
  OR assigned_to = auth.uid()
  OR created_by = auth.uid()
);

DROP POLICY IF EXISTS "Local documents insert" ON storage.objects;
CREATE POLICY "Local documents insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('documents', 'images')
  AND public.is_elevated_role()
);

DROP POLICY IF EXISTS "Local documents update" ON storage.objects;
CREATE POLICY "Local documents update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('documents', 'images')
  AND public.is_elevated_role()
)
WITH CHECK (
  bucket_id IN ('documents', 'images')
  AND public.is_elevated_role()
);

DROP POLICY IF EXISTS "Local documents delete" ON storage.objects;
CREATE POLICY "Local documents delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('documents', 'images')
  AND public.is_elevated_role()
);
