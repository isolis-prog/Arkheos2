import { useCallback, useEffect, useState } from 'react';

export interface FoMoThresholds {
  warnPct: number;
  criticalPct: number;
}

const STORAGE_KEY = 'deal-lens.fo-mo-thresholds.v1';
const DEFAULT_THRESHOLDS: FoMoThresholds = { warnPct: 0.5, criticalPct: 2 };

function read(): FoMoThresholds {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THRESHOLDS;
    const parsed = JSON.parse(raw) as Partial<FoMoThresholds>;
    return {
      warnPct: Number.isFinite(parsed.warnPct as number) ? Number(parsed.warnPct) : DEFAULT_THRESHOLDS.warnPct,
      criticalPct: Number.isFinite(parsed.criticalPct as number) ? Number(parsed.criticalPct) : DEFAULT_THRESHOLDS.criticalPct,
    };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

export type FoMoBreachLevel = 'ok' | 'warn' | 'critical';

export function evaluateFoMoBreach(
  foPv: number | null | undefined,
  moPv: number | null | undefined,
  thresholds: FoMoThresholds,
): { level: FoMoBreachLevel; deltaPct: number | null } {
  if (foPv == null || moPv == null) return { level: 'ok', deltaPct: null };
  const base = Math.max(Math.abs(foPv), Math.abs(moPv));
  if (base === 0) return { level: 'ok', deltaPct: 0 };
  const deltaPct = (Math.abs(foPv - moPv) / base) * 100;
  if (deltaPct >= thresholds.criticalPct) return { level: 'critical', deltaPct };
  if (deltaPct >= thresholds.warnPct) return { level: 'warn', deltaPct };
  return { level: 'ok', deltaPct };
}

export function useFoMoThresholds() {
  const [thresholds, setThresholdsState] = useState<FoMoThresholds>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setThresholdsState(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setThresholds = useCallback((next: FoMoThresholds) => {
    const sanitized: FoMoThresholds = {
      warnPct: Math.max(0, Number(next.warnPct) || 0),
      criticalPct: Math.max(0, Number(next.criticalPct) || 0),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    setThresholdsState(sanitized);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setThresholdsState(DEFAULT_THRESHOLDS);
  }, []);

  return { thresholds, setThresholds, reset, defaults: DEFAULT_THRESHOLDS };
}
