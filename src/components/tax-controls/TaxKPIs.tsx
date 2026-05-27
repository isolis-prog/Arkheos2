import { MetricCard } from '@/components/ui/metric-card';
import { CheckCircle2, AlertTriangle, XCircle, DollarSign, MapPin, Percent } from 'lucide-react';

interface Props {
  kpis: {
    totalCalcs: number;
    matched: number;
    deltas: number;
    missing: number;
    totalDelta: number;
    openExceptions: number;
    topJurisdiction: string;
  };
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

export const TaxKPIs = ({ kpis }: Props) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
    <MetricCard title="Match Rate" value={`${Math.round((kpis.matched / kpis.totalCalcs) * 1000) / 10}%`} icon={Percent} variant={kpis.matched / kpis.totalCalcs >= 0.9 ? 'success' : 'warning'} />
    <MetricCard title="Matched" value={String(kpis.matched)} icon={CheckCircle2} variant="success" />
    <MetricCard title="Deltas" value={String(kpis.deltas)} icon={AlertTriangle} variant={kpis.deltas > 0 ? 'warning' : 'default'} />
    <MetricCard title="Missing" value={String(kpis.missing)} icon={XCircle} variant={kpis.missing > 0 ? 'error' : 'default'} />
    <MetricCard title="$ Tax Delta" value={fmt(kpis.totalDelta)} icon={DollarSign} variant={kpis.totalDelta > 10000 ? 'error' : 'default'} />
    <MetricCard title="Open Exceptions" value={String(kpis.openExceptions)} icon={AlertTriangle} />
    <MetricCard title="Top Jurisdiction" value={kpis.topJurisdiction} icon={MapPin} />
  </div>
);
