/**
 * AIL Integration — Lifecycle Prediction badge/card for Trade Lifecycle page.
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AISuggestionCard } from '@/components/ail/AIFeedbackWidget';
import { useAILInference } from '@/hooks/useAIL';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Sparkles, Clock, AlertTriangle } from 'lucide-react';

interface LifecyclePrediction {
  current_stage: string;
  days_in_stage: number;
  benchmark_days: number;
  delay_flag: boolean;
  delay_severity: 'NORMAL' | 'MILD' | 'MODERATE' | 'CRITICAL';
  probable_delay_cause: string;
  predicted_settlement_date: string;
  confidence_in_prediction: number;
  blocking_items: string[];
  recommended_actions: Array<{
    action: string;
    owner: string;
    urgency: string;
  }>;
}

const SEVERITY_COLORS: Record<string, string> = {
  NORMAL: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  MILD: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  MODERATE: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  CRITICAL: 'bg-red-500/10 text-red-600 border-red-500/30',
};

interface AILifecyclePredictionProps {
  tradeId: string;
  tradeData: Record<string, unknown>;
  compact?: boolean;
}

export const AILifecyclePrediction = ({ tradeId, tradeData, compact = false }: AILifecyclePredictionProps) => {
  const { isEnabled } = useFeatureFlags();
  const { invoke, isLoading, error } = useAILInference();
  const [result, setResult] = useState<LifecyclePrediction | null>(null);
  const [resultId, setResultId] = useState('');

  if (!isEnabled('module.ail')) return null;

  const handlePredict = async () => {
    const res = await invoke({
      workflow_type: 'LIFECYCLE_PREDICTION',
      context_payload: { trade: tradeData, entity_id: tradeId },
      entity_type: 'TRADE',
      entity_id: tradeId,
      requesting_module: 'TRADE_LIFECYCLE',
      priority: 'NORMAL',
    });
    if (res) {
      setResult(res.result_payload as unknown as LifecyclePrediction);
      setResultId(res.result_id);
    }
  };

  // Compact mode — just a badge indicator
  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-[10px] gap-1 text-primary"
        onClick={handlePredict}
        disabled={isLoading}
      >
        <Sparkles className="h-2.5 w-2.5" />
        {isLoading ? '...' : 'AI Predict'}
      </Button>
    );
  }

  if (!result && !isLoading && !error) {
    return (
      <Button size="sm" variant="outline" onClick={handlePredict} className="gap-1.5 text-xs">
        <Sparkles className="h-3 w-3" />
        Predict Settlement
      </Button>
    );
  }

  return (
    <AISuggestionCard
      title="AI Lifecycle Prediction"
      resultId={resultId}
      workflowType="LIFECYCLE_PREDICTION"
      entityId={tradeId}
      entityType="TRADE"
      confidenceScore={result?.confidence_in_prediction}
      originalSuggestion={result as unknown as Record<string, unknown>}
      isLoading={isLoading}
      error={error}
    >
      {result && (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={SEVERITY_COLORS[result.delay_severity]}>
              {result.delay_severity}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {result.days_in_stage}d in {result.current_stage} (benchmark: {result.benchmark_days}d)
            </span>
          </div>

          {result.delay_flag && (
            <>
              <p className="text-xs">{result.probable_delay_cause}</p>
              <div className="flex items-center gap-1.5 text-xs">
                <Clock className="h-3 w-3 text-muted-foreground" />
                Predicted settlement: <span className="font-medium">{result.predicted_settlement_date}</span>
              </div>
            </>
          )}

          {result.blocking_items?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Blocking Items</p>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                {result.blocking_items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}

          {result.recommended_actions?.length > 0 && (
            <div className="space-y-1">
              {result.recommended_actions.slice(0, 3).map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50">
                  <span>{a.action}</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-[9px]">{a.owner}</Badge>
                    <Badge variant="outline" className="text-[9px]">{a.urgency}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AISuggestionCard>
  );
};
