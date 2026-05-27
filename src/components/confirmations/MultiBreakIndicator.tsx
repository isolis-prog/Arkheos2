import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface MultiBreakCounts {
  reconciliation?: number;
  cashflow?: number;
  valuation?: number;
  confirmation?: number;
}

interface MultiBreakIndicatorProps {
  counts: MultiBreakCounts;
  className?: string;
}

const MODULES: Array<{ key: keyof MultiBreakCounts; label: string; color: string }> = [
  { key: 'reconciliation', label: 'Recon', color: 'bg-info text-info-foreground' },
  { key: 'cashflow', label: 'Cash', color: 'bg-warning text-warning-foreground' },
  { key: 'valuation', label: 'Val', color: 'bg-primary text-primary-foreground' },
  { key: 'confirmation', label: 'Conf', color: 'bg-destructive text-destructive-foreground' },
];

export function MultiBreakIndicator({ counts, className }: MultiBreakIndicatorProps) {
  const total = MODULES.reduce((s, m) => s + (counts[m.key] ?? 0), 0);
  if (total === 0) {
    return (
      <span className={cn('inline-flex items-center rounded-md bg-success/10 px-2 py-0.5 text-xs text-success', className)}>
        No breaks
      </span>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn('inline-flex items-center gap-1', className)}>
        {MODULES.map((m) => {
          const count = counts[m.key] ?? 0;
          if (count === 0) return null;
          return (
            <Tooltip key={m.key}>
              <TooltipTrigger asChild>
                <span
                  data-testid={`multi-break-${m.key}`}
                  className={cn(
                    'inline-flex min-w-[2.25rem] items-center justify-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                    m.color,
                  )}
                >
                  {m.label} {count}
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                {count} open break{count === 1 ? '' : 's'} in {m.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
