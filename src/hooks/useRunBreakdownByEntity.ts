import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { createDrillState, useDrillErrorToast } from './drill/shared';

export type RunBreakdownByEntityRow = {
  legalEntityId: string;
  legalEntityName: string;
  breakCategory: string;
  breakCount: number;
  totalExposureUsd: number;
  topCounterpartyId: string | null;
  topCounterpartyName: string | null;
};

type RunBreakdownByEntityView = Database['public']['Views']['v_recon_run_by_entity']['Row'];

export function useRunBreakdownByEntity(runId: string, breakCategory?: string) {
  const query = useQuery({
    queryKey: ['recon', 'breakdown', 'by-entity', runId, breakCategory ?? null],
    enabled: Boolean(runId),
    staleTime: 60_000,
    queryFn: async (): Promise<RunBreakdownByEntityRow[]> => {
      let statement = supabase
        .from('v_recon_run_by_entity')
        .select('*')
        .eq('run_id', runId)
        .order('total_exposure_usd', { ascending: false, nullsFirst: false });

      if (breakCategory) {
        statement = statement.eq('break_category', breakCategory);
      }

      const { data, error } = await statement;

      if (error) {
        throw error;
      }

      return (data ?? []).map((row: RunBreakdownByEntityView) => ({
        legalEntityId: row.legal_entity_id ?? '',
        legalEntityName: row.legal_entity_name ?? 'Unassigned entity',
        breakCategory: row.break_category ?? 'unknown',
        breakCount: row.break_count ?? 0,
        totalExposureUsd: row.total_exposure_usd ?? 0,
        topCounterpartyId: row.top_counterparty_id,
        topCounterpartyName: row.top_counterparty_name,
      }));
    },
  });

  useDrillErrorToast(query.error, 'Failed to load entity breakdown');

  const data = useMemo(() => query.data ?? [], [query.data]);

  return createDrillState({
    data,
    error: query.error,
    isLoading: query.isLoading,
    isEmpty: !query.isLoading && data.length === 0,
  });
}
