import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

const InputSchema = z.object({
  runId: z.string().uuid(),
  tenantId: z.string().uuid(),
  asOfDate: z.string(),
});

interface FieldRule {
  rule_id: string;
  field_name: string;
  field_category: string | null;
  match_type: string;
  tolerance_value: number | null;
  tolerance_unit: string | null;
  is_material_by_default: boolean;
}

interface ConfDoc {
  confirmation_doc_id: string;
  doc_type: string;
  counterparty_id: string | null;
  trade_date: string | null;
  notional: number | null;
  product_code: string | null;
  parsed_attributes: Record<string, unknown> | null;
}

// SLA hours per product family
const SLA_HOURS: Record<string, number> = {
  FX_FWD: 24,
  FX_SPOT: 24,
  IRS_USD: 48,
  OIL_FUT: 48,
  GAS_SWAP: 48,
  POWER_OPT: 72,
  DEFAULT: 48,
};

// Normalization helper for match_type='normalized'. Bare A-Z0-9 fold.
function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// ---- Field canonicalizers (alias folding) ----------------------------------
// Counterparties send equivalent business terms in many shapes ("MF" vs
// "Modified Following", "Q" vs "3M" vs "Quarterly"). These maps fold each
// known alias into a single canonical token so the matcher does not raise
// spurious format-only or mismatch breaks. Mirror of
// `src/lib/confirmations/fieldCanonicalizers.ts`.
const BDC_ALIASES: Record<string, string> = {
  F: "FOLLOWING", FOL: "FOLLOWING", FOLLOWING: "FOLLOWING", FLW: "FOLLOWING",
  MF: "MODIFIED_FOLLOWING", MODF: "MODIFIED_FOLLOWING", MODFOL: "MODIFIED_FOLLOWING",
  MODFOLLOWING: "MODIFIED_FOLLOWING", MODIFIEDFOLLOWING: "MODIFIED_FOLLOWING", MODFLW: "MODIFIED_FOLLOWING",
  P: "PRECEDING", PREC: "PRECEDING", PRECEDING: "PRECEDING", PRV: "PRECEDING", PREVIOUS: "PRECEDING",
  MP: "MODIFIED_PRECEDING", MODP: "MODIFIED_PRECEDING", MODPREC: "MODIFIED_PRECEDING",
  MODIFIEDPRECEDING: "MODIFIED_PRECEDING", MODPREV: "MODIFIED_PRECEDING",
  NONE: "NONE", NA: "NONE", NOADJUSTMENT: "NONE", NOADJ: "NONE",
  NEAR: "NEAREST", NEAREST: "NEAREST",
};

const SETTLEMENT_TYPE_ALIASES: Record<string, string> = {
  CASH: "CASH", CASHSETTLED: "CASH", CASHSETTLEMENT: "CASH", CSH: "CASH",
  PHYS: "PHYSICAL", PHYSICAL: "PHYSICAL", PHYSICALDELIVERY: "PHYSICAL",
  PHYSDEL: "PHYSICAL", DELIVERY: "PHYSICAL",
  ELECTIVE: "ELECTIVE", OPTIONAL: "ELECTIVE",
  NETCASH: "NET_CASH", NETSETTLEMENT: "NET_CASH", NETTED: "NET_CASH",
};

const PAYMENT_FREQ_ALIASES: Record<string, string> = {
  D: "1D", DAILY: "1D",
  W: "1W", WEEKLY: "1W", BW: "2W", BIWEEKLY: "2W", FORTNIGHTLY: "2W",
  M: "1M", MTH: "1M", MONTHLY: "1M", "1M": "1M",
  BM: "2M", BIMONTHLY: "2M", "2M": "2M",
  Q: "3M", QTR: "3M", QUARTERLY: "3M", "3M": "3M",
  S: "6M", SA: "6M", SEMIANNUAL: "6M", SEMIANNUALLY: "6M", HALFYEARLY: "6M", "6M": "6M",
  A: "1Y", Y: "1Y", ANNUAL: "1Y", ANNUALLY: "1Y", YEARLY: "1Y", "1Y": "1Y", "12M": "1Y",
  BULLET: "BULLET", ATMATURITY: "BULLET", SINGLE: "BULLET", ZEROCOUPON: "BULLET",
  ZC: "BULLET", ONETIME: "BULLET", ONESHOT: "BULLET",
};

function canonicalSettlementCycle(raw: string): string {
  if (/^(SAMEDAY|SAMEDAY|SD|TODAY|T\+?0|T0)$/.test(raw)) return "T+0";
  const m = raw.match(/T\s*[+\-]?\s*PLUS\s*(\d+)/) || raw.match(/T\s*[+\-]?\s*(\d+)/);
  if (m) return `T+${parseInt(m[1], 10)}`;
  const d = raw.match(/^(\d+)D(AYS?)?$/);
  if (d) return `T+${parseInt(d[1], 10)}`;
  if (raw === "SPOT") return "T+2";
  return raw;
}

function canonicalizeFieldValue(fieldName: string, value: unknown): string {
  const k = normalizeValue(value);
  if (!k) return "";
  switch ((fieldName ?? "").toLowerCase()) {
    case "business_day_convention":
    case "bdc":
      return BDC_ALIASES[k] ?? k;
    case "settlement_type":
      return SETTLEMENT_TYPE_ALIASES[k] ?? k;
    case "settlement_cycle":
      return canonicalSettlementCycle(k);
    case "payment_frequency":
    case "pay_freq":
    case "fixed_leg_payment_frequency":
    case "floating_leg_payment_frequency": {
      if (PAYMENT_FREQ_ALIASES[k]) return PAYMENT_FREQ_ALIASES[k];
      const m = k.match(/^(\d+)([DWMY])$/);
      return m ? `${parseInt(m[1], 10)}${m[2]}` : k;
    }
    default:
      return k;
  }
}

function compareValues(
  rule: FieldRule,
  ourVal: unknown,
  theirVal: unknown,
): { isMismatch: boolean; isMaterial: boolean; type: string; ourNorm: string; theirNorm: string } {
  if (ourVal === undefined && theirVal === undefined) {
    return { isMismatch: false, isMaterial: false, type: "match", ourNorm: "", theirNorm: "" };
  }
  if (ourVal === undefined || ourVal === null) {
    return {
      isMismatch: true, isMaterial: rule.is_material_by_default, type: "missing_our_side",
      ourNorm: "", theirNorm: String(theirVal ?? ""),
    };
  }
  if (theirVal === undefined || theirVal === null) {
    return {
      isMismatch: true, isMaterial: rule.is_material_by_default, type: "missing_their_side",
      ourNorm: String(ourVal ?? ""), theirNorm: "",
    };
  }

  const ourStr = String(ourVal);
  const theirStr = String(theirVal);

  switch (rule.match_type) {
    case "exact": {
      const eq = ourStr === theirStr;
      return { isMismatch: !eq, isMaterial: !eq && rule.is_material_by_default, type: eq ? "match" : "mismatch", ourNorm: ourStr, theirNorm: theirStr };
    }
    case "case_insensitive": {
      const eq = ourStr.toLowerCase() === theirStr.toLowerCase();
      return { isMismatch: !eq, isMaterial: !eq && rule.is_material_by_default, type: eq ? "match" : "mismatch", ourNorm: ourStr.toLowerCase(), theirNorm: theirStr.toLowerCase() };
    }
    case "normalized": {
      // Field-aware canonicalization (BDC, settlement type/cycle, payment freq).
      // Falls back to bare A-Z0-9 fold for unknown field names.
      const a = canonicalizeFieldValue(rule.field_name, ourVal);
      const b = canonicalizeFieldValue(rule.field_name, theirVal);
      const eq = a === b;
      const rawDiffers = ourStr !== theirStr;
      return {
        isMismatch: !eq || rawDiffers,
        isMaterial: !eq && rule.is_material_by_default,
        type: eq ? (rawDiffers ? "format_only" : "match") : "mismatch",
        ourNorm: a, theirNorm: b,
      };
    }
    case "numeric_tolerance": {
      const a = Number(ourVal);
      const b = Number(theirVal);
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return { isMismatch: true, isMaterial: rule.is_material_by_default, type: "mismatch", ourNorm: ourStr, theirNorm: theirStr };
      }
      const tol = rule.tolerance_value ?? 0;
      const base = Math.max(Math.abs(a), Math.abs(b), 1);
      const diffPct = Math.abs(a - b) / base;
      const within = diffPct <= tol;
      return {
        isMismatch: !within,
        isMaterial: !within && rule.is_material_by_default,
        type: within ? "match" : "mismatch",
        ourNorm: a.toString(), theirNorm: b.toString(),
      };
    }
    case "date_tolerance": {
      const a = new Date(ourStr).getTime();
      const b = new Date(theirStr).getTime();
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return { isMismatch: true, isMaterial: rule.is_material_by_default, type: "mismatch", ourNorm: ourStr, theirNorm: theirStr };
      }
      const tolDays = rule.tolerance_value ?? 0;
      const diffDays = Math.abs(a - b) / 86400000;
      const within = diffDays <= tolDays;
      return {
        isMismatch: !within,
        isMaterial: !within && rule.is_material_by_default,
        type: within ? "match" : "mismatch",
        ourNorm: ourStr, theirNorm: theirStr,
      };
    }
    default: {
      const eq = ourStr === theirStr;
      return { isMismatch: !eq, isMaterial: !eq && rule.is_material_by_default, type: eq ? "match" : "mismatch", ourNorm: ourStr, theirNorm: theirStr };
    }
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const correlationId = `match-conf_${crypto.randomUUID()}`;
  const startedAt = Date.now();

  try {
    const parsed = InputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { runId, tenantId, asOfDate } = parsed.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    console.log(JSON.stringify({ message: "match-confirmations start", correlationId, runId, tenantId, asOfDate }));

    // 1. Mark run as running
    await supabase
      .from("confirmation_runs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("run_id", runId).eq("tenant_id", tenantId);

    // 2. Load field rules
    const { data: rulesData, error: rulesError } = await supabase
      .from("confirmation_field_rules")
      .select("rule_id, field_name, field_category, match_type, tolerance_value, tolerance_unit, is_material_by_default")
      .eq("tenant_id", tenantId).eq("active", true);
    if (rulesError) throw new Error(`Load rules failed: ${rulesError.message}`);
    const rules = (rulesData ?? []) as FieldRule[];

    // 3. Load all confirmation_documents for this tenant up to asOfDate
    const { data: docsData, error: docsError } = await supabase
      .from("confirmation_documents")
      .select("confirmation_doc_id, doc_type, counterparty_id, trade_date, notional, product_code, parsed_attributes")
      .eq("tenant_id", tenantId)
      .lte("trade_date", asOfDate);
    if (docsError) throw new Error(`Load docs failed: ${docsError.message}`);
    const docs = (docsData ?? []) as ConfDoc[];

    // 4. Pair documents by (counterparty_id, trade_date, product_code) — pick best matching pair
    const pairKey = (d: ConfDoc) => `${d.counterparty_id ?? "_"}|${d.trade_date ?? "_"}|${d.product_code ?? "_"}`;
    const oursByKey = new Map<string, ConfDoc[]>();
    const theirsByKey = new Map<string, ConfDoc[]>();
    for (const d of docs) {
      const k = pairKey(d);
      if (d.doc_type === "our_capture") {
        if (!oursByKey.has(k)) oursByKey.set(k, []);
        oursByKey.get(k)!.push(d);
      } else if (d.doc_type === "counterparty_confirm" || d.doc_type === "broker_confirm" || d.doc_type === "electronic_message") {
        if (!theirsByKey.has(k)) theirsByKey.set(k, []);
        theirsByKey.get(k)!.push(d);
      }
    }

    // 5. Process trades — for each unique key, evaluate field-level diffs
    const allKeys = new Set<string>([...oursByKey.keys(), ...theirsByKey.keys()]);
    let matchedCount = 0, disputedCount = 0, unmatchedCount = 0;
    const discrepanciesToInsert: Record<string, unknown>[] = [];
    const statusToUpsert: Record<string, unknown>[] = [];

    let dealCounter = 0;
    for (const key of allKeys) {
      dealCounter += 1;
      const ours = (oursByKey.get(key) ?? [])[0] ?? null;
      const theirs = (theirsByKey.get(key) ?? [])[0] ?? null;
      const dealId = ours?.confirmation_doc_id ?? theirs?.confirmation_doc_id ?? `pair-${dealCounter}`;
      const productCode = ours?.product_code ?? theirs?.product_code ?? "DEFAULT";
      const slaHours = SLA_HOURS[productCode] ?? SLA_HOURS.DEFAULT;
      const tradeDate = ours?.trade_date ?? theirs?.trade_date ?? asOfDate;
      const slaBreachAt = new Date(new Date(tradeDate).getTime() + slaHours * 3600_000).toISOString();

      let stage: string;
      let fieldDisc = 0;
      let materialDisc = 0;
      let blocking = false;

      if (!ours && theirs) {
        stage = "awaiting_us";
      } else if (ours && !theirs) {
        const tradeMs = new Date(tradeDate).getTime();
        const ageHours = (Date.now() - tradeMs) / 3600_000;
        stage = ageHours > slaHours ? "disputed" : "awaiting_counterparty";
      } else if (ours && theirs) {
        const ourAttrs = (ours.parsed_attributes ?? {}) as Record<string, unknown>;
        const theirAttrs = (theirs.parsed_attributes ?? {}) as Record<string, unknown>;

        for (const rule of rules) {
          const cmp = compareValues(rule, ourAttrs[rule.field_name], theirAttrs[rule.field_name]);
          if (!cmp.isMismatch) continue;
          fieldDisc += 1;
          if (cmp.isMaterial) materialDisc += 1;

          discrepanciesToInsert.push({
            tenant_id: tenantId,
            run_id: runId,
            deal_id: dealId,
            field_name: rule.field_name,
            field_category: rule.field_category,
            our_value: cmp.type === "missing_our_side" ? null : String(ourAttrs[rule.field_name] ?? ""),
            counterparty_value: cmp.type === "missing_their_side" ? null : String(theirAttrs[rule.field_name] ?? ""),
            our_value_normalized: cmp.ourNorm,
            counterparty_value_normalized: cmp.theirNorm,
            is_material: cmp.isMaterial,
            tolerance_applied: rule.tolerance_value ? `${rule.match_type}:${rule.tolerance_value}${rule.tolerance_unit ?? ""}` : rule.match_type,
            discrepancy_type: cmp.type === "format_only" ? "format_only" : (cmp.type === "missing_our_side" || cmp.type === "missing_their_side" ? cmp.type : "mismatch"),
            status: cmp.type === "format_only" ? "accepted_as_is" : "open",
          });
        }

        stage = materialDisc > 0 ? "disputed" : "matched";

        // blocking: disputed and trade settles within 3 business days (approx with calendar days)
        if (stage === "disputed") {
          const daysToSettle = (new Date(tradeDate).getTime() + 3 * 86400000 - Date.now()) / 86400000;
          if (daysToSettle <= 3 && daysToSettle >= -1) blocking = true;
        }
      } else {
        continue;
      }

      if (stage === "matched") matchedCount += 1;
      else if (stage === "disputed") disputedCount += 1;
      else unmatchedCount += 1;

      statusToUpsert.push({
        tenant_id: tenantId,
        run_id: runId,
        deal_id: dealId,
        our_capture_doc_id: ours?.confirmation_doc_id ?? null,
        counterparty_confirm_doc_id: theirs?.confirmation_doc_id ?? null,
        stage,
        field_discrepancy_count: fieldDisc,
        material_discrepancy_count: materialDisc,
        blocking_settlement: blocking,
        last_action_at: new Date().toISOString(),
        sla_breach_at: stage === "matched" ? null : slaBreachAt,
      });
    }

    // 6. Bulk insert discrepancies (chunked) and upsert status (chunked)
    for (const batch of chunk(discrepanciesToInsert, 500)) {
      const { error } = await supabase.from("confirmation_discrepancies").upsert(batch, {
        onConflict: "run_id,deal_id,field_name", ignoreDuplicates: false,
      });
      if (error) console.error("discrepancy upsert error", error.message);
    }
    for (const batch of chunk(statusToUpsert, 500)) {
      const { error } = await supabase.from("trade_confirmation_status").upsert(batch, {
        onConflict: "tenant_id,deal_id,run_id", ignoreDuplicates: false,
      });
      if (error) console.error("status upsert error", error.message);
    }

    // 7. Trigger AIL discrepancy analysis (batched per 20)
    const openDiscrepancies = discrepanciesToInsert.filter((d) => d.status === "open");
    let aiAnalyzed = 0;
    for (const batch of chunk(openDiscrepancies, 20)) {
      try {
        const { data: req } = await supabase
          .from("ail_inference_requests")
          .insert({
            tenant_id: tenantId,
            workflow_type: "CONFIRMATION_DISCREPANCY_ANALYSIS",
            requesting_module: "match-confirmations",
            context_payload: { discrepancies: batch, correlation_id: correlationId },
            status: "QUEUED",
          })
          .select("request_id").single();
        if (req?.request_id) {
          await supabase.functions.invoke("ail-cde-dispatcher", {
            body: {
              request_id: req.request_id,
              tenant_id: tenantId,
              workflow_type: "CONFIRMATION_DISCREPANCY_ANALYSIS",
              context_payload: { discrepancies: batch },
              entity_id: runId,
              entity_type: "confirmation_run",
            },
          });
          aiAnalyzed += batch.length;
        }
      } catch (err) {
        console.error("AIL invoke failed for discrepancy batch", err);
      }
    }

    // 8. Refresh MVs
    await supabase.rpc("refresh_confirmation_drill_mvs", { p_run_id: runId });

    // 9. Update run completion
    const totalTrades = matchedCount + disputedCount + unmatchedCount;
    await supabase
      .from("confirmation_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        total_trades: totalTrades,
        matched_count: matchedCount,
        unmatched_count: unmatchedCount,
        disputed_count: disputedCount,
        metadata: { correlation_id: correlationId, ai_analyzed: aiAnalyzed, duration_ms: Date.now() - startedAt },
      })
      .eq("run_id", runId).eq("tenant_id", tenantId);

    // 10. Audit
    await supabase.from("agent_audit_events").insert({
      actor_type: "system",
      tenant_id: tenantId,
      entity_type: "confirmation_run",
      entity_id: runId,
      run_id: runId,
      action: "match_confirmations_complete",
      tool_name: "match-confirmations",
      input_json: { runId, asOfDate },
      output_json: { totalTrades, matchedCount, disputedCount, unmatchedCount, durationMs: Date.now() - startedAt },
    });

    return new Response(
      JSON.stringify({
        success: true,
        metrics: { totalTrades, matchedCount, disputedCount, unmatchedCount, discrepancies: discrepanciesToInsert.length, durationMs: Date.now() - startedAt },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("match-confirmations error", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
