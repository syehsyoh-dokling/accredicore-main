
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface User {
  id: string;
  name: string;
  nameEn: string;
  nameAr: string;
  email: string;
  role: string;
  department: string;
  status: string;
  lastLogin: string;
  permissions: string[];
}

export function useUserData() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchUsers = async () => {
    if (!user) return;

    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (role)
        `);

      if (profilesError) throw profilesError;

      const formattedUsers: User[] = profilesData?.map((profile: any) => ({
        id: profile.id,
        name: profile.full_name || profile.email,
        nameEn: profile.full_name || profile.email,
        nameAr: profile.full_name || profile.email,
        email: profile.email,
        role: profile.user_roles?.[0]?.role || 'user',
        department: getDepartmentByRole(profile.user_roles?.[0]?.role || 'user'),
        status: 'Active',
        lastLogin: new Date(profile.updated_at).toLocaleString(),
        permissions: getPermissionsByRole(profile.user_roles?.[0]?.role || 'user')
      })) || [];

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updatedUser: User & { newPassword?: string }) => {
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: updatedUser.nameEn,
          email: updatedUser.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedUser.id);

      if (profileError) throw profileError;

      // Update password via secure edge function (admin only)
      if (updatedUser.newPassword && updatedUser.newPassword.trim() !== '') {
        const { data: passwordData, error: passwordError } = await supabase.functions.invoke('update-user-password', {
          body: {
            userId: updatedUser.id,
            newPassword: updatedUser.newPassword
          }
        });

        if (passwordError) {
          console.error('Failed to update password:', passwordError);
          throw new Error(passwordError.message || 'Failed to update password');
        }

        if (passwordData?.error) {
          throw new Error(passwordData.error);
        }
      }

      // Update role if changed
      const currentUser = users.find(u => u.id === updatedUser.id);
      if (currentUser && currentUser.role !== updatedUser.role) {
        // Delete old role
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', updatedUser.id);

        // Insert new role with proper type mapping
        const mappedRole = mapRoleToEnum(updatedUser.role);
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: updatedUser.id,
            role: mappedRole
          });

        if (roleError) throw roleError;
      }

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        )
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  return { users, loading, updateUser, refetch: fetchUsers };
}

function getDepartmentByRole(role: string): string {
  const departments: Record<string, string> = {
    'system_admin': 'Information Technology',
    'super_user': 'Quality Management',
    'admin': 'Quality Management',
    'developer': 'Information Technology',
    'user': 'General'
  };
  return departments[role] || 'General';
}

function getPermissionsByRole(role: string): string[] {
  const permissions: Record<string, string[]> = {
    'system_admin': ['Read', 'Write', 'Export', 'Admin'],
    'super_user': ['Read', 'Write', 'Export'],
    'admin': ['Read', 'Write'],
    'developer': ['Read', 'Write', 'Export'],
    'user': ['Read']
  };
  return permissions[role] || ['Read'];
}

function mapRoleToEnum(displayRole: string): AppRole {
  const roleMap: Record<string, AppRole> = {
    'Quality Manager': 'admin',
    'Infection Control Specialist': 'user',
    'Safety Engineer': 'user',
    'IT Manager': 'super_user',
    'مدير الجودة': 'admin',
    'أخصائي مكافحة العدوى': 'user',
    'مهندس سلامة': 'user',
    'مدير تقنية المعلومات': 'super_user',
    'system_admin': 'system_admin',
    'super_user': 'super_user',
    'admin': 'admin',
    'developer': 'developer',
    'user': 'user'
  };
  return roleMap[displayRole] || 'user';
}
