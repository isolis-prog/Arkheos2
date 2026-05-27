/**
 * Front-end MODULE_REGISTRY — the single source of truth for every drill-enabled
 * module. Labels, colours, base routes and the `buildSourceUrl` resolver all
 * live here so adding a new module is a one-file change (plus the SQL view +
 * `UnifiedBreakModule` type union).
 *
 * Mirrors the backend MODULE_REGISTRY in
 * `supabase/functions/export-module-scope/index.ts` — see
 * `docs/drill-module-registry.md` for the full contract and the steps to add a
 * fifth module.
 */
import type { UnifiedBreakModule, UnifiedBreakRow } from '@/hooks/inbox/useUnifiedBreaks';

export interface ModuleRegistryEntry {
  /** Internal id — must match `v_unified_breaks.module` and the type union. */
  key: UnifiedBreakModule;
  /** Long human label (e.g. "Reconciliations"). */
  label: string;
  /** Short human label for compact pills (e.g. "Recon"). */
  shortLabel: string;
  /** Tailwind classes for the ModulePill badge. Use semantic tokens only. */
  badgeClassName: string;
  /** Top-level landing route for the module. */
  basePath: string;
  /** Resolves the per-row drill URL for a unified break. */
  buildSourceUrl: (row: UnifiedBreakRow) => string;
}

export const MODULE_REGISTRY: Record<UnifiedBreakModule, ModuleRegistryEntry> = {
  reconciliations: {
    key: 'reconciliations',
    label: 'Reconciliations',
    shortLabel: 'Recon',
    badgeClassName: 'bg-primary/15 text-primary border-primary/30',
    basePath: '/reconciliations',
    buildSourceUrl: (row) =>
      row.run_id ? `/reconciliations/${row.run_id}` : '/reconciliations',
  },
  cashflows: {
    key: 'cashflows',
    label: 'Cashflows',
    shortLabel: 'Cash',
    badgeClassName: 'bg-success/15 text-success border-success/30',
    basePath: '/cashflows',
    buildSourceUrl: () => '/cashflows/buckets',
  },
  valuation_recon: {
    key: 'valuation_recon',
    label: 'Valuation',
    shortLabel: 'Val',
    badgeClassName: 'bg-accent/15 text-accent-foreground border-accent/30',
    basePath: '/valuation-recon',
    buildSourceUrl: (row) =>
      row.run_id ? `/valuation-recon/runs/${row.run_id}` : '/valuation-recon',
  },
  confirmations_recon: {
    key: 'confirmations_recon',
    label: 'Confirmations',
    shortLabel: 'Conf',
    badgeClassName: 'bg-warning/15 text-warning border-warning/30',
    basePath: '/confirmations-recon',
    buildSourceUrl: (row) =>
      row.run_id && row.deal_id
        ? `/confirmations-recon/${row.run_id}/trades/${row.deal_id}`
        : '/confirmations-recon',
  },
};

export const REGISTERED_MODULES = Object.keys(MODULE_REGISTRY) as UnifiedBreakModule[];

export function getModuleEntry(module: UnifiedBreakModule): ModuleRegistryEntry {
  return MODULE_REGISTRY[module];
}

export function moduleLabel(module: UnifiedBreakModule): string {
  return MODULE_REGISTRY[module]?.label ?? module;
}

export function moduleShortLabel(module: UnifiedBreakModule): string {
  return MODULE_REGISTRY[module]?.shortLabel ?? module;
}

export function moduleBadgeClassName(module: UnifiedBreakModule): string {
  return MODULE_REGISTRY[module]?.badgeClassName ?? '';
}

export function buildModuleSourceUrl(row: UnifiedBreakRow): string {
  return MODULE_REGISTRY[row.module]?.buildSourceUrl(row) ?? '/dashboard';
}
