/**
 * AIL Integration — Exception Classification card for Exception Details page.
 * Displays AI root cause analysis with confidence, suggested actions, and feedback.
 */
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AISuggestionCard } from '@/components/ail/AIFeedbackWidget';
import { useAILInference, useAILResult } from '@/hooks/useAIL';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Sparkles, ExternalLink, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import type { ExceptionClassificationResult } from '@/lib/ail/types';

interface AIExceptionClassificationProps {
  exceptionId: string;
  exception: Record<string, unknown>;
}

const CAUSE_COLORS: Record<string, string> = {
  ROUNDING_ERROR: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  TIMING_DIFFERENCE: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  SYSTEM_CONFIG: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  PROCESS_ERROR: 'bg-red-500/10 text-red-600 border-red-500/30',
  COUNTERPARTY_ERROR: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  DATA_ENTRY: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  MARKET_PRICE_DIFF: 'bg-green-500/10 text-green-600 border-green-500/30',
  UNKNOWN: 'bg-muted text-muted-foreground border-muted',
};

export const AIExceptionClassification = ({ exceptionId, exception }: AIExceptionClassificationProps) => {
  const { isEnabled } = useFeatureFlags();
  const { invoke, isLoading: invokeLoading, error: invokeError } = useAILInference();
  const { result: cachedResult, fetch: fetchCached, isLoading: fetchLoading } = useAILResult(
    'EXCEPTION', exceptionId, 'EXCEPTION_CLASSIFICATION'
  );
  const [result, setResult] = useState<ExceptionClassificationResult | null>(null);
  const [resultId, setResultId] = useState<string>('');
  const [hasTriggered, setHasTriggered] = useState(false);

  const ailEnabled = isEnabled('module.ail') && isEnabled('feature.ail_exception_classification');

  // Try to fetch cached result on mount
  useEffect(() => {
    if (ailEnabled && exceptionId && !hasTriggered) {
      fetchCached().then((cached) => {
        if (cached) {
          setResult(cached.result_payload as unknown as ExceptionClassificationResult);
          setResultId(cached.result_id);
        }
      });
    }
  }, [ailEnabled, exceptionId]);

  if (!ailEnabled) return null;

  const handleAnalyze = async () => {
    setHasTriggered(true);
    const res = await invoke({
      workflow_type: 'EXCEPTION_CLASSIFICATION',
      context_payload: { exception, entity_id: exceptionId },
      entity_type: 'EXCEPTION',
      entity_id: exceptionId,
      requesting_module: 'EXCEPTIONS',
      priority: 'NORMAL',
    });
    if (res) {
      setResult(res.result_payload as unknown as ExceptionClassificationResult);
      setResultId(res.result_id);
    }
  };

  const isLoading = invokeLoading || fetchLoading;

  if (!result && !isLoading && !invokeError) {
    return (
      <div className="border border-dashed border-primary/20 rounded-lg p-4 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Root Cause Analysis</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleAnalyze} className="text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            Analyze Exception
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AISuggestionCard
      title="AI Root Cause Analysis"
      resultId={resultId}
      workflowType="EXCEPTION_CLASSIFICATION"
      entityId={exceptionId}
      entityType="EXCEPTION"
      confidenceScore={result?.cause_confidence}
      originalSuggestion={result as unknown as Record<string, unknown>}
      isLoading={isLoading}
      error={invokeError}
    >
      {result && (
        <div className="space-y-3 text-sm">
          {/* Cause category badge */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Category:</span>
            <Badge variant="outline" className={CAUSE_COLORS[result.cause_category] || CAUSE_COLORS.UNKNOWN}>
              {result.cause_category?.replace(/_/g, ' ')}
            </Badge>
          </div>

          {/* Probable cause */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Probable Cause</p>
            <p className="text-sm">{result.probable_cause}</p>
          </div>

          {/* Confidence bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Confidence</span>
              <span>{Math.round((result.cause_confidence || 0) * 100)}%</span>
            </div>
            <Progress value={(result.cause_confidence || 0) * 100} className="h-1.5" />
          </div>

          {/* Suggested action */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Suggested Action</p>
            <p className="text-sm">{result.suggested_action}</p>
          </div>

          {/* Action steps */}
          {result.action_steps?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Steps</p>
              <ol className="list-decimal list-inside space-y-0.5 text-xs text-muted-foreground">
                {result.action_steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Quick stats row */}
          <div className="flex gap-4 pt-2 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Est. {result.estimated_resolution_hours}h to resolve
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Impact: ${(result.financial_impact_usd || 0).toLocaleString()}
            </div>
            {result.escalate_to_management && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Escalation recommended
              </div>
            )}
          </div>
        </div>
      )}
    </AISuggestionCard>
  );
};
