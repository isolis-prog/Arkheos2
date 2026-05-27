import { useMemo } from 'react';
import { BreakDetailPanel, type BreakDetailView } from '@/components/drill';
import { useCashflowDocumentDetail } from '@/hooks/cashflows/useCashflowDocumentDetail';
import {
  useResolveCashflowBreak,
  useAddCashflowComment,
} from '@/hooks/cashflows/useCashflowMutations';
import { CashflowExceptionWorkflowPanel } from './CashflowExceptionWorkflowPanel';

export interface CashflowBreakDetailPanelProps {
  consolidatedCashflowId: string | null;
  isOpen: boolean;
  onClose: () => void;
  /** When true, resolve & comment actions are hidden (period locked). */
  locked?: boolean;
}

/**
 * Cashflow-specific wrapper around the shared BreakDetailPanel.
 * Maps consolidated_cashflow + cashflow_exceptions into the canonical
 * BreakDetailView shape so the same panel renders for the Cashflows module.
 */
export function CashflowBreakDetailPanel({
  consolidatedCashflowId,
  isOpen,
  onClose,
  locked = false,
}: CashflowBreakDetailPanelProps) {
  const detail = useCashflowDocumentDetail(consolidatedCashflowId);
  const resolveMutation = useResolveCashflowBreak();
  const commentMutation = useAddCashflowComment();

  const breakView: BreakDetailView | null = useMemo(() => {
    if (!detail.data || !detail.data.consolidated) return null;
    const c = detail.data.consolidated;
    const exception = detail.data.exceptions[0] ?? null;
    const bd = detail.data.breakDetails[0] ?? null;

    // Pick representative ETRM-side and ERP-side events when available
    const events = detail.data.events;
    const etrmEvent = events.find((e) => /etrm|trade/i.test(e.source_system)) ?? events[0];
    const erpEvent =
      events.find((e) => /erp|netsuite|sap/i.test(e.source_system)) ?? events[1] ?? events[0];

    // Prefer authoritative break_details numbers (expected vs actual) over
    // event heuristics so the before/after diff stays consistent with what
    // the enrichment pipeline computed.
    const sideAAmount =
      bd?.expected_amount ?? etrmEvent?.amount_base ?? c.amount_base ?? null;
    const sideBAmount = bd?.actual_amount ?? erpEvent?.amount_base ?? null;
    const sideADate = bd?.expected_date ?? etrmEvent?.value_date ?? c.value_date ?? null;
    const sideBDate = bd?.actual_date ?? erpEvent?.value_date ?? null;
    const amountDelta =
      bd?.amount_delta ??
      (sideAAmount !== null && sideBAmount !== null ? sideAAmount - sideBAmount : null);
    const dateDeltaDays =
      bd?.date_delta_days ??
      (sideADate && sideBDate
        ? Math.round(
            (new Date(sideADate).getTime() - new Date(sideBDate).getTime()) / 86400000,
          )
        : null);

    // Map evidence_refs.documents into LineageEvidence.evidenceRefs so the
    // shared LineageEvidencePanel renders them as clickable evidence rows.
    const evidence = (bd?.evidence_refs ?? null) as
      | {
          consolidated_cashflow_id?: string | null;
          cashflow_event_ids?: string[];
          documents?: Array<{ doc_id: string; doc_type: string; source: string }>;
          generated_at?: string;
        }
      | null;

    const evidenceRefs: Array<Record<string, unknown>> = [];
    if (evidence?.consolidated_cashflow_id) {
      evidenceRefs.push({
        type: 'consolidated_cashflow',
        id: evidence.consolidated_cashflow_id,
      });
    }
    for (const eventId of evidence?.cashflow_event_ids ?? []) {
      evidenceRefs.push({ type: 'cashflow_event', id: eventId });
    }
    for (const doc of evidence?.documents ?? []) {
      evidenceRefs.push({
        type: doc.doc_type,
        id: doc.doc_id,
        source: doc.source,
      });
    }

    const suggestedRootCause =
      bd?.suggested_root_cause ?? exception?.description ?? null;

    return {
      id: c.id,
      breakId: c.reference ?? c.id.slice(0, 8),
      exceptionId: exception?.id ?? bd?.cashflow_exception_id,
      exceptionCaseId: exception?.id ?? bd?.cashflow_exception_id,
      status: exception?.status ?? c.status ?? 'open',
      title: `Cashflow ${c.direction} • ${c.counterparty ?? '—'}`,
      currency: bd?.currency ?? c.currency_original,
      sideA: {
        id: etrmEvent?.id ?? `${c.id}-expected`,
        label: bd ? 'Expected' : etrmEvent ? `ETRM (${etrmEvent.source_system})` : 'Expected (ETRM)',
        amount: sideAAmount,
        currency: bd?.currency ?? etrmEvent?.currency_original ?? c.currency_original,
        date: sideADate,
        reference: etrmEvent?.reference ?? c.reference,
        fields: {
          source: etrmEvent?.source_system ?? '—',
          legalEntity: c.legal_entity,
          counterparty: c.counterparty,
          bucket: bd?.bucket ?? c.bucket,
          breakCategory: bd?.break_category ?? '—',
          status: etrmEvent?.status ?? '—',
        },
      },
      sideB: {
        id: erpEvent?.id ?? `${c.id}-actual`,
        label: bd ? 'Actual' : erpEvent ? `ERP (${erpEvent.source_system})` : 'Actual (ERP)',
        amount: sideBAmount,
        currency: bd?.currency ?? erpEvent?.currency_original ?? c.currency_original,
        date: sideBDate,
        reference: erpEvent?.reference ?? null,
        fields: {
          source: erpEvent?.source_system ?? '—',
          legalEntity: c.legal_entity,
          counterparty: c.counterparty,
          bucket: bd?.bucket ?? c.bucket,
          flowDirection: bd?.flow_direction ?? c.direction,
          status: erpEvent?.status ?? '—',
        },
      },
      sideAAmount,
      sideBAmount,
      amountDelta,
      amountDeltaPct:
        amountDelta !== null && sideAAmount ? (amountDelta / Math.abs(sideAAmount)) * 100 : null,
      sideADate,
      sideBDate,
      dateDeltaDays,
      suggestedRootCause,
      aiConfidence: bd?.ai_confidence ?? c.confidence_score ?? null,
      lineage: bd
        ? {
            enrichmentRunId: bd.enrichment_run_id,
            enrichedAt: bd.enriched_at,
            evidenceRefs: evidenceRefs.length ? evidenceRefs : null,
            derivationInputs: evidence
              ? (evidence as unknown as Record<string, unknown>)
              : null,
          }
        : null,
    };
  }, [detail.data]);

  return (
    <BreakDetailPanel
      break={breakView}
      isOpen={isOpen}
      onClose={onClose}
      onMarkResolved={
        locked
          ? undefined
          : async (_id, note) => {
              if (!breakView?.exceptionId) return;
              await resolveMutation.mutateAsync({ exceptionId: breakView.exceptionId, notes: note });
              onClose();
            }
      }
      onAddComment={
        locked
          ? undefined
          : async (_id, comment) => {
              if (!breakView?.exceptionId) return;
              await commentMutation.mutateAsync({
                exceptionId: breakView.exceptionId,
                comment,
              });
            }
      }
      extraSections={
        breakView?.exceptionId ? (
          <CashflowExceptionWorkflowPanel
            exceptionId={breakView.exceptionId}
            currentStatus={breakView.status}
            currentAssigneeId={detail.data?.exceptions[0]?.assigned_to ?? null}
            locked={locked}
          />
        ) : null
      }
    />
  );
}
