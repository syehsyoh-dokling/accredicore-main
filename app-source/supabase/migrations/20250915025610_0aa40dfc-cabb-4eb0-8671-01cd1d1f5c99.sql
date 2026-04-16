-- Fix teams and team_members RLS policies to use the correct has_role function

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can create teams" ON public.teams;
DROP POLICY IF EXISTS "Admins can update teams" ON public.teams;
DROP POLICY IF EXISTS "Admins can add team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can add members to their teams" ON public.team_members;

-- Create correct policies using the existing has_role function
CREATE POLICY "Admins can create teams" 
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

CREATE POLICY "Admins can update teams" 
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

-- Create correct policies for team_members
CREATE POLICY "Admins can add team members" 
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

CREATE POLICY "Team admins can add members to their teams" 
ON public.team_members 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (
    team_id IN (
      SELECT tm.team_id 
      FROM public.team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'admin' 
      AND tm.is_active = true
    )
  )
);