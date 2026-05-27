import { MetricCard } from '@/components/ui/metric-card';
import { Activity, AlertTriangle, ShieldAlert, BookOpen } from 'lucide-react';

interface Props {
  kpis: {
    overallScore: number;
    openIssues: number;
    criticalIssues: number;
    topRootCause: string;
    totalRules: number;
  };
}

export const DataHealthKPIs = ({ kpis }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <MetricCard
      title="Overall DQ Score"
      value={`${kpis.overallScore}%`}
      subtitle={`${kpis.totalRules} active rules`}
      icon={Activity}
      variant={kpis.overallScore >= 90 ? 'success' : kpis.overallScore >= 80 ? 'warning' : 'error'}
    />
    <MetricCard
      title="Open Issues"
      value={kpis.openIssues}
      subtitle="Pending remediation"
      icon={AlertTriangle}
      variant={kpis.openIssues > 5 ? 'error' : 'warning'}
    />
    <MetricCard
      title="Critical Issues"
      value={kpis.criticalIssues}
      subtitle="Immediate attention needed"
      icon={ShieldAlert}
      variant={kpis.criticalIssues > 0 ? 'error' : 'success'}
    />
    <MetricCard
      title="Top Root Cause"
      value={kpis.topRootCause.charAt(0).toUpperCase() + kpis.topRootCause.slice(1)}
      subtitle="Most frequent issue type"
      icon={BookOpen}
      variant="info"
    />
  </div>
);
