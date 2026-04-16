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