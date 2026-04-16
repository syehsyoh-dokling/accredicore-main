-- Drop all existing policies on profiles to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "System admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Team leaders can view team members" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own records" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own records" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own records" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Create simple, non-recursive policies
CREATE POLICY "users_view_own_profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "super_users_view_all" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'super_user'::app_role));

CREATE POLICY "system_admins_view_all" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "users_update_own" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_delete_own" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);