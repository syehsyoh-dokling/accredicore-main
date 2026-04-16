-- Fix infinite recursion in team_members RLS policies
-- Drop the problematic policy
DROP POLICY IF EXISTS "Team Member Access" ON public.team_members;

-- Create a simpler policy without recursion
CREATE POLICY "Users can view team members of their teams" 
ON public.team_members 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);