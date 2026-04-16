-- Clean up all existing policies and create fresh ones

-- Drop all existing policies on teams and team_members
DROP POLICY IF EXISTS "All authenticated users can view teams" ON public.teams;
DROP POLICY IF EXISTS "Admins can create teams" ON public.teams;
DROP POLICY IF EXISTS "Admins can update teams" ON public.teams;
DROP POLICY IF EXISTS "Super users can manage teams" ON public.teams;
DROP POLICY IF EXISTS "System admins can manage all teams" ON public.teams;
DROP POLICY IF EXISTS "Multiple Overlapping Policies" ON public.teams;

DROP POLICY IF EXISTS "All authenticated users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can add team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can add members to their teams" ON public.team_members;
DROP POLICY IF EXISTS "Super users can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "System admins can manage all team members" ON public.team_members;

-- Drop the problematic has_team_permission function if it exists
DROP FUNCTION IF EXISTS public.has_team_permission(bigint, text) CASCADE;

-- Create clean, working policies
CREATE POLICY "teams_select_authenticated" 
ON public.teams 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "teams_insert_admins" 
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

CREATE POLICY "teams_update_admins" 
ON public.teams 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_user'::app_role) OR
    has_role(auth.uid(), 'system_admin'::app_role)
  )
);

CREATE POLICY "team_members_select_authenticated" 
ON public.team_members 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "team_members_insert_admins" 
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