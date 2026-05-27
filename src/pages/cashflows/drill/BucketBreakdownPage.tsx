import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DrillDownTable,
  type DrillColumn,
  type DrillPathNode,
} from '@/components/drill';
import {
  DrillPageShell,
  DrillPageLoadingSkeleton,
} from '@/pages/reconciliations/drill/DrillPageShell';
import {
  useCashflowByBucket,
  type CashflowBucketRow,
  CASHFLOW_BUCKET_ORDER,
} from '@/hooks/cashflows/useCashflowByBucket';
import {
  buildCashflowPath,
  buildDrillUrl,
  scopeToHeader,
  useCashflowDrillScope,
  useCashflowDrillAudit,
} from './_drillScope';
import { usePeriodLock } from '@/hooks/cashflows/usePeriodLock';
import { PeriodLockBanner } from '@/components/cashflows/drill/PeriodLockBanner';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

interface BucketTableRow extends CashflowBucketRow {
  id: string;
}

export default function BucketBreakdownPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromTrade = searchParams.get('fromTrade');
  const { scope, setScope, removeKey } = useCashflowDrillScope();
  const { data: rows, isLoading } = useCashflowByBucket(scope.asOfDate);
  const lock = usePeriodLock(scope.asOfDate);

  const filtered = useMemo<BucketTableRow[]>(() => {
    return rows.map((r) => ({ ...r, id: r.bucket }));
  }, [rows]);

  useCashflowDrillAudit('view', 2, scope, filtered.length);

  const path: DrillPathNode[] = useMemo(() => {
    const base = buildCashflowPath(2, scope);
    return [
      ...base,
      {
        level: base.length,
        label: 'Bucket breakdown',
        scope: { asOfDate: scope.asOfDate },
        href: buildDrillUrl('/cashflows/buckets', scope),
      },
    ];
  }, [scope]);

  const chartData = filtered.map((r) => ({
    bucket: r.bucket,
    Inflow: r.inflow,
    Outflow: -r.outflow,
  }));

  const columns: DrillColumn<BucketTableRow>[] = [
    { key: 'bucket', header: 'Bucket', accessor: (r) => r.bucket, sortable: true, width: 140 },
    {
      key: 'eventCount',
      header: 'Events',
      accessor: (r) => r.eventCount,
      sortable: true,
      align: 'right',
      format: 'number',
      width: 110,
    },
    {
      key: 'inflow',
      header: 'Total Inflow',
      accessor: (r) => r.inflow,
      sortable: true,
      align: 'right',
      format: 'currency',
    },
    {
      key: 'outflow',
      header: 'Total Outflow',
      accessor: (r) => r.outflow,
      sortable: true,
      align: 'right',
      format: 'currency',
    },
    {
      key: 'net',
      header: 'Net',
      accessor: (r) => r.net,
      sortable: true,
      align: 'right',
      format: 'currency',
    },
    {
      key: 'currencies',
      header: 'Currencies',
      accessor: (r) => r.currencies.join(', ') || '—',
      width: 160,
    },
    {
      key: 'earliest',
      header: 'Earliest Due',
      accessor: (r) => r.earliestDueDate ?? '—',
      width: 140,
    },
  ];

  const appendFromTrade = (url: string) =>
    fromTrade ? `${url}${url.includes('?') ? '&' : '?'}fromTrade=${encodeURIComponent(fromTrade)}` : url;

  const handleRowClick = (row: BucketTableRow) => {
    if (row.eventCount === 0) return;
    navigate(
      appendFromTrade(
        buildDrillUrl('/cashflows/buckets/by-entity', {
          ...scope,
          bucket: row.bucket,
        }),
      ),
    );
  };

  return (
    <DrillPageShell
      title="Cashflow buckets"
      subtitle="Aging-based breakdown of consolidated cashflow exposure across the configured horizon."
      level={2}
      module="cashflows"
      path={path}
      scope={scopeToHeader(scope)}
      onBreadcrumbNavigate={(node) => navigate(appendFromTrade(node.href))}
      onBackToParent={() =>
        navigate(fromTrade ? `/trade-explorer/${encodeURIComponent(fromTrade)}` : '/cashflows')
      }
      onRemoveScope={(key) => removeKey(key as never)}
      onResetScope={() => setScope({ asOfDate: scope.asOfDate })}
      exportScope={scope as unknown as Record<string, unknown>}
      estimatedRowCount={filtered.reduce((s, r) => s + r.eventCount, 0)}
      exportDisabled={lock.isLocked}
      lockBanner={lock.isLocked ? <PeriodLockBanner periodName={lock.periodName} lockedAt={lock.lockedAt} /> : null}
      actions={
        <Tabs
          value={scope.flowDirection ?? 'all'}
          onValueChange={(v) =>
            setScope({
              ...scope,
              flowDirection: v === 'all' ? undefined : (v as 'inflow' | 'outflow'),
            })
          }
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="inflow">Inflow</TabsTrigger>
            <TabsTrigger value="outflow">Outflow</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      {isLoading ? (
        <DrillPageLoadingSkeleton chart rows={7} />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Inflow vs Outflow by bucket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" stackOffset="sign">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v) => formatCurrency(Math.abs(Number(v)))}
                    />
                    <YAxis
                      dataKey="bucket"
                      type="category"
                      stroke="hsl(var(--muted-foreground))"
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                      }}
                      formatter={(value: number) => formatCurrency(Math.abs(value))}
                    />
                    <Legend />
                    <Bar dataKey="Inflow" fill="hsl(var(--success))" stackId="flow" />
                    <Bar dataKey="Outflow" fill="hsl(var(--destructive))" stackId="flow" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <DrillDownTable
            rows={filtered}
            columns={columns}
            onRowClick={handleRowClick}
            pageSize={CASHFLOW_BUCKET_ORDER.length}
          />
        </div>
      )}
    </DrillPageShell>
  );
}
