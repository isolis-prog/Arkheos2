import { describe, it, expect } from 'vitest';
import {
  computeKpis,
  sortByUrgency,
  buildSourceUrl,
  type UnifiedBreakRow,
} from '@/hooks/inbox/useUnifiedBreaks';

const baseRow = (overrides: Partial<UnifiedBreakRow> = {}): UnifiedBreakRow => ({
  break_id: 'b1',
  tenant_id: 't1',
  module: 'reconciliations',
  deal_id: 'D1',
  legal_entity_id: null,
  counterparty_id: null,
  amount_delta_usd: 100,
  age_days: 1,
  severity: 'review',
  status: 'open',
  assigned_to: null,
  created_at: '2026-01-01T00:00:00Z',
  run_id: null,
  source_ref: null,
  ...overrides,
});

describe('useUnifiedBreaks utilities', () => {
  describe('computeKpis', () => {
    it('returns zeros for empty array', () => {
      const kpis = computeKpis([]);
      expect(kpis).toEqual({
        totalOpen: 0,
        totalUsdExposure: 0,
        oldestAgeDays: 0,
        slaBreaches: 0,
      });
    });

    it('counts total open breaks', () => {
      const kpis = computeKpis([baseRow(), baseRow({ break_id: 'b2' })]);
      expect(kpis.totalOpen).toBe(2);
    });

    it('sums amount_delta_usd', () => {
      const kpis = computeKpis([
        baseRow({ amount_delta_usd: 100 }),
        baseRow({ break_id: 'b2', amount_delta_usd: 250 }),
      ]);
      expect(kpis.totalUsdExposure).toBe(350);
    });

    it('handles null amount_delta_usd', () => {
      const kpis = computeKpis([baseRow({ amount_delta_usd: null as unknown as number })]);
      expect(kpis.totalUsdExposure).toBe(0);
    });

    it('finds oldest age', () => {
      const kpis = computeKpis([
        baseRow({ age_days: 3 }),
        baseRow({ break_id: 'b2', age_days: 12 }),
        baseRow({ break_id: 'b3', age_days: 7 }),
      ]);
      expect(kpis.oldestAgeDays).toBe(12);
    });

    it('counts SLA breaches over 5 days', () => {
      const kpis = computeKpis([
        baseRow({ age_days: 4 }),
        baseRow({ break_id: 'b2', age_days: 6 }),
        baseRow({ break_id: 'b3', age_days: 10 }),
      ]);
      expect(kpis.slaBreaches).toBe(2);
    });

    it('boundary: exactly 5 days is not a breach', () => {
      const kpis = computeKpis([baseRow({ age_days: 5 })]);
      expect(kpis.slaBreaches).toBe(0);
    });

    it('returns numeric values (not NaN) on string-like input', () => {
      const kpis = computeKpis([baseRow({ amount_delta_usd: '500' as unknown as number })]);
      expect(kpis.totalUsdExposure).toBe(500);
    });
  });

  describe('sortByUrgency', () => {
    it('returns empty for empty input', () => {
      expect(sortByUrgency([])).toEqual([]);
    });

    it('sorts critical before material before review', () => {
      const rows = [
        baseRow({ break_id: '1', severity: 'review' }),
        baseRow({ break_id: '2', severity: 'critical' }),
        baseRow({ break_id: '3', severity: 'material' }),
      ];
      const sorted = sortByUrgency(rows);
      expect(sorted.map((r) => r.severity)).toEqual(['critical', 'material', 'review']);
    });

    it('within same severity, older first', () => {
      const rows = [
        baseRow({ break_id: '1', severity: 'critical', age_days: 2 }),
        baseRow({ break_id: '2', severity: 'critical', age_days: 9 }),
      ];
      const sorted = sortByUrgency(rows);
      expect(sorted[0].break_id).toBe('2');
    });

    it('does not mutate the input array', () => {
      const rows = [baseRow({ severity: 'review' }), baseRow({ break_id: '2', severity: 'critical' })];
      const snapshot = [...rows];
      sortByUrgency(rows);
      expect(rows).toEqual(snapshot);
    });
  });

  describe('buildSourceUrl', () => {
    it('reconciliations with run_id', () => {
      expect(buildSourceUrl(baseRow({ module: 'reconciliations', run_id: 'r1' }))).toBe(
        '/reconciliations/r1',
      );
    });

    it('reconciliations without run_id', () => {
      expect(buildSourceUrl(baseRow({ module: 'reconciliations', run_id: null }))).toBe(
        '/reconciliations',
      );
    });

    it('cashflows always goes to buckets', () => {
      expect(buildSourceUrl(baseRow({ module: 'cashflows' }))).toBe('/cashflows/buckets');
    });

    it('valuation_recon with run_id', () => {
      expect(buildSourceUrl(baseRow({ module: 'valuation_recon', run_id: 'v1' }))).toBe(
        '/valuation-recon/runs/v1',
      );
    });

    it('valuation_recon without run_id', () => {
      expect(buildSourceUrl(baseRow({ module: 'valuation_recon', run_id: null }))).toBe(
        '/valuation-recon',
      );
    });

    it('confirmations_recon with run + deal', () => {
      expect(
        buildSourceUrl(
          baseRow({ module: 'confirmations_recon', run_id: 'cr1', deal_id: 'D9' }),
        ),
      ).toBe('/confirmations-recon/cr1/trades/D9');
    });

    it('confirmations_recon missing run falls back', () => {
      expect(
        buildSourceUrl(baseRow({ module: 'confirmations_recon', run_id: null, deal_id: 'D9' })),
      ).toBe('/confirmations-recon');
    });
  });
});
