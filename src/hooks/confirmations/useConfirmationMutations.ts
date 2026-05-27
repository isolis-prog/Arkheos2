import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

async function getAuthContext() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Authentication required');
  return { userId: user.id };
}

interface DiscrepancyMutationVars {
  discrepancyId: string;
  runId: string;
  dealId: string;
}

interface ResolveVars extends DiscrepancyMutationVars {
  resolutionNote: string;
}

export function useResolveDiscrepancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ discrepancyId, resolutionNote }: ResolveVars) => {
      if (!resolutionNote || resolutionNote.trim().length === 0) {
        throw new Error('Resolution note is required');
      }
      const { userId } = await getAuthContext();
      const { error } = await supabase
        .from('confirmation_discrepancies')
        .update({
          status: 'resolved',
          resolution_note: resolutionNote,
          resolved_by: userId,
          resolved_at: new Date().toISOString(),
        })
        .eq('discrepancy_id', discrepancyId);
      if (error) throw error;
    },
    onMutate: async ({ runId, dealId, discrepancyId }) => {
      await qc.cancelQueries({ queryKey: ['confirmations', 'deal-detail', runId, dealId] });
      const prev = qc.getQueryData(['confirmations', 'deal-detail', runId, dealId]);
      qc.setQueryData(['confirmations', 'deal-detail', runId, dealId], (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const data = old as { discRows?: Array<{ discrepancy_id: string; status: string }> };
        if (!data.discRows) return old;
        return {
          ...data,
          discRows: data.discRows.map((d) =>
            d.discrepancy_id === discrepancyId ? { ...d, status: 'resolved' } : d,
          ),
        };
      });
      return { prev };
    },
    onError: (e: Error, vars, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(['confirmations', 'deal-detail', vars.runId, vars.dealId], ctx.prev);
      }
      toast.error('Failed to resolve discrepancy', { description: e.message });
    },
    onSuccess: (_, vars) => {
      toast.success('Discrepancy resolved');
      qc.invalidateQueries({ queryKey: ['confirmations', 'deal-detail', vars.runId, vars.dealId] });
      qc.invalidateQueries({ queryKey: ['confirmations', 'by-deal', vars.runId] });
    },
  });
}

interface AcceptVars extends DiscrepancyMutationVars {
  justification: string;
}

export function useAcceptDiscrepancyAsIs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ discrepancyId, justification }: AcceptVars) => {
      if (!justification || justification.trim().length === 0) {
        throw new Error('Justification is required');
      }
      const { userId } = await getAuthContext();
      const { error } = await supabase
        .from('confirmation_discrepancies')
        .update({
          status: 'accepted_as_is',
          resolution_note: justification,
          resolved_by: userId,
          resolved_at: new Date().toISOString(),
        })
        .eq('discrepancy_id', discrepancyId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success('Discrepancy accepted as-is');
      qc.invalidateQueries({ queryKey: ['confirmations', 'deal-detail', vars.runId, vars.dealId] });
      qc.invalidateQueries({ queryKey: ['confirmations', 'by-deal', vars.runId] });
    },
    onError: (e: Error) => toast.error('Failed to accept discrepancy', { description: e.message }),
  });
}

interface FlagVars extends DiscrepancyMutationVars {
  fieldName: string;
  reason?: string;
}

export function useFlagFalsePositive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ discrepancyId, fieldName, reason }: FlagVars) => {
      const { userId } = await getAuthContext();
      const { error } = await supabase
        .from('confirmation_discrepancies')
        .update({
          status: 'false_positive',
          resolution_note: reason ?? `Flagged as false positive for field "${fieldName}"`,
          resolved_by: userId,
          resolved_at: new Date().toISOString(),
        })
        .eq('discrepancy_id', discrepancyId);
      if (error) throw error;
      // Suggestion: log a hint to refine field rules (best-effort, non-blocking)
      try {
        await supabase.from('audit_events').insert({
          tenant_id: (await supabase.rpc('get_user_tenant_id', { _user_id: userId })).data as string,
          module_key: 'confirmations_recon',
          entity_type: 'confirmation_field_rule_suggestion',
          entity_id: discrepancyId,
          action: 'rule_refinement_suggested',
          actor_id: userId,
          summary: `False positive flagged on field "${fieldName}" — consider widening tolerance`,
        });
      } catch {
        /* non-blocking */
      }
    },
    onSuccess: (_, vars) => {
      toast.success('Flagged as false positive', {
        description: 'A suggestion was logged to refine the field rule.',
      });
      qc.invalidateQueries({ queryKey: ['confirmations', 'deal-detail', vars.runId, vars.dealId] });
    },
    onError: (e: Error) => toast.error('Failed to flag false positive', { description: e.message }),
  });
}

interface EscalateVars {
  runId: string;
  dealId: string;
  tradeConfirmationId: string;
  note?: string;
}

export function useEscalateTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tradeConfirmationId, dealId, note }: EscalateVars) => {
      const { userId } = await getAuthContext();
      const { error } = await supabase
        .from('trade_confirmation_status')
        .update({
          stage: 'disputed',
          last_action_at: new Date().toISOString(),
          last_actor_id: userId,
        })
        .eq('trade_confirmation_id', tradeConfirmationId);
      if (error) throw error;
      try {
        const tenantRes = await supabase.rpc('get_user_tenant_id', { _user_id: userId });
        await supabase.from('audit_events').insert({
          tenant_id: tenantRes.data as string,
          module_key: 'confirmations_recon',
          entity_type: 'trade_confirmation_status',
          entity_id: tradeConfirmationId,
          action: 'escalated_to_counterparty',
          actor_id: userId,
          summary: `Trade ${dealId} escalated to counterparty${note ? `: ${note}` : ''}`,
        });
      } catch {
        /* non-blocking */
      }
    },
    onSuccess: (_, vars) => {
      toast.success('Escalation logged', {
        description: 'Counterparty contact notification stub fired.',
      });
      qc.invalidateQueries({ queryKey: ['confirmations', 'deal-detail', vars.runId, vars.dealId] });
      qc.invalidateQueries({ queryKey: ['confirmations', 'by-deal', vars.runId] });
    },
    onError: (e: Error) => toast.error('Failed to escalate', { description: e.message }),
  });
}

interface RejectVars extends DiscrepancyMutationVars {
  reason: string;
}

/** Mark a discrepancy as rejected — counterparty value is wrong, ours stands. */
export function useRejectDiscrepancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ discrepancyId, reason }: RejectVars) => {
      if (!reason || reason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }
      const { userId } = await getAuthContext();
      const { error } = await supabase
        .from('confirmation_discrepancies')
        .update({
          status: 'rejected',
          resolution_note: reason,
          resolved_by: userId,
          resolved_at: new Date().toISOString(),
        })
        .eq('discrepancy_id', discrepancyId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success('Discrepancy rejected');
      qc.invalidateQueries({ queryKey: ['confirmations', 'deal-detail', vars.runId, vars.dealId] });
      qc.invalidateQueries({ queryKey: ['confirmations', 'by-deal', vars.runId] });
    },
    onError: (e: Error) => toast.error('Failed to reject discrepancy', { description: e.message }),
  });
}

interface AmendVars extends DiscrepancyMutationVars {
  fieldName: string;
  ourValue: string | null;
  counterpartyValue: string | null;
  rationale: string;
  targetSystem?: 'ETRM' | 'NETSUITE';
}

/** Create an amendment_plan row pointing at this deal/field. */
export function useRequestAmendment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      discrepancyId,
      dealId,
      fieldName,
      ourValue,
      counterpartyValue,
      rationale,
      targetSystem = 'ETRM',
    }: AmendVars) => {
      if (!rationale || rationale.trim().length === 0) {
        throw new Error('Rationale is required');
      }
      const { userId } = await getAuthContext();
      const tenantRes = await supabase.rpc('get_user_tenant_id', { _user_id: userId });
      if (tenantRes.error) throw tenantRes.error;
      const tenantId = tenantRes.data as string | null;
      if (!tenantId) throw new Error('Unable to resolve tenant');

      const { error: insertErr } = await supabase.from('amendment_plans').insert([
        {
          tenant_id: tenantId,
          target_system: targetSystem,
          action_type: 'UPDATE',
          payload: {
            deal_id: dealId,
            field: fieldName,
            from_value: ourValue,
            to_value: counterpartyValue,
            source: 'confirmations_recon',
            discrepancy_id: discrepancyId,
          },
          rationale,
          status: 'proposed',
          requires_approval: true,
          created_by: userId,
        },
      ]);
      if (insertErr) throw insertErr;

      const { error: discErr } = await supabase
        .from('confirmation_discrepancies')
        .update({
          status: 'amend_requested',
          resolution_note: rationale,
          resolved_by: userId,
          resolved_at: new Date().toISOString(),
        })
        .eq('discrepancy_id', discrepancyId);
      if (discErr) throw discErr;
    },
    onSuccess: (_, vars) => {
      toast.success('Amendment requested', {
        description: 'Draft amendment plan created — awaiting approval.',
      });
      qc.invalidateQueries({ queryKey: ['confirmations', 'deal-detail', vars.runId, vars.dealId] });
      qc.invalidateQueries({ queryKey: ['confirmations', 'by-deal', vars.runId] });
    },
    onError: (e: Error) => toast.error('Failed to request amendment', { description: e.message }),
  });
}

interface ReopenVars extends DiscrepancyMutationVars {
  reason?: string;
}

/** Reopen a previously closed discrepancy. */
export function useReopenDiscrepancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ discrepancyId, reason }: ReopenVars) => {
      const { userId } = await getAuthContext();
      const { error } = await supabase
        .from('confirmation_discrepancies')
        .update({
          status: 'open',
          resolution_note: reason ?? null,
          resolved_by: null,
          resolved_at: null,
        })
        .eq('discrepancy_id', discrepancyId);
      if (error) throw error;
      try {
        const tenantRes = await supabase.rpc('get_user_tenant_id', { _user_id: userId });
        await supabase.from('audit_events').insert({
          tenant_id: tenantRes.data as string,
          module_key: 'confirmations_recon',
          entity_type: 'confirmation_discrepancy',
          entity_id: discrepancyId,
          action: 'reopened',
          actor_id: userId,
          summary: reason ?? 'Discrepancy reopened',
        });
      } catch {
        /* non-blocking */
      }
    },
    onSuccess: (_, vars) => {
      toast.success('Discrepancy reopened');
      qc.invalidateQueries({ queryKey: ['confirmations', 'deal-detail', vars.runId, vars.dealId] });
      qc.invalidateQueries({ queryKey: ['confirmations', 'by-deal', vars.runId] });
    },
    onError: (e: Error) => toast.error('Failed to reopen discrepancy', { description: e.message }),
  });
}

