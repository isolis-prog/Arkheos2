import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  createAilRequest,
  createBoundLogger,
  createCorrelationId,
  getServiceRoleClient,
  invokeAilWorkflow,
  jsonResponse,
  logAgentAuditEvent,
  normalizeName,
  numberOrNull,
  resolveDocumentTradeLinksSchema,
  structuredLog,
  type DocumentTradeSuggestion,
} from "../_shared/drill-enrichment.ts";

type BreakDetailRow = {
  doc_id: string | null;
  doc_type: string | null;
  external_counterparty_id: string | null;
  side_a_amount: number | null;
  side_b_amount: number | null;
  side_a_date: string | null;
  side_b_date: string | null;
  currency: string | null;
};

type CanonicalTradeRow = {
  id: string;
  trade_ref: string;
  counterparty_id: string | null;
  trade_date: string | null;
  price: number | null;
  quantity: number | null;
  currency: string | null;
  tenant_id: string;
};

type CanonicalRecordRow = {
  counterparty: string | null;
  currency: string | null;
  date_primary: string | null;
  deal_id: string | null;
  doc_id: string | null;
  line_id: string | null;
  amount: number | null;
  record_type: string;
  tenant_id: string;
};

function pickDocumentDate(detail: BreakDetailRow) {
  return detail.side_a_date ?? detail.side_b_date ?? null;
}

function withinWindow(tradeDate: string | null, documentDate: string | null) {
  if (!tradeDate || !documentDate) return true;
  const start = new Date(tradeDate).getTime();
  const end = new Date(documentDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return true;
  return Math.abs(end - start) <= 30 * 86400000;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const correlationId = createCorrelationId("resolve_doc_trade_links");

  try {
    const payload = resolveDocumentTradeLinksSchema.parse(await req.json());
    const supabase = getServiceRoleClient();
    const logger = createBoundLogger(supabase, {
      correlationId,
      tenantId: payload.tenantId,
      runId: payload.runId,
      domain: "drill_enrichment.resolve_document_trade_links",
    });
    await logger.info("resolve_document_trade_links started", { phase: "start" });

    const { data: breakDetails, error: breakDetailsError } = await supabase
      .from("break_details")
      .select("doc_id, doc_type, external_counterparty_id, side_a_amount, side_b_amount, side_a_date, side_b_date, currency")
      .eq("tenant_id", payload.tenantId)
      .eq("run_id", payload.runId)
      .not("doc_id", "is", null);

    if (breakDetailsError) throw new Error(breakDetailsError.message);

    const documents = new Map<string, BreakDetailRow>();
    for (const detail of (breakDetails ?? []) as BreakDetailRow[]) {
      if (!detail.doc_id || !detail.doc_type) continue;
      documents.set(`${detail.doc_id}::${detail.doc_type}`, detail);
    }

    const existingLinksResult = await supabase
      .from("document_trade_links")
      .select("doc_id, doc_type, deal_id")
      .eq("tenant_id", payload.tenantId);
    if (existingLinksResult.error) throw new Error(existingLinksResult.error.message);

    const existingLinkKeys = new Set((existingLinksResult.data ?? []).map((row) => `${row.doc_id}::${row.doc_type}::${row.deal_id}`));

    const canonicalRecordResult = await supabase
      .from("canonical_records")
      .select("counterparty, currency, date_primary, deal_id, doc_id, line_id, amount, record_type, tenant_id")
      .eq("tenant_id", payload.tenantId)
      .not("doc_id", "is", null);
    if (canonicalRecordResult.error) throw new Error(canonicalRecordResult.error.message);
    const canonicalRecords = (canonicalRecordResult.data ?? []) as CanonicalRecordRow[];

    const canonicalTradeResult = await supabase
      .from("canonical_trades")
      .select("id, trade_ref, counterparty_id, trade_date, price, quantity, currency, tenant_id")
      .eq("tenant_id", payload.tenantId);
    if (canonicalTradeResult.error) throw new Error(canonicalTradeResult.error.message);
    const trades = (canonicalTradeResult.data ?? []) as CanonicalTradeRow[];

    const counterpartyResult = await supabase
      .from("canonical_counterparties")
      .select("id, name, short_name")
      .eq("tenant_id", payload.tenantId);
    if (counterpartyResult.error) throw new Error(counterpartyResult.error.message);

    const counterpartyNameById = new Map((counterpartyResult.data ?? []).map((row) => [row.id, row.name]));

    const rowsToInsert: Array<Record<string, unknown>> = [];
    let inferredCount = 0;
    let unresolvedCount = 0;

    for (const [key, detail] of documents.entries()) {
      const [docId, docType] = key.split("::");
      const systemDeals = [...new Set(
        canonicalRecords
          .filter((record) => record.doc_id === docId && record.deal_id)
          .map((record) => record.deal_id as string),
      )];

      if (systemDeals.length > 0) {
        for (const dealId of systemDeals) {
          const linkKey = `${docId}::${docType}::${dealId}`;
          if (existingLinkKeys.has(linkKey)) continue;
          rowsToInsert.push({
            tenant_id: payload.tenantId,
            doc_id: docId,
            doc_type: docType,
            deal_id: dealId,
            link_source: "system",
            ai_confidence: 1,
          });
        }
        continue;
      }

      const documentDate = pickDocumentDate(detail);
      const candidateTrades = trades.filter((trade) => {
        if (detail.external_counterparty_id && trade.counterparty_id !== detail.external_counterparty_id) {
          return false;
        }
        return withinWindow(trade.trade_date, documentDate);
      });

      const contextPayload = {
        document: {
          doc_id: docId,
          doc_type: docType,
          counterparty_id: detail.external_counterparty_id,
          counterparty_name: detail.external_counterparty_id ? counterpartyNameById.get(detail.external_counterparty_id) ?? null : null,
          document_date: documentDate,
          amount: numberOrNull(detail.side_b_amount ?? detail.side_a_amount),
          currency: detail.currency,
        },
        candidates: candidateTrades.map((trade) => ({
          deal_id: trade.trade_ref,
          trade_date: trade.trade_date,
          counterparty_name: trade.counterparty_id ? counterpartyNameById.get(trade.counterparty_id) ?? null : null,
          price: trade.price,
          quantity: trade.quantity,
          currency: trade.currency,
        })),
      };

      let suggestions: DocumentTradeSuggestion[] = [];
      let requestId: string | null = null;
      try {
        requestId = await createAilRequest(supabase, {
          tenantId: payload.tenantId,
          workflowType: "DOCUMENT_TRADE_LINKING",
          contextPayload,
        });

        const result = await logger.timed(
          "ail_invoke DOCUMENT_TRADE_LINKING",
          () => invokeAilWorkflow<{ links?: DocumentTradeSuggestion[] }>(supabase, {
            requestId: requestId!,
            tenantId: payload.tenantId,
            workflowType: "DOCUMENT_TRADE_LINKING",
            contextPayload,
            entityId: docId,
            entityType: "document",
            correlationId,
          }),
          { input: contextPayload, getOutput: (r) => r ?? null },
          { ail_request_id: requestId, doc_id: docId, doc_type: docType, candidate_count: candidateTrades.length, workflow: "DOCUMENT_TRADE_LINKING" },
        );

        suggestions = (result?.links ?? []).filter((item) => item.confidence >= 0.5);

        await logAgentAuditEvent(supabase, {
          action: "resolve_document_trade_links_inference",
          tenantId: payload.tenantId,
          entityType: "document",
          entityId: docId,
          runId: payload.runId,
          toolName: "resolve-document-trade-links",
          inputJson: contextPayload,
          outputJson: result ?? { links: [] },
        });
      } catch (error) {
        await logger.error("ail_invoke DOCUMENT_TRADE_LINKING failed", {
          ail_request_id: requestId,
          doc_id: docId,
          doc_type: docType,
          error: error instanceof Error ? error.message : String(error),
        });
        await logAgentAuditEvent(supabase, {
          action: "resolve_document_trade_links_inference_failed",
          tenantId: payload.tenantId,
          entityType: "document",
          entityId: docId,
          runId: payload.runId,
          toolName: "resolve-document-trade-links",
          inputJson: contextPayload,
          outputJson: { error: error instanceof Error ? error.message : String(error) },
        });
      }

      if (suggestions.length === 0) {
        unresolvedCount += 1;
        await logger.warn("document left unresolved", { doc_id: docId, doc_type: docType });
        continue;
      }

      inferredCount += 1;
      for (const suggestion of suggestions) {
        const linkKey = `${docId}::${docType}::${suggestion.deal_id}`;
        if (existingLinkKeys.has(linkKey)) continue;
        rowsToInsert.push({
          tenant_id: payload.tenantId,
          doc_id: docId,
          doc_type: docType,
          deal_id: suggestion.deal_id,
          link_source: "ai_inference",
          allocation_pct: suggestion.allocation_pct,
          ai_confidence: suggestion.confidence,
        });
      }
    }

    if (rowsToInsert.length > 0) {
      // Idempotent upsert keyed by the natural unique constraint
      // (tenant_id, doc_id, doc_type, deal_id). Using ignoreDuplicates so a
      // retry after a partial success does not throw on already-present rows.
      await logger.timed(
        "upsert document_trade_links",
        async () => {
          const { error: insertError } = await supabase
            .from("document_trade_links")
            .upsert(rowsToInsert, {
              onConflict: "tenant_id,doc_id,doc_type,deal_id",
              ignoreDuplicates: true,
            });
          if (insertError) throw new Error(insertError.message);
        },
        {
          input: { keys: rowsToInsert.map((r) => `${r.doc_id}::${r.doc_type}::${r.deal_id}`) },
          getOutput: () => ({ inserted: rowsToInsert.length }),
        },
        { table: "document_trade_links", op: "upsert", row_count: rowsToInsert.length, conflict_target: "tenant_id,doc_id,doc_type,deal_id" },
      );
    }

    await logger.info("resolve_document_trade_links completed", {
      inserted: rowsToInsert.length,
      inferredDocuments: inferredCount,
      unresolvedDocuments: unresolvedCount,
    });

    return jsonResponse({
      success: true,
      metrics: {
        runId: payload.runId,
        inserted: rowsToInsert.length,
        inferredDocuments: inferredCount,
        unresolvedDocuments: unresolvedCount,
        correlationId,
      },
    });
  } catch (error) {
    structuredLog("resolve document trade links failed", {
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
