import { MetricCard } from '@/components/ui/metric-card';
import { Package, TrendingUp, AlertTriangle, FileQuestion, Clock } from 'lucide-react';

interface Props {
  stats: {
    totalFlows: number;
    fulfillmentRate: number;
    breachCount: number;
    missingActuals: number;
    missingNominations: number;
    avgVariancePct: number;
  };
}

export const OpsActualsKPIs = ({ stats }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
    <MetricCard title="Fulfillment Rate" value={`${stats.fulfillmentRate}%`} subtitle={`${stats.totalFlows} flows tracked`} icon={TrendingUp} />
    <MetricCard title="Breaches" value={stats.breachCount} subtitle="Tolerance exceeded" icon={AlertTriangle} />
    <MetricCard title="Missing Actuals" value={stats.missingActuals} subtitle="No actual reported" icon={FileQuestion} />
    <MetricCard title="Missing Nominations" value={stats.missingNominations} subtitle="Not yet nominated" icon={Clock} />
    <MetricCard title="Avg Variance" value={`${stats.avgVariancePct}%`} subtitle="Actual vs planned" icon={Package} />
  </div>
);
