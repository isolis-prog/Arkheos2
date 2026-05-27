import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { createDrillState, useDrillErrorToast } from './drill/shared';

export interface RunBreakdownByCounterpartyFilters {
  legalEntityId?: string;
  breakCategory?: string;
}

export type RunBreakdownByCounterpartyRow = {
  legalEntityId: string | null;
  legalEntityName: string | null;
  counterpartyId: string | null;
  counterpartyName: string;
  breakCategory: string;
  breakCount: number;
  totalExposureUsd: number;
  oldestBreakAgeDays: number | null;
  openDocCount: number;
};

type RunBreakdownByCounterpartyView = Database['public']['Views']['v_recon_run_by_counterparty']['Row'];

export function useRunBreakdownByCounterparty(runId: string, filters: RunBreakdownByCounterpartyFilters) {
  const query = useQuery({
    queryKey: ['recon', 'breakdown', 'by-counterparty', runId, filters.legalEntityId ?? null, filters.breakCategory ?? null],
    enabled: Boolean(runId),
    staleTime: 60_000,
    queryFn: async (): Promise<RunBreakdownByCounterpartyRow[]> => {
      let statement = supabase
        .from('v_recon_run_by_counterparty')
        .select('*')
        .eq('run_id', runId)
        .order('total_exposure_usd', { ascending: false, nullsFirst: false });

      if (filters.legalEntityId) {
        statement = statement.eq('legal_entity_id', filters.legalEntityId);
      }

      if (filters.breakCategory) {
        statement = statement.eq('break_category', filters.breakCategory);
      }

      const { data, error } = await statement;

      if (error) {
        throw error;
      }

      return (data ?? []).map((row: RunBreakdownByCounterpartyView) => ({
        legalEntityId: row.legal_entity_id,
        legalEntityName: row.legal_entity_name,
        counterpartyId: row.external_counterparty_id,
        counterpartyName: row.counterparty_name ?? 'Unknown counterparty',
        breakCategory: row.break_category ?? 'unknown',
        breakCount: row.break_count ?? 0,
        totalExposureUsd: row.total_exposure_usd ?? 0,
        oldestBreakAgeDays: row.oldest_break_age_days,
        openDocCount: row.open_doc_count ?? 0,
      }));
    },
  });

  useDrillErrorToast(query.error, 'Failed to load counterparty breakdown');

  const data = useMemo(() => query.data ?? [], [query.data]);

  return createDrillState({
    data,
    error: query.error,
    isLoading: query.isLoading,
    isEmpty: !query.isLoading && data.length === 0,
  });
}
