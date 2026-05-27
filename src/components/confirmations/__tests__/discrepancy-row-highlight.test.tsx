import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmationDocumentSideBySide } from '../ConfirmationDocumentSideBySide';
import { FieldDiscrepancyTable } from '../FieldDiscrepancyTable';
import type {
  ConfirmationDiscrepancy,
  ConfirmationDocument,
} from '@/hooks/confirmations/types';

// useConfirmationDocUrl hits supabase — stub it for the viewer.
vi.mock('@/hooks/confirmations/useConfirmationDocUrl', () => ({
  useConfirmationDocUrl: () => ({ mutate: vi.fn(), isPending: false }),
}));

const ourDoc: ConfirmationDocument = {
  confirmationDocId: 'our-1',
  externalDocRef: 'OUR-1',
  docType: 'our_capture',
  source: 'TRADING_SYSTEM',
  format: 'trade_capture',
  receivedAt: '2025-01-01T00:00:00Z',
  parsedAt: null,
  parsingStatus: 'parsed',
  parsingConfidence: 0.99,
  storagePath: null,
  counterpartyId: null,
  legalEntityId: null,
  tradeDate: '2025-01-01',
  productCode: 'IRS_USD',
  notional: 10_000_000,
  currency: 'USD',
  parsedAttributes: { notional: 10_000_000, price: 100, day_count: 'ACT/360' },
};

const cpDoc: ConfirmationDocument = {
  ...ourDoc,
  confirmationDocId: 'cp-1',
  externalDocRef: 'CP-1',
  docType: 'counterparty_confirm',
  source: 'COUNTERPARTY_PORTAL',
  format: 'fpml',
  parsedAttributes: { notional: 10_000_500, price: 100.05, day_count: 'Actual/360' },
};

const discrepancies: ConfirmationDiscrepancy[] = [
  {
    discrepancyId: 'd-notional',
    runId: 'r1',
    dealId: 'DEAL-1',
    fieldName: 'notional',
    fieldCategory: 'economic',
    ourValue: '10000000',
    counterpartyValue: '10000500',
    ourValueNormalized: '10000000',
    counterpartyValueNormalized: '10000500',
    isMaterial: true,
    toleranceApplied: 'numeric_tolerance:0.0001%',
    discrepancyType: 'mismatch',
    suggestedRootCause: null,
    aiConfidence: null,
    status: 'open',
    resolutionNote: null,
    resolvedAt: null,
    resolvedBy: null,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    discrepancyId: 'd-price',
    runId: 'r1',
    dealId: 'DEAL-1',
    fieldName: 'price',
    fieldCategory: 'economic',
    ourValue: '100',
    counterpartyValue: '100.05',
    ourValueNormalized: '100',
    counterpartyValueNormalized: '100.05',
    isMaterial: true,
    toleranceApplied: 'numeric_tolerance:0.00001%',
    discrepancyType: 'mismatch',
    suggestedRootCause: null,
    aiConfidence: null,
    status: 'open',
    resolutionNote: null,
    resolvedAt: null,
    resolvedBy: null,
    createdAt: '2025-01-01T00:00:00Z',
  },
];

// Mirrors the highlighting wiring in TradeConfirmationDetailPage.
function Harness() {
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const noop = () => {};
  return (
    <>
      <ConfirmationDocumentSideBySide
        ourDoc={ourDoc}
        counterpartyDoc={cpDoc}
        highlightFields={highlightedField ? [highlightedField] : []}
        awaitingSide={null}
      />
      <FieldDiscrepancyTable
        discrepancies={discrepancies}
        highlightedFieldName={highlightedField}
        onRowClick={(d) =>
          setHighlightedField((prev) => (prev === d.fieldName ? null : d.fieldName))
        }
        onResolve={noop}
        onAccept={noop}
        onReject={noop}
        onAmend={noop}
        onEscalate={noop}
        onReopen={noop}
        onFlagFalsePositive={noop}
      />
    </>
  );
}

describe('TradeConfirmationDetail field highlighting', () => {
  it('highlights only the clicked field on both document sides', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const ourNotional = screen.getByTestId('doc-us-field-notional');
    const cpNotional = screen.getByTestId('doc-counterparty-field-notional');
    const ourPrice = screen.getByTestId('doc-us-field-price');

    // Nothing highlighted initially.
    expect(ourNotional.className).not.toMatch(/ring-destructive/);
    expect(cpNotional.className).not.toMatch(/ring-destructive/);

    // Click the "notional" discrepancy row.
    await user.click(screen.getByTestId('discrepancy-row-notional'));

    expect(ourNotional.className).toMatch(/ring-destructive/);
    expect(cpNotional.className).toMatch(/ring-destructive/);
    // Other fields stay un-highlighted.
    expect(ourPrice.className).not.toMatch(/ring-destructive/);
  });

  it('moves the highlight when a different row is clicked', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByTestId('discrepancy-row-notional'));
    await user.click(screen.getByTestId('discrepancy-row-price'));

    expect(screen.getByTestId('doc-us-field-notional').className).not.toMatch(/ring-destructive/);
    expect(screen.getByTestId('doc-us-field-price').className).toMatch(/ring-destructive/);
    expect(screen.getByTestId('doc-counterparty-field-price').className).toMatch(/ring-destructive/);
  });

  it('toggles highlight off when the same row is clicked twice', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const row = screen.getByTestId('discrepancy-row-notional');
    await user.click(row);
    expect(screen.getByTestId('doc-us-field-notional').className).toMatch(/ring-destructive/);

    await user.click(row);
    expect(screen.getByTestId('doc-us-field-notional').className).not.toMatch(/ring-destructive/);
    expect(screen.getByTestId('doc-counterparty-field-notional').className).not.toMatch(/ring-destructive/);
  });
});
