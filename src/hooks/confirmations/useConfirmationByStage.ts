import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createDrillState, useDrillErrorToast, type DrillQueryState } from '@/hooks/drill/shared';
import type { ConfirmationStage } from './types';

export interface ConfirmationByStageRow {
  id: string;
  stage: ConfirmationStage;
  dealCount: number;
  blockingCount: number;
  oldestAwaitingDays: number;
}

export function useConfirmationByStage(runId: string | null): DrillQueryState<ConfirmationByStageRow[]> {
  const query = useQuery({
    queryKey: ['confirmations', 'by-stage', runId],
    queryFn: async () => {
      if (!runId) return [];
      const { data, error } = await supabase.rpc('get_mv_confirmation_by_stage', { _run_id: runId });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!runId,
  });

  useDrillErrorToast(query.error, 'Failed to load confirmation stages');

  const rows: ConfirmationByStageRow[] = (query.data ?? []).map((r) => ({
    id: r.stage,
    stage: r.stage as ConfirmationStage,
    dealCount: Number(r.deal_count ?? 0),
    blockingCount: Number(r.blocking_count ?? 0),
    oldestAwaitingDays: Number(r.oldest_awaiting_days ?? 0),
  }));

  return createDrillState({
    data: rows,
    error: query.error as Error | null,
    isEmpty: rows.length === 0,
    isLoading: query.isLoading,
  });
}
