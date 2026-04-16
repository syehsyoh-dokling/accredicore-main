
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
SELECT 'Infection Control Standard Template', 'قالب معايير مكافحة العدوى', 'Standard template for infection control policies', 'قالب معياري لسياسات مكافحة العدوى', 
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
'# سياسة مكافحة العدوى

## الهدف
تحدد هذه السياسة المبادئ التوجيهية لمنع ومكافحة العدوى.

## النطاق
تنطبق على جميع العاملين في الرعاية الصحية.

## الإجراءات
1. بروتوكولات نظافة اليدين
2. معدات الحماية الشخصية
3. التنظيف البيئي
4. إدارة النفايات',
'infection-control', ARRAY['CBAHI', 'JCI', 'infection', 'safety']
WHERE NOT EXISTS (SELECT 1 FROM public.policy_templates WHERE category = 'infection-control');

INSERT INTO public.policy_templates (title, title_ar, description, description_ar, content, content_ar, category, tags) 
SELECT 'Medication Management Template', 'قالب إدارة الأدوية', 'Template for medication management policies', 'قالب لسياسات إدارة الأدوية',
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
'# سياسة إدارة الأدوية

## الهدف
ضمان ممارسات آمنة للأدوية.

## النطاق
جميع الأنشطة المتعلقة بالأدوية.

## المجالات الرئيسية
1. الوصف
2. الصرف
3. الإعطاء
4. المراقبة',
'pharmacy', ARRAY['medication', 'safety', 'pharmacy']
WHERE NOT EXISTS (SELECT 1 FROM public.policy_templates WHERE category = 'pharmacy');

INSERT INTO public.policy_templates (title, title_ar, description, description_ar, content, content_ar, category, tags) 
SELECT 'Quality Management Template', 'قالب إدارة الجودة', 'Template for quality management policies', 'قالب لسياسات إدارة الجودة',
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
'# سياسة إدارة الجودة

## الهدف
إنشاء إطار للتحسين المستمر للجودة.

## النطاق
جميع العمليات التنظيمية.

## المكونات
1. تخطيط الجودة
2. مراقبة الجودة
3. ضمان الجودة
4. التحسين المستمر',
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
