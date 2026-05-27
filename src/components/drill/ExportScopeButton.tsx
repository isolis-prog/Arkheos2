import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useDrillAudit } from '@/hooks/useDrillAudit';

export interface ExportScopeButtonProps {
  module: string;
  level: number;
  scope: Record<string, unknown>;
  estimatedRowCount?: number;
  disabled?: boolean;
}

interface ExportResponse {
  success?: boolean;
  signedUrl?: string;
  downloadUrl?: string;
  message?: string;
  async?: boolean;
  jobId?: string;
  error?: string;
}

type JobPhase = 'idle' | 'submitting' | 'queued' | 'running' | 'finalizing' | 'completed' | 'failed';

interface JobProgressState {
  phase: JobPhase;
  progress: number;
  label: string;
}

const PHASE_LABEL: Record<JobPhase, string> = {
  idle: 'Idle',
  submitting: 'Submitting export request…',
  queued: 'Queued — waiting for a worker…',
  running: 'Generating file…',
  finalizing: 'Finalizing & uploading…',
  completed: 'Ready',
  failed: 'Failed',
};

async function pollJob(
  jobId: string,
  signal: AbortSignal,
  onUpdate: (state: JobProgressState) => void,
): Promise<ExportResponse> {
  // Poll background_jobs every 2s, up to 5 minutes.
  const deadline = Date.now() + 5 * 60_000;
  while (Date.now() < deadline) {
    if (signal.aborted) throw new Error('Polling aborted');
    const { data, error } = await supabase
      .from('background_jobs')
      .select('status, progress, result, error_message')
      .eq('id', jobId)
      .maybeSingle();
    if (error) throw error;

    const rawProgress = typeof data?.progress === 'number' ? data.progress : 0;
    const clamped = Math.min(95, Math.max(15, rawProgress));

    if (data?.status === 'stale') {
      onUpdate({ phase: 'queued', progress: 15, label: PHASE_LABEL.queued });
    } else if (data?.status === 'running') {
      const phase: JobPhase = clamped >= 85 ? 'finalizing' : 'running';
      onUpdate({ phase, progress: clamped, label: PHASE_LABEL[phase] });
    } else if (data?.status === 'completed') {
      onUpdate({ phase: 'completed', progress: 100, label: PHASE_LABEL.completed });
      return (data.result ?? {}) as ExportResponse;
    } else if (data?.status === 'failed' || data?.status === 'cancelled') {
      throw new Error(data.error_message ?? 'Export job failed');
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('Export job timed out');
}

const INITIAL_PROGRESS: JobProgressState = { phase: 'idle', progress: 0, label: PHASE_LABEL.idle };

export function ExportScopeButton({ module, level, scope, estimatedRowCount, disabled }: ExportScopeButtonProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [includeAuditTrail, setIncludeAuditTrail] = useState(true);
  const [includeNarrative, setIncludeNarrative] = useState(true);
  const [jobState, setJobState] = useState<JobProgressState>(INITIAL_PROGRESS);
  const { logDrillEvent } = useDrillAudit();

  const scopePath = useMemo(
    () =>
      Object.entries(scope).map(([key, value], index) => ({
        level: index,
        label: key,
        scope: { [key]: value },
        href: `${key}:${String(value)}`,
      })),
    [scope],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      setJobState({ phase: 'submitting', progress: 5, label: PHASE_LABEL.submitting });

      const { data, error } = await supabase.functions.invoke('export-module-scope', {
        body: {
          module,
          level,
          scope,
          options: { format, includeAuditTrail, includeNarrative },
          estimatedRowCount,
        },
      });

      if (error) {
        throw error;
      }

      let response = (data ?? {}) as ExportResponse;

      // Async path: poll background_jobs until completion and reflect each phase.
      if (response.async && response.jobId) {
        setJobState({ phase: 'queued', progress: 15, label: PHASE_LABEL.queued });
        toast.info('Export is taking longer than expected', {
          description: 'You can keep this dialog open — we will surface progress here.',
        });
        response = await pollJob(response.jobId, new AbortController().signal, setJobState);
      } else {
        // Sync path completed in one round-trip.
        setJobState({ phase: 'finalizing', progress: 90, label: PHASE_LABEL.finalizing });
      }

      await logDrillEvent({
        module,
        action: 'export',
        drillPath: scopePath,
        scopeFilters: scope,
        targetLevel: level,
        rowCount: estimatedRowCount,
      });

      return response;
    },
    onSuccess: (data) => {
      setJobState({ phase: 'completed', progress: 100, label: PHASE_LABEL.completed });
      const url = data.signedUrl ?? data.downloadUrl;
      toast.success('Scope export is ready', {
        description: data.message ?? 'The file has been generated successfully.',
        action: url
          ? {
              label: 'Download',
              onClick: () => window.open(url, '_blank', 'noopener,noreferrer'),
            }
          : undefined,
      });
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      setTimeout(() => {
        setOpen(false);
        setJobState(INITIAL_PROGRESS);
      }, 600);
    },
    onError: (error) => {
      setJobState({ phase: 'failed', progress: 0, label: PHASE_LABEL.failed });
      toast.error('Export failed', {
        description: error.message,
      });
    },
  });

  // Reset progress whenever the dialog closes between runs.
  useEffect(() => {
    if (!open && !mutation.isPending) {
      setJobState(INITIAL_PROGRESS);
    }
  }, [open, mutation.isPending]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Download className="h-4 w-4" />
          Export scope
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export drill scope</DialogTitle>
          <DialogDescription>Package the current level with the exact filter scope and optional audit context.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Estimated rows</span>
              <span className="font-mono text-foreground">{estimatedRowCount?.toLocaleString() ?? 'Unknown'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="export-format">Format</Label>
            <Select value={format} onValueChange={(value: 'xlsx' | 'csv') => setFormat(value)}>
              <SelectTrigger id="export-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">XLSX</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 rounded-md border px-3 py-3">
              <Checkbox checked={includeAuditTrail} onCheckedChange={(checked) => setIncludeAuditTrail(Boolean(checked))} />
              <div>
                <p className="text-sm font-medium text-foreground">Include audit trail</p>
                <p className="text-sm text-muted-foreground">Append the exact navigation context used to generate the export.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-md border px-3 py-3">
              <Checkbox checked={includeNarrative} onCheckedChange={(checked) => setIncludeNarrative(Boolean(checked))} />
              <div>
                <p className="text-sm font-medium text-foreground">Include AI-generated narrative</p>
                <p className="text-sm text-muted-foreground">Add a short interpretation for external reviewers.</p>
              </div>
            </label>
          </div>

          {(mutation.isPending || jobState.phase === 'failed') && (
            <div className="space-y-2" role="status" aria-live="polite">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{jobState.label}</span>
                <span className="font-mono text-foreground">{jobState.progress}%</span>
              </div>
              <Progress value={jobState.progress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            Confirm export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
