import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createDrillState, useDrillErrorToast, type DrillQueryState } from '@/hooks/drill/shared';

export interface ConfirmationByCounterpartyRow {
  id: string;
  stage: string;
  counterpartyId: string;
  counterpartyName: string;
  dealCount: number;
  materialDiscrepancyCount: number;
  avgFieldDiscrepancies: number;
  oldestAwaitingDays: number;
}

export function useConfirmationByCounterparty(
  runId: string | null,
  filters: { stage?: string; productCode?: string } = {},
): DrillQueryState<ConfirmationByCounterpartyRow[]> {
  const query = useQuery({
    queryKey: ['confirmations', 'by-counterparty', runId, filters.stage ?? null],
    queryFn: async () => {
      if (!runId) return { rows: [], names: new Map<string, string>() };
      const { data, error } = await supabase.rpc('get_mv_confirmation_by_counterparty', {
        _run_id: runId,
        _stage: filters.stage ?? null,
      });
      if (error) throw error;
      const cpIds = Array.from(new Set((data ?? []).map((r) => r.counterparty_id).filter(Boolean)));
      let names = new Map<string, string>();
      if (cpIds.length > 0) {
        const { data: cps } = await supabase
          .from('canonical_counterparties')
          .select('id, name')
          .in('id', cpIds as string[]);
        names = new Map((cps ?? []).map((c) => [c.id, c.name ?? '']));
      }
      return { rows: data ?? [], names };
    },
    enabled: !!runId,
  });

  useDrillErrorToast(query.error, 'Failed to load confirmation counterparties');

  const rows: ConfirmationByCounterpartyRow[] = (query.data?.rows ?? []).map((r) => ({
    id: `${r.stage}::${r.counterparty_id}`,
    stage: r.stage,
    counterpartyId: r.counterparty_id,
    counterpartyName: query.data?.names.get(r.counterparty_id) || 'Unknown',
    dealCount: Number(r.deal_count ?? 0),
    materialDiscrepancyCount: Number(r.material_discrepancy_count ?? 0),
    avgFieldDiscrepancies: Number(r.avg_field_discrepancies ?? 0),
    oldestAwaitingDays: Number(r.oldest_awaiting_days ?? 0),
  }));

  return createDrillState({
    data: rows,
    error: query.error as Error | null,
    isEmpty: rows.length === 0,
    isLoading: query.isLoading,
  });
}
