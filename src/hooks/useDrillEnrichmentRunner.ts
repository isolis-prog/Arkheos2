import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

export type EnrichmentStepKey =
  | 'enrich-break-details'
  | 'resolve-document-trade-links'
  | 'refresh-drill-mv';

export type EnrichmentStepStatus = 'idle' | 'running' | 'success' | 'error';

export interface EnrichmentStepState {
  key: EnrichmentStepKey;
  label: string;
  description: string;
  status: EnrichmentStepStatus;
  startedAt: number | null;
  finishedAt: number | null;
  durationMs: number | null;
  metrics: Record<string, unknown> | null;
  error: string | null;
}

const STEP_DEFS: Array<Pick<EnrichmentStepState, 'key' | 'label' | 'description'>> = [
  {
    key: 'enrich-break-details',
    label: 'Enrich break details',
    description: 'Calcula deltas, normaliza partes y sugiere root-cause con AIL.',
  },
  {
    key: 'resolve-document-trade-links',
    label: 'Resolve document↔trade links',
    description: 'Vincula docs (invoice/cashflow) con trades canónicos.',
  },
  {
    key: 'refresh-drill-mv',
    label: 'Refresh drill MVs',
    description: 'Refresca las materialized views de drill por run.',
  },
];

const initialState = (): EnrichmentStepState[] =>
  STEP_DEFS.map((s) => ({
    ...s,
    status: 'idle',
    startedAt: null,
    finishedAt: null,
    durationMs: null,
    metrics: null,
    error: null,
  }));

export function useDrillEnrichmentRunner(runId: string | undefined) {
  const [steps, setSteps] = useState<EnrichmentStepState[]>(initialState);
  const [isRunning, setIsRunning] = useState(false);

  const updateStep = useCallback(
    (key: EnrichmentStepKey, patch: Partial<EnrichmentStepState>) => {
      setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
    },
    [],
  );

  const reset = useCallback(() => setSteps(initialState()), []);

  const runStep = useCallback(
    async (key: EnrichmentStepKey) => {
      if (!runId) return false;
      const startedAt = Date.now();
      updateStep(key, { status: 'running', startedAt, finishedAt: null, durationMs: null, metrics: null, error: null });

      try {
        const { data, error } = await supabase.functions.invoke(key, {
          body: { runId, tenantId: TENANT_ID },
        });
        const finishedAt = Date.now();

        if (error) throw new Error(error.message);
        if (data && typeof data === 'object' && 'success' in data && (data as { success: boolean }).success === false) {
          throw new Error(((data as { error?: string }).error) ?? 'Unknown error');
        }

        const metrics = (data as { metrics?: Record<string, unknown> } | null)?.metrics ?? null;

        updateStep(key, {
          status: 'success',
          finishedAt,
          durationMs: finishedAt - startedAt,
          metrics,
        });
        return true;
      } catch (err) {
        const finishedAt = Date.now();
        updateStep(key, {
          status: 'error',
          finishedAt,
          durationMs: finishedAt - startedAt,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        return false;
      }
    },
    [runId, updateStep],
  );

  const runAll = useCallback(async () => {
    if (!runId || isRunning) return;
    setIsRunning(true);
    reset();
    try {
      for (const def of STEP_DEFS) {
        const ok = await runStep(def.key);
        if (!ok) break;
      }
    } finally {
      setIsRunning(false);
    }
  }, [runId, isRunning, reset, runStep]);

  return { steps, isRunning, runAll, runStep, reset };
}
