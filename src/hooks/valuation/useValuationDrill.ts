/**
 * Read-side query hooks for the Valuation Recon drill experience.
 *
 * Every hook is scoped to a single materialised view or a tightly-scoped
 * query so the drill pages can render in well under the 1.5s budget even
 * for the 50-deal demo runs and 1k-deal production runs.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { ValuationMaterialityFlag } from '@/pages/valuation-recon/drill/_drillScope';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface ValuationRunDetail {
  runId: string;
  tenantId: string;
  valuationDate: string;
  runType: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  totalDeals: number | null;
  totalBreaks: number | null;
  totalExposureUsd: number | null;
  triggeredBy: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ValuationByDeskRow {
  id: string;
  traderDesk: string;
  totalDeals: number;
  breakCount: number;
  totalDeltaUsd: number;
  materialBreakCount: number;
  topStrategy: string | null;
}

export interface ValuationByStrategyRow {
  id: string;
  traderDesk: string;
  strategy: string;
  dealCount: number;
  breakCount: number;
  totalDeltaUsd: number;
  primaryDriverDistribution: Record<string, number>;
  topDealId: string | null;
}

export interface ValuationByDealRow {
  id: string;
  traderDesk: string | null;
  strategy: string | null;
  dealId: string;
  product: string | null;
  totalDelta: number;
  totalDeltaPct: number | null;
  materialityFlag: ValuationMaterialityFlag | null;
  primaryDriver: string | null;
  foPv: number | null;
  moPv: number | null;
  currency: string | null;
  status: string | null;
}

export const VALUATION_COMPONENT_TYPES = [
  'PV',
  'MTM',
  'DELTA_CASH',
  'THETA',
  'VEGA',
  'RHO',
  'GAMMA',
  'FEE',
  'ACCRUAL',
] as const;

export type ValuationComponentType = (typeof VALUATION_COMPONENT_TYPES)[number];

export interface ValuationComponentRow {
  id: string;
  componentType: ValuationComponentType | string;
  foValue: number | null;
  moValue: number | null;
  delta: number;
  deltaPct: number | null;
  currency: string | null;
  materialityFlag: ValuationMaterialityFlag | null;
}

export interface ValuationRecord {
  recordId: string;
  source: 'FRONT_OFFICE' | 'MIDDLE_OFFICE';
  presentValue: number | null;
  mtm: number | null;
  deltaCash: number | null;
  unrealizedPnl: number | null;
  realizedPnl: number | null;
  currency: string | null;
  valuationModel: string | null;
  curveId: string | null;
  volSurfaceId: string | null;
  fxRateId: string | null;
  computedAt: string | null;
  traderDesk: string | null;
  strategy: string | null;
  productCode: string | null;
  bookPortfolio: string | null;
  legalEntityId: string | null;
}

export interface ValuationBreakDetailRow {
  valuationBreakDetailId: string;
  totalDelta: number | null;
  totalDeltaPct: number | null;
  materialityFlag: ValuationMaterialityFlag | null;
  primaryDriverComponent: string | null;
  curveDeltaUsd: number | null;
  volDeltaUsd: number | null;
  fxDeltaUsd: number | null;
  modelDeltaUsd: number | null;
  unexplainedDeltaUsd: number | null;
  suggestedRootCause: string | null;
  aiConfidence: number | null;
  status: string;
  assignedTo: string | null;
  traderDesk: string | null;
  strategy: string | null;
  legalEntityId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ValuationReviewNote {
  noteId: string;
  authorId: string;
  noteText: string;
  noteType: string;
  createdAt: string;
}

export interface ValuationDealDetail {
  dealId: string;
  records: ValuationRecord[];
  components: ValuationComponentRow[];
  breakDetail: ValuationBreakDetailRow | null;
  reviewNotes: ValuationReviewNote[];
}

export interface CurvePoint {
  tenor: string;
  tenorIndex: number;
  value: number;
}

export interface VolSurfacePoint {
  strikePctAtm: number;
  tenorDays: number;
  impliedVolPct: number;
}

export interface ValuationMarketDataSnapshot {
  source: 'FRONT_OFFICE' | 'MIDDLE_OFFICE';
  curve: {
    curveId: string | null;
    curveName: string | null;
    commodity: string | null;
    asOfDate: string | null;
    points: CurvePoint[];
  };
  volSurface: {
    surfaceId: string | null;
    commodityLabel: string | null;
    asOfDate: string | null;
    points: VolSurfacePoint[];
  };
  fxRate: {
    fxRateId: string | null;
    currencyFrom: string | null;
    currencyTo: string | null;
    rate: number | null;
    asOfDate: string | null;
    source: string | null;
  };
  valuationModel: string | null;
}

// ----------------------------------------------------------------------------
// Hook: useValuationRunDetail
// ----------------------------------------------------------------------------

export function useValuationRunDetail(runId: string | undefined) {
  return useQuery<ValuationRunDetail | null, PostgrestError | Error>({
    queryKey: ['valuation', 'run-detail', runId],
    enabled: Boolean(runId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('valuation_runs')
        .select(
          'run_id, tenant_id, valuation_date, run_type, status, started_at, completed_at, total_deals, total_breaks, total_exposure_usd, triggered_by, metadata',
        )
        .eq('run_id', runId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        runId: data.run_id,
        tenantId: data.tenant_id,
        valuationDate: data.valuation_date,
        runType: data.run_type,
        status: data.status,
        startedAt: data.started_at,
        completedAt: data.completed_at,
        totalExposureUsd: data.total_exposure_usd ? Number(data.total_exposure_usd) : null,
        totalDeals: data.total_deals,
        totalBreaks: data.total_breaks,
        triggeredBy: data.triggered_by,
        metadata: (data.metadata as Record<string, unknown> | null) ?? null,
      };
    },
  });
}

// ----------------------------------------------------------------------------
// Hook: useValuationByDesk (L2)
// ----------------------------------------------------------------------------

export function useValuationByDesk(runId: string | undefined) {
  return useQuery<ValuationByDeskRow[], PostgrestError | Error>({
    queryKey: ['valuation', 'by-desk', runId],
    enabled: Boolean(runId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_mv_valuation_by_desk', {
        _run_id: runId!,
      });
      if (error) throw error;
      const rows = (data ?? []) as Array<Record<string, unknown>>;
      return rows.map((r, idx) => ({
        id: `${r.run_id}-${r.trader_desk}-${idx}`,
        traderDesk: String(r.trader_desk ?? 'UNASSIGNED'),
        totalDeals: Number(r.total_deals ?? 0),
        breakCount: Number(r.break_count ?? 0),
        totalDeltaUsd: Number(r.total_delta_usd ?? 0),
        materialBreakCount: Number(r.material_break_count ?? 0),
        topStrategy: (r.top_strategy as string | null) ?? null,
      }));
    },
  });
}

// ----------------------------------------------------------------------------
// Hook: useValuationByStrategy (L3)
// ----------------------------------------------------------------------------

export function useValuationByStrategy(
  runId: string | undefined,
  filters: { traderDesk?: string } = {},
) {
  return useQuery<ValuationByStrategyRow[], PostgrestError | Error>({
    queryKey: ['valuation', 'by-strategy', runId, filters.traderDesk ?? null],
    enabled: Boolean(runId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_mv_valuation_by_strategy', {
        _run_id: runId!,
        _trader_desk: filters.traderDesk ?? null,
      });
      if (error) throw error;
      const rows = (data ?? []) as Array<Record<string, unknown>>;
      return rows.map((r, idx) => ({
        id: `${r.run_id}-${r.trader_desk}-${r.strategy}-${idx}`,
        traderDesk: String(r.trader_desk ?? 'UNASSIGNED'),
        strategy: String(r.strategy ?? 'UNASSIGNED'),
        dealCount: Number(r.deal_count ?? 0),
        breakCount: Number(r.break_count ?? 0),
        totalDeltaUsd: Number(r.total_delta_usd ?? 0),
        primaryDriverDistribution:
          (r.primary_driver_distribution as Record<string, number> | null) ?? {},
        topDealId: (r.top_deal_id as string | null) ?? null,
      }));
    },
  });
}

// ----------------------------------------------------------------------------
// Hook: useValuationByDeal (L4)
// ----------------------------------------------------------------------------

export function useValuationByDeal(
  runId: string | undefined,
  filters: {
    traderDesk?: string;
    strategy?: string;
    materialityFlag?: ValuationMaterialityFlag;
  } = {},
) {
  return useQuery<ValuationByDealRow[], PostgrestError | Error>({
    queryKey: [
      'valuation',
      'by-deal',
      runId,
      filters.traderDesk ?? null,
      filters.strategy ?? null,
      filters.materialityFlag ?? null,
    ],
    enabled: Boolean(runId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_mv_valuation_by_deal', {
        _run_id: runId!,
        _trader_desk: filters.traderDesk ?? null,
        _strategy: filters.strategy ?? null,
      });
      if (error) throw error;
      let rows = (data ?? []) as Array<Record<string, unknown>>;
      if (filters.materialityFlag) {
        rows = rows.filter((r) => r.materiality_flag === filters.materialityFlag);
      }
      return rows.map((r) => ({
        id: `${r.run_id}-${r.deal_id}`,
        traderDesk: (r.trader_desk as string | null) ?? null,
        strategy: (r.strategy as string | null) ?? null,
        dealId: String(r.deal_id),
        product: (r.product as string | null) ?? null,
        totalDelta: Number(r.total_delta ?? 0),
        totalDeltaPct:
          r.total_delta_pct !== null && r.total_delta_pct !== undefined
            ? Number(r.total_delta_pct)
            : null,
        materialityFlag:
          (r.materiality_flag as ValuationMaterialityFlag | null) ?? null,
        primaryDriver: (r.primary_driver as string | null) ?? null,
        foPv: r.fo_pv !== null && r.fo_pv !== undefined ? Number(r.fo_pv) : null,
        moPv: r.mo_pv !== null && r.mo_pv !== undefined ? Number(r.mo_pv) : null,
        currency: (r.currency as string | null) ?? null,
        status: (r.status as string | null) ?? null,
      }));
    },
  });
}

// ----------------------------------------------------------------------------
// Hook: useValuationByComponent (L5)
// ----------------------------------------------------------------------------

export function useValuationByComponent(
  runId: string | undefined,
  dealId: string | undefined,
) {
  return useQuery<ValuationComponentRow[], PostgrestError | Error>({
    queryKey: ['valuation', 'by-component', runId, dealId],
    enabled: Boolean(runId) && Boolean(dealId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_mv_valuation_by_component', {
        _run_id: runId!,
        _deal_id: dealId!,
      });
      if (error) throw error;
      const rows = (data ?? []) as Array<Record<string, unknown>>;
      const order = new Map(VALUATION_COMPONENT_TYPES.map((c, i) => [c, i]));
      const ordered = [...rows].sort((a, b) => {
        const ai = order.get(a.component_type as ValuationComponentType) ?? 99;
        const bi = order.get(b.component_type as ValuationComponentType) ?? 99;
        return ai - bi;
      });
      return ordered.map((r, idx) => ({
        id: `${r.run_id}-${r.deal_id}-${r.component_type}-${idx}`,
        componentType: String(r.component_type),
        foValue: r.fo_value !== null && r.fo_value !== undefined ? Number(r.fo_value) : null,
        moValue: r.mo_value !== null && r.mo_value !== undefined ? Number(r.mo_value) : null,
        delta: Number(r.delta ?? 0),
        deltaPct:
          r.delta_pct !== null && r.delta_pct !== undefined ? Number(r.delta_pct) : null,
        currency: (r.currency as string | null) ?? null,
        materialityFlag:
          (r.materiality_flag as ValuationMaterialityFlag | null) ?? null,
      }));
    },
  });
}

// ----------------------------------------------------------------------------
// Hook: useValuationDealDetail
// ----------------------------------------------------------------------------

export function useValuationDealDetail(
  runId: string | undefined,
  dealId: string | undefined,
) {
  return useQuery<ValuationDealDetail | null, PostgrestError | Error>({
    queryKey: ['valuation', 'deal-detail', runId, dealId],
    enabled: Boolean(runId) && Boolean(dealId),
    queryFn: async () => {
      if (!runId || !dealId) return null;

      const [recordsRes, componentsRes, breakRes] = await Promise.all([
        supabase
          .from('valuation_records')
          .select(
            'record_id, source, present_value, mtm, delta_cash, unrealized_pnl, realized_pnl, currency, valuation_model, curve_id, vol_surface_id, fx_rate_id, computed_at, trader_desk, strategy, product_code, book_portfolio, legal_entity_id',
          )
          .eq('run_id', runId)
          .eq('deal_id', dealId),
        supabase
          .from('valuation_components')
          .select('component_id, component_type, fo_value, mo_value, delta, delta_pct, currency, materiality_flag')
          .eq('run_id', runId)
          .eq('deal_id', dealId),
        supabase
          .from('valuation_break_details')
          .select(
            'valuation_break_detail_id, total_delta, total_delta_pct, materiality_flag, primary_driver_component, curve_delta_usd, vol_delta_usd, fx_delta_usd, model_delta_usd, unexplained_delta_usd, suggested_root_cause, ai_confidence, status, assigned_to, trader_desk, strategy, legal_entity_id, created_at, updated_at',
          )
          .eq('run_id', runId)
          .eq('deal_id', dealId)
          .maybeSingle(),
      ]);

      if (recordsRes.error) throw recordsRes.error;
      if (componentsRes.error) throw componentsRes.error;
      if (breakRes.error) throw breakRes.error;

      const records: ValuationRecord[] = (recordsRes.data ?? []).map((r) => ({
        recordId: r.record_id,
        source: r.source as 'FRONT_OFFICE' | 'MIDDLE_OFFICE',
        presentValue: r.present_value !== null ? Number(r.present_value) : null,
        mtm: r.mtm !== null ? Number(r.mtm) : null,
        deltaCash: r.delta_cash !== null ? Number(r.delta_cash) : null,
        unrealizedPnl: r.unrealized_pnl !== null ? Number(r.unrealized_pnl) : null,
        realizedPnl: r.realized_pnl !== null ? Number(r.realized_pnl) : null,
        currency: r.currency,
        valuationModel: r.valuation_model,
        curveId: r.curve_id,
        volSurfaceId: r.vol_surface_id,
        fxRateId: r.fx_rate_id,
        computedAt: r.computed_at,
        traderDesk: r.trader_desk,
        strategy: r.strategy,
        productCode: r.product_code,
        bookPortfolio: r.book_portfolio,
        legalEntityId: r.legal_entity_id,
      }));

      const components: ValuationComponentRow[] = (componentsRes.data ?? []).map((r, idx) => ({
        id: `${r.component_id}-${idx}`,
        componentType: r.component_type,
        foValue: r.fo_value !== null ? Number(r.fo_value) : null,
        moValue: r.mo_value !== null ? Number(r.mo_value) : null,
        delta: Number(r.delta ?? 0),
        deltaPct: r.delta_pct !== null ? Number(r.delta_pct) : null,
        currency: r.currency,
        materialityFlag: (r.materiality_flag as ValuationMaterialityFlag | null) ?? null,
      }));

      const breakDetail: ValuationBreakDetailRow | null = breakRes.data
        ? {
            valuationBreakDetailId: breakRes.data.valuation_break_detail_id,
            totalDelta: breakRes.data.total_delta !== null ? Number(breakRes.data.total_delta) : null,
            totalDeltaPct:
              breakRes.data.total_delta_pct !== null
                ? Number(breakRes.data.total_delta_pct)
                : null,
            materialityFlag:
              (breakRes.data.materiality_flag as ValuationMaterialityFlag | null) ?? null,
            primaryDriverComponent: breakRes.data.primary_driver_component,
            curveDeltaUsd:
              breakRes.data.curve_delta_usd !== null
                ? Number(breakRes.data.curve_delta_usd)
                : null,
            volDeltaUsd:
              breakRes.data.vol_delta_usd !== null
                ? Number(breakRes.data.vol_delta_usd)
                : null,
            fxDeltaUsd:
              breakRes.data.fx_delta_usd !== null
                ? Number(breakRes.data.fx_delta_usd)
                : null,
            modelDeltaUsd:
              breakRes.data.model_delta_usd !== null
                ? Number(breakRes.data.model_delta_usd)
                : null,
            unexplainedDeltaUsd:
              breakRes.data.unexplained_delta_usd !== null
                ? Number(breakRes.data.unexplained_delta_usd)
                : null,
            suggestedRootCause: breakRes.data.suggested_root_cause,
            aiConfidence:
              breakRes.data.ai_confidence !== null
                ? Number(breakRes.data.ai_confidence)
                : null,
            status: breakRes.data.status,
            assignedTo: breakRes.data.assigned_to,
            traderDesk: breakRes.data.trader_desk,
            strategy: breakRes.data.strategy,
            legalEntityId: breakRes.data.legal_entity_id,
            createdAt: breakRes.data.created_at,
            updatedAt: breakRes.data.updated_at,
          }
        : null;

      let reviewNotes: ValuationReviewNote[] = [];
      if (breakDetail) {
        const { data: notesData, error: notesErr } = await supabase
          .from('valuation_review_notes')
          .select('note_id, author_id, note_text, note_type, created_at')
          .eq('valuation_break_detail_id', breakDetail.valuationBreakDetailId)
          .order('created_at', { ascending: false });
        if (notesErr) throw notesErr;
        reviewNotes = (notesData ?? []).map((n) => ({
          noteId: n.note_id,
          authorId: n.author_id,
          noteText: n.note_text,
          noteType: n.note_type,
          createdAt: n.created_at,
        }));
      }

      return {
        dealId,
        records,
        components,
        breakDetail,
        reviewNotes,
      };
    },
  });
}

// ----------------------------------------------------------------------------
// Hook: useValuationMarketDataSnapshot
// ----------------------------------------------------------------------------

export function useValuationMarketDataSnapshot(
  runId: string | undefined,
  dealId: string | undefined,
  source: 'FRONT_OFFICE' | 'MIDDLE_OFFICE' | undefined,
) {
  return useQuery<ValuationMarketDataSnapshot | null, PostgrestError | Error>({
    queryKey: ['valuation', 'market-snapshot', runId, dealId, source],
    enabled: Boolean(runId) && Boolean(dealId) && Boolean(source),
    queryFn: async () => {
      if (!runId || !dealId || !source) return null;

      const { data: rec, error: recErr } = await supabase
        .from('valuation_records')
        .select(
          'record_id, source, valuation_model, curve_id, vol_surface_id, fx_rate_id, computed_at',
        )
        .eq('run_id', runId)
        .eq('deal_id', dealId)
        .eq('source', source)
        .maybeSingle();
      if (recErr) throw recErr;
      if (!rec) {
        return {
          source,
          curve: { curveId: null, curveName: null, commodity: null, asOfDate: null, points: [] },
          volSurface: { surfaceId: null, commodityLabel: null, asOfDate: null, points: [] },
          fxRate: {
            fxRateId: null,
            currencyFrom: null,
            currencyTo: null,
            rate: null,
            asOfDate: null,
            source: null,
          },
          valuationModel: null,
        };
      }

      let curveOut: ValuationMarketDataSnapshot['curve'] = {
        curveId: rec.curve_id,
        curveName: null,
        commodity: null,
        asOfDate: null,
        points: [],
      };
      if (rec.curve_id) {
        const { data: meta } = await supabase
          .from('market_curves')
          .select('id, name, commodity, updated_at')
          .eq('id', rec.curve_id)
          .maybeSingle();
        if (meta) {
          curveOut.curveName = meta.name;
          curveOut.commodity = meta.commodity;
          curveOut.asOfDate = meta.updated_at?.slice(0, 10) ?? null;
          const { data: pts } = await supabase
            .from('valuation_curves')
            .select('tenor_date, price, snapshot_date')
            .eq('commodity', meta.commodity)
            .order('snapshot_date', { ascending: false })
            .order('tenor_date', { ascending: true })
            .limit(120);
          if (pts && pts.length > 0) {
            const latest = pts[0].snapshot_date;
            curveOut.asOfDate = latest;
            const filtered = pts
              .filter((p) => p.snapshot_date === latest)
              .sort((a, b) => a.tenor_date.localeCompare(b.tenor_date));
            curveOut.points = filtered.map((p, i) => ({
              tenor: p.tenor_date,
              tenorIndex: i,
              value: Number(p.price),
            }));
          }
        }
      }

      let volOut: ValuationMarketDataSnapshot['volSurface'] = {
        surfaceId: rec.vol_surface_id,
        commodityLabel: null,
        asOfDate: null,
        points: [],
      };
      if (rec.vol_surface_id) {
        const { data: anchor } = await supabase
          .from('vol_surfaces')
          .select('commodity_id, commodity_label, effective_date')
          .eq('id', rec.vol_surface_id)
          .maybeSingle();

        if (anchor) {
          volOut.commodityLabel = anchor.commodity_label;
          volOut.asOfDate = anchor.effective_date;

          const { data: pts } = await supabase
            .from('vol_surfaces')
            .select('strike_pct_atm, tenor_days, implied_vol_pct')
            .eq('commodity_id', anchor.commodity_id)
            .eq('effective_date', anchor.effective_date)
            .order('tenor_days', { ascending: true })
            .order('strike_pct_atm', { ascending: true });

          if (pts && pts.length > 0) {
            volOut.points = pts.map((p) => ({
              strikePctAtm: Number(p.strike_pct_atm ?? 0),
              tenorDays: Number(p.tenor_days ?? 0),
              impliedVolPct: Number(p.implied_vol_pct ?? 0),
            }));
          }
        }
      }

      let fxOut: ValuationMarketDataSnapshot['fxRate'] = {
        fxRateId: rec.fx_rate_id,
        currencyFrom: null,
        currencyTo: null,
        rate: null,
        asOfDate: null,
        source: null,
      };
      if (rec.fx_rate_id) {
        const { data: fx } = await supabase
          .from('fx_rates')
          .select('rate_id, currency_from, currency_to, rate_value, rate_date, rate_source')
          .eq('rate_id', rec.fx_rate_id)
          .maybeSingle();
        if (fx) {
          fxOut = {
            fxRateId: fx.rate_id,
            currencyFrom: fx.currency_from,
            currencyTo: fx.currency_to,
            rate: Number(fx.rate_value),
            asOfDate: fx.rate_date,
            source: fx.rate_source,
          };
        }
      }

      return {
        source,
        curve: curveOut,
        volSurface: volOut,
        fxRate: fxOut,
        valuationModel: rec.valuation_model,
      };
    },
  });
}

export function useValuationDeskOptions(runId: string | undefined): string[] {
  const { data } = useValuationByDesk(runId);
  return useMemo(() => Array.from(new Set((data ?? []).map((d) => d.traderDesk))).sort(), [
    data,
  ]);
}
