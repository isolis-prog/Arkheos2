import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  chunk,
  computeAmountDeltaPct,
  computeDateDeltaDays,
  corsHeaders,
  createAilRequest,
  createBoundLogger,
  createCorrelationId,
  enrichBreakDetailsSchema,
  getServiceRoleClient,
  invokeAilWorkflow,
  jsonResponse,
  logAgentAuditEvent,
  normalizeName,
  numberOrNull,
  pickDate,
  structuredLog,
  type RootCauseSuggestion,
} from "../_shared/drill-enrichment.ts";

type ExceptionCaseRow = {
  id: string;
  run_id: string;
  tenant_id: string;
  exception_type: string;
  status: string;
  summary: string | null;
  description: string | null;
  amount: number | null;
  currency: string | null;
  evidence: Record<string, unknown> | null;
};

type ReconRecordRow = {
  id: string;
  amount: number | null;
  counterparty: string | null;
  currency: string | null;
  description: string | null;
  external_id: string | null;
  raw_json: Record<string, unknown> | null;
  record_date: string | null;
  run_id: string;
  source: string;
};

type CanonicalRecordRow = {
  id: string;
  amount: number | null;
  counterparty: string | null;
  currency: string | null;
  date_primary: string | null;
  deal_id: string | null;
  doc_id: string | null;
  economic_date: string | null;
  fee_type: string | null;
  legal_entity: string | null;
  line_id: string | null;
  memo: string | null;
  record_type: string;
  source_system: string;
  tenant_id: string;
};

type CounterpartyRow = { id: string; name: string; short_name: string | null; tenant_id: string };

type MatchCandidateRow = {
  left_record_id: string;
  right_record_id: string;
  score_total: number;
};

function getEvidenceRecordId(evidence: Record<string, unknown> | null, key: "record_a" | "record_b") {
  const record = evidence?.[key];
  if (!record || typeof record !== "object") return null;
  return (record as Record<string, unknown>).id as string | null;
}

function deriveDocType(record: CanonicalRecordRow | null, reconRecord: ReconRecordRow | null) {
  const rawDocType = reconRecord?.raw_json?.doc_type;
  if (typeof rawDocType === "string" && rawDocType.trim()) return rawDocType;
  return record?.record_type ?? null;
}

function buildLookupKeys(record: ReconRecordRow | null) {
  const keys = new Set<string>();
  if (!record) return [] as string[];
  if (record.external_id) keys.add(record.external_id);
  const raw = record.raw_json ?? {};
  for (const field of ["doc_id", "line_id", "document_id", "invoice_id", "voucher_id"]) {
    const value = raw[field];
    if (typeof value === "string" && value.trim()) keys.add(value);
  }
  return [...keys];
}

function resolveCanonicalRecord(
  reconRecord: ReconRecordRow | null,
  canonicalByDocOrLine: Map<string, CanonicalRecordRow[]>,
): CanonicalRecordRow | null {
  for (const key of buildLookupKeys(reconRecord)) {
    const match = canonicalByDocOrLine.get(key);
    if (match?.length) {
      return match[0];
    }
  }
  return null;
}

function classifyBreakCategory(params: {
  exceptionType: string;
  sideA: CanonicalRecordRow | null;
  sideB: CanonicalRecordRow | null;
  sideAAmount: number | null;
  sideBAmount: number | null;
  sideADate: string | null;
  sideBDate: string | null;
}) {
  const currencyA = params.sideA?.currency ?? null;
  const currencyB = params.sideB?.currency ?? null;
  if (currencyA && currencyB && currencyA !== currencyB) {
    return "currency_mismatch";
  }

  const amountDeltaPct = Math.abs(computeAmountDeltaPct(params.sideAAmount, params.sideBAmount));
  const dateDeltaDays = Math.abs(computeDateDeltaDays(params.sideADate, params.sideBDate) ?? 0);
  if (amountDeltaPct <= 3 && dateDeltaDays > 2) {
    return "date_mismatch";
  }

  return params.exceptionType;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const correlationId = createCorrelationId("enrich_break_details");

  try {
    const payload = enrichBreakDetailsSchema.parse(await req.json());
    const supabase = getServiceRoleClient();
    const logger = createBoundLogger(supabase, {
      correlationId,
      tenantId: payload.tenantId,
      runId: payload.runId,
      userId: payload.userId ?? null,
      domain: "drill_enrichment.enrich_break_details",
    });
    await logger.info("enrich_break_details started", { phase: "start" });

    const { data: run, error: runError } = await supabase
      .from("reconciliation_runs")
      .select("id, tenant_id")
      .eq("id", payload.runId)
      .eq("tenant_id", payload.tenantId)
      .single();

    if (runError || !run) {
      throw new Error(runError?.message ?? "Reconciliation run not found");
    }

    const [exceptionResult, reconRecordResult, candidateResult, canonicalRecordResult, counterpartyResult] = await Promise.all([
      supabase
        .from("exception_cases")
        .select("id, run_id, tenant_id, exception_type, status, summary, description, amount, currency, evidence")
        .eq("run_id", payload.runId)
        .eq("tenant_id", payload.tenantId),
      supabase.from("recon_records").select("*").eq("run_id", payload.runId),
      supabase.from("match_candidates").select("left_record_id, right_record_id, score_total").eq("run_id", payload.runId).order("score_total", { ascending: false }),
      supabase
        .from("canonical_records")
        .select("id, amount, counterparty, currency, date_primary, deal_id, doc_id, economic_date, fee_type, legal_entity, line_id, memo, record_type, source_system, tenant_id")
        .eq("tenant_id", payload.tenantId),
      supabase
        .from("canonical_counterparties")
        .select("id, name, short_name, tenant_id")
        .eq("tenant_id", payload.tenantId),
    ]);

    if (exceptionResult.error) throw new Error(exceptionResult.error.message);
    if (reconRecordResult.error) throw new Error(reconRecordResult.error.message);
    if (candidateResult.error) throw new Error(candidateResult.error.message);
    if (canonicalRecordResult.error) throw new Error(canonicalRecordResult.error.message);
    if (counterpartyResult.error) throw new Error(counterpartyResult.error.message);

    const exceptionCases = (exceptionResult.data ?? []) as ExceptionCaseRow[];
    const reconRecords = (reconRecordResult.data ?? []) as ReconRecordRow[];
    const matchCandidates = (candidateResult.data ?? []) as MatchCandidateRow[];
    const canonicalRecords = (canonicalRecordResult.data ?? []) as CanonicalRecordRow[];
    const counterparties = (counterpartyResult.data ?? []) as CounterpartyRow[];

    const reconRecordById = new Map(reconRecords.map((record) => [record.id, record]));
    const bestCandidateByLeftId = new Map<string, MatchCandidateRow>();
    for (const candidate of matchCandidates) {
      if (!bestCandidateByLeftId.has(candidate.left_record_id)) {
        bestCandidateByLeftId.set(candidate.left_record_id, candidate);
      }
    }

    const canonicalByDocOrLine = new Map<string, CanonicalRecordRow[]>();
    for (const record of canonicalRecords) {
      for (const key of [record.doc_id, record.line_id]) {
        if (!key) continue;
        const bucket = canonicalByDocOrLine.get(key) ?? [];
        bucket.push(record);
        canonicalByDocOrLine.set(key, bucket);
      }
    }

    const counterpartyByNormalizedName = new Map<string, CounterpartyRow>();
    for (const counterparty of counterparties) {
      for (const value of [counterparty.name, counterparty.short_name]) {
        const normalized = normalizeName(value);
        if (normalized && !counterpartyByNormalizedName.has(normalized)) {
          counterpartyByNormalizedName.set(normalized, counterparty);
        }
      }
    }

    const rootCauseByCaseId = new Map<string, RootCauseSuggestion>();

    for (const [batchIndex, batch] of chunk(exceptionCases, 20).entries()) {
      const contextPayload = {
        exceptions: batch.map((exceptionCase) => ({
          exception_case_id: exceptionCase.id,
          exception_type: exceptionCase.exception_type,
          status: exceptionCase.status,
          summary: exceptionCase.summary,
          description: exceptionCase.description,
          evidence: exceptionCase.evidence,
        })),
      };

      try {
        const requestId = await createAilRequest(supabase, {
          tenantId: payload.tenantId,
          userId: payload.userId,
          workflowType: "RECON_ROOT_CAUSE_ANALYSIS",
          contextPayload,
        });

        const result = await logger.timed(
          "ail_invoke RECON_ROOT_CAUSE_ANALYSIS",
          () => invokeAilWorkflow<{ analyses?: RootCauseSuggestion[] }>(supabase, {
            requestId,
            tenantId: payload.tenantId,
            workflowType: "RECON_ROOT_CAUSE_ANALYSIS",
            contextPayload,
            entityId: payload.runId,
            entityType: "reconciliation_run",
            correlationId,
          }),
          { input: contextPayload, getOutput: (r) => r ?? null },
          { ail_request_id: requestId, batchIndex, batchSize: batch.length, workflow: "RECON_ROOT_CAUSE_ANALYSIS" },
        );

        for (const analysis of result?.analyses ?? []) {
          if (analysis?.exception_case_id) {
            rootCauseByCaseId.set(analysis.exception_case_id, analysis);
          }
        }

        await logger.info("break detail root cause batch processed", {
          batchIndex,
          batchSize: batch.length,
          ail_request_id: requestId,
          returned: result?.analyses?.length ?? 0,
        });
      } catch (error) {
        await logger.error("break detail root cause batch failed", {
          batchIndex,
          batchSize: batch.length,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const rows = exceptionCases.map((exceptionCase) => {
      const evidence = exceptionCase.evidence ?? null;
      const primaryRecord = reconRecordById.get(getEvidenceRecordId(evidence, "record_a") ?? exceptionCase.id) ?? reconRecordById.get((evidence?.record_id as string | undefined) ?? "") ?? reconRecordById.get((exceptionCase as unknown as { record_id?: string }).record_id ?? "") ?? null;
      const exceptionRecord = reconRecordById.get((exceptionCase as unknown as { record_id?: string }).record_id ?? "") ?? null;
      const leftRecord = exceptionRecord?.source === "A" ? exceptionRecord : primaryRecord ?? exceptionRecord;
      const rightRecordId = getEvidenceRecordId(evidence, "record_b") ?? (leftRecord ? bestCandidateByLeftId.get(leftRecord.id)?.right_record_id ?? null : null);
      const rightRecord = rightRecordId ? reconRecordById.get(rightRecordId) ?? null : exceptionRecord?.source === "B" ? exceptionRecord : null;

      const sideARecord = leftRecord?.source === "B" ? rightRecord : leftRecord;
      const sideBRecord = leftRecord?.source === "B" ? leftRecord : rightRecord;

      const canonicalA = resolveCanonicalRecord(sideARecord ?? null, canonicalByDocOrLine);
      const canonicalB = resolveCanonicalRecord(sideBRecord ?? null, canonicalByDocOrLine);

      const sideAAmount = canonicalA?.amount ?? numberOrNull(sideARecord?.amount) ?? null;
      const sideBAmount = canonicalB?.amount ?? numberOrNull(sideBRecord?.amount) ?? null;
      const sideADate = pickDate(canonicalA?.date_primary, canonicalA?.economic_date, sideARecord?.record_date);
      const sideBDate = pickDate(canonicalB?.date_primary, canonicalB?.economic_date, sideBRecord?.record_date);
      const docId = canonicalA?.doc_id ?? canonicalB?.doc_id ?? (typeof sideARecord?.raw_json?.doc_id === "string" ? sideARecord.raw_json.doc_id : null) ?? (typeof sideBRecord?.raw_json?.doc_id === "string" ? sideBRecord.raw_json.doc_id : null);
      const currency = canonicalA?.currency ?? canonicalB?.currency ?? sideARecord?.currency ?? sideBRecord?.currency ?? exceptionCase.currency ?? null;
      const legalEntityName = canonicalA?.legal_entity ?? canonicalB?.legal_entity ?? null;
      const externalCounterpartyName = canonicalA?.counterparty ?? canonicalB?.counterparty ?? sideARecord?.counterparty ?? sideBRecord?.counterparty ?? null;
      const amountDelta = sideAAmount !== null || sideBAmount !== null ? (sideBAmount ?? 0) - (sideAAmount ?? 0) : null;
      const amountDeltaPct = computeAmountDeltaPct(sideAAmount, sideBAmount);
      const dateDeltaDays = computeDateDeltaDays(sideADate, sideBDate);
      const ai = rootCauseByCaseId.get(exceptionCase.id);

      return {
        exception_case_id: exceptionCase.id,
        run_id: payload.runId,
        tenant_id: payload.tenantId,
        legal_entity_id: legalEntityName ? counterpartyByNormalizedName.get(normalizeName(legalEntityName))?.id ?? null : null,
        external_counterparty_id: externalCounterpartyName ? counterpartyByNormalizedName.get(normalizeName(externalCounterpartyName))?.id ?? null : null,
        doc_id: docId,
        doc_type: deriveDocType(canonicalA ?? canonicalB ?? null, sideARecord ?? sideBRecord ?? null),
        side_a_amount: sideAAmount,
        side_b_amount: sideBAmount,
        amount_delta: amountDelta,
        amount_delta_pct: amountDeltaPct,
        side_a_date: sideADate,
        side_b_date: sideBDate,
        date_delta_days: dateDeltaDays,
        currency,
        break_category: classifyBreakCategory({
          exceptionType: exceptionCase.exception_type,
          sideA: canonicalA,
          sideB: canonicalB,
          sideAAmount,
          sideBAmount,
          sideADate,
          sideBDate,
        }),
        suggested_root_cause: ai?.suggested_root_cause ?? null,
        ai_confidence: ai?.ai_confidence ?? null,
      };
    });

    await logger.timed(
      "upsert break_details",
      async () => {
        const { error: upsertError } = await supabase
          .from("break_details")
          .upsert(rows, { onConflict: "exception_case_id" });
        if (upsertError) throw new Error(upsertError.message);
      },
      { input: { rowKeys: rows.map((r) => r.exception_case_id), count: rows.length }, getOutput: () => ({ rowsUpserted: rows.length }) },
      { table: "break_details", op: "upsert", row_count: rows.length, conflict_target: "exception_case_id" },
    );

    await logAgentAuditEvent(supabase, {
      action: "enrich_break_details",
      tenantId: payload.tenantId,
      entityType: "reconciliation_run",
      entityId: payload.runId,
      runId: payload.runId,
      actorId: payload.userId ?? null,
      actorType: payload.userId ? "user" : "system",
      toolName: "enrich-break-details",
      inputJson: { runId: payload.runId, correlationId },
      outputJson: { rowsUpserted: rows.length },
    });

    await logger.info("enrich_break_details completed", {
      rowsUpserted: rows.length,
      aiAnalyses: rootCauseByCaseId.size,
    });

    return jsonResponse({
      success: true,
      metrics: {
        runId: payload.runId,
        rowsUpserted: rows.length,
        aiAnalyses: rootCauseByCaseId.size,
        correlationId,
      },
    });
  } catch (error) {
    structuredLog("enrich break details failed", {
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
