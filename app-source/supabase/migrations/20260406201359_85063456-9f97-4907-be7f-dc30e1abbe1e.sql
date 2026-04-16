
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
