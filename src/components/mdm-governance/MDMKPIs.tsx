import { MetricCard } from '@/components/ui/metric-card';
import { Map, AlertTriangle, ShieldAlert, GitPullRequest, CheckCircle } from 'lucide-react';

interface Props {
  stats: {
    avgCoverage: number;
    openIssues: number;
    criticalGaps: number;
    pendingRequests: number;
    totalImpactedTrades: number;
    closeReady: boolean;
  };
}

export const MDMKPIs = ({ stats }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
    <MetricCard title="Avg Coverage" value={`${stats.avgCoverage}%`} subtitle="Across all categories" icon={Map} />
    <MetricCard title="Open Issues" value={stats.openIssues} subtitle="Gaps to resolve" icon={AlertTriangle} />
    <MetricCard title="Critical Gaps" value={stats.criticalGaps} subtitle="Blocking close" icon={ShieldAlert} />
    <MetricCard title="Pending Requests" value={stats.pendingRequests} subtitle="Awaiting approval" icon={GitPullRequest} />
    <MetricCard title="Close Ready" value={stats.closeReady ? 'YES' : 'NO'} subtitle={stats.closeReady ? 'Coverage ≥ 90%' : `${stats.totalImpactedTrades} trades impacted`} icon={CheckCircle} />
  </div>
);
