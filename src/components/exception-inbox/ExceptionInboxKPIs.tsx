import { MetricCard } from '@/components/ui/metric-card';
import { AlertTriangle, AlertOctagon, Clock, DollarSign } from 'lucide-react';

interface Props {
  totalOpen: number;
  critical: number;
  slaOverdue: number;
  totalAmountAtRisk: number;
}

export const ExceptionInboxKPIs = ({ totalOpen, critical, slaOverdue, totalAmountAtRisk }: Props) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <MetricCard title="Open Cases" value={totalOpen} icon={AlertTriangle} />
    <MetricCard title="Critical" value={critical} icon={AlertOctagon} />
    <MetricCard title="SLA Overdue" value={slaOverdue} icon={Clock} />
    <MetricCard title="Amount at Risk" value={`$${(totalAmountAtRisk / 1000).toFixed(0)}K`} icon={DollarSign} />
  </div>
);
