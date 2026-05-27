import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createDrillState, useDrillErrorToast, type DrillQueryState } from '@/hooks/drill/shared';

export interface TradeCashflowRow {
  consolidatedCashflowId: string | null;
  eventId: string;
  sourceSystem: string | null;
  valueDate: string | null;
  amountBase: number | null;
  amountOriginal: number | null;
  currencyOriginal: string | null;
  direction: string | null;
  status: string | null;
  bucket: string | null;
  counterparty: string | null;
  reference: string | null;
}

/**
 * Fetch every cashflow_event tied to a given trade (deal_id), plus the
 * consolidated_cashflow record they roll up to. Powers the Cashflow Context
 * tab inside Trade Detail and lets users jump back into the cashflow drill.
 */
export function useTradeCashflows(dealId: string | null | undefined): DrillQueryState<TradeCashflowRow[]> {
  const query = useQuery({
    queryKey: ['cashflow', 'by-trade', dealId],
    queryFn: async () => {
      if (!dealId) return [];

      const { data: events, error: evErr } = await supabase
        .from('cashflow_event')
        .select(
          'id, source_system, value_date, amount_base, amount_original, currency_original, direction, status, counterparty, reference',
        )
        .ilike('source_object_type', '%TRADE%')
        .eq('source_object_id', dealId)
        .order('value_date', { ascending: true });
      if (evErr) throw evErr;

      const eventList = events ?? [];
      if (eventList.length === 0) return [];

      const eventIds = eventList.map((e) => e.id);
      const { data: links, error: lErr } = await supabase
        .from('cashflow_event_link')
        .select('event_id, link_group_id')
        .in('event_id', eventIds);
      if (lErr) throw lErr;

      const groupByEvent = new Map<string, string>();
      (links ?? []).forEach((l) => {
        if (l.event_id && l.link_group_id) groupByEvent.set(l.event_id, l.link_group_id);
      });

      const groupIds = Array.from(new Set(Array.from(groupByEvent.values())));
      const bucketByGroup = new Map<string, string | null>();
      if (groupIds.length > 0) {
        const { data: groups, error: gErr } = await supabase
          .from('consolidated_cashflow')
          .select('id, bucket')
          .in('id', groupIds);
        if (gErr) throw gErr;
        (groups ?? []).forEach((g) => bucketByGroup.set(g.id, (g.bucket as string | null) ?? null));
      }

      return eventList.map<TradeCashflowRow>((e) => {
        const group = groupByEvent.get(e.id) ?? null;
        return {
          consolidatedCashflowId: group,
          eventId: e.id,
          sourceSystem: e.source_system,
          valueDate: e.value_date,
          amountBase: e.amount_base !== null ? Number(e.amount_base) : null,
          amountOriginal: e.amount_original !== null ? Number(e.amount_original) : null,
          currencyOriginal: e.currency_original,
          direction: e.direction,
          status: e.status,
          bucket: group ? bucketByGroup.get(group) ?? null : null,
          counterparty: e.counterparty,
          reference: e.reference,
        };
      });
    },
    enabled: !!dealId,
  });

  useDrillErrorToast(query.error, 'Failed to load cashflows for trade');

  return createDrillState({
    data: query.data || [],
    error: query.error as Error | null,
    isEmpty: (query.data || []).length === 0,
    isLoading: query.isLoading,
  });
}
