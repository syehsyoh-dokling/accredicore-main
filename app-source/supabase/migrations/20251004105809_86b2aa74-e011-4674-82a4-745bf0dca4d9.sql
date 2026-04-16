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