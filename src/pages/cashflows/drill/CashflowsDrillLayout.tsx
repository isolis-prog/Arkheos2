import { Outlet } from 'react-router-dom';
import { DrillProvider } from '@/contexts/DrillContext';

/**
 * Shared layout for all cashflow drill routes (L2 → L6).
 *
 * Wraps the bucket → entity → counterparty → document → trades pages in a
 * single `DrillProvider` instance so that:
 *  - the breadcrumb path is preserved across navigations,
 *  - the encoded scope token (`?d=…`) survives via URL + sessionStorage,
 *  - `drill:nav` audit events are emitted with consistent `module="cashflows"`.
 *
 * Pages continue to read/write the URL-scope through `useCashflowDrillScope`;
 * `DrillProvider` simply tracks the same `?d=` param and adds continuity.
 */
export default function CashflowsDrillLayout() {
  return (
    <DrillProvider module="cashflows">
      <Outlet />
    </DrillProvider>
  );
}
