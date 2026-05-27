import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { DrillPathNode, DrillScope } from '@/components/drill';
import { useDrillAudit } from '@/hooks/useDrillAudit';
import {
  CashflowDrillScopeZ,
  safeDecodeScope,
  safeEncodeScope,
} from '@/lib/drill/scopeSchema';

const DRILL_PARAM = 'd';

export interface CashflowDrillScopeValue {
  asOfDate: string;
  bucket?: string;
  legalEntityId?: string;
  legalEntityName?: string;
  counterpartyId?: string;
  counterpartyName?: string;
  flowDirection?: 'inflow' | 'outflow';
}

export function encodeCashflowScope(scope: CashflowDrillScopeValue) {
  return safeEncodeScope(scope as unknown as Record<string, unknown>, CashflowDrillScopeZ as any);
}

/** Returns null when the token is corrupt or fails schema validation. */
export function safeDecodeCashflowScope(token: string | null): CashflowDrillScopeValue | null {
  return safeDecodeScope(token, CashflowDrillScopeZ) as CashflowDrillScopeValue | null;
}

export function decodeCashflowScope(token: string | null): CashflowDrillScopeValue {
  const decoded = safeDecodeCashflowScope(token);
  if (!decoded) return { asOfDate: new Date().toISOString().slice(0, 10) };
  return decoded;
}

export function buildDrillUrl(path: string, scope: CashflowDrillScopeValue) {
  const params = new URLSearchParams();
  params.set(DRILL_PARAM, encodeCashflowScope(scope));
  return `${path}?${params.toString()}`;
}

export function useCashflowDrillScope(): {
  scope: CashflowDrillScopeValue;
  setScope: (next: CashflowDrillScopeValue) => void;
  removeKey: (key: keyof CashflowDrillScopeValue) => void;
  resetToBase: (base: CashflowDrillScopeValue) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawToken = searchParams.get(DRILL_PARAM);

  useEffect(() => {
    if (rawToken && safeDecodeCashflowScope(rawToken) === null) {
      toast.error('Invalid drill link, returning to base view');
      navigate('/cashflows', { replace: true });
    }
  }, [rawToken, navigate]);

  const scope = useMemo(() => decodeCashflowScope(rawToken), [rawToken]);

  const setScope = (next: CashflowDrillScopeValue) => {
    const params = new URLSearchParams(searchParams);
    params.set(DRILL_PARAM, encodeCashflowScope(next));
    setSearchParams(params, { replace: true });
  };

  const removeKey = (key: keyof CashflowDrillScopeValue) => {
    const next = { ...scope };
    delete next[key];
    setScope(next);
  };

  const resetToBase = (base: CashflowDrillScopeValue) => setScope(base);

  return { scope, setScope, removeKey, resetToBase };
}

export function buildCashflowPath(
  level: number,
  scope: CashflowDrillScopeValue,
): DrillPathNode[] {
  const nodes: DrillPathNode[] = [
    {
      level: 0,
      label: 'Cashflows',
      scope: { asOfDate: scope.asOfDate },
      href: '/cashflows',
    },
  ];
  if (level >= 2) {
    nodes.push({
      level: 1,
      label: 'Buckets',
      scope: { asOfDate: scope.asOfDate },
      href: buildDrillUrl('/cashflows/buckets', { asOfDate: scope.asOfDate }),
    });
  }
  if (level >= 3 && scope.bucket) {
    nodes.push({
      level: 2,
      label: `Bucket ${scope.bucket}`,
      scope: { bucket: scope.bucket },
      href: buildDrillUrl('/cashflows/buckets/by-entity', {
        asOfDate: scope.asOfDate,
        bucket: scope.bucket,
        flowDirection: scope.flowDirection,
      }),
    });
  }
  if (level >= 4 && scope.legalEntityId) {
    nodes.push({
      level: 3,
      label: scope.legalEntityName ?? 'Entity',
      scope: { legalEntityId: scope.legalEntityId },
      href: buildDrillUrl('/cashflows/buckets/by-counterparty', {
        asOfDate: scope.asOfDate,
        bucket: scope.bucket,
        legalEntityId: scope.legalEntityId,
        legalEntityName: scope.legalEntityName,
        flowDirection: scope.flowDirection,
      }),
    });
  }
  if (level >= 5 && scope.counterpartyId) {
    nodes.push({
      level: 4,
      label: scope.counterpartyName ?? 'Counterparty',
      scope: { counterpartyId: scope.counterpartyId },
      href: buildDrillUrl('/cashflows/documents', {
        asOfDate: scope.asOfDate,
        bucket: scope.bucket,
        legalEntityId: scope.legalEntityId,
        legalEntityName: scope.legalEntityName,
        counterpartyId: scope.counterpartyId,
        counterpartyName: scope.counterpartyName,
        flowDirection: scope.flowDirection,
      }),
    });
  }
  return nodes;
}

export function scopeToHeader(scope: CashflowDrillScopeValue): DrillScope {
  const result: DrillScope = {
    asOfDate: { label: 'As of', value: scope.asOfDate },
  };
  if (scope.bucket) result.bucket = { label: 'Bucket', value: scope.bucket, removable: true };
  if (scope.flowDirection)
    result.flowDirection = {
      label: 'Direction',
      value: scope.flowDirection,
      removable: true,
    };
  if (scope.legalEntityId)
    result.legalEntity = {
      label: 'Entity',
      value: scope.legalEntityName ?? scope.legalEntityId,
      removable: true,
    };
  if (scope.counterpartyId)
    result.counterparty = {
      label: 'Counterparty',
      value: scope.counterpartyName ?? scope.counterpartyId,
      removable: true,
    };
  return result;
}

/** Logs a drill_audit_event once per (level, scopeSignature) mount. */
export function useCashflowDrillAudit(action: string, level: number, scope: CashflowDrillScopeValue, rowCount?: number) {
  const { logDrillEvent } = useDrillAudit();
  const path = useMemo(() => buildCashflowPath(level, scope), [level, scope]);
  const sig = JSON.stringify(scope);

  useEffect(() => {
    logDrillEvent({
      module: 'cashflows',
      action,
      drillPath: path.map((p) => ({ level: p.level, label: p.label, href: p.href })),
      scopeFilters: scope as unknown as Record<string, unknown>,
      targetLevel: level,
      rowCount,
    }).catch(() => {
      // audit failures must not break navigation
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, level, sig]);
}

export function useNavigateWithScope() {
  const navigate = useNavigate();
  return (path: string, scope: CashflowDrillScopeValue) => {
    navigate(buildDrillUrl(path, scope));
  };
}
