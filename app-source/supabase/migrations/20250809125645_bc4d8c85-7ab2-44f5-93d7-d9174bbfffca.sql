-- Fix infinite recursion in team_members RLS by using a SECURITY DEFINER helper
-- and consolidating SELECT policies.

-- 1) Helper function to check if current user is a member of a team
CREATE OR REPLACE FUNCTION public.is_member_of_team(
  p_team_id bigint,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = p_team_id
      AND tm.user_id = COALESCE(p_user_id, auth.uid())
      AND tm.is_active = true
  );
$$;

-- 2) Ensure RLS is enabled on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 3) Remove recursive/overlapping SELECT policies
DROP POLICY IF EXISTS "Team members can view other team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view team members of their teams" ON public.team_members;
DROP POLICY IF EXISTS "Users can view their team memberships" ON public.team_members;

-- 4) Create a single non-recursive SELECT policy for team_members
CREATE POLICY "Members and admin+ can view team members"
ON public.team_members
FOR SELECT
USING (
  public.is_member_of_team(team_members.team_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_user'::public.app_role)
  OR public.has_role(auth.uid(), 'system_admin'::public.app_role)
);
