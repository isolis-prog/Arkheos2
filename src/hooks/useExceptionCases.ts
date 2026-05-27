import { useState, useMemo } from 'react';

// ── Types ──────────────────────────────────────────────────

export type ExceptionCaseStatus = 'new' | 'triaged' | 'in_progress' | 'pending_counterparty' | 'resolved' | 'waived';
export type ExceptionOwnerRole = 'fo' | 'mo' | 'bo' | 'ops' | 'treasury';

export interface ExceptionCase {
  id: string;
  caseRef: string;
  module: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: ExceptionCaseStatus;
  ownerRole: ExceptionOwnerRole | null;
  ownerUser: string | null;
  ownerUserName: string | null;
  slaDueAt: string | null;
  rootCauseCode: string | null;
  resolutionNotes: string | null;
  evidenceLinks: string[];
  relatedEntities: { type: string; id: string; label: string }[];
  amount: number | null;
  currency: string | null;
  description: string;
  createdAt: string;
}

export interface ExceptionCaseFilters {
  search: string;
  module: string;
  severity: string;
  status: ExceptionCaseStatus | 'all';
  ownerRole: ExceptionOwnerRole | 'all';
  slaOverdue: boolean;
}

// ── Demo Data ──────────────────────────────────────────────

const MODULES = ['recon', 'doc-intelligence', 'cashflows', 'trade-lifecycle', 'logistics', 'market-data', 'settlements'];

const demoCases: ExceptionCase[] = [
  { id: 'ec-1', caseRef: 'EXC-2025-0001', module: 'recon', severity: 'high', status: 'new', ownerRole: 'mo', ownerUser: null, ownerUserName: null, slaDueAt: '2025-06-20T17:00:00Z', rootCauseCode: null, resolutionNotes: null, evidenceLinks: [], relatedEntities: [{ type: 'trade', id: 'ct-1', label: 'TRD-2025-0042' }], amount: 125000, currency: 'USD', description: 'Amount mismatch $125K between ETRM and ERP for trade TRD-2025-0042', createdAt: '2025-06-18T10:00:00Z' },
  { id: 'ec-2', caseRef: 'EXC-2025-0002', module: 'doc-intelligence', severity: 'medium', status: 'triaged', ownerRole: 'fo', ownerUser: 'u-1', ownerUserName: 'John Trader', slaDueAt: '2025-06-22T17:00:00Z', rootCauseCode: null, resolutionNotes: null, evidenceLinks: ['doc-1234'], relatedEntities: [{ type: 'counterparty', id: 'cc-1', label: 'Shell Trading' }], amount: null, currency: null, description: 'Pricing window mismatch detected in ISDA confirmation vs ETRM', createdAt: '2025-06-17T14:30:00Z' },
  { id: 'ec-3', caseRef: 'EXC-2025-0003', module: 'cashflows', severity: 'critical', status: 'in_progress', ownerRole: 'treasury', ownerUser: 'u-2', ownerUserName: 'Alice Treasury', slaDueAt: '2025-06-19T12:00:00Z', rootCauseCode: 'MISSING_PAYMENT', resolutionNotes: null, evidenceLinks: [], relatedEntities: [{ type: 'payment', id: 'cpmt-1', label: 'PAY-2025-00123' }], amount: 2500000, currency: 'USD', description: 'Expected payment of $2.5M not received — counterparty confirmed pending', createdAt: '2025-06-16T09:00:00Z' },
  { id: 'ec-4', caseRef: 'EXC-2025-0004', module: 'trade-lifecycle', severity: 'low', status: 'resolved', ownerRole: 'fo', ownerUser: 'u-1', ownerUserName: 'John Trader', slaDueAt: '2025-06-25T17:00:00Z', rootCauseCode: 'DATA_ENTRY_ERROR', resolutionNotes: 'Corrected volume in ETRM from 10,000 to 100,000 bbls', evidenceLinks: ['amendment-plan-42'], relatedEntities: [{ type: 'trade', id: 'ct-2', label: 'TRD-2025-0099' }], amount: 50000, currency: 'USD', description: 'Volume discrepancy — likely data entry error', createdAt: '2025-06-15T11:00:00Z' },
  { id: 'ec-5', caseRef: 'EXC-2025-0005', module: 'logistics', severity: 'medium', status: 'pending_counterparty', ownerRole: 'ops', ownerUser: 'u-3', ownerUserName: 'Bob Operations', slaDueAt: '2025-06-24T17:00:00Z', rootCauseCode: null, resolutionNotes: null, evidenceLinks: [], relatedEntities: [{ type: 'shipment', id: 'cs-1', label: 'SHIP-2025-V204' }], amount: 18000, currency: 'USD', description: 'BL quantity differs from nomination by 320 MT', createdAt: '2025-06-14T16:00:00Z' },
  { id: 'ec-6', caseRef: 'EXC-2025-0006', module: 'market-data', severity: 'high', status: 'new', ownerRole: 'mo', ownerUser: null, ownerUserName: null, slaDueAt: '2025-06-21T17:00:00Z', rootCauseCode: null, resolutionNotes: null, evidenceLinks: [], relatedEntities: [{ type: 'product', id: 'cp-1', label: 'Brent Crude FOB' }], amount: 340000, currency: 'USD', description: 'Stale curve used for MTM — price feed gap detected', createdAt: '2025-06-18T08:00:00Z' },
  { id: 'ec-7', caseRef: 'EXC-2025-0007', module: 'settlements', severity: 'critical', status: 'triaged', ownerRole: 'bo', ownerUser: 'u-4', ownerUserName: 'Carol BackOffice', slaDueAt: '2025-06-19T17:00:00Z', rootCauseCode: null, resolutionNotes: null, evidenceLinks: [], relatedEntities: [{ type: 'invoice', id: 'ci-1', label: 'INV-2025-90001' }], amount: 890000, currency: 'EUR', description: 'Invoice amount does not reconcile with confirmed trade economics', createdAt: '2025-06-17T10:00:00Z' },
  { id: 'ec-8', caseRef: 'EXC-2025-0008', module: 'recon', severity: 'medium', status: 'waived', ownerRole: 'mo', ownerUser: 'u-2', ownerUserName: 'Alice Treasury', slaDueAt: null, rootCauseCode: 'TIMING_DIFFERENCE', resolutionNotes: 'Timing difference — resolves at month-end', evidenceLinks: [], relatedEntities: [], amount: 5000, currency: 'USD', description: 'Minor timing difference on accrual posting', createdAt: '2025-06-10T09:00:00Z' },
];

// ── Hook ───────────────────────────────────────────────────

export function useExceptionCases() {
  const [cases] = useState<ExceptionCase[]>(demoCases);
  const [filters, setFilters] = useState<ExceptionCaseFilters>({
    search: '',
    module: '',
    severity: '',
    status: 'all',
    ownerRole: 'all',
    slaOverdue: false,
  });

  const filtered = useMemo(() => {
    const now = new Date();
    return cases.filter(c => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!c.caseRef.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return false;
      }
      if (filters.module && c.module !== filters.module) return false;
      if (filters.severity && c.severity !== filters.severity) return false;
      if (filters.status !== 'all' && c.status !== filters.status) return false;
      if (filters.ownerRole !== 'all' && c.ownerRole !== filters.ownerRole) return false;
      if (filters.slaOverdue) {
        if (!c.slaDueAt || new Date(c.slaDueAt) >= now || c.status === 'resolved' || c.status === 'waived') return false;
      }
      return true;
    });
  }, [cases, filters]);

  const kpis = useMemo(() => {
    const open = cases.filter(c => !['resolved', 'waived'].includes(c.status));
    const now = new Date();
    const overdue = open.filter(c => c.slaDueAt && new Date(c.slaDueAt) < now);
    const totalAmount = open.reduce((s, c) => s + (c.amount || 0), 0);
    const byModule = MODULES.reduce((acc, m) => {
      acc[m] = cases.filter(c => c.module === m && !['resolved', 'waived'].includes(c.status)).length;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOpen: open.length,
      critical: open.filter(c => c.severity === 'critical').length,
      slaOverdue: overdue.length,
      totalAmountAtRisk: totalAmount,
      byModule,
      modules: MODULES,
    };
  }, [cases]);

  return { cases: filtered, allCases: cases, filters, setFilters, kpis };
}
