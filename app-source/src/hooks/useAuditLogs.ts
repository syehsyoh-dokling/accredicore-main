import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogRecord {
  id: string;
  action: string;
  table_name: string;
  record_id?: string | null;
  user_id?: string | null;
  created_at: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
}

export function useAuditLogs(limit = 50) {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setLogs((data || []) as AuditLogRecord[]);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [limit]);

  return {
    logs,
    loading,
    fetchLogs,
  };
}
