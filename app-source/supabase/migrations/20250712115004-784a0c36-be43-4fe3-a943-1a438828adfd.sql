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