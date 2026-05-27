import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createDrillState, useDrillErrorToast, type DrillQueryState } from '@/hooks/drill/shared';
import type {
  ConfirmationDiscrepancy,
  ConfirmationDocument,
  FieldCategory,
  TradeConfirmationStatus,
} from './types';

export interface ConfirmationDealDetail {
  status: TradeConfirmationStatus | null;
  ourDoc: ConfirmationDocument | null;
  counterpartyDoc: ConfirmationDocument | null;
  discrepancies: ConfirmationDiscrepancy[];
  discrepanciesByCategory: Record<FieldCategory, ConfirmationDiscrepancy[]>;
}

function mapDoc(d: Record<string, unknown> | null): ConfirmationDocument | null {
  if (!d) return null;
  return {
    confirmationDocId: d.confirmation_doc_id as string,
    externalDocRef: (d.external_doc_ref as string) ?? null,
    docType: (d.doc_type as string) ?? null,
    source: (d.source as string) ?? null,
    format: (d.format as string) ?? null,
    receivedAt: (d.received_at as string) ?? null,
    parsedAt: (d.parsed_at as string) ?? null,
    parsingStatus: (d.parsing_status as string) ?? null,
    parsingConfidence: (d.parsing_confidence as number) ?? null,
    storagePath: (d.storage_path as string) ?? null,
    counterpartyId: (d.counterparty_id as string) ?? null,
    legalEntityId: (d.legal_entity_id as string) ?? null,
    tradeDate: (d.trade_date as string) ?? null,
    productCode: (d.product_code as string) ?? null,
    notional: (d.notional as number) ?? null,
    currency: (d.currency as string) ?? null,
    parsedAttributes: (d.parsed_attributes as Record<string, unknown>) ?? null,
  };
}

function mapDiscrepancy(d: Record<string, unknown>): ConfirmationDiscrepancy {
  return {
    discrepancyId: d.discrepancy_id as string,
    runId: d.run_id as string,
    dealId: d.deal_id as string,
    fieldName: d.field_name as string,
    fieldCategory: (d.field_category as FieldCategory) ?? 'other',
    ourValue: (d.our_value as string) ?? null,
    counterpartyValue: (d.counterparty_value as string) ?? null,
    ourValueNormalized: (d.our_value_normalized as string) ?? null,
    counterpartyValueNormalized: (d.counterparty_value_normalized as string) ?? null,
    isMaterial: (d.is_material as boolean) ?? null,
    toleranceApplied: (d.tolerance_applied as string) ?? null,
    discrepancyType: (d.discrepancy_type as ConfirmationDiscrepancy['discrepancyType']) ?? null,
    suggestedRootCause: (d.suggested_root_cause as string) ?? null,
    aiConfidence: (d.ai_confidence as number) ?? null,
    status: (d.status as ConfirmationDiscrepancy['status']) ?? 'open',
    resolutionNote: (d.resolution_note as string) ?? null,
    resolvedAt: (d.resolved_at as string) ?? null,
    resolvedBy: (d.resolved_by as string) ?? null,
    createdAt: (d.created_at as string) ?? '',
  };
}

export function useConfirmationDealDetail(
  runId: string | null,
  dealId: string | null,
): DrillQueryState<ConfirmationDealDetail | null> {
  const query = useQuery({
    queryKey: ['confirmations', 'deal-detail', runId, dealId],
    queryFn: async () => {
      if (!runId || !dealId) return null;
      const { data: statusRow, error: stErr } = await supabase
        .from('trade_confirmation_status')
        .select('*')
        .eq('run_id', runId)
        .eq('deal_id', dealId)
        .maybeSingle();
      if (stErr) throw stErr;

      const docIds = [statusRow?.our_capture_doc_id, statusRow?.counterparty_confirm_doc_id].filter(
        (id): id is string => Boolean(id),
      );
      const docsRes = docIds.length
        ? await supabase.from('confirmation_documents').select('*').in('confirmation_doc_id', docIds)
        : { data: [], error: null };
      if (docsRes.error) throw docsRes.error;

      const { data: discRows, error: dErr } = await supabase
        .from('confirmation_discrepancies')
        .select('*')
        .eq('run_id', runId)
        .eq('deal_id', dealId)
        .order('field_category', { ascending: true })
        .order('field_name', { ascending: true });
      if (dErr) throw dErr;

      return { statusRow, docs: docsRes.data ?? [], discRows: discRows ?? [] };
    },
    enabled: !!runId && !!dealId,
  });

  useDrillErrorToast(query.error, 'Failed to load deal confirmation detail');

  let result: ConfirmationDealDetail | null = null;
  if (query.data) {
    const { statusRow, docs, discRows } = query.data;
    const ourDoc = docs.find((d) => d.confirmation_doc_id === statusRow?.our_capture_doc_id) ?? null;
    const cpDoc = docs.find((d) => d.confirmation_doc_id === statusRow?.counterparty_confirm_doc_id) ?? null;
    const status: TradeConfirmationStatus | null = statusRow
      ? {
          tradeConfirmationId: statusRow.trade_confirmation_id,
          runId: statusRow.run_id,
          dealId: statusRow.deal_id,
          ourCaptureDocId: statusRow.our_capture_doc_id,
          counterpartyConfirmDocId: statusRow.counterparty_confirm_doc_id,
          stage: (statusRow.stage as TradeConfirmationStatus['stage']) ?? 'awaiting_us',
          fieldDiscrepancyCount: Number(statusRow.field_discrepancy_count ?? 0),
          materialDiscrepancyCount: Number(statusRow.material_discrepancy_count ?? 0),
          blockingSettlement: Boolean(statusRow.blocking_settlement),
          lastActionAt: statusRow.last_action_at,
          slaBreachAt: statusRow.sla_breach_at,
        }
      : null;
    const discrepancies = discRows.map(mapDiscrepancy);
    const discrepanciesByCategory: Record<FieldCategory, ConfirmationDiscrepancy[]> = {
      economic: [],
      temporal: [],
      legal: [],
      settlement: [],
      reference_data: [],
      other: [],
    };
    discrepancies.forEach((d) => {
      const cat = (d.fieldCategory ?? 'other') as FieldCategory;
      (discrepanciesByCategory[cat] ||= []).push(d);
    });
    result = { status, ourDoc: mapDoc(ourDoc), counterpartyDoc: mapDoc(cpDoc), discrepancies, discrepanciesByCategory };
  }

  return createDrillState({
    data: result,
    error: query.error as Error | null,
    isEmpty: !result?.status,
    isLoading: query.isLoading,
  });
}
