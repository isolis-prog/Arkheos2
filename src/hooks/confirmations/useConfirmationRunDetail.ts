import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createDrillState, useDrillErrorToast, type DrillQueryState } from '@/hooks/drill/shared';

export interface ConfirmationRunDetail {
  runId: string;
  asOfDate: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  totalTrades: number;
  matchedCount: number;
  unmatchedCount: number;
  disputedCount: number;
}

export function useConfirmationRunDetail(runId: string | null): DrillQueryState<ConfirmationRunDetail | null> {
  const query = useQuery({
    queryKey: ['confirmations', 'run', runId],
    queryFn: async () => {
      if (!runId) return null;
      const { data, error } = await supabase
        .from('confirmation_runs')
        .select('*')
        .eq('run_id', runId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!runId,
  });

  useDrillErrorToast(query.error, 'Failed to load confirmation run');

  const data: ConfirmationRunDetail | null = query.data
    ? {
        runId: query.data.run_id,
        asOfDate: query.data.as_of_date,
        status: query.data.status ?? 'pending',
        startedAt: query.data.started_at,
        completedAt: query.data.completed_at,
        totalTrades: Number(query.data.total_trades ?? 0),
        matchedCount: Number(query.data.matched_count ?? 0),
        unmatchedCount: Number(query.data.unmatched_count ?? 0),
        disputedCount: Number(query.data.disputed_count ?? 0),
      }
    : null;

  return createDrillState({
    data,
    error: query.error as Error | null,
    isEmpty: !data,
    isLoading: query.isLoading,
  });
}
