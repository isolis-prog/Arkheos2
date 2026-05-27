import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DrillScope } from './types';

export interface ScopeHeaderProps {
  scope: DrillScope;
  onRemove?: (key: string) => void;
  onReset?: () => void;
}

export function ScopeHeader({ scope, onRemove, onReset }: ScopeHeaderProps) {
  const entries = Object.entries(scope);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {entries.map(([key, item]) => {
        const removable = Boolean(item.removable && onRemove);
        return (
          <div
            key={key}
            className={cn(
              'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm',
              removable
                ? 'border-border bg-muted text-muted-foreground'
                : 'border-primary/20 bg-primary/10 text-foreground',
            )}
          >
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</span>
            <span className="font-medium text-foreground">{item.value}</span>
            {removable && (
              <button
                type="button"
                onClick={() => onRemove?.(key)}
                className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Quitar filtro ${item.label}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Reset scope
        </button>
      )}
    </div>
  );
}
