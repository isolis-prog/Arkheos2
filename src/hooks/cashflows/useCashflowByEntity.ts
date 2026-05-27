import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createDrillState, useDrillErrorToast, type DrillQueryState } from '@/hooks/drill/shared';

const TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

export interface CashflowEntityRow {
  legalEntityId: string | null;
  legalEntityName: string | null;
  bucket: string;
  flowDirection: 'inflow' | 'outflow';
  eventCount: number;
  totalAmountBase: number;
  topCounterpartyId: string | null;
  topCounterpartyName: string | null;
  currencies: string[];
  pctOfBucket: number;
}

export interface UseCashflowByEntityFilters {
  bucket?: string;
  flowDirection?: 'inflow' | 'outflow';
}

export function useCashflowByEntity(
  asOfDate: string,
  filters: UseCashflowByEntityFilters = {},
): DrillQueryState<CashflowEntityRow[]> {
  // Primary MV
  const mvQuery = useQuery({
    queryKey: ['cashflow', 'by-entity', asOfDate, filters],
    queryFn: async () => {
      let q = supabase.from('v_cashflow_by_entity').select('*').eq('as_of_date', asOfDate);
      if (filters.bucket) q = q.eq('bucket', filters.bucket);
      if (filters.flowDirection) q = q.eq('flow_direction', filters.flowDirection);
      const { data, error } = await q;
      if (error) {
        if ((error as any).code === '42501') return [];
        throw error;
      }
      return data || [];
    },
    enabled: !!asOfDate,
    retry: false,
  });

  // Fallback rows
  const fallbackQuery = useQuery({
    queryKey: ['cashflow', 'consolidated-fallback', TENANT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consolidated_cashflow')
        .select('bucket,direction,counterparty,legal_entity,currency_original,amount_base,amount_original,status')
        .eq('tenant_id', TENANT_ID);
      if (error) throw error;
      return data || [];
    },
  });

  useDrillErrorToast(
    (mvQuery.error as any)?.code === '42501' ? null : (mvQuery.error as Error | null),
    'Failed to load cashflow entities',
  );

  let rows: CashflowEntityRow[] = (mvQuery.data || []).map((r: any) => ({
    legalEntityId: r.legal_entity_id,
    legalEntityName: r.legal_entity_name,
    bucket: r.bucket,
    flowDirection: r.flow_direction as 'inflow' | 'outflow',
    eventCount: Number(r.event_count || 0),
    totalAmountBase: Number(r.total_amount_base || 0),
    topCounterpartyId: r.top_counterparty_id,
    topCounterpartyName: r.top_counterparty_name,
    currencies: (r.currency_list || []) as string[],
    pctOfBucket: 0,
  }));

  if (rows.length === 0) {
    // Fallback aggregation: group by (legal_entity, bucket, direction) from consolidated.
    const map = new Map<
      string,
      {
        entity: string;
        bucket: string;
        direction: 'inflow' | 'outflow';
        amount: number;
        count: number;
        currencies: Set<string>;
        topByCp: Map<string, number>;
      }
    >();

    (fallbackQuery.data || []).forEach((c: any) => {
      if (c.status === 'CANCELLED') return;
      if (filters.bucket && c.bucket !== filters.bucket) return;
      const dir = c.direction === 'INFLOW' ? 'inflow' : c.direction === 'OUTFLOW' ? 'outflow' : null;
      if (!dir) return;
      if (filters.flowDirection && dir !== filters.flowDirection) return;
      const entity = c.legal_entity || 'Unassigned';
      const key = `${entity}::${c.bucket}::${dir}`;
      const cur = map.get(key) || {
        entity,
        bucket: c.bucket,
        direction: dir,
        amount: 0,
        count: 0,
        currencies: new Set<string>(),
        topByCp: new Map<string, number>(),
      };
      const amt = Number(c.amount_base ?? c.amount_original ?? 0);
      cur.amount += amt;
      cur.count += 1;
      if (c.currency_original) cur.currencies.add(c.currency_original);
      if (c.counterparty) {
        cur.topByCp.set(c.counterparty, (cur.topByCp.get(c.counterparty) || 0) + Math.abs(amt));
      }
      map.set(key, cur);
    });

    rows = Array.from(map.values()).map((g) => {
      const top = Array.from(g.topByCp.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return {
        legalEntityId: g.entity,
        legalEntityName: g.entity,
        bucket: g.bucket,
        flowDirection: g.direction,
        eventCount: g.count,
        totalAmountBase: g.amount,
        topCounterpartyId: top,
        topCounterpartyName: top,
        currencies: Array.from(g.currencies),
        pctOfBucket: 0,
      };
    });
  }

  const totalForBucket = rows.reduce((s, r) => s + Math.abs(r.totalAmountBase), 0);
  rows.forEach((r) => {
    r.pctOfBucket = totalForBucket ? (Math.abs(r.totalAmountBase) / totalForBucket) * 100 : 0;
  });

  return createDrillState({
    data: rows,
    error: null,
    isEmpty: rows.length === 0,
    isLoading: mvQuery.isLoading || fallbackQuery.isLoading,
  });
}
