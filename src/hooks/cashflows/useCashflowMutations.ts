import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CashflowExceptionStatus =
  | 'open'
  | 'under_review'
  | 'explained'
  | 'accepted'
  | 'rejected'
  | 'resolved';

export const CASHFLOW_EXCEPTION_STATUSES: CashflowExceptionStatus[] = [
  'open',
  'under_review',
  'explained',
  'accepted',
  'rejected',
  'resolved',
];

async function getAuthContext() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Authentication required');
  const { data: tenantId, error: tErr } = await supabase.rpc('get_user_tenant_id', { _user_id: user.id });
  if (tErr) throw tErr;
  if (!tenantId) throw new Error('Tenant context unavailable');
  return { userId: user.id, tenantId: tenantId as string };
}

export function useResolveCashflowBreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ exceptionId, notes }: { exceptionId: string; notes?: string }) => {
      const { userId } = await getAuthContext();
      const { error } = await supabase
        .from('cashflow_exceptions')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: userId,
          resolution_notes: notes ?? null,
        })
        .eq('id', exceptionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cashflow break resolved');
      qc.invalidateQueries({ queryKey: ['cashflow'] });
      qc.invalidateQueries({ queryKey: ['cashflow-exceptions'] });
    },
    onError: (e: Error) => toast.error('Failed to resolve break', { description: e.message }),
  });
}

export interface AddCashflowCommentInput {
  exceptionId: string;
  comment: string;
}

export function useAddCashflowComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ exceptionId, comment }: AddCashflowCommentInput) => {
      const { userId, tenantId } = await getAuthContext();
      const { data, error } = await supabase
        .from('cashflow_comments')
        .insert({
          tenant_id: tenantId,
          cashflow_exception_id: exceptionId,
          user_id: userId,
          comment,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success('Comment added');
      qc.invalidateQueries({ queryKey: ['cashflow', 'comments', vars.exceptionId] });
    },
    onError: (e: Error) => toast.error('Failed to add comment', { description: e.message }),
  });
}

export interface OverrideBucketInput {
  consolidatedCashflowId: string;
  newBucket: string;
  reason: string;
  oldBucket?: string | null;
}

export function useOverrideBucket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ consolidatedCashflowId, newBucket, reason, oldBucket }: OverrideBucketInput) => {
      const { userId, tenantId } = await getAuthContext();

      const { error: updErr } = await supabase
        .from('consolidated_cashflow')
        .update({ bucket: newBucket as never })
        .eq('id', consolidatedCashflowId);
      if (updErr) throw updErr;

      const { error: auditErr } = await supabase.from('cashflow_override_audit').insert({
        tenant_id: tenantId,
        consolidated_id: consolidatedCashflowId,
        field_changed: 'bucket',
        old_value: oldBucket ?? null,
        new_value: newBucket,
        reason,
        changed_by: userId,
      });
      if (auditErr) throw auditErr;
    },
    onSuccess: () => {
      toast.success('Bucket overridden');
      qc.invalidateQueries({ queryKey: ['cashflow'] });
      qc.invalidateQueries({ queryKey: ['consolidated-cashflows'] });
    },
    onError: (e: Error) => toast.error('Failed to override bucket', { description: e.message }),
  });
}

// ---------------------------------------------------------------------------
// Workflow actions: assignment, status change, status history, notifications
// ---------------------------------------------------------------------------

export interface ChangeStatusInput {
  exceptionId: string;
  toStatus: CashflowExceptionStatus;
  note: string;
}

/**
 * Change a cashflow exception status (open / under_review / explained /
 * accepted / rejected / resolved). A justification note is required and is
 * appended to the status history.
 */
export function useChangeCashflowExceptionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ exceptionId, toStatus, note }: ChangeStatusInput) => {
      if (!note || note.trim().length === 0) {
        throw new Error('A note is required when changing status');
      }
      const { data, error } = await supabase.rpc('cashflow_exception_change_status', {
        _exception_id: exceptionId,
        _to_status: toStatus,
        _note: note,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success(`Status set to ${vars.toStatus}`);
      qc.invalidateQueries({ queryKey: ['cashflow'] });
      qc.invalidateQueries({ queryKey: ['cashflow-exceptions'] });
      qc.invalidateQueries({ queryKey: ['cashflow', 'status-history', vars.exceptionId] });
    },
    onError: (e: Error) => toast.error('Failed to change status', { description: e.message }),
  });
}

export interface AssignExceptionInput {
  exceptionId: string;
  assigneeId: string | null;
}

/** Assign a cashflow exception to a tenant member, or clear with `null`. */
export function useAssignCashflowException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ exceptionId, assigneeId }: AssignExceptionInput) => {
      const { data, error } = await supabase.rpc('cashflow_exception_assign', {
        _exception_id: exceptionId,
        _assignee: assigneeId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.assigneeId ? 'Assignment updated' : 'Assignment cleared');
      qc.invalidateQueries({ queryKey: ['cashflow'] });
      qc.invalidateQueries({ queryKey: ['cashflow-exceptions'] });
    },
    onError: (e: Error) => toast.error('Failed to update assignment', { description: e.message }),
  });
}

/** Trigger an immediate SLA reminder scan (also runs every 15 min via cron). */
export function useTriggerSlaScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('cashflow_exception_scan_sla_breaches');
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      toast.success(`SLA scan: ${count ?? 0} reminder(s) sent`);
      qc.invalidateQueries({ queryKey: ['cashflow', 'notifications'] });
    },
    onError: (e: Error) => toast.error('SLA scan failed', { description: e.message }),
  });
}

export interface CashflowStatusHistoryEntry {
  id: string;
  from_status: string | null;
  to_status: string;
  note: string;
  changed_by: string | null;
  changed_at: string;
}

/** Read the status history thread for an exception. */
export function useCashflowExceptionStatusHistory(exceptionId: string | null | undefined) {
  return useQuery({
    queryKey: ['cashflow', 'status-history', exceptionId],
    enabled: Boolean(exceptionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashflow_exception_status_history')
        .select('id, from_status, to_status, note, changed_by, changed_at')
        .eq('exception_id', exceptionId as string)
        .order('changed_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CashflowStatusHistoryEntry[];
    },
  });
}

export interface CashflowExceptionCommentRow {
  id: string;
  body: string;
  author_id: string | null;
  created_at: string;
}

/** Read the free-form comment thread for an exception. */
export function useCashflowExceptionComments(exceptionId: string | null | undefined) {
  return useQuery({
    queryKey: ['cashflow', 'thread', exceptionId],
    enabled: Boolean(exceptionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashflow_exception_comments')
        .select('id, body, author_id, created_at')
        .eq('exception_id', exceptionId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CashflowExceptionCommentRow[];
    },
  });
}

export interface AddThreadCommentInput {
  exceptionId: string;
  body: string;
}

/** Append a free-form comment to the exception thread. */
export function useAddCashflowExceptionThreadComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ exceptionId, body }: AddThreadCommentInput) => {
      if (!body || body.trim().length === 0) throw new Error('Comment cannot be empty');
      const { userId, tenantId } = await getAuthContext();
      const { data, error } = await supabase
        .from('cashflow_exception_comments')
        .insert({
          tenant_id: tenantId,
          exception_id: exceptionId,
          author_id: userId,
          body: body.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success('Comment posted');
      qc.invalidateQueries({ queryKey: ['cashflow', 'thread', vars.exceptionId] });
    },
    onError: (e: Error) => toast.error('Failed to post comment', { description: e.message }),
  });
}
