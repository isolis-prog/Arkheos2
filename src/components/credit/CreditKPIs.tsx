import { MetricCard } from '@/components/ui/metric-card';
import { DollarSign, AlertTriangle, TrendingUp, Clock, ShieldAlert, Target, PauseCircle, FileWarning } from 'lucide-react';

interface Props {
  kpis: {
    totalNetExposure: number;
    totalLimits: number;
    totalHeadroom: number;
    breachCount: number;
    openAlerts: number;
    avgDso: number;
    avgUtilisation: number;
    totalOverdue: number;
    totalDisputes: number;
    holdsCount: number;
    redCount: number;
  };
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

export const CreditKPIs = ({ kpis }: Props) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
    <MetricCard title="Net Exposure" value={fmt(kpis.totalNetExposure)} icon={DollarSign} />
    <MetricCard title="Headroom" value={fmt(kpis.totalHeadroom)} icon={TrendingUp} />
    <MetricCard title="Utilisation" value={`${kpis.avgUtilisation}%`} icon={Target} variant={kpis.avgUtilisation > 80 ? 'warning' : 'default'} />
    <MetricCard title="AR Overdue" value={fmt(kpis.totalOverdue)} icon={Clock} variant={kpis.totalOverdue > 5000000 ? 'warning' : 'default'} />
    <MetricCard title="Disputes" value={fmt(kpis.totalDisputes)} icon={FileWarning} variant={kpis.totalDisputes > 1000000 ? 'warning' : 'default'} />
    <MetricCard title="Holds" value={String(kpis.holdsCount)} icon={PauseCircle} variant={kpis.holdsCount > 0 ? 'error' : 'default'} />
    <MetricCard title="Red Flags" value={String(kpis.redCount)} icon={AlertTriangle} variant={kpis.redCount > 0 ? 'error' : 'default'} />
    <MetricCard title="Avg DSO" value={`${kpis.avgDso}d`} icon={ShieldAlert} />
  </div>
);
