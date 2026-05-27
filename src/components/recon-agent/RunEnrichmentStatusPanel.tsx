import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, Circle, Play, RotateCcw, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import {
  useDrillEnrichmentRunner,
  type EnrichmentStepState,
  type EnrichmentStepStatus,
} from '@/hooks/useDrillEnrichmentRunner';

interface Props {
  runId: string;
  onCompleted?: () => void;
}

const statusVariant: Record<EnrichmentStepStatus, 'success' | 'error' | 'info' | 'muted'> = {
  idle: 'muted',
  running: 'info',
  success: 'success',
  error: 'error',
};

const StatusIcon = ({ status }: { status: EnrichmentStepStatus }) => {
  if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin text-info" />;
  if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (status === 'error') return <AlertCircle className="h-4 w-4 text-destructive" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
};

const formatDuration = (ms: number | null) => {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

const formatMetricValue = (value: unknown): string => {
  if (value == null) return '—';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return `${value.length} items`;
  return JSON.stringify(value);
};

const StepRow = ({ step }: { step: EnrichmentStepState }) => {
  const metricsEntries = step.metrics ? Object.entries(step.metrics) : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border p-4 transition-colors',
        step.status === 'running' && 'border-info/40 bg-info/5',
        step.status === 'success' && 'border-success/30 bg-success/5',
        step.status === 'error' && 'border-destructive/40 bg-destructive/5',
        step.status === 'idle' && 'border-border bg-muted/20',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5"><StatusIcon status={step.status} /></div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{step.label}</span>
              <StatusBadge variant={statusVariant[step.status]} className="text-[10px] uppercase">
                {step.status}
              </StatusBadge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground whitespace-nowrap font-mono">
          {formatDuration(step.durationMs)}
        </div>
      </div>

      {step.error && (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive font-mono break-all">
          {step.error}
        </div>
      )}

      {metricsEntries.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {metricsEntries
            .filter(([k]) => k !== 'correlationId')
            .map(([k, v]) => (
              <div key={k} className="rounded-md border border-border/60 bg-background/60 px-2 py-1.5">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
                <div className="text-sm font-semibold tabular-nums truncate" title={formatMetricValue(v)}>
                  {formatMetricValue(v)}
                </div>
              </div>
            ))}
          {step.metrics?.correlationId !== undefined && (
            <div className="col-span-2 sm:col-span-3 text-[10px] text-muted-foreground font-mono truncate">
              correlation_id: {String(step.metrics.correlationId)}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export function RunEnrichmentStatusPanel({ runId, onCompleted }: Props) {
  const { steps, isRunning, runAll, runStep, reset } = useDrillEnrichmentRunner(runId);

  const completed = steps.filter((s) => s.status === 'success').length;
  const failed = steps.filter((s) => s.status === 'error').length;
  const total = steps.length;
  const progress = Math.round((completed / total) * 100);
  const allDone = !isRunning && completed + failed === total && completed + failed > 0;

  if (allDone && failed === 0 && onCompleted) onCompleted();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" />
            Run enrichment status
          </CardTitle>
          <CardDescription>
            Pipeline post-matching: enriquecer breaks, vincular docs↔trades y refrescar drill MVs.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reset} disabled={isRunning}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Reset
          </Button>
          <Button size="sm" onClick={runAll} disabled={isRunning || !runId}>
            {isRunning ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="mr-2 h-3.5 w-3.5" />
            )}
            Run pipeline
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {completed}/{total} ok
              {failed > 0 && <span className="text-destructive"> · {failed} failed</span>}
            </span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.key} className="space-y-2">
              <StepRow step={step} />
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => runStep(step.key)}
                  disabled={isRunning}
                >
                  Re-run step
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
