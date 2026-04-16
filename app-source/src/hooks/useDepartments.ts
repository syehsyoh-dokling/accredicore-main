import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Department {
  id: number;
  name: string;
  description?: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  manager?: {
    full_name: string;
    email: string;
  };
  member_count?: number;
}

export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('departments')
        .select(`
          *,
          manager:profiles!departments_manager_id_fkey(full_name, email)
        `)
        .order('name');

      if (error) throw error;

      // Get member count for each department
      const departmentsWithCount = await Promise.all(
        (data || []).map(async (dept) => {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id)
            .eq('is_active', true);

          return {
            ...dept,
            member_count: count || 0
          };
        })
      );

      setDepartments(departmentsWithCount);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDepartment = async (departmentData: {
    name: string;
    description?: string;
    manager_id?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('departments')
        .insert([departmentData]);

      if (error) throw error;
      await fetchDepartments();
      return { success: true };
    } catch (error) {
      console.error('Error creating department:', error);
      return { success: false, error };
    }
  };

  const updateDepartment = async (id: number, updates: Partial<Department>) => {
    try {
      const { error } = await supabase
        .from('departments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await fetchDepartments();
      return { success: true };
    } catch (error) {
      console.error('Error updating department:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return {
    departments,
    loading,
    fetchDepartments,
    createDepartment,
    updateDepartment
  };
};