/**
 * AIL Integration — Cross-Module Deal Analysis card for the Deal Lens page.
 *
 * Correlates findings across reconciliation, cashflow, valuation, and
 * confirmation breaks for a single deal and renders the AI's structured
 * JSON response as readable fields.
 *
 * UX:
 *  - Debounced trigger (avoids re-firing on rapid prop changes / nav).
 *  - React-Query cached per (dealId + content hash) for 5 minutes.
 *  - Skeleton while loading, graceful error fallback.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AISuggestionCard } from '@/components/ail/AIFeedbackWidget';
import { useAILInference } from '@/hooks/useAIL';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Sparkles, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import type {
  CrossModuleDealAnalysisResult,
  AILInferenceResult,
} from '@/lib/ail/types';
import type { DealLensData } from '@/hooks/inbox/useDealLens';

interface AICrossModuleDealAnalysisProps {
  dealId: string;
  data: DealLensData | undefined;
  /** Auto-trigger when data becomes available (debounced). Default: true */
  autoRun?: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-destructive/15 text-destructive border-destructive/40',
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  low: 'bg-muted text-muted-foreground border-border',
};

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  high: 'default',
  medium: 'secondary',
  low: 'outline',
};

/** Cheap stable hash so cache key reflects the actual analyzed payload. */
function hashPayload(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function buildContext(dealId: string, data: DealLensData) {
  // Send compact summaries per module rather than full break payloads
  const moduleSummaries = Object.entries(data.breaksByModule).map(
    ([module, rows]) => ({
      module,
      break_count: rows.length,
      total_delta_usd: rows.reduce(
        (s, r) => s + Number(r.amount_delta_usd ?? 0),
        0,
      ),
      severities: rows.reduce<Record<string, number>>((acc, r) => {
        const k = (r.severity ?? 'unknown') as string;
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {}),
      oldest_age_days: rows.reduce(
        (m, r) => Math.max(m, Number(r.age_days ?? 0)),
        0,
      ),
    }),
  );

  return {
    deal_id: dealId,
    header: data.header,
    pnl: data.pnl,
    total_exposure_usd: data.totalExposureUsd,
    module_summaries: moduleSummaries,
    recent_activity: data.activity.slice(0, 10).map((a) => ({
      module: a.module,
      action: a.action,
      summary: a.summary,
      at: a.created_at,
    })),
  };
}

export const AICrossModuleDealAnalysis = ({
  dealId,
  data,
  autoRun = true,
}: AICrossModuleDealAnalysisProps) => {
  const { isEnabled } = useFeatureFlags();
  const queryClient = useQueryClient();
  const { invoke, isLoading, error } = useAILInference();
  const [result, setResult] = useState<AILInferenceResult | null>(null);
  const debounceRef = useRef<number | null>(null);

  const cacheKey = useMemo(() => {
    if (!data) return null;
    const ctx = buildContext(dealId, data);
    return ['ail', 'cross-module-deal', dealId, hashPayload(JSON.stringify(ctx))];
  }, [dealId, data]);

  const mutation = useMutation({
    mutationKey: cacheKey ?? ['ail', 'cross-module-deal', dealId],
    mutationFn: async () => {
      if (!data) throw new Error('Deal data not loaded');
      const ctx = buildContext(dealId, data);
      const res = await invoke({
        workflow_type: 'CROSS_MODULE_DEAL_ANALYSIS',
        context_payload: ctx,
        entity_type: 'TRADE',
        entity_id: dealId,
        requesting_module: 'DEAL_LENS',
        priority: 'REALTIME',
      });
      return res;
    },
    onSuccess: (res) => {
      if (res && cacheKey) {
        queryClient.setQueryData(cacheKey, res);
        setResult(res);
      }
    },
  });

  // Hydrate from cache if we already analyzed this exact payload recently
  useEffect(() => {
    if (!cacheKey) return;
    const cached = queryClient.getQueryData<AILInferenceResult>(cacheKey);
    if (cached) {
      setResult(cached);
      return;
    }
    if (!autoRun) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      mutation.mutate();
    }, 600);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey?.join('|'), autoRun]);

  if (!isEnabled('module.ail')) return null;

  const handleRefresh = () => {
    if (cacheKey) queryClient.removeQueries({ queryKey: cacheKey });
    setResult(null);
    mutation.mutate();
  };

  if (!data) {
    return (
      <div className="border border-dashed rounded-lg p-4 bg-muted/20">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          AI cross-module analysis will appear once deal data is loaded.
        </div>
      </div>
    );
  }

  const payload = result?.result_payload as
    | unknown as
    | CrossModuleDealAnalysisResult
    | undefined;
  const showLoading = isLoading || mutation.isPending;

  return (
    <AISuggestionCard
      title="AI Cross-Module Deal Analysis"
      resultId={result?.result_id ?? ''}
      workflowType="CROSS_MODULE_DEAL_ANALYSIS"
      entityId={dealId}
      entityType="TRADE"
      confidenceScore={
        typeof payload?.confidence === 'number' ? payload.confidence : undefined
      }
      originalSuggestion={payload as unknown as Record<string, unknown>}
      isLoading={showLoading && !payload}
      error={error}
    >
      {showLoading && !payload && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      )}

      {!showLoading && !payload && !error && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Run AI to correlate breaks across reconciliation, cashflow, valuation
            and confirmations for this deal.
          </p>
          <Button size="sm" variant="outline" onClick={handleRefresh} className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Analyze
          </Button>
        </div>
      )}

      {payload && (
        <div className="space-y-4 text-sm">
          {/* Headline + refresh */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="font-medium leading-snug">{payload.headline}</p>
              {payload.executive_summary && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {payload.executive_summary}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={showLoading}
              className="h-7 gap-1 text-xs shrink-0"
            >
              <RefreshCw className={`h-3 w-3 ${showLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Cross-module findings */}
          {payload.cross_module_findings?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                <Layers className="h-3 w-3" />
                Cross-module findings
              </div>
              <div className="space-y-1.5">
                {payload.cross_module_findings.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 rounded border bg-background/50"
                  >
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize shrink-0 ${SEVERITY_COLORS[f.severity] ?? ''}`}
                    >
                      {f.severity}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {f.module}
                      </span>
                      <p className="text-xs">{f.finding}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correlated root cause */}
          {payload.correlated_root_cause && (
            <div className="rounded border-l-2 border-primary/60 bg-primary/5 p-2">
              <p className="text-[11px] font-medium text-primary mb-0.5">
                Correlated root cause
              </p>
              <p className="text-xs">{payload.correlated_root_cause}</p>
            </div>
          )}

          {/* Recommended actions */}
          {payload.recommended_actions?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Recommended actions
              </p>
              <ul className="space-y-1">
                {payload.recommended_actions.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs"
                  >
                    <Badge
                      variant={PRIORITY_VARIANT[a.priority] ?? 'outline'}
                      className="text-[10px] capitalize shrink-0"
                    >
                      {a.priority}
                    </Badge>
                    <div className="flex-1">
                      <span>{a.action}</span>
                      {a.owner && (
                        <span className="text-muted-foreground"> · {a.owner}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk flags */}
          {payload.risk_flags?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1 border-t">
              {payload.risk_flags.map((flag, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-[10px] text-destructive border-destructive/30"
                >
                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                  {flag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </AISuggestionCard>
  );
};
