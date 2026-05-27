import { useState, useMemo } from 'react';
import { differenceInDays } from 'date-fns';

export type HedgeMethod = 'cash_flow' | 'fair_value' | 'net_investment';
export type HedgeStatus = 'designated' | 'active' | 'de_designated' | 'expired' | 'matured';
export type HedgeTestType = 'prospective' | 'retrospective';

export interface HedgeRelationship {
  id: string;
  designationRef: string;
  exposureRef: string;
  exposureDescription: string;
  hedgeTradeIds: string[];
  method: HedgeMethod;
  accountingStandard: string;
  hedgeRatio: number;
  notionalAmount: number;
  currency: string;
  designationDate: string;
  maturityDate: string | null;
  status: HedgeStatus;
  documentationChecklist: Record<string, boolean>;
  designatedBy: string;
  approvedBy: string | null;
  daysToMaturity: number | null;
}

export interface HedgeTestResult {
  id: string;
  relationshipId: string;
  designationRef: string;
  testType: HedgeTestType;
  periodStart: string;
  periodEnd: string;
  effectivenessRatio: number;
  passFlag: boolean;
  methodDetail: string;
  notes: string | null;
  testedBy: string;
}

export interface HedgeAccountingPack {
  id: string;
  relationshipId: string;
  designationRef: string;
  packRef: string;
  period: string;
  standard: string;
  generatedBy: string;
  generatedAt: string;
  status: 'draft' | 'approved' | 'exported';
  contents: { section: string; included: boolean }[];
}

export interface HedgeFilters {
  method: string;
  status: string;
  standard: string;
  search: string;
}

const demoRelationships: HedgeRelationship[] = [
  { id: 'hr1', designationRef: 'HD-2026-001', exposureRef: 'EXP-WTI-Q2-2026', exposureDescription: 'WTI crude purchase Q2 2026 - 500K bbl', hedgeTradeIds: ['SW-4521', 'SW-4522'], method: 'cash_flow', accountingStandard: 'IFRS9', hedgeRatio: 1.0, notionalAmount: 36500000, currency: 'USD', designationDate: '2025-12-15', maturityDate: '2026-06-30', status: 'active', documentationChecklist: { risk_objective: true, hedged_item: true, hedging_instrument: true, effectiveness_method: true, ratio_justification: true, risk_component: true }, designatedBy: 'Maria Chen', approvedBy: 'James Wilson', daysToMaturity: 129 },
  { id: 'hr2', designationRef: 'HD-2026-002', exposureRef: 'EXP-NG-H2-2026', exposureDescription: 'Henry Hub gas sales H2 2026 - 1.2M MMBtu', hedgeTradeIds: ['FUT-8810', 'FUT-8811', 'FUT-8812'], method: 'cash_flow', accountingStandard: 'IFRS9', hedgeRatio: 0.85, notionalAmount: 4200000, currency: 'USD', designationDate: '2026-01-10', maturityDate: '2026-12-31', status: 'active', documentationChecklist: { risk_objective: true, hedged_item: true, hedging_instrument: true, effectiveness_method: true, ratio_justification: false, risk_component: true }, designatedBy: 'David Park', approvedBy: null, daysToMaturity: 313 },
  { id: 'hr3', designationRef: 'HD-2026-003', exposureRef: 'EXP-EUR-Q1-2026', exposureDescription: 'EUR revenue Q1 2026 - €15M', hedgeTradeIds: ['FX-3301'], method: 'cash_flow', accountingStandard: 'USGAAP', hedgeRatio: 1.0, notionalAmount: 15000000, currency: 'EUR', designationDate: '2025-10-01', maturityDate: '2026-03-31', status: 'active', documentationChecklist: { risk_objective: true, hedged_item: true, hedging_instrument: true, effectiveness_method: true, ratio_justification: true, risk_component: true }, designatedBy: 'Sarah Liu', approvedBy: 'James Wilson', daysToMaturity: 38 },
  { id: 'hr4', designationRef: 'HD-2025-018', exposureRef: 'EXP-JET-Q4-2025', exposureDescription: 'Jet fuel purchase Q4 2025 - 200K MT', hedgeTradeIds: ['SW-3900', 'OPT-1102'], method: 'fair_value', accountingStandard: 'IFRS9', hedgeRatio: 0.90, notionalAmount: 28000000, currency: 'USD', designationDate: '2025-06-01', maturityDate: '2025-12-31', status: 'matured', documentationChecklist: { risk_objective: true, hedged_item: true, hedging_instrument: true, effectiveness_method: true, ratio_justification: true, risk_component: true }, designatedBy: 'Maria Chen', approvedBy: 'James Wilson', daysToMaturity: null },
  { id: 'hr5', designationRef: 'HD-2026-004', exposureRef: 'EXP-COAL-2026', exposureDescription: 'Coal export revenue 2026 - 500K MT', hedgeTradeIds: ['SW-5010'], method: 'cash_flow', accountingStandard: 'IFRS9', hedgeRatio: 0.70, notionalAmount: 52000000, currency: 'USD', designationDate: '2026-02-01', maturityDate: '2026-12-31', status: 'designated', documentationChecklist: { risk_objective: true, hedged_item: true, hedging_instrument: false, effectiveness_method: false, ratio_justification: false, risk_component: false }, designatedBy: 'David Park', approvedBy: null, daysToMaturity: 313 },
  { id: 'hr6', designationRef: 'HD-2025-012', exposureRef: 'EXP-GBP-2025', exposureDescription: 'GBP payables 2025 - £8M', hedgeTradeIds: ['FX-2200'], method: 'cash_flow', accountingStandard: 'USGAAP', hedgeRatio: 1.0, notionalAmount: 8000000, currency: 'GBP', designationDate: '2025-03-01', maturityDate: '2025-11-30', status: 'de_designated', documentationChecklist: { risk_objective: true, hedged_item: true, hedging_instrument: true, effectiveness_method: true, ratio_justification: true, risk_component: true }, designatedBy: 'Sarah Liu', approvedBy: 'James Wilson', daysToMaturity: null },
  { id: 'hr7', designationRef: 'HD-2026-005', exposureRef: 'EXP-BRENT-Q3-2026', exposureDescription: 'Brent crude inventory Q3 2026 - 800K bbl', hedgeTradeIds: ['FUT-9001', 'FUT-9002'], method: 'fair_value', accountingStandard: 'IFRS9', hedgeRatio: 0.95, notionalAmount: 60000000, currency: 'USD', designationDate: '2026-02-10', maturityDate: '2026-09-30', status: 'active', documentationChecklist: { risk_objective: true, hedged_item: true, hedging_instrument: true, effectiveness_method: true, ratio_justification: true, risk_component: true }, designatedBy: 'Maria Chen', approvedBy: 'James Wilson', daysToMaturity: 220 },
  { id: 'hr8', designationRef: 'HD-2026-006', exposureRef: 'EXP-TTF-Q4-2026', exposureDescription: 'TTF gas sales Q4 2026 - 2.5M MMBtu', hedgeTradeIds: ['SW-5200', 'SW-5201'], method: 'cash_flow', accountingStandard: 'IFRS9', hedgeRatio: 0.80, notionalAmount: 18500000, currency: 'EUR', designationDate: '2026-02-15', maturityDate: '2026-12-31', status: 'active', documentationChecklist: { risk_objective: true, hedged_item: true, hedging_instrument: true, effectiveness_method: true, ratio_justification: true, risk_component: false }, designatedBy: 'David Park', approvedBy: 'James Wilson', daysToMaturity: 313 },
  { id: 'hr9', designationRef: 'HD-2026-007', exposureRef: 'EXP-USD-JPY-2026', exposureDescription: 'JPY import payables 2026 - ¥2B', hedgeTradeIds: ['FX-3450'], method: 'cash_flow', accountingStandard: 'USGAAP', hedgeRatio: 1.0, notionalAmount: 13500000, currency: 'JPY', designationDate: '2026-01-20', maturityDate: '2026-12-31', status: 'active', documentationChecklist: { risk_objective: true, hedged_item: true, hedging_instrument: true, effectiveness_method: true, ratio_justification: true, risk_component: true }, designatedBy: 'Sarah Liu', approvedBy: 'James Wilson', daysToMaturity: 313 },
  { id: 'hr10', designationRef: 'HD-2026-008', exposureRef: 'EXP-PWR-PJM-2026', exposureDescription: 'PJM power forward sales 2026 - 350GWh', hedgeTradeIds: ['FUT-9500'], method: 'cash_flow', accountingStandard: 'USGAAP', hedgeRatio: 0.75, notionalAmount: 22000000, currency: 'USD', designationDate: '2026-02-18', maturityDate: '2026-12-31', status: 'active', documentationChecklist: { risk_objective: true, hedged_item: true, hedging_instrument: true, effectiveness_method: false, ratio_justification: false, risk_component: false }, designatedBy: 'David Park', approvedBy: null, daysToMaturity: 313 },
  { id: 'hr11', designationRef: 'HD-2026-009', exposureRef: 'EXP-CU-2026', exposureDescription: 'Copper inventory hedge 2026 - 5K MT', hedgeTradeIds: ['FUT-9700'], method: 'fair_value', accountingStandard: 'IFRS9', hedgeRatio: 1.0, notionalAmount: 42000000, currency: 'USD', designationDate: '2026-02-05', maturityDate: '2026-08-31', status: 'active', documentationChecklist: { risk_objective: true, hedged_item: true, hedging_instrument: true, effectiveness_method: true, ratio_justification: true, risk_component: true }, designatedBy: 'Maria Chen', approvedBy: 'James Wilson', daysToMaturity: 190 },
  { id: 'hr12', designationRef: 'HD-2025-022', exposureRef: 'EXP-DIESEL-2025', exposureDescription: 'Diesel fleet Q3-Q4 2025 - 50K MT', hedgeTradeIds: ['SW-4100'], method: 'cash_flow', accountingStandard: 'IFRS9', hedgeRatio: 0.85, notionalAmount: 12000000, currency: 'USD', designationDate: '2025-07-01', maturityDate: '2025-12-31', status: 'matured', documentationChecklist: { risk_objective: true, hedged_item: true, hedging_instrument: true, effectiveness_method: true, ratio_justification: true, risk_component: true }, designatedBy: 'Sarah Liu', approvedBy: 'James Wilson', daysToMaturity: null },
  { id: 'hr13', designationRef: 'HD-2026-010', exposureRef: 'EXP-LNG-CARGOS-2026', exposureDescription: 'LNG cargo sales H2 2026 - 6 cargoes', hedgeTradeIds: ['SW-5500', 'OPT-2200', 'OPT-2201'], method: 'cash_flow', accountingStandard: 'IFRS9', hedgeRatio: 0.70, notionalAmount: 78000000, currency: 'USD', designationDate: '2026-02-20', maturityDate: '2026-12-15', status: 'designated', documentationChecklist: { risk_objective: true, hedged_item: true, hedging_instrument: false, effectiveness_method: false, ratio_justification: false, risk_component: false }, designatedBy: 'David Park', approvedBy: null, daysToMaturity: 297 },
  { id: 'hr14', designationRef: 'HD-2026-011', exposureRef: 'EXP-NETINV-EU', exposureDescription: 'Net investment in EU subsidiary - €50M', hedgeTradeIds: ['FX-3600'], method: 'net_investment', accountingStandard: 'IFRS9', hedgeRatio: 1.0, notionalAmount: 50000000, currency: 'EUR', designationDate: '2026-01-05', maturityDate: null, status: 'active', documentationChecklist: { risk_objective: true, hedged_item: true, hedging_instrument: true, effectiveness_method: true, ratio_justification: true, risk_component: true }, designatedBy: 'Sarah Liu', approvedBy: 'James Wilson', daysToMaturity: null },
];

const demoTestResults: HedgeTestResult[] = [
  { id: 't1', relationshipId: 'hr1', designationRef: 'HD-2026-001', testType: 'prospective', periodStart: '2026-01-01', periodEnd: '2026-01-31', effectivenessRatio: 0.94, passFlag: true, methodDetail: 'Dollar Offset (80%-125%)', notes: null, testedBy: 'Risk Team' },
  { id: 't2', relationshipId: 'hr1', designationRef: 'HD-2026-001', testType: 'retrospective', periodStart: '2026-01-01', periodEnd: '2026-01-31', effectivenessRatio: 0.97, passFlag: true, methodDetail: 'Regression R² = 0.96', notes: null, testedBy: 'Risk Team' },
  { id: 't3', relationshipId: 'hr1', designationRef: 'HD-2026-001', testType: 'prospective', periodStart: '2026-02-01', periodEnd: '2026-02-21', effectivenessRatio: 0.91, passFlag: true, methodDetail: 'Dollar Offset (80%-125%)', notes: 'Slight widening of basis', testedBy: 'Risk Team' },
  { id: 't4', relationshipId: 'hr2', designationRef: 'HD-2026-002', testType: 'prospective', periodStart: '2026-01-10', periodEnd: '2026-01-31', effectivenessRatio: 0.88, passFlag: true, methodDetail: 'Dollar Offset (80%-125%)', notes: null, testedBy: 'Risk Team' },
  { id: 't5', relationshipId: 'hr2', designationRef: 'HD-2026-002', testType: 'retrospective', periodStart: '2026-01-10', periodEnd: '2026-01-31', effectivenessRatio: 0.76, passFlag: false, methodDetail: 'Regression R² = 0.72', notes: 'Below 80% threshold - basis divergence', testedBy: 'Risk Team' },
  { id: 't6', relationshipId: 'hr3', designationRef: 'HD-2026-003', testType: 'prospective', periodStart: '2026-01-01', periodEnd: '2026-02-21', effectivenessRatio: 0.99, passFlag: true, methodDetail: 'Critical Terms Match', notes: null, testedBy: 'Treasury' },
  { id: 't7', relationshipId: 'hr3', designationRef: 'HD-2026-003', testType: 'retrospective', periodStart: '2026-01-01', periodEnd: '2026-02-21', effectivenessRatio: 1.02, passFlag: true, methodDetail: 'Dollar Offset', notes: null, testedBy: 'Treasury' },
  { id: 't8', relationshipId: 'hr4', designationRef: 'HD-2025-018', testType: 'retrospective', periodStart: '2025-10-01', periodEnd: '2025-12-31', effectivenessRatio: 0.92, passFlag: true, methodDetail: 'Regression R² = 0.91', notes: 'Final period test', testedBy: 'Risk Team' },
];

const demoPacks: HedgeAccountingPack[] = [
  { id: 'p1', relationshipId: 'hr1', designationRef: 'HD-2026-001', packRef: 'HAP-2026-001-Q1', period: 'Q1 2026', standard: 'IFRS9', generatedBy: 'Maria Chen', generatedAt: '2026-02-15T14:00:00Z', status: 'approved', contents: [{ section: 'Designation Memo', included: true }, { section: 'Effectiveness Tests', included: true }, { section: 'Journal Entries', included: true }, { section: 'Fair Value Marks', included: true }, { section: 'Risk Disclosures', included: true }] },
  { id: 'p2', relationshipId: 'hr3', designationRef: 'HD-2026-003', packRef: 'HAP-2026-003-Q1', period: 'Q1 2026', standard: 'USGAAP', generatedBy: 'Sarah Liu', generatedAt: '2026-02-20T10:00:00Z', status: 'draft', contents: [{ section: 'Designation Memo', included: true }, { section: 'Effectiveness Tests', included: true }, { section: 'Journal Entries', included: false }, { section: 'Fair Value Marks', included: true }, { section: 'Risk Disclosures', included: false }] },
  { id: 'p3', relationshipId: 'hr4', designationRef: 'HD-2025-018', packRef: 'HAP-2025-018-Q4', period: 'Q4 2025', standard: 'IFRS9', generatedBy: 'Maria Chen', generatedAt: '2026-01-10T09:00:00Z', status: 'exported', contents: [{ section: 'Designation Memo', included: true }, { section: 'Effectiveness Tests', included: true }, { section: 'Journal Entries', included: true }, { section: 'Fair Value Marks', included: true }, { section: 'Risk Disclosures', included: true }] },
];

export function useHedgeAccounting() {
  const [filters, setFilters] = useState<HedgeFilters>({ method: 'all', status: 'all', standard: 'all', search: '' });
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'relationships' | 'tests' | 'packs'>('relationships');

  const filteredRelationships = useMemo(() => {
    return demoRelationships.filter((r) => {
      if (filters.method !== 'all' && r.method !== filters.method) return false;
      if (filters.status !== 'all' && r.status !== filters.status) return false;
      if (filters.standard !== 'all' && r.accountingStandard !== filters.standard) return false;
      if (filters.search && !r.designationRef.toLowerCase().includes(filters.search.toLowerCase()) && !r.exposureDescription.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [filters]);

  const selectedRelationship = useMemo(() => demoRelationships.find(r => r.id === selectedRelationshipId) ?? null, [selectedRelationshipId]);
  const selectedTests = useMemo(() => demoTestResults.filter(t => t.relationshipId === selectedRelationshipId), [selectedRelationshipId]);
  const selectedPacks = useMemo(() => demoPacks.filter(p => p.relationshipId === selectedRelationshipId), [selectedRelationshipId]);

  const kpis = useMemo(() => {
    const activeRels = demoRelationships.filter(r => ['designated', 'active'].includes(r.status));
    const totalTests = demoTestResults.length;
    const passedTests = demoTestResults.filter(t => t.passFlag).length;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    const expiringSoon = activeRels.filter(r => r.daysToMaturity !== null && r.daysToMaturity <= 60).length;

    const docMissing = activeRels.filter(r => {
      const checklist = Object.values(r.documentationChecklist);
      return checklist.some(v => !v);
    }).length;

    const totalNotional = activeRels.reduce((s, r) => s + r.notionalAmount, 0);

    return {
      activeRelationships: activeRels.length,
      passRate: Math.round(passRate * 10) / 10,
      expiringSoon,
      docMissing,
      totalNotional,
      failedTests: totalTests - passedTests,
    };
  }, []);

  return {
    filters, setFilters,
    activeTab, setActiveTab,
    relationships: filteredRelationships,
    allTests: demoTestResults,
    allPacks: demoPacks,
    selectedRelationship, selectedTests, selectedPacks,
    selectedRelationshipId, setSelectedRelationshipId,
    kpis,
  };
}
