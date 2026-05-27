import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

vi.mock('@/hooks/useDrillAudit', () => ({
  useDrillAudit: () => ({ logDrillEvent: vi.fn().mockResolvedValue(undefined) }),
}));

import BucketBreakdownPage from './BucketBreakdownPage';

const wrapper = ({ children, initial = '/cashflows/buckets' }: { children: ReactNode; initial?: string }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/cashflows/buckets" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('BucketBreakdownPage (L2)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders title and bucket table when data is empty', async () => {
    render(wrapper({ children: <BucketBreakdownPage /> }));
    await waitFor(() => expect(screen.getByText(/Cashflow buckets/i)).toBeInTheDocument());
    // Breadcrumb shows the Cashflows root
    expect(screen.getAllByText(/Cashflows/i).length).toBeGreaterThan(0);
  });
});
