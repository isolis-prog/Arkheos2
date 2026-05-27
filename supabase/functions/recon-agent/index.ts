import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

interface AgentRequest {
  action: string;
  runId?: string;
  caseId?: string;
  candidateId?: string;
  decisionId?: string;
  topK?: number;
  filters?: Record<string, any>;
  rationale?: string;
  confidence?: number;
  message?: string;
  approverRole?: string;
  resolutionCode?: string;
  notes?: string;
  format?: 'pdf' | 'csv' | 'json';
  tenantId: string;
  userId?: string;
}

// Create audit event
async function logAuditEvent(
  supabase: any,
  params: {
    actorType: 'user' | 'agent' | 'system';
    actorId?: string;
    tenantId: string;
    entityType: string;
    entityId?: string;
    action: string;
    toolName?: string;
    inputJson?: any;
    outputJson?: any;
    runId?: string;
  }
) {
  const { data, error } = await supabase.from('agent_audit_events').insert({
    actor_type: params.actorType,
    actor_id: params.actorId,
    tenant_id: params.tenantId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    tool_name: params.toolName,
    input_json: params.inputJson,
    output_json: params.outputJson,
    run_id: params.runId,
    hash_input: params.inputJson ? btoa(JSON.stringify(params.inputJson)).slice(0, 64) : null,
    hash_output: params.outputJson ? btoa(JSON.stringify(params.outputJson)).slice(0, 64) : null,
  });
  
  if (error) console.error('Audit log error:', error);
  return data;
}

// Tool implementations
async function getException(supabase: any, caseId: string, tenantId: string, userId?: string) {
  const { data, error } = await supabase
    .from('exception_cases')
    .select(`
      *,
      record:recon_records(*),
      run:recon_runs(*)
    `)
    .eq('id', caseId)
    .eq('tenant_id', tenantId)
    .single();
  
  await logAuditEvent(supabase, {
    actorType: userId ? 'user' : 'agent',
    actorId: userId,
    tenantId,
    entityType: 'exception_case',
    entityId: caseId,
    action: 'get_exception',
    toolName: 'get_exception',
    inputJson: { caseId },
    outputJson: data ? { found: true } : { found: false, error },
    runId: data?.run_id,
  });
  
  if (error) throw new Error(`Failed to get exception: ${error.message}`);
  return data;
}

async function searchRecords(supabase: any, runId: string, source: string, filters: any, tenantId: string, userId?: string) {
  let query = supabase
    .from('recon_records')
    .select('*')
    .eq('run_id', runId)
    .eq('source', source);
  
  if (filters?.external_id) query = query.ilike('external_id', `%${filters.external_id}%`);
  if (filters?.counterparty) query = query.ilike('counterparty', `%${filters.counterparty}%`);
  if (filters?.min_amount) query = query.gte('amount', filters.min_amount);
  if (filters?.max_amount) query = query.lte('amount', filters.max_amount);
  
  const { data, error } = await query.limit(100);
  
  await logAuditEvent(supabase, {
    actorType: userId ? 'user' : 'agent',
    actorId: userId,
    tenantId,
    entityType: 'recon_records',
    action: 'search_records',
    toolName: 'search_records',
    inputJson: { runId, source, filters },
    outputJson: { count: data?.length || 0 },
    runId,
  });
  
  if (error) throw new Error(`Failed to search records: ${error.message}`);
  return data;
}

async function listCandidates(supabase: any, caseId: string, topK: number, tenantId: string, userId?: string) {
  // First get the exception to find the record
  const exception = await getException(supabase, caseId, tenantId, userId);
  if (!exception?.record_id) throw new Error('Exception has no associated record');
  
  const { data, error } = await supabase
    .from('match_candidates')
    .select(`
      *,
      left_record:recon_records!match_candidates_left_record_id_fkey(*),
      right_record:recon_records!match_candidates_right_record_id_fkey(*)
    `)
    .eq('left_record_id', exception.record_id)
    .order('score_total', { ascending: false })
    .limit(topK || 5);
  
  await logAuditEvent(supabase, {
    actorType: userId ? 'user' : 'agent',
    actorId: userId,
    tenantId,
    entityType: 'match_candidates',
    action: 'list_candidates',
    toolName: 'list_candidates',
    inputJson: { caseId, topK },
    outputJson: { count: data?.length || 0 },
    runId: exception.run_id,
  });
  
  if (error) throw new Error(`Failed to list candidates: ${error.message}`);
  return data;
}

async function proposeMatch(supabase: any, caseId: string, candidateId: string, rationale: string, confidence: number, tenantId: string, userId?: string) {
  // Create match decision with proposed status
  const { data: decision, error: decisionError } = await supabase
    .from('match_decisions')
    .insert({
      candidate_id: candidateId,
      decision_status: 'proposed',
      decided_by: userId,
      decided_by_agent: !userId,
      justification: rationale,
      confidence,
    })
    .select()
    .single();
  
  if (decisionError) throw new Error(`Failed to create decision: ${decisionError.message}`);
  
  // Update exception status
  const { error: updateError } = await supabase
    .from('exception_cases')
    .update({
      status: 'proposed',
      recommended_actions: [{ type: 'accept_match', candidate_id: candidateId, rationale, confidence }],
    })
    .eq('id', caseId);
  
  const exception = await supabase.from('exception_cases').select('run_id').eq('id', caseId).single();
  
  await logAuditEvent(supabase, {
    actorType: userId ? 'user' : 'agent',
    actorId: userId,
    tenantId,
    entityType: 'match_decision',
    entityId: decision.id,
    action: 'propose_match',
    toolName: 'propose_match',
    inputJson: { caseId, candidateId, rationale, confidence },
    outputJson: { decisionId: decision.id, status: 'proposed' },
    runId: exception.data?.run_id,
  });
  
  return decision;
}

async function rejectCandidate(supabase: any, caseId: string, candidateId: string, rationale: string, tenantId: string, userId?: string) {
  const { data: decision, error } = await supabase
    .from('match_decisions')
    .insert({
      candidate_id: candidateId,
      decision_status: 'rejected',
      decided_by: userId,
      decided_by_agent: !userId,
      justification: rationale,
    })
    .select()
    .single();
  
  const exception = await supabase.from('exception_cases').select('run_id').eq('id', caseId).single();
  
  await logAuditEvent(supabase, {
    actorType: userId ? 'user' : 'agent',
    actorId: userId,
    tenantId,
    entityType: 'match_decision',
    entityId: decision?.id,
    action: 'reject_candidate',
    toolName: 'reject_candidate',
    inputJson: { caseId, candidateId, rationale },
    outputJson: { decisionId: decision?.id },
    runId: exception.data?.run_id,
  });
  
  if (error) throw new Error(`Failed to reject candidate: ${error.message}`);
  return decision;
}

async function requestApproval(supabase: any, caseId: string, approverRole: string, message: string, tenantId: string, userId?: string) {
  const { error } = await supabase
    .from('exception_cases')
    .update({
      status: 'in_review',
      recommended_actions: [{ type: 'request_approval', approver_role: approverRole, message }],
    })
    .eq('id', caseId);
  
  const exception = await supabase.from('exception_cases').select('run_id').eq('id', caseId).single();
  
  await logAuditEvent(supabase, {
    actorType: userId ? 'user' : 'agent',
    actorId: userId,
    tenantId,
    entityType: 'exception_case',
    entityId: caseId,
    action: 'request_approval',
    toolName: 'request_approval',
    inputJson: { caseId, approverRole, message },
    outputJson: { success: !error },
    runId: exception.data?.run_id,
  });
  
  if (error) throw new Error(`Failed to request approval: ${error.message}`);
  return { success: true, caseId, approverRole };
}

async function approveProposal(supabase: any, decisionId: string, tenantId: string, userId: string) {
  const { data, error } = await supabase
    .from('match_decisions')
    .update({
      decision_status: 'approved',
      decided_by: userId,
      decided_at: new Date().toISOString(),
    })
    .eq('id', decisionId)
    .select()
    .single();
  
  // Get the candidate to find the exception
  const candidate = await supabase.from('match_candidates').select('run_id').eq('id', data?.candidate_id).single();
  
  await logAuditEvent(supabase, {
    actorType: 'user',
    actorId: userId,
    tenantId,
    entityType: 'match_decision',
    entityId: decisionId,
    action: 'approve_proposal',
    toolName: 'approve_proposal',
    inputJson: { decisionId },
    outputJson: { status: 'approved' },
    runId: candidate.data?.run_id,
  });
  
  if (error) throw new Error(`Failed to approve proposal: ${error.message}`);
  return data;
}

async function closeException(supabase: any, caseId: string, resolutionCode: string, notes: string, tenantId: string, userId?: string) {
  const { data, error } = await supabase
    .from('exception_cases')
    .update({
      status: 'closed',
      resolution_code: resolutionCode,
      resolution_notes: notes,
      closed_at: new Date().toISOString(),
      closed_by: userId,
    })
    .eq('id', caseId)
    .select()
    .single();
  
  await logAuditEvent(supabase, {
    actorType: userId ? 'user' : 'agent',
    actorId: userId,
    tenantId,
    entityType: 'exception_case',
    entityId: caseId,
    action: 'close_exception',
    toolName: 'close_exception',
    inputJson: { caseId, resolutionCode, notes },
    outputJson: { status: 'closed' },
    runId: data?.run_id,
  });
  
  if (error) throw new Error(`Failed to close exception: ${error.message}`);
  return data;
}

async function generateAuditReport(supabase: any, runId: string, format: string, tenantId: string, userId?: string) {
  // Fetch all data for the run
  const [runResult, matchesResult, exceptionsResult, auditResult] = await Promise.all([
    supabase.from('recon_runs').select('*').eq('id', runId).single(),
    supabase.from('match_candidates').select(`
      *,
      decision:match_decisions(*),
      left_record:recon_records!match_candidates_left_record_id_fkey(*),
      right_record:recon_records!match_candidates_right_record_id_fkey(*)
    `).eq('run_id', runId),
    supabase.from('exception_cases').select('*').eq('run_id', runId),
    supabase.from('agent_audit_events').select('*').eq('run_id', runId).order('timestamp'),
  ]);
  
  const report = {
    metadata: {
      run_id: runId,
      generated_at: new Date().toISOString(),
      ruleset_version: runResult.data?.ruleset_version,
      model_version: runResult.data?.model_version,
      period_start: runResult.data?.period_start,
      period_end: runResult.data?.period_end,
    },
    summary: {
      total_records_a: 0,
      total_records_b: 0,
      auto_matched: matchesResult.data?.filter((m: any) => m.decision?.decision_status === 'auto').length || 0,
      approved_matches: matchesResult.data?.filter((m: any) => m.decision?.decision_status === 'approved').length || 0,
      open_exceptions: exceptionsResult.data?.filter((e: any) => e.status === 'open').length || 0,
      closed_exceptions: exceptionsResult.data?.filter((e: any) => e.status === 'closed').length || 0,
    },
    matches: matchesResult.data || [],
    exceptions: exceptionsResult.data || [],
    audit_trail: auditResult.data || [],
  };
  
  await logAuditEvent(supabase, {
    actorType: userId ? 'user' : 'agent',
    actorId: userId,
    tenantId,
    entityType: 'report',
    action: 'generate_audit_report',
    toolName: 'generate_audit_report',
    inputJson: { runId, format },
    outputJson: { format, itemCount: report.matches.length + report.exceptions.length },
    runId,
  });
  
  return report;
}

// AI Analysis using Lovable AI
async function analyzeException(supabase: any, caseId: string, tenantId: string, userId?: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("AI not configured");
  
  // Get exception details and candidates
  const exception = await getException(supabase, caseId, tenantId, userId);
  const candidates = await listCandidates(supabase, caseId, 5, tenantId, userId);
  
  const prompt = `You are a financial reconciliation expert AI. Analyze this exception and provide recommendations.

Exception Details:
- Type: ${exception.exception_type}
- Severity: ${exception.severity}
- Status: ${exception.status}
- Summary: ${exception.summary || 'No summary'}

Source Record:
${JSON.stringify(exception.record, null, 2)}

Top Match Candidates:
${JSON.stringify(candidates.map((c: any) => ({
  score: c.score_total,
  amount_delta: c.amount_delta,
  date_delta: c.date_delta,
  breakdown: c.score_breakdown,
  right_record: c.right_record,
})), null, 2)}

Provide your analysis in the following JSON format:
{
  "summary": ["bullet1", "bullet2", ...],
  "recommended_action": {
    "type": "accept_match" | "reject_all" | "request_approval" | "manual_review",
    "candidate_id": "if accepting match",
    "rationale": "explanation"
  },
  "evidence_references": [{"record_id": "...", "field": "...", "issue": "..."}],
  "confidence": 0.0 to 1.0
}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You are a financial reconciliation expert. Respond only with valid JSON." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI error:", response.status, errorText);
    throw new Error("AI analysis failed");
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || "{}";
  
  // Parse the JSON response
  let analysis;
  try {
    // Extract JSON from possible markdown code blocks
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    analysis = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
  } catch (e) {
    analysis = {
      summary: ["Unable to parse AI response"],
      recommended_action: { type: "manual_review", rationale: "AI response parsing failed" },
      evidence_references: [],
      confidence: 0,
    };
  }

  // Update exception with recommendations
  await supabase
    .from('exception_cases')
    .update({
      recommended_actions: [analysis.recommended_action],
      evidence: { ai_analysis: analysis },
    })
    .eq('id', caseId);

  await logAuditEvent(supabase, {
    actorType: 'agent',
    tenantId,
    entityType: 'exception_case',
    entityId: caseId,
    action: 'ai_analyze',
    toolName: 'analyze_exception',
    inputJson: { caseId },
    outputJson: analysis,
    runId: exception.run_id,
  });

  return analysis;
}

// Auto-triage exceptions queue
async function autoTriageQueue(supabase: any, runId: string, tenantId: string, userId?: string) {
  const { data: exceptions, error } = await supabase
    .from('exception_cases')
    .select('*')
    .eq('run_id', runId)
    .eq('status', 'open')
    .order('created_at');

  if (error) throw new Error(`Failed to get exceptions: ${error.message}`);

  const triageResults = [];
  
  for (const exc of exceptions || []) {
    // Simple rule-based triage
    let priority = 'medium';
    let recommendation = 'review';
    
    if (exc.severity === 'high') {
      priority = 'urgent';
      recommendation = 'escalate';
    } else if (exc.exception_type === 'unmatched') {
      priority = 'high';
      recommendation = 'investigate';
    } else if (exc.exception_type === 'amount_mismatch') {
      priority = 'medium';
      recommendation = 'compare_amounts';
    }
    
    triageResults.push({
      caseId: exc.id,
      type: exc.exception_type,
      severity: exc.severity,
      priority,
      recommendation,
    });
  }

  await logAuditEvent(supabase, {
    actorType: 'agent',
    tenantId,
    entityType: 'exception_queue',
    action: 'auto_triage',
    toolName: 'auto_triage_queue',
    inputJson: { runId, count: exceptions?.length },
    outputJson: { triaged: triageResults.length },
    runId,
  });

  return triageResults;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: AgentRequest = await req.json();
    const { action, tenantId, userId } = body;

    if (!tenantId) {
      return new Response(JSON.stringify({ error: "tenantId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;

    switch (action) {
      case 'get_exception':
        result = await getException(supabase, body.caseId!, tenantId, userId);
        break;
      case 'search_records':
        result = await searchRecords(supabase, body.runId!, body.filters?.source || 'A', body.filters, tenantId, userId);
        break;
      case 'list_candidates':
        result = await listCandidates(supabase, body.caseId!, body.topK || 5, tenantId, userId);
        break;
      case 'propose_match':
        result = await proposeMatch(supabase, body.caseId!, body.candidateId!, body.rationale!, body.confidence!, tenantId, userId);
        break;
      case 'reject_candidate':
        result = await rejectCandidate(supabase, body.caseId!, body.candidateId!, body.rationale!, tenantId, userId);
        break;
      case 'request_approval':
        result = await requestApproval(supabase, body.caseId!, body.approverRole!, body.message!, tenantId, userId);
        break;
      case 'approve_proposal':
        result = await approveProposal(supabase, body.decisionId!, tenantId, userId!);
        break;
      case 'close_exception':
        result = await closeException(supabase, body.caseId!, body.resolutionCode!, body.notes!, tenantId, userId);
        break;
      case 'generate_audit_report':
        result = await generateAuditReport(supabase, body.runId!, body.format || 'json', tenantId, userId);
        break;
      case 'analyze_exception':
        result = await analyzeException(supabase, body.caseId!, tenantId, userId);
        break;
      case 'auto_triage':
        result = await autoTriageQueue(supabase, body.runId!, tenantId, userId);
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Agent error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
