import { describe, it, expect } from 'vitest';

/**
 * Module registry parity test.
 *
 * Until the formal MODULE_REGISTRY refactor (Step 5) lands, this test
 * codifies the contract between the four drill-enabled modules and the
 * unified breaks plumbing (v_unified_breaks, sort/url helpers, badges).
 *
 * If a fifth module is added, the constants below must be expanded
 * in lockstep with the SQL view, the UnifiedBreakModule type, the
 * ModulePill labels, and buildSourceUrl.
 */

import type { UnifiedBreakModule } from '@/hooks/inbox/useUnifiedBreaks';
import { buildSourceUrl } from '@/hooks/inbox/useUnifiedBreaks';
import { moduleLabel } from '@/components/inbox/ModulePill';

const REGISTERED_MODULES: UnifiedBreakModule[] = [
  'reconciliations',
  'cashflows',
  'valuation_recon',
  'confirmations_recon',
];

describe('Module registry parity', () => {
  it('has exactly 4 registered modules', () => {
    expect(REGISTERED_MODULES.length).toBe(4);
  });

  it.each(REGISTERED_MODULES)('module %s has a non-empty label', (m) => {
    expect(moduleLabel(m).length).toBeGreaterThan(0);
  });

  it.each(REGISTERED_MODULES)('module %s buildSourceUrl returns a non-empty path', (m) => {
    const url = buildSourceUrl({
      break_id: 'b',
      tenant_id: 't',
      module: m,
      deal_id: 'D',
      legal_entity_id: null,
      counterparty_id: null,
      amount_delta_usd: 0,
      age_days: 0,
      severity: 'review',
      status: 'open',
      assigned_to: null,
      created_at: new Date().toISOString(),
      run_id: 'r1',
      source_ref: null,
    });
    expect(url.startsWith('/')).toBe(true);
    expect(url.length).toBeGreaterThan(1);
  });

  it('all module urls are unique for the same payload', () => {
    const urls = REGISTERED_MODULES.map((m) =>
      buildSourceUrl({
        break_id: 'b',
        tenant_id: 't',
        module: m,
        deal_id: 'D',
        legal_entity_id: null,
        counterparty_id: null,
        amount_delta_usd: 0,
        age_days: 0,
        severity: 'review',
        status: 'open',
        assigned_to: null,
        created_at: new Date().toISOString(),
        run_id: 'r1',
        source_ref: null,
      }),
    );
    expect(new Set(urls).size).toBe(REGISTERED_MODULES.length);
  });
});
