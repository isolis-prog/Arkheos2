import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LogDrillEventInput {
  module: string;
  action: string;
  drillPath: Array<Record<string, unknown>>;
  scopeFilters?: Record<string, unknown>;
  targetLevel: number;
  rowCount?: number;
}

export interface DrillLevelLifecycleInput {
  module: string;
  level: number;
  drillPath: Array<Record<string, unknown>>;
  scopeFilters?: Record<string, unknown>;
  rowCount?: number;
  /** Re-fire push when this signature changes (e.g. JSON.stringify(scope)). */
  signature?: string;
}

export function useDrillAudit() {
  const logDrillEvent = useCallback(
    async ({ module, action, drillPath, scopeFilters, targetLevel, rowCount }: LogDrillEventInput) => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('Authentication required to log drill events');

      const { data: tenantId, error: tenantError } = await supabase.rpc('get_user_tenant_id', {
        _user_id: user.id,
      });
      if (tenantError) throw tenantError;
      if (!tenantId) throw new Error('Unable to resolve tenant context for drill audit');

      const { error } = await supabase.from('drill_audit_events').insert({
        tenant_id: tenantId,
        user_id: user.id,
        module,
        action,
        drill_path: drillPath as unknown as never,
        scope_filters: (scopeFilters ?? null) as unknown as never,
        target_level: targetLevel,
        row_count: rowCount ?? null,
      });

      if (error) throw error;
    },
    [],
  );

  /** Fired when the user enters a drill level. */
  const pushLevel = useCallback(
    (input: Omit<LogDrillEventInput, 'action' | 'targetLevel'> & { level: number }) =>
      logDrillEvent({
        module: input.module,
        action: 'push_level',
        drillPath: input.drillPath,
        scopeFilters: input.scopeFilters,
        targetLevel: input.level,
        rowCount: input.rowCount,
      }),
    [logDrillEvent],
  );

  /** Fired when the user leaves a drill level (unmount or navigate away). */
  const popToLevel = useCallback(
    (input: Omit<LogDrillEventInput, 'action' | 'targetLevel'> & { level: number }) =>
      logDrillEvent({
        module: input.module,
        action: 'pop_level',
        drillPath: input.drillPath,
        scopeFilters: input.scopeFilters,
        targetLevel: input.level,
        rowCount: input.rowCount,
      }),
    [logDrillEvent],
  );

  return { logDrillEvent, pushLevel, popToLevel };
}

/**
 * Module-scoped tracker of the currently-mounted drill level per module.
 * Used by `useDrillLevelLifecycle` to decide whether an unmount represents
 * a "leave / step back" (emit `pop_level`) or a "step deeper" (skip pop —
 * the next level's `push_level` already records the transition).
 *
 * Without this, navigating L3 → L4 emits a misleading `pop_level: 3` even
 * though the user moved deeper into the same drill stack.
 */
const activeDrillLevels = new Map<string, number>();

/**
 * Wires `pushLevel` on mount + `popToLevel` on unmount for a single drill page.
 * Re-pushes when `signature` changes so scope edits stay in the audit trail.
 *
 * Pop semantics:
 *  - Emits `pop_level` only when the unmounting page's level is >= the level
 *    that takes over (user navigated back up the breadcrumb, switched modules,
 *    or left the drill entirely).
 *  - Skips the pop when the next mounted level is deeper (L3 → L4): the new
 *    level's `push_level` already captures that transition, so emitting a pop
 *    for the leaving page would be misleading noise.
 *
 * Audit failures are swallowed — they must never break navigation.
 */
export function useDrillLevelLifecycle({
  module,
  level,
  drillPath,
  scopeFilters,
  rowCount,
  signature,
}: DrillLevelLifecycleInput) {
  const { pushLevel, popToLevel } = useDrillAudit();
  // Capture the latest snapshot so the unmount cleanup gets the final scope.
  const latest = useRef({ module, level, drillPath, scopeFilters, rowCount });
  latest.current = { module, level, drillPath, scopeFilters, rowCount };

  useEffect(() => {
    const mountedModule = module;
    const mountedLevel = level;
    activeDrillLevels.set(mountedModule, mountedLevel);

    pushLevel({
      module: latest.current.module,
      level: latest.current.level,
      drillPath: latest.current.drillPath,
      scopeFilters: latest.current.scopeFilters,
      rowCount: latest.current.rowCount,
    }).catch(() => {
      /* swallow */
    });

    return () => {
      const snapshot = latest.current;
      // Defer to the next microtask so the next page's mount (which sets a
      // new active level) runs first. We then know whether this unmount was a
      // "step deeper" (skip pop) or a "step back / leave" (emit pop for the
      // correct page).
      queueMicrotask(() => {
        const current = activeDrillLevels.get(mountedModule);

        // Step deeper into the same drill — the new push captures the move.
        if (current !== undefined && current > mountedLevel) return;

        // Top of the stack is leaving — clear so the next mount starts fresh.
        if (current === mountedLevel) {
          activeDrillLevels.delete(mountedModule);
        }

        popToLevel({
          module: snapshot.module,
          level: snapshot.level,
          drillPath: snapshot.drillPath,
          scopeFilters: snapshot.scopeFilters,
          rowCount: snapshot.rowCount,
        }).catch(() => {
          /* swallow */
        });
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, level, module]);
}
