import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DrillDownTable, type DrillColumn } from '@/components/drill';
import {
  DrillPageShell,
  DrillPageEmptyState,
  DrillPageLoadingSkeleton,
} from './DrillPageShell';
import {
  useBreakDocumentTrades,
  type BreakDocumentTradeRow,
} from '@/hooks/useBreakDocumentTrades';
import { useBreakDetail } from '@/hooks/useBreakDetail';
import { useAddBreakComment, useCloseBreak } from '@/hooks/useDrillMutations';
import { useDocExceptionCaseId } from '@/hooks/drill/useDocExceptionCaseId';
import {
  buildReconDrillUrl,
  buildReconPath,
  reconScopeToHeader,
  useReconDrillAudit,
  useReconDrillScope,
} from './_drillScope';

interface TradeRow extends BreakDocumentTradeRow {
  id: string;
}

export default function ReconDocumentTradesPage() {
  const navigate = useNavigate();
  const { docId = '' } = useParams<{ docId: string }>();
  const { scope, setScope, removeKey } = useReconDrillScope();
  const effectiveScope = useMemo(() => ({ ...scope, docId }), [scope, docId]);

  const { data: trades, isLoading: tradesLoading, isEmpty: tradesEmpty } =
    useBreakDocumentTrades(scope.runId, docId);

  const rows = useMemo<TradeRow[]>(
    () => trades.map((t, idx) => ({ ...t, id: `${t.dealId}-${idx}` })),
    [trades],
  );

  // Dedicated hook resolves the canonical exception_case_id for this
  // (run_id, doc_id) so every action on this page (open panel, close break,
  // add comment, audit metadata) is bound to the same case.
  const { exceptionCaseId, isLoading: caseLoading } = useDocExceptionCaseId(
    scope.runId,
    docId,
  );

  const [openExceptionId, setOpenExceptionId] = useState<string | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<TradeRow | null>(null);
  const { data: breakDetail } = useBreakDetail(openExceptionId ?? '');

  // Open the doc's exception case for a trade row. We only have one
  // exception_case per (run_id, doc_id) on this view, so every break-flagged
  // trade resolves to the same case — but we keep the selected trade in
  // state so the resolve/comment audit captures *which* deal triggered it.
  const handleTradeClick = (row: TradeRow) => {
    if (!exceptionCaseId || !row.breakFlag) return;
    setSelectedTrade(row);
    setOpenExceptionId(exceptionCaseId);
  };

  useReconDrillAudit('view', 6, effectiveScope, rows.length);

  const path = useMemo(() => buildReconPath(6, effectiveScope), [effectiveScope]);

  const closeBreak = useCloseBreak();
  const addComment = useAddBreakComment();

  const columns: DrillColumn<TradeRow>[] = [
    { key: 'dealId', header: 'Deal', accessor: (r) => r.dealId, sortable: true, width: 160 },
    { key: 'tradeDate', header: 'Trade date', accessor: (r) => r.tradeDate ?? '—', width: 130 },
    { key: 'product', header: 'Product', accessor: (r) => r.product ?? '—' },
    {
      key: 'volume',
      header: 'Volume',
      accessor: (r) => r.volume ?? 0,
      align: 'right',
      format: 'number',
    },
    {
      key: 'price',
      header: 'Price',
      accessor: (r) => r.price ?? 0,
      align: 'right',
      format: 'number',
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
      key: 'delta',
      header: 'Δ',
      accessor: (r) => r.delta ?? 0,
      sortable: true,
      align: 'right',
      format: 'currency',
    },
    {
      key: 'breakFlag',
      header: 'Break',
      accessor: (r) => (r.breakFlag ? 'Yes' : 'No'),
      width: 90,
    },
  ];

  return (
    <DrillPageShell
      title={`Document ${docId}`}
      subtitle="Trades linked to this document. Open the break detail panel to inspect AI lineage and act on it."
      level={6}
      module="reconciliations"
      path={path}
      scope={reconScopeToHeader(effectiveScope)}
      onBreadcrumbNavigate={(node) => navigate(node.href)}
      onBackToParent={() =>
        navigate(
          buildReconDrillUrl(`/reconciliations/${scope.runId}/drill/documents`, {
            ...scope,
            docId: undefined,
          }),
        )
      }
      onRemoveScope={(key) => removeKey(key as never)}
      onResetScope={() => setScope({ runId: scope.runId })}
      exportScope={effectiveScope as unknown as Record<string, unknown>}
      estimatedRowCount={rows.length}
      actions={
        <Button
          variant="outline"
          disabled={caseLoading || !exceptionCaseId}
          onClick={() => {
            if (!exceptionCaseId) return;
            setSelectedTrade(null);
            setOpenExceptionId(exceptionCaseId);
          }}
        >
          Open break detail
        </Button>
      }
      detailBreak={breakDetail ?? null}
      detailOpen={Boolean(openExceptionId && breakDetail)}
      onDetailClose={() => {
        setOpenExceptionId(null);
        setSelectedTrade(null);
      }}
      onMarkResolved={async (_breakId, note) => {
        if (!openExceptionId) return;
        await closeBreak.mutateAsync({
          exceptionCaseId: openExceptionId,
          note,
          module: 'reconciliations',
          drillAudit: {
            drillPath: path.map((p) => ({ level: p.level, label: p.label, href: p.href })),
            scopeFilters: {
              ...(effectiveScope as unknown as Record<string, unknown>),
              selectedDealId: selectedTrade?.dealId ?? null,
            },
            targetLevel: 6,
            rowCount: rows.length,
          },
        });
        setOpenExceptionId(null);
        setSelectedTrade(null);
      }}
      onAddComment={async (_breakId, comment) => {
        if (!openExceptionId) return;
        const annotated = selectedTrade
          ? `[deal ${selectedTrade.dealId}] ${comment}`
          : comment;
        await addComment.mutateAsync({ exceptionId: openExceptionId, comment: annotated });
      }}
    >
      {tradesLoading ? (
        <DrillPageLoadingSkeleton rows={6} />
      ) : tradesEmpty ? (
        <DrillPageEmptyState
          title="No linked trades"
          description="No trades are linked to this document yet."
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Linked trades ({rows.length})
                {selectedTrade ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    · selected deal {selectedTrade.dealId}
                  </span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DrillDownTable
                rows={rows}
                columns={columns}
                dense
                onRowClick={handleTradeClick}
              />
              {!exceptionCaseId && !caseLoading ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  No break case linked to this document — row click is disabled.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </DrillPageShell>
  );
}
