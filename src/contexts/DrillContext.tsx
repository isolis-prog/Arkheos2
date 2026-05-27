import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { DrillPathNode } from '@/components/drill';

const DRILL_PARAM = 'd';

export interface DrillContextValue {
  module: string;
  path: DrillPathNode[];
  scope: Record<string, unknown>;
  pushLevel: (node: DrillPathNode) => void;
  popToLevel: (level: number) => void;
  setScope: (patch: Record<string, unknown>) => void;
  resetScope: () => void;
  toQueryString: () => string;
  fromQueryString: (qs: string) => Record<string, unknown>;
}

interface DrillProviderProps {
  children: ReactNode;
  module: string;
  path?: DrillPathNode[];
  scope?: Record<string, unknown>;
}

const DrillContext = createContext<DrillContextValue | null>(null);

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeScope(scope: Record<string, unknown>) {
  return encodeBase64Url(JSON.stringify(scope));
}

function decodeScope(encoded: string | null) {
  if (!encoded) {
    return {} satisfies Record<string, unknown>;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(encoded));
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {} satisfies Record<string, unknown>;
  }
}

function normalizeScope(scope: Record<string, unknown>) {
  return Object.entries(scope).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
}

function buildQueryString(scope: Record<string, unknown>) {
  const params = new URLSearchParams();
  const normalized = normalizeScope(scope);

  if (Object.keys(normalized).length > 0) {
    params.set(DRILL_PARAM, encodeScope(normalized));
  }

  const value = params.toString();
  return value ? `?${value}` : '';
}

function reconstructPath(pathname: string, providedPath: DrillPathNode[] | undefined, scope: Record<string, unknown>) {
  if (providedPath && providedPath.length > 0) {
    return providedPath;
  }

  const segments = pathname.split('/').filter(Boolean);
  const cumulative: string[] = [];

  return segments.map((segment, index) => {
    cumulative.push(segment);
    return {
      level: index,
      label: decodeURIComponent(segment).replace(/[-_]/g, ' '),
      scope,
      href: `/${cumulative.join('/')}`,
    } satisfies DrillPathNode;
  });
}

export function DrillProvider({ children, module, path: initialPath, scope: initialScope = {} }: DrillProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const storageKey = `drill:${module}`;
  const initialScopeRef = useRef(normalizeScope(initialScope));

  const readScopeFromSources = useCallback(() => {
    const params = new URLSearchParams(location.search);
    const fromUrl = decodeScope(params.get(DRILL_PARAM));

    if (Object.keys(fromUrl).length > 0) {
      return normalizeScope(fromUrl);
    }

    try {
      const fromSession = sessionStorage.getItem(storageKey);
      if (!fromSession) {
        return initialScopeRef.current;
      }

      const parsed = JSON.parse(fromSession);
      return parsed && typeof parsed === 'object' ? normalizeScope(parsed as Record<string, unknown>) : initialScopeRef.current;
    } catch {
      return initialScopeRef.current;
    }
  }, [location.search, storageKey]);

  const [scope, setScopeState] = useState<Record<string, unknown>>(() => readScopeFromSources());
  const [path, setPath] = useState<DrillPathNode[]>(() => reconstructPath(location.pathname, initialPath, readScopeFromSources()));

  const serializedScope = useMemo(() => JSON.stringify(normalizeScope(scope)), [scope]);

  useEffect(() => {
    const nextScope = readScopeFromSources();
    const nextSerialized = JSON.stringify(nextScope);

    if (nextSerialized !== serializedScope) {
      setScopeState(nextScope);
    }
  }, [readScopeFromSources, serializedScope]);

  useEffect(() => {
    setPath((current) => {
      const reconstructed = reconstructPath(location.pathname, current.length > 0 ? current : initialPath, scope);
      return reconstructed.map((node, index) => ({
        ...node,
        level: index,
        scope: index === reconstructed.length - 1 ? scope : node.scope,
      }));
    });
  }, [initialPath, location.pathname, scope]);

  useEffect(() => {
    const queryString = buildQueryString(scope);
    const nextSearch = queryString.startsWith('?') ? queryString.slice(1) : queryString;
    const currentSearch = location.search.startsWith('?') ? location.search.slice(1) : location.search;

    try {
      sessionStorage.setItem(storageKey, serializedScope);
    } catch {
      // Ignore storage write failures in restricted environments.
    }

    if (nextSearch !== currentSearch) {
      navigate({ pathname: location.pathname, search: queryString }, { replace: true });
    }
  }, [location.pathname, location.search, navigate, scope, serializedScope, storageKey]);

  const lastNavAtRef = useRef<number>(typeof performance !== 'undefined' ? performance.now() : Date.now());

  const emitDrillNav = useCallback(
    (action: 'pushLevel' | 'popToLevel', detail: Record<string, unknown>) => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const sinceLastMs = Math.round(now - lastNavAtRef.current);
      lastNavAtRef.current = now;

      const payload = {
        module,
        action,
        sinceLastMs,
        timestamp: new Date().toISOString(),
        ...detail,
      };

      // Lightweight trace — visible in dev tools, cheap in prod
      // eslint-disable-next-line no-console
      console.info('[drill:nav]', payload);

      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('drill:nav', { detail: payload }));
        } catch {
          // Ignore environments without CustomEvent support
        }
      }
    },
    [module],
  );

  const pushLevel = useCallback(
    (node: DrillPathNode) => {
      setPath((current) => {
        const next = [...current.filter((entry) => entry.level < node.level), node];
        return next.map((entry, index) => ({ ...entry, level: index }));
      });
      emitDrillNav('pushLevel', { toLevel: node.level, label: node.label, href: node.href });
    },
    [emitDrillNav],
  );

  const popToLevel = useCallback(
    (level: number) => {
      setPath((current) => current.filter((node) => node.level <= level).map((node, index) => ({ ...node, level: index })));
      emitDrillNav('popToLevel', { toLevel: level });
    },
    [emitDrillNav],
  );


  const setScope = useCallback((patch: Record<string, unknown>) => {
    setScopeState((current) => normalizeScope({ ...current, ...patch }));
  }, []);

  const resetScope = useCallback(() => {
    setScopeState(initialScopeRef.current);
  }, []);

  const toQueryString = useCallback(() => buildQueryString(scope), [scope]);

  const fromQueryString = useCallback((queryString: string) => {
    const parsed = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);
    const nextScope = normalizeScope(decodeScope(parsed.get(DRILL_PARAM)));
    setScopeState(nextScope);
    return nextScope;
  }, []);

  const value = useMemo<DrillContextValue>(
    () => ({
      module,
      path,
      scope,
      pushLevel,
      popToLevel,
      setScope,
      resetScope,
      toQueryString,
      fromQueryString,
    }),
    [fromQueryString, module, path, popToLevel, pushLevel, resetScope, scope, setScope, toQueryString],
  );

  return <DrillContext.Provider value={value}>{children}</DrillContext.Provider>;
}

export function useDrillContext() {
  const context = useContext(DrillContext);

  if (!context) {
    throw new Error('useDrillContext must be used within a DrillProvider');
  }

  return context;
}
