import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PolicyAttestationEntry {
  id: string;
  policy_id: string;
  user_id: string;
  requested_by: string;
  status: string;
  instructions?: string | null;
  notes?: string | null;
  due_at?: string | null;
  requested_at: string;
  acknowledged_at?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  requested_by_name?: string | null;
}

export interface PolicyAttestationSummary {
  policy_id: string;
  attestations: PolicyAttestationEntry[];
}

export function usePolicyAttestations(policyId: string | null) {
  const [summary, setSummary] = useState<PolicyAttestationSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    if (!policyId) {
      setSummary(null);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_policy_attestation_summary' as any, {
        p_policy_id: policyId,
      });

      if (error) throw error;

      setSummary({
        policy_id: policyId,
        attestations: data?.attestations || [],
      });
    } catch (error) {
      console.error('Error fetching policy attestation summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestAttestation = async (
    userId: string,
    dueAt?: string | null,
    instructions?: string | null
  ) => {
    if (!policyId) throw new Error('Policy id is required');

    const { data, error } = await supabase.rpc('create_policy_attestation' as any, {
      p_policy_id: policyId,
      p_user_id: userId,
      p_due_at: dueAt || null,
      p_instructions: instructions || null,
    });

    if (error) throw error;
    await fetchSummary();
    return data;
  };

  const acknowledgeAttestation = async (attestationId: string, notes?: string | null) => {
    const { data, error } = await supabase.rpc('acknowledge_policy_attestation' as any, {
      p_attestation_id: attestationId,
      p_notes: notes || null,
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
    requestAttestation,
    acknowledgeAttestation,
  };
}
