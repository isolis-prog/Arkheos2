import { useState, useMemo } from 'react';

export interface TaxRule {
  id: string;
  ruleName: string;
  jurisdiction: string;
  taxType: string;
  productGroup: string | null;
  incoterm: string | null;
  ratePct: number;
  exemptionCode: string | null;
  exemptionReason: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  version: number;
  isActive: boolean;
  approvedBy: string | null;
}

export interface TaxCalcResult {
  id: string;
  dealId: string;
  invoiceRef: string | null;
  legalEntity: string;
  counterparty: string | null;
  jurisdiction: string;
  taxType: string;
  productGroup: string | null;
  incoterm: string | null;
  baseAmount: number;
  expectedTax: number;
  actualTax: number | null;
  delta: number | null;
  ruleVersion: number | null;
  currency: string;
  periodName: string;
  status: 'pending' | 'matched' | 'delta' | 'missing' | 'exception';
}

export interface TaxException {
  id: string;
  exceptionType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  deltaAmount: number | null;
  currency: string;
  jurisdiction: string | null;
  assignedTo: string | null;
  status: 'open' | 'investigating' | 'resolved' | 'waived';
  createdAt: string;
}

const jurisdictions = ['US-Federal', 'US-TX', 'UK-HMRC', 'EU-NL', 'EU-DE', 'SG-IRAS', 'CH-FTA', 'BR-RFB'];
const taxTypes = ['VAT', 'excise', 'customs', 'carbon_levy', 'withholding'];
const products = ['Crude Oil', 'Natural Gas', 'LNG', 'Refined Products', 'Metals'];

const demoRules: TaxRule[] = [
  { id: 'r1', ruleName: 'UK VAT Standard', jurisdiction: 'UK-HMRC', taxType: 'VAT', productGroup: null, incoterm: null, ratePct: 20, exemptionCode: null, exemptionReason: null, effectiveFrom: '2025-01-01', effectiveTo: null, version: 3, isActive: true, approvedBy: 'Tax Team' },
  { id: 'r2', ruleName: 'EU NL VAT', jurisdiction: 'EU-NL', taxType: 'VAT', productGroup: null, incoterm: null, ratePct: 21, exemptionCode: null, exemptionReason: null, effectiveFrom: '2025-01-01', effectiveTo: null, version: 2, isActive: true, approvedBy: 'Tax Team' },
  { id: 'r3', ruleName: 'US Excise – Crude', jurisdiction: 'US-Federal', taxType: 'excise', productGroup: 'Crude Oil', incoterm: null, ratePct: 0.186, exemptionCode: null, exemptionReason: null, effectiveFrom: '2025-01-01', effectiveTo: null, version: 1, isActive: true, approvedBy: 'Tax Team' },
  { id: 'r4', ruleName: 'EU Carbon Levy', jurisdiction: 'EU-DE', taxType: 'carbon_levy', productGroup: 'Refined Products', incoterm: 'CIF', ratePct: 2.5, exemptionCode: null, exemptionReason: null, effectiveFrom: '2026-01-01', effectiveTo: null, version: 1, isActive: true, approvedBy: 'Sustainability' },
  { id: 'r5', ruleName: 'SG Customs – LNG', jurisdiction: 'SG-IRAS', taxType: 'customs', productGroup: 'LNG', incoterm: 'FOB', ratePct: 0, exemptionCode: 'FTZ-01', exemptionReason: 'Free Trade Zone exemption', effectiveFrom: '2025-06-01', effectiveTo: null, version: 1, isActive: true, approvedBy: 'Tax Team' },
  { id: 'r6', ruleName: 'BR Withholding', jurisdiction: 'BR-RFB', taxType: 'withholding', productGroup: null, incoterm: null, ratePct: 15, exemptionCode: null, exemptionReason: null, effectiveFrom: '2025-01-01', effectiveTo: null, version: 2, isActive: true, approvedBy: 'Tax Team' },
  { id: 'r7', ruleName: 'CH VAT', jurisdiction: 'CH-FTA', taxType: 'VAT', productGroup: null, incoterm: null, ratePct: 8.1, exemptionCode: null, exemptionReason: null, effectiveFrom: '2025-01-01', effectiveTo: null, version: 1, isActive: true, approvedBy: 'Tax Team' },
];

const demoCalcs: TaxCalcResult[] = [];
let idx = 0;
for (let i = 0; i < 60; i++) {
  const rule = demoRules[Math.floor(Math.random() * demoRules.length)];
  const base = Math.round((Math.random() * 2000000 + 50000) * 100) / 100;
  const expected = Math.round(base * rule.ratePct / 100 * 100) / 100;
  const roll = Math.random();
  const status: TaxCalcResult['status'] = roll > 0.8 ? 'delta' : roll > 0.7 ? 'missing' : roll > 0.65 ? 'exception' : 'matched';
  const actual = status === 'matched' ? expected : status === 'missing' ? null : Math.round(expected * (0.85 + Math.random() * 0.12) * 100) / 100;
  demoCalcs.push({
    id: `tc-${idx++}`,
    dealId: `DL-2026-${String(3000 + i).slice(1)}`,
    invoiceRef: status !== 'missing' ? `INV-${String(7000 + i)}` : null,
    legalEntity: ['Corp US', 'Corp UK', 'Corp SG', 'Corp CH'][i % 4],
    counterparty: ['Shell', 'Vitol', 'Trafigura', 'Glencore', 'Mercuria'][i % 5],
    jurisdiction: rule.jurisdiction,
    taxType: rule.taxType,
    productGroup: rule.productGroup || products[i % products.length],
    incoterm: ['FOB', 'CIF', 'DAP', 'EXW'][i % 4],
    baseAmount: base,
    expectedTax: expected,
    actualTax: actual,
    delta: actual != null ? Math.round((expected - actual) * 100) / 100 : expected,
    ruleVersion: rule.version,
    currency: 'USD',
    periodName: 'Feb-2026',
    status,
  });
}

const demoExceptions: TaxException[] = demoCalcs
  .filter(c => c.status === 'delta' || c.status === 'exception' || c.status === 'missing')
  .map((c, i) => ({
    id: `te-${i}`,
    exceptionType: c.status === 'missing' ? 'missing_tax' : c.status === 'exception' ? 'exemption_error' : 'rate_mismatch',
    severity: (Math.abs(c.delta || 0) > 50000 ? 'critical' : Math.abs(c.delta || 0) > 10000 ? 'high' : 'medium') as TaxException['severity'],
    description: `${c.taxType.toUpperCase()} ${c.status === 'missing' ? 'missing' : 'mismatch'} for ${c.dealId} in ${c.jurisdiction}`,
    deltaAmount: c.delta,
    currency: c.currency,
    jurisdiction: c.jurisdiction,
    assignedTo: i % 3 === 0 ? 'Tax Team' : null,
    status: i % 5 === 0 ? 'resolved' : i % 4 === 0 ? 'investigating' : 'open',
    createdAt: '2026-02-21T08:00:00Z',
  }));

export function useTaxControls() {
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('all');
  const [taxTypeFilter, setTaxTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCalcs = useMemo(() => {
    return demoCalcs.filter(c => {
      if (jurisdictionFilter !== 'all' && c.jurisdiction !== jurisdictionFilter) return false;
      if (taxTypeFilter !== 'all' && c.taxType !== taxTypeFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchQuery && !c.dealId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [jurisdictionFilter, taxTypeFilter, statusFilter, searchQuery]);

  const totalCalcs = demoCalcs.length;
  const matched = demoCalcs.filter(c => c.status === 'matched').length;
  const deltas = demoCalcs.filter(c => c.status === 'delta').length;
  const missing = demoCalcs.filter(c => c.status === 'missing').length;
  const totalDelta = demoCalcs.reduce((s, c) => s + Math.abs(c.delta || 0), 0);
  const openExceptions = demoExceptions.filter(e => e.status === 'open').length;
  const topJurisdiction = (() => {
    const counts = new Map<string, number>();
    demoExceptions.forEach(e => { if (e.jurisdiction) counts.set(e.jurisdiction, (counts.get(e.jurisdiction) || 0) + 1); });
    let max = '', maxC = 0;
    counts.forEach((c, j) => { if (c > maxC) { max = j; maxC = c; } });
    return max || '—';
  })();

  return {
    rules: demoRules,
    calcs: filteredCalcs,
    exceptions: demoExceptions,
    jurisdictions,
    taxTypes,
    jurisdictionFilter, setJurisdictionFilter,
    taxTypeFilter, setTaxTypeFilter,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    kpis: { totalCalcs, matched, deltas, missing, totalDelta, openExceptions, topJurisdiction },
    loading: false,
  };
}
