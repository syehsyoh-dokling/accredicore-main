import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_by: string;
  team_id?: number;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  assignee?: {
    id: string;
    full_name: string;
    email: string;
  };
  creator?: {
    id: string;
    full_name: string;
    email: string;
  };
  team?: {
    id: number;
    name: string;
  };
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface TaskProgress {
  id: string;
  task_id: string;
  user_id: string;
  progress_percentage: number;
  notes?: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export function useRealtimeTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Record<string, TaskComment[]>>({});
  const [progress, setProgress] = useState<Record<string, TaskProgress[]>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch tasks with related data
  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      setTasks((tasksData as any) || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments for a specific task
  const fetchTaskComments = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments(prev => ({
        ...prev,
        [taskId]: data as TaskComment[] || []
      }));
    } catch (error) {
      console.error('Error fetching task comments:', error);
    }
  };

  // Fetch progress for a specific task
  const fetchTaskProgress = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('task_progress')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProgress(prev => ({
        ...prev,
        [taskId]: data as TaskProgress[] || []
      }));
    } catch (error) {
      console.error('Error fetching task progress:', error);
    }
  };

  // Create new task
  const createTask = async (taskData: {
    title: string;
    description?: string;
    assigned_to?: string;
    team_id?: number;
    due_date?: string;
    priority: 'low' | 'medium' | 'high';
  }) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          assigned_by: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Task status updated to ${status}`,
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  // Add comment to task
  const addTaskComment = async (taskId: string, comment: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: user.id,
          comment
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Comment added successfully",
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  // Update task progress
  const updateTaskProgress = async (taskId: string, progressPercentage: number, notes?: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('task_progress')
        .insert({
          task_id: taskId,
          user_id: user.id,
          progress_percentage: progressPercentage,
          notes
        });

      if (error) throw error;

      // Also update task status based on progress
      let newStatus: Task['status'] = 'pending';
      if (progressPercentage > 0 && progressPercentage < 100) {
        newStatus = 'in_progress';
      } else if (progressPercentage === 100) {
        newStatus = 'completed';
      }

      await updateTaskStatus(taskId, newStatus);

      toast({
        title: "Success",
        description: "Progress updated successfully",
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) return;

    fetchTasks();

    // Subscribe to realtime changes for tasks
    const tasksChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Task change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            fetchTasks(); // Refetch to get complete data with relations
            toast({
              title: "New Task",
              description: "A new task has been created",
            });
          } else if (payload.eventType === 'UPDATE') {
            fetchTasks(); // Refetch to get updated data
            if (payload.new.status === 'completed') {
              toast({
                title: "Task Completed",
                description: `Task "${payload.new.title}" has been completed`,
              });
            }
          } else if (payload.eventType === 'DELETE') {
            fetchTasks(); // Refetch to remove deleted task
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_comments'
        },
        (payload) => {
          console.log('Comment added:', payload);
          const taskId = payload.new.task_id;
          fetchTaskComments(taskId);
          toast({
            title: "New Comment",
            description: "A comment was added to a task",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_progress'
        },
        (payload) => {
          console.log('Progress updated:', payload);
          const taskId = payload.new.task_id;
          fetchTaskProgress(taskId);
          fetchTasks(); // Refetch tasks to update status
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
    };
  }, [user]);

  const getTaskStats = () => {
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      const today = new Date();
      return t.status !== 'completed' && dueDate < today;
    }).length;

    return { pending, inProgress, completed, overdue, total: tasks.length };
  };

  return {
    tasks,
    comments,
    progress,
    loading,
    createTask,
    updateTaskStatus,
    addTaskComment,
    updateTaskProgress,
    fetchTaskComments,
    fetchTaskProgress,
    getTaskStats,
    refetch: fetchTasks
  };
}