
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: number;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  department?: string;
  is_active: boolean;
  member_count?: number;
  created_at: string;
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTeams = async () => {
    if (!user) return;

    try {
      // First get teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('is_active', true);

      if (teamsError) throw teamsError;

      // Then get member counts for each team
      const teamsWithCounts = await Promise.all(
        (teamsData || []).map(async (team) => {
          const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact' })
            .eq('team_id', team.id)
            .eq('is_active', true);

          return {
            ...team,
            member_count: count || 0
          };
        })
      );

      setTeams(teamsWithCounts);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch teams',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async (teamData: {
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    department: string;
  }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          name_ar: teamData.nameAr,
          description: teamData.description,
          description_ar: teamData.descriptionAr,
          department: teamData.department,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Team created successfully'
      });

      fetchTeams();
      return true;
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: 'Error',
        description: 'Failed to create team',
        variant: 'destructive'
      });
      return false;
    }
  };

  const updateTeam = async (teamId: number, teamData: {
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    department: string;
  }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: teamData.name,
          name_ar: teamData.nameAr,
          description: teamData.description,
          description_ar: teamData.descriptionAr,
          department: teamData.department
        })
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Team updated successfully'
      });

      fetchTeams();
      return true;
    } catch (error) {
      console.error('Error updating team:', error);
      toast({
        title: 'Error',
        description: 'Failed to update team',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteTeam = async (teamId: number) => {
    if (!user) return false;

    try {
      // First deactivate all team members
      const { error: memberError } = await supabase
        .from('team_members')
        .update({ is_active: false })
        .eq('team_id', teamId);

      if (memberError) throw memberError;

      // Then deactivate the team
      const { error } = await supabase
        .from('teams')
        .update({ is_active: false })
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Team deleted successfully'
      });

      fetchTeams();
      return true;
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete team',
        variant: 'destructive'
      });
      return false;
    }
  };

  const addTeamMember = async (teamId: number, email: string, role: string) => {
    try {
      // First, find the user by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profileError || !profiles) {
        toast({
          title: 'Error',
          description: 'User not found with this email',
          variant: 'destructive'
        });
        return false;
      }

      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: profiles.id,
          role: role,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Team member added successfully'
      });

      fetchTeams();
      return true;
    } catch (error) {
      console.error('Error adding team member:', error);
      toast({
        title: 'Error',
        description: 'Failed to add team member',
        variant: 'destructive'
      });
      return false;
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [user]);

  return {
    teams,
    loading,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    refetch: fetchTeams
  };
}
