import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';
import { useCashflowByBucket, CASHFLOW_BUCKET_ORDER } from './useCashflowByBucket';

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

describe('useCashflowByBucket', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 7 ordered buckets with zero counts when MV is empty', async () => {
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], error: null });
    const { result } = renderHook(() => useCashflowByBucket('2026-04-24'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data.map((r) => r.bucket)).toEqual([...CASHFLOW_BUCKET_ORDER]);
    expect(result.current.isEmpty).toBe(true);
  });

  it('aggregates inflow and outflow per bucket', async () => {
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        { bucket: 'OVERDUE', flow_direction: 'inflow', total_amount_base: 100, event_count: 2, currency: 'USD' },
        { bucket: 'OVERDUE', flow_direction: 'outflow', total_amount_base: 30, event_count: 1, currency: 'USD' },
        { bucket: 'D30', flow_direction: 'inflow', total_amount_base: 50, event_count: 1, currency: 'EUR' },
      ],
      error: null,
    });
    const { result } = renderHook(() => useCashflowByBucket('2026-04-24'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const overdue = result.current.data.find((r) => r.bucket === 'OVERDUE')!;
    expect(overdue.inflow).toBe(100);
    expect(overdue.outflow).toBe(30);
    expect(overdue.net).toBe(70);
    expect(overdue.eventCount).toBe(3);
  });
});
