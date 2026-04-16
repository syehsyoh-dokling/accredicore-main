-- Drop all existing policies by their exact names
DROP POLICY IF EXISTS "Members and admin+ can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Members can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can add team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can remove team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can update team members" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert_admins_or_team_admins" ON public.team_members;
DROP POLICY IF EXISTS "team_members_select_authenticated" ON public.team_members;

DROP POLICY IF EXISTS "Authenticated can create teams with own created_by" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users with team.create permission can create team" ON public.teams;
DROP POLICY IF EXISTS "System admins can delete teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams they are members of" ON public.teams;
DROP POLICY IF EXISTS "teams_delete_minimal" ON public.teams;
DROP POLICY IF EXISTS "teams_delete_owner_or_admins" ON public.teams;
DROP POLICY IF EXISTS "teams_insert_minimal" ON public.teams;
DROP POLICY IF EXISTS "teams_select_minimal" ON public.teams;
DROP POLICY IF EXISTS "teams_update_minimal" ON public.teams;
DROP POLICY IF EXISTS "teams_update_owner_or_admins" ON public.teams;

-- Drop the problematic function with CASCADE
DROP FUNCTION IF EXISTS public.has_team_permission(bigint, text) CASCADE;

-- Create simple, working policies for teams
CREATE POLICY "view_teams_authenticated" 
ON public.teams 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "create_teams_admin" 
ON public.teams 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_user'::app_role) OR
    has_role(auth.uid(), 'system_admin'::app_role)
  )
);

-- Create simple, working policies for team_members  
CREATE POLICY "view_team_members_authenticated" 
ON public.team_members 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "create_team_members_admin" 
ON public.team_members 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_user'::app_role) OR
    has_role(auth.uid(), 'system_admin'::app_role)
  )
);