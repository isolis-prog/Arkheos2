import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DrillDownTable, type DrillColumn } from '@/components/drill';
import {
  DrillPageShell,
  DrillPageEmptyState,
  DrillPageLoadingSkeleton,
} from './DrillPageShell';
import {
  useRunBreakdownByCounterparty,
  type RunBreakdownByCounterpartyRow,
} from '@/hooks/useRunBreakdownByCounterparty';
import {
  buildReconDrillUrl,
  buildReconPath,
  reconScopeToHeader,
  useReconDrillAudit,
  useReconDrillScope,
} from './_drillScope';

interface CounterpartyRow extends RunBreakdownByCounterpartyRow {
  id: string;
}

export default function ReconCounterpartyBreakdownPage() {
  const navigate = useNavigate();
  const { scope, setScope, removeKey } = useReconDrillScope();
  const { data, isLoading, isEmpty } = useRunBreakdownByCounterparty(scope.runId, {
    legalEntityId: scope.legalEntityId,
    breakCategory: scope.breakCategory,
  });

  const rows = useMemo<CounterpartyRow[]>(
    () =>
      data.map((r, idx) => ({
        ...r,
        id: `${r.counterpartyId ?? 'unknown'}-${r.breakCategory}-${idx}`,
      })),
    [data],
  );

  useReconDrillAudit('view', 4, scope, rows.length);

  const path = useMemo(() => buildReconPath(4, scope), [scope]);

  const columns: DrillColumn<CounterpartyRow>[] = [
    {
      key: 'counterpartyName',
      header: 'Counterparty',
      accessor: (r) => r.counterpartyName,
      sortable: true,
    },
    {
      key: 'legalEntityName',
      header: 'Entity',
      accessor: (r) => r.legalEntityName ?? '—',
      width: 200,
    },
    { key: 'breakCategory', header: 'Type', accessor: (r) => r.breakCategory, sortable: true, width: 160 },
    {
      key: 'breakCount',
      header: 'Breaks',
      accessor: (r) => r.breakCount,
      sortable: true,
      align: 'right',
      format: 'number',
      width: 110,
    },
    {
      key: 'openDocCount',
      header: 'Open docs',
      accessor: (r) => r.openDocCount,
      sortable: true,
      align: 'right',
      format: 'number',
      width: 120,
    },
    {
      key: 'totalExposureUsd',
      header: 'Exposure (USD)',
      accessor: (r) => r.totalExposureUsd,
      sortable: true,
      align: 'right',
      format: 'currency',
    },
    {
      key: 'oldestBreakAgeDays',
      header: 'Oldest (days)',
      accessor: (r) => r.oldestBreakAgeDays ?? 0,
      align: 'right',
      format: 'number',
      width: 130,
    },
  ];

  const handleRowClick = (row: CounterpartyRow) => {
    navigate(
      buildReconDrillUrl(`/reconciliations/${scope.runId}/drill/documents`, {
        runId: scope.runId,
        breakCategory: scope.breakCategory ?? row.breakCategory,
        legalEntityId: scope.legalEntityId ?? row.legalEntityId ?? undefined,
        legalEntityName: scope.legalEntityName ?? row.legalEntityName ?? undefined,
        counterpartyId: row.counterpartyId ?? undefined,
        counterpartyName: row.counterpartyName,
      }),
    );
  };

  return (
    <DrillPageShell
      title="Breaks by counterparty"
      subtitle="Drill into the counterparties driving the open break exposure."
      level={4}
      module="reconciliations"
      path={path}
      scope={reconScopeToHeader(scope)}
      onBreadcrumbNavigate={(node) => navigate(node.href)}
      onBackToParent={() =>
        navigate(
          buildReconDrillUrl(`/reconciliations/${scope.runId}/drill/by-entity`, {
            runId: scope.runId,
            breakCategory: scope.breakCategory,
          }),
        )
      }
      onRemoveScope={(key) => removeKey(key as never)}
      onResetScope={() => setScope({ runId: scope.runId })}
      exportScope={scope as unknown as Record<string, unknown>}
      estimatedRowCount={rows.reduce((s, r) => s + r.breakCount, 0)}
    >
      {isLoading ? (
        <DrillPageLoadingSkeleton rows={8} />
      ) : isEmpty ? (
        <DrillPageEmptyState />
      ) : (
        <DrillDownTable rows={rows} columns={columns} onRowClick={handleRowClick} />
      )}
    </DrillPageShell>
  );
}
