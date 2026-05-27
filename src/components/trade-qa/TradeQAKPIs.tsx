import { MetricCard } from '@/components/ui/metric-card';
import { ShieldCheck, ShieldAlert, AlertTriangle, UserX } from 'lucide-react';

interface Props {
  stats: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    passRate: number;
    criticalViolations: number;
    unassigned: number;
  };
}

export const TradeQAKPIs = ({ stats }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <MetricCard title="Pass Rate" value={`${stats.passRate}%`} subtitle={`${stats.passed} of ${stats.total} trades`} icon={ShieldCheck} />
    <MetricCard title="Failed" value={stats.failed} subtitle="Trades blocked" icon={ShieldAlert} />
    <MetricCard title="Critical Violations" value={stats.criticalViolations} subtitle="Require immediate fix" icon={AlertTriangle} />
    <MetricCard title="Unassigned Failures" value={stats.unassigned} subtitle="Need owner assignment" icon={UserX} />
  </div>
);
