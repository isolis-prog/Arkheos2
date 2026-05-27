/**
 * Drill scope plumbing for the Valuation Recon module.
 *
 * Mirrors the cashflows pattern: a single base64url-encoded JSON token in
 * the `?d=` query parameter holds the full scope (runId + filters), so any
 * page can be deep-linked with full context preserved.
 */
import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { DrillPathNode, DrillScope } from '@/components/drill';
import { useDrillAudit } from '@/hooks/useDrillAudit';
import {
  ValuationDrillScopeZ,
  safeDecodeScope,
  safeEncodeScope,
} from '@/lib/drill/scopeSchema';

const DRILL_PARAM = 'd';

export type ValuationMaterialityFlag =
  | 'immaterial'
  | 'review'
  | 'material'
  | 'critical';

export interface ValuationDrillScopeValue {
  runId: string;
  traderDesk?: string;
  strategy?: string;
  dealId?: string;
  materialityFlag?: ValuationMaterialityFlag;
}

export function encodeValuationScope(scope: ValuationDrillScopeValue) {
  return safeEncodeScope(scope as unknown as Record<string, unknown>, ValuationDrillScopeZ as any);
}

export function safeDecodeValuationScope(token: string | null): ValuationDrillScopeValue | null {
  return safeDecodeScope(token, ValuationDrillScopeZ) as ValuationDrillScopeValue | null;
}

export function decodeValuationScope(
  token: string | null,
  fallbackRunId = '',
): ValuationDrillScopeValue {
  const decoded = safeDecodeValuationScope(token);
  if (!decoded) return { runId: fallbackRunId };
  return decoded;
}

export function buildValuationDrillUrl(path: string, scope: ValuationDrillScopeValue) {
  const params = new URLSearchParams();
  params.set(DRILL_PARAM, encodeValuationScope(scope));
  return `${path}?${params.toString()}`;
}

/**
 * Hook that exposes the current scope plus mutators that keep the URL in
 * sync. Pages should be the only place that calls `setScope` directly.
 */
export function useValuationDrillScope(runIdFromRoute: string): {
  scope: ValuationDrillScopeValue;
  setScope: (next: ValuationDrillScopeValue) => void;
  removeKey: (key: keyof ValuationDrillScopeValue) => void;
  resetToBase: () => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawToken = searchParams.get(DRILL_PARAM);

  useEffect(() => {
    if (rawToken && safeDecodeValuationScope(rawToken) === null) {
      toast.error('Invalid drill link, returning to base view');
      navigate('/valuation-recon', { replace: true });
    }
  }, [rawToken, navigate]);

  const scope = useMemo<ValuationDrillScopeValue>(() => {
    const decoded = decodeValuationScope(rawToken, runIdFromRoute);
    // The route param always wins for runId so we never drift.
    return { ...decoded, runId: runIdFromRoute || decoded.runId };
  }, [rawToken, runIdFromRoute]);

  const setScope = (next: ValuationDrillScopeValue) => {
    const params = new URLSearchParams(searchParams);
    params.set(DRILL_PARAM, encodeValuationScope(next));
    setSearchParams(params, { replace: true });
  };

  const removeKey = (key: keyof ValuationDrillScopeValue) => {
    if (key === 'runId') return; // never drop the runId
    const next = { ...scope };
    delete next[key];
    setScope(next);
  };

  const resetToBase = () => setScope({ runId: scope.runId });

  return { scope, setScope, removeKey, resetToBase };
}

/**
 * Build the breadcrumb path. The list always starts at the module root and
 * grows as more scope dimensions are filled in.
 */
export function buildValuationPath(
  level: number,
  scope: ValuationDrillScopeValue,
): DrillPathNode[] {
  const nodes: DrillPathNode[] = [
    { level: 0, label: 'Valuation Recon', scope: {}, href: '/valuation-recon' },
  ];

  if (!scope.runId) return nodes;

  nodes.push({
    level: 1,
    label: `Run ${scope.runId.slice(0, 8)}`,
    scope: { runId: scope.runId },
    href: `/valuation-recon/${scope.runId}`,
  });

  if (level >= 2) {
    nodes.push({
      level: 2,
      label: 'By desk',
      scope: { runId: scope.runId },
      href: buildValuationDrillUrl(`/valuation-recon/${scope.runId}/by-desk`, {
        runId: scope.runId,
      }),
    });
  }

  if (level >= 3 && scope.traderDesk) {
    nodes.push({
      level: 3,
      label: scope.traderDesk,
      scope: { traderDesk: scope.traderDesk },
      href: buildValuationDrillUrl(`/valuation-recon/${scope.runId}/by-strategy`, {
        runId: scope.runId,
        traderDesk: scope.traderDesk,
      }),
    });
  }

  if (level >= 4) {
    nodes.push({
      level: nodes.length,
      label: scope.strategy ? `${scope.strategy} deals` : 'Deals',
      scope: { strategy: scope.strategy },
      href: buildValuationDrillUrl(`/valuation-recon/${scope.runId}/deals`, scope),
    });
  }

  if (level >= 5 && scope.dealId) {
    nodes.push({
      level: nodes.length,
      label: `Deal ${scope.dealId}`,
      scope: { dealId: scope.dealId },
      href: buildValuationDrillUrl(
        `/valuation-recon/${scope.runId}/deals/${encodeURIComponent(scope.dealId)}/components`,
        scope,
      ),
    });
  }

  if (level >= 6 && scope.dealId) {
    nodes.push({
      level: nodes.length,
      label: 'Inputs',
      scope: { dealId: scope.dealId },
      href: buildValuationDrillUrl(
        `/valuation-recon/${scope.runId}/deals/${encodeURIComponent(scope.dealId)}/inputs`,
        scope,
      ),
    });
  }

  return nodes;
}

export function valuationScopeToHeader(scope: ValuationDrillScopeValue): DrillScope {
  const result: DrillScope = {
    runId: { label: 'Run', value: scope.runId.slice(0, 8) },
  };
  if (scope.traderDesk)
    result.traderDesk = { label: 'Desk', value: scope.traderDesk, removable: true };
  if (scope.strategy)
    result.strategy = { label: 'Strategy', value: scope.strategy, removable: true };
  if (scope.dealId)
    result.dealId = { label: 'Deal', value: scope.dealId, removable: true };
  if (scope.materialityFlag)
    result.materialityFlag = {
      label: 'Materiality',
      value: scope.materialityFlag,
      removable: true,
    };
  return result;
}

/** Logs a `drill_audit_event` once per (level, scopeSignature) mount. */
export function useValuationDrillAudit(
  action: string,
  level: number,
  scope: ValuationDrillScopeValue,
  rowCount?: number,
) {
  const { logDrillEvent } = useDrillAudit();
  const path = useMemo(() => buildValuationPath(level, scope), [level, scope]);
  const sig = JSON.stringify(scope);

  useEffect(() => {
    if (!scope.runId) return;
    logDrillEvent({
      module: 'valuation_recon',
      action,
      drillPath: path.map((p) => ({ level: p.level, label: p.label, href: p.href })),
      scopeFilters: scope as unknown as Record<string, unknown>,
      targetLevel: level,
      rowCount,
    }).catch(() => {
      // audit failures must never break navigation
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, level, sig]);
}

export function useNavigateWithValuationScope() {
  const navigate = useNavigate();
  return (path: string, scope: ValuationDrillScopeValue) => {
    navigate(buildValuationDrillUrl(path, scope));
  };
}
