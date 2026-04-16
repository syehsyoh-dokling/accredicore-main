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