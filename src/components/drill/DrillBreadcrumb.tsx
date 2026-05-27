import { ChevronRight, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { DrillPathNode } from './types';

export interface DrillBreadcrumbProps {
  path: DrillPathNode[];
  onNavigate: (node: DrillPathNode) => void;
  onBackToParent?: () => void;
}

function collapsePath(path: DrillPathNode[]) {
  if (path.length <= 5) {
    return { leading: path.slice(0, -1), collapsed: [] as DrillPathNode[], trailing: path.slice(-1) };
  }

  return {
    leading: path.slice(0, 2),
    collapsed: path.slice(2, -2),
    trailing: path.slice(-2),
  };
}

export function DrillBreadcrumb({ path, onNavigate, onBackToParent }: DrillBreadcrumbProps) {
  if (path.length === 0) {
    return null;
  }

  const { leading, collapsed, trailing } = collapsePath(path);
  const segments = [...leading, ...trailing];
  const activeHref = path[path.length - 1]?.href;

  return (
    <nav aria-label="Drill breadcrumb" className="flex min-w-0 items-center gap-2 overflow-hidden">
      {segments.map((node, index) => {
        const isFirstTrailing = collapsed.length > 0 && index === leading.length;
        const isActive = node.href === activeHref;

        return (
          <div key={node.href} className="flex min-w-0 items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
            {isFirstTrailing && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Mostrar niveles intermedios"
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-border bg-muted px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Expandir breadcrumb</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {onBackToParent && path.length > 1 && (
                      <DropdownMenuItem onClick={onBackToParent}>Back to parent level</DropdownMenuItem>
                    )}
                    {collapsed.map((collapsedNode) => (
                      <DropdownMenuItem key={collapsedNode.href} onClick={() => onNavigate(collapsedNode)}>
                        {collapsedNode.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </>
            )}
            {isActive ? (
              <span
                className="inline-flex min-w-0 max-w-[18rem] items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                title={node.label}
              >
                <span className="truncate">{node.label}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(node)}
                className={cn(
                  'inline-flex min-w-0 max-w-[14rem] items-center rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
                title={node.label}
              >
                <span className="truncate">{node.label}</span>
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
