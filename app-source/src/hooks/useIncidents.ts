import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Incident {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  team_id: number | null;
  assigned_user_id: string | null;
}

export interface InvestigationNote {
  id: number;
  incident_id: number;
  note: string;
  author_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export interface ActionPlan {
  id: number;
  incident_id: number;
  plan: string;
  status: string;
  proposer_id: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
  };
}

export function useIncidents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching incidents:', error);
        throw error;
      }
      return data as unknown as Incident[];
    },
  });

  const createIncident = useMutation({
    mutationFn: async (incident: Omit<Incident, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('incidents' as any)
        .insert({
          title: incident.title,
          description: incident.description,
          priority: incident.priority,
          status: incident.status,
          created_by: user.id,
          team_id: incident.team_id,
          assigned_user_id: incident.assigned_user_id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating incident:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast({
        title: 'Incident Reported',
        description: 'The incident has been successfully reported.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateIncident = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Incident> & { id: number }) => {
      const { data, error } = await supabase
        .from('incidents' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast({
        title: 'Incident Updated',
        description: 'The incident has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteIncident = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('incidents' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast({
        title: 'Incident Deleted',
        description: 'The incident has been successfully deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    incidents,
    isLoading,
    createIncident: createIncident.mutate,
    updateIncident: updateIncident.mutate,
    deleteIncident: deleteIncident.mutate,
  };
}

export function useInvestigationNotes(incidentId: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['investigation-notes', incidentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investigation_notes' as any)
        .select('*, profiles:author_id (full_name)')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as InvestigationNote[];
    },
    enabled: !!incidentId,
  });

  const addNote = useMutation({
    mutationFn: async (note: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('investigation_notes' as any)
        .insert({
          incident_id: incidentId,
          note,
          author_id: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigation-notes', incidentId] });
      toast({
        title: 'Note Added',
        description: 'Investigation note has been added successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    notes,
    isLoading,
    addNote: addNote.mutate,
  };
}

export function useActionPlans(incidentId: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['action-plans', incidentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('action_plans' as any)
        .select('*, profiles:proposer_id (full_name)')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ActionPlan[];
    },
    enabled: !!incidentId,
  });

  const addPlan = useMutation({
    mutationFn: async (plan: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('action_plans' as any)
        .insert({
          incident_id: incidentId,
          plan,
          proposer_id: user.id,
          status: 'proposed',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-plans', incidentId] });
      toast({
        title: 'Action Plan Added',
        description: 'Action plan has been added successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updatePlanStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { data, error } = await supabase
        .from('action_plans' as any)
        .update({ status } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-plans', incidentId] });
      toast({
        title: 'Plan Updated',
        description: 'Action plan status has been updated.',
      });
    },
  });

  return {
    plans,
    isLoading,
    addPlan: addPlan.mutate,
    updatePlanStatus: updatePlanStatus.mutate,
  };
}
