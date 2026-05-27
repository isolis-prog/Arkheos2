// Load / performance test for the cashflows drill stack.
//
// What it does:
//   1. (Optional) seeds N synthetic cashflow_event + consolidated_cashflow rows
//      for the caller's tenant so the MVs have realistic volume (~100k by default).
//   2. Benchmarks:
//        - public.refresh_cashflow_drill_mvs(as_of_date)
//        - get_mv_cashflow_by_bucket(as_of_date)
//        - get_mv_cashflow_by_entity(as_of_date)
//        - get_mv_cashflow_by_counterparty(as_of_date)
//        - get_mv_cashflow_by_document(as_of_date)
//   3. Writes one structured_logs row per timed operation (domain =
//      'perf.cashflow_drill') and returns a JSON summary including p50/p95
//      across `iterations` runs of each drill RPC.
//
// Auth: requires a logged-in user; tenant is resolved from their profile via
// get_user_tenant_id(). Service-role client is used internally so the seed
// step can bulk-insert without RLS friction.
//
// POST body (all optional):
//   {
//     "asOfDate": "2026-04-25",      // default: today
//     "seedCount": 100000,            // 0 to skip seeding
//     "iterations": 3,                // drill RPC repeats per level
//     "cleanupSeed": false            // remove seeded rows on exit
//   }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import {
  corsHeaders,
  createBoundLogger,
  createCorrelationId,
  getServiceRoleClient,
  jsonResponse,
  structuredLog,
} from "../_shared/drill-enrichment.ts";

const BodySchema = z.object({
  asOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  seedCount: z.number().int().min(0).max(500_000).optional(),
  iterations: z.number().int().min(1).max(10).optional(),
  cleanupSeed: z.boolean().optional(),
});

const SEED_TAG = "perf_test_cashflow_drill";
const BATCH_SIZE = 1_000;

// ─── Realistic distribution helpers ──────────────────────────────────────
// Deterministic PRNG (Mulberry32) so a given correlationId is reproducible.
function makeRng(seedStr: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i += 1) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let a = h || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller standard normal
function gaussian(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Log-normal amount: median ~$25k, fat right tail (rare invoices >$5M)
function logNormalAmount(rng: () => number): number {
  const mu = Math.log(25_000);
  const sigma = 1.4;
  const raw = Math.exp(mu + sigma * gaussian(rng));
  return Math.max(50, Math.min(15_000_000, Math.round(raw * 100) / 100));
}

// Pareto / Zipf-style skewed pick: top items dominate. alpha>1 => heavier head.
function zipfPick(rng: () => number, n: number, alpha = 1.2): number {
  // Inverse CDF approximation for power-law over [0, n-1]
  const u = rng();
  const idx = Math.floor(n * Math.pow(u, alpha));
  return Math.min(n - 1, Math.max(0, idx));
}

// Weighted pick from [{w, v}]
function weightedPick<T>(rng: () => number, items: { w: number; v: T }[]): T {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = rng() * total;
  for (const it of items) {
    r -= it.w;
    if (r <= 0) return it.v;
  }
  return items[items.length - 1].v;
}

// Production-like value-date bucket distribution (correlated with status):
//   - 12% OVERDUE (past 1-90 days)
//   - 28% D0-30   (next 30 days)  ← biggest near-term bucket
//   - 22% D31-60
//   - 18% D61-90
//   - 12% D91-180
//   -  8% BEYOND_180
// Returns day offset from asOfDate (negative = past).
function pickDayOffset(rng: () => number): { dayOffset: number; bucket: string } {
  const bucket = weightedPick(rng, [
    { w: 12, v: "OVERDUE" },
    { w: 28, v: "D30" },
    { w: 22, v: "D60" },
    { w: 18, v: "D90" },
    { w: 12, v: "D180" },
    { w: 8, v: "BEYOND_180" },
  ]);
  const r = rng();
  switch (bucket) {
    case "OVERDUE":
      return { dayOffset: -Math.floor(1 + r * 89), bucket };
    case "D30":
      return { dayOffset: Math.floor(r * 30), bucket };
    case "D60":
      return { dayOffset: 31 + Math.floor(r * 30), bucket };
    case "D90":
      return { dayOffset: 61 + Math.floor(r * 30), bucket };
    case "D180":
      return { dayOffset: 91 + Math.floor(r * 90), bucket };
    default:
      return { dayOffset: 181 + Math.floor(r * 545), bucket };
  }
}

// Status correlated with bucket (overdue → more PENDING/EXCEPTION, near-term → mostly PENDING, far → FORECAST)
function pickStatus(rng: () => number, bucket: string): string {
  if (bucket === "OVERDUE") {
    return weightedPick(rng, [
      { w: 70, v: "PENDING" },
      { w: 20, v: "EXCEPTION" },
      { w: 10, v: "PARTIAL" },
    ]);
  }
  if (bucket === "BEYOND_180" || bucket === "D180") {
    return weightedPick(rng, [
      { w: 75, v: "FORECAST" },
      { w: 25, v: "PENDING" },
    ]);
  }
  return weightedPick(rng, [
    { w: 88, v: "PENDING" },
    { w: 7, v: "FORECAST" },
    { w: 5, v: "EXCEPTION" },
  ]);
}

// Currency mix: USD dominant, then EUR, GBP, CHF, SGD
function pickCurrency(rng: () => number): string {
  return weightedPick(rng, [
    { w: 62, v: "USD" },
    { w: 22, v: "EUR" },
    { w: 8, v: "GBP" },
    { w: 4, v: "CHF" },
    { w: 4, v: "SGD" },
  ]);
}

// Direction: slight inflow skew (receivables dominate in trading P&L)
function pickDirection(rng: () => number, bucket: string): string {
  // OVERDUE skewed toward INFLOW (unpaid receivables)
  if (bucket === "OVERDUE") return rng() < 0.72 ? "INFLOW" : "OUTFLOW";
  return rng() < 0.55 ? "INFLOW" : "OUTFLOW";
}

// Source priority distribution
function pickSourcePriority(rng: () => number, bucket: string): { source: string; confidence: number } {
  if (bucket === "BEYOND_180" || bucket === "D180") {
    return { source: "ETRM_FORECAST", confidence: 40 + Math.floor(rng() * 15) };
  }
  return weightedPick(rng, [
    { w: 35, v: { source: "ERP_INVOICE", confidence: 78 + Math.floor(rng() * 8) } },
    { w: 25, v: { source: "ETRM_SETTLEMENT", confidence: 58 + Math.floor(rng() * 10) } },
    { w: 20, v: { source: "ERP_PAYMENT_RUN", confidence: 88 + Math.floor(rng() * 6) } },
    { w: 12, v: { source: "BANK", confidence: 96 + Math.floor(rng() * 4) } },
    { w: 8, v: { source: "ETRM_FORECAST", confidence: 38 + Math.floor(rng() * 12) } },
  ]);
}

// FX → base (rough): USD=1, EUR=1.08, GBP=1.27, CHF=1.13, SGD=0.74
const FX_TO_BASE: Record<string, number> = {
  USD: 1, EUR: 1.08, GBP: 1.27, CHF: 1.13, SGD: 0.74,
};

function pct(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function summarize(samples: number[]) {
  const total = samples.reduce((a, b) => a + b, 0);
  return {
    runs: samples.length,
    min_ms: samples.length ? Math.min(...samples) : 0,
    max_ms: samples.length ? Math.max(...samples) : 0,
    avg_ms: samples.length ? Math.round(total / samples.length) : 0,
    p50_ms: Math.round(pct(samples, 50)),
    p95_ms: Math.round(pct(samples, 95)),
    samples_ms: samples.map((v) => Math.round(v)),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  const correlationId = createCorrelationId("perf_cashflow_drill");

  try {
    // --- Auth: resolve caller and tenant ---------------------------------
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ success: false, error: "Missing bearer token" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ success: false, error: "Invalid auth" }, 401);
    }
    const userId = userData.user.id;

    const supabase = getServiceRoleClient();
    const { data: tenantRow, error: tenantErr } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .maybeSingle();
    if (tenantErr || !tenantRow?.tenant_id) {
      return jsonResponse({ success: false, error: "Tenant not resolved for caller" }, 403);
    }
    const tenantId = tenantRow.tenant_id as string;

    // --- Validate body ---------------------------------------------------
    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonResponse(
        { success: false, error: parsed.error.flatten().fieldErrors as unknown as string },
        400,
      );
    }
    const asOfDate = parsed.data.asOfDate ?? new Date().toISOString().slice(0, 10);
    const seedCount = parsed.data.seedCount ?? 100_000;
    const iterations = parsed.data.iterations ?? 3;
    const cleanupSeed = parsed.data.cleanupSeed ?? false;

    const logger = createBoundLogger(supabase, {
      correlationId,
      tenantId,
      userId,
      domain: "perf.cashflow_drill",
    });
    await logger.info("perf test started", { asOfDate, seedCount, iterations, cleanupSeed });

    const report: Record<string, unknown> = {
      correlationId,
      tenantId,
      asOfDate,
      seedCount,
      iterations,
    };

    // --- Step 1: optional seeding ---------------------------------------
    if (seedCount > 0) {
      const seedStart = performance.now();
      let inserted = 0;
      const tag = `${SEED_TAG}:${correlationId}`;
      const rng = makeRng(`${tenantId}:${correlationId}`);

      // Pool sizes — production-realistic cardinality
      const NUM_LEGAL_ENTITIES = 12;   // top 3 ≈ 60% of volume via Zipf
      const NUM_COUNTERPARTIES = 180;  // top 20 ≈ 60% of volume via Zipf

      for (let offset = 0; offset < seedCount; offset += BATCH_SIZE) {
        const batchSize = Math.min(BATCH_SIZE, seedCount - offset);
        const consolidatedRows: Record<string, unknown>[] = [];
        const eventRows: Record<string, unknown>[] = [];

        for (let i = 0; i < batchSize; i += 1) {
          const { dayOffset, bucket } = pickDayOffset(rng);
          const valueDate = new Date(asOfDate);
          valueDate.setUTCDate(valueDate.getUTCDate() + dayOffset);
          const valueDateStr = valueDate.toISOString().slice(0, 10);

          const direction = pickDirection(rng, bucket);
          const status = pickStatus(rng, bucket);
          const currency = pickCurrency(rng);
          const amountOriginal = logNormalAmount(rng);
          const amountBase = Math.round(amountOriginal * (FX_TO_BASE[currency] ?? 1) * 100) / 100;
          const { source, confidence } = pickSourcePriority(rng, bucket);

          const leIdx = zipfPick(rng, NUM_LEGAL_ENTITIES, 1.4);
          const cpIdx = zipfPick(rng, NUM_COUNTERPARTIES, 1.2);
          const counterparty = `PERF_CP_${String(cpIdx).padStart(3, "0")}`;
          const legalEntity = `PERF_LE_${String(leIdx).padStart(2, "0")}`;

          const consolidatedId = crypto.randomUUID();
          consolidatedRows.push({
            id: consolidatedId,
            tenant_id: tenantId,
            value_date: valueDateStr,
            amount_original: amountOriginal,
            amount_base: amountBase,
            currency,
            direction,
            status,
            counterparty,
            legal_entity: legalEntity,
            confidence_score: confidence,
            source_priority: source,
            metadata: { seed_tag: tag, bucket },
          });

          eventRows.push({
            id: crypto.randomUUID(),
            tenant_id: tenantId,
            consolidated_id: consolidatedId,
            value_date: valueDateStr,
            amount_original: amountOriginal,
            amount_base: amountBase,
            currency,
            direction,
            source_system: source,
            counterparty,
            legal_entity: legalEntity,
            metadata: { seed_tag: tag, bucket, status },
          });
        }

        const { error: cErr } = await supabase
          .from("consolidated_cashflow")
          .insert(consolidatedRows);
        if (cErr) throw new Error(`seed consolidated_cashflow failed: ${cErr.message}`);

        const { error: eErr } = await supabase
          .from("cashflow_event")
          .insert(eventRows);
        if (eErr) throw new Error(`seed cashflow_event failed: ${eErr.message}`);

        inserted += batchSize;
      }

      const seedMs = Math.round(performance.now() - seedStart);
      report.seed = { inserted, duration_ms: seedMs, tag };
      await logger.info("seed completed", { inserted, duration_ms: seedMs, tag });
    }

    // --- Step 2: refresh MVs --------------------------------------------
    const refreshSamples: number[] = [];
    for (let i = 0; i < iterations; i += 1) {
      const t0 = performance.now();
      const { error } = await supabase.rpc("refresh_cashflow_drill_mvs", {
        p_as_of_date: asOfDate,
      });
      const dur = performance.now() - t0;
      if (error) throw new Error(`refresh_cashflow_drill_mvs failed: ${error.message}`);
      refreshSamples.push(dur);
      await logger.info("refresh_cashflow_drill_mvs sample", {
        iteration: i + 1,
        duration_ms: Math.round(dur),
      });
    }
    report.refresh_cashflow_drill_mvs = summarize(refreshSamples);

    // --- Step 3: benchmark drill RPCs -----------------------------------
    const drillRpcs: Array<{ name: string; rpc: string }> = [
      { name: "by_bucket", rpc: "get_mv_cashflow_by_bucket" },
      { name: "by_entity", rpc: "get_mv_cashflow_by_entity" },
      { name: "by_counterparty", rpc: "get_mv_cashflow_by_counterparty" },
      { name: "by_document", rpc: "get_mv_cashflow_by_document" },
    ];

    // Use the user-scoped client so RLS / tenant filter inside the SECURITY
    // DEFINER RPC is exercised exactly as production reads do.
    const drillResults: Record<string, unknown> = {};
    for (const { name, rpc } of drillRpcs) {
      const samples: number[] = [];
      let lastRowCount = 0;
      for (let i = 0; i < iterations; i += 1) {
        const t0 = performance.now();
        const { data, error } = await userClient.rpc(rpc, { _as_of_date: asOfDate });
        const dur = performance.now() - t0;
        if (error) throw new Error(`${rpc} failed: ${error.message}`);
        lastRowCount = Array.isArray(data) ? data.length : 0;
        samples.push(dur);
        await logger.info(`${rpc} sample`, {
          iteration: i + 1,
          duration_ms: Math.round(dur),
          row_count: lastRowCount,
        });
      }
      drillResults[name] = { ...summarize(samples), row_count: lastRowCount };
    }
    report.drill_rpcs = drillResults;

    // --- Step 4: optional cleanup ---------------------------------------
    if (seedCount > 0 && cleanupSeed) {
      const tag = `${SEED_TAG}:${correlationId}`;
      const cleanupStart = performance.now();
      const { error: e1 } = await supabase
        .from("cashflow_event")
        .delete()
        .eq("tenant_id", tenantId)
        .contains("metadata", { seed_tag: tag });
      const { error: e2 } = await supabase
        .from("consolidated_cashflow")
        .delete()
        .eq("tenant_id", tenantId)
        .contains("metadata", { seed_tag: tag });
      const cleanupMs = Math.round(performance.now() - cleanupStart);
      report.cleanup = {
        duration_ms: cleanupMs,
        cashflow_event_error: e1?.message ?? null,
        consolidated_cashflow_error: e2?.message ?? null,
      };
      await logger.info("cleanup completed", report.cleanup as Record<string, unknown>);
    }

    await logger.info("perf test completed", { asOfDate, iterations, seedCount });
    return jsonResponse({ success: true, metrics: report });
  } catch (error) {
    structuredLog("perf test failed", {
      correlationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});
