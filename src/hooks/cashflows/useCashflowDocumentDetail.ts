import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createDrillState, useDrillErrorToast, type DrillQueryState } from '@/hooks/drill/shared';
import type { ConsolidatedCashflow, CashflowEvent, CashflowException } from '@/hooks/useCashflows';

export interface CashflowBreakDetailRow {
  cashflow_break_detail_id: string;
  cashflow_exception_id: string;
  expected_amount: number | null;
  actual_amount: number | null;
  amount_delta: number | null;
  currency: string | null;
  expected_date: string | null;
  actual_date: string | null;
  date_delta_days: number | null;
  bucket: string | null;
  break_category: string | null;
  flow_direction: string | null;
  suggested_root_cause: string | null;
  ai_confidence: number | null;
  evidence_refs: Record<string, unknown> | null;
  enriched_at: string | null;
  enrichment_run_id: string | null;
}

export interface CashflowDocumentDetail {
  consolidated: ConsolidatedCashflow | null;
  events: CashflowEvent[];
  exceptions: CashflowException[];
  linkedDealIds: string[];
  breakDetails: CashflowBreakDetailRow[];
}

export function useCashflowDocumentDetail(
  consolidatedCashflowId: string | null | undefined,
): DrillQueryState<CashflowDocumentDetail | null> {
  const query = useQuery({
    queryKey: ['cashflow', 'document-detail', consolidatedCashflowId],
    queryFn: async () => {
      if (!consolidatedCashflowId) return null;

      const [{ data: consolidated, error: cErr }, { data: linkRows, error: lErr }, { data: exceptions, error: eErr }, { data: breakDetails, error: bdErr }] = await Promise.all([
        supabase.from('consolidated_cashflow').select('*').eq('id', consolidatedCashflowId).maybeSingle(),
        supabase.from('cashflow_event_link').select('event_id, link_group_id').eq('link_group_id', consolidatedCashflowId),
        supabase.from('cashflow_exceptions').select('*').eq('consolidated_id', consolidatedCashflowId),
        supabase
          .from('cashflow_break_details')
          .select('cashflow_break_detail_id, cashflow_exception_id, expected_amount, actual_amount, amount_delta, currency, expected_date, actual_date, date_delta_days, bucket, break_category, flow_direction, suggested_root_cause, ai_confidence, evidence_refs, enriched_at, enrichment_run_id')
          .eq('consolidated_cashflow_id', consolidatedCashflowId),
      ]);
      if (cErr) throw cErr;
      if (lErr) throw lErr;
      if (eErr) throw eErr;
      if (bdErr) throw bdErr;

      const eventIds = (linkRows || []).map((l) => l.event_id).filter((id): id is string => Boolean(id));
      let events: CashflowEvent[] = [];
      if (eventIds.length > 0) {
        const { data: evs, error: evErr } = await supabase
          .from('cashflow_event')
          .select('*')
          .in('id', eventIds);
        if (evErr) throw evErr;
        events = (evs || []) as unknown as CashflowEvent[];
      }

      // Deal IDs come from cashflow_event.source_object_id when source_object_type ~ trade
      const linkedDealIds = Array.from(
        new Set(
          events
            .filter((e) => String(e.source_object_type).toUpperCase().includes('TRADE'))
            .map((e) => e.source_object_id)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      return {
        consolidated: (consolidated as unknown as ConsolidatedCashflow) || null,
        events,
        exceptions: (exceptions || []) as unknown as CashflowException[],
        linkedDealIds,
        breakDetails: (breakDetails || []) as unknown as CashflowBreakDetailRow[],
      } satisfies CashflowDocumentDetail;
    },
    enabled: !!consolidatedCashflowId,
  });

  useDrillErrorToast(query.error, 'Failed to load cashflow document detail');

  return createDrillState({
    data: query.data ?? null,
    error: query.error as Error | null,
    isEmpty: !query.data || (!query.data.consolidated && query.data.events.length === 0),
    isLoading: query.isLoading,
  });
}
