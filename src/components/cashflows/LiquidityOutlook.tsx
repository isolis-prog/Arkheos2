import { MetricCard } from '@/components/ui/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight, DollarSign, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { ConsolidatedCashflow } from '@/hooks/useCashflows';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/CardSkeleton';
import { ChartSkeleton } from '@/components/ui/ChartSkeleton';
import { format } from 'date-fns';

interface LiquidityOutlookProps {
  totalInflows: number;
  totalOutflows: number;
  netCash: number;
  overdueAmount: number;
  topInflows: ConsolidatedCashflow[];
  topOutflows: ConsolidatedCashflow[];
  chartData: { date: string; inflow: number; outflow: number; net: number }[];
  isLoading: boolean;
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const statusColor = (s: string) => {
  switch (s) {
    case 'PAID_RECEIVED': return 'default';
    case 'CONFIRMED': return 'secondary';
    case 'POSTED': return 'outline';
    case 'FORECAST': return 'destructive';
    default: return 'secondary';
  }
};

export const LiquidityOutlook = ({
  totalInflows, totalOutflows, netCash, overdueAmount,
  topInflows, topOutflows, chartData, isLoading,
}: LiquidityOutlookProps) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={4} />
        <ChartSkeleton height={320} bars={16} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Inflows" value={fmt(totalInflows)} icon={ArrowDownLeft} variant="success" isLoading={isLoading} />
        <MetricCard title="Total Outflows" value={fmt(totalOutflows)} icon={ArrowUpRight} variant="error" isLoading={isLoading} />
        <MetricCard title="Net Cash" value={fmt(netCash)} icon={DollarSign} variant={netCash >= 0 ? 'success' : 'error'} isLoading={isLoading} />
        <MetricCard title="Overdue" value={fmt(overdueAmount)} icon={AlertTriangle} variant={overdueAmount > 0 ? 'warning' : 'default'} isLoading={isLoading} />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cash Flow Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tickFormatter={d => format(new Date(d), 'MMM d')} fontSize={12} />
              <YAxis tickFormatter={v => fmt(v)} fontSize={12} />
              <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={d => format(new Date(d as string), 'MMM d, yyyy')} />
              <Legend />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Bar dataKey="inflow" name="Inflows" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflow" name="Outflows" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 Upcoming Inflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topInflows.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.counterparty}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(c.value_date), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColor(c.status)} className="text-xs">{c.status}</Badge>
                    <span className="amount-positive">{fmt(c.amount_base || c.amount_original)}</span>
                  </div>
                </div>
              ))}
              {topInflows.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No upcoming inflows</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 Upcoming Outflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topOutflows.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.counterparty}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(c.value_date), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColor(c.status)} className="text-xs">{c.status}</Badge>
                    <span className="amount-negative">{fmt(c.amount_base || c.amount_original)}</span>
                  </div>
                </div>
              ))}
              {topOutflows.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No upcoming outflows</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
