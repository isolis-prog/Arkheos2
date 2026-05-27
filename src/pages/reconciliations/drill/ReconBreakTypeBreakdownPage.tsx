import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DrillDownTable, type DrillColumn } from '@/components/drill';
import {
  DrillPageShell,
  DrillPageEmptyState,
  DrillPageLoadingSkeleton,
} from './DrillPageShell';
import {
  useRunBreakdownByType,
  type RunBreakdownByTypeRow,
} from '@/hooks/useRunBreakdownByType';
import {
  buildReconDrillUrl,
  buildReconPath,
  reconScopeToHeader,
  useReconDrillAudit,
  useReconDrillScope,
} from './_drillScope';

interface BreakTypeRow extends RunBreakdownByTypeRow {
  id: string;
}

export default function ReconBreakTypeBreakdownPage() {
  const navigate = useNavigate();
  const { scope, setScope, removeKey } = useReconDrillScope();
  const { data, isLoading, isEmpty } = useRunBreakdownByType(scope.runId);

  const rows = useMemo<BreakTypeRow[]>(
    () => data.map((r) => ({ ...r, id: r.breakCategory })),
    [data],
  );

  useReconDrillAudit('view', 2, scope, rows.length);

  const path = useMemo(() => buildReconPath(2, scope), [scope]);

  const columns: DrillColumn<BreakTypeRow>[] = [
    { key: 'breakCategory', header: 'Break type', accessor: (r) => r.breakCategory, sortable: true },
    {
      key: 'breakCount',
      header: 'Breaks',
      accessor: (r) => r.breakCount,
      sortable: true,
      align: 'right',
      format: 'number',
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
      key: 'minAmountDelta',
      header: 'Min Δ',
      accessor: (r) => r.minAmountDelta ?? 0,
      align: 'right',
      format: 'currency',
    },
    {
      key: 'maxAmountDelta',
      header: 'Max Δ',
      accessor: (r) => r.maxAmountDelta ?? 0,
      align: 'right',
      format: 'currency',
    },
    {
      key: 'avgAgeDays',
      header: 'Avg age (days)',
      accessor: (r) => (r.avgAgeDays != null ? Number(r.avgAgeDays.toFixed(1)) : 0),
      align: 'right',
      format: 'number',
    },
  ];

  const chartData = rows.map((r) => ({
    type: r.breakCategory,
    Exposure: r.totalExposureUsd,
  }));

  const handleRowClick = (row: BreakTypeRow) => {
    navigate(
      buildReconDrillUrl(`/reconciliations/${scope.runId}/drill/by-entity`, {
        runId: scope.runId,
        breakCategory: row.breakCategory,
      }),
    );
  };

  return (
    <DrillPageShell
      title="Break types"
      subtitle="Breakdown of reconciliation breaks by category for this run."
      level={2}
      module="reconciliations"
      path={path}
      scope={reconScopeToHeader(scope)}
      onBreadcrumbNavigate={(node) => navigate(node.href)}
      onBackToParent={() => navigate(`/reconciliations/${scope.runId}`)}
      onRemoveScope={(key) => removeKey(key as never)}
      onResetScope={() => setScope({ runId: scope.runId })}
      exportScope={scope as unknown as Record<string, unknown>}
      estimatedRowCount={rows.reduce((s, r) => s + r.breakCount, 0)}
    >
      {isLoading ? (
        <DrillPageLoadingSkeleton chart rows={6} />
      ) : isEmpty ? (
        <DrillPageEmptyState />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Exposure by break type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="Exposure" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <DrillDownTable rows={rows} columns={columns} onRowClick={handleRowClick} />
        </div>
      )}
    </DrillPageShell>
  );
}
