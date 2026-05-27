import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { createDrillState, useDrillErrorToast } from './drill/shared';

export type RunBreakdownByTypeRow = {
  breakCategory: string;
  breakCount: number;
  totalExposureUsd: number;
  minAmountDelta: number | null;
  maxAmountDelta: number | null;
  avgAgeDays: number | null;
};

type RunBreakdownByTypeFn = Database['public']['Functions']['get_mv_recon_run_by_break_type']['Returns'][number];

export function useRunBreakdownByType(runId: string) {
  const query = useQuery({
    queryKey: ['recon', 'breakdown', 'by-type', runId],
    enabled: Boolean(runId),
    staleTime: 60_000,
    queryFn: async (): Promise<RunBreakdownByTypeRow[]> => {
      const { data, error } = await supabase.rpc('get_mv_recon_run_by_break_type', { _run_id: runId });

      if (error) {
        throw error;
      }

      return (data ?? []).map((row: RunBreakdownByTypeFn) => ({
        breakCategory: row.break_category,
        breakCount: row.break_count,
        totalExposureUsd: row.total_exposure_usd,
        minAmountDelta: row.min_amount_delta,
        maxAmountDelta: row.max_amount_delta,
        avgAgeDays: row.avg_age_days,
      }));
    },
  });

  useDrillErrorToast(query.error, 'Failed to load break-type breakdown');

  const data = useMemo(() => query.data ?? [], [query.data]);

  return createDrillState({
    data,
    error: query.error,
    isLoading: query.isLoading,
    isEmpty: !query.isLoading && data.length === 0,
  });
}
