import { MetricCard } from '@/components/ui/metric-card';
import { Map, CheckCircle, Clock, Target, Percent } from 'lucide-react';

interface Props {
  totalMappings: number;
  activeMappings: number;
  pendingApproval: number;
  avgConfidence: number;
  matchRate: number;
}

export const MappingKPIs = ({ totalMappings, activeMappings, pendingApproval, avgConfidence, matchRate }: Props) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
    <MetricCard title="Total Mappings" value={totalMappings} icon={Map} />
    <MetricCard title="Active" value={activeMappings} icon={CheckCircle} />
    <MetricCard title="Pending Approval" value={pendingApproval} icon={Clock} />
    <MetricCard title="Avg Confidence" value={`${avgConfidence}%`} icon={Target} />
    <MetricCard title="Match Rate" value={`${matchRate}%`} icon={Percent} />
  </div>
);
