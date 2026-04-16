
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_by: string;
  team_id?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  assigned_user?: {
    full_name: string;
    email: string;
  };
  assigner?: {
    full_name: string;
    email: string;
  };
  team?: {
    name: string;
  };
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(full_name, email),
          assigner:profiles!tasks_assigned_by_fkey(full_name, email),
          team:teams(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data || []).map(task => ({
        ...task,
        status: task.status as Task['status'],
        priority: task.priority as Task['priority']
      })));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: {
    title: string;
    description?: string;
    assigned_to?: string;
    team_id?: number;
    priority: string;
    due_date?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          assigned_by: user?.id
        }]);

      if (error) throw error;
      await fetchTasks();
      return { success: true };
    } catch (error) {
      console.error('Error creating task:', error);
      return { success: false, error };
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
      await fetchTasks();
      return { success: true };
    } catch (error) {
      console.error('Error updating task status:', error);
      return { success: false, error };
    }
  };

  const updateTaskProgress = async (taskId: string, progressPercentage: number, notes?: string) => {
    try {
      const { error } = await supabase
        .from('task_progress')
        .insert([{
          task_id: taskId,
          user_id: user?.id,
          progress_percentage: progressPercentage,
          notes
        }]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating task progress:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    loading,
    fetchTasks,
    createTask,
    updateTaskStatus,
    updateTaskProgress
  };
};
