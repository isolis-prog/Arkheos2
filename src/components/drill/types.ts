import type { ReactNode } from 'react';

export type DrillFormat = 'number' | 'currency' | 'percent' | 'date' | 'text';

export interface DrillPathNode {
  level: number;
  label: string;
  scope: Record<string, unknown>;
  href: string;
}

export interface DrillColumn<TRow extends { id: string }> {
  key: string;
  header: string;
  accessor: (row: TRow) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  format?: DrillFormat;
}

export type DrillScope = Record<
  string,
  {
    label: string;
    value: string;
    removable?: boolean;
  }
>;

export interface BreakSideRecord {
  id: string;
  label: string;
  amount?: number | null;
  currency?: string | null;
  date?: string | null;
  reference?: string | null;
  fields: Record<string, string | number | null | undefined>;
}

export interface BreakComment {
  id: string;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email?: string | null;
  };
  optimistic?: boolean;
}

export interface BreakHistoryEvent {
  id: string;
  type: 'comment' | 'status_change';
  label: string;
  description?: string;
  createdAt: string;
  actor?: string;
}

/**
 * Audit/lineage evidence captured per row by the enrichment pipeline.
 * Mirrors the new lineage columns on `break_details` and `document_trade_links`.
 * Every field is optional so legacy rows without lineage still render.
 */
export interface LineageEvidence {
  /** Canonical record IDs that produced sides A/B (break_details.source_record_ids). */
  sourceRecordIds?: string[] | null;
  sideASourceRef?: string | null;
  sideBSourceRef?: string | null;

  /** Reconciliation rule that flagged the row + version effective at evaluation time. */
  ruleId?: string | null;
  ruleVersion?: string | null;

  /** Snapshot of raw inputs used in the calculation (amounts, dates, FX, tolerance). */
  derivationInputs?: Record<string, unknown> | null;

  /** Enrichment job that wrote/updated the row. */
  enrichmentRunId?: string | null;
  enrichedAt?: string | null;
  enrichedBy?: string | null;

  /** AIL inference behind suggested root cause / link suggestion. */
  ailRequestId?: string | null;
  ailModelVersion?: string | null;

  /** For document_trade_links: how the link was produced. */
  resolutionMethod?: string | null;
  resolvedByRunId?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;

  /** Feature snapshot used in the link match (overlap fields, similarity scores, FX, dates). */
  matchFeatures?: Record<string, unknown> | null;

  /** Audit pointers (e.g. audit_events.id, agent_audit_events.id). */
  evidenceRefs?: Array<Record<string, unknown>> | null;
}

export interface BreakDetailView {
  id: string;
  breakId: string;
  exceptionId?: string;
  exceptionCaseId?: string;
  status: string;
  title?: string;
  currency?: string | null;
  sideA: BreakSideRecord;
  sideB: BreakSideRecord;
  sideAAmount?: number | null;
  sideBAmount?: number | null;
  amountDelta?: number | null;
  amountDeltaPct?: number | null;
  sideADate?: string | null;
  sideBDate?: string | null;
  dateDeltaDays?: number | null;
  suggestedRootCause?: string | null;
  aiConfidence?: number | null;
  toleranceAmount?: number | null;
  tolerancePct?: number | null;
  comments?: BreakComment[];
  history?: BreakHistoryEvent[];
  lineage?: LineageEvidence | null;
}
