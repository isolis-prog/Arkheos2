import { useState, useMemo } from 'react';

export interface IntercompanyPair {
  id: string;
  entityA: string;
  entityB: string;
  pairType: 'invoice' | 'cash' | 'trade_mirror';
  refA: string;
  refB: string | null;
  amountA: number;
  amountB: number | null;
  currencyA: string;
  currencyB: string | null;
  fxDelta: number | null;
  delta: number | null;
  matchStatus: 'unmatched' | 'matched' | 'partial' | 'break';
  periodName: string;
  postingDate: string | null;
}

export interface NettingCycle {
  id: string;
  cycleName: string;
  periodName: string;
  cycleDate: string;
  status: 'draft' | 'proposed' | 'approved' | 'settled';
  totalGross: number;
  totalNet: number;
  savingsPct: number | null;
  pairCount: number;
  currency: string;
  proposedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  settledAt: string | null;
}

export interface EliminationJournal {
  id: string;
  journalRef: string;
  periodName: string;
  entityA: string;
  entityB: string;
  accountCode: string;
  accountName: string | null;
  debitAmount: number;
  creditAmount: number;
  currency: string;
  fxRate: number | null;
  baseAmount: number | null;
  status: 'draft' | 'posted' | 'reversed';
  postedBy: string | null;
}

const entities = ['Corp US', 'Corp UK', 'Corp SG', 'Corp CH'];
const pairTypes: IntercompanyPair['pairType'][] = ['invoice', 'cash', 'trade_mirror'];

const demoPairs: IntercompanyPair[] = [];
let idx = 0;
for (let i = 0; i < entities.length; i++) {
  for (let j = i + 1; j < entities.length; j++) {
    for (const pt of pairTypes) {
      const count = Math.floor(Math.random() * 3) + 1;
      for (let k = 0; k < count; k++) {
        const amtA = Math.round((Math.random() * 2000000 + 100000) * 100) / 100;
        const roll = Math.random();
        const matched = roll > 0.3;
        const isBreak = !matched && roll < 0.15;
        const fxD = pt !== 'cash' && Math.random() > 0.6 ? Math.round(Math.random() * 5000 * 100) / 100 : null;
        const amtB = matched ? amtA + (fxD || 0) : isBreak ? null : amtA * (0.9 + Math.random() * 0.08);
        demoPairs.push({
          id: `ic-${idx++}`,
          entityA: entities[i],
          entityB: entities[j],
          pairType: pt,
          refA: `IC-${entities[i].split(' ')[1]}-${String(1000 + idx).slice(1)}`,
          refB: matched || !isBreak ? `IC-${entities[j].split(' ')[1]}-${String(2000 + idx).slice(1)}` : null,
          amountA: amtA,
          amountB: amtB != null ? Math.round(amtB * 100) / 100 : null,
          currencyA: 'USD',
          currencyB: fxD ? 'EUR' : 'USD',
          fxDelta: fxD,
          delta: amtB != null ? Math.round((amtA - amtB) * 100) / 100 : amtA,
          matchStatus: matched ? 'matched' : isBreak ? 'break' : 'partial',
          periodName: 'Feb-2026',
          postingDate: '2026-02-20',
        });
      }
    }
  }
}

const demoCycles: NettingCycle[] = [
  { id: 'nc-1', cycleName: 'Feb-2026 Monthly', periodName: 'Feb-2026', cycleDate: '2026-02-28', status: 'proposed', totalGross: 12500000, totalNet: 3200000, savingsPct: 74.4, pairCount: demoPairs.filter(p => p.matchStatus === 'matched').length, currency: 'USD', proposedBy: 'System', approvedBy: null, approvedAt: null, settledAt: null },
  { id: 'nc-2', cycleName: 'Jan-2026 Monthly', periodName: 'Jan-2026', cycleDate: '2026-01-31', status: 'settled', totalGross: 11800000, totalNet: 2900000, savingsPct: 75.4, pairCount: 18, currency: 'USD', proposedBy: 'System', approvedBy: 'M. Chen', approvedAt: '2026-01-30', settledAt: '2026-01-31' },
  { id: 'nc-3', cycleName: 'Dec-2025 Monthly', periodName: 'Dec-2025', cycleDate: '2025-12-31', status: 'settled', totalGross: 14200000, totalNet: 3800000, savingsPct: 73.2, pairCount: 22, currency: 'USD', proposedBy: 'System', approvedBy: 'R. Singh', approvedAt: '2025-12-30', settledAt: '2025-12-31' },
];

const demoEliminations: EliminationJournal[] = [
  { id: 'ej-1', journalRef: 'ELIM-2026-02-001', periodName: 'Feb-2026', entityA: 'Corp US', entityB: 'Corp UK', accountCode: '3100', accountName: 'IC Receivable', debitAmount: 0, creditAmount: 1500000, currency: 'USD', fxRate: 1.27, baseAmount: 1500000, status: 'draft', postedBy: null },
  { id: 'ej-2', journalRef: 'ELIM-2026-02-001', periodName: 'Feb-2026', entityA: 'Corp UK', entityB: 'Corp US', accountCode: '4100', accountName: 'IC Payable', debitAmount: 1500000, creditAmount: 0, currency: 'USD', fxRate: 1.27, baseAmount: 1500000, status: 'draft', postedBy: null },
  { id: 'ej-3', journalRef: 'ELIM-2026-02-002', periodName: 'Feb-2026', entityA: 'Corp US', entityB: 'Corp SG', accountCode: '3100', accountName: 'IC Receivable', debitAmount: 0, creditAmount: 850000, currency: 'USD', fxRate: null, baseAmount: 850000, status: 'draft', postedBy: null },
  { id: 'ej-4', journalRef: 'ELIM-2026-02-002', periodName: 'Feb-2026', entityA: 'Corp SG', entityB: 'Corp US', accountCode: '4100', accountName: 'IC Payable', debitAmount: 850000, creditAmount: 0, currency: 'USD', fxRate: null, baseAmount: 850000, status: 'draft', postedBy: null },
  { id: 'ej-5', journalRef: 'ELIM-2026-01-001', periodName: 'Jan-2026', entityA: 'Corp US', entityB: 'Corp CH', accountCode: '3100', accountName: 'IC Receivable', debitAmount: 0, creditAmount: 2100000, currency: 'USD', fxRate: 0.88, baseAmount: 2100000, status: 'posted', postedBy: 'M. Chen' },
  { id: 'ej-6', journalRef: 'ELIM-2026-01-001', periodName: 'Jan-2026', entityA: 'Corp CH', entityB: 'Corp US', accountCode: '4100', accountName: 'IC Payable', debitAmount: 2100000, creditAmount: 0, currency: 'USD', fxRate: 0.88, baseAmount: 2100000, status: 'posted', postedBy: 'M. Chen' },
];

export function useIntercompany() {
  const [pairTypeFilter, setPairTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPairs = useMemo(() => {
    return demoPairs.filter(p => {
      if (pairTypeFilter !== 'all' && p.pairType !== pairTypeFilter) return false;
      if (statusFilter !== 'all' && p.matchStatus !== statusFilter) return false;
      if (searchQuery && !p.refA.toLowerCase().includes(searchQuery.toLowerCase()) && !p.entityA.toLowerCase().includes(searchQuery.toLowerCase()) && !p.entityB.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [pairTypeFilter, statusFilter, searchQuery]);

  const totalPairs = demoPairs.length;
  const matchedPairs = demoPairs.filter(p => p.matchStatus === 'matched').length;
  const breakPairs = demoPairs.filter(p => p.matchStatus === 'break' || p.matchStatus === 'partial').length;
  const totalDelta = demoPairs.reduce((s, p) => s + Math.abs(p.delta || 0), 0);
  const totalFxDelta = demoPairs.reduce((s, p) => s + Math.abs(p.fxDelta || 0), 0);
  const matchRate = Math.round((matchedPairs / totalPairs) * 1000) / 10;
  const latestCycle = demoCycles[0];
  const nettingSavings = latestCycle?.savingsPct || 0;

  return {
    pairs: filteredPairs,
    cycles: demoCycles,
    eliminations: demoEliminations,
    pairTypeFilter, setPairTypeFilter,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    kpis: { totalPairs, matchedPairs, breakPairs, totalDelta, totalFxDelta, matchRate, nettingSavings },
    loading: false,
  };
}
