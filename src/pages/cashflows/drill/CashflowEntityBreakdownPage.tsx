import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DrillDownTable,
  type DrillColumn,
} from '@/components/drill';
import {
  DrillPageShell,
  DrillPageLoadingSkeleton,
} from '@/pages/reconciliations/drill/DrillPageShell';
import {
  useCashflowByEntity,
  type CashflowEntityRow,
} from '@/hooks/cashflows/useCashflowByEntity';
import {
  buildCashflowPath,
  buildDrillUrl,
  scopeToHeader,
  useCashflowDrillScope,
  useCashflowDrillAudit,
} from './_drillScope';
import { usePeriodLock } from '@/hooks/cashflows/usePeriodLock';
import { PeriodLockBanner } from '@/components/cashflows/drill/PeriodLockBanner';

interface EntityTableRow extends CashflowEntityRow {
  id: string;
}

export default function CashflowEntityBreakdownPage() {
  const navigate = useNavigate();
  const { scope, setScope, removeKey } = useCashflowDrillScope();
  const { data: rows, isLoading } = useCashflowByEntity(scope.asOfDate, {
    bucket: scope.bucket,
    flowDirection: scope.flowDirection,
  });
  const lock = usePeriodLock(scope.asOfDate);

  const tableRows: EntityTableRow[] = useMemo(
    () =>
      rows.map((r, i) => ({
        ...r,
        id: `${r.legalEntityId ?? 'unknown'}-${r.bucket}-${r.flowDirection}-${i}`,
      })),
    [rows],
  );

  useCashflowDrillAudit('view', 3, scope, tableRows.length);

  const path = useMemo(() => buildCashflowPath(3, scope), [scope]);

  const columns: DrillColumn<EntityTableRow>[] = [
    {
      key: 'entity',
      header: 'Legal Entity',
      accessor: (r) => r.legalEntityName ?? 'Unknown',
      sortable: true,
    },
    {
      key: 'eventCount',
      header: 'Events',
      accessor: (r) => r.eventCount,
      align: 'right',
      sortable: true,
      format: 'number',
      width: 100,
    },
    {
      key: 'amount',
      header: 'Total Amount (base)',
      accessor: (r) => r.totalAmountBase,
      align: 'right',
      sortable: true,
      format: 'currency',
    },
    {
      key: 'pct',
      header: '% of Bucket',
      accessor: (r) => r.pctOfBucket / 100,
      align: 'right',
      sortable: true,
      format: 'percent',
      width: 130,
    },
    {
      key: 'topCp',
      header: 'Top Counterparty',
      accessor: (r) => r.topCounterpartyName ?? '—',
      sortable: true,
    },
    {
      key: 'currencies',
      header: 'Currencies',
      accessor: (r) => r.currencies.join(', ') || '—',
      width: 140,
    },
  ];

  return (
    <DrillPageShell
      title="By legal entity"
      subtitle={
        scope.bucket
          ? `Cashflow exposure within bucket ${scope.bucket} grouped by legal entity.`
          : 'Cashflow exposure grouped by legal entity.'
      }
      level={3}
      module="cashflows"
      path={path}
      scope={scopeToHeader(scope)}
      onBreadcrumbNavigate={(node) => navigate(node.href)}
      onBackToParent={() => navigate(buildDrillUrl('/cashflows/buckets', { asOfDate: scope.asOfDate }))}
      onRemoveScope={(key) => removeKey(key as never)}
      onResetScope={() => setScope({ asOfDate: scope.asOfDate, bucket: scope.bucket })}
      exportScope={scope as unknown as Record<string, unknown>}
      estimatedRowCount={tableRows.reduce((s, r) => s + r.eventCount, 0)}
      exportDisabled={lock.isLocked}
      lockBanner={lock.isLocked ? <PeriodLockBanner periodName={lock.periodName} lockedAt={lock.lockedAt} /> : null}
    >
      {isLoading ? (
        <DrillPageLoadingSkeleton rows={8} />
      ) : (
        <DrillDownTable
          rows={tableRows}
          columns={columns}
          pageSize={50}
          onRowClick={(row) =>
            navigate(
              buildDrillUrl('/cashflows/buckets/by-counterparty', {
                ...scope,
                legalEntityId: row.legalEntityId ?? undefined,
                legalEntityName: row.legalEntityName ?? undefined,
              }),
            )
          }
        />
      )}
    </DrillPageShell>
  );
}
