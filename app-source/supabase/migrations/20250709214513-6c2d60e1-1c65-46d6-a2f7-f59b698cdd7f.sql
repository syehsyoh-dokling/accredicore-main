-- Create roles enum with all required roles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role_extended') THEN
        CREATE TYPE public.app_role_extended AS ENUM ('system_admin', 'super_user', 'admin', 'user', 'team', 'client');
    END IF;
END $$;

-- Update existing user_roles table to use new extended enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role_extended USING role::text::app_role_extended;

-- Update the get_current_user_role function to work with new roles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role_extended
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  ORDER BY 
    CASE role 
      WHEN 'system_admin' THEN 1
      WHEN 'super_user' THEN 2
      WHEN 'admin' THEN 3
      WHEN 'team' THEN 4
      WHEN 'user' THEN 5
      WHEN 'client' THEN 6
    END
  LIMIT 1
$function$;

-- Update has_role function for new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role_extended)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Add additional fields to profiles table for enhanced user management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department_id INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT false;

-- Create departments table for organization structure
CREATE TABLE IF NOT EXISTS public.departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create policies for departments
CREATE POLICY "All authenticated users can view departments" 
ON public.departments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage departments" 
ON public.departments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role_extended) OR has_role(auth.uid(), 'super_user'::app_role_extended) OR has_role(auth.uid(), 'system_admin'::app_role_extended));

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on password reset tokens
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for password reset tokens
CREATE POLICY "Users can view their own reset tokens" 
ON public.password_reset_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage reset tokens" 
ON public.password_reset_tokens 
FOR ALL 
USING (has_role(auth.uid(), 'system_admin'::app_role_extended));

-- Update the handle_new_user function to work with new role enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
    );
    
    -- Assign default user role using new enum
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::app_role_extended);
    
    RETURN NEW;
END;
$function$;

-- Create function to update last login
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.profiles 
    SET last_login = now() 
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$function$;

-- Create trigger for updating last login (this will be triggered by application logic)
-- Note: We can't directly trigger on auth.sessions as it's in a protected schema

-- Update RLS policies to work with new roles
CREATE POLICY "Team leaders can view team members" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'team'::app_role_extended) AND department_id = (SELECT department_id FROM public.profiles WHERE id = auth.uid()));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);