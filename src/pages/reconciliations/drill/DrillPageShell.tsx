import { type ReactNode, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, DatabaseZap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BreakDetailPanel, DrillBreadcrumb, ExportScopeButton, ScopeHeader, type BreakDetailView, type DrillPathNode, type DrillScope } from '@/components/drill';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface DrillPageShellProps {
  title: string;
  subtitle?: string;
  level: number;
  module: string;
  path: DrillPathNode[];
  scope: DrillScope;
  onBreadcrumbNavigate: (node: DrillPathNode) => void;
  onBackToParent: () => void;
  onRemoveScope?: (key: string) => void;
  onResetScope?: () => void;
  exportScope: Record<string, unknown>;
  estimatedRowCount?: number;
  actions?: ReactNode;
  children: ReactNode;
  detailBreak?: BreakDetailView | null;
  detailOpen?: boolean;
  onDetailClose?: () => void;
  onMarkResolved?: (breakId: string, note: string) => Promise<void>;
  onAddComment?: (breakId: string, comment: string) => Promise<void>;
  exportDisabled?: boolean;
  lockBanner?: ReactNode;
}

export function DrillPageShell({
  title,
  subtitle,
  level,
  module,
  path,
  scope,
  onBreadcrumbNavigate,
  onBackToParent,
  onRemoveScope,
  onResetScope,
  exportScope,
  estimatedRowCount,
  actions,
  children,
  detailBreak,
  detailOpen = false,
  onDetailClose,
  onMarkResolved,
  onAddComment,
  exportDisabled,
  lockBanner,
}: DrillPageShellProps) {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && detailOpen) {
        onDetailClose?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detailOpen, onDetailClose]);

  return (
    <>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
        className="space-y-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-4">
            <DrillBreadcrumb path={path} onNavigate={onBreadcrumbNavigate} onBackToParent={onBackToParent} />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
                <span className="inline-flex items-center rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Level {level}
                </span>
              </div>
              {subtitle && <p className="max-w-3xl text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <ScopeHeader scope={scope} onRemove={onRemoveScope} onReset={onResetScope} />
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {actions}
            <ExportScopeButton module={module} level={level} scope={exportScope} estimatedRowCount={estimatedRowCount} disabled={exportDisabled} />
          </div>
        </div>

        {lockBanner}
        {children}
      </motion.div>

      <BreakDetailPanel
        break={detailBreak ?? null}
        isOpen={detailOpen}
        onClose={() => onDetailClose?.()}
        onMarkResolved={onMarkResolved}
        onAddComment={onAddComment}
      />
    </>
  );
}

export function DrillPageEmptyState({ title = 'No breaks in this scope', description = 'Try a broader scope or move back to the previous drill level.' }: { title?: string; description?: string }) {
  return (
    <Card className="rounded-lg border-dashed">
      <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-md bg-muted p-3 text-muted-foreground">
          <DatabaseZap className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-foreground">{title}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DrillPageLoadingSkeleton({ rows = 8, chart = false }: { rows?: number; chart?: boolean }) {
  return (
    <div className="space-y-4">
      {chart && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-[280px] w-full rounded-lg" />
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </div>
      )}
      <div className="rounded-lg border bg-card p-4">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
