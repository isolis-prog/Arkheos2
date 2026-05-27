// ─── Demo Pack Seeder ───────────────────────────────────────────────
// Generates an end-to-end demo dataset across 3 scenarios:
//   1. Happy Path  — perfect, interconnected records
//   2. Stress Test — invalid/edge-case rows the system must reject
//   3. Workflow    — varied statuses & volume for paginations / filters
//
// Body: { tenantId: string, scenarios?: ('happy'|'stress'|'workflow')[],
//         volume?: 'S'|'M'|'L', confirm: true, mode?: 'seed'|'clean' }
// ────────────────────────────────────────────────────────────────────
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const TAG = "DEMO_PACK";              // identifier on every synthetic row
const REF_PREFIX = "DEMO-";           // prefix on textual refs
const ATTR_FLAG = { __demo_pack: true };

type Scenario = "happy" | "stress" | "workflow";
type Volume = "S" | "M" | "L";

const VOLUMES: Record<Volume, {
  trades: number; invoices: number; cashflows: number; runs: number; confirmations: number;
}> = {
  S: { trades: 60, invoices: 50, cashflows: 120, runs: 6, confirmations: 40 },
  M: { trades: 200, invoices: 160, cashflows: 400, runs: 12, confirmations: 100 },
  L: { trades: 600, invoices: 480, cashflows: 1200, runs: 24, confirmations: 250 },
};

// ─── Deterministic RNG ─────────────────────────────────────────────
class RNG {
  private s: number;
  constructor(seed: number) { this.s = seed; }
  next() { this.s = (this.s + 0x6d2b79f5) | 0; let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  int(a: number, b: number) { return Math.floor(this.next() * (b - a + 1)) + a; }
  pick<T>(arr: T[]): T { return arr[this.int(0, arr.length - 1)]; }
  float(a: number, b: number, d = 2) { const f = 10 ** d; return Math.round((this.next() * (b - a) + a) * f) / f; }
  date(start: Date, end: Date) { return new Date(start.getTime() + this.next() * (end.getTime() - start.getTime())).toISOString().split("T")[0]; }
}

const COUNTERPARTIES = ["Goldman Sachs", "Morgan Stanley", "JP Morgan", "BP Trading", "Shell Trading", "Vitol", "Trafigura", "Glencore", "Mercuria", "Gunvor"];
const PRODUCTS = [
  { code: "WTI_FUT", name: "WTI Crude Future", commodity: "Crude Oil" },
  { code: "BRENT_FUT", name: "Brent Crude Future", commodity: "Crude Oil" },
  { code: "NG_HH_FUT", name: "Henry Hub Natural Gas", commodity: "Natural Gas" },
  { code: "PWR_PJM", name: "PJM Power", commodity: "Power" },
  { code: "LNG_JKM", name: "JKM LNG Swap", commodity: "LNG" },
  { code: "EUA_FUT", name: "EU Allowance", commodity: "Carbon" },
];
const CURRENCIES = ["USD", "EUR", "GBP"];
const TRADE_STATUSES = ["active", "active", "active", "settled", "cancelled", "amended"];
const INVOICE_STATUSES = ["pending", "approved", "paid", "overdue", "disputed"];
const RUN_STATUSES = ["completed", "completed", "completed", "running", "failed"];

async function batch(supabase: any, table: string, rows: any[], log: string[], size = 250): Promise<number> {
  if (!rows.length) return 0;
  let ok = 0;
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error, count } = await supabase.from(table).insert(chunk, { count: "exact" });
    if (error) { log.push(`[${table}] batch ${i / size}: ${error.message}`); }
    else { ok += count ?? chunk.length; }
  }
  return ok;
}

// ─── CLEAN ─────────────────────────────────────────────────────────
async function clean(supabase: any, tenantId: string, log: string[]) {
  const filter = (q: any) => q.eq("tenant_id", tenantId).contains("attributes", ATTR_FLAG);
  const filterRef = (q: any, col: string) => q.eq("tenant_id", tenantId).like(col, `${REF_PREFIX}%`);

  // child first
  await filterRef(supabase.from("confirmation_discrepancies").delete(), "deal_id");
  await filterRef(supabase.from("trade_confirmation_status").delete(), "deal_id");
  await supabase.from("confirmation_documents").delete().eq("tenant_id", tenantId).like("external_doc_ref", `${REF_PREFIX}%`);
  await supabase.from("confirmation_runs").delete().eq("tenant_id", tenantId).contains("metrics", ATTR_FLAG);
  await filterRef(supabase.from("break_details").delete(), "doc_id");
  await supabase.from("exception_cases").delete().eq("tenant_id", tenantId).like("summary", `${REF_PREFIX}%`);
  await filterRef(supabase.from("document_trade_links").delete(), "doc_id");
  await supabase.from("reconciliation_runs").delete().eq("tenant_id", tenantId).contains("metrics", ATTR_FLAG);
  await supabase.from("recon_runs").delete().eq("tenant_id", tenantId).contains("metrics", ATTR_FLAG);
  await supabase.from("reconciliation_templates").delete().eq("tenant_id", tenantId).like("name", `${REF_PREFIX}%`);
  await filterRef(supabase.from("cashflow_event").delete(), "reference");
  await filterRef(supabase.from("consolidated_cashflow").delete(), "reference");
  await filter(supabase.from("canonical_payments").delete());
  await filter(supabase.from("canonical_invoices").delete());
  await filter(supabase.from("canonical_trades").delete());
  await filter(supabase.from("canonical_products").delete());
  await filter(supabase.from("canonical_counterparties").delete());
  log.push("clean: removed all DEMO_PACK rows");
}

// ─── HAPPY PATH ────────────────────────────────────────────────────
async function seedHappy(supabase: any, tenantId: string, vol: typeof VOLUMES[Volume], rng: RNG, log: string[]) {
  const today = new Date();
  const monthAgo = new Date(today.getTime() - 30 * 86400e3);
  const ahead = new Date(today.getTime() + 60 * 86400e3);
  const stats: Record<string, number> = {};

  // Counterparties
  const cps = COUNTERPARTIES.map((n, i) => ({
    tenant_id: tenantId, name: `${REF_PREFIX}${n}`, code: `${REF_PREFIX}CP${i}`,
    counterparty_type: i % 2 ? "broker" : "trader",
    attributes: { ...ATTR_FLAG, scenario: "happy" },
  }));
  stats.counterparties = await batch(supabase, "canonical_counterparties", cps, log);
  const { data: cpRows } = await supabase.from("canonical_counterparties").select("id,name").eq("tenant_id", tenantId).contains("attributes", ATTR_FLAG);

  // Products
  const prods = PRODUCTS.map(p => ({
    tenant_id: tenantId, product_code: `${REF_PREFIX}${p.code}`, name: p.name,
    commodity: p.commodity, uom: "BBL",
    attributes: { ...ATTR_FLAG, scenario: "happy" },
  }));
  stats.products = await batch(supabase, "canonical_products", prods, log);
  const { data: prodRows } = await supabase.from("canonical_products").select("id,product_code").eq("tenant_id", tenantId).contains("attributes", ATTR_FLAG);

  // Trades
  const trades: any[] = [];
  for (let i = 0; i < vol.trades; i++) {
    const cp = rng.pick((cpRows ?? []) as any[]);
    const pr = rng.pick((prodRows ?? []) as any[]);
    const qty = rng.float(100, 50000);
    const px = rng.float(20, 150, 4);
    trades.push({
      tenant_id: tenantId,
      trade_ref: `${REF_PREFIX}TRD-${String(i + 1).padStart(5, "0")}`,
      counterparty_id: cp?.id, product_id: pr?.id,
      trade_date: rng.date(monthAgo, today),
      value_date: rng.date(today, ahead),
      direction: rng.pick(["BUY", "SELL"]),
      quantity: qty, price: px,
      currency: rng.pick(CURRENCIES),
      status: rng.pick(TRADE_STATUSES),
      attributes: { ...ATTR_FLAG, scenario: "happy", notional: qty * px },
    });
  }
  stats.trades = await batch(supabase, "canonical_trades", trades, log);
  const { data: tradeRows } = await supabase.from("canonical_trades").select("id,trade_ref,counterparty_id,quantity,price,currency,value_date").eq("tenant_id", tenantId).contains("attributes", ATTR_FLAG).limit(vol.trades);

  // Invoices (linked to ~80% of trades)
  const invoices: any[] = [];
  const invTrades = (tradeRows ?? []).slice(0, Math.floor(vol.invoices));
  invTrades.forEach((t: any, i: number) => {
    const amount = +(t.quantity * t.price).toFixed(2);
    invoices.push({
      tenant_id: tenantId,
      invoice_ref: `${REF_PREFIX}INV-${String(i + 1).padStart(5, "0")}`,
      counterparty_id: t.counterparty_id, trade_id: t.id,
      invoice_date: t.value_date,
      due_date: new Date(new Date(t.value_date).getTime() + 30 * 86400e3).toISOString().split("T")[0],
      amount, currency: t.currency,
      status: rng.pick(INVOICE_STATUSES),
      attributes: { ...ATTR_FLAG, scenario: "happy" },
    });
  });
  stats.invoices = await batch(supabase, "canonical_invoices", invoices, log);

  // Cashflow events (forecast & actual)
  const flows: any[] = [];
  for (let i = 0; i < vol.cashflows; i++) {
    const t = rng.pick((tradeRows ?? []) as any[]);
    const dir = rng.pick(["INFLOW", "OUTFLOW"]);
    const amt = rng.float(1000, 500000);
    const status = rng.pick(["FORECAST", "FORECAST", "EXPECTED", "ACTUAL", "ACTUAL"]);
    flows.push({
      tenant_id: tenantId,
      source_system: "ETRM",
      source_object_type: "TRADE",
      source_object_id: t?.trade_ref ?? `${REF_PREFIX}SRC-${i}`,
      legal_entity: `${REF_PREFIX}LE-${(i % 3) + 1}`,
      counterparty: COUNTERPARTIES[i % COUNTERPARTIES.length],
      direction: dir,
      currency_original: rng.pick(CURRENCIES),
      amount_original: amt, amount_base: amt,
      base_currency: "USD",
      value_date: rng.date(monthAgo, ahead),
      status, confidence_score: rng.int(60, 99),
      reference: `${REF_PREFIX}CF-${String(i + 1).padStart(5, "0")}`,
    });
  }
  stats.cashflows = await batch(supabase, "cashflow_event", flows, log);

  // Reconciliation template + runs
  const { data: tplRows } = await supabase.from("reconciliation_templates").insert([{
    tenant_id: tenantId, name: `${REF_PREFIX}ETRM vs ERP Fees`, description: "Demo template",
    template_type: "fees", side_a_source: "ETRM", side_a_dataset: "fees",
    side_b_source: "NetSuite", side_b_dataset: "journal_entries", is_active: true,
  }]).select("id");
  const tplId = tplRows?.[0]?.id;

  const runs: any[] = [];
  for (let i = 0; i < vol.runs; i++) {
    const day = new Date(today.getTime() - i * 86400e3).toISOString().split("T")[0];
    runs.push({
      tenant_id: tenantId, template_id: tplId,
      status: rng.pick(RUN_STATUSES),
      started_at: new Date(today.getTime() - i * 86400e3 - 3600e3).toISOString(),
      completed_at: new Date(today.getTime() - i * 86400e3).toISOString(),
      metrics: { ...ATTR_FLAG, total: rng.int(50, 500), matched: rng.int(40, 480), breaks: rng.int(0, 30), period: day },
    });
  }
  stats.runs = await batch(supabase, "reconciliation_runs", runs, log);

  return stats;
}

// ─── STRESS TEST ───────────────────────────────────────────────────
async function seedStress(supabase: any, tenantId: string, log: string[]) {
  const stats: Record<string, number> = {};
  const stories: string[] = [];

  // 1) Duplicate trade_ref (unique conflict expected)
  const dupRef = `${REF_PREFIX}STRESS-DUP-001`;
  const { error: e1a } = await supabase.from("canonical_trades").insert({
    tenant_id: tenantId, trade_ref: dupRef, quantity: 100, price: 50, currency: "USD",
    trade_date: "2024-12-01", direction: "BUY", status: "active",
    attributes: { ...ATTR_FLAG, scenario: "stress", story: "duplicate_ref_first" },
  });
  const { error: e1b } = await supabase.from("canonical_trades").insert({
    tenant_id: tenantId, trade_ref: dupRef, quantity: 200, price: 75, currency: "USD",
    trade_date: "2024-12-02", direction: "SELL", status: "active",
    attributes: { ...ATTR_FLAG, scenario: "stress", story: "duplicate_ref_second" },
  });
  stats.duplicate_attempts = 2;
  stories.push(`Duplicate trade_ref "${dupRef}": first ${e1a ? "REJECTED" : "accepted"}, second ${e1b ? "REJECTED ✓" : "accepted (no UNIQUE constraint)"}`);

  // 2) Negative quantity / invalid numeric
  const negQty = await supabase.from("canonical_trades").insert({
    tenant_id: tenantId, trade_ref: `${REF_PREFIX}STRESS-NEG-001`,
    quantity: -9999, price: -1.5, currency: "USD",
    trade_date: "2024-12-15", direction: "BUY", status: "active",
    attributes: { ...ATTR_FLAG, scenario: "stress", story: "negative_quantity_and_price", expected_block: "business rule, not DB" },
  });
  if (!negQty.error) stats.negative_inserted = 1;
  stories.push(`Negative qty/price row: ${negQty.error ? "REJECTED at DB" : "inserted (relies on app-level validation)"}`);

  // 3) Impossible date (Feb 30 → use Mar 02 as nearest valid - we send invalid string)
  const badDate = await supabase.from("canonical_trades").insert({
    tenant_id: tenantId, trade_ref: `${REF_PREFIX}STRESS-DATE-001`,
    quantity: 100, price: 50, currency: "USD",
    trade_date: "2024-02-30", direction: "BUY", status: "active",
    attributes: { ...ATTR_FLAG, scenario: "stress", story: "impossible_date_feb30" },
  });
  stories.push(`Impossible date 2024-02-30: ${badDate.error ? "REJECTED ✓ — " + badDate.error.message : "accepted (unexpected)"}`);

  // 4) Special chars in text fields (SQL/XSS safety)
  const xss = await supabase.from("canonical_trades").insert({
    tenant_id: tenantId, trade_ref: `${REF_PREFIX}STRESS-XSS-<script>alert(1)</script>`,
    quantity: 100, price: 50, currency: "USD",
    trade_date: "2024-12-10", direction: "BUY", status: "active",
    attributes: { ...ATTR_FLAG, scenario: "stress", story: "xss_in_ref", note: "'; DROP TABLE--" },
  });
  if (!xss.error) stats.xss_inserted = 1;
  stories.push(`XSS / SQLi payload in trade_ref: ${xss.error ? "REJECTED" : "stored safely (parameterized queries OK)"}`);

  // 5) Outlier values — extreme magnitudes for charts
  const outlierCp = (await supabase.from("canonical_counterparties").select("id").eq("tenant_id", tenantId).contains("attributes", ATTR_FLAG).limit(1).single()).data?.id;
  await supabase.from("canonical_trades").insert([
    { tenant_id: tenantId, trade_ref: `${REF_PREFIX}STRESS-MAX-001`, counterparty_id: outlierCp, quantity: 1e9, price: 99999.9999, currency: "USD", trade_date: "2024-12-20", direction: "BUY", status: "active", attributes: { ...ATTR_FLAG, scenario: "stress", story: "outlier_max" } },
    { tenant_id: tenantId, trade_ref: `${REF_PREFIX}STRESS-MIN-001`, counterparty_id: outlierCp, quantity: 0.0001, price: 0.0001, currency: "USD", trade_date: "2024-12-20", direction: "SELL", status: "active", attributes: { ...ATTR_FLAG, scenario: "stress", story: "outlier_min" } },
  ]);
  stats.outliers = 2;
  stories.push(`Outliers (1e9 notional & 0.0001 micro-trade) inserted to stress charts/aggregations.`);

  // 6) Orphan invoice — references non-existent trade
  const orphanInv = await supabase.from("canonical_invoices").insert({
    tenant_id: tenantId, invoice_ref: `${REF_PREFIX}STRESS-ORPH-001`,
    trade_id: "00000000-0000-0000-0000-000000000999", // doesn't exist
    invoice_date: "2024-12-01", due_date: "2025-01-01",
    amount: 1000, currency: "USD", status: "pending",
    attributes: { ...ATTR_FLAG, scenario: "stress", story: "orphan_invoice_invalid_trade_fk" },
  });
  stories.push(`Orphan invoice → non-existent trade FK: ${orphanInv.error ? "REJECTED ✓ (FK enforced) — " + orphanInv.error.message : "accepted (FK missing!)"}`);

  // 7) Orphan invoice — null trade_id (allowed by schema, but flagged in app)
  const nullTrade = await supabase.from("canonical_invoices").insert({
    tenant_id: tenantId, invoice_ref: `${REF_PREFIX}STRESS-ORPH-002`,
    trade_id: null, invoice_date: "2024-12-01", due_date: "2025-01-01",
    amount: 5000, currency: "USD", status: "pending",
    attributes: { ...ATTR_FLAG, scenario: "stress", story: "invoice_without_trade" },
  });
  if (!nullTrade.error) stats.unlinked_invoices = 1;
  stories.push(`Invoice with null trade_id: ${nullTrade.error ? "REJECTED" : "stored — app surfaces as 'unmatched' in recon"}`);

  // 8) Cashflow with confidence_score out of [0,100] (CHECK constraint)
  const badConf = await supabase.from("cashflow_event").insert({
    tenant_id: tenantId, source_system: "ETRM", source_object_type: "TRADE",
    source_object_id: `${REF_PREFIX}STRESS-CONF`, legal_entity: `${REF_PREFIX}LE-X`,
    counterparty: "Stress Cp", direction: "INFLOW",
    currency_original: "USD", amount_original: 100,
    value_date: "2024-12-01", confidence_score: 250,
    reference: `${REF_PREFIX}STRESS-CONF-001`,
  });
  stories.push(`Cashflow confidence_score=250: ${badConf.error ? "REJECTED ✓ (CHECK 0-100) — " + badConf.error.message : "accepted (constraint missing!)"}`);

  // 9) Invalid enum direction
  const badEnum = await supabase.from("cashflow_event").insert({
    tenant_id: tenantId, source_system: "ETRM", source_object_type: "TRADE",
    source_object_id: `${REF_PREFIX}STRESS-ENUM`, legal_entity: `${REF_PREFIX}LE-X`,
    counterparty: "Stress Cp", direction: "SIDEWAYS" as any,
    currency_original: "USD", amount_original: 100,
    value_date: "2024-12-01",
    reference: `${REF_PREFIX}STRESS-ENUM-001`,
  });
  stories.push(`Cashflow direction='SIDEWAYS' (not in enum): ${badEnum.error ? "REJECTED ✓ — " + badEnum.error.message : "accepted (enum missing!)"}`);

  // 10) Cross-tenant attempt — insert with bogus tenant_id
  const xtenant = await supabase.from("canonical_trades").insert({
    tenant_id: "00000000-0000-0000-0000-000000000fff",
    trade_ref: `${REF_PREFIX}STRESS-XT-001`, quantity: 100, price: 50, currency: "USD",
    trade_date: "2024-12-01", direction: "BUY", status: "active",
    attributes: { ...ATTR_FLAG, scenario: "stress", story: "cross_tenant_attempt" },
  });
  stories.push(`Cross-tenant insert (bogus tenant_id): ${xtenant.error ? "REJECTED ✓ (FK to tenants) — " + xtenant.error.message : "accepted (tenant FK weak!)"}`);

  return { stats, stories };
}

// ─── WORKFLOW (varied statuses + volume) ───────────────────────────
async function seedWorkflow(supabase: any, tenantId: string, vol: typeof VOLUMES[Volume], rng: RNG, log: string[]) {
  const stats: Record<string, number> = {};
  const today = new Date();

  // Confirmation run + statuses across stages → drives KPI cards
  const { data: cRun } = await supabase.from("confirmation_runs").insert({
    tenant_id: tenantId, as_of_date: today.toISOString().split("T")[0],
    status: "completed", started_at: today.toISOString(), completed_at: today.toISOString(),
    total_trades: vol.confirmations, matched_count: 0, unmatched_count: 0, disputed_count: 0,
    metrics: ATTR_FLAG,
  }).select("run_id").single();

  const stages = ["matched", "matched", "matched", "matched", "awaiting_counterparty", "awaiting_us", "disputed", "amended"];
  const statuses: any[] = [];
  for (let i = 0; i < vol.confirmations; i++) {
    const stage = stages[i % stages.length];
    statuses.push({
      tenant_id: tenantId, run_id: cRun?.run_id,
      deal_id: `${REF_PREFIX}WF-DEAL-${String(i + 1).padStart(4, "0")}`,
      stage,
      field_discrepancy_count: stage === "disputed" ? rng.int(1, 5) : 0,
      material_discrepancy_count: stage === "disputed" ? rng.int(0, 2) : 0,
      blocking_settlement: stage === "disputed" && i % 4 === 0,
      last_action_at: new Date(today.getTime() - i * 3600e3).toISOString(),
      sla_breach_at: ["awaiting_counterparty", "awaiting_us", "disputed"].includes(stage)
        ? new Date(today.getTime() + 86400e3).toISOString() : null,
    });
  }
  stats.confirmation_statuses = await batch(supabase, "trade_confirmation_status", statuses, log);

  return stats;
}

// ─── MAIN ──────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const tenantId: string = body.tenantId;
    const scenarios: Scenario[] = body.scenarios ?? ["happy", "stress", "workflow"];
    const volume: Volume = body.volume ?? "M";
    const mode: "seed" | "clean" = body.mode ?? "seed";
    const confirm: boolean = body.confirm === true;

    if (!tenantId) return new Response(JSON.stringify({ error: "tenantId required" }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    if (!confirm) return new Response(JSON.stringify({ error: "confirm:true required" }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const log: string[] = [];
    const t0 = Date.now();

    if (mode === "clean") {
      await clean(supabase, tenantId, log);
      return new Response(JSON.stringify({ ok: true, mode, log, elapsed_ms: Date.now() - t0 }), { headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    const vol = VOLUMES[volume];
    const rng = new RNG(1337);
    const result: any = { mode, volume, scenarios, tenantId, sections: {} };

    if (scenarios.includes("happy")) result.sections.happy = await seedHappy(supabase, tenantId, vol, rng, log);
    if (scenarios.includes("stress")) result.sections.stress = await seedStress(supabase, tenantId, log);
    if (scenarios.includes("workflow")) result.sections.workflow = await seedWorkflow(supabase, tenantId, vol, rng, log);

    result.elapsed_ms = Date.now() - t0;
    result.log = log;

    return new Response(JSON.stringify(result, null, 2), { headers: { ...corsHeaders, "content-type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});
