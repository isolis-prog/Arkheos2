import { MetricCard } from '@/components/ui/metric-card';
import { CheckCircle2, AlertTriangle, XCircle, Target, DollarSign, Percent } from 'lucide-react';

interface Props {
  kpis: {
    totalExpected: number;
    totalMatched: number;
    totalMissing: number;
    totalExceptions: number;
    completenessPct: number;
    missingAmount: number;
    deltaAmount: number;
  };
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

export const DealToGLKPIs = ({ kpis }: Props) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
    <MetricCard title="Completeness" value={`${kpis.completenessPct}%`} icon={Percent} variant={kpis.completenessPct >= 95 ? 'success' : kpis.completenessPct >= 80 ? 'warning' : 'error'} />
    <MetricCard title="Expected" value={String(kpis.totalExpected)} icon={Target} />
    <MetricCard title="Matched" value={String(kpis.totalMatched)} icon={CheckCircle2} variant="success" />
    <MetricCard title="Missing" value={String(kpis.totalMissing)} icon={XCircle} variant={kpis.totalMissing > 0 ? 'error' : 'default'} />
    <MetricCard title="Exceptions" value={String(kpis.totalExceptions)} icon={AlertTriangle} variant={kpis.totalExceptions > 0 ? 'warning' : 'default'} />
    <MetricCard title="$ Missing" value={fmt(kpis.missingAmount)} icon={DollarSign} variant={kpis.missingAmount > 0 ? 'error' : 'default'} />
    <MetricCard title="$ Delta" value={fmt(kpis.deltaAmount)} icon={DollarSign} />
  </div>
);
