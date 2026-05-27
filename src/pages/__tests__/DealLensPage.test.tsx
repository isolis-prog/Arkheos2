import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DealLensPage from '@/pages/DealLensPage';

// Stubbed tenant — exercised by useCurrentTenantId() inside useDealLens.
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u-test' },
    profile: { id: 'u-test', tenant_id: 't-test' },
    roles: [],
    loading: false,
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/deal/:dealId" element={<DealLensPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DealLensPage', () => {
  it('renders the page container', () => {
    renderAt('/deal/D-123');
    expect(screen.getByTestId('deal-lens-page')).toBeInTheDocument();
  });

  it('shows the deal id in the title', () => {
    renderAt('/deal/D-456');
    expect(screen.getByText(/Deal Lens — D-456/)).toBeInTheDocument();
  });

  it('renders a Back to Inbox button', () => {
    renderAt('/deal/D-1');
    expect(screen.getByText(/Back to Inbox/)).toBeInTheDocument();
  });

  it('renders the Deal Header card', () => {
    renderAt('/deal/D-1');
    expect(screen.getByText('Deal Header')).toBeInTheDocument();
  });

  it('renders the Cross-Module Activity card', () => {
    renderAt('/deal/D-1');
    expect(screen.getByText('Cross-Module Activity')).toBeInTheDocument();
  });

  it('renders the multi-break indicator', () => {
    renderAt('/deal/D-1');
    expect(screen.getByTestId('multi-break-indicator')).toBeInTheDocument();
  });

  it('renders module count tiles for all four modules', () => {
    renderAt('/deal/D-1');
    expect(screen.getByTestId('module-count-reconciliations')).toBeInTheDocument();
    expect(screen.getByTestId('module-count-cashflows')).toBeInTheDocument();
    expect(screen.getByTestId('module-count-valuation_recon')).toBeInTheDocument();
    expect(screen.getByTestId('module-count-confirmations_recon')).toBeInTheDocument();
  });

  it('renders the Activity Feed card', () => {
    renderAt('/deal/D-1');
    expect(screen.getByText('Activity Feed')).toBeInTheDocument();
  });
});
