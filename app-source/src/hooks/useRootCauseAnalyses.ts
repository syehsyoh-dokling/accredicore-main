import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RootCauseAnalysis {
  id: string;
  title: string;
  problem: string;
  incident_id?: number;
  status: string;
  priority: string;
  team_id?: number;
  created_by: string;
  created_at: string;
  completed_at?: string;
  root_causes?: any[];
  contributing_factors?: any[];
  why_analysis?: any[];
  notes?: string;
  updated_at: string;
}

export const useRootCauseAnalyses = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['root-cause-analyses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('root_cause_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RootCauseAnalysis[];
    },
  });

  const createAnalysis = useMutation({
    mutationFn: async (analysis: Omit<RootCauseAnalysis, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('root_cause_analyses')
        .insert([{ ...analysis, created_by: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['root-cause-analyses'] });
      toast({
        title: 'Success',
        description: 'Root cause analysis created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create root cause analysis',
        variant: 'destructive',
      });
    },
  });

  const updateAnalysis = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RootCauseAnalysis> & { id: string }) => {
      const { data, error } = await supabase
        .from('root_cause_analyses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['root-cause-analyses'] });
      toast({
        title: 'Success',
        description: 'Root cause analysis updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update root cause analysis',
        variant: 'destructive',
      });
    },
  });

  const deleteAnalysis = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('root_cause_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['root-cause-analyses'] });
      toast({
        title: 'Success',
        description: 'Root cause analysis deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete root cause analysis',
        variant: 'destructive',
      });
    },
  });

  return {
    analyses: analyses || [],
    isLoading,
    createAnalysis: createAnalysis.mutate,
    updateAnalysis: updateAnalysis.mutate,
    deleteAnalysis: deleteAnalysis.mutate,
    isCreating: createAnalysis.isPending,
    isUpdating: updateAnalysis.isPending,
    isDeleting: deleteAnalysis.isPending,
  };
};