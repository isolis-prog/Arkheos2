# Drill MODULE_REGISTRY

ArkheOS exposes a unified break / drill experience across four modules today:
**Reconciliations, Cashflows, Valuation Recon, Confirmations Recon**. To keep
the UI, navigation, exports and audit trail consistent, every module is wired
through a small `MODULE_REGISTRY` on both the front-end and the back-end.

This doc is the contract — read it before adding a fifth module.

---

## Where the registries live

| Layer | File | Responsibility |
|---|---|---|
| Front-end | `src/lib/drill/module-registry.ts` | Labels, short labels, badge colours, base routes, `buildSourceUrl(row)` |
| Front-end | `src/components/inbox/ModulePill.tsx` | Renders the pill — reads from the registry |
| Front-end | `src/hooks/inbox/useUnifiedBreaks.ts` | `UnifiedBreakModule` type union; `buildSourceUrl` delegates to the registry |
| Front-end | `src/contexts/DrillContext.tsx` | Generic drill stack — module-agnostic, takes `module` as a string |
| Back-end | `supabase/functions/export-module-scope/index.ts` | `MODULE_REGISTRY` dispatcher: `authorise(scope)` + `build(input)` per module |
| SQL | `v_unified_breaks` view | Unions the per-module break sources; `module` column must equal the registry key |
| Tests | `src/lib/drill/__tests__/module-registry-parity.test.ts` | Parity test — every registered module must have a label and a unique source URL |

---

## Adding a fifth module — checklist

1. **SQL view.** Extend `v_unified_breaks` with a `UNION ALL` branch that emits
   the new `module` literal (must match the registry key exactly, e.g.
   `'positions_recon'`). Apply via a migration.
2. **Type union.** Add the new key to `UnifiedBreakModule` in
   `src/hooks/inbox/useUnifiedBreaks.ts`.
3. **Front-end registry.** Add a new entry to `MODULE_REGISTRY` in
   `src/lib/drill/module-registry.ts` with:
   - `key`, `label`, `shortLabel`
   - `badgeClassName` — semantic Tailwind tokens only (no raw colours)
   - `basePath`
   - `buildSourceUrl(row)` returning the deepest meaningful drill URL
4. **Parity test.** Bump the registered count in
   `src/lib/drill/__tests__/module-registry-parity.test.ts` and add the new
   key to `REGISTERED_MODULES`. Tests will fail loudly if the label or URL is
   missing.
5. **Back-end dispatcher.** In
   `supabase/functions/export-module-scope/index.ts`:
   - Add a Zod scope schema (`XxxScope`) and extend the `module` enum on
     `InputSchema`.
   - Implement `authoriseXxx(...)` and `buildXxxExport(...)` mirroring the
     existing handlers.
   - Add an entry to `MODULE_REGISTRY` mapping the key to those handlers.
6. **Drill scope helper.** Create
   `src/pages/<module>/drill/_drillScope.ts` mirroring the existing scope
   encoders/breadcrumb builders so URL state survives navigation.
7. **Routes.** Register the new module's drill routes in `App.tsx` under the
   appropriate layout (`<DrillProvider module="<key>">`).
8. **Audit.** No code change needed — `useDrillAudit` already accepts arbitrary
   `module` strings; the value is logged into `drill_audit_events.module`.

After step 8, the new module participates in the global Inbox, command-palette
search, deal-lens activity feed, exports, and audit trail with no further
plumbing.

---

## Why a registry, not switch statements?

Before the registry, every new module required edits in 6+ files with
`switch (module)` cases scattered across hooks, components, and the edge
function. A missed branch silently fell through to `/dashboard` (front-end) or
`400 Invalid input` (back-end). The registry collapses that to a single object
literal per layer and a parity test that fails CI if the layers drift.

---

## Invariants enforced by tests

`src/lib/drill/__tests__/module-registry-parity.test.ts` guarantees:

- Exactly N modules are registered (currently 4).
- Every registered module has a non-empty label.
- Every registered module's `buildSourceUrl` returns a non-empty path
  starting with `/`.
- All module URLs are unique for the same payload (no two modules
  silently route to the same place).
