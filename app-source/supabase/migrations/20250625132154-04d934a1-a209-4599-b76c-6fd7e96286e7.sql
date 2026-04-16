
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
