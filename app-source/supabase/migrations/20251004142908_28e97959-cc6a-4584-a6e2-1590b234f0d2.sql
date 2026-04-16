-- Add team_id column to project_quality_plan table
ALTER TABLE public.project_quality_plan 
ADD COLUMN team_id bigint REFERENCES public.teams(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_project_quality_plan_team_id ON public.project_quality_plan(team_id);

-- Create helper function to check if user is a team member
CREATE OR REPLACE FUNCTION public._is_project_member_by_team(p_team_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_id = p_team_id
      AND user_id = auth.uid()
      AND is_active = true
  );
$$;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "All authenticated users can view PQP items" ON public.project_quality_plan;
DROP POLICY IF EXISTS "Admins can insert PQP items" ON public.project_quality_plan;
DROP POLICY IF EXISTS "Admins can update PQP items" ON public.project_quality_plan;
DROP POLICY IF EXISTS "Admins can delete PQP items" ON public.project_quality_plan;

-- Create new RLS policies with team-based access
CREATE POLICY "Users can view PQP items from their teams or if no team assigned"
ON public.project_quality_plan
FOR SELECT
TO authenticated
USING (
  team_id IS NULL 
  OR public._is_project_member_by_team(team_id)
  OR has_role(auth.uid(), 'system_admin'::app_role)
  OR has_role(auth.uid(), 'super_user'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Team members and admins can insert PQP items"
ON public.project_quality_plan
FOR INSERT
TO authenticated
WITH CHECK (
  (team_id IS NULL AND (
    has_role(auth.uid(), 'system_admin'::app_role)
    OR has_role(auth.uid(), 'super_user'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  ))
  OR (team_id IS NOT NULL AND public._is_project_member_by_team(team_id))
);

CREATE POLICY "Team members and admins can update PQP items"
ON public.project_quality_plan
FOR UPDATE
TO authenticated
USING (
  team_id IS NULL AND (
    has_role(auth.uid(), 'system_admin'::app_role)
    OR has_role(auth.uid(), 'super_user'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  OR (team_id IS NOT NULL AND public._is_project_member_by_team(team_id))
);

CREATE POLICY "Team members and admins can delete PQP items"
ON public.project_quality_plan
FOR DELETE
TO authenticated
USING (
  team_id IS NULL AND (
    has_role(auth.uid(), 'system_admin'::app_role)
    OR has_role(auth.uid(), 'super_user'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  OR (team_id IS NOT NULL AND public._is_project_member_by_team(team_id))
);