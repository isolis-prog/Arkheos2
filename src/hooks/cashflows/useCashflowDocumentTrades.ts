import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createDrillState, useDrillErrorToast, type DrillQueryState } from '@/hooks/drill/shared';

export interface CashflowDocumentTradeRow {
  id: string;
  dealId: string;
  tradeDate: string | null;
  product: string | null;
  volume: number | null;
  price: number | null;
  cashflowContribution: number | null;
  matchStatus: string | null;
}

export function useCashflowDocumentTrades(
  consolidatedCashflowId: string | null | undefined,
): DrillQueryState<CashflowDocumentTradeRow[]> {
  const query = useQuery({
    queryKey: ['cashflow', 'document-trades', consolidatedCashflowId],
    queryFn: async () => {
      if (!consolidatedCashflowId) return [];

      const { data: linkRows, error: lErr } = await supabase
        .from('cashflow_event_link')
        .select('event_id')
        .eq('link_group_id', consolidatedCashflowId);
      if (lErr) throw lErr;

      const eventIds = (linkRows || []).map((l) => l.event_id).filter((id): id is string => Boolean(id));
      if (eventIds.length === 0) return [];

      const { data: events, error: eErr } = await supabase
        .from('cashflow_event')
        .select('id, source_object_type, source_object_id, amount_base, amount_original, status')
        .in('id', eventIds);
      if (eErr) throw eErr;

      const tradeEvents = (events || []).filter((e) =>
        String(e.source_object_type).toUpperCase().includes('TRADE'),
      );

      const dealIds = Array.from(
        new Set(tradeEvents.map((e) => e.source_object_id).filter((id): id is string => Boolean(id))),
      );
      if (dealIds.length === 0) return [];

      // canonical_records is keyed by deal_id; pull one representative row per deal
      const { data: records, error: rErr } = await supabase
        .from('canonical_records')
        .select('deal_id, economic_date, fee_type, amount, currency')
        .in('deal_id', dealIds);
      if (rErr) throw rErr;

      const recByDeal = new Map<string, { economic_date: string | null; fee_type: string | null }>();
      (records || []).forEach((r) => {
        if (!recByDeal.has(r.deal_id)) {
          recByDeal.set(r.deal_id, { economic_date: r.economic_date, fee_type: r.fee_type });
        }
      });

      const contributionByDeal = new Map<string, number>();
      tradeEvents.forEach((e) => {
        const amt = Number(e.amount_base ?? e.amount_original ?? 0);
        contributionByDeal.set(
          e.source_object_id,
          (contributionByDeal.get(e.source_object_id) || 0) + amt,
        );
      });

      return dealIds.map<CashflowDocumentTradeRow>((dealId) => {
        const rec = recByDeal.get(dealId);
        return {
          id: dealId,
          dealId,
          tradeDate: rec?.economic_date ?? null,
          product: rec?.fee_type ?? null,
          volume: null,
          price: null,
          cashflowContribution: contributionByDeal.get(dealId) ?? null,
          matchStatus: rec ? 'matched' : 'unmatched',
        };
      });
    },
    enabled: !!consolidatedCashflowId,
  });

  useDrillErrorToast(query.error, 'Failed to load linked trades');

  return createDrillState({
    data: query.data || [],
    error: query.error as Error | null,
    isEmpty: (query.data || []).length === 0,
    isLoading: query.isLoading,
  });
}
