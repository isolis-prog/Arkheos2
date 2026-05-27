import { useState, useMemo } from 'react';
import { subDays, subHours, addHours } from 'date-fns';

export interface QAViolation {
  rule_id: string;
  rule_name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  field: string;
  expected: string;
  actual: string;
  message: string;
}

export interface TradeQAResult {
  id: string;
  tradeRef: string;
  tradeType: 'physical' | 'swap' | 'option' | 'future';
  counterparty: string;
  product: string;
  book: string;
  portfolio: string;
  trader: string;
  overallResult: 'pass' | 'fail' | 'warning';
  violations: QAViolation[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  ownerRole: string;
  assignedTo: string | null;
  status: 'new' | 'triaged' | 'in_progress' | 'resolved' | 'waived';
  runAt: string;
  resolvedAt: string | null;
}

export interface QARulePack {
  id: string;
  name: string;
  tradeType: string;
  rulesCount: number;
  isActive: boolean;
  version: number;
  lastRun: string | null;
  passRate: number;
}

const COUNTERPARTIES = ['Shell Trading', 'BP Oil', 'Vitol SA', 'Trafigura', 'Glencore', 'Cargill'];
const PRODUCTS = ['Crude WTI', 'Brent', 'RBOB Gasoline', 'Natural Gas', 'Heating Oil', 'Jet Fuel'];
const BOOKS = ['NAM-Phys', 'EUR-Deriv', 'APAC-Phys', 'LATAM-Struct', 'GLB-Options'];
const PORTFOLIOS = ['Energy Trading', 'Refined Products', 'Gas & Power', 'Structured Deals'];
const TRADERS = ['J. Smith', 'A. Chen', 'M. Williams', 'S. Patel', 'R. García'];

const RULE_EXAMPLES: QAViolation[] = [
  { rule_id: 'REQ-001', rule_name: 'Required: Book', severity: 'critical', field: 'book', expected: 'non-empty', actual: '', message: 'Book field is required' },
  { rule_id: 'REQ-002', rule_name: 'Required: Portfolio', severity: 'critical', field: 'portfolio', expected: 'non-empty', actual: '', message: 'Portfolio field is required' },
  { rule_id: 'REQ-003', rule_name: 'Required: Counterparty', severity: 'critical', field: 'counterparty', expected: 'non-empty', actual: '', message: 'Counterparty field is required' },
  { rule_id: 'REQ-004', rule_name: 'Required: Pricing', severity: 'high', field: 'price', expected: '> 0', actual: '0', message: 'Price must be greater than zero' },
  { rule_id: 'VAL-001', rule_name: 'Book Allowed for Trader', severity: 'high', field: 'book', expected: 'NAM-Phys, EUR-Deriv', actual: 'APAC-Phys', message: 'Trader not authorized for this book' },
  { rule_id: 'VAL-002', rule_name: 'Counterparty Active', severity: 'high', field: 'counterparty', expected: 'active', actual: 'inactive', message: 'Counterparty is not active' },
  { rule_id: 'VAL-003', rule_name: 'Credit Terms Exist', severity: 'medium', field: 'credit_terms', expected: 'approved', actual: 'missing', message: 'No credit terms on file for counterparty' },
  { rule_id: 'SIGN-001', rule_name: 'Qty Sign vs Buy/Sell', severity: 'high', field: 'quantity', expected: 'positive (Buy)', actual: '-5000', message: 'Quantity sign inconsistent with buy/sell direction' },
  { rule_id: 'LATE-001', rule_name: 'Late Capture', severity: 'medium', field: 'created_at', expected: 'before 18:00 cutoff', actual: '21:35', message: 'Trade captured after daily cutoff' },
  { rule_id: 'REF-001', rule_name: 'Location Valid', severity: 'medium', field: 'location', expected: 'known location', actual: 'UNKNOWN', message: 'Location not in reference data' },
  { rule_id: 'CAL-001', rule_name: 'Calendar Valid', severity: 'low', field: 'delivery_calendar', expected: 'non-empty', actual: '', message: 'Delivery calendar not specified' },
];

function generateResults(): TradeQAResult[] {
  const results: TradeQAResult[] = [];
  const types: TradeQAResult['tradeType'][] = ['physical', 'swap', 'option', 'future'];

  for (let i = 0; i < 40; i++) {
    const tradeType = types[i % 4];
    const numViolations = i < 12 ? 0 : Math.floor(Math.random() * 4) + 1;
    const violations = numViolations > 0
      ? RULE_EXAMPLES.sort(() => Math.random() - 0.5).slice(0, numViolations)
      : [];
    const maxSev = violations.reduce((max, v) => {
      const order = { critical: 4, high: 3, medium: 2, low: 1 };
      return order[v.severity] > order[max] ? v.severity : max;
    }, 'low' as QAViolation['severity']);

    const overallResult: TradeQAResult['overallResult'] = numViolations === 0
      ? 'pass'
      : violations.some(v => v.severity === 'critical' || v.severity === 'high') ? 'fail' : 'warning';

    const ownerRole = violations.some(v => ['VAL-001', 'SIGN-001', 'REQ-004'].includes(v.rule_id)) ? 'FO' : 'MO';

    results.push({
      id: `tqa-${i}`,
      tradeRef: `T-2026-${String(4000 + i).padStart(5, '0')}`,
      tradeType,
      counterparty: COUNTERPARTIES[i % COUNTERPARTIES.length],
      product: PRODUCTS[i % PRODUCTS.length],
      book: BOOKS[i % BOOKS.length],
      portfolio: PORTFOLIOS[i % PORTFOLIOS.length],
      trader: TRADERS[i % TRADERS.length],
      overallResult,
      violations,
      severity: numViolations === 0 ? 'low' : maxSev,
      ownerRole,
      assignedTo: overallResult === 'fail' ? TRADERS[i % TRADERS.length] : null,
      status: overallResult === 'pass' ? 'resolved' : (i % 5 === 0 ? 'in_progress' : (i % 3 === 0 ? 'triaged' : 'new')),
      runAt: subHours(new Date(), i * 2).toISOString(),
      resolvedAt: overallResult === 'pass' ? subHours(new Date(), i * 2 - 1).toISOString() : null,
    });
  }
  return results;
}

function generateRulePacks(): QARulePack[] {
  return [
    { id: 'rp-1', name: 'Physical Trade Rules', tradeType: 'physical', rulesCount: 14, isActive: true, version: 3, lastRun: subHours(new Date(), 2).toISOString(), passRate: 82 },
    { id: 'rp-2', name: 'Swap/Derivative Rules', tradeType: 'swap', rulesCount: 11, isActive: true, version: 2, lastRun: subHours(new Date(), 2).toISOString(), passRate: 91 },
    { id: 'rp-3', name: 'Options Validation', tradeType: 'option', rulesCount: 16, isActive: true, version: 1, lastRun: subHours(new Date(), 4).toISOString(), passRate: 88 },
    { id: 'rp-4', name: 'Futures Capture QA', tradeType: 'future', rulesCount: 9, isActive: true, version: 2, lastRun: subHours(new Date(), 3).toISOString(), passRate: 95 },
    { id: 'rp-5', name: 'Late Capture Policy', tradeType: 'all', rulesCount: 3, isActive: true, version: 1, lastRun: subDays(new Date(), 1).toISOString(), passRate: 78 },
  ];
}

export function useTradeQA() {
  const [results] = useState(generateResults);
  const [rulePacks] = useState(generateRulePacks);
  const [tradeTypeFilter, setTradeTypeFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return results.filter(r => {
      if (tradeTypeFilter !== 'all' && r.tradeType !== tradeTypeFilter) return false;
      if (resultFilter !== 'all' && r.overallResult !== resultFilter) return false;
      if (severityFilter !== 'all' && r.severity !== severityFilter) return false;
      if (searchQuery && !r.tradeRef.toLowerCase().includes(searchQuery.toLowerCase()) && !r.counterparty.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [results, tradeTypeFilter, resultFilter, severityFilter, searchQuery]);

  const selectedResult = useMemo(() => results.find(r => r.id === selectedResultId) || null, [results, selectedResultId]);

  const stats = useMemo(() => ({
    total: results.length,
    passed: results.filter(r => r.overallResult === 'pass').length,
    failed: results.filter(r => r.overallResult === 'fail').length,
    warnings: results.filter(r => r.overallResult === 'warning').length,
    passRate: Math.round((results.filter(r => r.overallResult === 'pass').length / results.length) * 100),
    criticalViolations: results.reduce((sum, r) => sum + r.violations.filter(v => v.severity === 'critical').length, 0),
    unassigned: results.filter(r => r.overallResult !== 'pass' && !r.assignedTo).length,
  }), [results]);

  return {
    results, filtered, rulePacks, stats,
    tradeTypeFilter, setTradeTypeFilter,
    resultFilter, setResultFilter,
    severityFilter, setSeverityFilter,
    searchQuery, setSearchQuery,
    selectedResultId, setSelectedResultId,
    selectedResult,
  };
}
