// Edge function: export-module-scope
// MODULE_REGISTRY-based dispatcher. Each module exposes:
//   - scope schema (already enforced by zod union)
//   - authorise(scope) → tenant
//   - buildExport(input) → xlsx/csv buffer + scopeKey for storage path + auditEntityId/type
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import {
  buildCsvBuffer,
  buildPivotSheet,
  buildXlsxBuffer,
  exportCorsHeaders,
  formatPath,
  jsonResponse,
  pickScope,
  sha256Hex,
  structuredLog,
  uploadAndSign,
  type SheetColumnSpec,
} from "../_shared/export-helpers.ts";

const MAX_DETAIL_ROWS = 100_000;
const SOFT_TIMEOUT_MS = 50_000;
const BUCKET = "exception-attachments";

const ReconciliationsScope = z.object({
  runId: z.string().uuid(),
  breakCategory: z.string().optional(),
  legalEntityId: z.string().uuid().optional(),
  counterpartyId: z.string().uuid().optional(),
  docId: z.string().optional(),
});
type ReconciliationsScopeT = z.infer<typeof ReconciliationsScope>;

const CashflowsScope = z.object({
  asOfDate: z.string().optional(),
  bucket: z.string().optional(),
  flowDirection: z.enum(["inflow", "outflow", "all"]).optional(),
  legalEntityId: z.string().uuid().optional(),
  counterpartyId: z.string().uuid().optional(),
  consolidatedCashflowId: z.string().uuid().optional(),
});
type CashflowsScopeT = z.infer<typeof CashflowsScope>;

const InputSchema = z.object({
  module: z.enum(["reconciliations", "cashflows"]),
  level: z.number().int().min(0).max(7),
  scope: z.union([ReconciliationsScope, CashflowsScope]),
  options: z
    .object({
      format: z.enum(["xlsx", "csv"]).default("xlsx"),
      includeAuditTrail: z.boolean().default(true),
      includeNarrative: z.boolean().default(true),
    })
    .partial()
    .optional(),
  format: z.enum(["xlsx", "csv"]).optional(),
  includeAuditTrail: z.boolean().optional(),
  includeNarrative: z.boolean().optional(),
  estimatedRowCount: z.number().optional(),
  correlationId: z.string().optional(),
});

type Input = z.infer<typeof InputSchema>;

interface NormalisedOptions {
  format: "xlsx" | "csv";
  includeAuditTrail: boolean;
  includeNarrative: boolean;
}

function normaliseOptions(input: Input): NormalisedOptions {
  return {
    format: input.options?.format ?? input.format ?? "xlsx",
    includeAuditTrail: input.options?.includeAuditTrail ?? input.includeAuditTrail ?? true,
    includeNarrative: input.options?.includeNarrative ?? input.includeNarrative ?? true,
  };
}

function getServiceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getUserFromAuthHeader(req: Request): Promise<{ id: string } | null> {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const jwt = auth.slice("Bearer ".length).trim();
  if (!jwt) return null;
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const c = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  // Pass the JWT explicitly — supabase-js getUser() without args reads from
  // an in-memory session that does not exist for stateless edge requests.
  const { data } = await c.auth.getUser(jwt);
  return data.user ? { id: data.user.id } : null;
}

async function getProfileTenant(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("tenant_id, is_active")
    .eq("id", userId)
    .maybeSingle();
  if (!data?.tenant_id || !data.is_active) return null;
  return data.tenant_id;
}

// ============================================================================
// RECONCILIATIONS handler (unchanged behavior)
// ============================================================================

async function authoriseRecon(
  supabase: SupabaseClient,
  userId: string,
  runId: string,
): Promise<{ tenantId: string } | { error: string; status: number }> {
  const tenantId = await getProfileTenant(supabase, userId);
  if (!tenantId) return { error: "User profile not found", status: 403 };
  const { data: run } = await supabase
    .from("reconciliation_runs")
    .select("tenant_id")
    .eq("id", runId)
    .maybeSingle();
  if (!run) return { error: "Reconciliation run not found", status: 404 };
  if (run.tenant_id !== tenantId) return { error: "Forbidden: run belongs to a different tenant", status: 403 };
  return { tenantId };
}

async function fetchRunMetadata(supabase: SupabaseClient, runId: string) {
  const { data } = await supabase
    .from("reconciliation_runs")
    .select("id, status, started_at, completed_at, executed_by, source_a, source_b, template_id, scope_filters, total_records, matched_count, exception_count, duration_ms")
    .eq("id", runId)
    .maybeSingle();
  return data ?? {};
}

interface ReconDetailRow {
  exception_case_id: string;
  run_id: string;
  break_category: string | null;
  legal_entity_id: string | null;
  legal_entity_name: string | null;
  counterparty_id: string | null;
  counterparty_name: string | null;
  doc_id: string | null;
  doc_type: string | null;
  side_a_amount: number | null;
  side_b_amount: number | null;
  amount_delta: number | null;
  amount_delta_pct: number | null;
  currency: string | null;
  side_a_date: string | null;
  side_b_date: string | null;
  date_delta_days: number | null;
  status: string | null;
  suggested_root_cause: string | null;
  ai_confidence: number | null;
  deal_ids: string | null;
  created_at: string | null;
}

async function fetchReconDetailRows(
  supabase: SupabaseClient,
  tenantId: string,
  scope: ReconciliationsScopeT,
): Promise<ReconDetailRow[]> {
  let q = supabase
    .from("break_details")
    .select(
      "break_detail_id, exception_case_id, run_id, break_category, legal_entity_id, external_counterparty_id, doc_id, doc_type, side_a_amount, side_b_amount, amount_delta, amount_delta_pct, currency, side_a_date, side_b_date, date_delta_days, suggested_root_cause, ai_confidence, created_at, exception_cases:exception_case_id ( status ), legal_entity:legal_entity_id ( name ), counterparty:external_counterparty_id ( name )",
    )
    .eq("tenant_id", tenantId)
    .eq("run_id", scope.runId)
    .limit(MAX_DETAIL_ROWS + 1);
  if (scope.breakCategory) q = q.eq("break_category", scope.breakCategory);
  if (scope.legalEntityId) q = q.eq("legal_entity_id", scope.legalEntityId);
  if (scope.counterpartyId) q = q.eq("external_counterparty_id", scope.counterpartyId);
  if (scope.docId) q = q.eq("doc_id", scope.docId);
  const { data, error } = await q;
  if (error) throw new Error(`fetch break_details: ${error.message}`);
  const rows = data ?? [];

  const dealMap = new Map<string, string[]>();
  const docIds = Array.from(new Set(rows.map((r) => r.doc_id).filter(Boolean) as string[]));
  if (docIds.length > 0) {
    const { data: links } = await supabase
      .from("document_trade_links")
      .select("doc_id, doc_type, deal_id")
      .eq("tenant_id", tenantId)
      .in("doc_id", docIds);
    for (const l of links ?? []) {
      const key = `${l.doc_id}::${l.doc_type ?? ""}`;
      if (!dealMap.has(key)) dealMap.set(key, []);
      dealMap.get(key)!.push(l.deal_id);
    }
  }

  return rows.map((r) => {
    const status = (r.exception_cases as { status?: string } | null)?.status ?? null;
    const legal = (r.legal_entity as { name?: string } | null)?.name ?? null;
    const cp = (r.counterparty as { name?: string } | null)?.name ?? null;
    const dealIds = r.doc_id ? dealMap.get(`${r.doc_id}::${r.doc_type ?? ""}`) ?? [] : [];
    return {
      exception_case_id: r.exception_case_id,
      run_id: r.run_id,
      break_category: r.break_category,
      legal_entity_id: r.legal_entity_id,
      legal_entity_name: legal,
      counterparty_id: r.external_counterparty_id,
      counterparty_name: cp,
      doc_id: r.doc_id,
      doc_type: r.doc_type,
      side_a_amount: r.side_a_amount,
      side_b_amount: r.side_b_amount,
      amount_delta: r.amount_delta,
      amount_delta_pct: r.amount_delta_pct,
      currency: r.currency,
      side_a_date: r.side_a_date,
      side_b_date: r.side_b_date,
      date_delta_days: r.date_delta_days,
      status,
      suggested_root_cause: r.suggested_root_cause,
      ai_confidence: r.ai_confidence,
      deal_ids: dealIds.join(", "),
      created_at: r.created_at,
    } satisfies ReconDetailRow;
  });
}

async function fetchReconSummaryRows(
  supabase: SupabaseClient,
  level: number,
  scope: ReconciliationsScopeT,
) {
  const runId = scope.runId;
  if (level <= 2) {
    const { data } = await supabase.rpc("get_mv_recon_run_by_break_type", { _run_id: runId });
    return (data ?? []) as Record<string, unknown>[];
  }
  if (level === 3) {
    const { data } = await supabase.rpc("get_mv_recon_run_by_entity", { _run_id: runId });
    let rows = (data ?? []) as Record<string, unknown>[];
    if (scope.breakCategory) rows = rows.filter((r) => r.break_category === scope.breakCategory);
    return rows;
  }
  if (level === 4) {
    const { data } = await supabase.rpc("get_mv_recon_run_by_counterparty", { _run_id: runId });
    let rows = (data ?? []) as Record<string, unknown>[];
    if (scope.legalEntityId) rows = rows.filter((r) => r.legal_entity_id === scope.legalEntityId);
    if (scope.breakCategory) rows = rows.filter((r) => r.break_category === scope.breakCategory);
    return rows;
  }
  const { data } = await supabase.rpc("get_mv_recon_run_by_document", { _run_id: runId });
  let rows = (data ?? []) as Record<string, unknown>[];
  if (scope.legalEntityId) rows = rows.filter((r) => r.legal_entity_id === scope.legalEntityId);
  if (scope.counterpartyId) rows = rows.filter((r) => r.external_counterparty_id === scope.counterpartyId);
  if (scope.breakCategory) rows = rows.filter((r) => r.break_category === scope.breakCategory);
  return rows;
}

interface AuditRow {
  exception_case_id: string;
  action: string;
  actor: string | null;
  timestamp: string;
  before_value: string | null;
  after_value: string | null;
  comment: string | null;
  correlation_id: string | null;
}

async function fetchReconAuditRows(
  supabase: SupabaseClient,
  tenantId: string,
  exceptionCaseIds: string[],
): Promise<AuditRow[]> {
  if (exceptionCaseIds.length === 0) return [];
  const out: AuditRow[] = [];
  const { data: comments } = await supabase
    .from("exception_comments")
    .select("exception_id, author_id, body, created_at")
    .eq("tenant_id", tenantId)
    .in("exception_id", exceptionCaseIds);
  for (const c of comments ?? []) {
    out.push({
      exception_case_id: c.exception_id,
      action: "comment",
      actor: c.author_id,
      timestamp: c.created_at,
      before_value: null,
      after_value: null,
      comment: c.body,
      correlation_id: null,
    });
  }
  const { data: events } = await supabase
    .from("audit_events")
    .select("entity_id, action, actor_id, before_state, after_state, created_at, correlation_id")
    .eq("tenant_id", tenantId)
    .in("entity_id", exceptionCaseIds);
  for (const e of events ?? []) {
    out.push({
      exception_case_id: e.entity_id ?? "",
      action: e.action,
      actor: e.actor_id,
      timestamp: e.created_at,
      before_value: e.before_state ? JSON.stringify(e.before_state) : null,
      after_value: e.after_state ? JSON.stringify(e.after_state) : null,
      comment: null,
      correlation_id: e.correlation_id,
    });
  }
  out.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return out;
}

async function callNarrative(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  payload: Record<string, unknown>,
  correlationId: string,
  entityType: string,
): Promise<string | null> {
  try {
    const { data: req, error: reqErr } = await supabase
      .from("ail_inference_requests")
      .insert({
        tenant_id: tenantId,
        requested_by: userId,
        workflow_type: "EXPORT_NARRATIVE",
        requesting_module: "export_module_scope",
        context_payload: { ...payload, correlation_id: correlationId },
        status: "QUEUED",
      })
      .select("request_id")
      .single();
    if (reqErr || !req) return null;
    const { data, error } = await supabase.functions.invoke("ail-cde-dispatcher", {
      body: {
        request_id: req.request_id,
        tenant_id: tenantId,
        workflow_type: "EXPORT_NARRATIVE",
        context_payload: payload,
        entity_id: payload.entity_id ?? "00000000-0000-0000-0000-000000000000",
        entity_type: entityType,
      },
    });
    if (error) return null;
    const rp = (data as { result_payload?: unknown })?.result_payload;
    if (typeof rp === "string") return rp;
    if (rp && typeof rp === "object") {
      const obj = rp as Record<string, unknown>;
      if (typeof obj.raw_response === "string") return obj.raw_response;
      if (typeof obj.narrative === "string") return obj.narrative;
    }
    return null;
  } catch (e) {
    structuredLog("EXPORT_NARRATIVE failed", { error: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

const reconDetailColumns: SheetColumnSpec[] = [
  { key: "exception_case_id", header: "Exception ID", width: 38 },
  { key: "run_id", header: "Run ID", width: 38 },
  { key: "break_category", header: "Break Category", width: 22 },
  { key: "legal_entity_name", header: "Legal Entity", width: 28 },
  { key: "counterparty_name", header: "Counterparty", width: 28 },
  { key: "doc_id", header: "Doc ID", width: 22 },
  { key: "doc_type", header: "Doc Type", width: 14 },
  { key: "side_a_amount", header: "Side A Amount", numFmt: "#,##0.00", width: 16 },
  { key: "side_b_amount", header: "Side B Amount", numFmt: "#,##0.00", width: 16 },
  { key: "amount_delta", header: "Amount Delta", numFmt: "#,##0.00", width: 16 },
  { key: "amount_delta_pct", header: "Delta %", numFmt: "0.00%", width: 12 },
  { key: "currency", header: "Currency", width: 10 },
  { key: "side_a_date", header: "Side A Date", width: 14 },
  { key: "side_b_date", header: "Side B Date", width: 14 },
  { key: "date_delta_days", header: "Date Delta (d)", width: 12 },
  { key: "status", header: "Status", width: 16 },
  { key: "suggested_root_cause", header: "Root Cause (AI)", width: 50 },
  { key: "ai_confidence", header: "AI Confidence", numFmt: "0.00", width: 14 },
  { key: "deal_ids", header: "Deal IDs", width: 40 },
  { key: "created_at", header: "Created", width: 22 },
];

const auditColumns: SheetColumnSpec[] = [
  { key: "exception_case_id", header: "Exception ID", width: 38 },
  { key: "action", header: "Action", width: 18 },
  { key: "actor", header: "Actor", width: 38 },
  { key: "timestamp", header: "Timestamp", width: 24 },
  { key: "before_value", header: "Before", width: 36 },
  { key: "after_value", header: "After", width: 36 },
  { key: "comment", header: "Comment", width: 50 },
  { key: "correlation_id", header: "Correlation ID", width: 38 },
];

function reconSummaryColumnsFor(level: number): SheetColumnSpec[] {
  if (level <= 2) {
    return [
      { key: "break_category", header: "Break Category", width: 22 },
      { key: "break_count", header: "Break Count", numFmt: "#,##0", width: 14 },
      { key: "total_exposure_usd", header: "Exposure (USD)", numFmt: "#,##0.00", width: 18 },
      { key: "min_amount_delta", header: "Min Δ", numFmt: "#,##0.00", width: 14 },
      { key: "max_amount_delta", header: "Max Δ", numFmt: "#,##0.00", width: 14 },
      { key: "avg_age_days", header: "Avg Age (d)", numFmt: "0.0", width: 12 },
    ];
  }
  if (level === 3) {
    return [
      { key: "legal_entity_name", header: "Legal Entity", width: 28 },
      { key: "break_category", header: "Break Category", width: 22 },
      { key: "break_count", header: "Break Count", numFmt: "#,##0", width: 14 },
      { key: "total_exposure_usd", header: "Exposure (USD)", numFmt: "#,##0.00", width: 18 },
    ];
  }
  if (level === 4) {
    return [
      { key: "counterparty_name", header: "Counterparty", width: 28 },
      { key: "break_category", header: "Break Category", width: 22 },
      { key: "break_count", header: "Break Count", numFmt: "#,##0", width: 14 },
      { key: "total_exposure_usd", header: "Exposure (USD)", numFmt: "#,##0.00", width: 18 },
      { key: "oldest_break_age_days", header: "Oldest (d)", numFmt: "#,##0", width: 12 },
      { key: "open_doc_count", header: "Open Docs", numFmt: "#,##0", width: 12 },
    ];
  }
  return [
    { key: "doc_id", header: "Doc ID", width: 22 },
    { key: "doc_type", header: "Doc Type", width: 14 },
    { key: "side_a_amount", header: "Side A", numFmt: "#,##0.00", width: 16 },
    { key: "side_b_amount", header: "Side B", numFmt: "#,##0.00", width: 16 },
    { key: "amount_delta", header: "Δ", numFmt: "#,##0.00", width: 14 },
    { key: "amount_delta_pct", header: "Δ %", numFmt: "0.00%", width: 12 },
    { key: "currency", header: "Currency", width: 10 },
    { key: "break_category", header: "Category", width: 22 },
    { key: "status", header: "Status", width: 16 },
    { key: "trade_count", header: "Trades", numFmt: "#,##0", width: 10 },
  ];
}

interface ExportArtifact {
  body: Uint8Array;
  contentType: string;
  ext: string;
  scopeKey: string;
  rowCount: number;
  warnings: string[];
  auditEntityType: string;
  auditEntityId: string;
}

async function buildReconciliationsExport(
  input: Input,
  scope: ReconciliationsScopeT,
  tenantId: string,
  userId: string,
  correlationId: string,
  opts: NormalisedOptions,
): Promise<ExportArtifact | Response> {
  const supabase = getServiceClient();
  const [runMeta, summaryRows, detailRows] = await Promise.all([
    fetchRunMetadata(supabase, scope.runId),
    fetchReconSummaryRows(supabase, input.level, scope),
    fetchReconDetailRows(supabase, tenantId, scope),
  ]);

  if (detailRows.length > MAX_DETAIL_ROWS) {
    return jsonResponse(
      {
        success: false,
        error: `Scope contains ${detailRows.length} rows which exceeds the ${MAX_DETAIL_ROWS} cap. Please narrow the filter.`,
      },
      413,
    );
  }

  const auditRows = opts.includeAuditTrail
    ? await fetchReconAuditRows(supabase, tenantId, detailRows.map((r) => r.exception_case_id))
    : [];

  const narrative = opts.includeNarrative
    ? await callNarrative(
        supabase,
        tenantId,
        userId,
        {
          run_id: scope.runId,
          entity_id: scope.runId,
          level: input.level,
          scope,
          summary_count: summaryRows.length,
          detail_count: detailRows.length,
          summary_top: summaryRows.slice(0, 10),
        },
        correlationId,
        "RECON_SCOPE",
      )
    : null;

  const contextRows: Array<[string, string]> = [
    ["Module", "reconciliations"],
    ["Drill Level", String(input.level)],
    ["Run ID", scope.runId],
    ["Tenant ID", tenantId],
    ["Correlation ID", correlationId],
    ["Generated At", new Date().toISOString()],
    ["Generated By (user_id)", userId],
    ...pickScope(scope as Record<string, unknown>).filter(([k]) => k !== "runId").map(([k, v]) => [`Scope: ${k}`, v] as [string, string]),
    ["Run Status", String((runMeta as Record<string, unknown>).status ?? "")],
    ["Run Started", String((runMeta as Record<string, unknown>).started_at ?? "")],
    ["Run Completed", String((runMeta as Record<string, unknown>).completed_at ?? "")],
    ["Source A", String((runMeta as Record<string, unknown>).source_a ?? "")],
    ["Source B", String((runMeta as Record<string, unknown>).source_b ?? "")],
    ["Total Records", String((runMeta as Record<string, unknown>).total_records ?? "")],
    ["Exception Count", String((runMeta as Record<string, unknown>).exception_count ?? "")],
  ];

  const warnings: string[] = [];
  if (opts.format === "csv") {
    const body = buildCsvBuffer(reconDetailColumns, detailRows as unknown as Record<string, unknown>[]);
    warnings.push("CSV format only includes the Detail sheet. Summary, Context and Audit sheets are excluded.");
    return {
      body,
      contentType: "text/csv",
      ext: "csv",
      scopeKey: scope.runId,
      rowCount: detailRows.length,
      warnings,
      auditEntityType: "RECON_SCOPE_EXPORT",
      auditEntityId: scope.runId,
    };
  }
  const body = buildXlsxBuffer({
    contextRows,
    narrative,
    brandLine: "ArkheOS — Reconciliations Scope Export",
    summary: { columns: reconSummaryColumnsFor(input.level), rows: summaryRows },
    detail: { columns: reconDetailColumns, rows: detailRows as unknown as Record<string, unknown>[] },
    audit: opts.includeAuditTrail
      ? { columns: auditColumns, rows: auditRows as unknown as Record<string, unknown>[] }
      : undefined,
  });
  return {
    body,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ext: "xlsx",
    scopeKey: scope.runId,
    rowCount: detailRows.length,
    warnings,
    auditEntityType: "RECON_SCOPE_EXPORT",
    auditEntityId: scope.runId,
  };
}

// ============================================================================
// CASHFLOWS handler
// ============================================================================

const cashflowSummaryColumns: SheetColumnSpec[] = [
  { key: "bucket", header: "Bucket", width: 16 },
  { key: "flow_direction", header: "Flow", width: 12 },
  { key: "event_count", header: "Events", numFmt: "#,##0", width: 12 },
  { key: "total_amount_base", header: "Amount (base)", numFmt: "#,##0.00", width: 18 },
  { key: "earliest_due_date", header: "Earliest Due", width: 14 },
  { key: "latest_due_date", header: "Latest Due", width: 14 },
  { key: "currency_count", header: "Currencies", numFmt: "#,##0", width: 12 },
];

const cashflowDetailColumns: SheetColumnSpec[] = [
  { key: "doc_id", header: "Doc ID", width: 24 },
  { key: "doc_type", header: "Doc Type", width: 14 },
  { key: "legal_entity_name", header: "Legal Entity", width: 28 },
  { key: "counterparty_name", header: "Counterparty", width: 28 },
  { key: "expected_amount", header: "Expected Amount", numFmt: "#,##0.00", width: 18 },
  { key: "actual_amount", header: "Actual Amount", numFmt: "#,##0.00", width: 18 },
  { key: "delta", header: "Δ", numFmt: "#,##0.00", width: 16 },
  { key: "delta_pct", header: "Δ %", numFmt: "0.00%", width: 12 },
  { key: "currency", header: "Currency", width: 10 },
  { key: "expected_date", header: "Expected Date", width: 14 },
  { key: "actual_date", header: "Actual Date", width: 14 },
  { key: "date_delta_days", header: "Date Δ (d)", numFmt: "#,##0", width: 12 },
  { key: "bucket", header: "Bucket", width: 14 },
  { key: "flow_direction", header: "Flow", width: 12 },
  { key: "status", header: "Status", width: 16 },
  { key: "suggested_root_cause", header: "Root Cause (AI)", width: 50 },
  { key: "ai_confidence", header: "AI Confidence", numFmt: "0.00", width: 14 },
  { key: "linked_deal_ids", header: "Linked Deal IDs", width: 40 },
];

const BUCKET_ORDER = ["OVERDUE", "D30", "D45", "D60", "D90", "D120", "BEYOND_120"];

interface CashflowDetailRow {
  consolidated_cashflow_id: string;
  doc_id: string | null;
  doc_type: string | null;
  legal_entity_id: string | null;
  legal_entity_name: string | null;
  counterparty_id: string | null;
  counterparty_name: string | null;
  expected_amount: number | null;
  actual_amount: number | null;
  delta: number | null;
  delta_pct: number | null;
  currency: string | null;
  expected_date: string | null;
  actual_date: string | null;
  date_delta_days: number | null;
  bucket: string | null;
  flow_direction: string | null;
  status: string | null;
  suggested_root_cause: string | null;
  ai_confidence: number | null;
  linked_deal_ids: string;
  evidence_refs: Record<string, unknown> | null;
  enrichment_run_id: string | null;
  enriched_at: string | null;
}

async function authoriseCashflows(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ tenantId: string } | { error: string; status: number }> {
  const tenantId = await getProfileTenant(supabase, userId);
  if (!tenantId) return { error: "User profile not found", status: 403 };
  return { tenantId };
}

function applyCashflowScopeFilter<T extends Record<string, unknown>>(rows: T[], scope: CashflowsScopeT): T[] {
  let out = rows;
  if (scope.bucket) out = out.filter((r) => r.bucket === scope.bucket);
  if (scope.flowDirection && scope.flowDirection !== "all") {
    out = out.filter((r) => r.flow_direction === scope.flowDirection);
  }
  if (scope.legalEntityId) out = out.filter((r) => r.legal_entity_id === scope.legalEntityId);
  if (scope.counterpartyId) out = out.filter((r) => r.external_counterparty_id === scope.counterpartyId);
  return out;
}

async function fetchCashflowSummaryRows(
  supabase: SupabaseClient,
  scope: CashflowsScopeT,
  asOfDate: string,
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.rpc("get_mv_cashflow_by_bucket", { _as_of_date: asOfDate });
  if (error) throw new Error(`get_mv_cashflow_by_bucket: ${error.message}`);
  let rows = (data ?? []) as Record<string, unknown>[];
  if (scope.bucket) rows = rows.filter((r) => r.bucket === scope.bucket);
  if (scope.flowDirection && scope.flowDirection !== "all") {
    rows = rows.filter((r) => r.flow_direction === scope.flowDirection);
  }
  rows.sort((a, b) => {
    const ai = BUCKET_ORDER.indexOf(String(a.bucket));
    const bi = BUCKET_ORDER.indexOf(String(b.bucket));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  return rows;
}

async function fetchCashflowDetailRows(
  supabase: SupabaseClient,
  tenantId: string,
  scope: CashflowsScopeT,
  asOfDate: string,
): Promise<CashflowDetailRow[]> {
  const { data: docRowsRaw, error: docErr } = await supabase.rpc("get_mv_cashflow_by_document", {
    _as_of_date: asOfDate,
  });
  if (docErr) throw new Error(`get_mv_cashflow_by_document: ${docErr.message}`);
  let docRows = (docRowsRaw ?? []) as Array<Record<string, unknown>>;
  docRows = applyCashflowScopeFilter(docRows, scope);
  if (scope.consolidatedCashflowId) {
    docRows = docRows.filter((r) => r.consolidated_cashflow_id === scope.consolidatedCashflowId);
  }
  if (docRows.length > MAX_DETAIL_ROWS) {
    docRows = docRows.slice(0, MAX_DETAIL_ROWS + 1);
  }

  const consolidatedIds = Array.from(
    new Set(docRows.map((r) => r.consolidated_cashflow_id).filter(Boolean) as string[]),
  );
  const entityIds = Array.from(
    new Set(docRows.map((r) => r.legal_entity_id).filter(Boolean) as string[]),
  );
  const counterpartyIds = Array.from(
    new Set(docRows.map((r) => r.external_counterparty_id).filter(Boolean) as string[]),
  );

  const [breakDetailsRes, namesRes, linksRes] = await Promise.all([
    consolidatedIds.length > 0
      ? supabase
          .from("cashflow_break_details")
          .select(
            "consolidated_cashflow_id, cashflow_exception_id, expected_date, actual_date, break_category, suggested_root_cause, ai_confidence, evidence_refs, enrichment_run_id, enriched_at",
          )
          .eq("tenant_id", tenantId)
          .in("consolidated_cashflow_id", consolidatedIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>>, error: null }),
    [...entityIds, ...counterpartyIds].length > 0
      ? supabase
          .from("canonical_counterparties")
          .select("id, name")
          .in("id", Array.from(new Set([...entityIds, ...counterpartyIds])))
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }>, error: null }),
    consolidatedIds.length > 0
      ? supabase
          .from("cashflow_event_link")
          .select("link_group_id, event_id")
          .in("link_group_id", consolidatedIds)
      : Promise.resolve({ data: [] as Array<{ link_group_id: string; event_id: string }>, error: null }),
  ]);

  const bdMap = new Map<string, Record<string, unknown>>();
  for (const bd of (breakDetailsRes.data ?? []) as Array<Record<string, unknown>>) {
    bdMap.set(String(bd.consolidated_cashflow_id), bd);
  }
  const nameMap = new Map<string, string>();
  for (const n of (namesRes.data ?? []) as Array<{ id: string; name: string }>) {
    nameMap.set(n.id, n.name);
  }

  // Resolve event_ids → deal_ids via cashflow_event.source_object_id (TRADE)
  const eventIds = Array.from(
    new Set(((linksRes.data ?? []) as Array<{ event_id: string }>).map((l) => l.event_id).filter(Boolean)),
  );
  const dealsByConsolidated = new Map<string, Set<string>>();
  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from("cashflow_event")
      .select("id, source_object_type, source_object_id")
      .in("id", eventIds);
    const eventToDeal = new Map<string, string>();
    for (const e of (events ?? []) as Array<{ id: string; source_object_type: string | null; source_object_id: string | null }>) {
      if (e.source_object_id && String(e.source_object_type ?? "").toUpperCase().includes("TRADE")) {
        eventToDeal.set(e.id, e.source_object_id);
      }
    }
    for (const l of (linksRes.data ?? []) as Array<{ link_group_id: string; event_id: string }>) {
      const deal = eventToDeal.get(l.event_id);
      if (!deal) continue;
      const k = String(l.link_group_id);
      if (!dealsByConsolidated.has(k)) dealsByConsolidated.set(k, new Set());
      dealsByConsolidated.get(k)!.add(deal);
    }
  }

  return docRows.map((r) => {
    const cid = String(r.consolidated_cashflow_id);
    const bd = bdMap.get(cid) ?? {};
    const expected = r.expected_amount !== null && r.expected_amount !== undefined ? Number(r.expected_amount) : null;
    const actual = r.actual_amount !== null && r.actual_amount !== undefined ? Number(r.actual_amount) : null;
    const delta = r.amount_delta !== null && r.amount_delta !== undefined
      ? Number(r.amount_delta)
      : expected !== null && actual !== null
      ? actual - expected
      : null;
    const deltaPct = expected && expected !== 0 && delta !== null ? delta / expected : null;
    const expectedDate = (bd.expected_date as string | null) ?? null;
    const actualDate = (bd.actual_date as string | null) ?? null;
    const dateDelta = expectedDate && actualDate
      ? Math.round((new Date(actualDate).getTime() - new Date(expectedDate).getTime()) / 86_400_000)
      : null;
    const dealSet = dealsByConsolidated.get(cid);
    return {
      consolidated_cashflow_id: cid,
      doc_id: (r.doc_id as string | null) ?? null,
      doc_type: (r.doc_type as string | null) ?? null,
      legal_entity_id: (r.legal_entity_id as string | null) ?? null,
      legal_entity_name: nameMap.get(String(r.legal_entity_id)) ?? null,
      counterparty_id: (r.external_counterparty_id as string | null) ?? null,
      counterparty_name: nameMap.get(String(r.external_counterparty_id)) ?? null,
      expected_amount: expected,
      actual_amount: actual,
      delta,
      delta_pct: deltaPct,
      currency: (r.currency as string | null) ?? null,
      expected_date: expectedDate,
      actual_date: actualDate,
      date_delta_days: dateDelta,
      bucket: (r.bucket as string | null) ?? null,
      flow_direction: (r.flow_direction as string | null) ?? null,
      status: (r.status as string | null) ?? null,
      suggested_root_cause: (bd.suggested_root_cause as string | null) ?? null,
      ai_confidence: bd.ai_confidence !== null && bd.ai_confidence !== undefined ? Number(bd.ai_confidence) : null,
      linked_deal_ids: dealSet ? Array.from(dealSet).join(", ") : "",
      evidence_refs: (bd.evidence_refs as Record<string, unknown> | null | undefined) ?? null,
      enrichment_run_id: (bd.enrichment_run_id as string | null | undefined) ?? null,
      enriched_at: (bd.enriched_at as string | null | undefined) ?? null,
    } satisfies CashflowDetailRow;
  });
}

async function fetchCashflowAuditRows(
  supabase: SupabaseClient,
  tenantId: string,
  consolidatedIds: string[],
): Promise<AuditRow[]> {
  if (consolidatedIds.length === 0) return [];
  const out: AuditRow[] = [];

  const { data: overrides } = await supabase
    .from("cashflow_override_audit")
    .select("consolidated_cashflow_id, override_type, previous_value, new_value, reason, performed_by, performed_at")
    .eq("tenant_id", tenantId)
    .in("consolidated_cashflow_id", consolidatedIds);
  for (const o of (overrides ?? []) as Array<Record<string, unknown>>) {
    out.push({
      exception_case_id: String(o.consolidated_cashflow_id ?? ""),
      action: `override:${String(o.override_type ?? "")}`,
      actor: (o.performed_by as string | null) ?? null,
      timestamp: String(o.performed_at ?? new Date().toISOString()),
      before_value: o.previous_value ? JSON.stringify(o.previous_value) : null,
      after_value: o.new_value ? JSON.stringify(o.new_value) : null,
      comment: (o.reason as string | null) ?? null,
      correlation_id: null,
    });
  }

  const { data: comments } = await supabase
    .from("cashflow_comments")
    .select("consolidated_cashflow_id, author_id, body, created_at")
    .eq("tenant_id", tenantId)
    .in("consolidated_cashflow_id", consolidatedIds);
  for (const c of (comments ?? []) as Array<Record<string, unknown>>) {
    out.push({
      exception_case_id: String(c.consolidated_cashflow_id ?? ""),
      action: "comment",
      actor: (c.author_id as string | null) ?? null,
      timestamp: String(c.created_at ?? new Date().toISOString()),
      before_value: null,
      after_value: null,
      comment: (c.body as string | null) ?? null,
      correlation_id: null,
    });
  }

  const { data: drillEvents } = await supabase
    .from("drill_audit_events")
    .select("scope_filters, action, user_id, created_at, target_level")
    .eq("tenant_id", tenantId)
    .eq("module", "cashflows")
    .order("created_at", { ascending: false })
    .limit(500);
  for (const e of (drillEvents ?? []) as Array<Record<string, unknown>>) {
    out.push({
      exception_case_id: "",
      action: `drill:${String(e.action ?? "")} L${String(e.target_level ?? "")}`,
      actor: (e.user_id as string | null) ?? null,
      timestamp: String(e.created_at ?? new Date().toISOString()),
      before_value: null,
      after_value: e.scope_filters ? JSON.stringify(e.scope_filters) : null,
      comment: null,
      correlation_id: null,
    });
  }

  out.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return out;
}

async function buildCashflowsExport(
  input: Input,
  scope: CashflowsScopeT,
  tenantId: string,
  userId: string,
  correlationId: string,
  opts: NormalisedOptions,
): Promise<ExportArtifact | Response> {
  const supabase = getServiceClient();
  const asOfDate = scope.asOfDate ?? new Date().toISOString().slice(0, 10);

  const [summaryRows, detailRows] = await Promise.all([
    fetchCashflowSummaryRows(supabase, scope, asOfDate),
    fetchCashflowDetailRows(supabase, tenantId, scope, asOfDate),
  ]);

  if (detailRows.length > MAX_DETAIL_ROWS) {
    return jsonResponse(
      {
        success: false,
        error: `Scope contains ${detailRows.length} rows which exceeds the ${MAX_DETAIL_ROWS} cap. Please narrow the filter.`,
      },
      413,
    );
  }

  const consolidatedIds = detailRows.map((r) => r.consolidated_cashflow_id);
  const auditRows = opts.includeAuditTrail
    ? await fetchCashflowAuditRows(supabase, tenantId, consolidatedIds)
    : [];

  const narrative = opts.includeNarrative
    ? await callNarrative(
        supabase,
        tenantId,
        userId,
        {
          as_of_date: asOfDate,
          entity_id: tenantId,
          level: input.level,
          scope,
          summary_count: summaryRows.length,
          detail_count: detailRows.length,
          summary_top: summaryRows.slice(0, 10),
        },
        correlationId,
        "CASHFLOW_SCOPE",
      )
    : null;

  const totalsByDirection: { inflow: number; outflow: number } = summaryRows.reduce(
    (acc: { inflow: number; outflow: number }, r) => {
      const dir = String(r.flow_direction);
      const amt = Number(r.total_amount_base ?? 0);
      if (dir === "inflow") acc.inflow += amt;
      if (dir === "outflow") acc.outflow += amt;
      return acc;
    },
    { inflow: 0, outflow: 0 },
  );

  // Resolve human-readable names for the active entity / counterparty filters
  // so the XLSX context is self-explanatory and matches the Aging pivot below.
  const filteredEntityName = scope.legalEntityId
    ? (detailRows.find((r) => r.legal_entity_id === scope.legalEntityId)?.legal_entity_name ?? null)
    : null;
  const filteredCounterpartyName = scope.counterpartyId
    ? (detailRows.find((r) => r.counterparty_id === scope.counterpartyId)?.counterparty_name ?? null)
    : null;
  const distinctCounterparties = new Set(
    detailRows.map((r) => r.counterparty_name).filter(Boolean) as string[],
  ).size;
  const distinctEntities = new Set(
    detailRows.map((r) => r.legal_entity_name).filter(Boolean) as string[],
  ).size;

  const contextRows: Array<[string, string]> = [
    ["Module", "cashflows"],
    ["Drill Level", String(input.level)],
    ["As-of Date", asOfDate],
    ["Tenant ID", tenantId],
    ["Correlation ID", correlationId],
    ["Generated At", new Date().toISOString()],
    ["Generated By (user_id)", userId],
    ...pickScope(scope as Record<string, unknown>).map(([k, v]) => [`Scope: ${k}`, v] as [string, string]),
    ["Filter: Legal Entity", filteredEntityName ?? (scope.legalEntityId ?? "(all)")],
    ["Filter: Counterparty", filteredCounterpartyName ?? (scope.counterpartyId ?? "(all)")],
    ["Aging Pivot — Distinct Entities", String(distinctEntities)],
    ["Aging Pivot — Distinct Counterparties", String(distinctCounterparties)],
    ["Total Inflow (base)", totalsByDirection.inflow.toFixed(2)],
    ["Total Outflow (base)", totalsByDirection.outflow.toFixed(2)],
    ["Net (base)", (totalsByDirection.inflow - totalsByDirection.outflow).toFixed(2)],
    ["Detail Rows", String(detailRows.length)],
  ];

  const warnings: string[] = [];
  const auditEntityId = scope.consolidatedCashflowId ?? tenantId;

  if (opts.format === "csv") {
    const body = buildCsvBuffer(cashflowDetailColumns, detailRows as unknown as Record<string, unknown>[]);
    warnings.push("CSV format only includes the Detail sheet. Summary, Aging Analysis and Audit sheets are excluded.");
    return {
      body,
      contentType: "text/csv",
      ext: "csv",
      scopeKey: scope.consolidatedCashflowId ?? `asof-${asOfDate}`,
      rowCount: detailRows.length,
      warnings,
      auditEntityType: "CASHFLOW_SCOPE_EXPORT",
      auditEntityId,
    };
  }

  // Aging analysis pivot: rows = counterparty, cols = bucket, values = absolute amount
  const pivotInputRows = detailRows
    .filter((r) => r.counterparty_name && r.bucket)
    .map((r) => ({
      counterparty_name: r.counterparty_name!,
      bucket: r.bucket!,
      amount: Math.abs(Number(r.actual_amount ?? r.expected_amount ?? 0)),
    }));
  const pivot = buildPivotSheet({
    rowLabel: "Counterparty",
    rowKey: "counterparty_name",
    colKey: "bucket",
    valueKey: "amount",
    rows: pivotInputRows,
    columnOrder: BUCKET_ORDER,
    includeRowTotal: true,
    numFmt: "#,##0.00",
  });

  // Evidence pack: flatten evidence_refs from cashflow_break_details into one row per
  // referenced doc / event / consolidated cashflow so users get a auditable evidence
  // sheet alongside the detail.
  const evidenceColumns: SheetColumnSpec[] = [
    { key: "consolidated_cashflow_id", header: "Consolidated ID", width: 38 },
    { key: "doc_id", header: "Doc ID", width: 24 },
    { key: "evidence_type", header: "Evidence Type", width: 22 },
    { key: "evidence_ref", header: "Evidence Ref / ID", width: 38 },
    { key: "evidence_source", header: "Source", width: 18 },
    { key: "enrichment_run_id", header: "Enrichment Run", width: 38 },
    { key: "enriched_at", header: "Enriched At", width: 22 },
  ];
  const evidenceRows: Array<Record<string, unknown>> = [];
  for (const detail of detailRows) {
    const evidence = (detail.evidence_refs as
      | {
          consolidated_cashflow_id?: string | null;
          cashflow_event_ids?: string[];
          documents?: Array<{ doc_id: string; doc_type: string; source: string }>;
        }
      | null) ?? null;
    const enrichmentRunId = detail.enrichment_run_id;
    const enrichedAt = detail.enriched_at;
    if (!evidence) continue;
    if (evidence.consolidated_cashflow_id) {
      evidenceRows.push({
        consolidated_cashflow_id: detail.consolidated_cashflow_id,
        doc_id: detail.doc_id,
        evidence_type: "consolidated_cashflow",
        evidence_ref: evidence.consolidated_cashflow_id,
        evidence_source: "self",
        enrichment_run_id: enrichmentRunId,
        enriched_at: enrichedAt,
      });
    }
    for (const eventId of evidence.cashflow_event_ids ?? []) {
      evidenceRows.push({
        consolidated_cashflow_id: detail.consolidated_cashflow_id,
        doc_id: detail.doc_id,
        evidence_type: "cashflow_event",
        evidence_ref: eventId,
        evidence_source: "cashflow_event_link",
        enrichment_run_id: enrichmentRunId,
        enriched_at: enrichedAt,
      });
    }
    for (const doc of evidence.documents ?? []) {
      evidenceRows.push({
        consolidated_cashflow_id: detail.consolidated_cashflow_id,
        doc_id: detail.doc_id,
        evidence_type: doc.doc_type ?? "document",
        evidence_ref: doc.doc_id,
        evidence_source: doc.source ?? "—",
        enrichment_run_id: enrichmentRunId,
        enriched_at: enrichedAt,
      });
    }
  }

  // Aging Evidence: per (counterparty, bucket), enumerate the documents and
  // cashflow events that compose that aging cell — so auditors can trace which
  // docs/events fed each cell of the Aging Analysis pivot.
  const agingEvidenceColumns: SheetColumnSpec[] = [
    { key: "counterparty_name", header: "Counterparty", width: 28 },
    { key: "bucket", header: "Bucket", width: 12 },
    { key: "flow_direction", header: "Direction", width: 12 },
    { key: "consolidated_cashflow_id", header: "Consolidated ID", width: 38 },
    { key: "doc_id", header: "Doc ID", width: 24 },
    { key: "doc_type", header: "Doc Type", width: 18 },
    { key: "evidence_type", header: "Evidence Type", width: 22 },
    { key: "evidence_ref", header: "Evidence Ref / ID", width: 38 },
    { key: "evidence_source", header: "Source", width: 18 },
    { key: "amount", header: "Amount", width: 16, numFmt: "#,##0.00" },
    { key: "currency", header: "CCY", width: 8 },
  ];
  const agingEvidenceRows: Array<Record<string, unknown>> = [];
  for (const detail of detailRows) {
    if (!detail.counterparty_name || !detail.bucket) continue;
    const evidence = (detail.evidence_refs as
      | {
          consolidated_cashflow_id?: string | null;
          cashflow_event_ids?: string[];
          documents?: Array<{ doc_id: string; doc_type: string; source: string }>;
        }
      | null) ?? null;
    const baseRow = {
      counterparty_name: detail.counterparty_name,
      bucket: detail.bucket,
      flow_direction: detail.flow_direction,
      consolidated_cashflow_id: detail.consolidated_cashflow_id,
      doc_id: detail.doc_id,
      doc_type: detail.doc_type,
      amount: Math.abs(Number(detail.actual_amount ?? detail.expected_amount ?? 0)),
      currency: detail.currency,
    };
    // Always emit at least one row per detail so the bucket cell is fully
    // traceable even when no granular evidence_refs were enriched.
    if (!evidence || (
      !evidence.consolidated_cashflow_id &&
      !(evidence.cashflow_event_ids?.length) &&
      !(evidence.documents?.length)
    )) {
      agingEvidenceRows.push({
        ...baseRow,
        evidence_type: "document",
        evidence_ref: detail.doc_id,
        evidence_source: "detail",
      });
      continue;
    }
    if (evidence.consolidated_cashflow_id) {
      agingEvidenceRows.push({
        ...baseRow,
        evidence_type: "consolidated_cashflow",
        evidence_ref: evidence.consolidated_cashflow_id,
        evidence_source: "self",
      });
    }
    for (const eventId of evidence.cashflow_event_ids ?? []) {
      agingEvidenceRows.push({
        ...baseRow,
        evidence_type: "cashflow_event",
        evidence_ref: eventId,
        evidence_source: "cashflow_event_link",
      });
    }
    for (const doc of evidence.documents ?? []) {
      agingEvidenceRows.push({
        ...baseRow,
        evidence_type: doc.doc_type ?? "document",
        evidence_ref: doc.doc_id,
        evidence_source: doc.source ?? "—",
      });
    }
  }
  // Stable ordering: counterparty → bucket order → evidence_type
  const bucketRank = new Map(BUCKET_ORDER.map((b, i) => [b, i] as const));
  agingEvidenceRows.sort((a, b) => {
    const cn = String(a.counterparty_name ?? "").localeCompare(String(b.counterparty_name ?? ""));
    if (cn !== 0) return cn;
    const ar = bucketRank.get(String(a.bucket)) ?? 99;
    const br = bucketRank.get(String(b.bucket)) ?? 99;
    if (ar !== br) return ar - br;
    return String(a.evidence_type ?? "").localeCompare(String(b.evidence_type ?? ""));
  });

  const extraSheets = [
    { name: "Aging Analysis", columns: pivot.columns, rows: pivot.rows },
    { name: "Aging Evidence", columns: agingEvidenceColumns, rows: agingEvidenceRows },
    { name: "Evidence Pack", columns: evidenceColumns, rows: evidenceRows },
  ];

  const body = buildXlsxBuffer({
    contextRows,
    narrative,
    brandLine: "ArkheOS — Cashflows Scope Export",
    summary: { columns: cashflowSummaryColumns, rows: summaryRows },
    detail: { columns: cashflowDetailColumns, rows: detailRows as unknown as Record<string, unknown>[] },
    extraSheets,
    audit: opts.includeAuditTrail
      ? { columns: auditColumns, rows: auditRows as unknown as Record<string, unknown>[] }
      : undefined,
  });

  return {
    body,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ext: "xlsx",
    scopeKey: scope.consolidatedCashflowId ?? `asof-${asOfDate}`,
    rowCount: detailRows.length,
    warnings,
    auditEntityType: "CASHFLOW_SCOPE_EXPORT",
    auditEntityId,
  };
}

// ============================================================================
// MODULE_REGISTRY dispatcher
//
// Single source of truth for export module handlers. Each entry pairs an
// `authorise(scope)` step with a `build(input)` step that produces an
// `ExportArtifact`. Adding a new module is a one-place change here plus its
// own `buildXxxExport` / `authoriseXxx` helpers — see
// `docs/drill-module-registry.md` for the full checklist.
// ============================================================================

interface ModuleHandler {
  authorise(supabase: SupabaseClient, userId: string, scope: unknown): Promise<{ tenantId: string } | { error: string; status: number }>;
  build(input: Input, tenantId: string, userId: string, correlationId: string, opts: NormalisedOptions): Promise<ExportArtifact | Response>;
}

const MODULE_REGISTRY: Record<"reconciliations" | "cashflows", ModuleHandler> = {
  reconciliations: {
    authorise: (supabase, userId, scope) =>
      authoriseRecon(supabase, userId, (scope as ReconciliationsScopeT).runId),
    build: (input, tenantId, userId, correlationId, opts) =>
      buildReconciliationsExport(input, input.scope as ReconciliationsScopeT, tenantId, userId, correlationId, opts),
  },
  cashflows: {
    authorise: (supabase, userId) => authoriseCashflows(supabase, userId),
    build: (input, tenantId, userId, correlationId, opts) =>
      buildCashflowsExport(input, input.scope as CashflowsScopeT, tenantId, userId, correlationId, opts),
  },
};

async function processExport(input: Input, userId: string, correlationId: string): Promise<Response> {
  const opts = normaliseOptions(input);
  const supabase = getServiceClient();
  const handler = MODULE_REGISTRY[input.module];

  const auth = await handler.authorise(supabase, userId, input.scope);
  if ("error" in auth) return jsonResponse({ success: false, error: auth.error }, auth.status);
  const { tenantId } = auth;

  const t0 = Date.now();
  const built = await handler.build(input, tenantId, userId, correlationId, opts);
  if (built instanceof Response) return built;

  const fileHash = await sha256Hex(built.body);
  const path = formatPath({
    tenantId,
    module: input.module,
    scopeKey: built.scopeKey,
    correlationId,
    ext: built.ext,
  });
  const { signedUrl, expiresAt } = await uploadAndSign(supabase, {
    bucket: BUCKET,
    path,
    body: built.body,
    contentType: built.contentType,
  });

  const drillPath = pickScope(input.scope as Record<string, unknown>).map(([k, v], i) => ({
    level: i,
    label: k,
    scope: { [k]: v },
  }));

  await Promise.all([
    supabase.from("drill_audit_events").insert({
      tenant_id: tenantId,
      user_id: userId,
      module: input.module,
      action: "export",
      drill_path: drillPath as unknown as never,
      scope_filters: input.scope as unknown as never,
      target_level: input.level,
      row_count: built.rowCount,
    }),
    supabase.from("audit_events").insert({
      tenant_id: tenantId,
      module_key: input.module,
      entity_type: built.auditEntityType,
      entity_id: built.auditEntityId,
      actor_id: userId,
      action: built.auditEntityType,
      correlation_id: correlationId,
      summary: `Scope export L${input.level} (${built.rowCount} rows)`,
      metadata: {
        fileHash,
        downloadUrl: signedUrl,
        format: opts.format,
        path,
        warnings: built.warnings,
      } as unknown as never,
    }),
  ]);

  structuredLog("export-module-scope completed", {
    correlationId,
    tenantId,
    module: input.module,
    scopeKey: built.scopeKey,
    rowCount: built.rowCount,
    durationMs: Date.now() - t0,
    fileHash,
  });

  return jsonResponse({
    success: true,
    downloadUrl: signedUrl,
    signedUrl,
    expiresAt,
    fileHash,
    rowCount: built.rowCount,
    warnings: built.warnings.length > 0 ? built.warnings : undefined,
    message: `Export ready (${built.rowCount} rows).`,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: exportCorsHeaders });

  const correlationId = crypto.randomUUID();
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user) return jsonResponse({ success: false, error: "Authentication required" }, 401);

    const json = await req.json();
    const parsed = InputSchema.safeParse(json);
    if (!parsed.success) {
      return jsonResponse({ success: false, error: "Invalid input", details: parsed.error.flatten() }, 400);
    }
    const input = parsed.data;
    const correlation = input.correlationId ?? correlationId;

    const work = processExport(input, user.id, correlation);
    const timer = new Promise<{ timedOut: true }>((resolve) =>
      setTimeout(() => resolve({ timedOut: true }), SOFT_TIMEOUT_MS),
    );
    const result = await Promise.race([work, timer]);
    if ((result as { timedOut?: boolean }).timedOut) {
      const supabase = getServiceClient();
      const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).maybeSingle();
      if (!profile?.tenant_id) return jsonResponse({ success: false, error: "Profile missing" }, 500);
      const { data: job, error } = await supabase
        .from("background_jobs")
        .insert({
          tenant_id: profile.tenant_id,
          job_type: "export_module_scope",
          domain: input.module,
          payload: { input, userId: user.id, correlationId: correlation } as unknown as never,
          priority: "normal",
          status: "running",
          correlation_id: correlation,
        })
        .select("id")
        .single();
      if (error) {
        structuredLog("background_jobs insert failed", { error: error.message });
      }
      work
        .then(async (resp) => {
          const text = await (resp as Response).clone().text();
          await supabase
            .from("background_jobs")
            .update({ status: "completed", result: JSON.parse(text) as unknown as never, completed_at: new Date().toISOString(), progress: 100 })
            .eq("id", job?.id ?? "");
        })
        .catch(async (err) => {
          await supabase
            .from("background_jobs")
            .update({ status: "failed", error_message: err instanceof Error ? err.message : String(err), completed_at: new Date().toISOString() })
            .eq("id", job?.id ?? "");
        });
      return jsonResponse(
        { success: true, async: true, jobId: job?.id, correlationId: correlation, message: "Export is taking longer than expected. Track progress via the returned jobId." },
        202,
      );
    }
    return result as Response;
  } catch (e) {
    structuredLog("export-module-scope error", { correlationId, error: e instanceof Error ? e.message : String(e) });
    return jsonResponse({ success: false, error: "Export failed. Please try again or narrow the scope." }, 500);
  }
});
