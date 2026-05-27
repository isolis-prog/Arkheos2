import { useCallback, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { createDrillState, useDrillErrorToast } from './drill/shared';

export interface BreakDocumentsFilters {
  legalEntityId?: string;
  counterpartyId?: string;
  breakCategory?: string;
}

/** Columns the L5 grid is allowed to sort on server-side. */
export type BreakDocumentsSortColumn = 'amount_delta' | 'doc_id';
export type BreakDocumentsSortDirection = 'asc' | 'desc';

export interface BreakDocumentsSort {
  column: BreakDocumentsSortColumn;
  direction: BreakDocumentsSortDirection;
}

export const DEFAULT_BREAK_DOCUMENTS_SORT: BreakDocumentsSort = {
  column: 'amount_delta',
  direction: 'desc',
};

/**
 * Opaque cursor that anchors the next page to the last row of the current
 * page. The cursor always carries `docId` (the unique tiebreaker that
 * guarantees a strict total ordering) plus the value of the active sort
 * column, so we never skip or duplicate rows across pages even when the
 * underlying result set changes between requests.
 */
export interface BreakDocumentsCursor {
  amountDelta: number | null;
  docId: string;
}

export interface BreakDocumentsPagination {
  /** Page size (defaults to 50). */
  pageSize?: number;
  /**
   * Cursor pointing to the LAST row of the previous page. `null`/undefined
   * loads the first page. Pass back what `nextCursor` returned to advance.
   */
  cursor?: BreakDocumentsCursor | null;
}

export type BreakDocumentsRow = {
  exceptionCaseId?: string | null;
  docId: string;
  docType: string | null;
  issueDate: string | null;
  dueDate: string | null;
  sideAAmount: number | null;
  sideBAmount: number | null;
  amountDelta: number | null;
  amountDeltaPct: number | null;
  currency: string | null;
  breakCategory: string | null;
  status: string | null;
  tradeCount: number;
  suggestedRootCause: string | null;
  aiConfidence: number | null;
};

export interface BreakDocumentsResult {
  rows: BreakDocumentsRow[];
  /** Cursor to fetch the next page; `null` means we're at the last page. */
  nextCursor: BreakDocumentsCursor | null;
  hasMore: boolean;
  /**
   * Best-effort total. Cursor pagination doesn't need this to navigate, but
   * it's still useful for "showing X of Y" badges. Returned as `null` once we
   * stop counting (i.e. on subsequent pages) to avoid extra `count=exact` cost.
   */
  totalCount: number | null;
}

type DocumentViewRow = Database['public']['Views']['mv_recon_run_by_document']['Row'];
type BreakDetailRow = Database['public']['Tables']['break_details']['Row'];
type CanonicalInvoiceRow = Database['public']['Tables']['canonical_invoices']['Row'];

function serializeCursor(cursor: BreakDocumentsCursor | null | undefined): string {
  if (!cursor) return '';
  return `${cursor.amountDelta ?? 'null'}|${cursor.docId}`;
}

export function useBreakDocuments(
  runId: string,
  filters: BreakDocumentsFilters,
  pagination: BreakDocumentsPagination = {},
  sort: BreakDocumentsSort = DEFAULT_BREAK_DOCUMENTS_SORT,
) {
  const legalEntityId = filters.legalEntityId ?? null;
  const counterpartyId = filters.counterpartyId ?? null;
  const breakCategory = filters.breakCategory ?? null;
  const pageSize = pagination.pageSize ?? 50;
  const cursor = pagination.cursor ?? null;
  const isFirstPage = cursor === null;
  const sortColumn: BreakDocumentsSortColumn = sort.column;
  const sortDirection: BreakDocumentsSortDirection = sort.direction;
  const ascending = sortDirection === 'asc';

  const query = useQuery({
    queryKey: [
      'recon',
      'break-documents',
      runId,
      legalEntityId,
      counterpartyId,
      breakCategory,
      pageSize,
      sortColumn,
      sortDirection,
      serializeCursor(cursor),
    ],
    enabled: Boolean(runId),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<BreakDocumentsResult> => {
      // Fetch one extra row to detect whether a next page exists without a
      // second round-trip.
      const limit = pageSize + 1;

      // Narrow projection: only the columns the UI/grid actually consumes.
      // Avoids shipping wide MV rows (and any future columns) over the wire.
      const DOCUMENT_COLUMNS = [
        'run_id',
        'doc_id',
        'doc_type',
        'legal_entity_id',
        'external_counterparty_id',
        'side_a_amount',
        'side_b_amount',
        'amount_delta',
        'amount_delta_pct',
        'currency',
        'break_category',
        'status',
        'trade_count',
      ].join(',');

      let statement = supabase
        .from('mv_recon_run_by_document')
        // Only ask for `count=exact` on the first page — counting is the
        // expensive part of pagination and the UI only needs it once.
        .select(DOCUMENT_COLUMNS, isFirstPage ? { count: 'exact' } : { count: undefined })
        .eq('run_id', runId);

      // Apply primary sort + tiebreaker. `doc_id ASC` is always the
      // tiebreaker because it is the unique row key — without it, rows that
      // share the primary value could shuffle between requests and cause
      // skips/duplicates at page boundaries.
      if (sortColumn === 'amount_delta') {
        statement = statement
          .order('amount_delta', { ascending, nullsFirst: false })
          .order('doc_id', { ascending: true });
      } else {
        statement = statement.order('doc_id', { ascending });
      }
      statement = statement.limit(limit);

      if (filters.legalEntityId) {
        statement = statement.eq('legal_entity_id', filters.legalEntityId);
      }

      if (filters.counterpartyId) {
        statement = statement.eq('external_counterparty_id', filters.counterpartyId);
      }

      if (filters.breakCategory) {
        statement = statement.eq('break_category', filters.breakCategory);
      }

      // Keyset predicate — built per active sort column.
      if (cursor) {
        if (sortColumn === 'doc_id') {
          // Single-key sort on the unique row id; trivial keyset.
          statement = ascending
            ? statement.gt('doc_id', cursor.docId)
            : statement.lt('doc_id', cursor.docId);
        } else {
          // amount_delta sort: NULLs are kept last in both directions.
          // For DESC: rows after cursor satisfy
          //   amount_delta < cursor.amountDelta
          //   OR (amount_delta = cursor.amountDelta AND doc_id > cursor.docId)
          //   OR amount_delta IS NULL  -- NULLs last tail
          // For ASC: flip the comparator.
          if (cursor.amountDelta === null) {
            statement = statement.is('amount_delta', null).gt('doc_id', cursor.docId);
          } else {
            const cmp = ascending ? 'gt' : 'lt';
            const filter = [
              `amount_delta.${cmp}.${cursor.amountDelta}`,
              `and(amount_delta.eq.${cursor.amountDelta},doc_id.gt.${cursor.docId})`,
              `amount_delta.is.null`,
            ].join(',');
            statement = statement.or(filter);
          }
        }
      }

      const { data, error, count } = await statement;

      if (error) {
        throw error;
      }

      const allRows = (data ?? []) as unknown as DocumentViewRow[];
      const hasMore = allRows.length > pageSize;
      const documentRows = hasMore ? allRows.slice(0, pageSize) : allRows;
      const lastRow = documentRows[documentRows.length - 1];
      const nextCursor: BreakDocumentsCursor | null =
        hasMore && lastRow && lastRow.doc_id
          ? { amountDelta: lastRow.amount_delta, docId: lastRow.doc_id }
          : null;

      const docIds = documentRows
        .map((row) => row.doc_id)
        .filter((value): value is string => Boolean(value));

      // Only the columns we actually read out of break_details / canonical_invoices.
      const BREAK_DETAIL_COLUMNS =
        'doc_id,exception_case_id,suggested_root_cause,ai_confidence,created_at';
      const INVOICE_COLUMNS = 'invoice_ref,invoice_date,due_date';

      const [detailsResult, invoicesResult] = await Promise.all([
        docIds.length
          ? supabase
              .from('break_details')
              .select(BREAK_DETAIL_COLUMNS)
              .eq('run_id', runId)
              .in('doc_id', docIds)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] as Pick<BreakDetailRow, 'doc_id' | 'exception_case_id' | 'suggested_root_cause' | 'ai_confidence' | 'created_at'>[], error: null }),
        docIds.length
          ? supabase
              .from('canonical_invoices')
              .select(INVOICE_COLUMNS)
              .in('invoice_ref', docIds)
          : Promise.resolve({ data: [] as Pick<CanonicalInvoiceRow, 'invoice_ref' | 'invoice_date' | 'due_date'>[], error: null }),
      ]);

      if (detailsResult.error) {
        throw detailsResult.error;
      }

      if (invoicesResult.error) {
        throw invoicesResult.error;
      }

      type DetailSlim = Pick<
        BreakDetailRow,
        'doc_id' | 'exception_case_id' | 'suggested_root_cause' | 'ai_confidence' | 'created_at'
      >;
      type InvoiceSlim = Pick<CanonicalInvoiceRow, 'invoice_ref' | 'invoice_date' | 'due_date'>;

      const detailRows = (detailsResult.data ?? []) as unknown as DetailSlim[];
      const invoiceRows = (invoicesResult.data ?? []) as unknown as InvoiceSlim[];

      const detailByDoc = detailRows.reduce<Map<string, DetailSlim>>((accumulator, row) => {
        if (row.doc_id && !accumulator.has(row.doc_id)) {
          accumulator.set(row.doc_id, row);
        }
        return accumulator;
      }, new Map());

      const invoiceByRef = new Map(invoiceRows.map((invoice) => [invoice.invoice_ref, invoice]));

      return {
        rows: documentRows.map((row) => {
          const detail = row.doc_id ? detailByDoc.get(row.doc_id) : undefined;
          const invoice = row.doc_id ? invoiceByRef.get(row.doc_id) : undefined;

          return {
            exceptionCaseId: detail?.exception_case_id ?? null,
            docId: row.doc_id ?? 'unknown-document',
            docType: row.doc_type,
            issueDate: invoice?.invoice_date ?? null,
            dueDate: invoice?.due_date ?? null,
            sideAAmount: row.side_a_amount,
            sideBAmount: row.side_b_amount,
            amountDelta: row.amount_delta,
            amountDeltaPct: row.amount_delta_pct,
            currency: row.currency,
            breakCategory: row.break_category,
            status: row.status,
            tradeCount: row.trade_count ?? 0,
            suggestedRootCause: detail?.suggested_root_cause ?? null,
            aiConfidence: detail?.ai_confidence ?? null,
          } satisfies BreakDocumentsRow;
        }),
        nextCursor,
        hasMore,
        totalCount: isFirstPage ? count ?? 0 : null,
      };
    },
  });

  useDrillErrorToast(query.error, 'Failed to load break documents');

  const data = useMemo(
    () =>
      query.data ?? {
        rows: [],
        nextCursor: null,
        hasMore: false,
        totalCount: 0,
      },
    [query.data],
  );

  return createDrillState({
    data,
    error: query.error,
    isLoading: query.isLoading,
    isEmpty: !query.isLoading && data.rows.length === 0,
  });
}

/**
 * Tiny helper hook for callers that want a familiar Prev/Next stepper on top
 * of cursor pagination. It maintains the cursor stack so users can walk back
 * without losing their place.
 */
export function useBreakDocumentsPager() {
  const [stack, setStack] = useState<BreakDocumentsCursor[]>([]);

  // Cursor for the CURRENT page = top of stack. Empty stack => first page.
  const currentCursor: BreakDocumentsCursor | null =
    stack.length === 0 ? null : stack[stack.length - 1];

  const next = useCallback((cursor: BreakDocumentsCursor | null) => {
    if (!cursor) return;
    setStack((prev) => [...prev, cursor]);
  }, []);

  const prev = useCallback(() => {
    setStack((prev) => prev.slice(0, -1));
  }, []);

  const reset = useCallback(() => setStack([]), []);

  return {
    cursor: currentCursor,
    pageIndex: stack.length, // 0-based, for display only
    canGoBack: stack.length > 0,
    next,
    prev,
    reset,
  };
}
