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