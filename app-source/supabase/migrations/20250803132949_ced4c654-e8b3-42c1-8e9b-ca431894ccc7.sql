-- Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES auth.users(id),
  parent_department_id INTEGER REFERENCES public.departments(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- RLS policies for departments
CREATE POLICY "All authenticated users can view departments" 
ON public.departments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage departments" 
ON public.departments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_user'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

-- Create controls table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.controls (
  id BIGSERIAL PRIMARY KEY,
  control_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL,
  category TEXT,
  sub_category TEXT,
  compliance_standards TEXT[],
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.controls ENABLE ROW LEVEL SECURITY;

-- RLS policies for controls
CREATE POLICY "All authenticated users can view controls" 
ON public.controls 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage controls" 
ON public.controls 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_user'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

-- Update profiles table to include department_id
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES public.departments(id);

-- Update user_roles to allow multiple roles per user but keep unique constraint
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_name TEXT NOT NULL,
  resource_type TEXT, -- 'department', 'team', 'control', etc.
  resource_id TEXT,   -- ID of the specific resource
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, permission_name, resource_type, resource_id)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_permissions
CREATE POLICY "Users can view their own permissions" 
ON public.user_permissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System admins can manage all permissions" 
ON public.user_permissions 
FOR ALL 
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Super users can manage permissions" 
ON public.user_permissions 
FOR ALL 
USING (has_role(auth.uid(), 'super_user'::app_role));

-- Function to check specific permissions
CREATE OR REPLACE FUNCTION public.has_permission(
  _user_id UUID,
  _permission TEXT,
  _resource_type TEXT DEFAULT NULL,
  _resource_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND permission_name = _permission
      AND (_resource_type IS NULL OR resource_type = _resource_type)
      AND (_resource_id IS NULL OR resource_id = _resource_id)
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Insert some default departments
INSERT INTO public.departments (name, description) VALUES
  ('Quality Management', 'Quality assurance and compliance department'),
  ('Information Technology', 'IT infrastructure and systems management'),
  ('Human Resources', 'Staff management and development'),
  ('Medical Services', 'Clinical care and medical operations'),
  ('Administrative Services', 'General administration and support')
ON CONFLICT DO NOTHING;