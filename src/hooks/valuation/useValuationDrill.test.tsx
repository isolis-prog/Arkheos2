import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the supabase client before importing the hook
vi.mock('@/integrations/supabase/client', () => {
  const state: {
    vol_surfaces_anchor: any;
    vol_surfaces_points: any[] | null;
    vol_surfaces_anchor_error: any;
    vol_surfaces_points_error: any;
  } = {
    vol_surfaces_anchor: null,
    vol_surfaces_points: null,
    vol_surfaces_anchor_error: null,
    vol_surfaces_points_error: null,
  };

  const buildVolSurfacesQuery = () => {
    let mode: 'anchor' | 'points' = 'anchor';
    const api: any = {
      select: (cols: string) => {
        mode = cols.includes('strike_pct_atm') ? 'points' : 'anchor';
        return api;
      },
      eq: () => api,
      order: () => api,
      maybeSingle: async () => ({
        data: state.vol_surfaces_anchor_error ? null : state.vol_surfaces_anchor,
        error: state.vol_surfaces_anchor_error,
      }),
      then: (resolve: (v: any) => void) => {
        if (mode === 'points') {
          resolve({
            data: state.vol_surfaces_points_error ? null : state.vol_surfaces_points,
            error: state.vol_surfaces_points_error,
          });
        } else {
          resolve({
            data: state.vol_surfaces_anchor_error ? null : state.vol_surfaces_anchor,
            error: state.vol_surfaces_anchor_error,
          });
        }
      },
    };
    return api;
  };


  const supabase = {
    __state: state,
    from: (table: string) => {
      if (table === 'valuation_records') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: {
                      record_id: 'r1',
                      source: 'FRONT_OFFICE',
                      valuation_model: 'BLACK_76',
                      curve_id: null,
                      vol_surface_id: 'vs-1',
                      fx_rate_id: null,
                      computed_at: '2026-01-01',
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'vol_surfaces') return buildVolSurfacesQuery();
      // Generic empty for market_curves / fx_rates / etc.
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
            order: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }),
          }),
        }),
      };
    },
    rpc: async () => ({ data: [], error: null }),
  };
  return { supabase };
});

import { supabase } from '@/integrations/supabase/client';
import { useValuationMarketDataSnapshot } from './useValuationDrill';
import type {
  ValuationMarketDataSnapshot,
  VolSurfacePoint,
} from './useValuationDrill';

// ---------------------------------------------------------------------------
// Compile-time type tests
// ---------------------------------------------------------------------------
// These never run, but the file must type-check for the suite to compile.
// They lock in the public shape of useValuationMarketDataSnapshot's return.

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _typeTests() {
  const snap = {} as NonNullable<ReturnType<typeof useValuationMarketDataSnapshot>['data']>;

  // volSurface exists and matches the documented shape.
  type _VolSurface = Expect<
    Equals<
      typeof snap.volSurface,
      {
        surfaceId: string | null;
        commodityLabel: string | null;
        asOfDate: string | null;
        points: VolSurfacePoint[];
      }
    >
  >;

  // commodityLabel is exactly `string | null` — neither `undefined` nor `any`.
  type _Label = Expect<Equals<typeof snap.volSurface.commodityLabel, string | null>>;

  // Each point field is a plain `number` (not `number | null`, not `string`).
  const point = snap.volSurface.points[0];
  type _Strike = Expect<Equals<typeof point.strikePctAtm, number>>;
  type _Tenor = Expect<Equals<typeof point.tenorDays, number>>;
  type _Vol = Expect<Equals<typeof point.impliedVolPct, number>>;

  // Snapshot itself is the documented interface.
  type _Snap = Expect<Equals<typeof snap, ValuationMarketDataSnapshot>>;
}


const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

describe('useValuationMarketDataSnapshot', () => {
  beforeEach(() => {
    (supabase as any).__state.vol_surfaces_anchor = null;
    (supabase as any).__state.vol_surfaces_points = null;
    (supabase as any).__state.vol_surfaces_anchor_error = null;
    (supabase as any).__state.vol_surfaces_points_error = null;
  });

  it('returns safe fallback (null labels, empty points) when the anchor query errors out', async () => {
    (supabase as any).__state.vol_surfaces_anchor = null;
    (supabase as any).__state.vol_surfaces_anchor_error = {
      message: 'permission denied',
      code: '42501',
    };
    const { result } = renderHook(
      () => useValuationMarketDataSnapshot('run-1', 'deal-1', 'FRONT_OFFICE'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
    expect(result.current.data?.volSurface).toEqual({
      surfaceId: 'vs-1',
      commodityLabel: null,
      asOfDate: null,
      points: [],
    });
  });

  it('returns empty points when anchor succeeds but points query errors out', async () => {
    (supabase as any).__state.vol_surfaces_anchor = {
      commodity_id: 'c1',
      commodity_label: 'WTI',
      effective_date: '2026-01-01',
    };
    (supabase as any).__state.vol_surfaces_points_error = {
      message: 'network failure',
      code: 'PGRST000',
    };
    const { result } = renderHook(
      () => useValuationMarketDataSnapshot('run-1', 'deal-1', 'FRONT_OFFICE'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
    // Anchor metadata still surfaces, points stay empty — no exception thrown.
    expect(result.current.data?.volSurface.commodityLabel).toBe('WTI');
    expect(result.current.data?.volSurface.asOfDate).toBe('2026-01-01');
    expect(result.current.data?.volSurface.points).toEqual([]);
  });

  it('returns empty vol surface points when anchor row is missing', async () => {
    (supabase as any).__state.vol_surfaces_anchor = null;
    const { result } = renderHook(
      () => useValuationMarketDataSnapshot('run-1', 'deal-1', 'FRONT_OFFICE'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.volSurface.points).toEqual([]);
    expect(result.current.data?.volSurface.commodityLabel).toBeNull();
  });

  it('returns empty points when anchor exists but points query returns null', async () => {
    (supabase as any).__state.vol_surfaces_anchor = {
      commodity_id: 'c1',
      commodity_label: 'WTI',
      effective_date: '2026-01-01',
    };
    (supabase as any).__state.vol_surfaces_points = null;
    const { result } = renderHook(
      () => useValuationMarketDataSnapshot('run-1', 'deal-1', 'FRONT_OFFICE'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.volSurface.commodityLabel).toBe('WTI');
    expect(result.current.data?.volSurface.asOfDate).toBe('2026-01-01');
    expect(result.current.data?.volSurface.points).toEqual([]);
  });

  it('maps points missing strike_pct_atm or tenor_days to numeric defaults (0)', async () => {
    (supabase as any).__state.vol_surfaces_anchor = {
      commodity_id: 'c1',
      commodity_label: 'WTI',
      effective_date: '2026-01-01',
    };
    (supabase as any).__state.vol_surfaces_points = [
      { strike_pct_atm: null, tenor_days: 30, implied_vol_pct: '20' },
      { strike_pct_atm: '100', tenor_days: null, implied_vol_pct: '22' },
      { strike_pct_atm: null, tenor_days: null, implied_vol_pct: null },
    ];
    const { result } = renderHook(
      () => useValuationMarketDataSnapshot('run-1', 'deal-1', 'FRONT_OFFICE'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const points = result.current.data!.volSurface.points;
    expect(points).toHaveLength(3);
    expect(points[0]).toEqual({ strikePctAtm: 0, tenorDays: 30, impliedVolPct: 20 });
    expect(points[1]).toEqual({ strikePctAtm: 100, tenorDays: 0, impliedVolPct: 22 });
    expect(points[2]).toEqual({ strikePctAtm: 0, tenorDays: 0, impliedVolPct: 0 });
    // Every numeric field must be a finite number, never NaN/undefined.
    for (const p of points) {
      expect(Number.isFinite(p.strikePctAtm)).toBe(true);
      expect(Number.isFinite(p.tenorDays)).toBe(true);
      expect(Number.isFinite(p.impliedVolPct)).toBe(true);
    }
  });

  it('maps undefined keys (missing fields entirely) to 0 without throwing', async () => {
    (supabase as any).__state.vol_surfaces_anchor = {
      commodity_id: 'c1',
      commodity_label: 'WTI',
      effective_date: '2026-01-01',
    };
    (supabase as any).__state.vol_surfaces_points = [
      // strike_pct_atm key absent
      { tenor_days: 60, implied_vol_pct: '18.5' } as any,
      // tenor_days key absent
      { strike_pct_atm: '95', implied_vol_pct: '19.0' } as any,
    ];
    const { result } = renderHook(
      () => useValuationMarketDataSnapshot('run-1', 'deal-1', 'FRONT_OFFICE'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const points = result.current.data!.volSurface.points;
    expect(points).toEqual([
      { strikePctAtm: 0, tenorDays: 60, impliedVolPct: 18.5 },
      { strikePctAtm: 95, tenorDays: 0, impliedVolPct: 19 },
    ]);
  });

  it('handles non-numeric string values by mapping to NaN-safe defaults via Number()', async () => {
    (supabase as any).__state.vol_surfaces_anchor = {
      commodity_id: 'c1',
      commodity_label: 'WTI',
      effective_date: '2026-01-01',
    };
    (supabase as any).__state.vol_surfaces_points = [
      { strike_pct_atm: '', tenor_days: '', implied_vol_pct: '' },
    ];
    const { result } = renderHook(
      () => useValuationMarketDataSnapshot('run-1', 'deal-1', 'FRONT_OFFICE'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Empty-string -> Number('') === 0, so all defaults to 0.
    expect(result.current.data!.volSurface.points).toEqual([
      { strikePctAtm: 0, tenorDays: 0, impliedVolPct: 0 },
    ]);
  });

  it('maps vol surface points correctly when present', async () => {
    (supabase as any).__state.vol_surfaces_anchor = {
      commodity_id: 'c1',
      commodity_label: 'WTI',
      effective_date: '2026-01-01',
    };
    (supabase as any).__state.vol_surfaces_points = [
      { strike_pct_atm: '90', tenor_days: 30, implied_vol_pct: '25.5' },
      { strike_pct_atm: '100', tenor_days: 30, implied_vol_pct: '22.1' },
    ];
    const { result } = renderHook(
      () => useValuationMarketDataSnapshot('run-1', 'deal-1', 'FRONT_OFFICE'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.volSurface.points).toHaveLength(2);
    expect(result.current.data?.volSurface.points[0]).toEqual({
      strikePctAtm: 90,
      tenorDays: 30,
      impliedVolPct: 25.5,
    });
  });
});
