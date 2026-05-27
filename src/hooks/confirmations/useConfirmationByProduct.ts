import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createDrillState, useDrillErrorToast, type DrillQueryState } from '@/hooks/drill/shared';

export interface ConfirmationByProductRow {
  id: string;
  stage: string;
  productCode: string;
  dealCount: number;
  materialDiscrepancyCount: number;
  totalNotional: number;
}

export function useConfirmationByProduct(
  runId: string | null,
  filters: { stage?: string } = {},
): DrillQueryState<ConfirmationByProductRow[]> {
  const query = useQuery({
    queryKey: ['confirmations', 'by-product', runId, filters.stage ?? null],
    queryFn: async () => {
      if (!runId) return [];
      const { data, error } = await supabase.rpc('get_mv_confirmation_by_product', {
        _run_id: runId,
        _stage: filters.stage ?? null,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!runId,
  });

  useDrillErrorToast(query.error, 'Failed to load confirmation products');

  const rows: ConfirmationByProductRow[] = (query.data ?? []).map((r) => ({
    id: `${r.stage}::${r.product_code}`,
    stage: r.stage,
    productCode: r.product_code,
    dealCount: Number(r.deal_count ?? 0),
    materialDiscrepancyCount: Number(r.material_discrepancy_count ?? 0),
    totalNotional: Number(r.total_notional ?? 0),
  }));

  return createDrillState({
    data: rows,
    error: query.error as Error | null,
    isEmpty: rows.length === 0,
    isLoading: query.isLoading,
  });
}
