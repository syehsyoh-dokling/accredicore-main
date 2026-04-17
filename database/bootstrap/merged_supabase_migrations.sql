-- Merged Supabase migrations for accredicore


-- ============================================
-- FILE: 20250623135003-92677312-1e53-42dd-b4be-bca1f2d72629.sql
-- ============================================


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



-- ============================================
-- FILE: 20250624113123-54e32a42-7628-4352-98a7-6ae789fd4971.sql
-- ============================================


-- First, let's check if policy_templates table exists, if not create it
CREATE TABLE IF NOT EXISTS public.policy_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  content TEXT NOT NULL,
  content_ar TEXT,
  category TEXT NOT NULL,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Update existing teams table to add missing columns
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS name_ar TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing team_members table to add missing columns
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS permissions TEXT[],
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_policy_templates_category ON public.policy_templates(category);
CREATE INDEX IF NOT EXISTS idx_policy_templates_active ON public.policy_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_teams_department ON public.teams(department);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- Enable RLS on tables
ALTER TABLE public.policy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for policy_templates
DROP POLICY IF EXISTS "Everyone can view active policy templates" ON public.policy_templates;
CREATE POLICY "Everyone can view active policy templates" ON public.policy_templates
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "System admins can manage all policy templates" ON public.policy_templates;
CREATE POLICY "System admins can manage all policy templates" ON public.policy_templates
  FOR ALL USING (public.has_role(auth.uid(), 'system_admin'));

DROP POLICY IF EXISTS "Super users can manage policy templates" ON public.policy_templates;
CREATE POLICY "Super users can manage policy templates" ON public.policy_templates
  FOR ALL USING (public.has_role(auth.uid(), 'super_user'));

DROP POLICY IF EXISTS "Admins can create policy templates" ON public.policy_templates;
CREATE POLICY "Admins can create policy templates" ON public.policy_templates
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for teams
DROP POLICY IF EXISTS "All authenticated users can view teams" ON public.teams;
CREATE POLICY "All authenticated users can view teams" ON public.teams
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "System admins can manage all teams" ON public.teams;
CREATE POLICY "System admins can manage all teams" ON public.teams
  FOR ALL USING (public.has_role(auth.uid(), 'system_admin'));

DROP POLICY IF EXISTS "Super users can manage teams" ON public.teams;
CREATE POLICY "Super users can manage teams" ON public.teams
  FOR ALL USING (public.has_role(auth.uid(), 'super_user'));

DROP POLICY IF EXISTS "Admins can create teams" ON public.teams;
CREATE POLICY "Admins can create teams" ON public.teams
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for team_members
DROP POLICY IF EXISTS "Users can view their team memberships" ON public.team_members;
CREATE POLICY "Users can view their team memberships" ON public.team_members
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Team members can view other team members" ON public.team_members;
CREATE POLICY "Team members can view other team members" ON public.team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System admins can manage all team members" ON public.team_members;
CREATE POLICY "System admins can manage all team members" ON public.team_members
  FOR ALL USING (public.has_role(auth.uid(), 'system_admin'));

DROP POLICY IF EXISTS "Super users can manage team members" ON public.team_members;
CREATE POLICY "Super users can manage team members" ON public.team_members
  FOR ALL USING (public.has_role(auth.uid(), 'super_user'));

-- Insert some default policy templates (only if table is empty)
INSERT INTO public.policy_templates (title, title_ar, description, description_ar, content, content_ar, category, tags) 
SELECT 'Infection Control Standard Template', 'Ù‚Ø§Ù„Ø¨ Ù…Ø¹Ø§ÙŠÙŠØ± Ù…ÙƒØ§ÙØ­Ø© Ø§Ù„Ø¹Ø¯ÙˆÙ‰', 'Standard template for infection control policies', 'Ù‚Ø§Ù„Ø¨ Ù…Ø¹ÙŠØ§Ø±ÙŠ Ù„Ø³ÙŠØ§Ø³Ø§Øª Ù…ÙƒØ§ÙØ­Ø© Ø§Ù„Ø¹Ø¯ÙˆÙ‰', 
'# Infection Control Policy

## Purpose
This policy establishes guidelines for infection prevention and control.

## Scope
Applies to all healthcare personnel.

## Procedures
1. Hand hygiene protocols
2. Personal protective equipment
3. Environmental cleaning
4. Waste management',
'# Ø³ÙŠØ§Ø³Ø© Ù…ÙƒØ§ÙØ­Ø© Ø§Ù„Ø¹Ø¯ÙˆÙ‰

## Ø§Ù„Ù‡Ø¯Ù
ØªØ­Ø¯Ø¯ Ù‡Ø°Ù‡ Ø§Ù„Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ù…Ø¨Ø§Ø¯Ø¦ Ø§Ù„ØªÙˆØ¬ÙŠÙ‡ÙŠØ© Ù„Ù…Ù†Ø¹ ÙˆÙ…ÙƒØ§ÙØ­Ø© Ø§Ù„Ø¹Ø¯ÙˆÙ‰.

## Ø§Ù„Ù†Ø·Ø§Ù‚
ØªÙ†Ø·Ø¨Ù‚ Ø¹Ù„Ù‰ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¹Ø§Ù…Ù„ÙŠÙ† ÙÙŠ Ø§Ù„Ø±Ø¹Ø§ÙŠØ© Ø§Ù„ØµØ­ÙŠØ©.

## Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª
1. Ø¨Ø±ÙˆØªÙˆÙƒÙˆÙ„Ø§Øª Ù†Ø¸Ø§ÙØ© Ø§Ù„ÙŠØ¯ÙŠÙ†
2. Ù…Ø¹Ø¯Ø§Øª Ø§Ù„Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø´Ø®ØµÙŠØ©
3. Ø§Ù„ØªÙ†Ø¸ÙŠÙ Ø§Ù„Ø¨ÙŠØ¦ÙŠ
4. Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù†ÙØ§ÙŠØ§Øª',
'infection-control', ARRAY['CBAHI', 'JCI', 'infection', 'safety']
WHERE NOT EXISTS (SELECT 1 FROM public.policy_templates WHERE category = 'infection-control');

INSERT INTO public.policy_templates (title, title_ar, description, description_ar, content, content_ar, category, tags) 
SELECT 'Medication Management Template', 'Ù‚Ø§Ù„Ø¨ Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¯ÙˆÙŠØ©', 'Template for medication management policies', 'Ù‚Ø§Ù„Ø¨ Ù„Ø³ÙŠØ§Ø³Ø§Øª Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¯ÙˆÙŠØ©',
'# Medication Management Policy

## Purpose
To ensure safe medication practices.

## Scope
All medication-related activities.

## Key Areas
1. Prescribing
2. Dispensing
3. Administration
4. Monitoring',
'# Ø³ÙŠØ§Ø³Ø© Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¯ÙˆÙŠØ©

## Ø§Ù„Ù‡Ø¯Ù
Ø¶Ù…Ø§Ù† Ù…Ù…Ø§Ø±Ø³Ø§Øª Ø¢Ù…Ù†Ø© Ù„Ù„Ø£Ø¯ÙˆÙŠØ©.

## Ø§Ù„Ù†Ø·Ø§Ù‚
Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø£Ù†Ø´Ø·Ø© Ø§Ù„Ù…ØªØ¹Ù„Ù‚Ø© Ø¨Ø§Ù„Ø£Ø¯ÙˆÙŠØ©.

## Ø§Ù„Ù…Ø¬Ø§Ù„Ø§Øª Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©
1. Ø§Ù„ÙˆØµÙ
2. Ø§Ù„ØµØ±Ù
3. Ø§Ù„Ø¥Ø¹Ø·Ø§Ø¡
4. Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø©',
'pharmacy', ARRAY['medication', 'safety', 'pharmacy']
WHERE NOT EXISTS (SELECT 1 FROM public.policy_templates WHERE category = 'pharmacy');

INSERT INTO public.policy_templates (title, title_ar, description, description_ar, content, content_ar, category, tags) 
SELECT 'Quality Management Template', 'Ù‚Ø§Ù„Ø¨ Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¬ÙˆØ¯Ø©', 'Template for quality management policies', 'Ù‚Ø§Ù„Ø¨ Ù„Ø³ÙŠØ§Ø³Ø§Øª Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¬ÙˆØ¯Ø©',
'# Quality Management Policy

## Purpose
To establish a framework for continuous quality improvement.

## Scope
All organizational processes.

## Components
1. Quality planning
2. Quality control
3. Quality assurance
4. Continuous improvement',
'# Ø³ÙŠØ§Ø³Ø© Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¬ÙˆØ¯Ø©

## Ø§Ù„Ù‡Ø¯Ù
Ø¥Ù†Ø´Ø§Ø¡ Ø¥Ø·Ø§Ø± Ù„Ù„ØªØ­Ø³ÙŠÙ† Ø§Ù„Ù…Ø³ØªÙ…Ø± Ù„Ù„Ø¬ÙˆØ¯Ø©.

## Ø§Ù„Ù†Ø·Ø§Ù‚
Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„ØªÙ†Ø¸ÙŠÙ…ÙŠØ©.

## Ø§Ù„Ù…ÙƒÙˆÙ†Ø§Øª
1. ØªØ®Ø·ÙŠØ· Ø§Ù„Ø¬ÙˆØ¯Ø©
2. Ù…Ø±Ø§Ù‚Ø¨Ø© Ø§Ù„Ø¬ÙˆØ¯Ø©
3. Ø¶Ù…Ø§Ù† Ø§Ù„Ø¬ÙˆØ¯Ø©
4. Ø§Ù„ØªØ­Ø³ÙŠÙ† Ø§Ù„Ù…Ø³ØªÙ…Ø±',
'quality', ARRAY['quality', 'improvement', 'management']
WHERE NOT EXISTS (SELECT 1 FROM public.policy_templates WHERE category = 'quality');

-- Create function to get user teams (fixed return types to match existing table structure)
CREATE OR REPLACE FUNCTION public.get_user_teams(user_id UUID)
RETURNS TABLE (
  team_id BIGINT,
  team_name TEXT,
  team_description TEXT,
  user_role TEXT,
  member_count BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    t.id as team_id,
    t.name as team_name,
    t.description as team_description,
    tm.role as user_role,
    (SELECT COUNT(*) FROM public.team_members tm2 WHERE tm2.team_id = t.id AND tm2.is_active = true) as member_count
  FROM public.teams t
  JOIN public.team_members tm ON t.id = tm.team_id
  WHERE tm.user_id = get_user_teams.user_id
    AND tm.is_active = true
    AND t.is_active = true;
$$;



-- ============================================
-- FILE: 20250625132154-04d934a1-a209-4599-b76c-6fd7e96286e7.sql
-- ============================================


-- Create tasks table for task assignment and tracking
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  assigned_by UUID REFERENCES public.profiles(id) NOT NULL,
  team_id BIGINT REFERENCES public.teams(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task progress tracking table
CREATE TABLE public.task_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task comments table for communication
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all task-related tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for tasks table
CREATE POLICY "Users can view tasks assigned to them or their teams" 
  ON public.tasks 
  FOR SELECT 
  USING (
    assigned_to = auth.uid() OR
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND is_active = true
    ) OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_user') OR
    public.has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Admins and above can create tasks" 
  ON public.tasks 
  FOR INSERT 
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_user') OR
    public.has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Admins and above can update tasks" 
  ON public.tasks 
  FOR UPDATE 
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_user') OR
    public.has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Admins and above can delete tasks" 
  ON public.tasks 
  FOR DELETE 
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_user') OR
    public.has_role(auth.uid(), 'system_admin')
  );

-- RLS policies for task_progress table
CREATE POLICY "Users can view progress for their tasks or if admin+" 
  ON public.task_progress 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR
    task_id IN (
      SELECT id FROM public.tasks 
      WHERE assigned_to = auth.uid() OR assigned_by = auth.uid()
    ) OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_user') OR
    public.has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Users can create progress for their assigned tasks" 
  ON public.task_progress 
  FOR INSERT 
  WITH CHECK (
    task_id IN (
      SELECT id FROM public.tasks 
      WHERE assigned_to = auth.uid()
    ) OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_user') OR
    public.has_role(auth.uid(), 'system_admin')
  );

-- RLS policies for task_comments table  
CREATE POLICY "Users can view comments for their tasks or if admin+" 
  ON public.task_comments 
  FOR SELECT 
  USING (
    task_id IN (
      SELECT id FROM public.tasks 
      WHERE assigned_to = auth.uid() OR assigned_by = auth.uid() OR
      team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    ) OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_user') OR
    public.has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Users can create comments for their tasks" 
  ON public.task_comments 
  FOR INSERT 
  WITH CHECK (
    task_id IN (
      SELECT id FROM public.tasks 
      WHERE assigned_to = auth.uid() OR assigned_by = auth.uid() OR
      team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    ) OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_user') OR
    public.has_role(auth.uid(), 'system_admin')
  );

-- Create indexes for better performance
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_team_id ON public.tasks(team_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_task_progress_task_id ON public.task_progress(task_id);
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);



-- ============================================
-- FILE: 20250709214513-6c2d60e1-1c65-46d6-a2f7-f59b698cdd7f.sql
-- ============================================

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



-- ============================================
-- FILE: 20250709214755-bcf0260b-3146-4f59-b046-1f1d7f97e8e6.sql
-- ============================================

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Create roles enum with all required roles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role_extended') THEN
        CREATE TYPE public.app_role_extended AS ENUM ('system_admin', 'super_user', 'admin', 'user', 'team', 'client');
    END IF;
END $$;

-- Update existing user_roles table to use new extended enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role_extended USING role::text::app_role_extended;

-- Create the get_current_user_role function with new enum
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

-- Create has_role function for new enum
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



-- ============================================
-- FILE: 20250709214824-258fd63e-fdc0-4c63-9b7b-bf54a639de38.sql
-- ============================================

-- First, let's add the new roles to the existing enum instead of creating a new one
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';

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
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_user'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

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
USING (has_role(auth.uid(), 'system_admin'::app_role));

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

-- Add new policies for team leaders
CREATE POLICY "Team leaders can view team members" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'team'::app_role) AND department_id = (SELECT department_id FROM public.profiles WHERE id = auth.uid()));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);

-- Insert some sample departments
INSERT INTO public.departments (name, description) VALUES 
('Human Resources', 'Employee management and organizational development'),
('Information Technology', 'Technology infrastructure and support'),
('Quality Assurance', 'Quality control and compliance management'),
('Finance', 'Financial operations and accounting'),
('Operations', 'Daily operations and logistics')
ON CONFLICT DO NOTHING;



-- ============================================
-- FILE: 20250709214836-194bd8e2-d9ce-42d7-83b1-0dc21dc153f3.sql
-- ============================================

-- First migration: Add new enum values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';



-- ============================================
-- FILE: 20250710013433-5c9f9b57-42e3-4895-a165-cf61eb09ebfc.sql
-- ============================================

-- Second migration: Add new fields and tables
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
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_user'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

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
USING (has_role(auth.uid(), 'system_admin'::app_role));

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

-- Add new policies for team leaders
CREATE POLICY "Team leaders can view team members" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'team'::app_role) AND department_id = (SELECT department_id FROM public.profiles WHERE id = auth.uid()));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);

-- Insert some sample departments
INSERT INTO public.departments (name, description) VALUES 
('Human Resources', 'Employee management and organizational development'),
('Information Technology', 'Technology infrastructure and support'),
('Quality Assurance', 'Quality control and compliance management'),
('Finance', 'Financial operations and accounting'),
('Operations', 'Daily operations and logistics')
ON CONFLICT DO NOTHING;



-- ============================================
-- FILE: 20250711011649-fa48bc5e-7d91-49b3-9c9e-3d1078fa9002.sql
-- ============================================

-- Fix the infinite recursion in profiles RLS policies
-- First drop the problematic policies
DROP POLICY IF EXISTS "Team leaders can view team members" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own records" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own records" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own records" ON public.profiles;

-- Create simpler, non-recursive policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Super users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'super_user'::app_role));

CREATE POLICY "System admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);

-- Create audit_schedules table for the scheduling functionality
CREATE TABLE public.audit_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  audit_type TEXT NOT NULL CHECK (audit_type IN ('internal', 'external')),
  department TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_days INTEGER DEFAULT 1,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  auditor_name TEXT,
  auditor_company TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit_schedules
ALTER TABLE public.audit_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_schedules
CREATE POLICY "Users can view audits assigned to them or created by them" 
ON public.audit_schedules 
FOR SELECT 
USING (
  auth.uid() = created_by OR 
  auth.uid() = assigned_to OR
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

CREATE POLICY "Admins and above can create audit schedules" 
ON public.audit_schedules 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

CREATE POLICY "Users can update audits they created or are assigned to" 
ON public.audit_schedules 
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  auth.uid() = assigned_to OR
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

CREATE POLICY "Admins and above can delete audit schedules" 
ON public.audit_schedules 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_audit_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_audit_schedules_updated_at
    BEFORE UPDATE ON public.audit_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_audit_schedules_updated_at();



-- ============================================
-- FILE: 20250711011720-20e14f48-c241-40d1-9331-142da0731d71.sql
-- ============================================

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



-- ============================================
-- FILE: 20250711011821-d0b81176-e000-40d6-8d71-5cb96f0de98e.sql
-- ============================================

-- Create audit_schedules table for the scheduling functionality
CREATE TABLE public.audit_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  audit_type TEXT NOT NULL CHECK (audit_type IN ('internal', 'external')),
  department TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_days INTEGER DEFAULT 1,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  auditor_name TEXT,
  auditor_company TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit_schedules
ALTER TABLE public.audit_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_schedules
CREATE POLICY "users_view_assigned_audits" 
ON public.audit_schedules 
FOR SELECT 
USING (
  auth.uid() = created_by OR 
  auth.uid() = assigned_to OR
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

CREATE POLICY "admins_create_audits" 
ON public.audit_schedules 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

CREATE POLICY "users_update_assigned_audits" 
ON public.audit_schedules 
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  auth.uid() = assigned_to OR
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

CREATE POLICY "admins_delete_audits" 
ON public.audit_schedules 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_audit_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_audit_schedules_updated_at
    BEFORE UPDATE ON public.audit_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_audit_schedules_updated_at();



-- ============================================
-- FILE: 20250712115004-784a0c36-be43-4fe3-a943-1a438828adfd.sql
-- ============================================

-- Enable realtime for tasks table
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- Enable realtime for task_comments and task_progress
ALTER TABLE public.task_comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;

ALTER TABLE public.task_progress REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_progress;

-- Create notifications table for real-time notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('task_assigned', 'task_updated', 'task_completed', 'comment_added', 'deadline_reminder')),
  related_task_id UUID REFERENCES public.tasks(id),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "users_view_own_notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "system_create_notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "users_update_own_notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to send notifications when tasks are assigned or updated
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify when task is assigned to a user
    IF TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, related_task_id)
        VALUES (
            NEW.assigned_to,
            'New Task Assigned',
            'You have been assigned a new task: ' || NEW.title,
            'task_assigned',
            NEW.id
        );
    END IF;
    
    -- Notify when task assignment changes
    IF TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, related_task_id)
        VALUES (
            NEW.assigned_to,
            'Task Assigned to You',
            'You have been assigned to task: ' || NEW.title,
            'task_assigned',
            NEW.id
        );
    END IF;
    
    -- Notify when task status changes to completed
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'completed' THEN
        -- Notify the task creator
        INSERT INTO public.notifications (user_id, title, message, type, related_task_id)
        VALUES (
            NEW.assigned_by,
            'Task Completed',
            'Task "' || NEW.title || '" has been completed',
            'task_completed',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task notifications
CREATE TRIGGER task_notification_trigger
    AFTER INSERT OR UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_task_assignment();

-- Create function to notify when comments are added
CREATE OR REPLACE FUNCTION public.notify_task_comment()
RETURNS TRIGGER AS $$
DECLARE
    task_record RECORD;
BEGIN
    -- Get task details
    SELECT * INTO task_record FROM public.tasks WHERE id = NEW.task_id;
    
    -- Notify task assignee if different from commenter
    IF task_record.assigned_to IS NOT NULL AND task_record.assigned_to != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, title, message, type, related_task_id)
        VALUES (
            task_record.assigned_to,
            'New Comment on Task',
            'A comment was added to task: ' || task_record.title,
            'comment_added',
            NEW.task_id
        );
    END IF;
    
    -- Notify task creator if different from commenter and assignee
    IF task_record.assigned_by != NEW.user_id AND task_record.assigned_by != task_record.assigned_to THEN
        INSERT INTO public.notifications (user_id, title, message, type, related_task_id)
        VALUES (
            task_record.assigned_by,
            'New Comment on Task',
            'A comment was added to task: ' || task_record.title,
            'comment_added',
            NEW.task_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment notifications
CREATE TRIGGER task_comment_notification_trigger
    AFTER INSERT ON public.task_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_task_comment();



-- ============================================
-- FILE: 20250712115028-1f65d8fb-b09a-4a0b-9617-09573db1339f.sql
-- ============================================

-- Enable realtime for existing tables
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

ALTER TABLE public.task_comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;

ALTER TABLE public.task_progress REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_progress;

-- Create function to send notifications when tasks are assigned or updated
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify when task is assigned to a user
    IF TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL THEN
        -- We'll handle notifications through the frontend for now
        -- since we don't have a notifications table yet
        NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task notifications  
CREATE TRIGGER task_notification_trigger
    AFTER INSERT OR UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_task_assignment();



-- ============================================
-- FILE: 20250713101148-7e34f771-3158-4d86-9c79-8cf9f4d4dddc.sql
-- ============================================

-- Create facilities table
CREATE TABLE public.facilities (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  manager_id UUID REFERENCES auth.users(id),
  department_id INTEGER REFERENCES public.departments(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on facilities
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

-- Create policies for facilities
CREATE POLICY "All authenticated users can view active facilities"
ON public.facilities FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage facilities"
ON public.facilities FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_user'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

-- Create control-policy relationships table
CREATE TABLE public.control_policies (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  control_id BIGINT NOT NULL REFERENCES public.controls(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(control_id, policy_id)
);

-- Enable RLS on control_policies
ALTER TABLE public.control_policies ENABLE ROW LEVEL SECURITY;

-- Create policies for control_policies
CREATE POLICY "All authenticated users can view control-policy relationships"
ON public.control_policies FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage control-policy relationships"
ON public.control_policies FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_user'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

-- Create view for controls matrix status
CREATE VIEW public.controls_matrix_view AS
SELECT 
  f.id as facility_id,
  f.name as facility_name,
  d.name as department_name,
  c.id as control_id,
  c.control_number,
  c.title as control_title,
  c.domain,
  c.category,
  COALESCE(ap.status, 'not_started') as status,
  COALESCE(ap.progress_percentage, 0) as progress_percentage,
  ap.due_date,
  ap.completed_at,
  ap.user_id as assigned_user_id,
  p.full_name as assigned_user_name
FROM public.facilities f
CROSS JOIN public.controls c
LEFT JOIN public.departments d ON f.department_id = d.id
LEFT JOIN public.audit_progress ap ON ap.facility_id = f.id AND ap.control_id = c.id
LEFT JOIN public.profiles p ON ap.user_id = p.id
WHERE f.is_active = true;

-- Create function to calculate facility compliance percentage
CREATE OR REPLACE FUNCTION public.get_facility_compliance(facility_id BIGINT)
RETURNS NUMERIC
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT ROUND(
    COALESCE(
      (COUNT(CASE WHEN ap.status = 'completed' THEN 1 END) * 100.0) / NULLIF(COUNT(c.id), 0),
      0
    ), 2
  )
  FROM public.controls c
  LEFT JOIN public.audit_progress ap ON ap.control_id = c.id AND ap.facility_id = get_facility_compliance.facility_id
$$;

-- Create function to get department compliance summary
CREATE OR REPLACE FUNCTION public.get_department_compliance_summary(dept_id INTEGER DEFAULT NULL)
RETURNS TABLE(
  department_name TEXT,
  total_controls BIGINT,
  completed_controls BIGINT,
  in_progress_controls BIGINT,
  not_started_controls BIGINT,
  compliance_percentage NUMERIC
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    d.name as department_name,
    COUNT(DISTINCT c.id) as total_controls,
    COUNT(CASE WHEN ap.status = 'completed' THEN 1 END) as completed_controls,
    COUNT(CASE WHEN ap.status = 'in_progress' THEN 1 END) as in_progress_controls,
    COUNT(CASE WHEN ap.status = 'not_started' OR ap.status IS NULL THEN 1 END) as not_started_controls,
    ROUND(
      COALESCE(
        (COUNT(CASE WHEN ap.status = 'completed' THEN 1 END) * 100.0) / NULLIF(COUNT(DISTINCT c.id), 0),
        0
      ), 2
    ) as compliance_percentage
  FROM public.departments d
  CROSS JOIN public.controls c
  LEFT JOIN public.facilities f ON f.department_id = d.id
  LEFT JOIN public.audit_progress ap ON ap.facility_id = f.id AND ap.control_id = c.id
  WHERE (dept_id IS NULL OR d.id = dept_id)
    AND d.is_active = true
    AND (f.is_active IS NULL OR f.is_active = true)
  GROUP BY d.id, d.name
  ORDER BY d.name
$$;

-- Add indexes for better performance
CREATE INDEX idx_facilities_department ON public.facilities(department_id);
CREATE INDEX idx_facilities_manager ON public.facilities(manager_id);
CREATE INDEX idx_control_policies_control ON public.control_policies(control_id);
CREATE INDEX idx_control_policies_policy ON public.control_policies(policy_id);
CREATE INDEX idx_audit_progress_facility_control ON public.audit_progress(facility_id, control_id);

-- Update trigger for facilities
CREATE TRIGGER update_facilities_updated_at
    BEFORE UPDATE ON public.facilities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();



-- ============================================
-- FILE: 20250713101223-36e50dc4-ecb6-4dd2-815e-097b33c68989.sql
-- ============================================

-- Create the missing update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create facilities table
CREATE TABLE public.facilities (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  manager_id UUID REFERENCES auth.users(id),
  department_id INTEGER REFERENCES public.departments(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on facilities
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

-- Create policies for facilities
CREATE POLICY "All authenticated users can view active facilities"
ON public.facilities FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage facilities"
ON public.facilities FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_user'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

-- Create control-policy relationships table
CREATE TABLE public.control_policies (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  control_id BIGINT NOT NULL REFERENCES public.controls(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(control_id, policy_id)
);

-- Enable RLS on control_policies
ALTER TABLE public.control_policies ENABLE ROW LEVEL SECURITY;

-- Create policies for control_policies
CREATE POLICY "All authenticated users can view control-policy relationships"
ON public.control_policies FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage control-policy relationships"
ON public.control_policies FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_user'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

-- Create view for controls matrix status
CREATE VIEW public.controls_matrix_view AS
SELECT 
  f.id as facility_id,
  f.name as facility_name,
  d.name as department_name,
  c.id as control_id,
  c.control_number,
  c.title as control_title,
  c.domain,
  c.category,
  COALESCE(ap.status, 'not_started') as status,
  COALESCE(ap.progress_percentage, 0) as progress_percentage,
  ap.due_date,
  ap.completed_at,
  ap.user_id as assigned_user_id,
  p.full_name as assigned_user_name
FROM public.facilities f
CROSS JOIN public.controls c
LEFT JOIN public.departments d ON f.department_id = d.id
LEFT JOIN public.audit_progress ap ON ap.facility_id = f.id AND ap.control_id = c.id
LEFT JOIN public.profiles p ON ap.user_id = p.id
WHERE f.is_active = true;

-- Create function to calculate facility compliance percentage
CREATE OR REPLACE FUNCTION public.get_facility_compliance(facility_id BIGINT)
RETURNS NUMERIC
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT ROUND(
    COALESCE(
      (COUNT(CASE WHEN ap.status = 'completed' THEN 1 END) * 100.0) / NULLIF(COUNT(c.id), 0),
      0
    ), 2
  )
  FROM public.controls c
  LEFT JOIN public.audit_progress ap ON ap.control_id = c.id AND ap.facility_id = get_facility_compliance.facility_id
$$;

-- Create function to get department compliance summary
CREATE OR REPLACE FUNCTION public.get_department_compliance_summary(dept_id INTEGER DEFAULT NULL)
RETURNS TABLE(
  department_name TEXT,
  total_controls BIGINT,
  completed_controls BIGINT,
  in_progress_controls BIGINT,
  not_started_controls BIGINT,
  compliance_percentage NUMERIC
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    d.name as department_name,
    COUNT(DISTINCT c.id) as total_controls,
    COUNT(CASE WHEN ap.status = 'completed' THEN 1 END) as completed_controls,
    COUNT(CASE WHEN ap.status = 'in_progress' THEN 1 END) as in_progress_controls,
    COUNT(CASE WHEN ap.status = 'not_started' OR ap.status IS NULL THEN 1 END) as not_started_controls,
    ROUND(
      COALESCE(
        (COUNT(CASE WHEN ap.status = 'completed' THEN 1 END) * 100.0) / NULLIF(COUNT(DISTINCT c.id), 0),
        0
      ), 2
    ) as compliance_percentage
  FROM public.departments d
  CROSS JOIN public.controls c
  LEFT JOIN public.facilities f ON f.department_id = d.id
  LEFT JOIN public.audit_progress ap ON ap.facility_id = f.id AND ap.control_id = c.id
  WHERE (dept_id IS NULL OR d.id = dept_id)
    AND d.is_active = true
    AND (f.is_active IS NULL OR f.is_active = true)
  GROUP BY d.id, d.name
  ORDER BY d.name
$$;

-- Add indexes for better performance
CREATE INDEX idx_facilities_department ON public.facilities(department_id);
CREATE INDEX idx_facilities_manager ON public.facilities(manager_id);
CREATE INDEX idx_control_policies_control ON public.control_policies(control_id);
CREATE INDEX idx_control_policies_policy ON public.control_policies(policy_id);
CREATE INDEX idx_audit_progress_facility_control ON public.audit_progress(facility_id, control_id);

-- Update trigger for facilities
CREATE TRIGGER update_facilities_updated_at
    BEFORE UPDATE ON public.facilities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();



-- ============================================
-- FILE: 20250803132949_ced4c654-e8b3-42c1-8e9b-ca431894ccc7.sql
-- ============================================

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



-- ============================================
-- FILE: 20250807112748_aa8af2fd-b177-4b45-b8a5-de5853ce23f5.sql
-- ============================================

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



-- ============================================
-- FILE: 20250808095314_e0735a1b-5ef3-42ee-bd8e-99b21521975b.sql
-- ============================================

-- PHASE 1: Critical Database Security Fixes

-- 1. Remove unused tables that have no RLS policies
DROP TABLE IF EXISTS "Team Members Table" CASCADE;
DROP TABLE IF EXISTS "Team Table" CASCADE;

-- 2. Fix database functions - Add proper search_path security
CREATE OR REPLACE FUNCTION public.get_page_translation(p_page_key text, p_language user_language DEFAULT 'en'::user_language)
RETURNS TABLE(title text, content text, metadata jsonb)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY 
    SELECT 
        pt.title, 
        pt.content, 
        pt.metadata
    FROM public.page_translations pt
    WHERE pt.page_key = p_page_key 
    AND pt.language = p_language;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_access_attempt(p_user_id uuid, p_table_name text, p_operation text, p_access_result text, p_additional_context jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_user_email text;
    v_user_role app_role;
BEGIN
    -- Fetch user details
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = p_user_id;

    SELECT role INTO v_user_role 
    FROM public.profiles 
    WHERE user_id = p_user_id;

    -- Insert audit log
    INSERT INTO public.access_audit_logs (
        user_id, 
        user_email, 
        user_role, 
        table_name, 
        operation, 
        access_result, 
        additional_context
    ) VALUES (
        p_user_id,
        v_user_email,
        v_user_role,
        p_table_name,
        p_operation,
        p_access_result,
        p_additional_context
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_totp_secret()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN encode(gen_random_bytes(20), 'base32');
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_backup_codes(p_user_id uuid)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    backup_codes text[];
BEGIN
    -- Generate 5 unique backup codes
    backup_codes := ARRAY(
        SELECT encode(gen_random_bytes(12), 'hex')
        FROM generate_series(1, 5)
    );

    -- Store backup codes (hashed)
    UPDATE public.mfa_configurations
    SET backup_codes = array(
        SELECT crypt(code, gen_salt('bf'))
        FROM unnest(backup_codes) AS code
    )
    WHERE user_id = p_user_id;

    RETURN backup_codes;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_mfa_token(p_user_id uuid, p_token text, p_method text DEFAULT 'totp'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    mfa_config record;
    is_valid boolean := false;
BEGIN
    -- Fetch MFA configuration
    SELECT * INTO mfa_config
    FROM public.mfa_configurations
    WHERE user_id = p_user_id AND is_mfa_enabled = true;

    -- Check if MFA is enabled
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Method-specific verification
    CASE p_method
        WHEN 'totp' THEN
            -- Use a hypothetical TOTP verification (would typically use an external library)
            is_valid := (
                p_token = public.generate_totp_code(mfa_config.totp_secret) OR
                p_token = ANY(
                    -- Check backup codes (one-time use)
                    SELECT code 
                    FROM unnest(mfa_config.backup_codes) AS code 
                    WHERE crypt(p_token, code) = code
                )
            );

            -- If backup code used, remove it
            IF is_valid AND p_token = ANY(mfa_config.backup_codes) THEN
                UPDATE public.mfa_configurations
                SET backup_codes = array_remove(backup_codes, p_token)
                WHERE user_id = p_user_id;
            END IF;

        WHEN 'sms' THEN
            -- Placeholder for SMS verification logic
            is_valid := false;

        WHEN 'email' THEN
            -- Placeholder for email verification logic
            is_valid := false;

        ELSE
            is_valid := false;
    END CASE;

    -- Update MFA attempt tracking
    IF is_valid THEN
        UPDATE public.mfa_configurations
        SET 
            failed_attempts = 0,
            last_mfa_challenge_time = NOW(),
            lockout_until = NULL
        WHERE user_id = p_user_id;
    ELSE
        UPDATE public.mfa_configurations
        SET 
            failed_attempts = failed_attempts + 1,
            lockout_until = CASE 
                WHEN failed_attempts >= 5 THEN NOW() + INTERVAL '15 minutes'
                ELSE lockout_until 
            END
        WHERE user_id = p_user_id;
    END IF;

    RETURN is_valid;
END;
$function$;

-- 3. Fix inconsistent has_role function - keep only the secure version
DROP FUNCTION IF EXISTS public.has_role(user_id bigint, role_name text);
DROP FUNCTION IF EXISTS public.has_role();

-- Ensure the secure has_role function is properly defined
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- 4. Secure other functions
CREATE OR REPLACE FUNCTION public.generate_access_token(p_user_id uuid, p_duration interval DEFAULT '01:00:00'::interval, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    new_token text;
    token_hash text;
BEGIN
    -- Generate a cryptographically secure token
    new_token := encode(gen_random_bytes(32), 'hex');
    token_hash := crypt(new_token, gen_salt('bf'));

    -- Invalidate previous active tokens for this user
    UPDATE public.access_tokens
    SET is_active = false
    WHERE user_id = p_user_id AND is_active = true;

    -- Insert new token
    INSERT INTO public.access_tokens (
        user_id, 
        token_hash, 
        expires_at, 
        ip_address, 
        user_agent
    ) VALUES (
        p_user_id,
        token_hash,
        NOW() + p_duration,
        p_ip_address,
        p_user_agent
    );

    RETURN new_token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_access_token(p_token text, p_ip_address inet DEFAULT NULL::inet)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    matching_token record;
BEGIN
    -- Find and validate the token
    SELECT 
        user_id, 
        expires_at, 
        is_active,
        ip_address
    INTO matching_token
    FROM public.access_tokens
    WHERE 
        token_hash = crypt(p_token, token_hash) AND
        is_active = true AND
        expires_at > NOW();

    -- Check token validity
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired token';
    END IF;

    -- Optional IP address validation
    IF p_ip_address IS NOT NULL AND matching_token.ip_address IS NOT NULL 
       AND p_ip_address != matching_token.ip_address THEN
        RAISE EXCEPTION 'Token IP mismatch';
    END IF;

    -- Update last used timestamp
    UPDATE public.access_tokens
    SET last_used_at = NOW()
    WHERE token_hash = crypt(p_token, token_hash);

    RETURN matching_token.user_id;
END;
$function$;



-- ============================================
-- FILE: 20250808095431_8a069d67-2620-4d48-961a-f5d4b04afec7.sql
-- ============================================

-- PHASE 1: Critical Database Security Fixes

-- 1. Remove unused tables that have no RLS policies
DROP TABLE IF EXISTS "Team Members Table" CASCADE;
DROP TABLE IF EXISTS "Team Table" CASCADE;

-- 2. Fix database functions - Add proper search_path security
CREATE OR REPLACE FUNCTION public.get_page_translation(p_page_key text, p_language user_language DEFAULT 'en'::user_language)
RETURNS TABLE(title text, content text, metadata jsonb)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY 
    SELECT 
        pt.title, 
        pt.content, 
        pt.metadata
    FROM public.page_translations pt
    WHERE pt.page_key = p_page_key 
    AND pt.language = p_language;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_access_attempt(p_user_id uuid, p_table_name text, p_operation text, p_access_result text, p_additional_context jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_user_email text;
    v_user_role app_role;
BEGIN
    -- Fetch user details
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = p_user_id;

    SELECT role INTO v_user_role 
    FROM public.profiles 
    WHERE user_id = p_user_id;

    -- Insert audit log
    INSERT INTO public.access_audit_logs (
        user_id, 
        user_email, 
        user_role, 
        table_name, 
        operation, 
        access_result, 
        additional_context
    ) VALUES (
        p_user_id,
        v_user_email,
        v_user_role,
        p_table_name,
        p_operation,
        p_access_result,
        p_additional_context
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_totp_secret()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN encode(gen_random_bytes(20), 'base32');
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_backup_codes(p_user_id uuid)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    backup_codes text[];
BEGIN
    -- Generate 5 unique backup codes
    backup_codes := ARRAY(
        SELECT encode(gen_random_bytes(12), 'hex')
        FROM generate_series(1, 5)
    );

    -- Store backup codes (hashed)
    UPDATE public.mfa_configurations
    SET backup_codes = array(
        SELECT crypt(code, gen_salt('bf'))
        FROM unnest(backup_codes) AS code
    )
    WHERE user_id = p_user_id;

    RETURN backup_codes;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_mfa_token(p_user_id uuid, p_token text, p_method text DEFAULT 'totp'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    mfa_config record;
    is_valid boolean := false;
BEGIN
    -- Fetch MFA configuration
    SELECT * INTO mfa_config
    FROM public.mfa_configurations
    WHERE user_id = p_user_id AND is_mfa_enabled = true;

    -- Check if MFA is enabled
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Method-specific verification
    CASE p_method
        WHEN 'totp' THEN
            -- Use a hypothetical TOTP verification (would typically use an external library)
            is_valid := (
                p_token = public.generate_totp_code(mfa_config.totp_secret) OR
                p_token = ANY(
                    -- Check backup codes (one-time use)
                    SELECT code 
                    FROM unnest(mfa_config.backup_codes) AS code 
                    WHERE crypt(p_token, code) = code
                )
            );

            -- If backup code used, remove it
            IF is_valid AND p_token = ANY(mfa_config.backup_codes) THEN
                UPDATE public.mfa_configurations
                SET backup_codes = array_remove(backup_codes, p_token)
                WHERE user_id = p_user_id;
            END IF;

        WHEN 'sms' THEN
            -- Placeholder for SMS verification logic
            is_valid := false;

        WHEN 'email' THEN
            -- Placeholder for email verification logic
            is_valid := false;

        ELSE
            is_valid := false;
    END CASE;

    -- Update MFA attempt tracking
    IF is_valid THEN
        UPDATE public.mfa_configurations
        SET 
            failed_attempts = 0,
            last_mfa_challenge_time = NOW(),
            lockout_until = NULL
        WHERE user_id = p_user_id;
    ELSE
        UPDATE public.mfa_configurations
        SET 
            failed_attempts = failed_attempts + 1,
            lockout_until = CASE 
                WHEN failed_attempts >= 5 THEN NOW() + INTERVAL '15 minutes'
                ELSE lockout_until 
            END
        WHERE user_id = p_user_id;
    END IF;

    RETURN is_valid;
END;
$function$;

-- 3. Fix inconsistent has_role function - keep only the secure version
DROP FUNCTION IF EXISTS public.has_role(user_id bigint, role_name text);
DROP FUNCTION IF EXISTS public.has_role();

-- Ensure the secure has_role function is properly defined
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- 4. Secure other functions
CREATE OR REPLACE FUNCTION public.generate_access_token(p_user_id uuid, p_duration interval DEFAULT '01:00:00'::interval, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    new_token text;
    token_hash text;
BEGIN
    -- Generate a cryptographically secure token
    new_token := encode(gen_random_bytes(32), 'hex');
    token_hash := crypt(new_token, gen_salt('bf'));

    -- Invalidate previous active tokens for this user
    UPDATE public.access_tokens
    SET is_active = false
    WHERE user_id = p_user_id AND is_active = true;

    -- Insert new token
    INSERT INTO public.access_tokens (
        user_id, 
        token_hash, 
        expires_at, 
        ip_address, 
        user_agent
    ) VALUES (
        p_user_id,
        token_hash,
        NOW() + p_duration,
        p_ip_address,
        p_user_agent
    );

    RETURN new_token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_access_token(p_token text, p_ip_address inet DEFAULT NULL::inet)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    matching_token record;
BEGIN
    -- Find and validate the token
    SELECT 
        user_id, 
        expires_at, 
        is_active,
        ip_address
    INTO matching_token
    FROM public.access_tokens
    WHERE 
        token_hash = crypt(p_token, token_hash) AND
        is_active = true AND
        expires_at > NOW();

    -- Check token validity
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired token';
    END IF;

    -- Optional IP address validation
    IF p_ip_address IS NOT NULL AND matching_token.ip_address IS NOT NULL 
       AND p_ip_address != matching_token.ip_address THEN
        RAISE EXCEPTION 'Token IP mismatch';
    END IF;

    -- Update last used timestamp
    UPDATE public.access_tokens
    SET last_used_at = NOW()
    WHERE token_hash = crypt(p_token, token_hash);

    RETURN matching_token.user_id;
END;
$function$;



-- ============================================
-- FILE: 20250808100259_d3f4ce56-3b83-47bc-93fb-35d672a71d1c.sql
-- ============================================

-- PHASE 1: Critical Database Security Fixes (corrected)

-- 1) Clean up legacy has_role overloads to avoid confusion
DROP FUNCTION IF EXISTS public.has_role(user_id bigint, role_name text);
DROP FUNCTION IF EXISTS public.has_role();

-- 2) Secure functions with explicit search_path and full qualification

CREATE OR REPLACE FUNCTION public.get_page_translation(p_page_key text, p_language user_language DEFAULT 'en'::user_language)
RETURNS TABLE(title text, content text, metadata jsonb)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY 
    SELECT 
        pt.title, 
        pt.content, 
        pt.metadata
    FROM public.page_translations pt
    WHERE pt.page_key = p_page_key 
      AND pt.language = p_language;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_access_attempt(p_user_id uuid, p_table_name text, p_operation text, p_access_result text, p_additional_context jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_user_email text;
    v_user_role public.app_role;
BEGIN
    -- Fetch user details
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = p_user_id;

    -- Prefer highest-precedence role for the target user
    SELECT ur.role INTO v_user_role
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
    ORDER BY CASE ur.role::text 
        WHEN 'system_admin' THEN 1
        WHEN 'super_user'  THEN 2
        WHEN 'admin'       THEN 3
        WHEN 'user'        THEN 4
        ELSE 5 END
    LIMIT 1;

    -- Insert audit log
    INSERT INTO public.access_audit_logs (
        user_id, 
        user_email, 
        user_role, 
        table_name, 
        operation, 
        access_result, 
        additional_context
    ) VALUES (
        p_user_id,
        v_user_email,
        v_user_role,
        p_table_name,
        p_operation,
        p_access_result,
        p_additional_context
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_totp_secret()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN encode(public.gen_random_bytes(20), 'base32');
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_backup_codes(p_user_id uuid)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    backup_codes text[];
BEGIN
    -- Generate 5 unique backup codes
    backup_codes := ARRAY(
        SELECT encode(public.gen_random_bytes(12), 'hex')
        FROM generate_series(1, 5)
    );

    -- Store backup codes (hashed)
    UPDATE public.mfa_configurations
    SET backup_codes = array(
        SELECT public.crypt(code, public.gen_salt('bf'))
        FROM unnest(backup_codes) AS code
    )
    WHERE user_id = p_user_id;

    RETURN backup_codes;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_mfa_token(p_user_id uuid, p_token text, p_method text DEFAULT 'totp'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    mfa_config record;
    is_valid boolean := false;
BEGIN
    -- Fetch MFA configuration
    SELECT * INTO mfa_config
    FROM public.mfa_configurations
    WHERE user_id = p_user_id AND is_mfa_enabled = true;

    -- Check if MFA is enabled
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Method-specific verification
    CASE p_method
        WHEN 'totp' THEN
            -- Use a hypothetical TOTP verification (would typically use an external library)
            is_valid := (
                p_token = public.generate_totp_code(mfa_config.totp_secret) OR
                p_token = ANY(
                    -- Check backup codes (one-time use)
                    SELECT code 
                    FROM unnest(mfa_config.backup_codes) AS code 
                    WHERE public.crypt(p_token, code) = code
                )
            );

            -- If backup code used, remove it
            IF is_valid AND p_token = ANY(mfa_config.backup_codes) THEN
                UPDATE public.mfa_configurations
                SET backup_codes = array_remove(backup_codes, p_token)
                WHERE user_id = p_user_id;
            END IF;

        WHEN 'sms' THEN
            -- Placeholder for SMS verification logic
            is_valid := false;

        WHEN 'email' THEN
            -- Placeholder for email verification logic
            is_valid := false;

        ELSE
            is_valid := false;
    END CASE;

    -- Update MFA attempt tracking
    IF is_valid THEN
        UPDATE public.mfa_configurations
        SET 
            failed_attempts = 0,
            last_mfa_challenge_time = NOW(),
            lockout_until = NULL
        WHERE user_id = p_user_id;
    ELSE
        UPDATE public.mfa_configurations
        SET 
            failed_attempts = failed_attempts + 1,
            lockout_until = CASE 
                WHEN failed_attempts >= 5 THEN NOW() + INTERVAL '15 minutes'
                ELSE lockout_until 
            END
        WHERE user_id = p_user_id;
    END IF;

    RETURN is_valid;
END;
$function$;

-- Single, secure has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.generate_access_token(p_user_id uuid, p_duration interval DEFAULT '01:00:00'::interval, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    new_token text;
    token_hash text;
BEGIN
    -- Generate a cryptographically secure token
    new_token := encode(public.gen_random_bytes(32), 'hex');
    token_hash := public.crypt(new_token, public.gen_salt('bf'));

    -- Invalidate previous active tokens for this user
    UPDATE public.access_tokens
    SET is_active = false
    WHERE user_id = p_user_id AND is_active = true;

    -- Insert new token
    INSERT INTO public.access_tokens (
        user_id, 
        token_hash, 
        expires_at, 
        ip_address, 
        user_agent
    ) VALUES (
        p_user_id,
        token_hash,
        NOW() + p_duration,
        p_ip_address,
        p_user_agent
    );

    RETURN new_token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_access_token(p_token text, p_ip_address inet DEFAULT NULL::inet)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    matching_token record;
BEGIN
    -- Find and validate the token
    SELECT 
        user_id, 
        expires_at, 
        is_active,
        ip_address
    INTO matching_token
    FROM public.access_tokens
    WHERE 
        token_hash = public.crypt(p_token, token_hash) AND
        is_active = true AND
        expires_at > NOW();

    -- Check token validity
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired token';
    END IF;

    -- Optional IP address validation
    IF p_ip_address IS NOT NULL AND matching_token.ip_address IS NOT NULL 
       AND p_ip_address != matching_token.ip_address THEN
        RAISE EXCEPTION 'Token IP mismatch';
    END IF;

    -- Update last used timestamp
    UPDATE public.access_tokens
    SET last_used_at = NOW()
    WHERE token_hash = public.crypt(p_token, token_hash);

    RETURN matching_token.user_id;
END;
$function$;



-- ============================================
-- FILE: 20250809125645_bc4d8c85-7ab2-44f5-93d7-d9174bbfffca.sql
-- ============================================

-- Fix infinite recursion in team_members RLS by using a SECURITY DEFINER helper
-- and consolidating SELECT policies.

-- 1) Helper function to check if current user is a member of a team
CREATE OR REPLACE FUNCTION public.is_member_of_team(
  p_team_id bigint,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = p_team_id
      AND tm.user_id = COALESCE(p_user_id, auth.uid())
      AND tm.is_active = true
  );
$$;

-- 2) Ensure RLS is enabled on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 3) Remove recursive/overlapping SELECT policies
DROP POLICY IF EXISTS "Team members can view other team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view team members of their teams" ON public.team_members;
DROP POLICY IF EXISTS "Users can view their team memberships" ON public.team_members;

-- 4) Create a single non-recursive SELECT policy for team_members
CREATE POLICY "Members and admin+ can view team members"
ON public.team_members
FOR SELECT
USING (
  public.is_member_of_team(team_members.team_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_user'::public.app_role)
  OR public.has_role(auth.uid(), 'system_admin'::public.app_role)
);



-- ============================================
-- FILE: 20250903014945_e8115432-200e-44ef-883b-b814c2bcd1c3.sql
-- ============================================

-- Create resources table for standards and reference materials
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('standard', 'guideline', 'regulation', 'manual', 'reference')),
  organization TEXT NOT NULL,
  publication_date DATE,
  version TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  url TEXT,
  file_path TEXT,
  tags TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "All authenticated users can view active resources"
ON public.resources
FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage resources"
ON public.resources
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_user'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

-- Create indexes
CREATE INDEX idx_resources_category ON public.resources(category);
CREATE INDEX idx_resources_type ON public.resources(type);
CREATE INDEX idx_resources_organization ON public.resources(organization);
CREATE INDEX idx_resources_tags ON public.resources USING GIN(tags);
CREATE INDEX idx_resources_active ON public.resources(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();



-- ============================================
-- FILE: 20250903095343_09fca9c7-e2ec-4099-8ecd-25287e80acc6.sql
-- ============================================

-- Create storage buckets for different types of files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/plain']),
  ('images', 'images', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  ('templates', 'templates', false, 52428800, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create RLS policies for documents bucket
CREATE POLICY "Authenticated users can view documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create RLS policies for images bucket (public)
CREATE POLICY "Images are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create RLS policies for templates bucket
CREATE POLICY "Authenticated users can view templates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'templates' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can upload templates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'templates' AND (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user', 'system_admin')
  )
));

CREATE POLICY "Admins can update templates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'templates' AND (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user', 'system_admin')
  )
));

CREATE POLICY "Admins can delete templates" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'templates' AND (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user', 'system_admin')
  )
));

-- Update resources table to better handle file storage
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS storage_bucket TEXT,
ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Update policy_templates table to handle file storage
ALTER TABLE public.policy_templates 
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS storage_bucket TEXT,
ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Create a documents table for general document management
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'documents',
  original_filename TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[],
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for documents table
CREATE POLICY "All authenticated users can view active documents" 
ON public.documents 
FOR SELECT 
USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Users can update their own documents or admins can update any" 
ON public.documents 
FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user', 'system_admin')
  )
);

CREATE POLICY "Users can delete their own documents or admins can delete any" 
ON public.documents 
FOR DELETE 
USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user', 'system_admin')
  )
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();



-- ============================================
-- FILE: 20250915025130_979f3813-b494-46d3-84ec-66e4c2193e44.sql
-- ============================================

-- Create teams table
CREATE TABLE public.teams (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  team_id BIGINT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for teams
CREATE POLICY "Teams are viewable by authenticated users" 
ON public.teams 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can create teams" 
ON public.teams 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user', 'system_admin')
  )
);

CREATE POLICY "Admins can update teams" 
ON public.teams 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user', 'system_admin')
  )
);

-- Create policies for team_members
CREATE POLICY "Team members are viewable by authenticated users" 
ON public.team_members 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can add team members" 
ON public.team_members 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user', 'system_admin')
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();



-- ============================================
-- FILE: 20250915025211_1cd0fdf5-cb39-423e-98ca-0b78a98af23d.sql
-- ============================================

-- Create teams table
CREATE TABLE public.teams (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  team_id BIGINT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for teams
CREATE POLICY "Teams are viewable by authenticated users" 
ON public.teams 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can create teams" 
ON public.teams 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user', 'system_admin')
  )
);

CREATE POLICY "Admins can update teams" 
ON public.teams 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user', 'system_admin')
  )
);

-- Create policies for team_members
CREATE POLICY "Team members are viewable by authenticated users" 
ON public.team_members 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can add team members" 
ON public.team_members 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user', 'system_admin')
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();



-- ============================================
-- FILE: 20250915025610_0aa40dfc-cabb-4eb0-8671-01cd1d1f5c99.sql
-- ============================================

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



-- ============================================
-- FILE: 20250915155836_22fa95ca-2262-4d57-afa3-45584e85a6bc.sql
-- ============================================

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



-- ============================================
-- FILE: 20250915155911_44b20fc4-faed-48bc-bcac-36b7bbb3ed4d.sql
-- ============================================

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



-- ============================================
-- FILE: 20250916015556_81c0b83b-343b-46e7-bf92-dacfeba1c577.sql
-- ============================================

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



-- ============================================
-- FILE: 20250916015633_4bb00780-6a46-4601-8161-263726891a4c.sql
-- ============================================

-- Drop all existing policies by their exact names
DROP POLICY IF EXISTS "Members and admin+ can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Members can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can add team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can remove team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can update team members" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert_admins_or_team_admins" ON public.team_members;
DROP POLICY IF EXISTS "team_members_select_authenticated" ON public.team_members;

DROP POLICY IF EXISTS "Authenticated can create teams with own created_by" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users with team.create permission can create team" ON public.teams;
DROP POLICY IF EXISTS "System admins can delete teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams they are members of" ON public.teams;
DROP POLICY IF EXISTS "teams_delete_minimal" ON public.teams;
DROP POLICY IF EXISTS "teams_delete_owner_or_admins" ON public.teams;
DROP POLICY IF EXISTS "teams_insert_minimal" ON public.teams;
DROP POLICY IF EXISTS "teams_select_minimal" ON public.teams;
DROP POLICY IF EXISTS "teams_update_minimal" ON public.teams;
DROP POLICY IF EXISTS "teams_update_owner_or_admins" ON public.teams;

-- Drop the problematic function with CASCADE
DROP FUNCTION IF EXISTS public.has_team_permission(bigint, text) CASCADE;

-- Create simple, working policies for teams
CREATE POLICY "view_teams_authenticated" 
ON public.teams 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "create_teams_admin" 
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

-- Create simple, working policies for team_members  
CREATE POLICY "view_team_members_authenticated" 
ON public.team_members 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "create_team_members_admin" 
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



-- ============================================
-- FILE: 20250916015954_7757e152-54a0-4474-9f85-c7f79d669921.sql
-- ============================================

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



-- ============================================
-- FILE: 20251004105809_86b2aa74-e011-4674-82a4-745bf0dca4d9.sql
-- ============================================

-- Create table for Project Quality Plan data
CREATE TABLE IF NOT EXISTS public.project_quality_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('objectives', 'processes', 'roles', 'metrics')),
  title text NOT NULL,
  description text,
  details jsonb,
  order_index integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_quality_plan ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view
CREATE POLICY "All authenticated users can view quality plan"
ON public.project_quality_plan
FOR SELECT
TO authenticated
USING (true);

-- Only admins, project managers, and team leaders can insert
CREATE POLICY "Authorized roles can insert quality plan items"
ON public.project_quality_plan
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('system_admin', 'admin', 'super_user')
  )
);

-- Only admins, project managers, and team leaders can update
CREATE POLICY "Authorized roles can update quality plan items"
ON public.project_quality_plan
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('system_admin', 'admin', 'super_user')
  )
);

-- Only admins, project managers, and team leaders can delete
CREATE POLICY "Authorized roles can delete quality plan items"
ON public.project_quality_plan
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('system_admin', 'admin', 'super_user')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_project_quality_plan_updated_at
BEFORE UPDATE ON public.project_quality_plan
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();



-- ============================================
-- FILE: 20251004142908_28e97959-cc6a-4584-a6e2-1590b234f0d2.sql
-- ============================================

-- Add team_id column to project_quality_plan table
ALTER TABLE public.project_quality_plan 
ADD COLUMN team_id bigint REFERENCES public.teams(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_project_quality_plan_team_id ON public.project_quality_plan(team_id);

-- Create helper function to check if user is a team member
CREATE OR REPLACE FUNCTION public._is_project_member_by_team(p_team_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_id = p_team_id
      AND user_id = auth.uid()
      AND is_active = true
  );
$$;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "All authenticated users can view PQP items" ON public.project_quality_plan;
DROP POLICY IF EXISTS "Admins can insert PQP items" ON public.project_quality_plan;
DROP POLICY IF EXISTS "Admins can update PQP items" ON public.project_quality_plan;
DROP POLICY IF EXISTS "Admins can delete PQP items" ON public.project_quality_plan;

-- Create new RLS policies with team-based access
CREATE POLICY "Users can view PQP items from their teams or if no team assigned"
ON public.project_quality_plan
FOR SELECT
TO authenticated
USING (
  team_id IS NULL 
  OR public._is_project_member_by_team(team_id)
  OR has_role(auth.uid(), 'system_admin'::app_role)
  OR has_role(auth.uid(), 'super_user'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Team members and admins can insert PQP items"
ON public.project_quality_plan
FOR INSERT
TO authenticated
WITH CHECK (
  (team_id IS NULL AND (
    has_role(auth.uid(), 'system_admin'::app_role)
    OR has_role(auth.uid(), 'super_user'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  ))
  OR (team_id IS NOT NULL AND public._is_project_member_by_team(team_id))
);

CREATE POLICY "Team members and admins can update PQP items"
ON public.project_quality_plan
FOR UPDATE
TO authenticated
USING (
  team_id IS NULL AND (
    has_role(auth.uid(), 'system_admin'::app_role)
    OR has_role(auth.uid(), 'super_user'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  OR (team_id IS NOT NULL AND public._is_project_member_by_team(team_id))
);

CREATE POLICY "Team members and admins can delete PQP items"
ON public.project_quality_plan
FOR DELETE
TO authenticated
USING (
  team_id IS NULL AND (
    has_role(auth.uid(), 'system_admin'::app_role)
    OR has_role(auth.uid(), 'super_user'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  OR (team_id IS NOT NULL AND public._is_project_member_by_team(team_id))
);



-- ============================================
-- FILE: 20251006200657_a3170c34-9364-4c1f-89c1-37ab82beb130.sql
-- ============================================

-- Enable RLS on Team Tables
ALTER TABLE public."Team Table" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Team Members Table" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Docker Tables
ALTER TABLE public.docker_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docker_layers ENABLE ROW LEVEL SECURITY;

-- Policies for Team Table
-- Authenticated users can view active teams
CREATE POLICY "Authenticated users can view teams"
ON public."Team Table"
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert teams
CREATE POLICY "Admins can insert teams"
ON public."Team Table"
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Only admins can update teams
CREATE POLICY "Admins can update teams"
ON public."Team Table"
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Only admins can delete teams
CREATE POLICY "Admins can delete teams"
ON public."Team Table"
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Policies for Team Members Table
-- Authenticated users can view team members
CREATE POLICY "Authenticated users can view team members"
ON public."Team Members Table"
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage team members
CREATE POLICY "Admins can insert team members"
ON public."Team Members Table"
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

CREATE POLICY "Admins can update team members"
ON public."Team Members Table"
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

CREATE POLICY "Admins can delete team members"
ON public."Team Members Table"
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Policies for docker_images
-- Only owners can view their docker images
CREATE POLICY "Users can view their own docker images"
ON public.docker_images
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Only owners can insert docker images
CREATE POLICY "Users can insert their own docker images"
ON public.docker_images
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Only owners can update their docker images
CREATE POLICY "Users can update their own docker images"
ON public.docker_images
FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid() OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Only owners can delete their docker images
CREATE POLICY "Users can delete their own docker images"
ON public.docker_images
FOR DELETE
TO authenticated
USING (
  owner_id = auth.uid() OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Policies for docker_layers
-- Only users who own the parent image can view layers
CREATE POLICY "Users can view layers of their docker images"
ON public.docker_layers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.docker_images
    WHERE docker_images.id = docker_layers.image_id
    AND (docker_images.owner_id = auth.uid() OR has_role(auth.uid(), 'system_admin'::app_role))
  )
);

-- Only users who own the parent image can insert layers
CREATE POLICY "Users can insert layers for their docker images"
ON public.docker_layers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.docker_images
    WHERE docker_images.id = docker_layers.image_id
    AND docker_images.owner_id = auth.uid()
  )
);

-- Only users who own the parent image can delete layers
CREATE POLICY "Users can delete layers of their docker images"
ON public.docker_layers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.docker_images
    WHERE docker_images.id = docker_layers.image_id
    AND (docker_images.owner_id = auth.uid() OR has_role(auth.uid(), 'system_admin'::app_role))
  )
);



-- ============================================
-- FILE: 20251014114758_279b1888-5485-402e-917d-4d8635c630bf.sql
-- ============================================

-- Create root_cause_analyses table
CREATE TABLE IF NOT EXISTS public.root_cause_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  problem text NOT NULL,
  incident_id bigint REFERENCES public.incidents(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'in_progress',
  priority text NOT NULL DEFAULT 'medium',
  team_id bigint REFERENCES public.teams(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  root_causes jsonb DEFAULT '[]'::jsonb,
  contributing_factors jsonb DEFAULT '[]'::jsonb,
  why_analysis jsonb DEFAULT '[]'::jsonb,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create improvement_plans table
CREATE TABLE IF NOT EXISTS public.improvement_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  root_cause_id uuid REFERENCES public.root_cause_analyses(id) ON DELETE SET NULL,
  incident_id bigint REFERENCES public.incidents(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'proposed',
  priority text NOT NULL DEFAULT 'medium',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  team_id bigint REFERENCES public.teams(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  target_completion_date date,
  actual_completion_date date,
  action_items jsonb DEFAULT '[]'::jsonb,
  success_metrics jsonb DEFAULT '[]'::jsonb,
  budget_allocated numeric(10,2),
  budget_spent numeric(10,2),
  notes text
);

-- Enable RLS
ALTER TABLE public.root_cause_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.improvement_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for root_cause_analyses
CREATE POLICY "Users can view root cause analyses"
  ON public.root_cause_analyses FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can create root cause analyses"
  ON public.root_cause_analyses FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
  );

CREATE POLICY "Users can update their root cause analyses or admins can update any"
  ON public.root_cause_analyses FOR UPDATE
  USING (
    created_by = auth.uid() OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'super_user') OR
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Admins can delete root cause analyses"
  ON public.root_cause_analyses FOR DELETE
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'super_user') OR
    has_role(auth.uid(), 'system_admin')
  );

-- RLS Policies for improvement_plans
CREATE POLICY "Users can view improvement plans"
  ON public.improvement_plans FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can create improvement plans"
  ON public.improvement_plans FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
  );

CREATE POLICY "Users can update their improvement plans or assigned users or admins"
  ON public.improvement_plans FOR UPDATE
  USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'super_user') OR
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Admins can delete improvement plans"
  ON public.improvement_plans FOR DELETE
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'super_user') OR
    has_role(auth.uid(), 'system_admin')
  );

-- Create update triggers
CREATE TRIGGER update_root_cause_analyses_updated_at
  BEFORE UPDATE ON public.root_cause_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_improvement_plans_updated_at
  BEFORE UPDATE ON public.improvement_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();



-- ============================================
-- FILE: 20251102122911_4989334e-6468-4dc7-921e-196c0ae1b60c.sql
-- ============================================

-- Fix the handle_new_user function to have proper security definer
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();



-- ============================================
-- FILE: 20251103130515_aa464f05-dcf4-4c45-9764-751bfc7618da.sql
-- ============================================

-- Ensure profiles table has proper RLS policies for admin management
-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view all profiles (for user lists, team views, etc.)
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow admins to update any profile (for user management)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Allow admins to insert profiles (for user creation)
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);



-- ============================================
-- FILE: 20251227201353_3e3d04f4-884b-40ed-8cc8-26137a357a71.sql
-- ============================================

-- Fix 1: Restrict profiles table access (profiles_public_read)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_user'::app_role) OR 
  public.has_role(auth.uid(), 'system_admin'::app_role)
);

-- Fix 2: Add authorization checks to MFA and token functions (security_definer_funcs)

-- Fix generate_backup_codes - only allow users to manage their own MFA
CREATE OR REPLACE FUNCTION public.generate_backup_codes(p_user_id uuid)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    backup_codes text[];
BEGIN
    -- SECURITY CHECK: Only allow users to manage their own MFA
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Cannot manage MFA for other users';
    END IF;
    
    -- Generate 5 unique backup codes
    backup_codes := ARRAY(
        SELECT encode(public.gen_random_bytes(12), 'hex')
        FROM generate_series(1, 5)
    );

    -- Store backup codes (hashed)
    UPDATE public.mfa_configurations
    SET backup_codes = array(
        SELECT public.crypt(code, public.gen_salt('bf'))
        FROM unnest(backup_codes) AS code
    )
    WHERE user_id = p_user_id;

    RETURN backup_codes;
END;
$function$;

-- Fix verify_mfa_token - only allow users to verify their own MFA
CREATE OR REPLACE FUNCTION public.verify_mfa_token(p_user_id uuid, p_token text, p_method text DEFAULT 'totp'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    mfa_config record;
    is_valid boolean := false;
BEGIN
    -- SECURITY CHECK: Only allow users to verify their own MFA
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Cannot verify MFA for other users';
    END IF;
    
    -- Fetch MFA configuration
    SELECT * INTO mfa_config
    FROM public.mfa_configurations
    WHERE user_id = p_user_id AND is_mfa_enabled = true;

    -- Check if MFA is enabled
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Method-specific verification
    CASE p_method
        WHEN 'totp' THEN
            -- Use a hypothetical TOTP verification
            is_valid := (
                p_token = public.generate_totp_code(mfa_config.totp_secret) OR
                p_token = ANY(
                    SELECT code 
                    FROM unnest(mfa_config.backup_codes) AS code 
                    WHERE public.crypt(p_token, code) = code
                )
            );

            -- If backup code used, remove it
            IF is_valid AND p_token = ANY(mfa_config.backup_codes) THEN
                UPDATE public.mfa_configurations
                SET backup_codes = array_remove(backup_codes, p_token)
                WHERE user_id = p_user_id;
            END IF;

        WHEN 'sms' THEN
            is_valid := false;

        WHEN 'email' THEN
            is_valid := false;

        ELSE
            is_valid := false;
    END CASE;

    -- Update MFA attempt tracking
    IF is_valid THEN
        UPDATE public.mfa_configurations
        SET 
            failed_attempts = 0,
            last_mfa_challenge_time = NOW(),
            lockout_until = NULL
        WHERE user_id = p_user_id;
    ELSE
        UPDATE public.mfa_configurations
        SET 
            failed_attempts = failed_attempts + 1,
            lockout_until = CASE 
                WHEN failed_attempts >= 5 THEN NOW() + INTERVAL '15 minutes'
                ELSE lockout_until 
            END
        WHERE user_id = p_user_id;
    END IF;

    RETURN is_valid;
END;
$function$;

-- Fix generate_access_token - only allow for own user or system admins
CREATE OR REPLACE FUNCTION public.generate_access_token(p_user_id uuid, p_duration interval DEFAULT '01:00:00'::interval, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    new_token text;
    token_hash text;
BEGIN
    -- SECURITY CHECK: Only allow for own user or system admins
    IF p_user_id != auth.uid() AND NOT (
        SELECT EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('system_admin'::public.app_role, 'super_user'::public.app_role)
        )
    ) THEN
        RAISE EXCEPTION 'Cannot generate tokens for other users';
    END IF;

    -- Generate a cryptographically secure token
    new_token := encode(public.gen_random_bytes(32), 'hex');
    token_hash := public.crypt(new_token, public.gen_salt('bf'));

    -- Invalidate previous active tokens for this user
    UPDATE public.access_tokens
    SET is_active = false
    WHERE user_id = p_user_id AND is_active = true;

    -- Insert new token
    INSERT INTO public.access_tokens (
        user_id, 
        token_hash, 
        expires_at, 
        ip_address, 
        user_agent
    ) VALUES (
        p_user_id,
        token_hash,
        NOW() + p_duration,
        p_ip_address,
        p_user_agent
    );

    RETURN new_token;
END;
$function$;



-- ============================================
-- FILE: 20260226193735_18efc5c4-2fef-4433-80b3-e7c1b2683e93.sql
-- ============================================

-- Add 'developer' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';



-- ============================================
-- FILE: 20260406201359_85063456-9f97-4907-be7f-dc30e1abbe1e.sql
-- ============================================


CREATE TABLE public.policy_manual_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id TEXT NOT NULL,
  policy_title TEXT NOT NULL,
  policy_content TEXT NOT NULL DEFAULT '',
  section TEXT NOT NULL DEFAULT 'Policy Manuals',
  assigned_to UUID REFERENCES auth.users(id),
  assigned_by UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  change_notes TEXT,
  task_description TEXT,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  file_path TEXT,
  file_size INTEGER,
  original_filename TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.policy_manual_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view policy manual tasks"
  ON public.policy_manual_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert policy manual tasks"
  ON public.policy_manual_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = assigned_by);

CREATE POLICY "Authenticated users can update policy manual tasks"
  ON public.policy_manual_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = assigned_by OR auth.uid() = assigned_to);


