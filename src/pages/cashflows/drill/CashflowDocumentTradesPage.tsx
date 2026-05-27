import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentTradeLineage, DrillDownTable, type DrillColumn } from '@/components/drill';
import {
  DrillPageShell,
  DrillPageLoadingSkeleton,
} from '@/pages/reconciliations/drill/DrillPageShell';
import {
  useCashflowDocumentTrades,
  type CashflowDocumentTradeRow,
} from '@/hooks/cashflows/useCashflowDocumentTrades';
import { useCashflowDocumentDetail } from '@/hooks/cashflows/useCashflowDocumentDetail';
import {
  buildCashflowPath,
  buildDrillUrl,
  scopeToHeader,
  useCashflowDrillScope,
  useCashflowDrillAudit,
  encodeCashflowScope,
} from './_drillScope';
import { withDrillContext } from '@/lib/drill-context-url';
import { usePeriodLock } from '@/hooks/cashflows/usePeriodLock';
import { PeriodLockBanner } from '@/components/cashflows/drill/PeriodLockBanner';

export default function CashflowDocumentTradesPage() {
  const { cashflowId } = useParams<{ cashflowId: string }>();
  const navigate = useNavigate();
  const { scope, removeKey, setScope } = useCashflowDrillScope();

  const detail = useCashflowDocumentDetail(cashflowId ?? null);
  const trades = useCashflowDocumentTrades(cashflowId ?? null);
  const lock = usePeriodLock(scope.asOfDate);

  useCashflowDrillAudit('view', 6, scope, trades.data.length);

  const path = useMemo(() => {
    const base = buildCashflowPath(6, scope);
    base.push({
      level: base.length,
      label: detail.data?.consolidated?.reference ?? cashflowId?.slice(0, 8) ?? 'Document',
      scope: { docId: cashflowId },
      href: `/cashflows/documents/${cashflowId}/trades?d=${encodeCashflowScope(scope)}`,
    });
    return base;
  }, [scope, cashflowId, detail.data]);

  const columns: DrillColumn<CashflowDocumentTradeRow>[] = [
    {
      key: 'dealId',
      header: 'Deal ID',
      accessor: (r) => r.dealId,
      sortable: true,
    },
    {
      key: 'tradeDate',
      header: 'Trade Date',
      accessor: (r) => r.tradeDate ?? '—',
      sortable: true,
      width: 140,
    },
    {
      key: 'product',
      header: 'Product',
      accessor: (r) => r.product ?? '—',
      sortable: true,
    },
    {
      key: 'volume',
      header: 'Volume',
      accessor: (r) => r.volume,
      align: 'right',
      sortable: true,
      format: 'number',
    },
    {
      key: 'price',
      header: 'Price',
      accessor: (r) => r.price,
      align: 'right',
      sortable: true,
      format: 'number',
    },
    {
      key: 'contribution',
      header: 'CF Contribution',
      accessor: (r) => r.cashflowContribution,
      align: 'right',
      sortable: true,
      format: 'currency',
    },
    {
      key: 'matchStatus',
      header: 'Match Status',
      accessor: (r) => r.matchStatus ?? '—',
      width: 140,
    },
  ];

  return (
    <DrillPageShell
      title="Linked trades"
      subtitle="Trades contributing to this consolidated cashflow."
      level={6}
      module="cashflows"
      path={path}
      scope={scopeToHeader(scope)}
      onBreadcrumbNavigate={(node) => navigate(node.href)}
      onBackToParent={() => navigate(buildDrillUrl('/cashflows/documents', scope))}
      onRemoveScope={(key) => removeKey(key as never)}
      onResetScope={() => setScope({ asOfDate: scope.asOfDate })}
      exportScope={{ ...scope, cashflowId } as unknown as Record<string, unknown>}
      estimatedRowCount={trades.data.length}
      exportDisabled={lock.isLocked}
      lockBanner={lock.isLocked ? <PeriodLockBanner periodName={lock.periodName} lockedAt={lock.lockedAt} /> : null}
    >
      {detail.isLoading || trades.isLoading ? (
        <DrillPageLoadingSkeleton chart rows={6} />
      ) : (
        <div className="space-y-6">
          {detail.data?.consolidated?.reference && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Document → Trades lineage</CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentTradeLineage docId={detail.data.consolidated.reference} />
              </CardContent>
            </Card>
          )}

          <DrillDownTable
            rows={trades.data}
            columns={columns}
            pageSize={50}
            onRowClick={(row) => {
              const drillContextParam = encodeCashflowScope(scope);
              const target = `/trade-explorer/${encodeURIComponent(row.dealId)}`;
              navigate(withDrillContext(target, drillContextParam));
            }}
          />
        </div>
      )}
    </DrillPageShell>
  );
}
