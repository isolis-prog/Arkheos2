import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { LineageEvidence } from '@/components/drill';
import { createDrillState, useDrillErrorToast } from './drill/shared';

export type BreakDocumentTradeRow = {
  dealId: string;
  tradeDate: string | null;
  product: string | null;
  volume: number | null;
  price: number | null;
  feeType: string | null;
  feeAmount: number | null;
  sideAAmount: number | null;
  sideBAmount: number | null;
  delta: number | null;
  breakFlag: boolean;
  lineage: LineageEvidence | null;
};

type DocumentTradeLinkRow = Database['public']['Tables']['document_trade_links']['Row'];
type CanonicalTradeRow = Database['public']['Tables']['canonical_trades']['Row'];
type CanonicalRecordRow = Database['public']['Tables']['canonical_records']['Row'];
type CanonicalProductRow = Database['public']['Tables']['canonical_products']['Row'];
type BreakDetailRow = Database['public']['Tables']['break_details']['Row'];

export function useBreakDocumentTrades(runId: string, docId: string) {
  const query = useQuery({
    queryKey: ['recon', 'break-document-trades', runId, docId],
    enabled: Boolean(runId && docId),
    staleTime: 60_000,
    queryFn: async (): Promise<BreakDocumentTradeRow[]> => {
      const { data: links, error: linksError } = await supabase
        .from('document_trade_links')
        .select('*')
        .eq('doc_id', docId)
        .order('created_at', { ascending: true });

      if (linksError) {
        throw linksError;
      }

      const dealIds = Array.from(new Set((links ?? []).map((link: DocumentTradeLinkRow) => link.deal_id)));

      const [tradesByRefResult, tradesByIdResult, detailResult, recordResult] = await Promise.all([
        dealIds.length > 0
          ? supabase.from('canonical_trades').select('*').in('trade_ref', dealIds)
          : Promise.resolve({ data: [] as CanonicalTradeRow[], error: null }),
        dealIds.length > 0
          ? supabase.from('canonical_trades').select('*').in('id', dealIds)
          : Promise.resolve({ data: [] as CanonicalTradeRow[], error: null }),
        supabase.from('break_details').select('*').eq('run_id', runId).eq('doc_id', docId),
        dealIds.length > 0
          ? supabase.from('canonical_records').select('*').eq('doc_id', docId).in('deal_id', dealIds)
          : Promise.resolve({ data: [] as CanonicalRecordRow[], error: null }),
      ]);

      if (tradesByRefResult.error) throw tradesByRefResult.error;
      if (tradesByIdResult.error) throw tradesByIdResult.error;
      if (detailResult.error) throw detailResult.error;
      if (recordResult.error) throw recordResult.error;

      const allTrades = [...(tradesByRefResult.data ?? []), ...(tradesByIdResult.data ?? [])];
      const uniqueTrades = new Map<string, CanonicalTradeRow>();
      allTrades.forEach((trade) => {
        uniqueTrades.set(trade.trade_ref, trade);
        uniqueTrades.set(trade.id, trade);
      });

      const productIds = Array.from(new Set((allTrades ?? []).map((trade) => trade.product_id).filter((value): value is string => Boolean(value))));
      const { data: products, error: productsError } = productIds.length > 0
        ? await supabase.from('canonical_products').select('*').in('id', productIds)
        : { data: [] as CanonicalProductRow[], error: null };

      if (productsError) {
        throw productsError;
      }

      const productById = new Map((products ?? []).map((product) => [product.id, product]));
      const recordByDeal = (recordResult.data ?? []).reduce<Map<string, CanonicalRecordRow>>((accumulator, row) => {
        if (row.deal_id && !accumulator.has(row.deal_id)) {
          accumulator.set(row.deal_id, row);
        }
        return accumulator;
      }, new Map());
      const detailByDoc = (detailResult.data ?? []).reduce<Map<string, BreakDetailRow>>((accumulator, row) => {
        if (row.doc_id && !accumulator.has(row.doc_id)) {
          accumulator.set(row.doc_id, row);
        }
        return accumulator;
      }, new Map());

      return (links ?? []).map((link) => {
        const trade = uniqueTrades.get(link.deal_id) ?? null;
        const product = trade?.product_id ? productById.get(trade.product_id) : null;
        const record = recordByDeal.get(link.deal_id) ?? null;
        const detail = detailByDoc.get(link.doc_id) ?? null;
        const delta = detail?.amount_delta ?? (detail?.side_a_amount ?? 0) - (detail?.side_b_amount ?? 0);

        const linkAny = link as unknown as Record<string, unknown>;
        const detailAny = (detail ?? {}) as unknown as Record<string, unknown>;

        const lineage: LineageEvidence = {
          resolutionMethod: (linkAny.resolution_method as string | null) ?? linkAny.link_source as string | null ?? null,
          resolvedByRunId: (linkAny.resolved_by_run_id as string | null) ?? null,
          resolvedAt: (linkAny.resolved_at as string | null) ?? (link.created_at as string | null) ?? null,
          resolvedBy: (linkAny.resolved_by as string | null) ?? null,
          matchFeatures: (linkAny.match_features as Record<string, unknown> | null) ?? null,
          ailRequestId: (linkAny.ail_request_id as string | null) ?? null,
          ailModelVersion: (linkAny.ail_model_version as string | null) ?? null,
          evidenceRefs: (linkAny.evidence_refs as Array<Record<string, unknown>> | null) ?? null,
          enrichmentRunId: (detailAny.enrichment_run_id as string | null) ?? null,
          enrichedAt: (detailAny.enriched_at as string | null) ?? null,
          enrichedBy: (detailAny.enriched_by as string | null) ?? null,
          ruleId: (detailAny.rule_id as string | null) ?? null,
          ruleVersion: (detailAny.rule_version as string | null) ?? null,
        };

        return {
          dealId: link.deal_id,
          tradeDate: trade?.trade_date ?? null,
          product: product?.name ?? null,
          volume: trade?.quantity ?? null,
          price: trade?.price ?? null,
          feeType: record?.fee_type ?? null,
          feeAmount: record?.amount ?? null,
          sideAAmount: detail?.side_a_amount ?? null,
          sideBAmount: detail?.side_b_amount ?? null,
          delta,
          breakFlag: Math.abs(delta ?? 0) > 0,
          lineage,
        } satisfies BreakDocumentTradeRow;
      });
    },
  });

  useDrillErrorToast(query.error, 'Failed to load linked trades');

  const data = useMemo(() => query.data ?? [], [query.data]);

  return createDrillState({
    data,
    error: query.error,
    isLoading: query.isLoading,
    isEmpty: !query.isLoading && data.length === 0,
  });
}
