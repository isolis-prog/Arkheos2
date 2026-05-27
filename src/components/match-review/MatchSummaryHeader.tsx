import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReconciliationRunDetail } from '@/hooks/useMatchReviewData';

interface MatchSummaryHeaderProps {
  run: ReconciliationRunDetail | null | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function MatchSummaryHeader({ run, isLoading }: MatchSummaryHeaderProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Run not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/reconciliations">Back to Reconciliations</Link>
        </Button>
      </div>
    );
  }

  const metrics = run.metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/reconciliations">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{run.templateName}</h1>
            <StatusBadge variant={getStatusVariant(run.status)}>
              {run.status}
            </StatusBadge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {run.periodStart && run.periodEnd && (
              <>Period: {run.periodStart} to {run.periodEnd} • </>
            )}
            {run.startedAt && (
              <>Started: {format(new Date(run.startedAt), 'MMM d, yyyy h:mm a')}</>
            )}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <SummaryCard
          label="Match Rate"
          value={`${metrics.match_rate?.toFixed(1) || 0}%`}
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
        />
        <SummaryCard
          label="Matched"
          value={metrics.matched?.toLocaleString() || '0'}
          sublabel={`of ${(metrics.total_side_a || 0).toLocaleString()} records`}
          icon={<CheckCircle className="h-5 w-5" />}
          variant="default"
        />
        <SummaryCard
          label="Breaks"
          value={metrics.breaks?.toLocaleString() || '0'}
          icon={<XCircle className="h-5 w-5" />}
          variant="error"
        />
        <SummaryCard
          label="Amount at Risk"
          value={formatCurrency(metrics.amount_at_risk || 0)}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="warning"
        />
        <SummaryCard
          label="Side B Records"
          value={(metrics.total_side_b || 0).toLocaleString()}
          icon={<Clock className="h-5 w-5" />}
          variant="default"
        />
      </div>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
  variant: 'default' | 'success' | 'error' | 'warning';
}

function SummaryCard({ label, value, sublabel, icon, variant }: SummaryCardProps) {
  const variantStyles = {
    default: 'bg-card border',
    success: 'bg-success/10 border-success/20',
    error: 'bg-destructive/10 border-destructive/20',
    warning: 'bg-warning/10 border-warning/20',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-success',
    error: 'text-destructive',
    warning: 'text-warning',
  };

  return (
    <div className={`rounded-lg border p-4 ${variantStyles[variant]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={iconStyles[variant]}>{icon}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold font-mono">{value}</p>
      {sublabel && (
        <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
      )}
    </div>
  );
}
