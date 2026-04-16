-- Fix the has_team_permission function and clean up problematic policies

-- Drop all policies that reference has_team_permission or role_management
DROP POLICY IF EXISTS "Members can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Members and admin+ can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can add team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can remove team members" ON public.team_members;

-- Drop the problematic has_team_permission function
DROP FUNCTION IF EXISTS public.has_team_permission(bigint, text);

-- Create simpler RLS policies for team_members that don't reference non-existent schemas
CREATE POLICY "All authenticated users can view team members" 
ON public.team_members 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view team members" 
ON public.team_members 
FOR SELECT 
TO authenticated
USING (true);

-- Ensure only the correct INSERT policies exist for team_members
-- (The policies from the previous migration should be sufficient)

-- Add a simple SELECT policy for teams
CREATE POLICY "All authenticated users can view teams" 
ON public.teams 
FOR SELECT 
USING (auth.uid() IS NOT NULL);