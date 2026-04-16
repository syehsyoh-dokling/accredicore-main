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