import { MetricCard } from '@/components/ui/metric-card';
import { Layers, CheckCircle2, AlertTriangle, DollarSign, TrendingDown, Percent } from 'lucide-react';

interface Props {
  kpis: {
    totalPairs: number;
    matchedPairs: number;
    breakPairs: number;
    totalDelta: number;
    totalFxDelta: number;
    matchRate: number;
    nettingSavings: number;
  };
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

export const IntercompanyKPIs = ({ kpis }: Props) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
    <MetricCard title="IC Pairs" value={String(kpis.totalPairs)} icon={Layers} />
    <MetricCard title="Matched" value={String(kpis.matchedPairs)} icon={CheckCircle2} variant="success" />
    <MetricCard title="Breaks" value={String(kpis.breakPairs)} icon={AlertTriangle} variant={kpis.breakPairs > 0 ? 'error' : 'default'} />
    <MetricCard title="Match Rate" value={`${kpis.matchRate}%`} icon={Percent} variant={kpis.matchRate >= 90 ? 'success' : 'warning'} />
    <MetricCard title="$ Delta" value={fmt(kpis.totalDelta)} icon={DollarSign} variant={kpis.totalDelta > 0 ? 'warning' : 'default'} />
    <MetricCard title="FX Delta" value={fmt(kpis.totalFxDelta)} icon={TrendingDown} />
    <MetricCard title="Netting Savings" value={`${kpis.nettingSavings}%`} icon={Percent} variant="success" />
  </div>
);
