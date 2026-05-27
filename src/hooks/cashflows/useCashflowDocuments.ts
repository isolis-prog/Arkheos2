import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createDrillState, useDrillErrorToast, type DrillQueryState } from '@/hooks/drill/shared';

const TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

export interface CashflowDocumentRow {
  consolidatedCashflowId: string;
  docId: string | null;
  docType: string | null;
  legalEntityId: string | null;
  externalCounterpartyId: string | null;
  expectedAmount: number | null;
  actualAmount: number | null;
  amountDelta: number | null;
  bucket: string;
  flowDirection: 'inflow' | 'outflow';
  currency: string | null;
  status: string | null;
  daysToDue: number | null;
  linkedTradeCount: number;
  breakCategory: string | null;
  suggestedRootCause: string | null;
  aiConfidence: number | null;
  expectedDate: string | null;
  actualDate: string | null;
}

export interface UseCashflowDocumentsFilters {
  bucket?: string;
  legalEntityId?: string;
  counterpartyId?: string;
  flowDirection?: 'inflow' | 'outflow';
  pageSize?: number;
  pageIndex?: number;
}

export interface UseCashflowDocumentsResult {
  rows: CashflowDocumentRow[];
  total: number;
  pageSize: number;
  pageIndex: number;
}

export function useCashflowDocuments(
  asOfDate: string,
  filters: UseCashflowDocumentsFilters = {},
): DrillQueryState<UseCashflowDocumentsResult> {
  const pageSize = filters.pageSize ?? 50;
  const pageIndex = filters.pageIndex ?? 0;

  const mvQuery = useQuery({
    queryKey: ['cashflow', 'documents', asOfDate, filters],
    queryFn: async () => {
      let q = supabase
        .from('mv_cashflow_by_document')
        .select('*', { count: 'exact' })
        .eq('as_of_date', asOfDate);
      if (filters.bucket) q = q.eq('bucket', filters.bucket);
      if (filters.legalEntityId) q = q.eq('legal_entity_id', filters.legalEntityId);
      if (filters.counterpartyId) q = q.eq('external_counterparty_id', filters.counterpartyId);
      if (filters.flowDirection) q = q.eq('flow_direction', filters.flowDirection);
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await q.range(from, to);
      if (error) {
        if ((error as any).code === '42501') return { docs: [], count: 0, bdMap: new Map() };
        throw error;
      }

      const docs = data || [];
      const exceptionIds = docs
        .map((d) => d.consolidated_cashflow_id)
        .filter((id): id is string => Boolean(id));

      let breakDetails: Array<{
        consolidated_cashflow_id: string;
        break_category: string | null;
        suggested_root_cause: string | null;
        ai_confidence: number | null;
        expected_date: string | null;
        actual_date: string | null;
      }> = [];
      if (exceptionIds.length > 0) {
        const { data: bd, error: bdErr } = await supabase
          .from('cashflow_break_details')
          .select('consolidated_cashflow_id, break_category, suggested_root_cause, ai_confidence, expected_date, actual_date')
          .in('consolidated_cashflow_id', exceptionIds);
        if (bdErr) throw bdErr;
        breakDetails = (bd || []) as typeof breakDetails;
      }
      const bdMap = new Map(breakDetails.map((b) => [b.consolidated_cashflow_id, b]));

      return { docs, count: count ?? docs.length, bdMap };
    },
    enabled: !!asOfDate,
    retry: false,
  });

  // Fallback: read directly from consolidated_cashflow.
  const fallbackQuery = useQuery({
    queryKey: ['cashflow', 'documents-fallback', TENANT_ID, filters],
    queryFn: async () => {
      let q = supabase
        .from('consolidated_cashflow')
        .select('*', { count: 'exact' })
        .eq('tenant_id', TENANT_ID);
      if (filters.bucket) q = q.eq('bucket', filters.bucket as any);
      if (filters.legalEntityId) q = q.eq('legal_entity', filters.legalEntityId);
      if (filters.counterpartyId) q = q.eq('counterparty', filters.counterpartyId);
      if (filters.flowDirection) {
        q = q.eq('direction', filters.flowDirection.toUpperCase() as any);
      }
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await q.order('value_date', { ascending: false }).range(from, to);
      if (error) throw error;
      return { docs: data || [], count: count ?? (data?.length ?? 0) };
    },
  });

  useDrillErrorToast(
    (mvQuery.error as any)?.code === '42501' ? null : (mvQuery.error as Error | null),
    'Failed to load cashflow documents',
  );

  const today = asOfDate ? new Date(asOfDate).getTime() : Date.now();

  const useFallback = !mvQuery.data || (mvQuery.data?.docs?.length ?? 0) === 0;

  let rows: CashflowDocumentRow[];
  let total: number;

  if (!useFallback) {
    rows = (mvQuery.data!.docs || []).map((r: any) => {
      const bd = mvQuery.data!.bdMap.get(r.consolidated_cashflow_id);
      return {
        consolidatedCashflowId: r.consolidated_cashflow_id,
        docId: r.doc_id,
        docType: r.doc_type,
        legalEntityId: r.legal_entity_id,
        externalCounterpartyId: r.external_counterparty_id,
        expectedAmount: r.expected_amount,
        actualAmount: r.actual_amount,
        amountDelta: r.amount_delta,
        bucket: r.bucket,
        flowDirection: r.flow_direction as 'inflow' | 'outflow',
        currency: r.currency,
        status: r.status,
        daysToDue: r.days_to_due,
        linkedTradeCount: Number(r.linked_trade_count || 0),
        breakCategory: bd?.break_category ?? null,
        suggestedRootCause: bd?.suggested_root_cause ?? null,
        aiConfidence: bd?.ai_confidence ?? null,
        expectedDate: bd?.expected_date ?? null,
        actualDate: bd?.actual_date ?? null,
      };
    });
    total = mvQuery.data!.count;
  } else {
    rows = (fallbackQuery.data?.docs || []).map((c: any) => {
      const amt = Number(c.amount_base ?? c.amount_original ?? 0);
      const valueDate = c.value_date ? new Date(c.value_date).getTime() : null;
      return {
        consolidatedCashflowId: c.id,
        docId: c.reference,
        docType: c.preferred_source,
        legalEntityId: c.legal_entity,
        externalCounterpartyId: c.counterparty,
        expectedAmount: amt,
        actualAmount: amt,
        amountDelta: 0,
        bucket: c.bucket,
        flowDirection: (c.direction === 'INFLOW' ? 'inflow' : 'outflow') as 'inflow' | 'outflow',
        currency: c.currency_original,
        status: c.status,
        daysToDue: valueDate ? Math.floor((valueDate - today) / 86400000) : null,
        linkedTradeCount: 0,
        breakCategory: null,
        suggestedRootCause: null,
        aiConfidence: null,
        expectedDate: c.value_date,
        actualDate: c.value_date,
      };
    });
    total = fallbackQuery.data?.count ?? 0;
  }

  return createDrillState({
    data: { rows, total, pageSize, pageIndex },
    error: null,
    isEmpty: rows.length === 0,
    isLoading: mvQuery.isLoading || (useFallback && fallbackQuery.isLoading),
  });
}
