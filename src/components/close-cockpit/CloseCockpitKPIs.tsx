import { MetricCard } from '@/components/ui/metric-card';
import { CloseCockpitSummary } from '@/hooks/useCloseCockpit';
import { CheckCircle2, AlertTriangle, Clock, ShieldCheck, Package, CalendarClock } from 'lucide-react';

interface Props {
  summary: CloseCockpitSummary;
}

export const CloseCockpitKPIs = ({ summary }: Props) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    <MetricCard
      title="Completion"
      value={`${summary.completionPct.toFixed(1)}%`}
      subtitle={`${summary.completedTasks}/${summary.totalTasks} tasks`}
      icon={CheckCircle2}
      variant={summary.isOnTrack ? 'success' : 'warning'}
    />
    <MetricCard
      title="Overdue Tasks"
      value={summary.overdueTasks}
      subtitle="Need attention"
      icon={Clock}
      variant={summary.overdueTasks > 0 ? 'error' : 'success'}
    />
    <MetricCard
      title="Blocked Tasks"
      value={summary.blockedTasks}
      subtitle="Pending resolution"
      icon={AlertTriangle}
      variant={summary.blockedTasks > 0 ? 'warning' : 'success'}
    />
    <MetricCard
      title="Sign-offs"
      value={`${summary.signoffsCompleted}/${summary.signoffsTotal}`}
      subtitle="Gate approvals"
      icon={ShieldCheck}
    />
    <MetricCard
      title="Close Packs"
      value={summary.packsReady}
      subtitle="Ready for export"
      icon={Package}
    />
    <MetricCard
      title="Days to Target"
      value={summary.daysToTarget}
      subtitle={summary.isOnTrack ? 'On track' : 'At risk'}
      icon={CalendarClock}
      variant={summary.isOnTrack ? 'info' : 'error'}
    />
  </div>
);
