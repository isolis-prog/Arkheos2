import { CheckCircle2, AlertTriangle, FileEdit, DollarSign } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { CardSkeleton } from '@/components/ui/CardSkeleton';
import { formatDistanceToNow } from 'date-fns';

interface MetricsRowProps {
  matchRate: number;
  openExceptions: number;
  criticalExceptions: number;
  highExceptions: number;
  pendingAmendments: number;
  amountAtRisk: number;
  lastRunTime: string | null;
  loading?: boolean;
}

export function MetricsRow({
  matchRate,
  openExceptions,
  criticalExceptions,
  highExceptions,
  pendingAmendments,
  amountAtRisk,
  lastRunTime,
  loading,
}: MetricsRowProps) {
  if (loading) {
    return <CardSkeleton count={4} />;
  }

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const lastRunSubtitle = lastRunTime 
    ? `Last run: ${formatDistanceToNow(new Date(lastRunTime), { addSuffix: true })}`
    : 'No recent runs';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Match Rate"
        value={`${matchRate.toFixed(1)}%`}
        subtitle={lastRunSubtitle}
        icon={CheckCircle2}
        variant={matchRate >= 90 ? 'success' : matchRate >= 80 ? 'warning' : 'error'}
      />
      <MetricCard
        title="Open Exceptions"
        value={openExceptions.toString()}
        subtitle={`${criticalExceptions} critical, ${highExceptions} high`}
        icon={AlertTriangle}
        variant={criticalExceptions > 0 ? 'error' : openExceptions > 0 ? 'warning' : 'success'}
      />
      <MetricCard
        title="Pending Amendments"
        value={pendingAmendments.toString()}
        subtitle="Awaiting approval"
        icon={FileEdit}
        variant={pendingAmendments > 0 ? 'info' : 'default'}
      />
      <MetricCard
        title="Amount at Risk"
        value={formatAmount(amountAtRisk)}
        subtitle="Across all open breaks"
        icon={DollarSign}
        variant={amountAtRisk > 100000 ? 'error' : amountAtRisk > 10000 ? 'warning' : 'default'}
      />
    </div>
  );
}
