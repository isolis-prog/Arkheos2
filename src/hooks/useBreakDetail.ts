import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { BreakComment, BreakDetailView, BreakHistoryEvent } from '@/components/drill';
import { buildBreakHistory } from '@/lib/drill/breakHistory';
import { createDrillState, useDrillErrorToast } from './drill/shared';

type BreakDetailRow = Database['public']['Tables']['break_details']['Row'];
type ExceptionCaseRow = Database['public']['Tables']['exception_cases']['Row'];
type CanonicalRecordRow = Database['public']['Tables']['canonical_records']['Row'];
type ExceptionCommentRow = Database['public']['Tables']['exception_comments']['Row'];
type DocumentTradeLinkRow = Database['public']['Tables']['document_trade_links']['Row'];
type CanonicalTradeRow = Database['public']['Tables']['canonical_trades']['Row'];

function toFields(record: CanonicalRecordRow | null) {
  if (!record) {
    return {};
  }

  return {
    source: record.source_system,
    recordType: record.record_type,
    legalEntity: record.legal_entity,
    counterparty: record.counterparty,
    docId: record.doc_id,
    dealId: record.deal_id,
    feeType: record.fee_type,
    memo: record.memo,
  } satisfies Record<string, string | number | null | undefined>;
}

export function useBreakDetail(exceptionCaseId: string) {
  const query = useQuery({
    queryKey: ['recon', 'break-detail', exceptionCaseId],
    enabled: Boolean(exceptionCaseId),
    queryFn: async (): Promise<BreakDetailView | null> => {
      const { data: breakDetail, error: breakError } = await supabase
        .from('break_details')
        .select('*')
        .eq('exception_case_id', exceptionCaseId)
        .single();

      if (breakError) {
        throw breakError;
      }

      const { data: exceptionCase, error: caseError } = await supabase
        .from('exception_cases')
        .select('*')
        .eq('id', exceptionCaseId)
        .single();

      if (caseError) {
        throw caseError;
      }

      const docId = breakDetail.doc_id;
      const dealIds: string[] = [];

      const [recordsResult, commentsResult, linksResult] = await Promise.all([
        docId
          ? supabase
              .from('canonical_records')
              .select('*')
              .eq('doc_id', docId)
              .order('created_at', { ascending: true })
          : Promise.resolve({ data: [] as CanonicalRecordRow[], error: null }),
        supabase
          .from('exception_comments')
          .select('id, comment, created_at, user_id')
          .eq('exception_id', exceptionCaseId)
          .order('created_at', { ascending: true }),
        docId
          ? supabase.from('document_trade_links').select('*').eq('doc_id', docId)
          : Promise.resolve({ data: [] as DocumentTradeLinkRow[], error: null }),
      ]);

      if (recordsResult.error) {
        throw recordsResult.error;
      }

      if (commentsResult.error) {
        throw commentsResult.error;
      }

      if (linksResult.error) {
        throw linksResult.error;
      }

      (linksResult.data ?? []).forEach((link) => {
        if (!dealIds.includes(link.deal_id)) {
          dealIds.push(link.deal_id);
        }
      });

      const [profilesResult, tradesResult] = await Promise.all([
        commentsResult.data && commentsResult.data.length > 0
          ? supabase.from('profiles').select('id, full_name, email').in('id', commentsResult.data.map((comment) => comment.user_id))
          : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; email: string }>, error: null }),
        dealIds.length > 0
          ? supabase.from('canonical_trades').select('*').in('trade_ref', dealIds)
          : Promise.resolve({ data: [] as CanonicalTradeRow[], error: null }),
      ]);

      if (profilesResult.error) {
        throw profilesResult.error;
      }

      if (tradesResult.error) {
        throw tradesResult.error;
      }

      const records = recordsResult.data ?? [];
      const sideARecord = records[0] ?? null;
      const sideBRecord = records[1] ?? records[0] ?? null;
      const profileById = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
      const tradesById = new Map((tradesResult.data ?? []).map((trade) => [trade.trade_ref, trade]));

      const comments: BreakComment[] = (commentsResult.data ?? []).map((comment: ExceptionCommentRow) => {
        const profile = profileById.get(comment.user_id);

        return {
          id: comment.id,
          comment: comment.comment,
          createdAt: comment.created_at ?? new Date().toISOString(),
          user: {
            id: comment.user_id,
            name: profile?.full_name ?? profile?.email ?? 'Unknown user',
            email: profile?.email ?? null,
          },
        };
      });

      const history: BreakHistoryEvent[] = buildBreakHistory([
        {
          id: `status-${exceptionCase.id}`,
          type: 'status_change',
          label: `Status: ${exceptionCase.status.replace(/_/g, ' ')}`,
          description: exceptionCase.summary ?? exceptionCase.description ?? undefined,
          createdAt: exceptionCase.updated_at,
          actor: exceptionCase.owner_user ?? undefined,
        },
        ...comments.map<BreakHistoryEvent>((comment) => ({
          id: `comment-${comment.id}`,
          type: 'comment',
          label: 'Comment added',
          description: comment.comment,
          createdAt: comment.createdAt,
          actor: comment.user.name,
        })),
        ...(linksResult.data ?? []).map<BreakHistoryEvent>((link) => {
          const trade = tradesById.get(link.deal_id);
          return {
            id: `trade-${link.link_id}`,
            type: 'status_change',
            label: `Linked trade ${trade?.trade_ref ?? link.deal_id}`,
            description: trade?.status ?? link.link_source ?? undefined,
            createdAt: link.created_at,
            actor: 'Document linkage',
          };
        }),
      ]);

      return {
        id: breakDetail.break_detail_id,
        breakId: exceptionCase.case_ref ?? breakDetail.break_detail_id,
        exceptionId: exceptionCase.id,
        exceptionCaseId: exceptionCase.id,
        status: exceptionCase.status,
        title: exceptionCase.summary ?? exceptionCase.description ?? breakDetail.suggested_root_cause ?? 'Break detail',
        currency: breakDetail.currency,
        sideA: {
          id: sideARecord?.id ?? 'side-a',
          label: sideARecord?.source_system ?? 'Side A',
          amount: sideARecord?.amount ?? breakDetail.side_a_amount,
          currency: sideARecord?.currency ?? breakDetail.currency,
          date: sideARecord?.date_primary ?? sideARecord?.economic_date ?? breakDetail.side_a_date,
          reference: sideARecord?.line_id ?? sideARecord?.doc_id ?? null,
          fields: toFields(sideARecord),
        },
        sideB: {
          id: sideBRecord?.id ?? 'side-b',
          label: sideBRecord?.source_system ?? 'Side B',
          amount: sideBRecord?.amount ?? breakDetail.side_b_amount,
          currency: sideBRecord?.currency ?? breakDetail.currency,
          date: sideBRecord?.date_primary ?? sideBRecord?.economic_date ?? breakDetail.side_b_date,
          reference: sideBRecord?.line_id ?? sideBRecord?.doc_id ?? null,
          fields: toFields(sideBRecord),
        },
        sideAAmount: breakDetail.side_a_amount,
        sideBAmount: breakDetail.side_b_amount,
        amountDelta: breakDetail.amount_delta,
        amountDeltaPct: breakDetail.amount_delta_pct,
        sideADate: breakDetail.side_a_date,
        sideBDate: breakDetail.side_b_date,
        dateDeltaDays: breakDetail.date_delta_days,
        suggestedRootCause: breakDetail.suggested_root_cause,
        aiConfidence: breakDetail.ai_confidence,
        comments,
        history,
        lineage: {
          sourceRecordIds: (breakDetail as Record<string, unknown>).source_record_ids as string[] | null ?? null,
          sideASourceRef: (breakDetail as Record<string, unknown>).side_a_source_ref as string | null ?? null,
          sideBSourceRef: (breakDetail as Record<string, unknown>).side_b_source_ref as string | null ?? null,
          ruleId: (breakDetail as Record<string, unknown>).rule_id as string | null ?? null,
          ruleVersion: (breakDetail as Record<string, unknown>).rule_version as string | null ?? null,
          derivationInputs: (breakDetail as Record<string, unknown>).derivation_inputs as Record<string, unknown> | null ?? null,
          enrichmentRunId: (breakDetail as Record<string, unknown>).enrichment_run_id as string | null ?? null,
          enrichedAt: (breakDetail as Record<string, unknown>).enriched_at as string | null ?? null,
          enrichedBy: (breakDetail as Record<string, unknown>).enriched_by as string | null ?? null,
          ailRequestId: (breakDetail as Record<string, unknown>).ail_request_id as string | null ?? null,
          ailModelVersion: (breakDetail as Record<string, unknown>).ail_model_version as string | null ?? null,
          evidenceRefs: (breakDetail as Record<string, unknown>).evidence_refs as Array<Record<string, unknown>> | null ?? null,
        },
      } satisfies BreakDetailView;
    },
  });

  useDrillErrorToast(query.error, 'Failed to load break detail');

  const data = useMemo(() => query.data ?? null, [query.data]);

  return createDrillState({
    data,
    error: query.error,
    isLoading: query.isLoading,
    isEmpty: !query.isLoading && !data,
  });
}
