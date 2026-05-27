import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DrillDownTable,
  type DrillColumn,
} from '@/components/drill';
import {
  DrillPageShell,
  DrillPageLoadingSkeleton,
} from '@/pages/reconciliations/drill/DrillPageShell';
import {
  useCashflowDocuments,
  type CashflowDocumentRow,
} from '@/hooks/cashflows/useCashflowDocuments';
import { useCashflowDocumentDetail } from '@/hooks/cashflows/useCashflowDocumentDetail';
import { CashflowBreakDetailPanel } from '@/components/cashflows/drill/CashflowBreakDetailPanel';
import {
  buildCashflowPath,
  buildDrillUrl,
  scopeToHeader,
  useCashflowDrillScope,
  useCashflowDrillAudit,
} from './_drillScope';
import { usePeriodLock } from '@/hooks/cashflows/usePeriodLock';
import { PeriodLockBanner } from '@/components/cashflows/drill/PeriodLockBanner';

interface DocumentTableRow extends CashflowDocumentRow {
  id: string;
}

const fmtCurrency = (v: number | null, currency: string | null) =>
  v == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency ?? 'USD',
        maximumFractionDigits: 2,
      }).format(v);

function ExpandedRow({ id }: { id: string }) {
  const { data, isLoading } = useCashflowDocumentDetail(id);
  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading metadata…</p>;
  }
  const c = data.consolidated;
  return (
    <div className="space-y-3">
      {c && (
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Reference</p>
            <p className="font-mono text-foreground">{c.reference ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Confidence</p>
            <p className="font-mono text-foreground">{(c.confidence_score * 100).toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Bucket</p>
            <p className="font-mono text-foreground">{c.bucket}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Linked events</p>
            <p className="font-mono text-foreground">{data.events.length}</p>
          </div>
        </div>
      )}
      {data.events.length > 0 && (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">Reference</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Value Date</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-3 py-2">{e.source_system}</td>
                  <td className="px-3 py-2 font-mono">{e.reference ?? '—'}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {fmtCurrency(e.amount_base ?? e.amount_original, e.currency_original)}
                  </td>
                  <td className="px-3 py-2">{e.value_date}</td>
                  <td className="px-3 py-2">{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function CashflowDocumentListPage() {
  const navigate = useNavigate();
  const { scope, setScope, removeKey } = useCashflowDrillScope();
  const [pageIndex, setPageIndex] = useState(0);
  const [openDocId, setOpenDocId] = useState<string | null>(null);
  const pageSize = 50;

  const { data, isLoading } = useCashflowDocuments(scope.asOfDate, {
    bucket: scope.bucket,
    legalEntityId: scope.legalEntityId,
    counterpartyId: scope.counterpartyId,
    flowDirection: scope.flowDirection,
    pageSize,
    pageIndex,
  });
  const lock = usePeriodLock(scope.asOfDate);

  const tableRows: DocumentTableRow[] = useMemo(
    () => data.rows.map((r) => ({ ...r, id: r.consolidatedCashflowId })),
    [data.rows],
  );

  useCashflowDrillAudit('view', 5, scope, data.total);

  const path = useMemo(() => buildCashflowPath(5, scope), [scope]);

  const columns: DrillColumn<DocumentTableRow>[] = [
    { key: 'docId', header: 'Doc ID', accessor: (r) => r.docId ?? '—', sortable: true, width: 140 },
    { key: 'docType', header: 'Type', accessor: (r) => r.docType ?? '—', sortable: true, width: 110 },
    { key: 'expectedDate', header: 'Expected', accessor: (r) => r.expectedDate ?? '—', sortable: true, width: 120 },
    { key: 'actualDate', header: 'Actual', accessor: (r) => r.actualDate ?? '—', sortable: true, width: 120 },
    {
      key: 'expectedAmount',
      header: 'Expected Amt',
      accessor: (r) => r.expectedAmount,
      align: 'right',
      sortable: true,
      format: 'currency',
    },
    {
      key: 'actualAmount',
      header: 'Actual Amt',
      accessor: (r) => r.actualAmount,
      align: 'right',
      sortable: true,
      format: 'currency',
    },
    {
      key: 'delta',
      header: 'Delta',
      accessor: (r) => r.amountDelta,
      align: 'right',
      sortable: true,
      format: 'currency',
    },
    { key: 'bucket', header: 'Bucket', accessor: (r) => r.bucket, sortable: true, width: 110 },
    { key: 'currency', header: 'CCY', accessor: (r) => r.currency ?? '—', width: 80 },
    { key: 'flow', header: 'Flow', accessor: (r) => r.flowDirection, width: 100 },
    { key: 'status', header: 'Status', accessor: (r) => r.status ?? '—', width: 120 },
    {
      key: 'rootCause',
      header: 'Root Cause',
      accessor: (r) =>
        r.suggestedRootCause ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block max-w-[220px] truncate text-left">
                  {r.suggestedRootCause}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">{r.suggestedRootCause}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          '—'
        ),
    },
    {
      key: 'goto',
      header: '',
      accessor: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(
              buildDrillUrl(`/cashflows/documents/${r.consolidatedCashflowId}/trades`, scope),
            );
          }}
          className="inline-flex items-center text-muted-foreground hover:text-foreground"
          aria-label="Open linked trades"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ),
      width: 60,
      align: 'center',
    },
  ];

  return (
    <DrillPageShell
      title="Cashflow documents"
      subtitle="Document-level breaks within the current bucket / entity / counterparty scope."
      level={5}
      module="cashflows"
      path={path}
      scope={scopeToHeader(scope)}
      onBreadcrumbNavigate={(node) => navigate(node.href)}
      onBackToParent={() =>
        navigate(
          buildDrillUrl('/cashflows/buckets/by-counterparty', {
            asOfDate: scope.asOfDate,
            bucket: scope.bucket,
            legalEntityId: scope.legalEntityId,
            legalEntityName: scope.legalEntityName,
            flowDirection: scope.flowDirection,
          }),
        )
      }
      onRemoveScope={(key) => removeKey(key as never)}
      onResetScope={() => setScope({ asOfDate: scope.asOfDate, bucket: scope.bucket })}
      exportScope={scope as unknown as Record<string, unknown>}
      estimatedRowCount={data.total}
      exportDisabled={lock.isLocked}
      lockBanner={lock.isLocked ? <PeriodLockBanner periodName={lock.periodName} lockedAt={lock.lockedAt} /> : null}
    >
      {isLoading ? (
        <DrillPageLoadingSkeleton rows={12} />
      ) : (
        <>
          <DrillDownTable
            rows={tableRows}
            columns={columns}
            pageSize={pageSize}
            onRowClick={(row) => setOpenDocId(row.consolidatedCashflowId)}
            expandable={{ render: (row) => <ExpandedRow id={row.consolidatedCashflowId} /> }}
          />
          <CashflowBreakDetailPanel
            consolidatedCashflowId={openDocId}
            isOpen={openDocId !== null}
            onClose={() => setOpenDocId(null)}
            locked={lock.isLocked}
          />
          {data.total > pageSize && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                className="rounded-md border bg-card px-3 py-1.5 text-sm disabled:opacity-50"
                onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                disabled={pageIndex === 0}
              >
                Previous
              </button>
              <span className="px-2 py-1.5 text-sm text-muted-foreground">
                Server page {pageIndex + 1} of {Math.ceil(data.total / pageSize)}
              </span>
              <button
                type="button"
                className="rounded-md border bg-card px-3 py-1.5 text-sm disabled:opacity-50"
                onClick={() => setPageIndex((i) => i + 1)}
                disabled={(pageIndex + 1) * pageSize >= data.total}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </DrillPageShell>
  );
}
