import { useConfirmationDealDetail } from './useConfirmationDealDetail';
import type { ConfirmationDocument } from './types';

export interface ConfirmationDocumentPair {
  ourDoc: ConfirmationDocument | null;
  counterpartyDoc: ConfirmationDocument | null;
}

/** Convenience hook returning just the document pair for the side-by-side viewer. */
export function useConfirmationDocumentPair(runId: string | null, dealId: string | null) {
  const detail = useConfirmationDealDetail(runId, dealId);
  return {
    ...detail,
    data: { ourDoc: detail.data?.ourDoc ?? null, counterpartyDoc: detail.data?.counterpartyDoc ?? null },
  };
}
