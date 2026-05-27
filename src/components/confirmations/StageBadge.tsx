import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';

const STAGE_LABELS: Record<string, string> = {
  matched: 'Matched',
  disputed: 'Disputed',
  awaiting_counterparty: 'Awaiting counterparty',
  awaiting_us: 'Awaiting us',
  amended: 'Amended',
  cancelled: 'Cancelled',
};

const STAGE_VARIANTS: Record<string, Parameters<typeof StatusBadge>[0]['variant']> = {
  matched: 'success',
  disputed: 'error',
  awaiting_counterparty: 'warning',
  awaiting_us: 'info',
  amended: 'default',
  cancelled: 'muted',
};

interface StageBadgeProps {
  stage: string;
  compact?: boolean;
  className?: string;
}

export function StageBadge({ stage, compact, className }: StageBadgeProps) {
  const label = STAGE_LABELS[stage] ?? stage.replace(/_/g, ' ');
  const variant = STAGE_VARIANTS[stage] ?? 'default';
  return (
    <StatusBadge variant={variant} className={cn(compact && 'text-[10px] px-1.5 py-0.5', className)}>
      {label}
    </StatusBadge>
  );
}
