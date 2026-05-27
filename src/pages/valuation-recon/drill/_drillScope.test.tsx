import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

const logDrillEvent = vi.fn().mockResolvedValue(undefined);
vi.mock('@/hooks/useDrillAudit', () => ({
  useDrillAudit: () => ({ logDrillEvent, pushLevel: vi.fn(), popToLevel: vi.fn() }),
}));

import {
  encodeValuationScope,
  decodeValuationScope,
  useValuationDrillScope,
  useValuationDrillAudit,
  type ValuationDrillScopeValue,
} from './_drillScope';

const RUN_ID = 'run-12345678-aaaa-bbbb-cccc-1234567890ab';

function makeWrapper(initialEntries: string[]) {
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/valuation-recon/:runId/*" element={<>{children}</>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('decodeValuationScope', () => {
  it('returns fallback runId when token is null', () => {
    expect(decodeValuationScope(null, RUN_ID)).toEqual({ runId: RUN_ID });
  });

  it('returns fallback runId for malformed base64', () => {
    expect(decodeValuationScope('!!!not-base64!!!', RUN_ID)).toEqual({ runId: RUN_ID });
  });

  it('returns fallback runId when payload is valid JSON but wrong shape', () => {
    const token = btoa(JSON.stringify(['array', 'not', 'object']))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    expect(decodeValuationScope(token, RUN_ID)).toEqual({ runId: RUN_ID });
  });

  it('returns fallback runId when JSON has no runId string', () => {
    const token = encodeValuationScope({ traderDesk: 'OIL' } as unknown as ValuationDrillScopeValue);
    expect(decodeValuationScope(token, RUN_ID)).toEqual({ runId: RUN_ID });
  });

  it('round-trips a full scope', () => {
    const scope: ValuationDrillScopeValue = {
      runId: RUN_ID,
      traderDesk: 'GAS-EU',
      strategy: 'CAL26',
      dealId: 'D-42',
      materialityFlag: 'material',
    };
    expect(decodeValuationScope(encodeValuationScope(scope))).toMatchObject(scope);
  });
});

describe('useValuationDrillScope', () => {
  it('parses deep-link ?d= into scope and route runId always wins', () => {
    const scope: ValuationDrillScopeValue = {
      runId: 'stale-run-id',
      traderDesk: 'POWER',
      strategy: 'SPREAD',
    };
    const token = encodeValuationScope(scope);
    const { result } = renderHook(() => useValuationDrillScope(RUN_ID), {
      wrapper: makeWrapper([`/valuation-recon/${RUN_ID}/by-desk?d=${token}`]),
    });
    expect(result.current.scope.runId).toBe(RUN_ID); // overridden by route
    expect(result.current.scope.traderDesk).toBe('POWER');
    expect(result.current.scope.strategy).toBe('SPREAD');
  });

  it('falls back to route runId when ?d= is invalid', () => {
    const { result } = renderHook(() => useValuationDrillScope(RUN_ID), {
      wrapper: makeWrapper([`/valuation-recon/${RUN_ID}/by-desk?d=%%%broken%%%`]),
    });
    expect(result.current.scope).toEqual({ runId: RUN_ID });
  });

  it('updates URL when setScope is called and removeKey strips a dimension', () => {
    let location: ReturnType<typeof useLocation> | null = null;
    const Probe = () => {
      location = useLocation();
      return null;
    };
    const { result } = renderHook(
      () => {
        const api = useValuationDrillScope(RUN_ID);
        return api;
      },
      {
        wrapper: ({ children }) => (
          <MemoryRouter initialEntries={[`/valuation-recon/${RUN_ID}/by-desk`]}>
            <Routes>
              <Route
                path="/valuation-recon/:runId/*"
                element={
                  <>
                    <Probe />
                    {children}
                  </>
                }
              />
            </Routes>
          </MemoryRouter>
        ),
      },
    );

    act(() => {
      result.current.setScope({ runId: RUN_ID, traderDesk: 'OIL', strategy: 'CAL26' });
    });
    expect(location?.search).toContain('d=');
    const token1 = new URLSearchParams(location!.search).get('d')!;
    expect(decodeValuationScope(token1)).toMatchObject({ traderDesk: 'OIL', strategy: 'CAL26' });

    act(() => {
      result.current.removeKey('strategy');
    });
    const token2 = new URLSearchParams(location!.search).get('d')!;
    const decoded = decodeValuationScope(token2);
    expect(decoded.traderDesk).toBe('OIL');
    expect(decoded.strategy).toBeUndefined();

    act(() => {
      result.current.removeKey('runId'); // should be no-op
    });
    expect(decodeValuationScope(new URLSearchParams(location!.search).get('d')).runId).toBe(RUN_ID);
  });
});

describe('useValuationDrillAudit', () => {
  beforeEach(() => {
    logDrillEvent.mockClear();
  });

  it('logs a drill event with module, action, level and scope filters', () => {
    const scope: ValuationDrillScopeValue = { runId: RUN_ID, traderDesk: 'GAS' };
    renderHook(() => useValuationDrillAudit('push_level', 3, scope, 42), {
      wrapper: makeWrapper([`/valuation-recon/${RUN_ID}/by-strategy`]),
    });
    expect(logDrillEvent).toHaveBeenCalledTimes(1);
    expect(logDrillEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'valuation_recon',
        action: 'push_level',
        targetLevel: 3,
        rowCount: 42,
        scopeFilters: expect.objectContaining({ runId: RUN_ID, traderDesk: 'GAS' }),
        drillPath: expect.any(Array),
      }),
    );
  });

  it('does not log when runId is missing', () => {
    renderHook(() => useValuationDrillAudit('push_level', 1, { runId: '' }), {
      wrapper: makeWrapper(['/valuation-recon//by-desk']),
    });
    expect(logDrillEvent).not.toHaveBeenCalled();
  });

  it('re-logs when scope signature changes', () => {
    const { rerender } = renderHook(
      ({ scope }: { scope: ValuationDrillScopeValue }) =>
        useValuationDrillAudit('push_level', 2, scope),
      {
        initialProps: { scope: { runId: RUN_ID, traderDesk: 'OIL' } },
        wrapper: makeWrapper([`/valuation-recon/${RUN_ID}/by-desk`]),
      },
    );
    expect(logDrillEvent).toHaveBeenCalledTimes(1);
    rerender({ scope: { runId: RUN_ID, traderDesk: 'GAS' } });
    expect(logDrillEvent).toHaveBeenCalledTimes(2);
  });
});
