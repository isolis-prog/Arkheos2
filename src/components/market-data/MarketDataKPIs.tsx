import { MetricCard } from '@/components/ui/metric-card';
import { Activity, AlertTriangle, Lock, DollarSign, Clock, TrendingUp } from 'lucide-react';

interface MarketDataKPIsProps {
  kpis: {
    totalCurves: number;
    openExceptions: number;
    totalOutliers: number;
    lockedPct: number;
    estimatedMtmImpact: number;
    staleCount: number;
  };
}

const formatCurrency = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

export const MarketDataKPIs = ({ kpis }: MarketDataKPIsProps) => (
  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
    <MetricCard title="Active Curves" value={kpis.totalCurves} icon={TrendingUp} />
    <MetricCard title="Open Exceptions" value={kpis.openExceptions} icon={AlertTriangle} subtitle={kpis.openExceptions > 0 ? 'Action required' : 'All clear'} />
    <MetricCard title="Outliers" value={kpis.totalOutliers} icon={Activity} />
    <MetricCard title="% Locked" value={`${kpis.lockedPct}%`} icon={Lock} />
    <MetricCard title="Est. MTM Impact" value={formatCurrency(kpis.estimatedMtmImpact)} icon={DollarSign} subtitle="Open exceptions" />
    <MetricCard title="Stale Feeds" value={kpis.staleCount} icon={Clock} />
  </div>
);
