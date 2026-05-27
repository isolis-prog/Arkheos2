import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

interface Props {
  yesterdayTotal: number;
  todayTotal: number;
  totalDayChange: number;
  deltaPct: number;
}

const fmt = (v: number) => {
  const abs = Math.abs(v);
  const sign = v >= 0 ? '+' : '-';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
};

export function FlashVsReconciledBar({ yesterdayTotal, todayTotal, totalDayChange, deltaPct }: Props) {
  const data = [
    { name: "Yesterday's Close", value: yesterdayTotal },
    { name: "Today's Flash", value: todayTotal },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Yesterday vs. Today</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={totalDayChange >= 0 ? 'default' : 'destructive'} className="text-xs">
              Δ {fmt(totalDayChange)} ({deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%)
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
              <XAxis type="number" tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'P&L']} />
              <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.value >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 p-3 rounded-lg border border-warning/30 bg-warning/5 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Flash P&L is an estimate</span> based on current market prices. Reconciled P&L is produced at month-end and may differ. For official P&L see the P&L Attribution tab above.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
