import { useState, useMemo } from 'react';

export interface PostingExpectationTemplate {
  id: string;
  tradeType: string;
  eventType: string;
  accountCode: string;
  accountName: string;
  debitCredit: 'debit' | 'credit';
  amountExpression: string;
  isActive: boolean;
}

export interface PostingExpectation {
  id: string;
  dealId: string;
  dealType: string;
  eventType: string;
  legalEntity: string;
  accountCode: string;
  accountName: string;
  expectedAmount: number;
  actualAmount: number | null;
  delta: number | null;
  currency: string;
  periodName: string;
  postingDate: string | null;
  cutoffDate: string | null;
  cutoffTimezone: string;
  status: 'pending' | 'matched' | 'partial' | 'missing' | 'exception';
  glReference: string | null;
}

export interface PostingRecon {
  id: string;
  periodName: string;
  legalEntity: string;
  accountCode: string;
  totalExpected: number;
  totalActual: number;
  delta: number;
  expectedCount: number;
  matchedCount: number;
  missingCount: number;
  exceptionCount: number;
  completenessPct: number;
  status: 'open' | 'complete' | 'exception';
  reviewedBy: string | null;
}

const templates: PostingExpectationTemplate[] = [
  { id: 't1', tradeType: 'Physical', eventType: 'Trade Capture', accountCode: '4100', accountName: 'Revenue – Physical Sales', debitCredit: 'credit', amountExpression: 'deal_amount', isActive: true },
  { id: 't2', tradeType: 'Physical', eventType: 'Trade Capture', accountCode: '5100', accountName: 'COGS – Physical', debitCredit: 'debit', amountExpression: 'deal_amount', isActive: true },
  { id: 't3', tradeType: 'Physical', eventType: 'Delivery', accountCode: '1300', accountName: 'AR – Trade Receivables', debitCredit: 'debit', amountExpression: 'invoice_amount', isActive: true },
  { id: 't4', tradeType: 'Derivative', eventType: 'MTM Valuation', accountCode: '6200', accountName: 'Unrealised Gain/Loss', debitCredit: 'debit', amountExpression: 'mtm_delta', isActive: true },
  { id: 't5', tradeType: 'Physical', eventType: 'Fee Accrual', accountCode: '5300', accountName: 'Freight & Logistics', debitCredit: 'debit', amountExpression: 'fee_amount', isActive: true },
  { id: 't6', tradeType: 'Derivative', eventType: 'Settlement', accountCode: '6100', accountName: 'Realised Gain/Loss', debitCredit: 'credit', amountExpression: 'settlement_amount', isActive: true },
];

const entities = ['Corp US', 'Corp UK', 'Corp SG', 'Corp CH'];
const accounts = ['4100', '5100', '1300', '6200', '5300', '6100'];

const demoExpectations: PostingExpectation[] = [];
let idx = 0;
for (const entity of entities) {
  for (const acct of accounts) {
    const tmpl = templates.find(t => t.accountCode === acct)!;
    const count = Math.floor(Math.random() * 8) + 3;
    for (let i = 0; i < count; i++) {
      const expected = Math.round((Math.random() * 500000 + 50000) * 100) / 100;
      const matchRoll = Math.random();
      const status: PostingExpectation['status'] = matchRoll > 0.85 ? 'missing' : matchRoll > 0.75 ? 'partial' : matchRoll > 0.7 ? 'exception' : 'matched';
      const actual = status === 'matched' ? expected : status === 'missing' ? null : expected * (0.8 + Math.random() * 0.15);
      demoExpectations.push({
        id: `pe-${idx++}`,
        dealId: `DL-2026-${String(1000 + idx).slice(1)}`,
        dealType: tmpl.tradeType,
        eventType: tmpl.eventType,
        legalEntity: entity,
        accountCode: acct,
        accountName: tmpl.accountName || '',
        expectedAmount: expected,
        actualAmount: actual,
        delta: actual != null ? Math.round((expected - actual) * 100) / 100 : expected,
        currency: 'USD',
        periodName: 'Feb-2026',
        postingDate: status !== 'missing' ? '2026-02-20' : null,
        cutoffDate: '2026-02-28',
        cutoffTimezone: 'UTC',
        status,
        glReference: status === 'matched' ? `GL-${Math.random().toString(36).slice(2, 8).toUpperCase()}` : null,
      });
    }
  }
}

const buildRecons = (): PostingRecon[] => {
  const groups = new Map<string, PostingExpectation[]>();
  demoExpectations.forEach(e => {
    const key = `${e.legalEntity}|${e.accountCode}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  });
  return Array.from(groups.entries()).map(([key, items], i) => {
    const [entity, acct] = key.split('|');
    const matched = items.filter(e => e.status === 'matched').length;
    const missing = items.filter(e => e.status === 'missing').length;
    const exception = items.filter(e => e.status === 'exception' || e.status === 'partial').length;
    const totalExp = items.reduce((s, e) => s + e.expectedAmount, 0);
    const totalAct = items.reduce((s, e) => s + (e.actualAmount || 0), 0);
    const pct = Math.round((matched / items.length) * 1000) / 10;
    return {
      id: `pr-${i}`,
      periodName: 'Feb-2026',
      legalEntity: entity,
      accountCode: acct,
      totalExpected: Math.round(totalExp),
      totalActual: Math.round(totalAct),
      delta: Math.round(totalExp - totalAct),
      expectedCount: items.length,
      matchedCount: matched,
      missingCount: missing,
      exceptionCount: exception,
      completenessPct: pct,
      status: pct === 100 ? 'complete' : exception > 0 ? 'exception' : 'open',
      reviewedBy: pct === 100 ? 'Auto' : null,
    };
  });
};

const demoRecons = buildRecons();

export function useDealToGL() {
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExpectations = useMemo(() => {
    return demoExpectations.filter(e => {
      if (entityFilter !== 'all' && e.legalEntity !== entityFilter) return false;
      if (accountFilter !== 'all' && e.accountCode !== accountFilter) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (searchQuery && !e.dealId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [entityFilter, accountFilter, statusFilter, searchQuery]);

  const filteredRecons = useMemo(() => {
    return demoRecons.filter(r => {
      if (entityFilter !== 'all' && r.legalEntity !== entityFilter) return false;
      if (accountFilter !== 'all' && r.accountCode !== accountFilter) return false;
      return true;
    });
  }, [entityFilter, accountFilter]);

  const totalExpected = demoExpectations.length;
  const totalMatched = demoExpectations.filter(e => e.status === 'matched').length;
  const totalMissing = demoExpectations.filter(e => e.status === 'missing').length;
  const totalExceptions = demoExpectations.filter(e => e.status === 'exception' || e.status === 'partial').length;
  const completenessPct = Math.round((totalMatched / totalExpected) * 1000) / 10;
  const missingAmount = demoExpectations.filter(e => e.status === 'missing').reduce((s, e) => s + e.expectedAmount, 0);
  const deltaAmount = demoExpectations.reduce((s, e) => s + Math.abs(e.delta || 0), 0);

  return {
    templates,
    expectations: filteredExpectations,
    recons: filteredRecons,
    entityFilter, setEntityFilter,
    accountFilter, setAccountFilter,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    entities,
    accounts,
    kpis: { totalExpected, totalMatched, totalMissing, totalExceptions, completenessPct, missingAmount, deltaAmount },
    loading: false,
  };
}
