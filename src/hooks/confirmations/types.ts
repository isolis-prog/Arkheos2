export type ConfirmationStage =
  | 'awaiting_counterparty'
  | 'awaiting_us'
  | 'matched'
  | 'disputed'
  | 'amended'
  | 'cancelled';

export type FieldCategory = 'economic' | 'temporal' | 'legal' | 'settlement' | 'reference_data' | 'other';

export type DiscrepancyType = 'mismatch' | 'missing_our_side' | 'missing_their_side' | 'format_only';

export type DiscrepancyStatus = 'open' | 'resolved' | 'accepted_as_is' | 'escalated' | 'false_positive';

export interface ConfirmationDiscrepancy {
  discrepancyId: string;
  runId: string;
  dealId: string;
  fieldName: string;
  fieldCategory: FieldCategory;
  ourValue: string | null;
  counterpartyValue: string | null;
  ourValueNormalized: string | null;
  counterpartyValueNormalized: string | null;
  isMaterial: boolean | null;
  toleranceApplied: string | null;
  discrepancyType: DiscrepancyType | null;
  suggestedRootCause: string | null;
  aiConfidence: number | null;
  status: DiscrepancyStatus;
  resolutionNote: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
}

export interface ConfirmationDocument {
  confirmationDocId: string;
  externalDocRef: string | null;
  docType: string | null;
  source: string | null;
  format: string | null;
  receivedAt: string | null;
  parsedAt: string | null;
  parsingStatus: string | null;
  parsingConfidence: number | null;
  storagePath: string | null;
  counterpartyId: string | null;
  legalEntityId: string | null;
  tradeDate: string | null;
  productCode: string | null;
  notional: number | null;
  currency: string | null;
  parsedAttributes: Record<string, unknown> | null;
}

export interface TradeConfirmationStatus {
  tradeConfirmationId: string;
  runId: string | null;
  dealId: string;
  ourCaptureDocId: string | null;
  counterpartyConfirmDocId: string | null;
  stage: ConfirmationStage;
  fieldDiscrepancyCount: number;
  materialDiscrepancyCount: number;
  blockingSettlement: boolean;
  lastActionAt: string | null;
  slaBreachAt: string | null;
}
