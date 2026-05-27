import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface BreakStatusBadgeProps {
  openBreaksCount: number;
  onClick?: () => void;
  className?: string;
}

export function BreakStatusBadge({ openBreaksCount, onClick, className }: BreakStatusBadgeProps) {
  if (openBreaksCount <= 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      aria-label={`${openBreaksCount} open reconciliation breaks`}
    >
      <Badge variant="destructive" className="gap-1.5 cursor-pointer">
        <AlertTriangle className="h-3 w-3" />
        <span className="font-mono">{openBreaksCount}</span>
        <span>open break{openBreaksCount === 1 ? '' : 's'}</span>
      </Badge>
    </button>
  );
}
