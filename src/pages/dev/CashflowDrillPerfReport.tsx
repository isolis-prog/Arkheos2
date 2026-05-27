import { useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2, Play, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  buildPerfCsv,
  buildPerfHtml,
  downloadBlob,
  reportFilenameBase,
  type PerfReport,
} from '@/lib/perf/perfReport';

interface RecentRun {
  correlation_id: string;
  created_at: string;
  asOfDate?: string;
  seedCount?: number;
  iterations?: number;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function CashflowDrillPerfReport() {
  const [asOfDate, setAsOfDate] = useState<string>(today());
  const [seedCount, setSeedCount] = useState<number>(0);
  const [iterations, setIterations] = useState<number>(3);
  const [cleanupSeed, setCleanupSeed] = useState<boolean>(false);

  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<PerfReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [recent, setRecent] = useState<RecentRun[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const loadRecent = async () => {
    setLoadingRecent(true);
    try {
      const { data, error } = await supabase
        .from('structured_logs')
        .select('correlation_id, created_at, context, message')
        .eq('domain', 'perf.cashflow_drill')
        .eq('message', 'perf test started')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      const rows: RecentRun[] = (data ?? [])
        .filter((r) => r.correlation_id)
        .map((r) => {
          const ctx = (r.context ?? {}) as Record<string, unknown>;
          return {
            correlation_id: r.correlation_id as string,
            created_at: r.created_at,
            asOfDate: ctx.asOfDate as string | undefined,
            seedCount: ctx.seedCount as number | undefined,
            iterations: ctx.iterations as number | undefined,
          };
        });
      setRecent(rows);
    } catch (e) {
      // Non-fatal — just log
      console.warn('Failed to load recent perf runs', e);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    void loadRecent();
  }, []);

  const runPerfTest = async () => {
    setRunning(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke('perf-test-cashflow-drill', {
        body: {
          asOfDate,
          seedCount: Math.max(0, Math.min(500_000, Math.floor(seedCount))),
          iterations: Math.max(1, Math.min(10, Math.floor(iterations))),
          cleanupSeed,
        },
      });
      if (error) throw new Error(error.message);
      if (!data || typeof data !== 'object') throw new Error('Invalid response from perf test');
      const r = data as PerfReport;
      r.generatedAt = new Date().toISOString();
      setReport(r);
      toast.success('Perf test completed');
      void loadRecent();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Perf test failed';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  };

  const reconstructFromLogs = async (correlationId: string) => {
    setRunning(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('structured_logs')
        .select('message, context, created_at')
        .eq('domain', 'perf.cashflow_drill')
        .eq('correlation_id', correlationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const rec = buildReportFromLogs(correlationId, data ?? []);
      if (!rec) throw new Error('Insufficient log data to rebuild report');
      setReport(rec);
      toast.success('Report rebuilt from logs');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to rebuild report';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  };

  const filenameBase = useMemo(() => (report ? reportFilenameBase(report) : ''), [report]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Cashflows Drill — Performance Report"
        description="Run an audit-grade perf test of the cashflows drill stack and download HTML/CSV evidence to share with audit and control teams."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run parameters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
            <Label htmlFor="asOfDate">As-of date</Label>
            <Input id="asOfDate" type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="seedCount">Seed count</Label>
            <Input
              id="seedCount"
              type="number"
              min={0}
              max={500_000}
              step={1000}
              value={seedCount}
              onChange={(e) => setSeedCount(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="iterations">Iterations / RPC</Label>
            <Input
              id="iterations"
              type="number"
              min={1}
              max={10}
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="cleanupSeed"
              type="checkbox"
              checked={cleanupSeed}
              onChange={(e) => setCleanupSeed(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="cleanupSeed" className="cursor-pointer">
              Clean up seed rows
            </Label>
          </div>
          <Button onClick={runPerfTest} disabled={running} className="w-full md:w-auto">
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run perf test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {errorMsg && (
        <Alert variant="destructive">
          <AlertTitle>Perf test failed</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {report && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Latest result</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Correlation <code className="text-xs">{report.correlationId}</code> · As-of {report.asOfDate} ·{' '}
                {report.iterations} iterations · seed {report.seedCount.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadBlob(`${filenameBase}.html`, 'text/html;charset=utf-8', buildPerfHtml(report))}
              >
                <FileText className="mr-2 h-4 w-4" />
                Download HTML
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadBlob(`${filenameBase}.csv`, 'text/csv;charset=utf-8', buildPerfCsv(report))}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <SummaryTable report={report} />
            <Separator />
            <SamplesTable report={report} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent runs (last 20)</CardTitle>
          <Button size="sm" variant="ghost" onClick={loadRecent} disabled={loadingRecent}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingRecent ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loadingRecent ? (
            <Skeleton className="h-32 w-full" />
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent perf runs found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Started at</TableHead>
                  <TableHead>Correlation ID</TableHead>
                  <TableHead>As-of</TableHead>
                  <TableHead className="text-right">Seed</TableHead>
                  <TableHead className="text-right">Iters</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r) => (
                  <TableRow key={r.correlation_id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{r.correlation_id}</code>
                    </TableCell>
                    <TableCell>{r.asOfDate ?? '—'}</TableCell>
                    <TableCell className="text-right">{r.seedCount?.toLocaleString() ?? '—'}</TableCell>
                    <TableCell className="text-right">{r.iterations ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reconstructFromLogs(r.correlation_id)}
                        disabled={running}
                      >
                        <Download className="mr-2 h-3 w-3" />
                        Load report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const DRILL_ORDER = ['by_bucket', 'by_entity', 'by_counterparty', 'by_document'] as const;
const DRILL_LABEL: Record<string, string> = {
  by_bucket: 'L1 — Aging buckets',
  by_entity: 'L2 — Legal entity',
  by_counterparty: 'L3 — Counterparty',
  by_document: 'L4 — Document / trade',
};

function SummaryTable({ report }: { report: PerfReport }) {
  const refresh = report.refresh_cashflow_drill_mvs;
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">Refresh &amp; drill timing summary (ms)</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Operation</TableHead>
            <TableHead className="text-right">Runs</TableHead>
            <TableHead className="text-right">Min</TableHead>
            <TableHead className="text-right">p50</TableHead>
            <TableHead className="text-right">Avg</TableHead>
            <TableHead className="text-right">p95</TableHead>
            <TableHead className="text-right">Max</TableHead>
            <TableHead className="text-right">Rows</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">
              refresh_cashflow_drill_mvs <Badge variant="secondary">all 4 MVs</Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">{refresh.runs}</TableCell>
            <TableCell className="text-right tabular-nums">{refresh.min_ms}</TableCell>
            <TableCell className="text-right tabular-nums">{refresh.p50_ms}</TableCell>
            <TableCell className="text-right tabular-nums">{refresh.avg_ms}</TableCell>
            <TableCell className="text-right tabular-nums font-semibold text-primary">{refresh.p95_ms}</TableCell>
            <TableCell className="text-right tabular-nums">{refresh.max_ms}</TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">—</TableCell>
          </TableRow>
          {DRILL_ORDER.map((k) => {
            const s = report.drill_rpcs?.[k];
            if (!s) return null;
            return (
              <TableRow key={k}>
                <TableCell className="font-medium">{DRILL_LABEL[k]}</TableCell>
                <TableCell className="text-right tabular-nums">{s.runs}</TableCell>
                <TableCell className="text-right tabular-nums">{s.min_ms}</TableCell>
                <TableCell className="text-right tabular-nums">{s.p50_ms}</TableCell>
                <TableCell className="text-right tabular-nums">{s.avg_ms}</TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-primary">{s.p95_ms}</TableCell>
                <TableCell className="text-right tabular-nums">{s.max_ms}</TableCell>
                <TableCell className="text-right tabular-nums">{s.row_count ?? ''}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function SamplesTable({ report }: { report: PerfReport }) {
  const refresh = report.refresh_cashflow_drill_mvs;
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">Per-iteration samples (ms)</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Operation</TableHead>
            {Array.from({ length: report.iterations }, (_, i) => (
              <TableHead key={i} className="text-right">
                run {i + 1}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">refresh_cashflow_drill_mvs</TableCell>
            {Array.from({ length: report.iterations }, (_, i) => (
              <TableCell key={i} className="text-right tabular-nums">
                {refresh.samples_ms[i] ?? ''}
              </TableCell>
            ))}
          </TableRow>
          {DRILL_ORDER.map((k) => {
            const s = report.drill_rpcs?.[k];
            if (!s) return null;
            return (
              <TableRow key={k}>
                <TableCell className="font-medium">{DRILL_LABEL[k]}</TableCell>
                {Array.from({ length: report.iterations }, (_, i) => (
                  <TableCell key={i} className="text-right tabular-nums">
                    {s.samples_ms[i] ?? ''}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Rebuild a PerfReport from the structured_logs trail of a previous run.
// The edge function emits one log per iteration with duration_ms in context.
// ───────────────────────────────────────────────────────────────────────────
type LogRow = { message: string; context: unknown; created_at: string };

function pct(values: number[], p: number) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}
function summarize(samples: number[], rowCount?: number) {
  const total = samples.reduce((a, b) => a + b, 0);
  return {
    runs: samples.length,
    min_ms: samples.length ? Math.min(...samples) : 0,
    max_ms: samples.length ? Math.max(...samples) : 0,
    avg_ms: samples.length ? Math.round(total / samples.length) : 0,
    p50_ms: Math.round(pct(samples, 50)),
    p95_ms: Math.round(pct(samples, 95)),
    samples_ms: samples.map((v) => Math.round(v)),
    ...(rowCount !== undefined ? { row_count: rowCount } : {}),
  };
}

function buildReportFromLogs(correlationId: string, logs: LogRow[]): PerfReport | null {
  const start = logs.find((l) => l.message === 'perf test started');
  if (!start) return null;
  const startCtx = (start.context ?? {}) as Record<string, unknown>;

  const refreshSamples: number[] = [];
  const drillSamples: Record<string, number[]> = {};
  const drillRowCounts: Record<string, number> = {};

  const drillRpcMap: Record<string, string> = {
    get_mv_cashflow_by_bucket: 'by_bucket',
    get_mv_cashflow_by_entity: 'by_entity',
    get_mv_cashflow_by_counterparty: 'by_counterparty',
    get_mv_cashflow_by_document: 'by_document',
  };

  let seed: PerfReport['seed'];
  let cleanup: PerfReport['cleanup'];

  for (const l of logs) {
    const ctx = (l.context ?? {}) as Record<string, unknown>;
    const dur = typeof ctx.duration_ms === 'number' ? ctx.duration_ms : null;
    if (l.message === 'refresh_cashflow_drill_mvs sample' && dur !== null) {
      refreshSamples.push(dur);
    } else if (l.message.endsWith(' sample') && dur !== null) {
      const rpc = l.message.replace(' sample', '');
      const key = drillRpcMap[rpc];
      if (key) {
        (drillSamples[key] ??= []).push(dur);
        if (typeof ctx.row_count === 'number') drillRowCounts[key] = ctx.row_count;
      }
    } else if (l.message === 'seed completed') {
      seed = {
        inserted: Number(ctx.inserted ?? 0),
        duration_ms: Number(ctx.duration_ms ?? 0),
        tag: String(ctx.tag ?? ''),
      };
    } else if (l.message === 'cleanup completed') {
      cleanup = { duration_ms: Number(ctx.duration_ms ?? 0), ...ctx };
    }
  }

  if (refreshSamples.length === 0) return null;

  const drill_rpcs: Record<string, ReturnType<typeof summarize>> = {};
  for (const key of Object.keys(drillSamples)) {
    drill_rpcs[key] = summarize(drillSamples[key], drillRowCounts[key]);
  }

  return {
    correlationId,
    tenantId: String(startCtx.tenantId ?? ''),
    asOfDate: String(startCtx.asOfDate ?? ''),
    seedCount: Number(startCtx.seedCount ?? 0),
    iterations: Number(startCtx.iterations ?? refreshSamples.length),
    seed,
    cleanup,
    refresh_cashflow_drill_mvs: summarize(refreshSamples),
    drill_rpcs,
    generatedAt: new Date().toISOString(),
  };
}
