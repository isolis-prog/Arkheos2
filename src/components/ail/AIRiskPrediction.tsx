/**
 * AIL Integration — Risk Breach Prediction card for Risk Limits page.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AISuggestionCard } from '@/components/ail/AIFeedbackWidget';
import { useAILInference } from '@/hooks/useAIL';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Sparkles, Shield, TrendingUp, AlertTriangle } from 'lucide-react';

interface RiskBreachPrediction {
  current_utilization_pct: number;
  projected_eom_utilization_pct: number;
  projection_confidence: number;
  breach_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  days_to_potential_breach: number | null;
  breach_driver: string | null;
  recommended_position_adjustment: {
    direction: string;
    suggested_quantity: number | null;
    unit: string;
    rationale: string;
  };
  cftc_threshold_status: {
    current_contracts: number;
    threshold: number;
    utilization_pct: number;
    form_102_trigger_imminent: boolean;
  };
}

const RISK_COLORS: Record<string, string> = {
  LOW: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  MEDIUM: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  HIGH: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  CRITICAL: 'bg-red-500/10 text-red-600 border-red-500/30',
};

interface AIRiskPredictionProps {
  riskData: Record<string, unknown>;
  entityId?: string;
}

export const AIRiskPrediction = ({ riskData, entityId = 'risk-portfolio' }: AIRiskPredictionProps) => {
  const { isEnabled } = useFeatureFlags();
  const { invoke, isLoading, error } = useAILInference();
  const [result, setResult] = useState<RiskBreachPrediction | null>(null);
  const [resultId, setResultId] = useState('');

  if (!isEnabled('module.ail')) return null;

  const handlePredict = async () => {
    const res = await invoke({
      workflow_type: 'RISK_BREACH_PREDICTION',
      context_payload: { ...riskData, entity_id: entityId },
      entity_type: 'RISK_LIMIT',
      entity_id: entityId,
      requesting_module: 'POSITION_RISK',
      priority: 'NORMAL',
    });
    if (res) {
      setResult(res.result_payload as unknown as RiskBreachPrediction);
      setResultId(res.result_id);
    }
  };

  if (!result && !isLoading && !error) {
    return (
      <div className="border border-dashed border-primary/20 rounded-lg p-4 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Risk Breach Forecast</span>
          </div>
          <Button size="sm" variant="outline" onClick={handlePredict} className="text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            Run Forecast
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AISuggestionCard
      title="AI Risk Breach Forecast"
      resultId={resultId}
      workflowType="RISK_BREACH_PREDICTION"
      entityId={entityId}
      entityType="RISK_LIMIT"
      confidenceScore={result?.projection_confidence}
      originalSuggestion={result as unknown as Record<string, unknown>}
      isLoading={isLoading}
      error={error}
    >
      {result && (
        <div className="space-y-3 text-sm">
          {/* Risk level */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={RISK_COLORS[result.breach_risk]}>
              {result.breach_risk} RISK
            </Badge>
            {result.days_to_potential_breach != null && (
              <span className="text-xs text-muted-foreground">
                {result.days_to_potential_breach}d to potential breach
              </span>
            )}
          </div>

          {/* Utilization bars */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Current Utilization</span>
                <span>{result.current_utilization_pct?.toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(result.current_utilization_pct, 100)} className="h-1.5" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Projected EOM</span>
                <span>{result.projected_eom_utilization_pct?.toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(result.projected_eom_utilization_pct, 100)} className="h-1.5" />
            </div>
          </div>

          {/* Breach driver */}
          {result.breach_driver && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Driver:</span> {result.breach_driver}
            </p>
          )}

          {/* Recommendation */}
          {result.recommended_position_adjustment?.direction !== 'NO_ACTION' && (
            <div className="p-2 rounded bg-muted/50 text-xs">
              <p className="font-medium mb-1">Recommended Adjustment</p>
              <p className="text-muted-foreground">{result.recommended_position_adjustment.rationale}</p>
            </div>
          )}

          {/* CFTC */}
          {result.cftc_threshold_status?.form_102_trigger_imminent && (
            <div className="flex items-center gap-1 text-xs text-destructive pt-1 border-t">
              <Shield className="h-3 w-3" />
              CFTC Form 102 trigger imminent — {result.cftc_threshold_status.utilization_pct.toFixed(1)}% of threshold
            </div>
          )}
        </div>
      )}
    </AISuggestionCard>
  );
};
