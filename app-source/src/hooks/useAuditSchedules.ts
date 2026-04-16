import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AuditSchedule {
  id: string;
  title: string;
  description?: string;
  audit_type: 'internal' | 'external';
  department: string;
  scheduled_date: string;
  scheduled_time?: string;
  duration_days: number;
  priority: 'low' | 'medium' | 'high';
  auditor_name?: string;
  auditor_company?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export function useAuditSchedules() {
  const [audits, setAudits] = useState<AuditSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAudits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('audit_schedules')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      setAudits((data as AuditSchedule[]) || []);
    } catch (error) {
      console.error('Error fetching audit schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAuditStatus = async (auditId: string, status: AuditSchedule['status']) => {
    try {
      const { error } = await supabase
        .from('audit_schedules')
        .update({ status })
        .eq('id', auditId);

      if (error) throw error;

      // Update local state
      setAudits(prev => 
        prev.map(audit => 
          audit.id === auditId ? { ...audit, status } : audit
        )
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating audit status:', error);
      return { success: false, error };
    }
  };

  const deleteAudit = async (auditId: string) => {
    try {
      const { error } = await supabase
        .from('audit_schedules')
        .delete()
        .eq('id', auditId);

      if (error) throw error;

      // Update local state
      setAudits(prev => prev.filter(audit => audit.id !== auditId));

      return { success: true };
    } catch (error) {
      console.error('Error deleting audit:', error);
      return { success: false, error };
    }
  };

  const getAuditStats = () => {
    const scheduled = audits.filter(a => a.status === 'scheduled').length;
    const inProgress = audits.filter(a => a.status === 'in_progress').length;
    const completed = audits.filter(a => a.status === 'completed').length;
    const overdue = audits.filter(a => {
      const scheduledDate = new Date(a.scheduled_date);
      const today = new Date();
      return a.status === 'scheduled' && scheduledDate < today;
    }).length;

    return { scheduled, inProgress, completed, overdue };
  };

  useEffect(() => {
    fetchAudits();
  }, [user]);

  return { 
    audits, 
    loading, 
    fetchAudits, 
    updateAuditStatus, 
    deleteAudit, 
    getAuditStats 
  };
}