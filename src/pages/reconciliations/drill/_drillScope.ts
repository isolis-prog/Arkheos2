import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { DrillPathNode, DrillScope } from '@/components/drill';
import { useDrillAudit, useDrillLevelLifecycle } from '@/hooks/useDrillAudit';
import {
  ReconDrillScopeZ,
  safeDecodeScope,
  safeEncodeScope,
  encodeBase64UrlJson,
} from '@/lib/drill/scopeSchema';

const DRILL_PARAM = 'd';

/**
 * Reconciliations drill scope (L2–L6). All drill pages share the same
 * encoded `?d=...` token so navigating up/down preserves filters.
 */
export interface ReconDrillScopeValue {
  runId: string;
  breakCategory?: string;
  legalEntityId?: string;
  legalEntityName?: string;
  counterpartyId?: string;
  counterpartyName?: string;
  docId?: string;
  docType?: string;
}

export function encodeReconScope(scope: ReconDrillScopeValue) {
  return safeEncodeScope(scope as unknown as Record<string, unknown>, ReconDrillScopeZ as any);
}

/** Returns null when the token is corrupt or fails schema validation. */
export function safeDecodeReconScope(token: string | null): ReconDrillScopeValue | null {
  return safeDecodeScope(token, ReconDrillScopeZ) as ReconDrillScopeValue | null;
}

/**
 * Backwards-compatible decoder. Falls back to a minimal scope when the
 * token is missing/invalid so existing callers keep rendering. Use
 * `safeDecodeReconScope` when you need to detect tampering.
 */
export function decodeReconScope(token: string | null, fallbackRunId = ''): ReconDrillScopeValue {
  const decoded = safeDecodeReconScope(token);
  if (!decoded) return { runId: fallbackRunId };
  return { ...decoded, runId: decoded.runId || fallbackRunId };
}

export function buildReconDrillUrl(path: string, scope: ReconDrillScopeValue) {
  const params = new URLSearchParams();
  params.set(DRILL_PARAM, encodeReconScope(scope));
  return `${path}?${params.toString()}`;
}

export function useReconDrillScope(): {
  scope: ReconDrillScopeValue;
  setScope: (next: ReconDrillScopeValue) => void;
  removeKey: (key: keyof ReconDrillScopeValue) => void;
} {
  const { runId = '' } = useParams<{ runId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawToken = searchParams.get(DRILL_PARAM);

  // Detect tampered/expired token: present but unparseable.
  useEffect(() => {
    if (rawToken && safeDecodeReconScope(rawToken) === null) {
      toast.error('Invalid drill link, returning to base view');
      navigate('/reconciliations', { replace: true });
    }
  }, [rawToken, navigate]);

  const scope = useMemo(
    () => decodeReconScope(rawToken, runId),
    [rawToken, runId],
  );

  const setScope = (next: ReconDrillScopeValue) => {
    const params = new URLSearchParams(searchParams);
    params.set(DRILL_PARAM, encodeReconScope({ ...next, runId: next.runId || runId }));
    setSearchParams(params, { replace: true });
  };

  const removeKey = (key: keyof ReconDrillScopeValue) => {
    if (key === 'runId') return;
    const next = { ...scope };
    delete next[key];
    setScope(next);
  };

  return { scope, setScope, removeKey };
}

// Suppress unused-import warning for legacy helper kept for parity
void encodeBase64UrlJson;

export function buildReconPath(level: number, scope: ReconDrillScopeValue): DrillPathNode[] {
  const nodes: DrillPathNode[] = [
    {
      level: 0,
      label: 'Reconciliations',
      scope: {},
      href: '/reconciliations',
    },
    {
      level: 1,
      label: `Run ${scope.runId.slice(0, 8)}`,
      scope: { runId: scope.runId },
      href: `/reconciliations/${scope.runId}`,
    },
  ];

  if (level >= 2) {
    nodes.push({
      level: 2,
      label: 'Break types',
      scope: { runId: scope.runId },
      href: buildReconDrillUrl(`/reconciliations/${scope.runId}/drill/by-type`, { runId: scope.runId }),
    });
  }

  if (level >= 3 && scope.breakCategory) {
    nodes.push({
      level: 3,
      label: `Type: ${scope.breakCategory}`,
      scope: { breakCategory: scope.breakCategory },
      href: buildReconDrillUrl(`/reconciliations/${scope.runId}/drill/by-entity`, {
        runId: scope.runId,
        breakCategory: scope.breakCategory,
      }),
    });
  }

  if (level >= 4 && scope.legalEntityId) {
    nodes.push({
      level: 4,
      label: scope.legalEntityName ?? 'Entity',
      scope: { legalEntityId: scope.legalEntityId },
      href: buildReconDrillUrl(`/reconciliations/${scope.runId}/drill/by-counterparty`, {
        runId: scope.runId,
        breakCategory: scope.breakCategory,
        legalEntityId: scope.legalEntityId,
        legalEntityName: scope.legalEntityName,
      }),
    });
  }

  if (level >= 5 && scope.counterpartyId) {
    nodes.push({
      level: 5,
      label: scope.counterpartyName ?? 'Counterparty',
      scope: { counterpartyId: scope.counterpartyId },
      href: buildReconDrillUrl(`/reconciliations/${scope.runId}/drill/documents`, {
        runId: scope.runId,
        breakCategory: scope.breakCategory,
        legalEntityId: scope.legalEntityId,
        legalEntityName: scope.legalEntityName,
        counterpartyId: scope.counterpartyId,
        counterpartyName: scope.counterpartyName,
      }),
    });
  }

  if (level >= 6 && scope.docId) {
    nodes.push({
      level: 6,
      label: scope.docId,
      scope: { docId: scope.docId },
      href: buildReconDrillUrl(`/reconciliations/${scope.runId}/drill/documents/${scope.docId}`, scope),
    });
  }

  return nodes;
}

export function reconScopeToHeader(scope: ReconDrillScopeValue): DrillScope {
  const result: DrillScope = {
    runId: { label: 'Run', value: scope.runId.slice(0, 8) },
  };
  if (scope.breakCategory)
    result.breakCategory = { label: 'Type', value: scope.breakCategory, removable: true };
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
  if (scope.docId)
    result.document = { label: 'Document', value: scope.docId, removable: true };
  return result;
}

export function useReconDrillAudit(
  action: string,
  level: number,
  scope: ReconDrillScopeValue,
  rowCount?: number,
) {
  const { logDrillEvent } = useDrillAudit();
  const path = useMemo(() => buildReconPath(level, scope), [level, scope]);
  const drillPath = useMemo(
    () => path.map((p) => ({ level: p.level, label: p.label, href: p.href })),
    [path],
  );
  const sig = JSON.stringify(scope);

  // Generic action log (e.g. 'view') — preserves existing behaviour.
  useEffect(() => {
    logDrillEvent({
      module: 'reconciliations',
      action,
      drillPath,
      scopeFilters: scope as unknown as Record<string, unknown>,
      targetLevel: level,
      rowCount,
    }).catch(() => {
      /* audit failures must not break navigation */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, level, sig]);

  // Push on mount / pop on unmount for the drill stack.
  useDrillLevelLifecycle({
    module: 'reconciliations',
    level,
    drillPath,
    scopeFilters: scope as unknown as Record<string, unknown>,
    rowCount,
    signature: sig,
  });
}

export function useNavigateWithReconScope() {
  const navigate = useNavigate();
  return (path: string, scope: ReconDrillScopeValue) => {
    navigate(buildReconDrillUrl(path, scope));
  };
}
