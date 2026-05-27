import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import type { ScenarioResult } from '@/hooks/useStructuredPricing';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function fmt(n: number) {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

interface Props {
  scenarios: ScenarioResult[];
  priceShocks: number[];
  volShocks: number[];
}

export function ScenarioAnalysisTab({ scenarios, priceShocks, volShocks }: Props) {
  // Matrix: rows = vol shocks, cols = price shocks
  const getScenario = (ps: number, vs: number) =>
    scenarios.find(s => s.price_shock_pct === ps && s.vol_shock_pct === vs);

  // Bar chart: vol=0 scenarios only
  const chartData = priceShocks.map(ps => {
    const s = getScenario(ps, 0);
    return { name: `${ps >= 0 ? '+' : ''}${ps}%`, pnl: s?.pnl_impact || 0 };
  });

  const cellColor = (pnl: number) => {
    if (pnl > 1000000) return 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300';
    if (pnl > 0) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
    if (pnl > -1000000) return 'bg-destructive/10 text-destructive';
    return 'bg-destructive/20 text-destructive';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <h3 className="text-lg font-semibold">Scenario Analysis</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Matrix */}
        <Card>
          <CardHeader><CardTitle className="text-base">P&L Impact Matrix</CardTitle></CardHeader>
          <CardContent className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs text-muted-foreground border-b">Vol ↓ / Price →</th>
                  {priceShocks.map(ps => (
                    <th key={ps} className="p-2 text-center text-xs font-mono border-b">{ps >= 0 ? '+' : ''}{ps}%</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {volShocks.map(vs => (
                  <tr key={vs}>
                    <td className="p-2 font-mono text-xs border-b">Vol {vs >= 0 ? '+' : ''}{vs}%</td>
                    {priceShocks.map(ps => {
                      const s = getScenario(ps, vs);
                      const pnl = s?.pnl_impact || 0;
                      return (
                        <td key={ps} className={`p-2 text-center font-mono text-xs border-b ${cellColor(pnl)}`}>
                          {fmt(pnl)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Price Shock P&L (Vol flat)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={v => fmt(v)} className="text-xs" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="pnl">
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
