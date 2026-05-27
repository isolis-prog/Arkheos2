import { MetricCard } from '@/components/ui/metric-card';
import { Gauge, AlertTriangle, Scale, DollarSign } from 'lucide-react';

interface Props {
  kpis: { totalDelta: number; shrinkRate: number; pending: number; disputed: number; totalResults: number };
}

export const MeasurementsKPIs = ({ kpis }: Props) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <MetricCard
      title="Shrink Rate"
      value={`${kpis.shrinkRate}%`}
      subtitle="Across all commodities"
      icon={Gauge}
      variant={kpis.shrinkRate > 1 ? 'warning' : 'success'}
    />
    <MetricCard
      title="Imbalance Impact"
      value={`$${(kpis.totalDelta / 1000).toFixed(0)}K`}
      subtitle={`${kpis.totalResults} reconciled events`}
      icon={DollarSign}
      variant={kpis.totalDelta > 100000 ? 'error' : 'warning'}
    />
    <MetricCard
      title="Pending"
      value={kpis.pending}
      subtitle="Awaiting investigation"
      icon={Scale}
      variant={kpis.pending > 0 ? 'warning' : 'success'}
    />
    <MetricCard
      title="Disputed"
      value={kpis.disputed}
      subtitle="With counterparty"
      icon={AlertTriangle}
      variant={kpis.disputed > 0 ? 'error' : 'success'}
    />
  </div>
);
