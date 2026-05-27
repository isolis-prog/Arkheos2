import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DrillDownTable, type DrillColumn } from '@/components/drill';
import {
  DrillPageShell,
  DrillPageEmptyState,
  DrillPageLoadingSkeleton,
} from './DrillPageShell';
import {
  useRunBreakdownByEntity,
  type RunBreakdownByEntityRow,
} from '@/hooks/useRunBreakdownByEntity';
import {
  buildReconDrillUrl,
  buildReconPath,
  reconScopeToHeader,
  useReconDrillAudit,
  useReconDrillScope,
} from './_drillScope';

interface EntityRow extends RunBreakdownByEntityRow {
  id: string;
}

export default function ReconEntityBreakdownPage() {
  const navigate = useNavigate();
  const { scope, setScope, removeKey } = useReconDrillScope();
  const { data, isLoading, isEmpty } = useRunBreakdownByEntity(scope.runId, scope.breakCategory);

  const rows = useMemo<EntityRow[]>(
    () => data.map((r) => ({ ...r, id: `${r.legalEntityId}-${r.breakCategory}` })),
    [data],
  );

  useReconDrillAudit('view', 3, scope, rows.length);

  const path = useMemo(() => buildReconPath(3, scope), [scope]);

  const columns: DrillColumn<EntityRow>[] = [
    {
      key: 'legalEntityName',
      header: 'Legal entity',
      accessor: (r) => r.legalEntityName,
      sortable: true,
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
      key: 'totalExposureUsd',
      header: 'Exposure (USD)',
      accessor: (r) => r.totalExposureUsd,
      sortable: true,
      align: 'right',
      format: 'currency',
    },
    {
      key: 'topCounterpartyName',
      header: 'Top counterparty',
      accessor: (r) => r.topCounterpartyName ?? '—',
    },
  ];

  const handleRowClick = (row: EntityRow) => {
    navigate(
      buildReconDrillUrl(`/reconciliations/${scope.runId}/drill/by-counterparty`, {
        runId: scope.runId,
        breakCategory: scope.breakCategory ?? row.breakCategory,
        legalEntityId: row.legalEntityId,
        legalEntityName: row.legalEntityName,
      }),
    );
  };

  return (
    <DrillPageShell
      title="Breaks by legal entity"
      subtitle="Open break exposure aggregated per legal entity."
      level={3}
      module="reconciliations"
      path={path}
      scope={reconScopeToHeader(scope)}
      onBreadcrumbNavigate={(node) => navigate(node.href)}
      onBackToParent={() =>
        navigate(
          buildReconDrillUrl(`/reconciliations/${scope.runId}/drill/by-type`, {
            runId: scope.runId,
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
