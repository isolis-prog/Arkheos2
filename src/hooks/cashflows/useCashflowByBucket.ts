import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createDrillState, useDrillErrorToast, type DrillQueryState } from '@/hooks/drill/shared';

const TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

export const CASHFLOW_BUCKET_ORDER = [
  'OVERDUE',
  'D30',
  'D45',
  'D60',
  'D90',
  'D120',
  'BEYOND_120',
] as const;

export type CashflowBucket = (typeof CASHFLOW_BUCKET_ORDER)[number];

export interface CashflowBucketRow {
  bucket: CashflowBucket;
  eventCount: number;
  inflow: number;
  outflow: number;
  net: number;
  currencies: string[];
  earliestDueDate: string | null;
  latestDueDate: string | null;
}

export function useCashflowByBucket(asOfDate: string): DrillQueryState<CashflowBucketRow[]> {
  // Primary: try MV via RPC.
  const mvQuery = useQuery({
    queryKey: ['cashflow', 'by-bucket', asOfDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_mv_cashflow_by_bucket', { _as_of_date: asOfDate });
      if (error) {
        // Permission errors on MVs are expected for some roles; swallow and let fallback take over.
        if ((error as any).code === '42501') return [];
        throw error;
      }
      return data || [];
    },
    enabled: !!asOfDate,
    retry: false,
  });

  // Fallback source: raw consolidated rows.
  const consolidatedQuery = useQuery({
    queryKey: ['cashflow', 'consolidated-fallback', TENANT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consolidated_cashflow')
        .select('bucket,direction,currency_original,amount_base,amount_original,value_date,status')
        .eq('tenant_id', TENANT_ID);
      if (error) throw error;
      return data || [];
    },
  });

  // Only surface errors that aren't permission-denied (we have a fallback).
  useDrillErrorToast(
    (mvQuery.error as any)?.code === '42501' ? null : (mvQuery.error as Error | null),
    'Failed to load cashflow buckets',
  );

  const grouped = new Map<CashflowBucket, CashflowBucketRow>();
  CASHFLOW_BUCKET_ORDER.forEach((b) =>
    grouped.set(b, {
      bucket: b,
      eventCount: 0,
      inflow: 0,
      outflow: 0,
      net: 0,
      currencies: [],
      earliestDueDate: null,
      latestDueDate: null,
    }),
  );

  const mvRows = mvQuery.data || [];
  if (mvRows.length > 0) {
    mvRows.forEach((row: any) => {
      const b = row.bucket as CashflowBucket;
      if (!CASHFLOW_BUCKET_ORDER.includes(b)) return;
      const cur = grouped.get(b)!;
      cur.eventCount += Number(row.event_count || 0);
      const amt = Number(row.total_amount_base || 0);
      if (row.flow_direction === 'inflow') cur.inflow += amt;
      else cur.outflow += amt;
      cur.net = cur.inflow - cur.outflow;
      if (row.currency && !cur.currencies.includes(row.currency)) cur.currencies.push(row.currency);
      if (row.earliest_due_date && (!cur.earliestDueDate || row.earliest_due_date < cur.earliestDueDate)) {
        cur.earliestDueDate = row.earliest_due_date;
      }
      if (row.latest_due_date && (!cur.latestDueDate || row.latest_due_date > cur.latestDueDate)) {
        cur.latestDueDate = row.latest_due_date;
      }
    });
  } else {
    // Fallback aggregation from consolidated_cashflow.
    (consolidatedQuery.data || []).forEach((c: any) => {
      if (c.status === 'CANCELLED') return;
      const b = c.bucket as CashflowBucket;
      if (!CASHFLOW_BUCKET_ORDER.includes(b)) return;
      const cur = grouped.get(b)!;
      cur.eventCount += 1;
      const amt = Number(c.amount_base ?? c.amount_original ?? 0);
      if (c.direction === 'INFLOW') cur.inflow += amt;
      else if (c.direction === 'OUTFLOW') cur.outflow += amt;
      cur.net = cur.inflow - cur.outflow;
      if (c.currency_original && !cur.currencies.includes(c.currency_original)) {
        cur.currencies.push(c.currency_original);
      }
      if (c.value_date && (!cur.earliestDueDate || c.value_date < cur.earliestDueDate)) {
        cur.earliestDueDate = c.value_date;
      }
      if (c.value_date && (!cur.latestDueDate || c.value_date > cur.latestDueDate)) {
        cur.latestDueDate = c.value_date;
      }
    });
  }

  const rows = CASHFLOW_BUCKET_ORDER.map((b) => grouped.get(b)!);

  return createDrillState({
    data: rows,
    error: null,
    isEmpty: rows.every((r) => r.eventCount === 0),
    isLoading: mvQuery.isLoading || consolidatedQuery.isLoading,
  });
}
