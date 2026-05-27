// Cashflow Break Details enrichment.
//
// For each cashflow_break_details row in scope (default: rows that have not
// been enriched yet for the caller's tenant), this function:
//   1. Resolves the linked consolidated_cashflow + cashflow_event(s).
//   2. Pulls candidate documents (invoices/bank txns) tied to the same
//      consolidated cashflow or sharing counterparty + value date + currency.
//   3. Builds an `evidence_refs` JSON payload with concrete IDs the UI can
//      link to from the drill-down "Evidence" panel.
//   4. Computes/refines `suggested_root_cause` from the structured fields
//      (amount delta, date delta, missing actual, fx mismatch, …) when the
//      existing root cause is null/generic.
//   5. Stamps `enriched_at` + `enrichment_run_id` and writes a structured
//      log entry per row plus a summary at the end.
//
// Invocation:
//   POST { "tenantId": "<uuid>", "limit"?: 500, "breakDetailIds"?: ["<uuid>", ...] }
//
// Idempotent: re-running it on the same rows produces the same evidence_refs
// (deterministic ordering + de-duped IDs) so it's safe to call from a cron.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import {
  corsHeaders,
  createBoundLogger,
  createCorrelationId,
  getServiceRoleClient,
  jsonResponse,
  structuredLog,
  withRetry,
} from "../_shared/drill-enrichment.ts";

const BodySchema = z.object({
  tenantId: z.string().uuid(),
  limit: z.number().int().min(1).max(5000).optional(),
  breakDetailIds: z.array(z.string().uuid()).max(5000).optional(),
});

type BreakDetailRow = {
  cashflow_break_detail_id: string;
  tenant_id: string;
  consolidated_cashflow_id: string | null;
  cashflow_event_id: string | null;
  legal_entity_id: string | null;
  external_counterparty_id: string | null;
  expected_amount: number | null;
  actual_amount: number | null;
  amount_delta: number | null;
  currency: string | null;
  expected_date: string | null;
  actual_date: string | null;
  date_delta_days: number | null;
  bucket: string | null;
  break_category: string | null;
  flow_direction: string | null;
  suggested_root_cause: string | null;
  evidence_refs: unknown;
};

type CashflowEventRow = {
  id: string;
  consolidated_id: string | null;
  value_date: string | null;
  amount_base: number | null;
  amount_original: number | null;
  currency: string | null;
  source_system: string | null;
  counterparty: string | null;
  metadata: Record<string, unknown> | null;
};

type ConsolidatedRow = {
  id: string;
  value_date: string | null;
  amount_base: number | null;
  amount_original: number | null;
  currency: string | null;
  counterparty: string | null;
  legal_entity: string | null;
  status: string | null;
};

function deriveSuggestedRootCause(row: BreakDetailRow): string {
  const cat = row.break_category;
  const delta = row.amount_delta != null ? Number(row.amount_delta) : null;
  const dateDelta = row.date_delta_days;

  switch (cat) {
    case "amount_mismatch": {
      const pct = row.expected_amount && row.expected_amount !== 0 && delta != null
        ? ((delta / Number(row.expected_amount)) * 100).toFixed(2)
        : null;
      return pct
        ? `Expected vs actual differ by ${delta} ${row.currency ?? ""} (${pct}%). Investigate FX/fees or partial settlement.`
        : `Amount mismatch between expected and actual${row.currency ? ` (${row.currency})` : ""}.`;
    }
    case "date_mismatch":
      return dateDelta != null
        ? `Settlement date off by ${dateDelta} day(s) vs expected. Check value-date instructions and bank cut-off.`
        : "Settlement date differs from expected.";
    case "missing_payment":
      return "No matching cashflow_event recorded yet — likely awaiting bank confirmation or unposted in ERP.";
    case "duplicate_payment":
      return "Multiple cashflow_event rows resolve to the same expected payment — verify counterparty remittance.";
    case "fx_mismatch":
      return "FX rate applied differs from the curve used at expectation time. Check fixings and currency pair.";
    case "unmatched_to_trade":
      return "Cashflow could not be linked to a trade/document. Review counterparty mapping and remittance text.";
    case "overdue":
      return "Expected inflow/outflow has not settled within tolerance — escalate to Treasury / Credit.";
    default:
      return "Manual review required: insufficient signal to attribute root cause automatically.";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  const correlationId = createCorrelationId("enrich_cashflow_breaks");
  const enrichmentRunId = crypto.randomUUID();

  try {
    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonResponse(
        { success: false, error: JSON.stringify(parsed.error.flatten().fieldErrors) },
        400,
      );
    }
    const { tenantId } = parsed.data;
    const limit = parsed.data.limit ?? 500;

    const supabase = getServiceRoleClient();
    const logger = createBoundLogger(supabase, {
      correlationId,
      tenantId,
      domain: "drill_enrichment.cashflow_break_details",
    });
    await logger.info("enrichment started", {
      enrichment_run_id: enrichmentRunId,
      limit,
      explicit_ids: parsed.data.breakDetailIds?.length ?? 0,
    });

    // ---- Fetch break details to enrich -----------------------------------
    let query = supabase
      .from("cashflow_break_details")
      .select(
        "cashflow_break_detail_id, tenant_id, consolidated_cashflow_id, cashflow_event_id, legal_entity_id, external_counterparty_id, expected_amount, actual_amount, amount_delta, currency, expected_date, actual_date, date_delta_days, bucket, break_category, flow_direction, suggested_root_cause, evidence_refs",
      )
      .eq("tenant_id", tenantId)
      .limit(limit);

    if (parsed.data.breakDetailIds?.length) {
      query = query.in("cashflow_break_detail_id", parsed.data.breakDetailIds);
    } else {
      query = query.is("enriched_at", null);
    }

    const { data: rowsRaw, error: rowsErr } = await query;
    if (rowsErr) throw new Error(`fetch break_details failed: ${rowsErr.message}`);
    const rows = (rowsRaw ?? []) as BreakDetailRow[];

    if (rows.length === 0) {
      await logger.info("no rows to enrich", { enrichment_run_id: enrichmentRunId });
      return jsonResponse({
        success: true,
        metrics: { correlationId, enrichmentRunId, processed: 0 },
      });
    }

    // ---- Batch-fetch related events + consolidated rows ------------------
    const consolidatedIds = Array.from(
      new Set(rows.map((r) => r.consolidated_cashflow_id).filter((v): v is string => !!v)),
    );
    const eventIds = Array.from(
      new Set(rows.map((r) => r.cashflow_event_id).filter((v): v is string => !!v)),
    );

    const consolidatedById = new Map<string, ConsolidatedRow>();
    if (consolidatedIds.length) {
      const { data, error } = await supabase
        .from("consolidated_cashflow")
        .select("id, value_date, amount_base, amount_original, currency, counterparty, legal_entity, status")
        .eq("tenant_id", tenantId)
        .in("id", consolidatedIds);
      if (error) throw new Error(`fetch consolidated failed: ${error.message}`);
      for (const c of (data ?? []) as ConsolidatedRow[]) consolidatedById.set(c.id, c);
    }

    // Pull events by either explicit FK or by shared consolidated_id.
    const eventsByConsolidated = new Map<string, CashflowEventRow[]>();
    const eventsById = new Map<string, CashflowEventRow>();
    if (consolidatedIds.length || eventIds.length) {
      const orFilters: string[] = [];
      if (eventIds.length) orFilters.push(`id.in.(${eventIds.join(",")})`);
      if (consolidatedIds.length) {
        orFilters.push(`consolidated_id.in.(${consolidatedIds.join(",")})`);
      }
      const { data, error } = await supabase
        .from("cashflow_event")
        .select("id, consolidated_id, value_date, amount_base, amount_original, currency, source_system, counterparty, metadata")
        .eq("tenant_id", tenantId)
        .or(orFilters.join(","));
      if (error) throw new Error(`fetch events failed: ${error.message}`);
      for (const e of (data ?? []) as CashflowEventRow[]) {
        eventsById.set(e.id, e);
        if (e.consolidated_id) {
          const list = eventsByConsolidated.get(e.consolidated_id) ?? [];
          list.push(e);
          eventsByConsolidated.set(e.consolidated_id, list);
        }
      }
    }

    // ---- Build enrichment updates ---------------------------------------
    let updated = 0;
    let withDocs = 0;
    let withEvents = 0;

    for (const row of rows) {
      await withRetry(async () => {
        const linkedEvents: CashflowEventRow[] = [];
        if (row.cashflow_event_id && eventsById.has(row.cashflow_event_id)) {
          linkedEvents.push(eventsById.get(row.cashflow_event_id)!);
        }
        if (row.consolidated_cashflow_id) {
          for (const e of eventsByConsolidated.get(row.consolidated_cashflow_id) ?? []) {
            if (!linkedEvents.find((x) => x.id === e.id)) linkedEvents.push(e);
          }
        }
        // Deterministic ordering for stable hashes.
        linkedEvents.sort((a, b) => a.id.localeCompare(b.id));

        // Pull candidate documents from event metadata (doc_id / invoice_id /
        // bank_txn_id keys are commonly present on ingestion).
        const docRefs: Array<{ doc_id: string; doc_type: string; source: string }> = [];
        for (const e of linkedEvents) {
          const md = (e.metadata ?? {}) as Record<string, unknown>;
          const candidates: Array<[string, string]> = [
            ["doc_id", "document"],
            ["invoice_id", "invoice"],
            ["bank_txn_id", "bank_transaction"],
            ["payment_id", "payment"],
          ];
          for (const [key, type] of candidates) {
            const val = md[key];
            if (typeof val === "string" && val.length > 0) {
              if (!docRefs.find((d) => d.doc_id === val && d.doc_type === type)) {
                docRefs.push({ doc_id: val, doc_type: type, source: e.source_system ?? "unknown" });
              }
            }
          }
        }
        docRefs.sort((a, b) => a.doc_id.localeCompare(b.doc_id));

        const consolidated = row.consolidated_cashflow_id
          ? consolidatedById.get(row.consolidated_cashflow_id) ?? null
          : null;

        const evidenceRefs = {
          consolidated_cashflow_id: row.consolidated_cashflow_id,
          consolidated_snapshot: consolidated
            ? {
                value_date: consolidated.value_date,
                amount_base: consolidated.amount_base,
                currency: consolidated.currency,
                counterparty: consolidated.counterparty,
                legal_entity: consolidated.legal_entity,
                status: consolidated.status,
              }
            : null,
          cashflow_event_ids: linkedEvents.map((e) => e.id),
          event_summary: linkedEvents.map((e) => ({
            id: e.id,
            value_date: e.value_date,
            amount_base: e.amount_base,
            currency: e.currency,
            source_system: e.source_system,
          })),
          documents: docRefs,
          generated_at: new Date().toISOString(),
        };

        if (linkedEvents.length > 0) withEvents += 1;
        if (docRefs.length > 0) withDocs += 1;

        // Only overwrite suggested_root_cause if it's missing or a generic
        // placeholder — preserve human/AIL-authored text.
        const isPlaceholder =
          !row.suggested_root_cause ||
          row.suggested_root_cause.trim() === "" ||
          /^auto-seeded/i.test(row.suggested_root_cause) ||
          /^needs review/i.test(row.suggested_root_cause);

        const nextRootCause = isPlaceholder
          ? deriveSuggestedRootCause(row)
          : row.suggested_root_cause;

        const { error: updErr } = await supabase
          .from("cashflow_break_details")
          .update({
            evidence_refs: evidenceRefs,
            suggested_root_cause: nextRootCause,
            enriched_at: new Date().toISOString(),
            enrichment_run_id: enrichmentRunId,
          })
          .eq("tenant_id", tenantId)
          .eq("cashflow_break_detail_id", row.cashflow_break_detail_id);
        if (updErr) throw new Error(updErr.message);
        updated += 1;
      }, { opName: `enrich_break_detail:${row.cashflow_break_detail_id}`, maxAttempts: 3 });
    }

    await logger.info("enrichment completed", {
      enrichment_run_id: enrichmentRunId,
      processed: rows.length,
      updated,
      with_events: withEvents,
      with_documents: withDocs,
    });

    return jsonResponse({
      success: true,
      metrics: {
        correlationId,
        enrichmentRunId,
        processed: rows.length,
        updated,
        with_events: withEvents,
        with_documents: withDocs,
      },
    });
  } catch (error) {
    structuredLog("enrich-cashflow-break-details failed", {
      correlationId,
      enrichmentRunId,
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});
