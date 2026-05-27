import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('./_drillScope', async () => {
  const actual = await vi.importActual<typeof import('./_drillScope')>('./_drillScope');
  return { ...actual, useReconDrillAudit: vi.fn() };
});

const docsState = {
  data: {
    rows: [] as Array<Record<string, unknown>>,
    totalCount: 0 as number | null,
    nextCursor: null as { amountDelta: number | null; docId: string } | null,
    hasMore: false,
  },
  isLoading: false,
  isEmpty: true,
  error: null as unknown,
};
vi.mock('@/hooks/useBreakDocuments', () => ({
  useBreakDocuments: () => docsState,
  useBreakDocumentsPager: () => ({
    cursor: null,
    pageIndex: 0,
    canGoBack: false,
    next: vi.fn(),
    prev: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('@/components/drill/ExportScopeButton', () => ({
  ExportScopeButton: () => <button type="button">Export scope</button>,
}));

import ReconDocumentListPage from './ReconDocumentListPage';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/reconciliations/run-abc123/drill/documents']}>
        <ReconDocumentListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ReconDocumentListPage (L5)', () => {
  beforeEach(() => {
    docsState.data = { rows: [], totalCount: 0, nextCursor: null, hasMore: false };
    docsState.isLoading = false;
    docsState.isEmpty = true;
  });

  it('renders the empty state when no documents match the scope', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /Break documents/i })).toBeInTheDocument();
    expect(screen.getByText(/No break documents/i)).toBeInTheDocument();
  });

  it('renders a row per document when data is present', () => {
    docsState.data = {
      rows: [
        {
          docId: 'INV-1001',
          docType: 'INVOICE',
          issueDate: '2025-01-10',
          dueDate: '2025-02-10',
          sideAAmount: 1000,
          sideBAmount: 950,
          amountDelta: 50,
          amountDeltaPct: 0.05,
          currency: 'USD',
          breakCategory: 'AMOUNT_DIFF',
          status: 'OPEN',
          tradeCount: 2,
          suggestedRootCause: null,
          aiConfidence: null,
        },
        {
          docId: 'INV-1002',
          docType: 'INVOICE',
          issueDate: null,
          dueDate: null,
          sideAAmount: 200,
          sideBAmount: null,
          amountDelta: 200,
          amountDeltaPct: 1,
          currency: 'USD',
          breakCategory: 'MISSING_DOC',
          status: 'OPEN',
          tradeCount: 1,
          suggestedRootCause: null,
          aiConfidence: null,
        },
      ],
      totalCount: 2,
      nextCursor: null,
      hasMore: false,
    };
    docsState.isEmpty = false;

    renderPage();
    expect(screen.getByText('INV-1001')).toBeInTheDocument();
    expect(screen.getByText('INV-1002')).toBeInTheDocument();
    expect(screen.getByText('AMOUNT_DIFF')).toBeInTheDocument();
    expect(screen.getByText('MISSING_DOC')).toBeInTheDocument();
  });
});
