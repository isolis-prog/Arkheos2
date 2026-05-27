import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { DrillPathNode, DrillScope } from '@/components/drill';
import { useDrillAudit } from '@/hooks/useDrillAudit';
import {
  ConfirmationDrillScopeZ,
  safeDecodeScope,
  safeEncodeScope,
} from '@/lib/drill/scopeSchema';

const DRILL_PARAM = 'd';

export interface ConfirmationDrillScopeValue {
  runId: string;
  stage?: string;
  productCode?: string;
  counterpartyId?: string;
  counterpartyName?: string;
  blockingSettlement?: boolean;
}

export function encodeConfirmationScope(scope: ConfirmationDrillScopeValue) {
  return safeEncodeScope(scope as unknown as Record<string, unknown>, ConfirmationDrillScopeZ as any);
}

export function safeDecodeConfirmationScope(token: string | null): ConfirmationDrillScopeValue | null {
  return safeDecodeScope(token, ConfirmationDrillScopeZ) as ConfirmationDrillScopeValue | null;
}

export function decodeConfirmationScope(token: string | null, fallbackRunId = ''): ConfirmationDrillScopeValue {
  const decoded = safeDecodeConfirmationScope(token);
  if (!decoded) return { runId: fallbackRunId };
  return decoded;
}

export function buildConfirmationDrillUrl(path: string, scope: ConfirmationDrillScopeValue) {
  const params = new URLSearchParams();
  params.set(DRILL_PARAM, encodeConfirmationScope(scope));
  return `${path}?${params.toString()}`;
}

export function useConfirmationDrillScope(fallbackRunId = ''): {
  scope: ConfirmationDrillScopeValue;
  setScope: (next: ConfirmationDrillScopeValue) => void;
  removeKey: (key: keyof ConfirmationDrillScopeValue) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawToken = searchParams.get(DRILL_PARAM);

  useEffect(() => {
    if (rawToken && safeDecodeConfirmationScope(rawToken) === null) {
      toast.error('Invalid drill link, returning to base view');
      navigate('/confirmations-recon', { replace: true });
    }
  }, [rawToken, navigate]);

  const scope = useMemo(
    () => decodeConfirmationScope(rawToken, fallbackRunId),
    [rawToken, fallbackRunId],
  );

  const setScope = (next: ConfirmationDrillScopeValue) => {
    const params = new URLSearchParams(searchParams);
    params.set(DRILL_PARAM, encodeConfirmationScope(next));
    setSearchParams(params, { replace: true });
  };

  const removeKey = (key: keyof ConfirmationDrillScopeValue) => {
    const next = { ...scope };
    delete next[key];
    setScope(next);
  };

  return { scope, setScope, removeKey };
}

export function buildConfirmationPath(level: number, scope: ConfirmationDrillScopeValue): DrillPathNode[] {
  const nodes: DrillPathNode[] = [
    {
      level: 0,
      label: 'Confirmations',
      scope: { runId: scope.runId },
      href: '/confirmations-recon',
    },
  ];
  if (level >= 5) {
    nodes.push({
      level: 1,
      label: 'Trades',
      scope: { runId: scope.runId },
      href: buildConfirmationDrillUrl(`/confirmations-recon/${scope.runId}/trades`, { runId: scope.runId }),
    });
  }
  if (scope.stage && level >= 5) {
    nodes.push({
      level: 2,
      label: `Stage: ${scope.stage}`,
      scope: { stage: scope.stage },
      href: buildConfirmationDrillUrl(`/confirmations-recon/${scope.runId}/trades`, {
        runId: scope.runId,
        stage: scope.stage,
      }),
    });
  }
  if (scope.counterpartyName && level >= 5) {
    nodes.push({
      level: 3,
      label: scope.counterpartyName,
      scope: { counterpartyId: scope.counterpartyId },
      href: buildConfirmationDrillUrl(`/confirmations-recon/${scope.runId}/trades`, {
        runId: scope.runId,
        stage: scope.stage,
        counterpartyId: scope.counterpartyId,
        counterpartyName: scope.counterpartyName,
      }),
    });
  }
  return nodes;
}

export function confirmationScopeToHeader(scope: ConfirmationDrillScopeValue): DrillScope {
  const result: DrillScope = {
    runId: { label: 'Run', value: scope.runId.slice(0, 8) },
  };
  if (scope.stage) result.stage = { label: 'Stage', value: scope.stage, removable: true };
  if (scope.productCode) result.product = { label: 'Product', value: scope.productCode, removable: true };
  if (scope.counterpartyName)
    result.counterparty = { label: 'Counterparty', value: scope.counterpartyName, removable: true };
  if (scope.blockingSettlement)
    result.blocking = { label: 'Blocking', value: 'Yes', removable: true };
  return result;
}

export function useConfirmationDrillAudit(
  action: string,
  level: number,
  scope: ConfirmationDrillScopeValue,
  rowCount?: number,
) {
  const { logDrillEvent } = useDrillAudit();
  const path = useMemo(() => buildConfirmationPath(level, scope), [level, scope]);
  const sig = JSON.stringify(scope);

  useEffect(() => {
    logDrillEvent({
      module: 'confirmations_recon',
      action,
      drillPath: path.map((p) => ({ level: p.level, label: p.label, href: p.href })),
      scopeFilters: scope as unknown as Record<string, unknown>,
      targetLevel: level,
      rowCount,
    }).catch(() => {
      /* audit failures must not break navigation */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, level, sig]);
}

export function useNavigateWithConfirmationScope() {
  const navigate = useNavigate();
  return (path: string, scope: ConfirmationDrillScopeValue) => {
    navigate(buildConfirmationDrillUrl(path, scope));
  };
}
