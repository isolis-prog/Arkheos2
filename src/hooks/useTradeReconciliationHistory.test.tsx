import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTradeReconciliationHistory } from './useTradeReconciliationHistory';

vi.mock('@/integrations/supabase/client', () => {
  const builders: Record<string, unknown> = {};
  const make = (data: unknown[]) => {
    const builder: Record<string, unknown> = {};
    builder.select = () => builder;
    builder.eq = () => builder;
    builder.in = () => builder;
    builder.limit = () => Promise.resolve({ data, error: null });
    builder.then = (resolve: (value: unknown) => unknown) =>
      resolve({ data, error: null });
    return builder;
  };

  return {
    supabase: {
      from: (table: string) => {
        const data = (builders[table] as unknown[]) ?? [];
        return make(data);
      },
      __setTable: (table: string, data: unknown[]) => {
        builders[table] = data;
      },
    },
  };
});

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useTradeReconciliationHistory', () => {
  beforeEach(async () => {
    const mod = (await import('@/integrations/supabase/client')) as unknown as {
      supabase: { __setTable: (t: string, d: unknown[]) => void };
    };
    mod.supabase.__setTable('document_trade_links', []);
    mod.supabase.__setTable('break_details', []);
    mod.supabase.__setTable('canonical_records', []);
    mod.supabase.__setTable('reconciliation_runs', []);
    mod.supabase.__setTable('exception_cases', []);
  });

  it('returns empty state when there is no history', async () => {
    const { result } = renderHook(() => useTradeReconciliationHistory('DL-123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.data.hasHistory).toBe(false);
    expect(result.current.data.summary.totalBreaksCount).toBe(0);
  });

  it('skips fetching when dealId is undefined', () => {
    const { result } = renderHook(() => useTradeReconciliationHistory(undefined), {
      wrapper,
    });
    expect(result.current.data.events).toEqual([]);
  });
});
