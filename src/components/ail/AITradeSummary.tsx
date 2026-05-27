/**
 * AIL Integration — Trade Summary panel for Trade Detail page.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AISuggestionCard } from '@/components/ail/AIFeedbackWidget';
import { useAILInference } from '@/hooks/useAIL';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Sparkles, AlertTriangle, DollarSign } from 'lucide-react';
import type { TradeSummaryResult } from '@/lib/ail/types';

interface AITradeSummaryProps {
  dealId: string;
  tradeData: Record<string, unknown>;
}

export const AITradeSummary = ({ dealId, tradeData }: AITradeSummaryProps) => {
  const { isEnabled } = useFeatureFlags();
  const { invoke, isLoading, error } = useAILInference();
  const [result, setResult] = useState<TradeSummaryResult | null>(null);
  const [resultId, setResultId] = useState('');

  if (!isEnabled('module.ail')) return null;

  const handleSummarize = async () => {
    const res = await invoke({
      workflow_type: 'TRADE_SUMMARY',
      context_payload: { trade: tradeData, entity_id: dealId },
      entity_type: 'TRADE',
      entity_id: dealId,
      requesting_module: 'TRADE_EXPLORER',
      priority: 'REALTIME',
    });
    if (res) {
      setResult(res.result_payload as unknown as TradeSummaryResult);
      setResultId(res.result_id);
    }
  };

  if (!result && !isLoading && !error) {
    return (
      <Button size="sm" variant="outline" onClick={handleSummarize} className="gap-1.5">
        <Sparkles className="h-3.5 w-3.5" />
        AI Summary
      </Button>
    );
  }

  return (
    <AISuggestionCard
      title="AI Trade Summary"
      resultId={resultId}
      workflowType="TRADE_SUMMARY"
      entityId={dealId}
      entityType="TRADE"
      originalSuggestion={result as unknown as Record<string, unknown>}
      isLoading={isLoading}
      error={error}
    >
      {result && (
        <div className="space-y-3 text-sm">
          <p className="font-medium">{result.headline}</p>

          {result.summary_paragraphs?.map((p, i) => (
            <p key={i} className="text-xs text-muted-foreground">{p}</p>
          ))}

          {/* Key facts */}
          {result.key_facts?.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {result.key_facts.map((fact, i) => (
                <div key={i} className="flex justify-between text-xs p-2 rounded bg-muted/50">
                  <span className="text-muted-foreground">{fact.label}</span>
                  <span className="font-medium">{fact.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Financial snapshot */}
          {result.financial_snapshot && (
            <div className="flex gap-3 pt-2 border-t text-xs">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                Notional: ${result.financial_snapshot.notional_value_usd?.toLocaleString()}
              </div>
              <span className="text-muted-foreground">
                Cashflow: {result.financial_snapshot.cashflow_status}
              </span>
            </div>
          )}

          {/* Risk flags */}
          {result.risk_flags?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {result.risk_flags.map((flag, i) => (
                <Badge key={i} variant="outline" className="text-[10px] text-destructive border-destructive/30">
                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                  {flag}
                </Badge>
              ))}
            </div>
          )}

          {/* Open items */}
          {result.open_items?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Open Items</p>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                {result.open_items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </AISuggestionCard>
  );
};
