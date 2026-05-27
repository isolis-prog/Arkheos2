// Pure helpers that turn a perf-test-cashflow-drill JSON report into shareable
// HTML and CSV artifacts for audit / control teams.
//
// Report shape (from supabase/functions/perf-test-cashflow-drill/index.ts):
// {
//   correlationId, tenantId, asOfDate, seedCount, iterations,
//   seed?:   { inserted, duration_ms, tag },
//   refresh_cashflow_drill_mvs: SummaryStats,
//   drill_rpcs: { by_bucket: SummaryStats & { row_count }, ... },
//   cleanup?: { duration_ms, ... }
// }

export interface SummaryStats {
  runs: number;
  min_ms: number;
  max_ms: number;
  avg_ms: number;
  p50_ms: number;
  p95_ms: number;
  samples_ms: number[];
  row_count?: number;
}

export interface PerfReport {
  correlationId: string;
  tenantId: string;
  asOfDate: string;
  seedCount: number;
  iterations: number;
  seed?: { inserted: number; duration_ms: number; tag: string };
  refresh_cashflow_drill_mvs: SummaryStats;
  drill_rpcs: Record<string, SummaryStats>;
  cleanup?: { duration_ms: number; [k: string]: unknown };
  generatedAt?: string;
}

const DRILL_ORDER = ['by_bucket', 'by_entity', 'by_counterparty', 'by_document'] as const;
const DRILL_LABEL: Record<string, string> = {
  by_bucket: 'L1 — Aging buckets',
  by_entity: 'L2 — Legal entity',
  by_counterparty: 'L3 — Counterparty',
  by_document: 'L4 — Document / trade',
};

function escapeCsv(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function escapeHtml(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildPerfCsv(report: PerfReport): string {
  const generatedAt = report.generatedAt ?? new Date().toISOString();
  const rows: string[][] = [];

  rows.push(['ArkheOS — Cashflows Drill Performance Report']);
  rows.push(['Generated at', generatedAt]);
  rows.push(['Correlation ID', report.correlationId]);
  rows.push(['Tenant ID', report.tenantId]);
  rows.push(['As-of date', report.asOfDate]);
  rows.push(['Seed count', String(report.seedCount)]);
  rows.push(['Iterations per RPC', String(report.iterations)]);
  rows.push([]);

  rows.push(['Phase', 'Metric', 'Value']);
  if (report.seed) {
    rows.push(['Seed', 'Rows inserted', String(report.seed.inserted)]);
    rows.push(['Seed', 'Duration (ms)', String(report.seed.duration_ms)]);
    rows.push(['Seed', 'Tag', report.seed.tag]);
  }
  if (report.cleanup) {
    rows.push(['Cleanup', 'Duration (ms)', String(report.cleanup.duration_ms)]);
  }
  rows.push([]);

  const summaryHeader = ['Operation', 'Runs', 'Min ms', 'p50 ms', 'Avg ms', 'p95 ms', 'Max ms', 'Row count'];
  rows.push(['Refresh + drill timing summary']);
  rows.push(summaryHeader);
  const refresh = report.refresh_cashflow_drill_mvs;
  rows.push([
    'refresh_cashflow_drill_mvs',
    String(refresh.runs),
    String(refresh.min_ms),
    String(refresh.p50_ms),
    String(refresh.avg_ms),
    String(refresh.p95_ms),
    String(refresh.max_ms),
    '',
  ]);
  for (const key of DRILL_ORDER) {
    const s = report.drill_rpcs?.[key];
    if (!s) continue;
    rows.push([
      DRILL_LABEL[key] ?? key,
      String(s.runs),
      String(s.min_ms),
      String(s.p50_ms),
      String(s.avg_ms),
      String(s.p95_ms),
      String(s.max_ms),
      s.row_count !== undefined ? String(s.row_count) : '',
    ]);
  }
  rows.push([]);

  rows.push(['Per-iteration samples (ms)']);
  rows.push(['Operation', ...Array.from({ length: report.iterations }, (_, i) => `run ${i + 1}`)]);
  rows.push(['refresh_cashflow_drill_mvs', ...refresh.samples_ms.map(String)]);
  for (const key of DRILL_ORDER) {
    const s = report.drill_rpcs?.[key];
    if (!s) continue;
    rows.push([DRILL_LABEL[key] ?? key, ...s.samples_ms.map(String)]);
  }

  return rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
}

function statRow(label: string, s: SummaryStats | undefined): string {
  if (!s) return '';
  return `<tr>
    <td class="label">${escapeHtml(label)}</td>
    <td class="num">${s.runs}</td>
    <td class="num">${s.min_ms}</td>
    <td class="num">${s.p50_ms}</td>
    <td class="num">${s.avg_ms}</td>
    <td class="num strong">${s.p95_ms}</td>
    <td class="num">${s.max_ms}</td>
    <td class="num">${s.row_count ?? ''}</td>
  </tr>`;
}

function sampleRow(label: string, s: SummaryStats | undefined, iterations: number): string {
  if (!s) return '';
  const cells = Array.from({ length: iterations }, (_, i) => {
    const v = s.samples_ms[i];
    return `<td class="num">${v ?? ''}</td>`;
  }).join('');
  return `<tr><td class="label">${escapeHtml(label)}</td>${cells}</tr>`;
}

export function buildPerfHtml(report: PerfReport): string {
  const generatedAt = report.generatedAt ?? new Date().toISOString();
  const refresh = report.refresh_cashflow_drill_mvs;
  const sampleHeader = Array.from(
    { length: report.iterations },
    (_, i) => `<th class="num">run ${i + 1}</th>`,
  ).join('');

  const drillRows = DRILL_ORDER.map((key) => statRow(DRILL_LABEL[key] ?? key, report.drill_rpcs?.[key])).join('');
  const drillSampleRows = DRILL_ORDER.map((key) =>
    sampleRow(DRILL_LABEL[key] ?? key, report.drill_rpcs?.[key], report.iterations),
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Cashflows Drill — Performance Report (${escapeHtml(report.correlationId)})</title>
<style>
  :root {
    --fg: #0f172a; --muted: #475569; --border: #e2e8f0; --bg: #ffffff;
    --accent: #1e40af; --accent-bg: #eff6ff; --good: #047857; --warn: #b45309;
  }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    color: var(--fg); background: var(--bg); margin: 0; padding: 32px; line-height: 1.45; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 28px 0 8px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.04em; }
  .sub { color: var(--muted); font-size: 13px; margin-bottom: 20px; }
  .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 8px 24px; padding: 14px 18px; background: var(--accent-bg);
    border: 1px solid #dbeafe; border-radius: 8px; margin-bottom: 24px; }
  .meta div { font-size: 12px; }
  .meta strong { display: block; color: var(--muted); font-weight: 500;
    text-transform: uppercase; font-size: 10px; letter-spacing: 0.06em; margin-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; }
  th, td { border-bottom: 1px solid var(--border); padding: 8px 10px; text-align: left; }
  th { background: #f8fafc; font-weight: 600; color: var(--muted);
    text-transform: uppercase; font-size: 11px; letter-spacing: 0.04em; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.label { font-weight: 500; }
  td.strong { font-weight: 700; color: var(--accent); }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid var(--border);
    color: var(--muted); font-size: 11px; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 999px;
    font-size: 11px; font-weight: 600; }
  .pill.ok { background: #ecfdf5; color: var(--good); }
  .pill.warn { background: #fffbeb; color: var(--warn); }
  @media print { body { padding: 16px; } h2 { page-break-after: avoid; } table { page-break-inside: auto; } tr { page-break-inside: avoid; } }
</style>
</head>
<body>
  <h1>Cashflows Drill — Performance Report</h1>
  <div class="sub">Audit-grade benchmark of materialized-view refresh and drill-level RPC latency.</div>

  <div class="meta">
    <div><strong>Correlation ID</strong>${escapeHtml(report.correlationId)}</div>
    <div><strong>Tenant ID</strong>${escapeHtml(report.tenantId)}</div>
    <div><strong>As-of date</strong>${escapeHtml(report.asOfDate)}</div>
    <div><strong>Seed count</strong>${report.seedCount.toLocaleString()}</div>
    <div><strong>Iterations / RPC</strong>${report.iterations}</div>
    <div><strong>Generated at</strong>${escapeHtml(generatedAt)}</div>
    ${report.seed ? `<div><strong>Seed inserted</strong>${report.seed.inserted.toLocaleString()} rows in ${report.seed.duration_ms} ms</div>` : ''}
    ${report.cleanup ? `<div><strong>Cleanup</strong>${report.cleanup.duration_ms} ms</div>` : ''}
  </div>

  <h2>Refresh &amp; drill timing summary</h2>
  <table>
    <thead>
      <tr>
        <th>Operation</th>
        <th class="num">Runs</th>
        <th class="num">Min</th>
        <th class="num">p50</th>
        <th class="num">Avg</th>
        <th class="num">p95</th>
        <th class="num">Max</th>
        <th class="num">Rows</th>
      </tr>
    </thead>
    <tbody>
      ${statRow('refresh_cashflow_drill_mvs (all 4 MVs)', refresh)}
      ${drillRows}
    </tbody>
  </table>
  <div class="sub">All values in milliseconds. <strong>p95</strong> is the audit-relevant SLO indicator.</div>

  <h2>Per-iteration samples</h2>
  <table>
    <thead>
      <tr><th>Operation</th>${sampleHeader}</tr>
    </thead>
    <tbody>
      ${sampleRow('refresh_cashflow_drill_mvs', refresh, report.iterations)}
      ${drillSampleRows}
    </tbody>
  </table>

  <div class="footer">
    Generated by ArkheOS Cashflows Drill Perf Test • correlationId
    <code>${escapeHtml(report.correlationId)}</code>. This report is suitable for audit
    evidence of MV refresh and drill RPC latency under synthetic load.
  </div>
</body>
</html>`;
}

export function downloadBlob(filename: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function reportFilenameBase(report: PerfReport): string {
  const stamp = (report.generatedAt ?? new Date().toISOString()).slice(0, 19).replace(/[:T]/g, '-');
  return `cashflow-drill-perf_${report.asOfDate}_${stamp}`;
}
