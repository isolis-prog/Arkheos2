import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

export interface ConsolidatedCashflow {
  id: string;
  link_group_id: string | null;
  preferred_source: string;
  direction: string;
  counterparty: string;
  legal_entity: string;
  currency_original: string;
  amount_original: number;
  amount_base: number | null;
  value_date: string;
  status: string;
  confidence_score: number;
  bucket: string;
  ruleset_version: string;
  reference: string | null;
  commodity: string | null;
  fee_type: string | null;
  portfolio_book: string | null;
  business_unit: string | null;
}

export interface CashflowEvent {
  id: string;
  source_system: string;
  source_object_type: string;
  source_object_id: string;
  legal_entity: string;
  counterparty: string;
  direction: string;
  currency_original: string;
  amount_original: number;
  amount_base: number | null;
  value_date: string;
  status: string;
  confidence_score: number;
  reference: string | null;
  commodity: string | null;
  fee_type: string | null;
}

export interface CashflowException {
  id: string;
  exception_type: string;
  severity: string;
  description: string;
  counterparty: string | null;
  amount: number | null;
  currency: string | null;
  status: string;
  assigned_to: string | null;
  resolution_notes: string | null;
  created_at: string;
  consolidated_id: string | null;
  event_id: string | null;
  sla_breach_at?: string | null;
}

export interface CashflowRuleset {
  id: string;
  ruleset_version: string;
  base_currency: string;
  fx_policy: string;
  calendar_region: string;
  tolerance_amount_pct: number;
  tolerance_days: number;
  large_payment_threshold: number;
  concentration_threshold_pct: number;
}

export type BucketFilter = 'D30' | 'D45' | 'D60' | 'D90' | 'D120' | 'ALL';

const bucketsInScope = (filter: BucketFilter): string[] => {
  switch (filter) {
    case 'D30': return ['OVERDUE', 'D30'];
    case 'D45': return ['OVERDUE', 'D30', 'D45'];
    case 'D60': return ['OVERDUE', 'D30', 'D45', 'D60'];
    case 'D90': return ['OVERDUE', 'D30', 'D45', 'D60', 'D90'];
    case 'D120': return ['OVERDUE', 'D30', 'D45', 'D60', 'D90', 'D120'];
    case 'ALL': return ['OVERDUE', 'D30', 'D45', 'D60', 'D90', 'D120', 'BEYOND_120'];
  }
};

export const useCashflows = (bucketFilter: BucketFilter = 'D30') => {
  // ----- Raw rows still needed for top-N lists, exceptions, ruleset, downstream consumers -----
  const consolidatedQuery = useQuery({
    queryKey: ['consolidated-cashflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consolidated_cashflow')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .order('value_date', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ConsolidatedCashflow[];
    },
  });

  const eventsQuery = useQuery({
    queryKey: ['cashflow-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashflow_event')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .order('value_date', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as CashflowEvent[];
    },
  });

  const exceptionsQuery = useQuery({
    queryKey: ['cashflow-exceptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashflow_exceptions')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CashflowException[];
    },
  });

  const rulesetQuery = useQuery({
    queryKey: ['cashflow-ruleset'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashflow_ruleset')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return (data?.[0] || null) as unknown as CashflowRuleset | null;
    },
  });

  // ----- Server-side aggregations from MVs and RPC -----
  const today = new Date().toISOString().split('T')[0];

  const bucketMvQuery = useQuery({
    queryKey: ['mv-cashflow-by-bucket', today],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_mv_cashflow_by_bucket', { _as_of_date: today });
      if (error) throw error;
      return data || [];
    },
  });

  const entityMvQuery = useQuery({
    queryKey: ['v-cashflow-by-entity', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_cashflow_by_entity')
        .select('*')
        .eq('as_of_date', today);
      if (error) throw error;
      return data || [];
    },
  });

  const counterpartyMvQuery = useQuery({
    queryKey: ['v-cashflow-by-counterparty', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_cashflow_by_counterparty')
        .select('*')
        .eq('as_of_date', today);
      if (error) throw error;
      return data || [];
    },
  });

  const dailySeriesQuery = useQuery({
    queryKey: ['cashflow-daily-series'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cashflow_daily_series', {});
      if (error) throw error;
      return data || [];
    },
  });

  // ----- Filter MV rows by bucket scope -----
  const scopedBuckets = bucketsInScope(bucketFilter);

  const bucketRows = (bucketMvQuery.data || []).filter((r) => scopedBuckets.includes(r.bucket));

  // ----- Filtered consolidated (used for fallback aggregations and tops) -----
  const filteredConsolidated = (consolidatedQuery.data || []).filter((c) =>
    scopedBuckets.includes(c.bucket),
  );

  // Use MV when available; otherwise fall back to consolidated rows so the UI
  // always reflects the current dataset (MVs may be unavailable due to RLS/perms).
  const mvAvailable = bucketRows.length > 0;

  const totalInflows = mvAvailable
    ? bucketRows
        .filter((r) => r.flow_direction === 'inflow')
        .reduce((s, r) => s + Number(r.total_amount_base || 0), 0)
    : filteredConsolidated
        .filter((c) => c.direction === 'INFLOW' && c.status !== 'CANCELLED')
        .reduce((s, c) => s + Number(c.amount_base ?? c.amount_original ?? 0), 0);

  const totalOutflows = mvAvailable
    ? bucketRows
        .filter((r) => r.flow_direction === 'outflow')
        .reduce((s, r) => s + Number(r.total_amount_base || 0), 0)
    : filteredConsolidated
        .filter((c) => c.direction === 'OUTFLOW' && c.status !== 'CANCELLED')
        .reduce((s, c) => s + Number(c.amount_base ?? c.amount_original ?? 0), 0);

  const netCash = totalInflows - totalOutflows;

  const overdueAmount = mvAvailable
    ? (bucketMvQuery.data || [])
        .filter((r) => r.bucket === 'OVERDUE')
        .reduce((s, r) => s + Number(r.total_amount_base || 0), 0)
    : (consolidatedQuery.data || [])
        .filter((c) => c.bucket === 'OVERDUE' && c.status !== 'CANCELLED')
        .reduce((s, c) => s + Number(c.amount_base ?? c.amount_original ?? 0), 0);

  // ----- Top inflows / outflows from raw consolidated rows (for the "Next N" widgets) -----
  // Note: dataset is largely historical, so we don't filter by value_date >= today.
  // We sort by most recent value_date first, then by amount.
  const topInflows = filteredConsolidated
    .filter((c) => c.direction === 'INFLOW' && c.status !== 'CANCELLED')
    .sort((a, b) => {
      if (a.value_date !== b.value_date) return b.value_date.localeCompare(a.value_date);
      return (b.amount_base || b.amount_original) - (a.amount_base || a.amount_original);
    })
    .slice(0, 10);
  const topOutflows = filteredConsolidated
    .filter((c) => c.direction === 'OUTFLOW' && c.status !== 'CANCELLED')
    .sort((a, b) => {
      if (a.value_date !== b.value_date) return b.value_date.localeCompare(a.value_date);
      return (b.amount_base || b.amount_original) - (a.amount_base || a.amount_original);
    })
    .slice(0, 10);

  // ----- Concentration from MVs -----
  type Bucket = { name: string; amount: number; pct: number };
  const aggregateBy = (
    rows: { name: string | null; amount: number }[],
  ): Bucket[] => {
    const m = new Map<string, number>();
    rows.forEach((r) => {
      if (!r.name) return;
      m.set(r.name, (m.get(r.name) || 0) + Math.abs(r.amount));
    });
    const total = Array.from(m.values()).reduce((a, b) => a + b, 0);
    return Array.from(m.entries())
      .map(([name, amount]) => ({ name, amount, pct: total ? (amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  };

  const counterpartyMvScoped = (counterpartyMvQuery.data || []).filter((r) =>
    scopedBuckets.includes(r.bucket),
  );
  const entityMvScoped = (entityMvQuery.data || []).filter((r) =>
    scopedBuckets.includes(r.bucket),
  );

  // Use MV when available; otherwise derive concentrations from filteredConsolidated.
  const activeRows = filteredConsolidated.filter((c) => c.status !== 'CANCELLED');

  const concentrationByCounterparty = counterpartyMvScoped.length > 0
    ? aggregateBy(
        counterpartyMvScoped.map((r) => ({
          name: r.counterparty_name as string | null,
          amount: Number(r.total_amount_base || 0),
        })),
      )
    : aggregateBy(
        activeRows.map((c) => ({
          name: c.counterparty,
          amount: Number(c.amount_base ?? c.amount_original ?? 0),
        })),
      );

  const concentrationByEntity = entityMvScoped.length > 0
    ? aggregateBy(
        entityMvScoped.map((r) => ({
          name: r.legal_entity_name as string | null,
          amount: Number(r.total_amount_base || 0),
        })),
      )
    : aggregateBy(
        activeRows.map((c) => ({
          name: c.legal_entity,
          amount: Number(c.amount_base ?? c.amount_original ?? 0),
        })),
      );

  // Currency concentration: prefer bucket MV (carries currency); fallback to consolidated rows.
  const concentrationByCurrency = bucketRows.length > 0
    ? aggregateBy(
        bucketRows.map((r) => ({
          name: r.currency as string | null,
          amount: Number(r.total_amount_base || 0),
        })),
      )
    : aggregateBy(
        activeRows.map((c) => ({
          name: c.currency_original,
          amount: Number(c.amount_base ?? c.amount_original ?? 0),
        })),
      );

  // ----- Daily series chart data -----
  let chartData = (dailySeriesQuery.data || []).map((d) => ({
    date: d.series_date,
    inflow: Number(d.inflow || 0),
    outflow: Number(d.outflow || 0),
    net: Number(d.net || 0),
  }));

  // Fallback: build daily series from filtered consolidated rows when the RPC is empty.
  if (chartData.length === 0 && filteredConsolidated.length > 0) {
    const byDay = new Map<string, { inflow: number; outflow: number }>();
    filteredConsolidated.forEach((c) => {
      if (c.status === 'CANCELLED') return;
      const day = c.value_date;
      const amt = Number(c.amount_base ?? c.amount_original ?? 0);
      const cur = byDay.get(day) || { inflow: 0, outflow: 0 };
      if (c.direction === 'INFLOW') cur.inflow += amt;
      else if (c.direction === 'OUTFLOW') cur.outflow += amt;
      byDay.set(day, cur);
    });
    chartData = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, inflow: v.inflow, outflow: v.outflow, net: v.inflow - v.outflow }));
  }

  // Keep `consolidated` and `allConsolidated` shape so existing dashboard consumers don't break
  const allData = consolidatedQuery.data || [];

  return {
    consolidated: filteredConsolidated,
    allConsolidated: allData,
    events: eventsQuery.data || [],
    exceptions: exceptionsQuery.data || [],
    ruleset: rulesetQuery.data,
    isLoading:
      consolidatedQuery.isLoading ||
      eventsQuery.isLoading ||
      bucketMvQuery.isLoading ||
      dailySeriesQuery.isLoading,
    totalInflows,
    totalOutflows,
    netCash,
    overdueAmount,
    topInflows,
    topOutflows,
    concentrationByCounterparty,
    concentrationByCurrency,
    concentrationByEntity,
    chartData,
  };
};
