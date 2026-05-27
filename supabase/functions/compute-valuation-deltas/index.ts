import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

type Source = "FRONT_OFFICE" | "MIDDLE_OFFICE";
type ComponentType = "PV" | "MTM" | "DELTA_CASH" | "THETA" | "VEGA" | "RHO" | "GAMMA" | "FEE" | "ACCRUAL";
type Materiality = "immaterial" | "review" | "material" | "critical";

interface ValuationRecord {
  record_id: string;
  run_id: string;
  deal_id: string;
  source: Source;
  trader_desk: string | null;
  strategy: string | null;
  legal_entity_id: string | null;
  present_value: number | null;
  mtm: number | null;
  delta_cash: number | null;
  unrealized_pnl: number | null;
  realized_pnl: number | null;
  currency: string | null;
  valuation_model: string | null;
  curve_id: string | null;
  vol_surface_id: string | null;
  fx_rate_id: string | null;
  raw_attributes: Record<string, unknown> | null;
}

interface MaterialityThresholds {
  reviewPct: number;
  materialPct: number;
  criticalPct: number;
}

const DEFAULT_THRESHOLDS: MaterialityThresholds = {
  reviewPct: 0.5,
  materialPct: 2.0,
  criticalPct: 5.0,
};

function classifyMateriality(absDeltaPct: number, t: MaterialityThresholds): Materiality {
  if (absDeltaPct >= t.criticalPct) return "critical";
  if (absDeltaPct >= t.materialPct) return "material";
  if (absDeltaPct >= t.reviewPct) return "review";
  return "immaterial";
}

function pctOf(fo: number | null, mo: number | null): number {
  const f = fo ?? 0;
  const m = mo ?? 0;
  if (f === 0) return m === 0 ? 0 : 100;
  return Math.abs(((f - m) / f) * 100);
}

const COMPONENT_FIELD_MAP: Record<ComponentType, keyof ValuationRecord | null> = {
  PV: "present_value",
  MTM: "mtm",
  DELTA_CASH: "delta_cash",
  THETA: null,
  VEGA: null,
  RHO: null,
  GAMMA: null,
  FEE: null,
  ACCRUAL: null,
};

function getValue(rec: ValuationRecord | undefined, ct: ComponentType): number | null {
  if (!rec) return null;
  const field = COMPONENT_FIELD_MAP[ct];
  if (field) {
    const v = rec[field];
    return typeof v === "number" ? v : null;
  }
  // Greeks/fees from raw_attributes
  const attr = rec.raw_attributes ?? {};
  const v = (attr as Record<string, unknown>)[ct.toLowerCase()];
  return typeof v === "number" ? v : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const startedAt = Date.now();
  let runId: string | null = null;
  let tenantId: string | null = null;

  try {
    const body = await req.json();
    runId = body.runId;
    tenantId = body.tenantId;
    const thresholds: MaterialityThresholds = {
      ...DEFAULT_THRESHOLDS,
      ...(body.materialityThresholds ?? {}),
    };

    if (!runId || !tenantId) {
      return new Response(JSON.stringify({ error: "runId and tenantId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("valuation_runs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("run_id", runId)
      .eq("tenant_id", tenantId);

    // 1. Load all records for the run
    const { data: records, error: recErr } = await supabase
      .from("valuation_records")
      .select(
        "record_id, run_id, deal_id, source, trader_desk, strategy, legal_entity_id, present_value, mtm, delta_cash, unrealized_pnl, realized_pnl, currency, valuation_model, curve_id, vol_surface_id, fx_rate_id, raw_attributes"
      )
      .eq("tenant_id", tenantId)
      .eq("run_id", runId);

    if (recErr) throw recErr;
    const allRecords = (records ?? []) as ValuationRecord[];

    // 2. Group by deal
    const byDeal = new Map<string, { fo?: ValuationRecord; mo?: ValuationRecord }>();
    for (const r of allRecords) {
      const slot = byDeal.get(r.deal_id) ?? {};
      if (r.source === "FRONT_OFFICE") slot.fo = r;
      else slot.mo = r;
      byDeal.set(r.deal_id, slot);
    }

    const componentRows: Array<Record<string, unknown>> = [];
    const breakRows: Array<Record<string, unknown>> = [];
    const componentTypes: ComponentType[] = [
      "PV", "MTM", "DELTA_CASH", "THETA", "VEGA", "RHO", "GAMMA", "FEE", "ACCRUAL",
    ];

    let totalExposureUsd = 0;
    let totalBreaks = 0;

    for (const [dealId, { fo, mo }] of byDeal) {
      if (!fo || !mo) continue; // Need both sides

      let dealMaxAbsDelta = 0;
      let primaryDriverComp: ComponentType | null = null;
      let dealOverallMateriality: Materiality = "immaterial";
      let totalDelta = 0;
      let totalDeltaPct = 0;

      for (const ct of componentTypes) {
        const foVal = getValue(fo, ct);
        const moVal = getValue(mo, ct);
        if (foVal === null && moVal === null) continue;

        const delta = (foVal ?? 0) - (moVal ?? 0);
        const absDeltaPct = pctOf(foVal, moVal);
        const mat = classifyMateriality(absDeltaPct, thresholds);

        componentRows.push({
          tenant_id: tenantId,
          run_id: runId,
          deal_id: dealId,
          component_type: ct,
          fo_value: foVal,
          mo_value: moVal,
          currency: fo.currency ?? mo.currency,
          materiality_flag: mat,
        });

        if (Math.abs(delta) > Math.abs(dealMaxAbsDelta)) {
          dealMaxAbsDelta = delta;
          primaryDriverComp = ct;
        }
        if (ct === "PV") {
          totalDelta = delta;
          totalDeltaPct = (foVal ?? 0) === 0 ? 0 : (delta / (foVal as number)) * 100;
          if (mat !== "immaterial") {
            dealOverallMateriality = mat;
          }
        }
      }

      // 3. Driver attribution heuristic
      const curveDiffers = fo.curve_id && mo.curve_id && fo.curve_id !== mo.curve_id;
      const volDiffers = fo.vol_surface_id && mo.vol_surface_id && fo.vol_surface_id !== mo.vol_surface_id;
      const fxDiffers = fo.fx_rate_id && mo.fx_rate_id && fo.fx_rate_id !== mo.fx_rate_id;
      const modelDiffers =
        fo.valuation_model && mo.valuation_model && fo.valuation_model !== mo.valuation_model;

      // Simple equal-weight split among differing factors
      const drivers = [curveDiffers, volDiffers, fxDiffers, modelDiffers].filter(Boolean).length;
      const sharePerDriver = drivers > 0 ? totalDelta / drivers : 0;
      const curveDelta = curveDiffers ? sharePerDriver : 0;
      const volDelta = volDiffers ? sharePerDriver : 0;
      const fxDelta = fxDiffers ? sharePerDriver : 0;
      const modelDelta = modelDiffers ? sharePerDriver : 0;
      const explained = curveDelta + volDelta + fxDelta + modelDelta;
      const unexplained = totalDelta - explained;

      // Only insert break details if any material movement exists
      if (dealOverallMateriality !== "immaterial" || Math.abs(totalDeltaPct) >= thresholds.reviewPct) {
        const finalMateriality = dealOverallMateriality === "immaterial"
          ? classifyMateriality(Math.abs(totalDeltaPct), thresholds)
          : dealOverallMateriality;

        breakRows.push({
          tenant_id: tenantId,
          run_id: runId,
          deal_id: dealId,
          trader_desk: fo.trader_desk ?? mo.trader_desk,
          strategy: fo.strategy ?? mo.strategy,
          legal_entity_id: fo.legal_entity_id ?? mo.legal_entity_id,
          total_delta: totalDelta,
          total_delta_pct: totalDeltaPct,
          materiality_flag: finalMateriality,
          primary_driver_component: primaryDriverComp,
          curve_delta_usd: curveDelta,
          vol_delta_usd: volDelta,
          fx_delta_usd: fxDelta,
          model_delta_usd: modelDelta,
          unexplained_delta_usd: unexplained,
          status: "open",
        });
        totalBreaks++;
        totalExposureUsd += Math.abs(totalDelta);
      }
    }

    // 4. Bulk insert components
    if (componentRows.length > 0) {
      // Wipe existing components for this run first
      await supabase.from("valuation_components").delete().eq("run_id", runId).eq("tenant_id", tenantId);
      // Chunk to avoid 1MB request body limits
      const chunkSize = 500;
      for (let i = 0; i < componentRows.length; i += chunkSize) {
        const { error } = await supabase
          .from("valuation_components")
          .insert(componentRows.slice(i, i + chunkSize));
        if (error) throw error;
      }
    }

    // 5. Upsert break details
    if (breakRows.length > 0) {
      await supabase
        .from("valuation_break_details")
        .delete()
        .eq("run_id", runId)
        .eq("tenant_id", tenantId);
      const chunkSize = 500;
      for (let i = 0; i < breakRows.length; i += chunkSize) {
        const { error } = await supabase
          .from("valuation_break_details")
          .insert(breakRows.slice(i, i + chunkSize));
        if (error) throw error;
      }
    }

    // 6. AIL root cause analysis (best-effort, in batches of 20)
    let aiCalls = 0;
    let aiFailures = 0;
    if (breakRows.length > 0) {
      const { data: insertedBreaks } = await supabase
        .from("valuation_break_details")
        .select("valuation_break_detail_id, deal_id, total_delta, total_delta_pct, materiality_flag, primary_driver_component, curve_delta_usd, vol_delta_usd, fx_delta_usd, model_delta_usd, unexplained_delta_usd")
        .eq("run_id", runId)
        .eq("tenant_id", tenantId)
        .in("materiality_flag", ["material", "critical"]);

      const materialBreaks = insertedBreaks ?? [];
      for (let i = 0; i < materialBreaks.length; i += 20) {
        const batch = materialBreaks.slice(i, i + 20);
        try {
          const aiResp = await fetch(`${SUPABASE_URL}/functions/v1/ail-cde-dispatcher`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tenant_id: tenantId,
              workflow_type: "VALUATION_ROOT_CAUSE_ANALYSIS",
              context_payload: { breaks: batch },
              entity_type: "valuation_break_batch",
              entity_id: runId,
            }),
          });
          aiCalls++;
          if (aiResp.ok) {
            const aiData = await aiResp.json();
            const analyses = aiData.result_payload?.analyses ?? [];
            for (const a of analyses) {
              if (!a.deal_id) continue;
              await supabase
                .from("valuation_break_details")
                .update({
                  suggested_root_cause: a.root_cause ?? null,
                  ai_confidence: a.confidence ?? null,
                })
                .eq("run_id", runId)
                .eq("deal_id", a.deal_id);
            }
          } else {
            aiFailures++;
          }
        } catch (e) {
          aiFailures++;
          console.warn("AIL batch failed:", e);
        }
      }
    }

    // 7. Refresh MVs
    await supabase.rpc("refresh_valuation_drill_mvs", { p_run_id: runId });

    // 8. Finalize run
    const completedAt = new Date().toISOString();
    await supabase
      .from("valuation_runs")
      .update({
        status: "completed",
        completed_at: completedAt,
        total_deals: byDeal.size,
        total_breaks: totalBreaks,
        total_exposure_usd: totalExposureUsd,
      })
      .eq("run_id", runId)
      .eq("tenant_id", tenantId);

    // 9. Audit
    await supabase.from("agent_audit_events").insert({
      tenant_id: tenantId,
      actor_type: "system",
      action: "compute_valuation_deltas",
      entity_type: "valuation_run",
      entity_id: runId,
      tool_name: "compute-valuation-deltas",
      output_json: {
        total_deals: byDeal.size,
        total_breaks: totalBreaks,
        total_exposure_usd: totalExposureUsd,
        ai_calls: aiCalls,
        ai_failures: aiFailures,
        duration_ms: Date.now() - startedAt,
      },
    });

    return new Response(
      JSON.stringify({
        runId,
        totalDeals: byDeal.size,
        totalBreaks,
        totalExposureUsd,
        durationMs: Date.now() - startedAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("compute-valuation-deltas error:", e);
    if (runId && tenantId) {
      await supabase
        .from("valuation_runs")
        .update({ status: "failed", completed_at: new Date().toISOString() })
        .eq("run_id", runId)
        .eq("tenant_id", tenantId);
    }
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
