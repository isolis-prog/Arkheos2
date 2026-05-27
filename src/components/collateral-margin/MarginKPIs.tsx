import { MetricCard } from '@/components/ui/metric-card';
import { Shield, AlertTriangle, ArrowUpDown, Landmark, TrendingDown, DollarSign } from 'lucide-react';

interface Props {
  kpis: {
    totalPosted: number;
    totalHeld: number;
    totalDelta: number;
    openDisputes: number;
    totalMarginCall: number;
    glDelta: number;
  };
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

export const MarginKPIs = ({ kpis }: Props) => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
    <MetricCard title="Collateral Posted" value={fmt(kpis.totalPosted)} icon={Shield} variant="info" />
    <MetricCard title="Collateral Held" value={fmt(kpis.totalHeld)} icon={Landmark} variant="default" />
    <MetricCard title="Pending Margin Calls" value={fmt(kpis.totalMarginCall)} icon={ArrowUpDown} variant="warning" />
    <MetricCard title="Total Δ (IM+VM)" value={fmt(kpis.totalDelta)} icon={TrendingDown} variant={kpis.totalDelta > 0 ? 'error' : 'success'} />
    <MetricCard title="Open Disputes" value={kpis.openDisputes} icon={AlertTriangle} variant={kpis.openDisputes > 0 ? 'error' : 'success'} />
    <MetricCard title="GL Tie-out Δ" value={fmt(kpis.glDelta)} icon={DollarSign} variant={kpis.glDelta > 0 ? 'warning' : 'success'} />
  </div>
);
