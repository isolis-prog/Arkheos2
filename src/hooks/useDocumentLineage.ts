import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { LineageEvidence } from '@/components/drill';

type DocumentTradeLinkRow = Database['public']['Tables']['document_trade_links']['Row'];
type CanonicalTradeRow = Database['public']['Tables']['canonical_trades']['Row'];
type CanonicalRecordRow = Database['public']['Tables']['canonical_records']['Row'];

export interface LineageEventNode {
  id: string;
  tradeId: string;
  title: string;
  subtitle: string;
  amount: number | null;
  currency: string | null;
  record: CanonicalRecordRow;
}

export interface LineageTradeNode {
  id: string;
  dealId: string;
  title: string;
  subtitle: string;
  quantity: number | null;
  price: number | null;
  currency: string | null;
  link: DocumentTradeLinkRow;
  trade: CanonicalTradeRow | null;
  events: LineageEventNode[];
  lineage: LineageEvidence | null;
}

export interface DocumentLineageData {
  document: {
    id: string;
    title: string;
    subtitle: string;
    docType: string;
  };
  trades: LineageTradeNode[];
}

export function useDocumentLineage(docId: string) {
  const query = useQuery({
    queryKey: ['document-lineage', docId],
    enabled: Boolean(docId),
    queryFn: async () => {
      const { data: links, error: linksError } = await supabase
        .from('document_trade_links')
        .select('*')
        .eq('doc_id', docId)
        .order('created_at', { ascending: true });

      if (linksError) {
        throw linksError;
      }

      const linkRows = links ?? [];
      const dealIds = Array.from(new Set(linkRows.map((link) => link.deal_id)));

      const [tradesResult, recordsResult] = await Promise.all([
        dealIds.length
          ? supabase.from('canonical_trades').select('*').in('trade_ref', dealIds)
          : Promise.resolve({ data: [], error: null }),
        dealIds.length
          ? supabase.from('canonical_records').select('*').in('deal_id', dealIds).order('economic_date', { ascending: true })
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (tradesResult.error) {
        throw tradesResult.error;
      }

      if (recordsResult.error) {
        throw recordsResult.error;
      }

      return {
        links: linkRows,
        trades: tradesResult.data ?? [],
        records: recordsResult.data ?? [],
      };
    },
  });

  const data = useMemo<DocumentLineageData | null>(() => {
    if (!query.data) {
      return null;
    }

    const { links, trades, records } = query.data;
    const tradeMap = new Map(trades.map((trade) => [trade.trade_ref, trade]));
    const recordsByDeal = records.reduce<Map<string, CanonicalRecordRow[]>>((acc, record) => {
      if (!record.deal_id) {
        return acc;
      }
      const current = acc.get(record.deal_id) ?? [];
      current.push(record);
      acc.set(record.deal_id, current);
      return acc;
    }, new Map());

    const documentTitle = links[0]?.doc_id ?? docId;
    const documentType = links[0]?.doc_type ?? 'document';

    return {
      document: {
        id: docId,
        title: documentTitle,
        subtitle: `${documentType} · ${links.length} linked trade${links.length === 1 ? '' : 's'}`,
        docType: documentType,
      },
      trades: links.map((link) => {
        const trade = tradeMap.get(link.deal_id) ?? null;
        const tradeEvents = (recordsByDeal.get(link.deal_id) ?? []).map<LineageEventNode>((record) => ({
          id: record.id,
          tradeId: link.deal_id,
          title: record.record_type,
          subtitle: [record.source_system, record.economic_date ?? record.posting_date ?? 'Undated'].filter(Boolean).join(' · '),
          amount: record.amount,
          currency: record.currency,
          record,
        }));

        const linkAny = link as unknown as Record<string, unknown>;
        const lineage: LineageEvidence = {
          resolutionMethod: (linkAny.resolution_method as string | null) ?? (link.link_source as string | null) ?? null,
          resolvedByRunId: (linkAny.resolved_by_run_id as string | null) ?? null,
          resolvedAt: (linkAny.resolved_at as string | null) ?? link.created_at ?? null,
          resolvedBy: (linkAny.resolved_by as string | null) ?? null,
          matchFeatures: (linkAny.match_features as Record<string, unknown> | null) ?? null,
          ailRequestId: (linkAny.ail_request_id as string | null) ?? null,
          ailModelVersion: (linkAny.ail_model_version as string | null) ?? null,
          evidenceRefs: (linkAny.evidence_refs as Array<Record<string, unknown>> | null) ?? null,
        };

        return {
          id: link.link_id,
          dealId: link.deal_id,
          title: trade?.trade_ref ?? link.deal_id,
          subtitle: [trade?.status ?? 'Unclassified', trade?.trade_date ?? 'No trade date'].join(' · '),
          quantity: trade?.quantity ?? null,
          price: trade?.price ?? null,
          currency: trade?.currency ?? null,
          link,
          trade,
          events: tradeEvents,
          lineage,
        };
      }),
    };
  }, [docId, query.data]);

  return {
    ...query,
    data,
  };
}
