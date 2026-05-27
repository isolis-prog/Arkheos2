/**
 * AIL Integration — P&L Explanation panel for PnL Attribution page.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AISuggestionCard } from '@/components/ail/AIFeedbackWidget';
import { useAILInference } from '@/hooks/useAIL';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { PnLExplanationResult } from '@/lib/ail/types';

interface AIPnLExplanationProps {
  pnlData: Record<string, unknown>;
  entityId?: string;
}

export const AIPnLExplanation = ({ pnlData, entityId = 'pnl-current' }: AIPnLExplanationProps) => {
  const { isEnabled } = useFeatureFlags();
  const { invoke, isLoading, error } = useAILInference();
  const [result, setResult] = useState<PnLExplanationResult | null>(null);
  const [resultId, setResultId] = useState('');
  const [expanded, setExpanded] = useState(false);

  if (!isEnabled('module.ail')) return null;

  const handleExplain = async () => {
    const res = await invoke({
      workflow_type: 'PNL_EXPLANATION',
      context_payload: { ...pnlData, entity_id: entityId },
      entity_type: 'PNL_RECORD',
      entity_id: entityId,
      requesting_module: 'PNL_ATTRIBUTION',
      priority: 'REALTIME',
    });
    if (res) {
      setResult(res.result_payload as unknown as PnLExplanationResult);
      setResultId(res.result_id);
      setExpanded(true);
    }
  };

  if (!result && !isLoading && !error) {
    return (
      <Button size="sm" variant="outline" onClick={handleExplain} className="gap-1.5">
        <Sparkles className="h-3.5 w-3.5" />
        Explain this P&L
      </Button>
    );
  }

  const fmt = (n: number) => {
    const sign = n >= 0 ? '+' : '-';
    const abs = Math.abs(n);
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
    return `${sign}$${abs.toFixed(0)}`;
  };

  return (
    <AISuggestionCard
      title="AI P&L Explanation"
      resultId={resultId}
      workflowType="PNL_EXPLANATION"
      entityId={entityId}
      entityType="PNL_RECORD"
      originalSuggestion={result as unknown as Record<string, unknown>}
      isLoading={isLoading}
      error={error}
    >
      {result && (
        <div className="space-y-3 text-sm">
          <p className="font-medium">{result.headline}</p>

          {/* Variance summary */}
          <div className="flex gap-4 text-xs">
            <span>
              vs Prior Month:{' '}
              <span className={result.total_variance_vs_prior_month_usd >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                {fmt(result.total_variance_vs_prior_month_usd)}
              </span>
            </span>
            {result.total_variance_vs_budget_usd != null && (
              <span>
                vs Budget:{' '}
                <span className={result.total_variance_vs_budget_usd >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                  {fmt(result.total_variance_vs_budget_usd)}
                </span>
              </span>
            )}
          </div>

          {/* Drivers */}
          {expanded && result.drivers?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Variance Drivers</p>
              {result.drivers.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    {d.impact_usd >= 0
                      ? <TrendingUp className="h-3 w-3 text-emerald-600" />
                      : <TrendingDown className="h-3 w-3 text-destructive" />}
                    <span className="font-medium">{d.driver_name}</span>
                    <Badge variant="outline" className="text-[9px]">{d.driver_type}</Badge>
                  </div>
                  <div className="text-right">
                    <span className={d.impact_usd >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                      {fmt(d.impact_usd)}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      ({d.impact_pct_of_total_variance?.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Narrative */}
          {expanded && result.narrative && (
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground">{result.narrative}</p>
            </div>
          )}

          {/* Anomalies */}
          {expanded && result.anomalies_detected?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.anomalies_detected.map((a, i) => (
                <Badge key={i} variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                  {a}
                </Badge>
              ))}
            </div>
          )}

          {!expanded && (
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setExpanded(true)}>
              Show full analysis
            </Button>
          )}
        </div>
      )}
    </AISuggestionCard>
  );
};
