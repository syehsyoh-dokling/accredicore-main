-- Add UPDATE policy for teams to allow admins to edit teams
CREATE POLICY "update_teams_admin" 
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