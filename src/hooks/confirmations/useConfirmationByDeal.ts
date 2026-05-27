import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createDrillState, useDrillErrorToast, type DrillQueryState } from '@/hooks/drill/shared';
import type { ConfirmationStage } from './types';

export interface ConfirmationByDealRow {
  id: string;
  dealId: string;
  counterpartyId: string;
  counterpartyName: string;
  productCode: string | null;
  stage: ConfirmationStage;
  fieldDiscrepancyCount: number;
  materialDiscrepancyCount: number;
  blockingSettlement: boolean;
  ourDocId: string | null;
  counterpartyDocId: string | null;
  lastActionAt: string | null;
  slaBreachAt: string | null;
}

export interface UseConfirmationByDealFilters {
  stage?: string;
  counterpartyId?: string;
  productCode?: string;
  blockingSettlement?: boolean;
}

export function useConfirmationByDeal(
  runId: string | null,
  filters: UseConfirmationByDealFilters = {},
): DrillQueryState<ConfirmationByDealRow[]> {
  const query = useQuery({
    queryKey: ['confirmations', 'by-deal', runId, filters],
    queryFn: async () => {
      if (!runId) return { rows: [], names: new Map<string, string>(), products: new Map<string, string>() };
      const { data, error } = await supabase.rpc('get_mv_confirmation_by_deal', {
        _run_id: runId,
        _counterparty_id: filters.counterpartyId ?? null,
        _stage: filters.stage ?? null,
      });
      if (error) throw error;
      const baseRows = data ?? [];
      const cpIds = Array.from(new Set(baseRows.map((r) => r.counterparty_id).filter(Boolean)));
      const docIds = Array.from(
        new Set(
          baseRows
            .flatMap((r) => [r.our_doc_id, r.counterparty_doc_id])
            .filter((d): d is string => Boolean(d)),
        ),
      );
      const [namesRes, docsRes] = await Promise.all([
        cpIds.length > 0
          ? supabase.from('canonical_counterparties').select('id, name').in('id', cpIds as string[])
          : Promise.resolve({ data: [] as Array<{ id: string; name: string | null }>, error: null }),
        docIds.length > 0
          ? supabase
              .from('confirmation_documents')
              .select('confirmation_doc_id, product_code')
              .in('confirmation_doc_id', docIds)
          : Promise.resolve({
              data: [] as Array<{ confirmation_doc_id: string; product_code: string | null }>,
              error: null,
            }),
      ]);
      const names = new Map((namesRes.data ?? []).map((c) => [c.id, c.name ?? '']));
      const products = new Map((docsRes.data ?? []).map((d) => [d.confirmation_doc_id, d.product_code ?? '']));
      return { rows: baseRows, names, products };
    },
    enabled: !!runId,
  });

  useDrillErrorToast(query.error, 'Failed to load trade confirmations');

  let rows: ConfirmationByDealRow[] = (query.data?.rows ?? []).map((r) => {
    const productFromOur = r.our_doc_id ? query.data?.products.get(r.our_doc_id) : null;
    const productFromTheir = r.counterparty_doc_id ? query.data?.products.get(r.counterparty_doc_id) : null;
    return {
      id: r.deal_id,
      dealId: r.deal_id,
      counterpartyId: r.counterparty_id,
      counterpartyName: query.data?.names.get(r.counterparty_id) || 'Unknown',
      productCode: productFromOur || productFromTheir || null,
      stage: r.stage as ConfirmationStage,
      fieldDiscrepancyCount: Number(r.field_discrepancy_count ?? 0),
      materialDiscrepancyCount: Number(r.material_discrepancy_count ?? 0),
      blockingSettlement: Boolean(r.blocking_settlement),
      ourDocId: r.our_doc_id,
      counterpartyDocId: r.counterparty_doc_id,
      lastActionAt: r.last_action_at,
      slaBreachAt: r.sla_breach_at,
    };
  });

  if (filters.productCode) {
    rows = rows.filter((r) => r.productCode === filters.productCode);
  }
  if (filters.blockingSettlement) {
    rows = rows.filter((r) => r.blockingSettlement);
  }

  return createDrillState({
    data: rows,
    error: query.error as Error | null,
    isEmpty: rows.length === 0,
    isLoading: query.isLoading,
  });
}
