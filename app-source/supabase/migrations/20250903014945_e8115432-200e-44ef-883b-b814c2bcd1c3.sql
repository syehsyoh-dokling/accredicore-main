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