import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Stub recharts to a lightweight render — jsdom + ResponsiveContainer is noisy.
vi.mock('recharts', () => {
  const Stub = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    Bar: Stub,
    BarChart: Stub,
    CartesianGrid: Stub,
    ResponsiveContainer: Stub,
    Tooltip: Stub,
    XAxis: Stub,
    YAxis: Stub,
  };
});

// Mock audit hook (no Supabase calls during tests).
vi.mock('./_drillScope', async () => {
  const actual = await vi.importActual<typeof import('./_drillScope')>('./_drillScope');
  return { ...actual, useReconDrillAudit: vi.fn() };
});

// Mock the data hook so we control the rendered state.
const breakdownState = {
  data: [] as Array<{
    breakCategory: string;
    breakCount: number;
    totalExposureUsd: number;
    minAmountDelta: number | null;
    maxAmountDelta: number | null;
    avgAgeDays: number | null;
  }>,
  isLoading: false,
  isEmpty: true,
  error: null as unknown,
};
vi.mock('@/hooks/useRunBreakdownByType', () => ({
  useRunBreakdownByType: () => breakdownState,
}));

// Avoid hitting ExportScopeButton dialog logic (Supabase + portals).
vi.mock('@/components/drill/ExportScopeButton', () => ({
  ExportScopeButton: () => <button type="button">Export scope</button>,
}));

import ReconBreakTypeBreakdownPage from './ReconBreakTypeBreakdownPage';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/reconciliations/run-abc123/drill/by-type']}>
        <ReconBreakTypeBreakdownPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ReconBreakTypeBreakdownPage (L2)', () => {
  beforeEach(() => {
    breakdownState.data = [];
    breakdownState.isLoading = false;
    breakdownState.isEmpty = true;
  });

  it('renders the empty state when there are no break types', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /Break types/i })).toBeInTheDocument();
    expect(screen.getByText(/No breaks in this scope/i)).toBeInTheDocument();
  });

  it('renders rows from the breakdown hook', () => {
    breakdownState.data = [
      {
        breakCategory: 'AMOUNT_DIFF',
        breakCount: 12,
        totalExposureUsd: 45000,
        minAmountDelta: -100,
        maxAmountDelta: 9000,
        avgAgeDays: 3.4,
      },
      {
        breakCategory: 'MISSING_DOC',
        breakCount: 4,
        totalExposureUsd: 1200,
        minAmountDelta: 0,
        maxAmountDelta: 1200,
        avgAgeDays: 1,
      },
    ];
    breakdownState.isEmpty = false;

    renderPage();
    expect(screen.getByText('AMOUNT_DIFF')).toBeInTheDocument();
    expect(screen.getByText('MISSING_DOC')).toBeInTheDocument();
    // Counts rendered by DrillDownTable as plain numbers.
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
