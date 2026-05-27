import { MetricCard } from '@/components/ui/metric-card';
import { Boxes, Plug, GitBranch, CheckCircle } from 'lucide-react';

interface Props {
  kpis: { catalogSize: number; activeInstances: number; publishedMappings: number; jobSuccessRate: number };
}

export const IntStudioKPIs = ({ kpis }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <MetricCard title="Connectors Available" value={kpis.catalogSize} subtitle="In marketplace" icon={Boxes} variant="info" />
    <MetricCard title="Active Instances" value={kpis.activeInstances} subtitle="Connected & running" icon={Plug} variant="success" />
    <MetricCard title="Published Mappings" value={kpis.publishedMappings} subtitle="Ready for production" icon={GitBranch} variant="info" />
    <MetricCard title="Job Success Rate" value={`${kpis.jobSuccessRate}%`} subtitle="Last 24 hours" icon={CheckCircle} variant={kpis.jobSuccessRate >= 90 ? 'success' : 'warning'} />
  </div>
);
