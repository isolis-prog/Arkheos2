import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { DealPnlSeriesPoint } from '@/hooks/inbox/useDealLens';

interface PnlSnapshotChartProps {
  series: DealPnlSeriesPoint[];
  currency: string | null | undefined;
}

const fmtShort = (n: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);

export function PnlSnapshotChart({ series, currency }: PnlSnapshotChartProps) {
  const data = useMemo(
    () =>
      series.map((p) => ({
        ts: new Date(p.computed_at).getTime(),
        label: new Date(p.computed_at).toLocaleString(undefined, {
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        fo_pv: p.fo_pv,
        mo_pv: p.mo_pv,
        delta: p.delta,
      })),
    [series],
  );

  if (data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No snapshot history available to plot.
      </p>
    );
  }

  const ccy = currency || 'USD';
  const fmtTooltip = (v: number | null) =>
    v == null
      ? '—'
      : new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: ccy,
          maximumFractionDigits: 0,
        }).format(v);

  return (
    <div className="h-56 w-full" data-testid="pnl-snapshot-chart">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={fmtShort}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              fontSize: 12,
              borderRadius: 6,
            }}
            formatter={(value: number, name: string) => [fmtTooltip(value), name]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={0} stroke="hsl(var(--border))" />
          <Line
            type="monotone"
            dataKey="fo_pv"
            name="FO PV"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="mo_pv"
            name="MO PV"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="delta"
            name="FO − MO Δ"
            stroke="hsl(var(--destructive))"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
