/**
 * ArkheOS Intelligence Layer (AIL) — React hooks for AI workflows
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  AILWorkflowType,
  AILInferenceResult,
  AILFeedbackType,
  AILPriority,
} from '@/lib/ail/types';

const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

// ── Core CDE invocation hook ──
export function useAILInference() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AILInferenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const invoke = useCallback(
    async (params: {
      workflow_type: AILWorkflowType;
      context_payload: Record<string, unknown>;
      entity_type: string;
      entity_id: string;
      requesting_module: string;
      priority?: AILPriority;
      tenant_id?: string;
    }) => {
      setIsLoading(true);
      setError(null);

      const tenantId = params.tenant_id || DEMO_TENANT_ID;

      try {
        // Create inference request record
        const { data: request, error: reqError } = await supabase
          .from('ail_inference_requests')
          .insert([{
            tenant_id: tenantId,
            requesting_module: params.requesting_module,
            workflow_type: params.workflow_type,
            context_payload: params.context_payload,
            priority: params.priority || 'NORMAL',
            status: 'QUEUED',
          }] as any)
          .select('request_id')
          .single();

        if (reqError) {
          console.warn('Failed to create request record, proceeding anyway:', reqError);
        }

        // Call CDE dispatcher edge function
        const { data, error: fnError } = await supabase.functions.invoke(
          'ail-cde-dispatcher',
          {
            body: {
              request_id: request?.request_id || null,
              tenant_id: tenantId,
              workflow_type: params.workflow_type,
              context_payload: params.context_payload,
              entity_id: params.entity_id,
              entity_type: params.entity_type,
            },
          }
        );

        if (fnError) {
          throw new Error(fnError.message || 'AI analysis failed');
        }

        const inferenceResult: AILInferenceResult = {
          result_id: data.result_id,
          tenant_id: tenantId,
          workflow_type: params.workflow_type,
          entity_type: params.entity_type,
          entity_id: params.entity_id,
          result_type: data.workflow_type,
          result_payload: data.result_payload,
          confidence_score: data.confidence_score,
          model_version: 'gemini-3-flash-preview',
          tokens_used: data.tokens_used,
          latency_ms: data.latency_ms,
          created_at: new Date().toISOString(),
          is_active: true,
        };

        setResult(inferenceResult);
        return inferenceResult;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'AI analysis temporarily unavailable';
        setError(message);
        toast({
          title: 'AI Analysis',
          description: message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  return { invoke, isLoading, result, error, setResult };
}

// ── Feedback submission hook ──
export function useAILFeedback() {
  const { toast } = useToast();

  const submitFeedback = useCallback(
    async (params: {
      result_id: string;
      tenant_id?: string;
      workflow_type: AILWorkflowType;
      entity_id: string;
      entity_type: string;
      feedback_type: AILFeedbackType;
      feedback_reason?: string;
      user_correction?: Record<string, unknown>;
      original_suggestion?: Record<string, unknown>;
      displayed_at?: string;
    }) => {
      const tenantId = params.tenant_id || DEMO_TENANT_ID;
      const now = new Date();
      const displayedAt = params.displayed_at
        ? new Date(params.displayed_at)
        : now;
      const timeDelta = Math.round(
        (now.getTime() - displayedAt.getTime()) / 1000
      );

      const { error } = await supabase.from('ail_feedback').insert([{
        tenant_id: tenantId,
        result_id: params.result_id,
        workflow_type: params.workflow_type,
        entity_id: params.entity_id,
        entity_type: params.entity_type,
        user_id: '00000000-0000-0000-0000-000000000000',
        feedback_type: params.feedback_type,
        feedback_reason: params.feedback_reason || null,
        original_suggestion: params.original_suggestion || null,
        user_correction: params.user_correction || null,
        time_to_feedback_seconds: timeDelta > 0 ? timeDelta : null,
      }] as any);

      if (error) {
        console.error('Failed to submit feedback:', error);
        return;
      }

      // If ACCEPTED or MODIFIED with high quality, create a learned example
      if (
        params.feedback_type === 'ACCEPTED' ||
        params.feedback_type === 'MODIFIED'
      ) {
        await supabase.from('ail_learned_examples').insert([{
          tenant_id: tenantId,
          workflow_type: params.workflow_type,
          input_context: params.original_suggestion || {},
          correct_output:
            params.feedback_type === 'MODIFIED'
              ? params.user_correction
              : params.original_suggestion,
          quality_score:
            params.feedback_type === 'ACCEPTED' ? 0.9 : 0.7,
          is_active: true,
        }] as any);
      }

      const feedbackLabels: Record<AILFeedbackType, string> = {
        ACCEPTED: 'Thanks — this improves future suggestions',
        REJECTED: 'Feedback recorded — we\'ll do better',
        MODIFIED: 'Correction saved — future suggestions will improve',
        IGNORED: '',
        ESCALATED: 'Escalated for review',
      };

      const message = feedbackLabels[params.feedback_type];
      if (message) {
        toast({ title: 'AI Feedback', description: message });
      }
    },
    [toast]
  );

  return { submitFeedback };
}

// ── Fetch existing AI result for an entity ──
export function useAILResult(
  entityType: string,
  entityId: string | undefined,
  workflowType: AILWorkflowType
) {
  const [result, setResult] = useState<AILInferenceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!entityId) return null;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ail_inference_results')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('workflow_type', workflowType)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setResult(data as unknown as AILInferenceResult);
        return data as unknown as AILInferenceResult;
      }
    } catch {
      // Graceful degradation
    } finally {
      setIsLoading(false);
    }
    return null;
  }, [entityType, entityId, workflowType]);

  return { result, isLoading, fetch, setResult };
}

// ── AIL Status hook for admin panel ──
export function useAILStatus() {
  const [stats, setStats] = useState({
    totalEmbeddings: 0,
    queuedJobs: 0,
    processingJobs: 0,
    totalInferences: 0,
    totalFeedback: 0,
    acceptanceRate: 0,
    avgLatencyMs: 0,
    tokensUsedThisMonth: 0,
  });

  const refresh = useCallback(async () => {
    try {
      const [embeddings, jobs, inferences, feedback] = await Promise.all([
        supabase
          .from('ail_embeddings')
          .select('embedding_id', { count: 'exact', head: true }),
        supabase
          .from('ail_embedding_jobs')
          .select('status'),
        supabase
          .from('ail_inference_results')
          .select('confidence_score, latency_ms, tokens_used, created_at'),
        supabase
          .from('ail_feedback')
          .select('feedback_type'),
      ]);

      const jobData = jobs.data || [];
      const inferenceData = inferences.data || [];
      const feedbackData = feedback.data || [];

      const accepted = feedbackData.filter(
        (f: Record<string, unknown>) => f.feedback_type === 'ACCEPTED'
      ).length;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthTokens = inferenceData
        .filter((r: Record<string, unknown>) => new Date(r.created_at as string) >= monthStart)
        .reduce((sum: number, r: Record<string, unknown>) => sum + ((r.tokens_used as number) || 0), 0);

      setStats({
        totalEmbeddings: embeddings.count || 0,
        queuedJobs: jobData.filter(
          (j: Record<string, unknown>) => j.status === 'QUEUED'
        ).length,
        processingJobs: jobData.filter(
          (j: Record<string, unknown>) => j.status === 'PROCESSING'
        ).length,
        totalInferences: inferenceData.length,
        totalFeedback: feedbackData.length,
        acceptanceRate:
          feedbackData.length > 0
            ? Math.round((accepted / feedbackData.length) * 100)
            : 0,
        avgLatencyMs:
          inferenceData.length > 0
            ? Math.round(
                inferenceData.reduce(
                  (s: number, r: Record<string, unknown>) =>
                    s + ((r.latency_ms as number) || 0),
                  0
                ) / inferenceData.length
              )
            : 0,
        tokensUsedThisMonth: monthTokens,
      });
    } catch {
      // Graceful degradation
    }
  }, []);

  return { stats, refresh };
}
