import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ExternalLink, FileSearch, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, getStatusVariant, getBreakVariant } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { withDrillContext } from '@/lib/drill-context-url';
import {
  useTradeReconciliationHistory,
  type TradeReconciliationEvent,
} from '@/hooks/useTradeReconciliationHistory';

interface ReconciliationContextTabProps {
  dealId: string;
  drillContextParam?: string | null;
}

function formatCurrency(value: number, currency: string | null = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency ?? 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ReconciliationContextTab({ dealId, drillContextParam }: ReconciliationContextTabProps) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useTradeReconciliationHistory(dealId);

  const navigateToL6 = (event: TradeReconciliationEvent) => {
    if (!event.l6Href) return;
    navigate(withDrillContext(event.l6Href, drillContextParam));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-6 text-sm text-destructive">
          <AlertCircle className="h-5 w-5" />
          Failed to load reconciliation history.
        </CardContent>
      </Card>
    );
  }

  if (!data.hasHistory) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <FileSearch className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            This trade has not been part of any reconciliation run yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { summary, events } = data;

  return (
    <div className="space-y-6">
      {/* Summary metrics */}
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryTile label="Total breaks" value={summary.totalBreaksCount.toString()} />
        <SummaryTile
          label="Currently open"
          value={summary.currentlyOpenBreaks.toString()}
          tone={summary.currentlyOpenBreaks > 0 ? 'destructive' : 'default'}
        />
        <SummaryTile
          label="Total exposure"
          value={formatCurrency(summary.totalExposureUsd, 'USD')}
        />
        <SummaryTile
          label="Oldest open (days)"
          value={summary.oldestOpenBreakAgeDays?.toString() ?? '—'}
          tone={
            summary.oldestOpenBreakAgeDays !== null && summary.oldestOpenBreakAgeDays > 30
              ? 'warning'
              : 'default'
          }
        />
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Reconciliation timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-4 border-l border-border pl-6">
            {events.map((event) => (
              <li key={event.id} className="relative">
                <span
                  className={cn(
                    'absolute -left-[29px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-background',
                    event.type === 'break' ? 'bg-destructive' : 'bg-success',
                  )}
                  aria-hidden
                >
                  {event.type === 'break' ? (
                    <AlertCircle className="h-3 w-3 text-destructive-foreground" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 text-success-foreground" />
                  )}
                </span>
                <div className="rounded-md border border-border bg-card p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {formatDate(event.runStartedAt)}
                      </span>
                      {event.templateName && (
                        <span className="text-xs text-muted-foreground">
                          · {event.templateName}
                        </span>
                      )}
                      {event.type === 'break' && event.breakCategory && (
                        <StatusBadge variant={getBreakVariant(event.breakCategory)}>
                          {event.breakCategory.replace(/_/g, ' ')}
                        </StatusBadge>
                      )}
                      {event.type === 'matched' && (
                        <StatusBadge variant="success">Matched</StatusBadge>
                      )}
                      {event.status && event.type === 'break' && (
                        <StatusBadge variant={getStatusVariant(event.status)}>
                          {event.status.replace(/_/g, ' ')}
                        </StatusBadge>
                      )}
                    </div>
                    {event.l6Href && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateToL6(event)}
                        className="h-7 gap-1 text-xs"
                      >
                        Open in run
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {event.type === 'break' && event.amountDelta !== null && (
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
                      <span className="text-muted-foreground">
                        Δ amount:{' '}
                        <span className="font-mono text-foreground">
                          {formatCurrency(event.amountDelta, event.currency)}
                        </span>
                      </span>
                      {event.amountDeltaPct !== null && (
                        <span className="text-muted-foreground">
                          Δ%:{' '}
                          <span className="font-mono text-foreground">
                            {event.amountDeltaPct.toFixed(2)}%
                          </span>
                        </span>
                      )}
                      {event.docId && (
                        <span className="text-muted-foreground">
                          Doc:{' '}
                          <span className="font-mono text-foreground">{event.docId}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

interface SummaryTileProps {
  label: string;
  value: string;
  tone?: 'default' | 'destructive' | 'warning';
}

function SummaryTile({ label, value, tone = 'default' }: SummaryTileProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p
          className={cn(
            'mt-2 font-mono text-2xl font-semibold',
            tone === 'destructive' && 'text-destructive',
            tone === 'warning' && 'text-warning',
            tone === 'default' && 'text-foreground',
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
