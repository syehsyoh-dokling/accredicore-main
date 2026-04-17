import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PolicyApprovalRequest {
  id: string;
  stage_order: number;
  stage_name: string;
  required_role: string;
  status: string;
  requested_by: string;
  reviewed_by?: string | null;
  comments?: string | null;
  requested_at: string;
  reviewed_at?: string | null;
}

export interface PolicyVersionEntry {
  id: string;
  version_number: number;
  change_summary?: string | null;
  archived_by?: string | null;
  archived_at: string;
}

export interface PolicyAuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id?: string | null;
  user_id?: string | null;
  created_at: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
}

export interface PolicyGovernanceSummary {
  policy_id: string;
  approvals: PolicyApprovalRequest[];
  versions: PolicyVersionEntry[];
  audit_logs: PolicyAuditLog[];
}

export function usePolicyGovernance(policyId: string | null) {
  const [summary, setSummary] = useState<PolicyGovernanceSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    if (!policyId) {
      setSummary(null);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_policy_governance_summary' as any, {
        p_policy_id: policyId,
      });

      if (error) throw error;

      setSummary({
        policy_id: policyId,
        approvals: data?.approvals || [],
        versions: data?.versions || [],
        audit_logs: data?.audit_logs || [],
      });
    } catch (error) {
      console.error('Error fetching policy governance summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitForApproval = async (changeSummary?: string) => {
    if (!policyId) throw new Error('Policy id is required');

    const { data, error } = await supabase.rpc('submit_policy_for_approval' as any, {
      p_policy_id: policyId,
      p_change_summary: changeSummary || null,
    });

    if (error) throw error;
    await fetchSummary();
    return data;
  };

  const reviewApproval = async (
    requestId: string,
    decision: 'approved' | 'rejected',
    comments?: string
  ) => {
    const { data, error } = await supabase.rpc('review_policy_approval' as any, {
      p_request_id: requestId,
      p_decision: decision,
      p_comments: comments || null,
    });

    if (error) throw error;
    await fetchSummary();
    return data;
  };

  const archiveCurrentVersion = async (changeSummary?: string) => {
    if (!policyId) throw new Error('Policy id is required');

    const { data, error } = await supabase.rpc('archive_policy_version' as any, {
      p_policy_id: policyId,
      p_change_summary: changeSummary || null,
    });

    if (error) throw error;
    await fetchSummary();
    return data;
  };

  useEffect(() => {
    fetchSummary();
  }, [policyId]);

  return {
    summary,
    loading,
    fetchSummary,
    submitForApproval,
    reviewApproval,
    archiveCurrentVersion,
  };
}
