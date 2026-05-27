import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDrillAudit, type LogDrillEventInput } from '@/hooks/useDrillAudit';
import { notifyAgentAction } from '@/hooks/useAgentNotifications';

interface CloseBreakInput {
  exceptionCaseId: string;
  note: string;
  module?: string;
  drillAudit?: Partial<LogDrillEventInput>;
}

interface AddBreakCommentInput {
  exceptionId: string;
  comment: string;
}

interface RequestBreakReviewInput {
  exceptionCaseId: string;
  module?: string;
  drillAudit?: Partial<LogDrillEventInput>;
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error('Authentication required');
  }

  return user.id;
}

export function useCloseBreak() {
  const queryClient = useQueryClient();
  const { logDrillEvent } = useDrillAudit();

  return useMutation({
    mutationFn: async ({ exceptionCaseId, note, module = 'drill', drillAudit }: CloseBreakInput) => {
      const userId = await getCurrentUserId();
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('exception_cases')
        .update({
          status: 'closed',
          closed_at: now,
          closed_by: userId,
          resolution_notes: note,
          updated_at: now,
        })
        .eq('id', exceptionCaseId);

      if (error) {
        throw error;
      }

      await logDrillEvent({
        module,
        action: 'close_break',
        drillPath: drillAudit?.drillPath ?? [],
        scopeFilters: drillAudit?.scopeFilters,
        targetLevel: drillAudit?.targetLevel ?? 0,
        rowCount: drillAudit?.rowCount,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recon', 'break-detail', variables.exceptionCaseId] });
      queryClient.invalidateQueries({ queryKey: ['recon', 'break-documents'] });
      queryClient.invalidateQueries({ queryKey: ['recon', 'breakdown'] });
      toast.success('Break closed');
    },
    onError: (error) => {
      toast.error('Failed to close break', { description: error.message });
    },
  });
}

export function useAddBreakComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ exceptionId, comment }: AddBreakCommentInput) => {
      const userId = await getCurrentUserId();
      const { error } = await supabase.from('exception_comments').insert({
        exception_id: exceptionId,
        user_id: userId,
        comment,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recon', 'break-detail'] });
      queryClient.invalidateQueries({ queryKey: ['drill-break-comments', variables.exceptionId] });
      toast.success('Comment added');
    },
    onError: (error) => {
      toast.error('Failed to add comment', { description: error.message });
    },
  });
}

export function useRequestBreakReview() {
  const queryClient = useQueryClient();
  const { logDrillEvent } = useDrillAudit();

  return useMutation({
    mutationFn: async ({ exceptionCaseId, module = 'drill', drillAudit }: RequestBreakReviewInput) => {
      const { error } = await supabase
        .from('exception_cases')
        .update({
          status: 'in_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', exceptionCaseId);

      if (error) {
        throw error;
      }

      await logDrillEvent({
        module,
        action: 'request_review',
        drillPath: drillAudit?.drillPath ?? [],
        scopeFilters: drillAudit?.scopeFilters,
        targetLevel: drillAudit?.targetLevel ?? 0,
        rowCount: drillAudit?.rowCount,
      });

      notifyAgentAction('Break sent to review');
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recon', 'break-detail', variables.exceptionCaseId] });
      queryClient.invalidateQueries({ queryKey: ['recon', 'break-documents'] });
      queryClient.invalidateQueries({ queryKey: ['recon', 'breakdown'] });
      toast.success('Break sent for review');
    },
    onError: (error) => {
      toast.error('Failed to request review', { description: error.message });
    },
  });
}
