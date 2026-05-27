import { MetricCard } from '@/components/ui/metric-card';
import { CalendarCheck, AlertTriangle, Clock, DollarSign } from 'lucide-react';

interface Props {
  kpis: { total: number; matched: number; breaks: number; onTimePct: number; estImpact: number };
}

export const SchedulingKPIs = ({ kpis }: Props) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <MetricCard
      title="Total Nominations"
      value={kpis.total}
      subtitle={`${kpis.matched} matched`}
      icon={CalendarCheck}
    />
    <MetricCard
      title="Breaks"
      value={kpis.breaks}
      subtitle="Require investigation"
      icon={AlertTriangle}
      variant={kpis.breaks > 0 ? 'error' : 'success'}
    />
    <MetricCard
      title="On-Time %"
      value={`${kpis.onTimePct}%`}
      subtitle="Nominations on schedule"
      icon={Clock}
      variant={kpis.onTimePct >= 90 ? 'success' : 'warning'}
    />
    <MetricCard
      title="Est. Impact"
      value={`$${(kpis.estImpact / 1000).toFixed(0)}K`}
      subtitle="From qty breaks"
      icon={DollarSign}
      variant={kpis.estImpact > 0 ? 'warning' : 'success'}
    />
  </div>
);
