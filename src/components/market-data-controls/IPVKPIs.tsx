import { MetricCard } from '@/components/ui/metric-card';
import { CheckCircle, AlertTriangle, Clock, Zap, Shield, PenLine } from 'lucide-react';

interface Props {
  stats: { total: number; withinTolerancePct: number; breaches: number; staleCount: number; spikeCount: number; overriddenCount: number; frozenCount: number; };
}

export const IPVKPIs = ({ stats }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
    <MetricCard title="Within Tolerance" value={`${stats.withinTolerancePct}%`} subtitle={`${stats.total} price points`} icon={CheckCircle} />
    <MetricCard title="Breaches" value={stats.breaches} subtitle="Out of tolerance" icon={AlertTriangle} />
    <MetricCard title="Stale Data" value={stats.staleCount} subtitle="Not updated" icon={Clock} />
    <MetricCard title="Spikes" value={stats.spikeCount} subtitle="Z-score > threshold" icon={Zap} />
    <MetricCard title="Overrides" value={stats.overriddenCount} subtitle="Manual adjustments" icon={PenLine} />
    <MetricCard title="Frozen" value={stats.frozenCount} subtitle="Locked for close" icon={Shield} />
  </div>
);
