import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ImprovementPlan {
  id: string;
  title: string;
  description?: string;
  root_cause_id?: string;
  incident_id?: number;
  status: string;
  priority: string;
  assigned_to?: string;
  team_id?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  action_items?: any[];
  success_metrics?: any[];
  budget_allocated?: number;
  budget_spent?: number;
  notes?: string;
}

export const useImprovementPlans = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['improvement-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('improvement_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ImprovementPlan[];
    },
  });

  const createPlan = useMutation({
    mutationFn: async (plan: Omit<ImprovementPlan, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('improvement_plans')
        .insert([{ ...plan, created_by: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['improvement-plans'] });
      toast({
        title: 'Success',
        description: 'Improvement plan created successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create improvement plan',
        variant: 'destructive',
      });
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ImprovementPlan> & { id: string }) => {
      const { data, error } = await supabase
        .from('improvement_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['improvement-plans'] });
      toast({
        title: 'Success',
        description: 'Improvement plan updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update improvement plan',
        variant: 'destructive',
      });
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('improvement_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['improvement-plans'] });
      toast({
        title: 'Success',
        description: 'Improvement plan deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete improvement plan',
        variant: 'destructive',
      });
    },
  });

  return {
    plans: plans || [],
    isLoading,
    createPlan: createPlan.mutate,
    updatePlan: updatePlan.mutate,
    deletePlan: deletePlan.mutate,
    isCreating: createPlan.isPending,
    isUpdating: updatePlan.isPending,
    isDeleting: deletePlan.isPending,
  };
};