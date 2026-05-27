import { describe, it, expect } from 'vitest';
import { isEmpty, EMPTY_RESULTS, type CrossModuleSearchData } from '@/hooks/inbox/useCrossModuleSearch';

describe('useCrossModuleSearch utilities', () => {
  describe('isEmpty', () => {
    it('returns true for undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('returns true for empty results', () => {
      expect(isEmpty(EMPTY_RESULTS)).toBe(true);
    });

    it('returns false when deals present', () => {
      const data: CrossModuleSearchData = {
        deals: [{ type: 'deal', id: 'D1', label: 'D1', modules: [], href: '/deal/D1' }],
        counterparties: [],
        invoices: [],
      };
      expect(isEmpty(data)).toBe(false);
    });

    it('returns false when counterparties present', () => {
      const data: CrossModuleSearchData = {
        deals: [],
        counterparties: [{ type: 'counterparty', id: 'C1', label: 'Acme', modules: [], href: '/x' }],
        invoices: [],
      };
      expect(isEmpty(data)).toBe(false);
    });

    it('returns false when invoices present', () => {
      const data: CrossModuleSearchData = {
        deals: [],
        counterparties: [],
        invoices: [{ type: 'invoice', id: 'I1', label: 'INV-1', modules: [], href: '/x' }],
      };
      expect(isEmpty(data)).toBe(false);
    });
  });

  describe('EMPTY_RESULTS shape', () => {
    it('has three empty arrays', () => {
      expect(EMPTY_RESULTS.deals).toEqual([]);
      expect(EMPTY_RESULTS.counterparties).toEqual([]);
      expect(EMPTY_RESULTS.invoices).toEqual([]);
    });
  });
});
