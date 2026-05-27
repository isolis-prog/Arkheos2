/**
 * AIL Integration — Natural Language Query indicator for Trade Explorer search.
 * Detects NLQ patterns and shows AI-interpreted query explanation.
 */
import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, AlertTriangle, Info } from 'lucide-react';
import { useAILInference } from '@/hooks/useAIL';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface NLQResult {
  interpreted_query: string;
  query_explanation: string;
  warning?: string;
  alternative_interpretations?: string[];
}

interface AINaturalLanguageQueryProps {
  query: string;
  onNLQResult?: (result: NLQResult | null) => void;
}

function isNaturalLanguageQuery(q: string): boolean {
  if (q.length < 20) return false;
  const nlPatterns = [
    /\bshow\b/i, /\bfind\b/i, /\blist\b/i, /\bwhat\b/i, /\bwhich\b/i,
    /\bhow many\b/i, /\bwhere\b/i, /\btotal\b/i, /\baverage\b/i, /\blargest\b/i,
    /\bsmallest\b/i, /\bmost\b/i, /\blast\b/i, /\brecent\b/i, /\ball\b/i,
    /\bgreater than\b/i, /\bless than\b/i, /\bbetween\b/i, /\bmore than\b/i,
  ];
  return nlPatterns.some(p => p.test(q));
}

export const AINaturalLanguageQuery = ({ query, onNLQResult }: AINaturalLanguageQueryProps) => {
  const { isEnabled } = useFeatureFlags();
  const { invoke, isLoading, error } = useAILInference();
  const [result, setResult] = useState<NLQResult | null>(null);

  const ailEnabled = isEnabled('module.ail') && isEnabled('feature.ail_natural_language');

  const handleSearch = useCallback(async () => {
    if (!ailEnabled || !isNaturalLanguageQuery(query)) return;

    const res = await invoke({
      workflow_type: 'NATURAL_LANGUAGE_QUERY',
      context_payload: { query, entity_id: 'nlq-search' },
      entity_type: 'QUERY',
      entity_id: 'nlq-search',
      requesting_module: 'TRADE_EXPLORER',
      priority: 'REALTIME',
    });

    if (res) {
      const nlqResult = res.result_payload as unknown as NLQResult;
      setResult(nlqResult);
      onNLQResult?.(nlqResult);
    }
  }, [query, ailEnabled, invoke, onNLQResult]);

  if (!ailEnabled) return null;

  const showNLQHint = isNaturalLanguageQuery(query) && !result && !isLoading;

  if (showNLQHint) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
          <Sparkles className="h-2.5 w-2.5" />
          AI Search Detected
        </Badge>
        <Button size="sm" variant="ghost" className="h-6 text-xs text-primary" onClick={handleSearch}>
          Search with AI
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3 text-primary animate-spin" />
        Interpreting your query...
      </div>
    );
  }

  if (result) {
    return (
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
            <Sparkles className="h-2.5 w-2.5" />
            AI Interpreted
          </Badge>
          <span className="text-xs font-medium">{result.interpreted_query}</span>
        </div>
        <p className="text-xs text-muted-foreground pl-1">{result.query_explanation}</p>
        {result.warning && (
          <Alert className="py-1 px-2 mt-1">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">{result.warning}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return null;
};

export { isNaturalLanguageQuery };
