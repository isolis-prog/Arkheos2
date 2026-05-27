import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

interface RunMatchingRequest {
  runId: string;
  tenantId: string;
  userId?: string;
}

// Matching configuration
const CONFIG = {
  DATE_WINDOW_DAYS: 7,
  AMOUNT_TOLERANCE_PCT: 0.03,
  MAX_CANDIDATES: 30,
  WEIGHTS: { amount: 0.35, date: 0.25, text: 0.25, id: 0.15 },
  AUTO_MATCH_THRESHOLD: 0.97,
  REVIEW_THRESHOLD: 0.90,
  AMOUNT_AUTO_MATCH_PCT: 0.005,
  DATE_AUTO_MATCH_DAYS: 2,
  HIGH_AMOUNT_THRESHOLD: 100000,
};

function normalizeText(text: string | null): string {
  if (!text) return '';
  return text.toUpperCase().replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function textSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(normalizeText(text1).split(' ').filter(t => t.length > 2));
  const tokens2 = new Set(normalizeText(text2).split(' ').filter(t => t.length > 2));
  if (tokens1.size === 0 && tokens2.size === 0) return 1;
  if (tokens1.size === 0 || tokens2.size === 0) return 0;
  const intersection = [...tokens1].filter(t => tokens2.has(t)).length;
  const union = new Set([...tokens1, ...tokens2]).size;
  return intersection / union;
}

function calculateScores(recordA: any, recordB: any) {
  const amountA = Number(recordA.amount) || 0;
  const amountB = Number(recordB.amount) || 0;
  const dateA = recordA.record_date ? new Date(recordA.record_date) : null;
  const dateB = recordB.record_date ? new Date(recordB.record_date) : null;
  
  // Amount score
  let amountScore = 0;
  if (amountA === 0 && amountB === 0) amountScore = 1;
  else if (amountA !== 0 && amountB !== 0) {
    const delta = Math.abs(amountA - amountB);
    const maxAmount = Math.max(Math.abs(amountA), Math.abs(amountB));
    const pctDelta = delta / maxAmount;
    if (pctDelta <= CONFIG.AMOUNT_TOLERANCE_PCT) {
      amountScore = 1 - (pctDelta / CONFIG.AMOUNT_TOLERANCE_PCT) * 0.3;
    } else {
      amountScore = Math.max(0, 0.7 - (pctDelta - CONFIG.AMOUNT_TOLERANCE_PCT) * 2);
    }
  }
  
  // Date score
  let dateScore = 0.5;
  let dateDelta = 0;
  if (dateA && dateB) {
    dateDelta = Math.floor((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
    const absDelta = Math.abs(dateDelta);
    if (absDelta === 0) dateScore = 1;
    else if (absDelta <= CONFIG.DATE_WINDOW_DAYS) {
      dateScore = 1 - (absDelta / CONFIG.DATE_WINDOW_DAYS) * 0.5;
    } else {
      dateScore = Math.max(0, 0.5 - (absDelta - CONFIG.DATE_WINDOW_DAYS) * 0.05);
    }
  }
  
  // Text score
  const textScore = textSimilarity(recordA.description || '', recordB.description || '');
  
  // ID score
  let idScore = 0;
  if (recordA.external_id && recordB.external_id) {
    const normA = normalizeText(recordA.external_id);
    const normB = normalizeText(recordB.external_id);
    if (normA === normB) idScore = 1;
    else if (normA.includes(normB) || normB.includes(normA)) idScore = 0.8;
  }
  
  const scoreTotal = 
    CONFIG.WEIGHTS.amount * amountScore +
    CONFIG.WEIGHTS.date * dateScore +
    CONFIG.WEIGHTS.text * textScore +
    CONFIG.WEIGHTS.id * idScore;
  
  // Generate reason codes
  const reasonCodes = [];
  if (idScore === 1) reasonCodes.push('EXACT_ID_MATCH');
  if (amountScore >= 0.95) reasonCodes.push('AMOUNT_MATCH');
  else if (amountScore >= 0.7) reasonCodes.push('AMOUNT_WITHIN_TOLERANCE');
  else reasonCodes.push('AMOUNT_MISMATCH');
  if (dateScore === 1) reasonCodes.push('DATE_MATCH');
  else if (dateScore >= 0.7) reasonCodes.push('DATE_WITHIN_TOLERANCE');
  else if (dateA && dateB) reasonCodes.push('DATE_MISMATCH');
  if (textScore >= 0.8) reasonCodes.push('HIGH_TEXT_SIMILARITY');
  
  return {
    scoreTotal: Math.round(scoreTotal * 10000) / 10000,
    scoreBreakdown: {
      amount_score: Math.round(amountScore * 100) / 100,
      date_score: Math.round(dateScore * 100) / 100,
      text_score: Math.round(textScore * 100) / 100,
      id_score: Math.round(idScore * 100) / 100,
    },
    reasonCodes,
    amountDelta: Math.round((amountB - amountA) * 100) / 100,
    dateDelta,
  };
}

function determineExceptionType(candidates: any[], amountA: number): { type: string; severity: string } {
  if (candidates.length === 0) {
    return { type: 'unmatched', severity: Math.abs(amountA) >= 50000 ? 'high' : 'medium' };
  }
  
  const top = candidates[0];
  const highScoreMatches = candidates.filter(c => c.scoreTotal >= CONFIG.REVIEW_THRESHOLD);
  
  if (highScoreMatches.length > 1) {
    return { type: 'duplicate', severity: 'high' };
  }
  
  if (top.scoreBreakdown.amount_score < 0.7 && top.scoreBreakdown.date_score >= 0.7) {
    return { type: 'amount_mismatch', severity: Math.abs(top.amountDelta) >= 10000 ? 'high' : 'medium' };
  }
  
  if (top.scoreBreakdown.date_score < 0.7 && top.scoreBreakdown.amount_score >= 0.7) {
    return { type: 'date_mismatch', severity: Math.abs(top.dateDelta) > 30 ? 'high' : 'low' };
  }
  
  return { type: 'needs_review', severity: 'medium' };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { runId, tenantId, userId }: RunMatchingRequest = await req.json();

    // Update run status to running
    await supabase.from('recon_runs').update({ status: 'running' }).eq('id', runId);

    // Fetch all records for this run
    const [sourceAResult, sourceBResult] = await Promise.all([
      supabase.from('recon_records').select('*').eq('run_id', runId).eq('source', 'A'),
      supabase.from('recon_records').select('*').eq('run_id', runId).eq('source', 'B'),
    ]);

    const recordsA = sourceAResult.data || [];
    const recordsB = sourceBResult.data || [];

    console.log(`Processing ${recordsA.length} Source A records against ${recordsB.length} Source B records`);

    const candidatesToInsert = [];
    const decisionsToInsert = [];
    const exceptionsToInsert = [];
    const matchedBRecords = new Set<string>();

    let autoMatchCount = 0;
    let exceptionCount = 0;

    // Generate candidates for each A record
    for (const recordA of recordsA) {
      const amountA = Number(recordA.amount) || 0;
      const dateA = recordA.record_date ? new Date(recordA.record_date) : null;
      const candidates = [];

      for (const recordB of recordsB) {
        // Pre-filtering
        if (recordA.currency && recordB.currency && recordA.currency !== recordB.currency) continue;
        
        const dateB = recordB.record_date ? new Date(recordB.record_date) : null;
        if (dateA && dateB) {
          const diffDays = Math.abs(Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24)));
          if (diffDays > CONFIG.DATE_WINDOW_DAYS) continue;
        }

        const amountB = Number(recordB.amount) || 0;
        if (amountA > 0 && amountB > 0) {
          const pctDiff = Math.abs(amountA - amountB) / Math.max(amountA, amountB);
          if (pctDiff > CONFIG.AMOUNT_TOLERANCE_PCT * 2) continue;
        }

        const scores = calculateScores(recordA, recordB);
        candidates.push({
          rightRecordId: recordB.id,
          ...scores,
        });
      }

      // Sort and limit candidates
      candidates.sort((a, b) => b.scoreTotal - a.scoreTotal);
      const topCandidates = candidates.slice(0, CONFIG.MAX_CANDIDATES);

      // Insert candidates
      for (const c of topCandidates) {
        candidatesToInsert.push({
          run_id: runId,
          left_record_id: recordA.id,
          right_record_id: c.rightRecordId,
          score_total: c.scoreTotal,
          score_breakdown: c.scoreBreakdown,
          reason_codes: c.reasonCodes,
          amount_delta: c.amountDelta,
          date_delta: c.dateDelta,
        });
      }

      // Check for auto-match eligibility
      if (topCandidates.length > 0) {
        const top = topCandidates[0];
        const amountPctDelta = Math.abs(top.amountDelta) / Math.max(Math.abs(amountA), 1);
        
        const isAutoMatch = 
          top.scoreTotal >= CONFIG.AUTO_MATCH_THRESHOLD &&
          amountPctDelta <= CONFIG.AMOUNT_AUTO_MATCH_PCT &&
          Math.abs(top.dateDelta) <= CONFIG.DATE_AUTO_MATCH_DAYS &&
          Math.abs(amountA) < CONFIG.HIGH_AMOUNT_THRESHOLD;

        if (isAutoMatch) {
          autoMatchCount++;
          matchedBRecords.add(top.rightRecordId);
          // Auto-match decision will be added after candidates are inserted
        } else {
          // Create exception
          const { type, severity } = determineExceptionType(topCandidates, amountA);
          exceptionCount++;
          exceptionsToInsert.push({
            run_id: runId,
            tenant_id: tenantId,
            record_id: recordA.id,
            exception_type: type,
            status: 'open',
            severity,
            summary: `${type.replace('_', ' ')} for ${recordA.external_id || recordA.id}`,
            evidence: {
              record_a: recordA,
              top_candidates: topCandidates.slice(0, 3),
            },
          });
        }
      } else {
        // No candidates - unmatched
        exceptionCount++;
        exceptionsToInsert.push({
          run_id: runId,
          tenant_id: tenantId,
          record_id: recordA.id,
          exception_type: 'unmatched',
          status: 'open',
          severity: Math.abs(amountA) >= 50000 ? 'high' : 'medium',
          summary: `Unmatched record: ${recordA.external_id || recordA.id}`,
          evidence: { record_a: recordA },
        });
      }
    }

    // Check for unmatched B records
    for (const recordB of recordsB) {
      if (!matchedBRecords.has(recordB.id)) {
        // Check if this B record has any good candidates from A
        const hasCandidate = candidatesToInsert.some(c => 
          c.right_record_id === recordB.id && c.score_total >= CONFIG.REVIEW_THRESHOLD
        );
        
        if (!hasCandidate) {
          exceptionsToInsert.push({
            run_id: runId,
            tenant_id: tenantId,
            record_id: recordB.id,
            exception_type: 'unmatched',
            status: 'open',
            severity: 'medium',
            summary: `Unmatched Source B record: ${recordB.external_id || recordB.id}`,
            evidence: { record_b: recordB },
          });
          exceptionCount++;
        }
      }
    }

    // Batch insert candidates
    if (candidatesToInsert.length > 0) {
      const { error: candidateError } = await supabase.from('match_candidates').insert(candidatesToInsert);
      if (candidateError) console.error('Candidate insert error:', candidateError);
    }

    // Get inserted candidates for auto-match decisions
    if (autoMatchCount > 0) {
      const { data: insertedCandidates } = await supabase
        .from('match_candidates')
        .select('id, score_total, left_record_id')
        .eq('run_id', runId)
        .gte('score_total', CONFIG.AUTO_MATCH_THRESHOLD);

      // Create auto-match decisions
      const autoDecisions = [];
      const processedRecords = new Set<string>();
      
      for (const c of insertedCandidates || []) {
        if (!processedRecords.has(c.left_record_id)) {
          processedRecords.add(c.left_record_id);
          autoDecisions.push({
            candidate_id: c.id,
            decision_status: 'auto',
            decided_by_agent: true,
            justification: `Auto-matched with score ${c.score_total}`,
            confidence: c.score_total,
          });
        }
      }

      if (autoDecisions.length > 0) {
        await supabase.from('match_decisions').insert(autoDecisions);
      }
    }

    // Batch insert exceptions
    if (exceptionsToInsert.length > 0) {
      const { error: exceptionError } = await supabase.from('exception_cases').insert(exceptionsToInsert);
      if (exceptionError) console.error('Exception insert error:', exceptionError);
    }

    // Calculate total amounts
    const totalAmountA = recordsA.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const totalAmountB = recordsB.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const unmatchedAmount = exceptionsToInsert.reduce((sum, e) => {
      const amount = e.evidence?.record_a?.amount || e.evidence?.record_b?.amount || 0;
      return sum + Math.abs(Number(amount));
    }, 0);

    // Update run with metrics
    const metrics = {
      records_a: recordsA.length,
      records_b: recordsB.length,
      total_candidates: candidatesToInsert.length,
      auto_matched: autoMatchCount,
      exceptions_created: exceptionCount,
      match_rate: recordsA.length > 0 ? ((autoMatchCount / recordsA.length) * 100).toFixed(1) : 0,
      total_amount_a: totalAmountA,
      total_amount_b: totalAmountB,
      unmatched_amount: unmatchedAmount,
    };

    await supabase.from('recon_runs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      metrics,
    }).eq('id', runId);

    // Log audit event
    await supabase.from('agent_audit_events').insert({
      actor_type: 'system',
      actor_id: userId,
      tenant_id: tenantId,
      entity_type: 'recon_run',
      entity_id: runId,
      action: 'run_matching',
      tool_name: 'run_matching',
      input_json: { runId },
      output_json: metrics,
      run_id: runId,
    });

    const enrichmentPayload = { runId, tenantId, userId };
    const invokeChain = async () => {
      try {
        await supabase.from('agent_audit_events').insert({
          actor_type: 'system',
          actor_id: userId,
          tenant_id: tenantId,
          entity_type: 'recon_run',
          entity_id: runId,
          action: 'drill_enrichment_chain_started',
          tool_name: 'run_matching',
          input_json: enrichmentPayload,
          run_id: runId,
        });

        const enrichResult = await supabase.functions.invoke('enrich-break-details', { body: enrichmentPayload });
        const resolveResult = await supabase.functions.invoke('resolve-document-trade-links', { body: { runId, tenantId } });
        const refreshResult = await supabase.functions.invoke('refresh-drill-mv', { body: { runId, tenantId } });

        await supabase.from('agent_audit_events').insert({
          actor_type: 'system',
          actor_id: userId,
          tenant_id: tenantId,
          entity_type: 'recon_run',
          entity_id: runId,
          action: 'drill_enrichment_chain_completed',
          tool_name: 'run_matching',
          input_json: enrichmentPayload,
          output_json: {
            enrich: enrichResult.error ? { error: enrichResult.error.message } : enrichResult.data,
            resolve: resolveResult.error ? { error: resolveResult.error.message } : resolveResult.data,
            refresh: refreshResult.error ? { error: refreshResult.error.message } : refreshResult.data,
          },
          run_id: runId,
        });
      } catch (chainError) {
        console.error('Drill enrichment chain failed:', chainError);
        await supabase.from('agent_audit_events').insert({
          actor_type: 'system',
          actor_id: userId,
          tenant_id: tenantId,
          entity_type: 'recon_run',
          entity_id: runId,
          action: 'drill_enrichment_chain_failed',
          tool_name: 'run_matching',
          input_json: enrichmentPayload,
          output_json: { error: chainError instanceof Error ? chainError.message : 'Unknown chain error' },
          run_id: runId,
        });
      }
    };

    void invokeChain();

    return new Response(JSON.stringify({ success: true, metrics }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Matching error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
