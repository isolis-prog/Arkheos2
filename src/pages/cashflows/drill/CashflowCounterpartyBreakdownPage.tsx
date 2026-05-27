import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DrillDownTable,
  type DrillColumn,
} from '@/components/drill';
import {
  DrillPageShell,
  DrillPageLoadingSkeleton,
} from '@/pages/reconciliations/drill/DrillPageShell';
import {
  useCashflowByCounterparty,
  type CashflowCounterpartyRow,
} from '@/hooks/cashflows/useCashflowByCounterparty';
import {
  buildCashflowPath,
  buildDrillUrl,
  scopeToHeader,
  useCashflowDrillScope,
  useCashflowDrillAudit,
} from './_drillScope';
import { usePeriodLock } from '@/hooks/cashflows/usePeriodLock';
import { PeriodLockBanner } from '@/components/cashflows/drill/PeriodLockBanner';

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--info))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--accent))',
  'hsl(var(--secondary))',
  'hsl(var(--muted-foreground))',
  'hsl(var(--ring))',
  'hsl(var(--border))',
];

interface CounterpartyTableRow extends CashflowCounterpartyRow {
  id: string;
}

export default function CashflowCounterpartyBreakdownPage() {
  const navigate = useNavigate();
  const { scope, setScope, removeKey } = useCashflowDrillScope();
  const { data: rows, isLoading } = useCashflowByCounterparty(scope.asOfDate, {
    bucket: scope.bucket,
    legalEntityId: scope.legalEntityId,
    flowDirection: scope.flowDirection,
  });
  const lock = usePeriodLock(scope.asOfDate);

  const tableRows: CounterpartyTableRow[] = useMemo(
    () =>
      rows.map((r, i) => ({
        ...r,
        id: `${r.externalCounterpartyId ?? 'unknown'}-${r.bucket}-${r.flowDirection}-${i}`,
      })),
    [rows],
  );

  useCashflowDrillAudit('view', 4, scope, tableRows.length);

  const path = useMemo(() => buildCashflowPath(4, scope), [scope]);

  const top10 = useMemo(() => {
    const total = tableRows.reduce((s, r) => s + Math.abs(r.totalAmountBase), 0) || 1;
    return [...tableRows]
      .sort((a, b) => Math.abs(b.totalAmountBase) - Math.abs(a.totalAmountBase))
      .slice(0, 10)
      .map((r) => ({
        name: r.counterpartyName ?? 'Unknown',
        value: Math.abs(r.totalAmountBase),
        pct: (Math.abs(r.totalAmountBase) / total) * 100,
      }));
  }, [tableRows]);

  const columns: DrillColumn<CounterpartyTableRow>[] = [
    {
      key: 'cp',
      header: 'External Counterparty',
      accessor: (r) => r.counterpartyName ?? 'Unknown',
      sortable: true,
    },
    {
      key: 'entity',
      header: 'Legal Entity',
      accessor: (r) => r.legalEntityName ?? '—',
      sortable: true,
    },
    {
      key: 'events',
      header: 'Events',
      accessor: (r) => r.eventCount,
      align: 'right',
      format: 'number',
      sortable: true,
      width: 100,
    },
    {
      key: 'amount',
      header: 'Total Amount',
      accessor: (r) => r.totalAmountBase,
      align: 'right',
      format: 'currency',
      sortable: true,
    },
    {
      key: 'oldest',
      header: 'Oldest Overdue (d)',
      accessor: (r) => r.oldestOverdueDays ?? 0,
      align: 'right',
      format: 'number',
      sortable: true,
      width: 150,
    },
    {
      key: 'open',
      header: 'Open Docs',
      accessor: (r) => r.openDocCount,
      align: 'right',
      format: 'number',
      sortable: true,
      width: 110,
    },
    {
      key: 'next',
      header: 'Next Upcoming',
      accessor: (r) => r.nextUpcomingDate ?? '—',
      width: 140,
    },
  ];

  return (
    <DrillPageShell
      title="By external counterparty"
      subtitle="Counterparty concentration within the current scope."
      level={4}
      module="cashflows"
      path={path}
      scope={scopeToHeader(scope)}
      onBreadcrumbNavigate={(node) => navigate(node.href)}
      onBackToParent={() =>
        navigate(
          buildDrillUrl('/cashflows/buckets/by-entity', {
            asOfDate: scope.asOfDate,
            bucket: scope.bucket,
            flowDirection: scope.flowDirection,
          }),
        )
      }
      onRemoveScope={(key) => removeKey(key as never)}
      onResetScope={() =>
        setScope({ asOfDate: scope.asOfDate, bucket: scope.bucket, legalEntityId: scope.legalEntityId, legalEntityName: scope.legalEntityName })
      }
      exportScope={scope as unknown as Record<string, unknown>}
      estimatedRowCount={tableRows.reduce((s, r) => s + r.openDocCount, 0)}
      exportDisabled={lock.isLocked}
      lockBanner={lock.isLocked ? <PeriodLockBanner periodName={lock.periodName} lockedAt={lock.lockedAt} /> : null}
    >
      {isLoading ? (
        <DrillPageLoadingSkeleton chart rows={10} />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top 10 counterparty concentration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={top10}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                    >
                      {top10.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                      }}
                      formatter={(v: number, name: string) => [
                        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v),
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <DrillDownTable
            rows={tableRows}
            columns={columns}
            pageSize={50}
            onRowClick={(row) =>
              navigate(
                buildDrillUrl('/cashflows/documents', {
                  ...scope,
                  counterpartyId: row.externalCounterpartyId ?? undefined,
                  counterpartyName: row.counterpartyName ?? undefined,
                }),
              )
            }
          />
        </div>
      )}
    </DrillPageShell>
  );
}
