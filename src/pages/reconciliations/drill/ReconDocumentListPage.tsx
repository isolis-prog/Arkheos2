import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DrillDownTable,
  type DrillColumn,
  type DrillSortState,
} from '@/components/drill';
import {
  DrillPageShell,
  DrillPageEmptyState,
  DrillPageLoadingSkeleton,
} from './DrillPageShell';
import {
  useBreakDocuments,
  useBreakDocumentsPager,
  DEFAULT_BREAK_DOCUMENTS_SORT,
  type BreakDocumentsRow,
  type BreakDocumentsSort,
  type BreakDocumentsSortColumn,
} from '@/hooks/useBreakDocuments';
import {
  buildReconDrillUrl,
  buildReconPath,
  reconScopeToHeader,
  useReconDrillAudit,
  useReconDrillScope,
} from './_drillScope';

interface DocumentRow extends BreakDocumentsRow {
  id: string;
}

// Whitelist of UI column keys → server-side sort columns. Anything not in
// this map renders as sortable in the table but is ignored server-side
// (defensive default — keeps the cursor pagination contract intact).
const SORT_KEY_TO_DB_COLUMN: Record<string, BreakDocumentsSortColumn> = {
  amountDelta: 'amount_delta',
  docId: 'doc_id',
};

function uiSortToBreakSort(sort: DrillSortState | null): BreakDocumentsSort {
  if (!sort) return DEFAULT_BREAK_DOCUMENTS_SORT;
  const dbColumn = SORT_KEY_TO_DB_COLUMN[sort.key];
  if (!dbColumn) return DEFAULT_BREAK_DOCUMENTS_SORT;
  return { column: dbColumn, direction: sort.direction };
}

export default function ReconDocumentListPage() {
  const navigate = useNavigate();
  const { scope, setScope, removeKey } = useReconDrillScope();
  const pageSize = 50;
  const pager = useBreakDocumentsPager();
  const [sort, setSort] = useState<DrillSortState | null>({
    key: 'amountDelta',
    direction: 'desc',
  });
  const breakSort = useMemo(() => uiSortToBreakSort(sort), [sort]);

  // Reset the cursor stack whenever the scope/filters OR sort change. A
  // cursor only makes sense within the result set it was minted from, so
  // mixing it with a different sort would skip or duplicate rows.
  const scopeKey = `${scope.runId}|${scope.legalEntityId ?? ''}|${scope.counterpartyId ?? ''}|${scope.breakCategory ?? ''}|${breakSort.column}|${breakSort.direction}`;
  const lastScopeKey = useRef(scopeKey);
  useEffect(() => {
    if (lastScopeKey.current !== scopeKey) {
      lastScopeKey.current = scopeKey;
      pager.reset();
    }
  }, [scopeKey, pager]);

  const { data, isLoading, isEmpty } = useBreakDocuments(
    scope.runId,
    {
      legalEntityId: scope.legalEntityId,
      counterpartyId: scope.counterpartyId,
      breakCategory: scope.breakCategory,
    },
    { pageSize, cursor: pager.cursor },
    breakSort,
  );

  const rows = useMemo<DocumentRow[]>(
    () => data.rows.map((r) => ({ ...r, id: r.docId })),
    [data.rows],
  );

  useReconDrillAudit('view', 5, scope, data.totalCount ?? 0);

  const path = useMemo(() => buildReconPath(5, scope), [scope]);

  const columns: DrillColumn<DocumentRow>[] = [
    { key: 'docId', header: 'Document', accessor: (r) => r.docId, sortable: true },
    { key: 'docType', header: 'Type', accessor: (r) => r.docType ?? '—', width: 120 },
    {
      key: 'breakCategory',
      header: 'Break',
      accessor: (r) => r.breakCategory ?? '—',
      width: 140,
    },
    {
      key: 'sideAAmount',
      header: 'Side A',
      accessor: (r) => r.sideAAmount ?? 0,
      align: 'right',
      format: 'currency',
    },
    {
      key: 'sideBAmount',
      header: 'Side B',
      accessor: (r) => r.sideBAmount ?? 0,
      align: 'right',
      format: 'currency',
    },
    {
      key: 'amountDelta',
      header: 'Δ',
      accessor: (r) => r.amountDelta ?? 0,
      sortable: true,
      align: 'right',
      format: 'currency',
    },
    {
      key: 'amountDeltaPct',
      header: 'Δ %',
      accessor: (r) => r.amountDeltaPct ?? 0,
      align: 'right',
      format: 'percent',
      width: 100,
    },
    {
      key: 'tradeCount',
      header: 'Trades',
      accessor: (r) => r.tradeCount,
      align: 'right',
      format: 'number',
      width: 90,
    },
    {
      key: 'dueDate',
      header: 'Due',
      accessor: (r) => r.dueDate ?? '—',
      width: 120,
    },
  ];

  const handleRowClick = (row: DocumentRow) => {
    navigate(
      buildReconDrillUrl(`/reconciliations/${scope.runId}/drill/documents/${row.docId}`, {
        ...scope,
        docId: row.docId,
        docType: row.docType ?? undefined,
      }),
    );
  };

  return (
    <DrillPageShell
      title="Break documents"
      subtitle="Documents driving the breaks for the current scope. Open one to inspect linked trades and AI evidence."
      level={5}
      module="reconciliations"
      path={path}
      scope={reconScopeToHeader(scope)}
      onBreadcrumbNavigate={(node) => navigate(node.href)}
      onBackToParent={() =>
        navigate(
          buildReconDrillUrl(`/reconciliations/${scope.runId}/drill/by-counterparty`, {
            runId: scope.runId,
            breakCategory: scope.breakCategory,
            legalEntityId: scope.legalEntityId,
            legalEntityName: scope.legalEntityName,
          }),
        )
      }
      onRemoveScope={(key) => {
        removeKey(key as never);
        pager.reset();
      }}
      onResetScope={() => {
        setScope({ runId: scope.runId });
        pager.reset();
      }}
      exportScope={{
        ...(scope as unknown as Record<string, unknown>),
        sort: { column: breakSort.column, direction: breakSort.direction },
        page: { index: pager.pageIndex, size: pageSize },
      }}
      estimatedRowCount={data.totalCount ?? rows.length}
    >
      {isLoading && rows.length === 0 ? (
        <DrillPageLoadingSkeleton rows={10} />
      ) : isEmpty ? (
        <DrillPageEmptyState
          title="No break documents"
          description="No documents match this scope. Try removing a filter or moving back a level."
        />
      ) : (
        <div className="space-y-3">
          <DrillDownTable
            rows={rows}
            columns={columns}
            onRowClick={handleRowClick}
            pageSize={pageSize}
            serverPagination
            sort={sort}
            onSortChange={(next) => {
              setSort(next);
              pager.reset();
            }}
          />
          {(pager.canGoBack || data.hasMore) && (
            <div className="flex items-center justify-end gap-3 text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => pager.prev()}
                disabled={!pager.canGoBack}
                className="rounded-md border border-border bg-card px-3 py-1.5 transition-colors hover:bg-accent disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {pager.pageIndex + 1}
                {data.totalCount != null
                  ? ` · ${data.totalCount.toLocaleString()} total`
                  : ''}
              </span>
              <button
                type="button"
                onClick={() => pager.next(data.nextCursor)}
                disabled={!data.hasMore || !data.nextCursor}
                className="rounded-md border border-border bg-card px-3 py-1.5 transition-colors hover:bg-accent disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </DrillPageShell>
  );
}
