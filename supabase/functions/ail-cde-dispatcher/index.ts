import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// ── Workflow system prompts ──
const WORKFLOW_SYSTEM_PROMPTS: Record<string, string> = {
  EXCEPTION_CLASSIFICATION:
    "You are an expert in commodity trading operations and reconciliation. Analyze this trading exception and provide a structured assessment. Be specific and reference the provided historical cases. Output ONLY valid JSON — no markdown, no preamble.",
  SEMANTIC_MATCH_SUGGESTION:
    "You are an expert in bank reconciliation for commodity trading companies. Analyze the unmatched bank statement line against candidate cashflows and determine the best match. Output ONLY valid JSON — no markdown, no preamble.",
  PNL_EXPLANATION:
    "You are a senior commodity trading P&L analyst. Generate executive-level P&L explanations with variance drivers. Output ONLY valid JSON — no markdown, no preamble.",
  LIFECYCLE_PREDICTION:
    "You are a commodity trade operations expert specializing in settlement lifecycle analysis. Predict delays and recommend actions. Output ONLY valid JSON — no markdown, no preamble.",
  RISK_BREACH_PREDICTION:
    "You are a commodity trading risk manager specializing in position limits and CFTC regulatory thresholds. Analyze positions and predict breaches. Output ONLY valid JSON — no markdown, no preamble.",
  CLOSE_READINESS_PREDICTION:
    "You are a commodity trading month-end close specialist. Analyze close task progress and predict completion. Output ONLY valid JSON — no markdown, no preamble.",
  NATURAL_LANGUAGE_QUERY:
    "You are a SQL query generator for ArkheOS, a commodity trading platform. Convert natural language queries to safe, read-only SQL SELECT statements. The user's RBAC permissions are pre-filtered — apply tenant_id and allowed entity scopes in every query. Output ONLY valid JSON — no markdown, no preamble.",
  TRADE_SUMMARY:
    "You are a commodity trade analyst. Generate concise, executive-level trade summaries. Output ONLY valid JSON — no markdown, no preamble.",
  REGULATORY_SEMANTIC_VALIDATION:
    "You are a US commodity regulatory compliance expert specializing in CFTC, FERC, and EIA filings. Perform semantic validation on regulatory reports. Output ONLY valid JSON — no markdown, no preamble.",
  RECON_ROOT_CAUSE_ANALYSIS:
    "You are ArkheOS reconciliation enrichment AI. Analyze a batch of reconciliation exception cases and return ONLY strict JSON matching the requested schema. Do not include markdown, prose outside JSON, or commentary. Infer likely root causes conservatively from the provided evidence. Few-shot examples are provided in the prompt and must be followed exactly.",
  DOCUMENT_TRADE_LINKING:
    "You are ArkheOS document-to-trade linking AI. Map a document to the most likely trade or trades from the candidate set and return ONLY strict JSON matching the requested schema. Do not include markdown, prose outside JSON, or commentary. Use allocation_pct values that sum to at most 1.0. Few-shot examples are provided in the prompt and must be followed exactly.",
  EXPORT_NARRATIVE:
    "You are an ArkheOS executive analyst writing a 2-3 paragraph plain-text narrative for a reconciliation scope export. Describe (1) what the scope contains, (2) where the breaks concentrate (entities, counterparties, categories), (3) the likely driver based on the data, and (4) a recommended next action. Output MUST be plain text only — no markdown, no headings, no JSON, no bullet lists. Keep it concise (max 220 words) and factual.",
  VALUATION_ROOT_CAUSE_ANALYSIS:
    "You are ArkheOS Product Control AI. Analyze a batch of FO vs MO valuation breaks and return ONLY strict JSON. For each break, infer the most likely root cause (curve/vol/fx/model/trade-capture/data-staleness), pick a single driver hypothesis, and suggest a recommended action. Few-shot examples are provided in the prompt and must be followed exactly. Do not include markdown or commentary outside JSON.",
  CONFIRMATION_DISCREPANCY_ANALYSIS:
    "You are ArkheOS Confirmations AI. Analyze field-level discrepancies between our trade capture and the counterparty confirmation. For each discrepancy infer the likely cause (day_count_translation, holiday_calendar, fixing_date_ambiguity, notional_rounding, fx_conversion, manual_keying, system_config, counterparty_error, unknown), recommend a concrete action, and decide whether contacting the counterparty is required. Return ONLY strict JSON matching the requested schema. No markdown, no prose outside JSON. Few-shot examples are provided and must be followed exactly.",
  CROSS_MODULE_DEAL_ANALYSIS:
    "You are ArkheOS Deal Lens AI. You are given a single deal's complete cross-module state: trade header, P&L (FO vs MO), and breaks/exceptions across reconciliations, cashflows, valuation, and confirmations. Your job is to correlate findings across modules, identify the most likely shared root cause, and produce an executive summary plus prioritised actions. Output ONLY strict JSON matching the requested schema — no markdown, no prose outside JSON.",
};

// ── Workflow user prompt builders ──
function buildUserPrompt(workflowType: string, context: Record<string, unknown>): string {
  switch (workflowType) {
    case "EXCEPTION_CLASSIFICATION":
      return `New exception details: ${JSON.stringify(context.exception)}
Similar resolved exceptions from history: ${JSON.stringify(context.similar_cases || [])}
Counterparty behavior pattern: ${JSON.stringify(context.counterparty_pattern || {})}
Related trade: ${JSON.stringify(context.trade || {})}

Return JSON with this exact structure:
{
  "probable_cause": "string (1-2 sentences)",
  "cause_confidence": 0.0-1.0,
  "cause_category": "ROUNDING_ERROR | TIMING_DIFFERENCE | SYSTEM_CONFIG | PROCESS_ERROR | COUNTERPARTY_ERROR | DATA_ENTRY | MARKET_PRICE_DIFF | UNKNOWN",
  "suggested_action": "string (specific action to take)",
  "action_steps": ["step1", "step2", "step3"],
  "similar_case_reference": "exception_id of most similar case or null",
  "estimated_resolution_hours": number,
  "escalate_to_management": boolean,
  "financial_impact_usd": number
}`;

    case "SEMANTIC_MATCH_SUGGESTION":
      return `Bank statement line: ${JSON.stringify(context.statement_line)}
Candidate cashflow matches (ranked by vector similarity): ${JSON.stringify(context.candidates || [])}

Return JSON:
{
  "top_match_cashflow_id": "uuid or null",
  "match_confidence": 0.0-1.0,
  "match_reasoning": "string (2-3 sentences)",
  "amount_variance_explanation": "string or null",
  "alternative_match_cashflow_id": "uuid or null",
  "recommend_manual_review": boolean,
  "manual_review_reason": "string or null"
}`;

    case "PNL_EXPLANATION":
      return `Monthly P&L data: ${JSON.stringify(context)}

Generate an executive-level P&L explanation.
Return JSON:
{
  "headline": "string (1 sentence summary)",
  "total_variance_vs_prior_month_usd": number,
  "total_variance_vs_budget_usd": null,
  "drivers": [{"driver_name": "string", "driver_type": "PRICE | VOLUME | FX | NEW_TRADES | SETTLEMENTS | AMENDMENTS | OTHER", "impact_usd": number, "impact_pct_of_total_variance": number, "explanation": "string"}],
  "narrative": "string (3-4 sentences executive summary)",
  "anomalies_detected": [],
  "recommended_actions": []
}`;

    case "LIFECYCLE_PREDICTION":
      return `Trade lifecycle analysis request: ${JSON.stringify(context)}

Return JSON:
{
  "current_stage": "string",
  "days_in_stage": number,
  "benchmark_days": number,
  "delay_flag": boolean,
  "delay_severity": "NORMAL | MILD | MODERATE | CRITICAL",
  "probable_delay_cause": "string",
  "predicted_settlement_date": "ISO 8601 date",
  "confidence_in_prediction": 0.0-1.0,
  "blocking_items": ["string"],
  "recommended_actions": [{"action": "string", "owner": "TRADER | OPERATIONS | FINANCE | COUNTERPARTY", "urgency": "LOW | MEDIUM | HIGH"}]
}`;

    case "RISK_BREACH_PREDICTION":
      return `Risk limit monitoring analysis: ${JSON.stringify(context)}

Return JSON:
{
  "current_utilization_pct": number,
  "projected_eom_utilization_pct": number,
  "projection_confidence": 0.0-1.0,
  "breach_risk": "LOW | MEDIUM | HIGH | CRITICAL",
  "days_to_potential_breach": null,
  "breach_driver": "string or null",
  "recommended_position_adjustment": {"direction": "REDUCE_LONG | REDUCE_SHORT | NO_ACTION", "suggested_quantity": null, "unit": "string", "rationale": "string"},
  "cftc_threshold_status": {"current_contracts": number, "threshold": number, "utilization_pct": number, "form_102_trigger_imminent": boolean}
}`;

    case "CLOSE_READINESS_PREDICTION":
      return `Month-end close readiness analysis: ${JSON.stringify(context)}

Return JSON:
{
  "tasks_complete_pct": number,
  "predicted_close_date": "ISO 8601 date",
  "target_close_date": "ISO 8601 date",
  "on_track": boolean,
  "days_at_risk": number,
  "critical_path_tasks": [],
  "bottleneck_resource": null,
  "recommended_reprioritizations": [],
  "close_risk_score": 0-100
}`;

    case "NATURAL_LANGUAGE_QUERY":
      return `Available schema context: ${JSON.stringify(context.schema_summary || {})}
User permissions scope: ${JSON.stringify(context.rbac_scope || {})}
User query: '${context.query}'

Return JSON:
{
  "interpreted_query": "string (your interpretation)",
  "sql_query": "string (complete safe SELECT statement)",
  "query_explanation": "string (plain English explanation)",
  "warning": "string or null",
  "alternative_interpretations": []
}`;

    case "TRADE_SUMMARY":
      return `Generate an executive trade summary: ${JSON.stringify(context)}

Return JSON:
{
  "headline": "string (1 sentence)",
  "summary_paragraphs": ["string", "string"],
  "key_facts": [{"label": "string", "value": "string"}],
  "open_items": [],
  "financial_snapshot": {"notional_value_usd": number, "unrealized_pnl_usd": null, "cashflow_status": "string"},
  "risk_flags": []
}`;

    case "REGULATORY_SEMANTIC_VALIDATION":
      return `Perform semantic regulatory validation: ${JSON.stringify(context)}

Return JSON:
{
  "overall_assessment": "PASS | PASS_WITH_WARNINGS | REVIEW_REQUIRED",
  "semantic_issues": [],
  "cross_report_consistency": {"is_consistent": true, "inconsistencies": []},
  "regulatory_risk_notes": [],
  "recommendation": "string"
}`;

    case "RECON_ROOT_CAUSE_ANALYSIS":
      return `Analyze this reconciliation exception batch: ${JSON.stringify(context)}

Few-shot example 1:
Input:
{
  "exceptions": [{
    "exception_case_id": "11111111-1111-1111-1111-111111111111",
    "exception_type": "amount_mismatch",
    "summary": "Invoice amount mismatch",
    "evidence": {"record_a": {"amount": 1000, "currency": "USD"}, "record_b": {"amount": 995, "currency": "USD"}}
  }]
}
Output:
{
  "analyses": [{
    "exception_case_id": "11111111-1111-1111-1111-111111111111",
    "suggested_root_cause": "Likely small pricing or fee rounding difference between systems.",
    "ai_confidence": 0.79
  }]
}

Few-shot example 2:
Input:
{
  "exceptions": [{
    "exception_case_id": "22222222-2222-2222-2222-222222222222",
    "exception_type": "date_mismatch",
    "summary": "Booking date mismatch",
    "evidence": {"record_a": {"record_date": "2026-03-01"}, "record_b": {"record_date": "2026-03-06"}}
  }]
}
Output:
{
  "analyses": [{
    "exception_case_id": "22222222-2222-2222-2222-222222222222",
    "suggested_root_cause": "Likely timing difference between source system posting and settlement document date.",
    "ai_confidence": 0.73
  }]
}

Return JSON with this exact structure:
{
  "analyses": [{
    "exception_case_id": "uuid",
    "suggested_root_cause": "string or null",
    "ai_confidence": 0.0
  }]
}`;

    case "DOCUMENT_TRADE_LINKING":
      return `Resolve document to trade links using this payload: ${JSON.stringify(context)}

Few-shot example 1:
Input:
{
  "document": {"doc_id": "INV-100", "doc_type": "invoice", "amount": 50000, "currency": "USD"},
  "candidates": [{"deal_id": "TR-1", "trade_date": "2026-02-10"}, {"deal_id": "TR-2", "trade_date": "2026-01-01"}]
}
Output:
{
  "links": [{"deal_id": "TR-1", "allocation_pct": 1, "confidence": 0.88}]
}

Few-shot example 2:
Input:
{
  "document": {"doc_id": "FEE-22", "doc_type": "voucher", "amount": 1200, "currency": "EUR"},
  "candidates": [{"deal_id": "TR-9"}, {"deal_id": "TR-10"}]
}
Output:
{
  "links": [{"deal_id": "TR-9", "allocation_pct": 0.6, "confidence": 0.67}, {"deal_id": "TR-10", "allocation_pct": 0.4, "confidence": 0.54}]
}

Return JSON with this exact structure:
{
  "links": [{
    "deal_id": "string",
    "allocation_pct": 0.0,
    "confidence": 0.0
  }]
}`;

    case "EXPORT_NARRATIVE":
      return `Write a plain-text executive narrative for the following reconciliation export scope. Do not use markdown or JSON. 2-3 paragraphs, max 220 words.

Scope payload:
${JSON.stringify(context)}`;

    case "VALUATION_ROOT_CAUSE_ANALYSIS":
      return `Analyze this batch of FO vs MO valuation breaks: ${JSON.stringify(context)}

Few-shot example 1:
Input:
{
  "breaks": [{
    "deal_id": "TR-1001",
    "total_delta": 12500,
    "total_delta_pct": 3.4,
    "materiality_flag": "material",
    "primary_driver_component": "PV",
    "curve_delta_usd": 12500,
    "vol_delta_usd": 0,
    "fx_delta_usd": 0,
    "model_delta_usd": 0,
    "unexplained_delta_usd": 0
  }]
}
Output:
{
  "analyses": [{
    "deal_id": "TR-1001",
    "root_cause": "FO and MO using different curve versions; MO appears to be on a stale EOD curve.",
    "driver_hypothesis": "curve",
    "confidence": 0.82,
    "recommended_action": "Refresh MO curve snapshot and re-run valuation; confirm with curve governance team."
  }]
}

Few-shot example 2:
Input:
{
  "breaks": [{
    "deal_id": "TR-2002",
    "total_delta": 48000,
    "total_delta_pct": 6.1,
    "materiality_flag": "critical",
    "primary_driver_component": "VEGA",
    "curve_delta_usd": 0,
    "vol_delta_usd": 24000,
    "fx_delta_usd": 0,
    "model_delta_usd": 24000,
    "unexplained_delta_usd": 0
  }]
}
Output:
{
  "analyses": [{
    "deal_id": "TR-2002",
    "root_cause": "FO using BLACK_76, MO using MONTE_CARLO with a different vol surface; combined model and vega contribute equally.",
    "driver_hypothesis": "model",
    "confidence": 0.74,
    "recommended_action": "Align valuation model per product policy; escalate to MO Head for sign-off on chosen model."
  }]
}

Return JSON with this exact structure:
{
  "analyses": [{
    "deal_id": "string",
    "root_cause": "string",
    "driver_hypothesis": "curve | vol | fx | model | trade_capture | data_staleness | unknown",
    "confidence": 0.0,
    "recommended_action": "string"
  }]
}`;

    case "CONFIRMATION_DISCREPANCY_ANALYSIS":
      return `Analyze this batch of confirmation discrepancies: ${JSON.stringify(context)}

Few-shot example 1:
Input:
{
  "discrepancies": [{
    "deal_id": "TR-501",
    "field_name": "day_count",
    "field_category": "legal",
    "our_value": "ACT/360",
    "counterparty_value": "Actual/360",
    "is_material": false,
    "discrepancy_type": "format_only"
  }]
}
Output:
{
  "analyses": [{
    "deal_id": "TR-501",
    "field_name": "day_count",
    "likely_cause": "day_count_translation",
    "recommendation": "Accept as-is; same convention expressed differently. Add normalization rule to avoid future flags.",
    "confidence": 0.92,
    "requires_counterparty_contact": false
  }]
}

Few-shot example 2:
Input:
{
  "discrepancies": [{
    "deal_id": "TR-742",
    "field_name": "notional",
    "field_category": "economic",
    "our_value": "10000000",
    "counterparty_value": "10005000",
    "is_material": true,
    "discrepancy_type": "mismatch"
  }]
}
Output:
{
  "analyses": [{
    "deal_id": "TR-742",
    "field_name": "notional",
    "likely_cause": "manual_keying",
    "recommendation": "Verify trader ticket vs counterparty confirm; correct the discrepant side and reissue confirm.",
    "confidence": 0.78,
    "requires_counterparty_contact": true
  }]
}

Return JSON with this exact structure:
{
  "analyses": [{
    "deal_id": "string",
    "field_name": "string",
    "likely_cause": "day_count_translation | holiday_calendar | fixing_date_ambiguity | notional_rounding | fx_conversion | manual_keying | system_config | counterparty_error | unknown",
    "recommendation": "string",
    "confidence": 0.0,
    "requires_counterparty_contact": false
  }]
}`;

    case "CROSS_MODULE_DEAL_ANALYSIS":
      return `Analyze this single deal's complete cross-module state and produce an executive cross-module summary: ${JSON.stringify(context)}

Return JSON with this exact structure:
{
  "headline": "string (1 sentence executive headline)",
  "executive_summary": "string (3-5 sentences correlating findings across modules)",
  "cross_module_findings": [{
    "module": "reconciliations | cashflows | valuation_recon | confirmations_recon",
    "finding": "string (what is happening in this module for this deal)",
    "severity": "low | medium | high | critical"
  }],
  "correlated_root_cause": "string (one likely shared root cause across modules, or 'independent' if unrelated)",
  "recommended_actions": [{
    "action": "string (concrete next step)",
    "owner": "TRADER | OPERATIONS | FINANCE | MIDDLE_OFFICE | PRODUCT_CONTROL | COUNTERPARTY",
    "priority": "low | medium | high"
  }],
  "risk_flags": ["string"],
  "confidence": 0.0
}`;

    default:
      return JSON.stringify(context);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { request_id, tenant_id, workflow_type, context_payload, entity_id, entity_type } = await req.json();

    // Validate tenant has AIL enabled
    const { data: tenant } = await supabase
      .from("tenants")
      .select("ail_enabled, ail_tier")
      .eq("id", tenant_id)
      .single();

    if (!tenant?.ail_enabled) {
      return new Response(JSON.stringify({ error: "AIL not enabled for this tenant" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update request status to PROCESSING
    if (request_id) {
      await supabase
        .from("ail_inference_requests")
        .update({ status: "PROCESSING" })
        .eq("request_id", request_id);
    }

    const systemPrompt = WORKFLOW_SYSTEM_PROMPTS[workflow_type] || WORKFLOW_SYSTEM_PROMPTS.TRADE_SUMMARY;
    const userPrompt = buildUserPrompt(workflow_type, context_payload);

    // Inject learned examples if available
    const { data: examples } = await supabase
      .from("ail_learned_examples")
      .select("input_context, correct_output")
      .eq("tenant_id", tenant_id)
      .eq("workflow_type", workflow_type)
      .eq("is_active", true)
      .order("quality_score", { ascending: false })
      .limit(3);

    let enrichedPrompt = userPrompt;
    if (examples && examples.length > 0) {
      const examplesText = examples
        .map((ex, i) => `Example ${i + 1}:\nInput: ${JSON.stringify(ex.input_context)}\nCorrect output: ${JSON.stringify(ex.correct_output)}`)
        .join("\n\n");
      enrichedPrompt = `Examples from your operation:\n${examplesText}\n\n${userPrompt}`;
    }

    const startMs = Date.now();

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: enrichedPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errorText = await aiResponse.text();
      console.error(`AI Gateway error [${status}]:`, errorText);

      if (request_id) {
        await supabase.from("ail_inference_requests").update({ status: "FAILED", completed_at: new Date().toISOString() }).eq("request_id", request_id);
      }

      if (status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI analysis temporarily unavailable." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const latencyMs = Date.now() - startMs;
    const rawText = aiData.choices?.[0]?.message?.content || "";
    const tokensUsed = aiData.usage?.total_tokens || 0;

    // Parse JSON from response (strip markdown fences if present)
    const cleanJson = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      console.error("Failed to parse AI response:", cleanJson);
      parsed = { raw_response: rawText, parse_error: true };
    }

    // Determine result_type from workflow
    const resultTypeMap: Record<string, string> = {
      EXCEPTION_CLASSIFICATION: "EXCEPTION_CLASSIFICATION",
      SEMANTIC_MATCH_SUGGESTION: "MATCH_SUGGESTION",
      PNL_EXPLANATION: "PNL_EXPLANATION",
      LIFECYCLE_PREDICTION: "LIFECYCLE_PREDICTION",
      RISK_BREACH_PREDICTION: "RISK_PREDICTION",
      CLOSE_READINESS_PREDICTION: "CLOSE_PREDICTION",
      NATURAL_LANGUAGE_QUERY: "QUERY_RESULT",
      TRADE_SUMMARY: "SUMMARY",
      REGULATORY_SEMANTIC_VALIDATION: "REGULATORY_VALIDATION",
      RECON_ROOT_CAUSE_ANALYSIS: "ROOT_CAUSE_ANALYSIS",
      DOCUMENT_TRADE_LINKING: "DOCUMENT_TRADE_LINKING",
      VALUATION_ROOT_CAUSE_ANALYSIS: "VALUATION_ROOT_CAUSE_ANALYSIS",
      CONFIRMATION_DISCREPANCY_ANALYSIS: "CONFIRMATION_DISCREPANCY_ANALYSIS",
      CROSS_MODULE_DEAL_ANALYSIS: "CROSS_MODULE_ANALYSIS",
    };

    // Extract confidence from various fields
    const confidence = (parsed.cause_confidence || parsed.match_confidence || parsed.projection_confidence || parsed.confidence_in_prediction || parsed.confidence || null) as number | null;

    // Store result
    const { data: result, error: insertError } = await supabase
      .from("ail_inference_results")
      .insert({
        request_id: request_id || null,
        tenant_id,
        workflow_type,
        entity_type: entity_type || "UNKNOWN",
        entity_id: entity_id || "00000000-0000-0000-0000-000000000000",
        result_type: resultTypeMap[workflow_type] || "SUMMARY",
        result_payload: parsed,
        confidence_score: confidence,
        model_version: "gemini-3-flash-preview",
        tokens_used: tokensUsed,
        latency_ms: latencyMs,
        is_active: true,
      })
      .select("result_id")
      .single();

    if (insertError) {
      console.error("Failed to store inference result:", insertError);
    }

    // Update request as COMPLETE
    if (request_id) {
      await supabase.from("ail_inference_requests").update({ status: "COMPLETE", completed_at: new Date().toISOString() }).eq("request_id", request_id);
    }

    return new Response(
      JSON.stringify({
        result_id: result?.result_id,
        workflow_type,
        result_payload: parsed,
        confidence_score: confidence,
        latency_ms: latencyMs,
        tokens_used: tokensUsed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("CDE dispatcher error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
