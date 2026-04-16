
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SystemStats {
  totalUsers: number;
  totalPolicies: number;
  activeTeams: number;
  totalComplianceRecords: number;
}

export function useSystemStats() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalPolicies: 0,
    activeTeams: 0,
    totalComplianceRecords: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Fetch user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch policy count
      const { count: policyCount } = await supabase
        .from('policies')
        .select('*', { count: 'exact', head: true });

      // Fetch active teams count
      const { count: teamCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch compliance records count
      const { count: complianceCount } = await supabase
        .from('compliance_records')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: userCount || 0,
        totalPolicies: policyCount || 0,
        activeTeams: teamCount || 0,
        totalComplianceRecords: complianceCount || 0
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  return { stats, loading, refetch: fetchStats };
}
