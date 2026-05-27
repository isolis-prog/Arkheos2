import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertTriangle, Download, TrendingUp, Eye, FileArchive, FileSpreadsheet, FileDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDealLens, moduleCount, type DealLensData } from '@/hooks/inbox/useDealLens';
import { ModulePill } from '@/components/inbox/ModulePill';
import { SeverityBadge } from '@/components/inbox/SeverityBadge';
import { type UnifiedBreakModule, type UnifiedBreakRow } from '@/hooks/inbox/useUnifiedBreaks';
import { AICrossModuleDealAnalysis } from '@/components/ail/AICrossModuleDealAnalysis';
import { DealLensBreakDrawer } from '@/components/inbox/DealLensBreakDrawer';
import { DealAuditTimeline } from '@/components/inbox/DealAuditTimeline';
import { PnlSnapshotChart } from '@/components/inbox/PnlSnapshotChart';
import { FoMoThresholdsDialog } from '@/components/inbox/FoMoThresholdsDialog';
import { useFoMoThresholds, evaluateFoMoBreach, type FoMoBreachLevel } from '@/hooks/inbox/useFoMoThresholds';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ALL_MODULES: UnifiedBreakModule[] = [
  'reconciliations',
  'cashflows',
  'valuation_recon',
  'confirmations_recon',
];

const MODULE_TITLE: Record<UnifiedBreakModule, string> = {
  reconciliations: 'Reconciliation Breaks',
  cashflows: 'Cashflow Events',
  valuation_recon: 'Valuation Deltas',
  confirmations_recon: 'Confirmation Discrepancies',
};

function formatUsd(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function DealLensPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const { data, isLoading, error } = useDealLens(dealId);
  const [activeBreak, setActiveBreak] = useState<UnifiedBreakRow | null>(null);
  const [selectedBreakIds, setSelectedBreakIds] = useState<Set<string>>(new Set());
  const [exportingPack, setExportingPack] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const { thresholds } = useFoMoThresholds();

  const breach = useMemo(
    () => evaluateFoMoBreach(data?.pnl?.fo_pv ?? null, data?.pnl?.mo_pv ?? null, thresholds),
    [data?.pnl?.fo_pv, data?.pnl?.mo_pv, thresholds],
  );

  const allBreakIds = useMemo(
    () => (data?.breaks ?? []).map((b) => b.break_id),
    [data?.breaks],
  );
  const toggleBreak = (id: string) =>
    setSelectedBreakIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (!dealId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No deal selected.</p>
      </div>
    );
  }

  const exportDossier = () => {
    if (!data) return;
    const dossier = {
      generated_at: new Date().toISOString(),
      deal_id: dealId,
      header: data.header,
      pnl: data.pnl,
      total_exposure_usd: data.totalExposureUsd,
      breaks_by_module: data.breaksByModule,
      activity: data.activity,
    };
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deal-dossier-${dealId}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Deal Dossier exported', { description: `${dealId}.json downloaded` });
  };

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const csvEscape = (v: unknown): string => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const exportBreaksCsv = async () => {
    if (!data || allBreakIds.length === 0) return;
    setExportingCsv(true);
    try {
      const { data: amendments, error: amErr } = await supabase
        .from('amendment_plans')
        .select('id, exception_id, status, action_type, target_system')
        .in('exception_id', allBreakIds);
      if (amErr) console.warn('amendment_plans fetch failed for CSV', amErr);

      const amByException = new Map<string, { id: string; status: string }[]>();
      for (const a of amendments ?? []) {
        const arr = amByException.get(a.exception_id) ?? [];
        arr.push({ id: a.id, status: a.status });
        amByException.set(a.exception_id, arr);
      }

      const headers = [
        'module',
        'break_id',
        'severity',
        'status',
        'assignee',
        'amount_delta_usd',
        'age_days',
        'currency',
        'evidence_links',
      ];
      const rows = data.breaks.map((b: any) => {
        const amends = amByException.get(b.break_id) ?? [];
        const evidence = amends.map((a) => `amendment:${a.id}(${a.status})`).join(' | ');
        return [
          b.module,
          b.break_id,
          b.severity ?? '',
          b.status ?? '',
          b.assignee_name ?? b.assigned_to ?? '',
          b.amount_delta_usd ?? '',
          b.age_days ?? '',
          b.currency ?? '',
          evidence,
        ];
      });

      const csv = [headers, ...rows]
        .map((r) => r.map(csvEscape).join(','))
        .join('\n');

      const stamp = new Date().toISOString().slice(0, 10);
      downloadFile(`breaks-${dealId}-${stamp}.csv`, csv, 'text/csv;charset=utf-8');
      toast.success('Breaks CSV exported', {
        description: `${rows.length} break${rows.length === 1 ? '' : 's'} across modules`,
      });
    } catch (e) {
      toast.error('Failed to export breaks CSV', { description: (e as Error).message });
    } finally {
      setExportingCsv(false);
    }
  };

  const downloadActivityEvidence = (event: any) => {
    if (!event) return;
    const pack = {
      generated_at: new Date().toISOString(),
      deal_id: dealId,
      event: {
        id: event.id,
        source: event.source,
        action: event.action,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        module: event.module,
        actor_id: event.actor_id,
        created_at: event.created_at,
        summary: event.summary,
        before_state: event.before_state ?? null,
        after_state: event.after_state ?? null,
        diff: event.diff ?? null,
        drill_path: event.drill_path ?? null,
        scope_filters: event.scope_filters ?? null,
      },
    };
    const safeId = String(event.id ?? 'event').replace(/[^a-z0-9_-]/gi, '_').slice(0, 40);
    downloadFile(
      `evidence-${dealId}-${safeId}.json`,
      JSON.stringify(pack, null, 2),
      'application/json',
    );
    toast.success('Evidence downloaded', { description: event.action });
  };

  const buildEvidencePackHtml = (pack: Record<string, unknown>) => {
    const esc = (s: unknown) =>
      String(s ?? '—').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
    const breaks = (pack.breaks as any[]) ?? [];
    const amendments = (pack.amendment_plans as any[]) ?? [];
    const audit = (pack.audit_trail as any[]) ?? [];
    return `<!doctype html><html><head><meta charset="utf-8"><title>Evidence Pack ${esc(pack.deal_id)}</title>
<style>body{font-family:-apple-system,Segoe UI,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;color:#111}
h1{border-bottom:2px solid #333;padding-bottom:.5rem}h2{margin-top:2rem;border-bottom:1px solid #ccc}
table{width:100%;border-collapse:collapse;margin:.5rem 0;font-size:12px}
th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#f5f5f5}.muted{color:#666;font-size:11px}
pre{background:#f8f8f8;padding:8px;font-size:11px;overflow:auto;border:1px solid #eee}
.badge{display:inline-block;padding:2px 6px;border-radius:3px;background:#eee;font-size:10px}
@media print{body{margin:1cm}}</style></head><body>
<h1>Evidence Pack — Deal ${esc(pack.deal_id)}</h1>
<p class="muted">Generated ${esc(pack.generated_at)} · ${breaks.length} breaks · ${amendments.length} amendment plans · ${audit.length} audit events</p>
<h2>Selected Breaks</h2>
<table><thead><tr><th>Break ID</th><th>Module</th><th>Severity</th><th>Status</th><th>Δ USD</th><th>Age</th></tr></thead><tbody>
${breaks.map((b) => `<tr><td>${esc(b.break_id)}</td><td>${esc(b.module)}</td><td><span class="badge">${esc(b.severity)}</span></td><td>${esc(b.status)}</td><td>${esc(b.amount_delta_usd)}</td><td>${esc(b.age_days)}d</td></tr>`).join('')}
</tbody></table>
<h2>Amendment Plans (${amendments.length})</h2>
${amendments.length === 0 ? '<p class="muted">No amendment plans linked to selected breaks.</p>' : amendments.map((a) => `
<div><strong>${esc(a.action_type)}</strong> → ${esc(a.target_system)} <span class="badge">${esc(a.status)}</span><br>
<span class="muted">Break ${esc(a.exception_id)} · created ${esc(a.created_at)}</span>
${a.rationale ? `<p>${esc(a.rationale)}</p>` : ''}
<pre>${esc(JSON.stringify(a.payload ?? {}, null, 2))}</pre></div>`).join('')}
<h2>Audit Trail (${audit.length})</h2>
<table><thead><tr><th>When</th><th>Module</th><th>Action</th><th>Entity</th><th>Summary</th></tr></thead><tbody>
${audit.map((e) => `<tr><td>${esc(e.created_at)}</td><td>${esc(e.module)}</td><td>${esc(e.action)}</td><td class="muted">${esc(e.entity_id)}</td><td>${esc(e.summary)}</td></tr>`).join('')}
</tbody></table>
</body></html>`;
  };

  const exportEvidencePack = async () => {
    if (!data || !dealId) return;
    const ids = selectedBreakIds.size > 0
      ? Array.from(selectedBreakIds)
      : data.breaks.map((b) => b.break_id);
    if (ids.length === 0) {
      toast.error('No breaks to export');
      return;
    }
    setExportingPack(true);
    try {
      const selectedBreaks = data.breaks.filter((b) => ids.includes(b.break_id));

      const { data: amendments, error: amErr } = await supabase
        .from('amendment_plans')
        .select('id, exception_id, action_type, target_system, status, payload, delta_summary, rationale, risk_flags, requires_approval, created_at, approved_at, executed_at')
        .in('exception_id', ids);
      if (amErr) console.warn('amendment_plans fetch failed', amErr);

      const auditTrail = data.auditTimeline.flatMap((g) =>
        g.events.filter((e) => e.entity_id && ids.includes(e.entity_id)),
      );

      const pack = {
        generated_at: new Date().toISOString(),
        deal_id: dealId,
        header: data.header,
        breaks: selectedBreaks,
        amendment_plans: amendments ?? [],
        audit_trail: auditTrail,
      };
      const stamp = new Date().toISOString().slice(0, 10);
      downloadFile(
        `evidence-pack-${dealId}-${stamp}.json`,
        JSON.stringify(pack, null, 2),
        'application/json',
      );
      downloadFile(
        `evidence-pack-${dealId}-${stamp}.html`,
        buildEvidencePackHtml(pack),
        'text/html',
      );
      toast.success('Evidence pack exported', {
        description: `${selectedBreaks.length} breaks · ${amendments?.length ?? 0} amendments · ${auditTrail.length} audit events`,
      });
    } catch (e) {
      toast.error('Failed to export evidence pack', { description: (e as Error).message });
    } finally {
      setExportingPack(false);
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="deal-lens-page">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/inbox">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Inbox
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Deal Lens — {dealId}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <FoMoThresholdsDialog />
          <Button
            onClick={exportBreaksCsv}
            disabled={isLoading || !data || exportingCsv || allBreakIds.length === 0}
            data-testid="export-breaks-csv-btn"
            variant="outline"
            size="sm"
            title="Download all breaks across modules as CSV with severity, status, assignee and evidence links"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            {exportingCsv ? 'Exporting…' : 'Export Breaks CSV'}
          </Button>
          <Button
            onClick={exportEvidencePack}
            disabled={isLoading || !data || exportingPack || allBreakIds.length === 0}
            data-testid="export-evidence-pack-btn"
            variant="outline"
            size="sm"
            title={selectedBreakIds.size > 0
              ? `Export pack for ${selectedBreakIds.size} selected break${selectedBreakIds.size === 1 ? '' : 's'}`
              : 'Export pack for all breaks on this deal'}
          >
            <FileArchive className="h-4 w-4 mr-1" />
            {exportingPack
              ? 'Exporting…'
              : `Export evidence pack${selectedBreakIds.size > 0 ? ` (${selectedBreakIds.size})` : ''}`}
          </Button>
          <Button
            onClick={exportDossier}
            disabled={isLoading || !data}
            data-testid="export-dossier-btn"
            variant="default"
            size="sm"
          >
            <Download className="h-4 w-4 mr-1" /> Export Deal Dossier
          </Button>
        </div>
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Deal Header</span>
            <FoMoBreachBadge breach={breach} thresholds={thresholds} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : data?.header ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Field label="Deal ID" value={data.header.deal_id} />
              <Field label="Trade Date" value={data.header.trade_date ?? '—'} />
              <Field label="Counterparty" value={data.header.counterparty_name ?? '—'} />
              <Field label="Direction" value={data.header.direction ?? '—'} />
              <Field label="Quantity" value={data.header.quantity?.toLocaleString() ?? '—'} />
              <Field label="Price" value={data.header.price?.toLocaleString() ?? '—'} />
              <Field
                label="Notional"
                value={
                  data.header.notional != null
                    ? `${data.header.notional.toLocaleString()} ${data.header.currency ?? ''}`
                    : '—'
                }
              />
              <Field label="Status" value={data.header.status ?? '—'} />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              No canonical trade record found for this deal ID.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multi-break indicator */}
      <Card data-testid="multi-break-indicator">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Cross-Module Activity</span>
            {data && data.totalExposureUsd > 0 && (
              <Badge variant="destructive">
                Total exposure: {formatUsd(data.totalExposureUsd)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ALL_MODULES.map((m) => {
              const count = moduleCount(data, m);
              return (
                <div
                  key={m}
                  className="border rounded-md p-3 flex items-center justify-between"
                  data-testid={`module-count-${m}`}
                >
                  <ModulePill module={m} />
                  <span className="text-2xl font-semibold tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Cross-Module Deal Analysis */}
      <AICrossModuleDealAnalysis dealId={dealId} data={data} />

      {/* P&L summary */}
      <PnlCard
        data={data}
        isLoading={isLoading}
        breach={breach}
        thresholds={thresholds}
      />

      {/* Per-module sections */}
      {ALL_MODULES.map((m) => {
        const rows = data?.breaksByModule[m] ?? [];
        if (rows.length === 0) return null;
        return (
          <Card key={m} data-testid={`module-section-${m}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ModulePill module={m} />
                <span>{MODULE_TITLE[m]}</span>
                <Badge variant="secondary">{rows.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rows.slice(0, 10).map((row) => (
                  <div
                    key={row.break_id}
                    className="flex items-center justify-between border rounded-md p-3"
                  >
                    <div className="flex items-center gap-3 text-sm">
                      <Checkbox
                        checked={selectedBreakIds.has(row.break_id)}
                        onCheckedChange={() => toggleBreak(row.break_id)}
                        aria-label={`Select break ${row.break_id} for evidence pack`}
                        data-testid={`select-break-${row.break_id}`}
                      />
                      <SeverityBadge severity={row.severity} />
                      <span className="font-mono text-xs text-muted-foreground">
                        {row.break_id.slice(0, 8)}
                      </span>
                      <span>
                        Δ {formatUsd(Number(row.amount_delta_usd ?? 0))} · {row.age_days}d old
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveBreak(row)}
                      data-testid={`open-break-${row.break_id}`}
                    >
                      <Eye className="h-3 w-3 mr-1" /> Open
                    </Button>
                  </div>
                ))}
                {rows.length > 10 && (
                  <p className="text-xs text-muted-foreground">
                    +{rows.length - 10} more rows
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Audit timeline grouped by module, with per-break before/after diffs */}
      <DealAuditTimeline groups={data?.auditTimeline ?? []} isLoading={isLoading} />

      {/* Activity feed */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : data && data.activity.length > 0 ? (
            <div className="space-y-2">
              {data.activity.map((e) => (
                <div key={e.id} className="flex items-start gap-3 text-sm border-b pb-2">
                  <Badge variant="outline">{e.module ?? e.entity_type}</Badge>
                  <div className="flex-1">
                    <div className="font-medium">{e.action}</div>
                    {e.summary && (
                      <div className="text-xs text-muted-foreground">{e.summary}</div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recorded activity for this deal.</p>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="text-sm text-destructive pt-6">
            Failed to load deal lens: {(error as Error).message}
          </CardContent>
        </Card>
      )}

      <DealLensBreakDrawer
        row={activeBreak}
        open={activeBreak !== null}
        onOpenChange={(o) => !o && setActiveBreak(null)}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function FoMoBreachBadge({
  breach,
  thresholds,
}: {
  breach: { level: FoMoBreachLevel; deltaPct: number | null };
  thresholds: { warnPct: number; criticalPct: number };
}) {
  if (breach.level === 'ok' || breach.deltaPct == null) return null;
  const isCritical = breach.level === 'critical';
  return (
    <Badge
      variant={isCritical ? 'destructive' : 'secondary'}
      className={cn(
        'gap-1',
        !isCritical && 'bg-warning/15 text-warning border-warning/40',
      )}
      data-testid={`fo-mo-breach-badge-${breach.level}`}
      title={`FO–MO Δ ${breach.deltaPct.toFixed(2)}% — threshold ${
        isCritical ? `critical ≥ ${thresholds.criticalPct}%` : `warn ≥ ${thresholds.warnPct}%`
      }`}
    >
      <AlertTriangle className="h-3 w-3" />
      FO–MO Δ {breach.deltaPct.toFixed(2)}% · {isCritical ? 'critical' : 'warning'}
    </Badge>
  );
}

function PnlCard({
  data,
  isLoading,
  breach,
  thresholds,
}: {
  data: DealLensData | undefined;
  isLoading: boolean;
  breach: { level: FoMoBreachLevel; deltaPct: number | null };
  thresholds: { warnPct: number; criticalPct: number };
}) {
  const fmt = (n: number | null | undefined, ccy: string | null | undefined) =>
    n == null
      ? '—'
      : new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: ccy || 'USD',
          maximumFractionDigits: 0,
        }).format(n);

  return (
    <Card data-testid="pnl-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            P&amp;L Snapshot
          </span>
          <FoMoBreachBadge breach={breach} thresholds={thresholds} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : data?.pnl ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <Field label="FO PV" value={fmt(data.pnl.fo_pv, data.pnl.currency)} />
              <Field label="MO PV" value={fmt(data.pnl.mo_pv, data.pnl.currency)} />
              <Field label="FO − MO Δ" value={fmt(data.pnl.delta, data.pnl.currency)} />
              <Field label="Unrealized P&L" value={fmt(data.pnl.unrealized_pnl, data.pnl.currency)} />
              <Field label="Realized P&L" value={fmt(data.pnl.realized_pnl, data.pnl.currency)} />
            </div>
            <div className="border-t pt-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Snapshot history ({data.pnlSeries.length} pts)
              </div>
              <PnlSnapshotChart
                series={data.pnlSeries}
                currency={data.pnl.currency}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No valuation records found for this deal.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
