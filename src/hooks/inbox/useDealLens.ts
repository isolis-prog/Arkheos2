import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentTenantId } from '@/hooks/useCurrentTenantId';
import type { UnifiedBreakRow } from './useUnifiedBreaks';

export interface DealHeader {
  deal_id: string;
  trade_ref: string;
  product_id: string | null;
  trade_date: string | null;
  value_date: string | null;
  counterparty_id: string | null;
  counterparty_name: string | null;
  direction: string | null;
  quantity: number | null;
  price: number | null;
  notional: number | null;
  currency: string | null;
  status: string | null;
}

export interface DealActivityEvent {
  id: string;
  source: 'audit_events' | 'drill_audit_events' | 'agent_audit_events';
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  module: string | null;
  actor_id: string | null;
  created_at: string;
  summary: string | null;
  before_state?: Record<string, unknown> | null;
  after_state?: Record<string, unknown> | null;
  diff?: Record<string, unknown> | null;
  drill_path?: unknown;
  scope_filters?: unknown;
}

export interface DealAuditTimelineGroup {
  module: string;
  events: DealActivityEvent[];
  // Sub-grouping by break_id when the event targets a specific break
  // (entity_id matches one of the deal's unified break ids).
  byBreak: Record<string, DealActivityEvent[]>;
}

export interface DealPnl {
  fo_pv: number | null;
  mo_pv: number | null;
  delta: number | null;
  unrealized_pnl: number | null;
  realized_pnl: number | null;
  currency: string | null;
  computed_at: string | null;
}

export interface DealPnlSeriesPoint {
  computed_at: string;
  fo_pv: number | null;
  mo_pv: number | null;
  delta: number | null;
}

export interface DealLensData {
  header: DealHeader | null;
  breaks: UnifiedBreakRow[];
  breaksByModule: Record<string, UnifiedBreakRow[]>;
  totalExposureUsd: number;
  activity: DealActivityEvent[];
  auditTimeline: DealAuditTimelineGroup[];
  pnl: DealPnl | null;
  pnlSeries: DealPnlSeriesPoint[];
}

const EMPTY: DealLensData = {
  header: null,
  breaks: [],
  breaksByModule: {},
  totalExposureUsd: 0,
  activity: [],
  auditTimeline: [],
  pnl: null,
  pnlSeries: [],
};

export function useDealLens(dealId: string | undefined) {
  const tenantId = useCurrentTenantId();

  return useQuery({
    // Per-tenant cache key so a tenant switch never replays another
    // tenant's deal data.
    queryKey: ['deal-lens', tenantId, dealId],
    enabled: !!dealId && !!tenantId,
    queryFn: async (): Promise<DealLensData> => {
      if (!dealId || !tenantId) return EMPTY;

      // Defense-in-depth tenant filter on every sub-query. RLS already
      // restricts these tables, but explicit `tenant_id` filters:
      //   - guarantee callers without a resolved tenant get nothing
      //   - keep deal_ref collisions across tenants from ever crossing over
      //   - make scope explicit at the call site.
      const [tradeRes, breaksRes, auditRes, pnlRes] = await Promise.all([
        supabase
          .from('canonical_trades')
          .select('id, trade_ref, product_id, trade_date, value_date, counterparty_id, direction, quantity, price, currency, status')
          .eq('tenant_id', tenantId)
          .eq('trade_ref', dealId)
          .maybeSingle(),
        supabase
          .from('v_unified_breaks' as never)
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('deal_id', dealId)
          .limit(500),
        supabase
          .from('audit_events')
          .select('id, action, entity_type, entity_id, module_key, actor_id, created_at, summary, before_state, after_state, diff')
          .eq('tenant_id', tenantId)
          .eq('entity_id', dealId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('valuation_records')
          .select('source, present_value, unrealized_pnl, realized_pnl, currency, computed_at')
          .eq('tenant_id', tenantId)
          .eq('deal_id', dealId)
          .order('computed_at', { ascending: false })
          .limit(20),
      ]);

      if (tradeRes.error && tradeRes.error.code !== 'PGRST116') throw tradeRes.error;
      if (breaksRes.error) throw breaksRes.error;
      if (auditRes.error) throw auditRes.error;
      // pnlRes is best-effort: ignore failures (e.g. no valuation rows for this deal).

      // Second phase: now that we know the break IDs, fetch any audit trails
      // scoped to those specific breaks, plus drill_audit_events whose
      // drill_path or scope_filters reference this deal.
      const breakRows = (breaksRes.data ?? []) as unknown as UnifiedBreakRow[];
      const breakIds = breakRows.map((b) => b.break_id).filter(Boolean);

      const [breakAuditRes, drillAuditRes] = await Promise.all([
        breakIds.length > 0
          ? supabase
              .from('audit_events')
              .select('id, action, entity_type, entity_id, module_key, actor_id, created_at, summary, before_state, after_state, diff')
              .eq('tenant_id', tenantId)
              .in('entity_id', breakIds)
              .order('created_at', { ascending: false })
              .limit(200)
          : Promise.resolve({ data: [] as any[], error: null }),
        // drill_path / scope_filters are JSONB blobs; match either by
        // containment on the deal id or on any of the break ids.
        supabase
          .from('drill_audit_events')
          .select('drill_event_id, action, module, user_id, created_at, drill_path, scope_filters, target_level, row_count')
          .eq('tenant_id', tenantId)
          .or(
            [
              `drill_path.cs.${JSON.stringify({ deal_id: dealId })}`,
              `scope_filters.cs.${JSON.stringify({ deal_id: dealId })}`,
            ].join(','),
          )
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (breakAuditRes.error) throw breakAuditRes.error;
      // drillAuditRes is best-effort: `or()` with JSON containment may fail on
      // older Postgres versions — log and continue with no drill events.
      if (drillAuditRes.error) {
        console.warn('drill_audit_events fetch failed', drillAuditRes.error);
      }


      let counterpartyName: string | null = null;
      const cpId = (tradeRes.data as any)?.counterparty_id ?? null;
      if (cpId) {
        const { data: cp } = await supabase
          .from('canonical_counterparties')
          .select('name, short_name')
          .eq('tenant_id', tenantId)
          .eq('id', cpId)
          .maybeSingle();
        counterpartyName = cp?.short_name || cp?.name || null;
      }

      const t = tradeRes.data as any;
      const header: DealHeader | null = t
        ? {
            deal_id: t.trade_ref,
            trade_ref: t.trade_ref,
            product_id: t.product_id,
            trade_date: t.trade_date,
            value_date: t.value_date,
            counterparty_id: t.counterparty_id,
            counterparty_name: counterpartyName,
            direction: t.direction,
            quantity: t.quantity,
            price: t.price,
            notional: t.quantity != null && t.price != null ? Number(t.quantity) * Number(t.price) : null,
            currency: t.currency,
            status: t.status,
          }
        : null;

      const breaks = breakRows;
      const breaksByModule: Record<string, UnifiedBreakRow[]> = {};
      let totalExposureUsd = 0;
      const moduleByBreakId = new Map<string, string>();
      for (const row of breaks) {
        (breaksByModule[row.module] ||= []).push(row);
        totalExposureUsd += Number(row.amount_delta_usd ?? 0);
        moduleByBreakId.set(row.break_id, row.module);
      }

      const dealAuditEvents: DealActivityEvent[] = (auditRes.data ?? []).map((e: any) => ({
        id: e.id,
        source: 'audit_events' as const,
        action: e.action,
        entity_type: e.entity_type,
        entity_id: e.entity_id,
        module: e.module_key,
        actor_id: e.actor_id,
        created_at: e.created_at,
        summary: e.summary,
        before_state: e.before_state ?? null,
        after_state: e.after_state ?? null,
        diff: e.diff ?? null,
      }));

      const breakAuditEvents: DealActivityEvent[] = (breakAuditRes.data ?? []).map((e: any) => ({
        id: e.id,
        source: 'audit_events' as const,
        action: e.action,
        entity_type: e.entity_type,
        entity_id: e.entity_id,
        module: e.module_key ?? moduleByBreakId.get(e.entity_id) ?? null,
        actor_id: e.actor_id,
        created_at: e.created_at,
        summary: e.summary,
        before_state: e.before_state ?? null,
        after_state: e.after_state ?? null,
        diff: e.diff ?? null,
      }));

      const drillEvents: DealActivityEvent[] = (drillAuditRes.data ?? []).map((e: any) => ({
        id: e.drill_event_id,
        source: 'drill_audit_events' as const,
        action: e.action,
        entity_type: 'drill',
        entity_id: null,
        module: e.module ?? null,
        actor_id: e.user_id,
        created_at: e.created_at,
        summary:
          `Drill ${e.action} (level ${e.target_level})` +
          (e.row_count != null ? ` · ${e.row_count} rows` : ''),
        drill_path: e.drill_path,
        scope_filters: e.scope_filters,
      }));

      const allEvents = [...dealAuditEvents, ...breakAuditEvents, ...drillEvents].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      // Group by module → events, with a sub-bucket per break id when the
      // event targets a specific break (so the UI can render before/after
      // changes per break).
      const groupsMap = new Map<string, DealAuditTimelineGroup>();
      for (const ev of allEvents) {
        const moduleKey = ev.module ?? 'general';
        let group = groupsMap.get(moduleKey);
        if (!group) {
          group = { module: moduleKey, events: [], byBreak: {} };
          groupsMap.set(moduleKey, group);
        }
        group.events.push(ev);
        if (ev.entity_id && moduleByBreakId.has(ev.entity_id)) {
          (group.byBreak[ev.entity_id] ||= []).push(ev);
        }
      }
      const auditTimeline = Array.from(groupsMap.values()).sort((a, b) =>
        a.module.localeCompare(b.module),
      );

      // Backwards-compatible flat activity feed (deal-scoped only) for the
      // existing Activity Feed card.
      const activity = dealAuditEvents;


      // Aggregate latest FO/MO valuations into a P&L summary (best-effort).
      let pnl: DealPnl | null = null;
      const pnlRows = (pnlRes.error ? [] : (pnlRes.data ?? [])) as Array<{
        source: string;
        present_value: number | null;
        unrealized_pnl: number | null;
        realized_pnl: number | null;
        currency: string | null;
        computed_at: string | null;
      }>;
      if (pnlRows.length > 0) {
        const fo = pnlRows.find((r) => r.source === 'FRONT_OFFICE');
        const mo = pnlRows.find((r) => r.source === 'MIDDLE_OFFICE');
        const ref = fo ?? mo ?? pnlRows[0];
        const fo_pv = fo?.present_value != null ? Number(fo.present_value) : null;
        const mo_pv = mo?.present_value != null ? Number(mo.present_value) : null;
        pnl = {
          fo_pv,
          mo_pv,
          delta: fo_pv != null && mo_pv != null ? fo_pv - mo_pv : null,
          unrealized_pnl: ref?.unrealized_pnl != null ? Number(ref.unrealized_pnl) : null,
          realized_pnl: ref?.realized_pnl != null ? Number(ref.realized_pnl) : null,
          currency: ref?.currency ?? null,
          computed_at: ref?.computed_at ?? null,
        };
      }

      // Build a per-snapshot time-series: group rows by computed_at,
      // pick the FO and MO present_value for each timestamp, derive delta.
      const seriesMap = new Map<string, { fo_pv: number | null; mo_pv: number | null }>();
      for (const r of pnlRows) {
        if (!r.computed_at) continue;
        const slot = seriesMap.get(r.computed_at) ?? { fo_pv: null, mo_pv: null };
        if (r.source === 'FRONT_OFFICE' && r.present_value != null) {
          slot.fo_pv = Number(r.present_value);
        } else if (r.source === 'MIDDLE_OFFICE' && r.present_value != null) {
          slot.mo_pv = Number(r.present_value);
        }
        seriesMap.set(r.computed_at, slot);
      }
      const pnlSeries: DealPnlSeriesPoint[] = Array.from(seriesMap.entries())
        .map(([computed_at, v]) => ({
          computed_at,
          fo_pv: v.fo_pv,
          mo_pv: v.mo_pv,
          delta: v.fo_pv != null && v.mo_pv != null ? v.fo_pv - v.mo_pv : null,
        }))
        .sort((a, b) => new Date(a.computed_at).getTime() - new Date(b.computed_at).getTime());

      return { header, breaks, breaksByModule, totalExposureUsd, activity, auditTimeline, pnl, pnlSeries };
    },
  });
}

export function moduleCount(data: DealLensData | undefined, module: string): number {
  return data?.breaksByModule[module]?.length ?? 0;
}
