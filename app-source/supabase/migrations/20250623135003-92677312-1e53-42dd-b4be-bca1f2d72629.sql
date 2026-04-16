
-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('system_admin', 'super_user', 'admin', 'user');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create policies table (similar to PocketBase collections)
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create compliance_records table
CREATE TABLE public.compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES public.policies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES public.profiles(id),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create system_settings table (make created_by nullable for initial setup)
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  ORDER BY 
    CASE role 
      WHEN 'system_admin' THEN 1
      WHEN 'super_user' THEN 2
      WHEN 'admin' THEN 3
      WHEN 'user' THEN 4
    END
  LIMIT 1
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "System admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Super users can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'super_user'));

-- RLS Policies for user_roles
CREATE POLICY "System admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Super users can view roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'super_user'));

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for policies
CREATE POLICY "All authenticated users can view policies" ON public.policies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System admins can manage all policies" ON public.policies
  FOR ALL USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Super users can manage policies" ON public.policies
  FOR ALL USING (public.has_role(auth.uid(), 'super_user'));

CREATE POLICY "Admins can create and update policies" ON public.policies
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update policies" ON public.policies
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for compliance_records
CREATE POLICY "All authenticated users can view compliance records" ON public.compliance_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System admins can manage all compliance records" ON public.compliance_records
  FOR ALL USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Super users can manage compliance records" ON public.compliance_records
  FOR ALL USING (public.has_role(auth.uid(), 'super_user'));

CREATE POLICY "Users can create compliance records" ON public.compliance_records
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their assigned records" ON public.compliance_records
  FOR UPDATE USING (auth.uid() = assigned_to OR auth.uid() = created_by);

-- RLS Policies for audit_logs
CREATE POLICY "System admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Super users can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'super_user'));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for system_settings
CREATE POLICY "System admins can manage system settings" ON public.system_settings
  FOR ALL USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Super users can view system settings" ON public.system_settings
  FOR SELECT USING (public.has_role(auth.uid(), 'super_user'));

-- Insert some initial system settings (without created_by for now)
INSERT INTO public.system_settings (key, value, description) 
VALUES 
  ('app_name', '"Compliance Hub"', 'Application name'),
  ('max_file_size', '10485760', 'Maximum file upload size in bytes'),
  ('allowed_file_types', '["pdf", "doc", "docx", "jpg", "png"]', 'Allowed file types for uploads')
ON CONFLICT (key) DO NOTHING;
