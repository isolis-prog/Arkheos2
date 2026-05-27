import { MetricCard } from '@/components/ui/metric-card';
import { Shield, CheckCircle, Clock, FileWarning, DollarSign, XCircle } from 'lucide-react';

interface Props {
  kpis: {
    activeRelationships: number;
    passRate: number;
    expiringSoon: number;
    docMissing: number;
    totalNotional: number;
    failedTests: number;
  };
}

const fmt = (v: number) => {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

export const HedgeKPIs = ({ kpis }: Props) => (
  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
    <MetricCard title="Active Relationships" value={kpis.activeRelationships} icon={Shield} />
    <MetricCard title="Test Pass Rate" value={`${kpis.passRate}%`} icon={CheckCircle} variant={kpis.passRate >= 90 ? 'success' : 'warning'} />
    <MetricCard title="Expiring ≤60d" value={kpis.expiringSoon} icon={Clock} variant={kpis.expiringSoon > 0 ? 'warning' : 'default'} />
    <MetricCard title="Doc Incomplete" value={kpis.docMissing} icon={FileWarning} variant={kpis.docMissing > 0 ? 'error' : 'success'} />
    <MetricCard title="Total Notional" value={fmt(kpis.totalNotional)} icon={DollarSign} />
    <MetricCard title="Failed Tests" value={kpis.failedTests} icon={XCircle} variant={kpis.failedTests > 0 ? 'error' : 'success'} />
  </div>
);
