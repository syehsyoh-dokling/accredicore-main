import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

export const useUserRoles = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          user:profiles!user_roles_user_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching user roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'system_admin' | 'super_user' | 'admin' | 'developer' | 'user' | 'team' | 'client') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;
      await fetchUserRoles();
      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { success: false, error };
    }
  };

  const assignRole = async (userId: string, role: 'system_admin' | 'super_user' | 'admin' | 'developer' | 'user' | 'team' | 'client') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role }]);

      if (error) throw error;
      await fetchUserRoles();
      return { success: true };
    } catch (error) {
      console.error('Error assigning role:', error);
      return { success: false, error };
    }
  };

  const removeRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      await fetchUserRoles();
      return { success: true };
    } catch (error) {
      console.error('Error removing role:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserRoles();
    }
  }, [user]);

  return {
    roles,
    loading,
    fetchUserRoles,
    updateUserRole,
    assignRole,
    removeRole
  };
};