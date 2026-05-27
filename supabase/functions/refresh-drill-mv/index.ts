import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  createBoundLogger,
  createCorrelationId,
  getServiceRoleClient,
  jsonResponse,
  refreshDrillMvSchema,
  structuredLog,
  withRetry,
} from "../_shared/drill-enrichment.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const correlationId = createCorrelationId("refresh_drill_mv");

  try {
    const payload = refreshDrillMvSchema.parse(await req.json());
    const supabase = getServiceRoleClient();
    const logger = createBoundLogger(supabase, {
      correlationId,
      tenantId: payload.tenantId,
      runId: payload.runId ?? null,
      domain: "drill_enrichment.refresh_drill_mv",
    });
    await logger.info("refresh_drill_mv started", { mode: payload.runId ? "single_run" : "all_mvs" });

    if (payload.runId) {
      const startedAt = Date.now();
      // REFRESH MATERIALIZED VIEW is idempotent; safe to retry on transient
      // failures (lock contention, connection drops, statement timeouts).
      await logger.timed(
        "rpc refresh_drill_mvs",
        () => withRetry(
          async () => {
            const { error } = await supabase.rpc("refresh_drill_mvs", { p_run_id: payload.runId });
            if (error) throw new Error(error.message);
          },
          { opName: "refresh_drill_mvs", maxAttempts: 4, baseDelayMs: 500, maxDelayMs: 5000 },
        ),
        { input: { p_run_id: payload.runId }, getOutput: () => ({ ok: true }) },
        { rpc: "refresh_drill_mvs", op: "rpc" },
      );

      return jsonResponse({
        success: true,
        metrics: {
          runId: payload.runId,
          durationMs: Date.now() - startedAt,
          correlationId,
        },
      });
    }

    const mvCalls = [
      { name: "mv_recon_run_by_break_type", rpc: "refresh_mv_recon_run_by_break_type" },
      { name: "mv_recon_run_by_entity", rpc: "refresh_mv_recon_run_by_entity" },
      { name: "mv_recon_run_by_counterparty", rpc: "refresh_mv_recon_run_by_counterparty" },
      { name: "mv_recon_run_by_document", rpc: "refresh_mv_recon_run_by_document" },
    ];

    const timings = await Promise.all(mvCalls.map(async ({ name, rpc }) => {
      const startedAt = Date.now();
      await logger.timed(
        `rpc ${rpc}`,
        () => withRetry(
          async () => {
            const { error } = await supabase.rpc(rpc);
            if (error) throw new Error(`${name}: ${error.message}`);
          },
          { opName: `refresh:${name}`, maxAttempts: 4, baseDelayMs: 500, maxDelayMs: 5000 },
        ),
        { input: { rpc }, getOutput: () => ({ ok: true }) },
        { materialized_view: name, rpc, op: "rpc" },
      );
      return { name, durationMs: Date.now() - startedAt };
    }));

    await logger.info("refresh_drill_mv completed", { mv_count: mvCalls.length });
    return jsonResponse({ success: true, metrics: { correlationId, timings } });
  } catch (error) {
    structuredLog("refresh drill mv failed", {
      correlationId,
      error: error instanceof Error ? error.message : String(error),
    });

    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});
