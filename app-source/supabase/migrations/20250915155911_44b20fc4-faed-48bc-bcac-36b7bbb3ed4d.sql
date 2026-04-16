-- Drop all policies that depend on has_team_permission function

-- Teams policies
DROP POLICY IF EXISTS "Users can view teams they are members of" ON public.teams;
DROP POLICY IF EXISTS "Team admins and system admins can update teams" ON public.teams;
DROP POLICY IF EXISTS "Team admins can update teams" ON public.teams;

-- Team members policies  
DROP POLICY IF EXISTS "Members can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Members and admin+ can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can add team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can remove team members" ON public.team_members;

-- Now drop the function
DROP FUNCTION IF EXISTS public.has_team_permission(bigint, text);

-- Create simple RLS policies that work
CREATE POLICY "All authenticated users can view teams" 
ON public.teams 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can view team members" 
ON public.team_members 
FOR SELECT 
USING (auth.uid() IS NOT NULL);