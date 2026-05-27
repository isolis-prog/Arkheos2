import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

export interface TradeReconciliationEvent {
  id: string;
  runId: string;
  runStartedAt: string | null;
  templateName: string | null;
  templateId: string | null;
  type: 'break' | 'matched';
  breakCategory: string | null;
  amountDelta: number | null;
  amountDeltaPct: number | null;
  currency: string | null;
  status: string | null;
  exceptionCaseId: string | null;
  docId: string | null;
  docType: string | null;
  l6Href: string | null;
}

export interface TradeReconciliationSummary {
  totalBreaksCount: number;
  currentlyOpenBreaks: number;
  totalExposureUsd: number;
  oldestOpenBreakAgeDays: number | null;
}

export interface TradeReconciliationHistory {
  events: TradeReconciliationEvent[];
  summary: TradeReconciliationSummary;
  hasHistory: boolean;
}

const OPEN_STATUSES = new Set(['open', 'in_progress', 'pending_approval', 'needs_review']);

export function useTradeReconciliationHistory(dealId: string | undefined) {
  const query = useQuery({
    queryKey: ['trade-reconciliation-history', dealId],
    enabled: Boolean(dealId),
    queryFn: async (): Promise<TradeReconciliationHistory> => {
      if (!dealId) {
        return {
          events: [],
          summary: {
            totalBreaksCount: 0,
            currentlyOpenBreaks: 0,
            totalExposureUsd: 0,
            oldestOpenBreakAgeDays: null,
          },
          hasHistory: false,
        };
      }

      // 1. Find every document_trade_link involving this deal
      const { data: links, error: linksError } = await supabase
        .from('document_trade_links')
        .select('doc_id, doc_type, link_source')
        .eq('tenant_id', DEMO_TENANT_ID)
        .eq('deal_id', dealId);

      if (linksError) throw linksError;

      const docIds = Array.from(new Set((links ?? []).map((l) => l.doc_id))).filter(Boolean) as string[];

      // 2. Find break_details where the deal appears via doc_id
      const { data: breaks, error: breaksError } = docIds.length > 0
        ? await supabase
            .from('break_details')
            .select(
              'break_detail_id, run_id, exception_case_id, doc_id, doc_type, break_category, amount_delta, amount_delta_pct, currency, side_a_amount, created_at',
            )
            .eq('tenant_id', DEMO_TENANT_ID)
            .in('doc_id', docIds)
        : { data: [], error: null };

      if (breaksError) throw breaksError;

      const runIds = Array.from(
        new Set([
          ...(breaks ?? []).map((b) => b.run_id),
        ]),
      );

      // 3. Fetch related runs (for date/template) + matched canonical_records (non-break appearances)
      const [runsResult, matchedResult, exceptionsResult] = await Promise.all([
        runIds.length > 0
          ? supabase
              .from('reconciliation_runs')
              .select('id, started_at, template_id, reconciliation_templates(name)')
              .in('id', runIds)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from('canonical_records')
          .select('id, deal_id, doc_id, created_at')
          .eq('tenant_id', DEMO_TENANT_ID)
          .eq('deal_id', dealId)
          .limit(50),
        (breaks ?? []).length > 0
          ? supabase
              .from('exception_cases')
              .select('id, status')
              .in(
                'id',
                (breaks ?? []).map((b) => b.exception_case_id),
              )
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (runsResult.error) throw runsResult.error;
      if (matchedResult.error) throw matchedResult.error;
      if (exceptionsResult.error) throw exceptionsResult.error;

      const runMap = new Map(
        (runsResult.data ?? []).map((r: { id: string; started_at: string | null; template_id: string | null; reconciliation_templates: { name: string } | { name: string }[] | null }) => {
          const tpl = r.reconciliation_templates;
          const templateName = Array.isArray(tpl) ? tpl[0]?.name ?? null : tpl?.name ?? null;
          return [r.id, { startedAt: r.started_at, templateId: r.template_id, templateName }];
        }),
      );

      const statusMap = new Map(
        (exceptionsResult.data ?? []).map((c: { id: string; status: string | null }) => [c.id, c.status]),
      );

      const breakEvents: TradeReconciliationEvent[] = (breaks ?? []).map((b) => {
        const run = runMap.get(b.run_id);
        const status = statusMap.get(b.exception_case_id) ?? null;
        return {
          id: `break-${b.break_detail_id}`,
          runId: b.run_id,
          runStartedAt: run?.startedAt ?? null,
          templateName: run?.templateName ?? null,
          templateId: run?.templateId ?? null,
          type: 'break',
          breakCategory: b.break_category,
          amountDelta: b.amount_delta !== null ? Number(b.amount_delta) : null,
          amountDeltaPct: b.amount_delta_pct !== null ? Number(b.amount_delta_pct) : null,
          currency: b.currency,
          status,
          exceptionCaseId: b.exception_case_id,
          docId: b.doc_id,
          docType: b.doc_type,
          l6Href: b.doc_id
            ? `/reconciliations/${b.run_id}/breaks/documents/${encodeURIComponent(b.doc_id)}/trades`
            : null,
        };
      });

      // Matched events: canonical_records for this deal that don't appear in any break
      const breakDocIds = new Set((breaks ?? []).map((b) => b.doc_id).filter(Boolean) as string[]);
      const matchedEvents: TradeReconciliationEvent[] = (matchedResult.data ?? [])
        .filter((r: { doc_id: string | null }) => !r.doc_id || !breakDocIds.has(r.doc_id))
        .slice(0, 20)
        .map((r: { id: string; doc_id: string | null; created_at: string | null }) => ({
          id: `matched-${r.id}`,
          runId: '',
          runStartedAt: r.created_at,
          templateName: null,
          templateId: null,
          type: 'matched',
          breakCategory: null,
          amountDelta: null,
          amountDeltaPct: null,
          currency: null,
          status: 'matched',
          exceptionCaseId: null,
          docId: r.doc_id,
          docType: null,
          l6Href: null,
        }));

      const events = [...breakEvents, ...matchedEvents].sort((a, b) => {
        const da = a.runStartedAt ? new Date(a.runStartedAt).getTime() : 0;
        const db = b.runStartedAt ? new Date(b.runStartedAt).getTime() : 0;
        return db - da;
      });

      const openBreaks = breakEvents.filter((e) => e.status && OPEN_STATUSES.has(e.status));
      const totalExposureUsd = breakEvents.reduce(
        (acc, e) => acc + Math.abs(e.amountDelta ?? 0),
        0,
      );
      const now = Date.now();
      const oldestOpenBreakAgeDays = openBreaks.reduce<number | null>((acc, e) => {
        if (!e.runStartedAt) return acc;
        const ageDays = Math.floor((now - new Date(e.runStartedAt).getTime()) / 86_400_000);
        return acc === null || ageDays > acc ? ageDays : acc;
      }, null);

      return {
        events,
        summary: {
          totalBreaksCount: breakEvents.length,
          currentlyOpenBreaks: openBreaks.length,
          totalExposureUsd,
          oldestOpenBreakAgeDays,
        },
        hasHistory: breakEvents.length > 0 || matchedEvents.length > 0,
      };
    },
  });

  return useMemo(
    () => ({
      ...query,
      data: query.data ?? {
        events: [],
        summary: {
          totalBreaksCount: 0,
          currentlyOpenBreaks: 0,
          totalExposureUsd: 0,
          oldestOpenBreakAgeDays: null,
        },
        hasHistory: false,
      },
    }),
    [query],
  );
}
