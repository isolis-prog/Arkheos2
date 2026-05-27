import { useMemo } from 'react';
import { AlertTriangle, ShieldAlert, Timer } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

interface SLABreachBadgeProps {
  slaBreachAt: string | null;
  blockingSettlement?: boolean;
  className?: string;
}

function formatRelative(target: Date, now: Date): { text: string; breached: boolean; approaching: boolean } {
  const diffMs = target.getTime() - now.getTime();
  const breached = diffMs < 0;
  const approaching = !breached && diffMs < 4 * 60 * 60 * 1000;
  const absMs = Math.abs(diffMs);
  const hours = Math.floor(absMs / 3_600_000);
  const minutes = Math.floor((absMs % 3_600_000) / 60_000);
  const text = hours >= 24 ? `${Math.floor(hours / 24)}d` : hours >= 1 ? `${hours}h` : `${minutes}m`;
  return { text, breached, approaching };
}

export function SLABreachBadge({ slaBreachAt, blockingSettlement, className }: SLABreachBadgeProps) {
  const computed = useMemo(() => {
    if (!slaBreachAt) return null;
    return formatRelative(new Date(slaBreachAt), new Date());
  }, [slaBreachAt]);

  if (!computed && !blockingSettlement) {
    return (
      <StatusBadge variant="muted" className={className}>
        No SLA
      </StatusBadge>
    );
  }

  const tooltipText = slaBreachAt
    ? `SLA target: ${new Date(slaBreachAt).toLocaleString()}\nApplied policy: T+1 default for IR / 24h for FX spot.`
    : 'Settlement currently blocked by an open material discrepancy.';

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center gap-1', className)}>
            {blockingSettlement && (
              <StatusBadge variant="error">
                <ShieldAlert className="mr-1 h-3 w-3" />
                Blocking
              </StatusBadge>
            )}
            {computed?.breached && (
              <StatusBadge variant="error">
                <AlertTriangle className="mr-1 h-3 w-3" />
                SLA breached {computed.text} ago
              </StatusBadge>
            )}
            {computed && !computed.breached && computed.approaching && (
              <StatusBadge variant="warning">
                <Timer className="mr-1 h-3 w-3" />
                Due in {computed.text}
              </StatusBadge>
            )}
            {computed && !computed.breached && !computed.approaching && (
              <StatusBadge variant="info">
                <Timer className="mr-1 h-3 w-3" />
                Due in {computed.text}
              </StatusBadge>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs whitespace-pre-line text-xs">{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
