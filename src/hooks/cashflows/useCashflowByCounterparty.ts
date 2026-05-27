import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createDrillState, useDrillErrorToast, type DrillQueryState } from '@/hooks/drill/shared';

const TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

export interface CashflowCounterpartyRow {
  legalEntityId: string | null;
  legalEntityName: string | null;
  externalCounterpartyId: string | null;
  counterpartyName: string | null;
  bucket: string;
  flowDirection: 'inflow' | 'outflow';
  eventCount: number;
  totalAmountBase: number;
  oldestOverdueDays: number | null;
  openDocCount: number;
  nextUpcomingDate: string | null;
}

export interface UseCashflowByCounterpartyFilters {
  bucket?: string;
  legalEntityId?: string;
  flowDirection?: 'inflow' | 'outflow';
}

export function useCashflowByCounterparty(
  asOfDate: string,
  filters: UseCashflowByCounterpartyFilters = {},
): DrillQueryState<CashflowCounterpartyRow[]> {
  const mvQuery = useQuery({
    queryKey: ['cashflow', 'by-counterparty', asOfDate, filters],
    queryFn: async () => {
      let q = supabase.from('v_cashflow_by_counterparty').select('*').eq('as_of_date', asOfDate);
      if (filters.bucket) q = q.eq('bucket', filters.bucket);
      if (filters.legalEntityId) q = q.eq('legal_entity_id', filters.legalEntityId);
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

  const fallbackQuery = useQuery({
    queryKey: ['cashflow', 'consolidated-fallback', TENANT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consolidated_cashflow')
        .select(
          'bucket,direction,counterparty,legal_entity,currency_original,amount_base,amount_original,value_date,status',
        )
        .eq('tenant_id', TENANT_ID);
      if (error) throw error;
      return data || [];
    },
  });

  useDrillErrorToast(
    (mvQuery.error as any)?.code === '42501' ? null : (mvQuery.error as Error | null),
    'Failed to load cashflow counterparties',
  );

  let rows: CashflowCounterpartyRow[] = (mvQuery.data || []).map((r: any) => ({
    legalEntityId: r.legal_entity_id,
    legalEntityName: r.legal_entity_name,
    externalCounterpartyId: r.external_counterparty_id,
    counterpartyName: r.counterparty_name,
    bucket: r.bucket,
    flowDirection: r.flow_direction as 'inflow' | 'outflow',
    eventCount: Number(r.event_count || 0),
    totalAmountBase: Number(r.total_amount_base || 0),
    oldestOverdueDays: r.oldest_overdue_days,
    openDocCount: Number(r.open_doc_count || 0),
    nextUpcomingDate: r.next_upcoming_date,
  }));

  if (rows.length === 0) {
    const today = asOfDate;
    const map = new Map<
      string,
      {
        entity: string;
        cp: string;
        bucket: string;
        direction: 'inflow' | 'outflow';
        amount: number;
        count: number;
        oldestOverdueDate: string | null;
        nextUpcoming: string | null;
      }
    >();

    (fallbackQuery.data || []).forEach((c: any) => {
      if (c.status === 'CANCELLED') return;
      if (filters.bucket && c.bucket !== filters.bucket) return;
      if (filters.legalEntityId && c.legal_entity !== filters.legalEntityId) return;
      const dir = c.direction === 'INFLOW' ? 'inflow' : c.direction === 'OUTFLOW' ? 'outflow' : null;
      if (!dir) return;
      if (filters.flowDirection && dir !== filters.flowDirection) return;
      const entity = c.legal_entity || 'Unassigned';
      const cp = c.counterparty || 'Unknown';
      const key = `${entity}::${cp}::${c.bucket}::${dir}`;
      const cur = map.get(key) || {
        entity,
        cp,
        bucket: c.bucket,
        direction: dir,
        amount: 0,
        count: 0,
        oldestOverdueDate: null,
        nextUpcoming: null,
      };
      cur.amount += Number(c.amount_base ?? c.amount_original ?? 0);
      cur.count += 1;
      if (c.value_date && c.value_date < today) {
        if (!cur.oldestOverdueDate || c.value_date < cur.oldestOverdueDate) {
          cur.oldestOverdueDate = c.value_date;
        }
      }
      if (c.value_date && c.value_date >= today) {
        if (!cur.nextUpcoming || c.value_date < cur.nextUpcoming) {
          cur.nextUpcoming = c.value_date;
        }
      }
      map.set(key, cur);
    });

    rows = Array.from(map.values()).map((g) => ({
      legalEntityId: g.entity,
      legalEntityName: g.entity,
      externalCounterpartyId: g.cp,
      counterpartyName: g.cp,
      bucket: g.bucket,
      flowDirection: g.direction,
      eventCount: g.count,
      totalAmountBase: g.amount,
      oldestOverdueDays: g.oldestOverdueDate
        ? Math.max(
            0,
            Math.floor((new Date(today).getTime() - new Date(g.oldestOverdueDate).getTime()) / 86400000),
          )
        : null,
      openDocCount: g.count,
      nextUpcomingDate: g.nextUpcoming,
    }));
  }

  return createDrillState({
    data: rows,
    error: null,
    isEmpty: rows.length === 0,
    isLoading: mvQuery.isLoading || fallbackQuery.isLoading,
  });
}
