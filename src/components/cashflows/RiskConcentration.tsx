import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { ConsolidatedCashflow, CashflowRuleset } from '@/hooks/useCashflows';

interface ConcentrationItem {
  name: string;
  amount: number;
  pct: number;
}

interface RiskConcentrationProps {
  concentrationByCounterparty: ConcentrationItem[];
  concentrationByCurrency: ConcentrationItem[];
  concentrationByEntity: ConcentrationItem[];
  consolidated: ConsolidatedCashflow[];
  ruleset: CashflowRuleset | null;
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--muted-foreground))',
];

export const RiskConcentration = ({
  concentrationByCounterparty,
  concentrationByCurrency,
  concentrationByEntity,
  consolidated,
  ruleset,
}: RiskConcentrationProps) => {
  const threshold = ruleset?.concentration_threshold_pct || 25;
  const largePaymentThreshold = ruleset?.large_payment_threshold || 500000;

  // Detect large payments
  const largePayments = consolidated
    .filter(c => (c.amount_base || c.amount_original) >= largePaymentThreshold && c.direction === 'OUTFLOW' && c.status !== 'CANCELLED')
    .sort((a, b) => (b.amount_base || b.amount_original) - (a.amount_base || a.amount_original));

  // Detect peak days
  const dailyNet = new Map<string, number>();
  consolidated.forEach(c => {
    const amt = c.direction === 'OUTFLOW' ? -(c.amount_base || c.amount_original) : (c.amount_base || c.amount_original);
    dailyNet.set(c.value_date, (dailyNet.get(c.value_date) || 0) + amt);
  });
  const peakOutflowDays = Array.from(dailyNet.entries())
    .filter(([, net]) => net < -largePaymentThreshold)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(largePayments.length > 0 || peakOutflowDays.length > 0) && (
        <Card className="border-l-4 border-l-warning">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h3 className="font-semibold">Risk Alerts</h3>
            </div>
            <div className="space-y-1 text-sm">
              {largePayments.length > 0 && (
                <p>{largePayments.length} large outflow(s) exceeding {fmt(largePaymentThreshold)} threshold</p>
              )}
              {peakOutflowDays.length > 0 && (
                <p>{peakOutflowDays.length} peak outflow day(s) with net outflow exceeding {fmt(largePaymentThreshold)}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Counterparty Concentration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Concentration by Counterparty</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={concentrationByCounterparty.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" tickFormatter={v => fmt(v)} fontSize={12} />
                <YAxis dataKey="name" type="category" width={100} fontSize={11} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {concentrationByCounterparty.slice(0, 8).map((entry, i) => (
                    <Cell key={i} fill={entry.pct > threshold ? 'hsl(var(--destructive))' : COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {concentrationByCounterparty.filter(c => c.pct > threshold).map(c => (
                <div key={c.name} className="flex items-center gap-2 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{c.name}: {c.pct.toFixed(1)}% (above {threshold}% threshold)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Concentration by Currency</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={concentrationByCurrency} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, pct }) => `${name} (${pct.toFixed(0)}%)`} labelLine={false} fontSize={11}>
                  {concentrationByCurrency.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Entity + Large Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Concentration by Legal Entity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {concentrationByEntity.map((e, i) => (
                <div key={e.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{e.name}</span>
                    <span className="text-muted-foreground">{fmt(e.amount)} ({e.pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${e.pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Large Outflow Alerts</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {largePayments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No large outflows detected</p>
              ) : largePayments.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.counterparty}</p>
                    <p className="text-xs text-muted-foreground">{c.value_date} · {c.currency_original}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">Large</Badge>
                    <span className="amount-negative">{fmt(c.amount_base || c.amount_original)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
