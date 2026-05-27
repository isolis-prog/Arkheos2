import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

type AmendmentStatus = Database['public']['Enums']['amendment_status'];

export interface AmendmentPlan {
  id: string;
  exceptionId: string | null;
  matchGroupId: string | null;
  actionType: string;
  targetSystem: string;
  payload: Record<string, unknown>;
  deltaSummary: Record<string, unknown>;
  rationale: string | null;
  riskFlags: string[];
  status: AmendmentStatus;
  requiresApproval: boolean;
  approvalThreshold: number | null;
  approvedBy: string | null;
  approvedAt: string | null;
  executedAt: string | null;
  exportedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAmendmentInput {
  exceptionId?: string;
  matchGroupId?: string;
  actionType: 'CREATE' | 'UPDATE' | 'REVERSE_AND_REPOST' | 'WRITE_OFF';
  targetSystem: 'netsuite' | 'etrm';
  payload: Record<string, unknown>;
  deltaSummary?: Record<string, unknown>;
  rationale?: string;
  riskFlags?: string[];
  requiresApproval?: boolean;
}

export function useAmendmentPlans() {
  return useQuery({
    queryKey: ['amendment-plans'],
    queryFn: async (): Promise<AmendmentPlan[]> => {
      const { data, error } = await supabase
        .from('amendment_plans')
        .select('*')
        .eq('tenant_id', DEMO_TENANT_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((ap) => ({
        id: ap.id,
        exceptionId: ap.exception_id,
        matchGroupId: ap.match_group_id,
        actionType: ap.action_type,
        targetSystem: ap.target_system,
        payload: (ap.payload as Record<string, unknown>) || {},
        deltaSummary: (ap.delta_summary as Record<string, unknown>) || {},
        rationale: ap.rationale,
        riskFlags: ap.risk_flags || [],
        status: ap.status || 'proposed',
        requiresApproval: ap.requires_approval ?? true,
        approvalThreshold: ap.approval_threshold ? Number(ap.approval_threshold) : null,
        approvedBy: ap.approved_by,
        approvedAt: ap.approved_at,
        executedAt: ap.executed_at,
        exportedAt: ap.exported_at,
        createdBy: ap.created_by,
        createdAt: ap.created_at || new Date().toISOString(),
        updatedAt: ap.updated_at || new Date().toISOString(),
      }));
    },
  });
}

export function useCreateAmendment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAmendmentInput) => {
      const { data, error } = await supabase
        .from('amendment_plans')
        .insert({
          tenant_id: DEMO_TENANT_ID,
          exception_id: input.exceptionId || null,
          match_group_id: input.matchGroupId || null,
          action_type: input.actionType,
          target_system: input.targetSystem,
          payload: input.payload as unknown as Database['public']['Tables']['amendment_plans']['Insert']['payload'],
          delta_summary: (input.deltaSummary || {}) as unknown as Database['public']['Tables']['amendment_plans']['Insert']['delta_summary'],
          rationale: input.rationale || null,
          risk_flags: input.riskFlags || [],
          requires_approval: input.requiresApproval ?? true,
          status: 'proposed' as const,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amendment-plans'] });
      toast.success('Amendment proposal created');
    },
    onError: (error) => {
      toast.error('Failed to create amendment');
      console.error(error);
    },
  });
}

export function useUpdateAmendmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      approvedBy,
    }: {
      id: string;
      status: AmendmentStatus;
      approvedBy?: string;
    }) => {
      const updates: Record<string, unknown> = { status };

      if (status === 'approved' && approvedBy) {
        updates.approved_by = approvedBy;
        updates.approved_at = new Date().toISOString();
      } else if (status === 'executed') {
        updates.executed_at = new Date().toISOString();
      } else if (status === 'exported') {
        updates.exported_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('amendment_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['amendment-plans'] });
      toast.success(`Amendment ${variables.status}`);
    },
    onError: (error) => {
      toast.error('Failed to update amendment');
      console.error(error);
    },
  });
}

export function useBulkCreateAmendments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inputs: CreateAmendmentInput[]) => {
      type InsertType = Database['public']['Tables']['amendment_plans']['Insert'];
      
      const records: InsertType[] = inputs.map((input) => ({
        tenant_id: DEMO_TENANT_ID,
        exception_id: input.exceptionId || null,
        match_group_id: input.matchGroupId || null,
        action_type: input.actionType,
        target_system: input.targetSystem,
        payload: input.payload as InsertType['payload'],
        delta_summary: (input.deltaSummary || {}) as InsertType['delta_summary'],
        rationale: input.rationale || null,
        risk_flags: input.riskFlags || [],
        requires_approval: input.requiresApproval ?? true,
        status: 'proposed' as const,
      }));

      const { data, error } = await supabase
        .from('amendment_plans')
        .insert(records)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['amendment-plans'] });
      toast.success(`Created ${data.length} amendment proposals`);
    },
    onError: (error) => {
      toast.error('Failed to create amendments');
      console.error(error);
    },
  });
}
