/**
 * AIL Integration — Close Readiness Prediction card.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AISuggestionCard } from '@/components/ail/AIFeedbackWidget';
import { useAILInference } from '@/hooks/useAIL';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Sparkles, Calendar, AlertTriangle, User } from 'lucide-react';

interface CloseReadinessPrediction {
  tasks_complete_pct: number;
  predicted_close_date: string;
  target_close_date: string;
  on_track: boolean;
  days_at_risk: number;
  close_risk_score: number;
  critical_path_tasks?: Array<{
    task_id: string;
    task_name: string;
    assigned_to: string;
    days_to_deadline: number;
  }>;
  bottleneck_resource?: string;
  recommended_reprioritizations?: Array<{
    task_id: string;
    current_owner: string;
    suggested_owner: string;
    reason: string;
  }>;
}

interface AICloseReadinessProps {
  closeData: Record<string, unknown>;
}

export const AICloseReadiness = ({ closeData }: AICloseReadinessProps) => {
  const { isEnabled } = useFeatureFlags();
  const { invoke, isLoading, error } = useAILInference();
  const [result, setResult] = useState<CloseReadinessPrediction | null>(null);
  const [resultId, setResultId] = useState('');

  if (!isEnabled('module.ail')) return null;

  const handlePredict = async () => {
    const res = await invoke({
      workflow_type: 'CLOSE_READINESS_PREDICTION',
      context_payload: { ...closeData, entity_id: 'close-current' },
      entity_type: 'CLOSE_PERIOD',
      entity_id: 'close-current',
      requesting_module: 'CLOSE_READINESS',
      priority: 'NORMAL',
    });
    if (res) {
      setResult(res.result_payload as unknown as CloseReadinessPrediction);
      setResultId(res.result_id);
    }
  };

  if (!result && !isLoading && !error) {
    return (
      <div className="border border-dashed border-primary/20 rounded-lg p-4 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Close Prediction</span>
          </div>
          <Button size="sm" variant="outline" onClick={handlePredict} className="text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            Predict Close Date
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AISuggestionCard
      title="AI Close Readiness Prediction"
      resultId={resultId}
      workflowType="CLOSE_READINESS_PREDICTION"
      entityId="close-current"
      entityType="CLOSE_PERIOD"
      confidenceScore={result ? (100 - result.close_risk_score) / 100 : undefined}
      originalSuggestion={result as unknown as Record<string, unknown>}
      isLoading={isLoading}
      error={error}
    >
      {result && (
        <div className="space-y-3 text-sm">
          {/* Predicted vs target */}
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              Predicted: <span className="font-medium">{result.predicted_close_date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              Target: <span className="font-medium">{result.target_close_date}</span>
            </div>
            <Badge variant={result.on_track ? 'secondary' : 'destructive'} className="text-[10px]">
              {result.on_track ? 'On Track' : `${result.days_at_risk}d at risk`}
            </Badge>
          </div>

          {/* Risk score gauge */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Close Risk Score</span>
              <span>{result.close_risk_score}/100</span>
            </div>
            <Progress
              value={result.close_risk_score}
              className="h-2"
            />
          </div>

          {/* Critical path tasks */}
          {result.critical_path_tasks && result.critical_path_tasks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Critical Path</p>
              <div className="space-y-1">
                {result.critical_path_tasks.slice(0, 3).map((task, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50">
                    <span>{task.task_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{task.assigned_to}</span>
                      <Badge variant="outline" className="text-[9px]">
                        {task.days_to_deadline}d left
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottleneck */}
          {result.bottleneck_resource && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 pt-1 border-t">
              <User className="h-3 w-3" />
              Bottleneck: {result.bottleneck_resource}
            </div>
          )}
        </div>
      )}
    </AISuggestionCard>
  );
};
