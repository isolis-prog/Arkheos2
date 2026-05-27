import { useState, useMemo } from 'react';

export interface MarginStatement {
  id: string;
  statementDate: string;
  counterparty: string;
  clearingBroker: string | null;
  nettingSet: string | null;
  portfolio: string | null;
  agreementType: string;
  baseCurrency: string;
  totalIm: number;
  totalVm: number;
  netExposure: number;
  threshold: number;
  mta: number;
  marginCallAmount: number;
  collateralHeld: number;
  collateralPosted: number;
  interestAccrued: number;
  source: string;
  status: 'received' | 'validated' | 'reconciled' | 'disputed' | 'settled';
}

export interface CollateralBalance {
  id: string;
  asOfDate: string;
  counterparty: string;
  nettingSet: string | null;
  currency: string;
  collateralType: string;
  amount: number;
  amountBase: number;
  direction: string;
  custodian: string | null;
  glAccount: string | null;
  glBalance: number | null;
  glDelta: number;
}

export interface MarginRecon {
  id: string;
  reconDate: string;
  counterparty: string;
  nettingSet: string | null;
  ourIm: number;
  theirIm: number;
  deltaIm: number;
  ourVm: number;
  theirVm: number;
  deltaVm: number;
  ourCollateral: number;
  theirCollateral: number;
  deltaCollateral: number;
  glBalance: number;
  glDelta: number;
  disputeFlag: boolean;
  disputeStatus: 'open' | 'submitted' | 'acknowledged' | 'resolved' | 'escalated' | null;
  disputeReason: string | null;
  resolutionNotes: string | null;
}

// Demo data
const demoStatements: MarginStatement[] = [
  { id: 'ms-1', statementDate: '2026-02-20', counterparty: 'JP Morgan', clearingBroker: 'JPMC Clearing', nettingSet: 'NS-JPM-001', portfolio: 'Energy Derivatives', agreementType: 'CSA', baseCurrency: 'USD', totalIm: 12500000, totalVm: 3200000, netExposure: 15700000, threshold: 500000, mta: 250000, marginCallAmount: 2850000, collateralHeld: 8500000, collateralPosted: 14200000, interestAccrued: 12400, source: 'broker', status: 'reconciled' },
  { id: 'ms-2', statementDate: '2026-02-20', counterparty: 'Goldman Sachs', clearingBroker: 'GS Clearing', nettingSet: 'NS-GS-002', portfolio: 'FX Book', agreementType: 'CSA', baseCurrency: 'USD', totalIm: 8900000, totalVm: -1500000, netExposure: 7400000, threshold: 1000000, mta: 500000, marginCallAmount: 0, collateralHeld: 5200000, collateralPosted: 9100000, interestAccrued: 8200, source: 'broker', status: 'disputed' },
  { id: 'ms-3', statementDate: '2026-02-20', counterparty: 'ICE Clear', clearingBroker: null, nettingSet: 'ICE-ENERGY', portfolio: 'Power & Gas', agreementType: 'CCP', baseCurrency: 'USD', totalIm: 22000000, totalVm: 5600000, netExposure: 27600000, threshold: 0, mta: 0, marginCallAmount: 5600000, collateralHeld: 0, collateralPosted: 27800000, interestAccrued: 32100, source: 'ccp', status: 'validated' },
  { id: 'ms-4', statementDate: '2026-02-20', counterparty: 'Barclays', clearingBroker: 'Barclays Clearing', nettingSet: 'NS-BARC-001', portfolio: 'Metals', agreementType: 'CSA', baseCurrency: 'USD', totalIm: 5400000, totalVm: 800000, netExposure: 6200000, threshold: 250000, mta: 100000, marginCallAmount: 650000, collateralHeld: 3100000, collateralPosted: 5800000, interestAccrued: 4100, source: 'broker', status: 'received' },
  { id: 'ms-5', statementDate: '2026-02-19', counterparty: 'CME Group', clearingBroker: null, nettingSet: 'CME-AG', portfolio: 'Agriculture', agreementType: 'CCP', baseCurrency: 'USD', totalIm: 18000000, totalVm: -2300000, netExposure: 15700000, threshold: 0, mta: 0, marginCallAmount: 0, collateralHeld: 0, collateralPosted: 18200000, interestAccrued: 21500, source: 'ccp', status: 'settled' },
];

const demoCollateral: CollateralBalance[] = [
  { id: 'cb-1', asOfDate: '2026-02-20', counterparty: 'JP Morgan', nettingSet: 'NS-JPM-001', currency: 'USD', collateralType: 'cash', amount: 10200000, amountBase: 10200000, direction: 'posted', custodian: 'BNY Mellon', glAccount: '1200-001', glBalance: 10200000, glDelta: 0 },
  { id: 'cb-2', asOfDate: '2026-02-20', counterparty: 'JP Morgan', nettingSet: 'NS-JPM-001', currency: 'EUR', collateralType: 'cash', amount: 3500000, amountBase: 3780000, direction: 'posted', custodian: 'BNY Mellon', glAccount: '1200-002', glBalance: 3760000, glDelta: -20000 },
  { id: 'cb-3', asOfDate: '2026-02-20', counterparty: 'Goldman Sachs', nettingSet: 'NS-GS-002', currency: 'USD', collateralType: 'cash', amount: 9100000, amountBase: 9100000, direction: 'posted', custodian: 'State Street', glAccount: '1200-003', glBalance: 9050000, glDelta: -50000 },
  { id: 'cb-4', asOfDate: '2026-02-20', counterparty: 'Goldman Sachs', nettingSet: 'NS-GS-002', currency: 'USD', collateralType: 'tbill', amount: 5200000, amountBase: 5200000, direction: 'received', custodian: 'State Street', glAccount: '1300-001', glBalance: 5200000, glDelta: 0 },
  { id: 'cb-5', asOfDate: '2026-02-20', counterparty: 'ICE Clear', nettingSet: 'ICE-ENERGY', currency: 'USD', collateralType: 'cash', amount: 27800000, amountBase: 27800000, direction: 'posted', custodian: 'ICE Trust', glAccount: '1200-005', glBalance: 27800000, glDelta: 0 },
];

const demoRecon: MarginRecon[] = [
  { id: 'mr-1', reconDate: '2026-02-20', counterparty: 'JP Morgan', nettingSet: 'NS-JPM-001', ourIm: 12500000, theirIm: 12500000, deltaIm: 0, ourVm: 3200000, theirVm: 3200000, deltaVm: 0, ourCollateral: 14200000, theirCollateral: 14200000, deltaCollateral: 0, glBalance: 13980000, glDelta: -220000, disputeFlag: false, disputeStatus: null, disputeReason: null, resolutionNotes: null },
  { id: 'mr-2', reconDate: '2026-02-20', counterparty: 'Goldman Sachs', nettingSet: 'NS-GS-002', ourIm: 8900000, theirIm: 9150000, deltaIm: 250000, ourVm: -1500000, theirVm: -1350000, deltaVm: 150000, ourCollateral: 9100000, theirCollateral: 9100000, deltaCollateral: 0, glBalance: 9050000, glDelta: -50000, disputeFlag: true, disputeStatus: 'open', disputeReason: 'IM calculation discrepancy — different VAR model parameters', resolutionNotes: null },
  { id: 'mr-3', reconDate: '2026-02-20', counterparty: 'ICE Clear', nettingSet: 'ICE-ENERGY', ourIm: 22000000, theirIm: 22000000, deltaIm: 0, ourVm: 5600000, theirVm: 5620000, deltaVm: 20000, ourCollateral: 27800000, theirCollateral: 27800000, deltaCollateral: 0, glBalance: 27800000, glDelta: 0, disputeFlag: false, disputeStatus: null, disputeReason: null, resolutionNotes: null },
  { id: 'mr-4', reconDate: '2026-02-20', counterparty: 'Barclays', nettingSet: 'NS-BARC-001', ourIm: 5400000, theirIm: 5400000, deltaIm: 0, ourVm: 800000, theirVm: 830000, deltaVm: 30000, ourCollateral: 5800000, theirCollateral: 5800000, deltaCollateral: 0, glBalance: 5780000, glDelta: -20000, disputeFlag: true, disputeStatus: 'submitted', disputeReason: 'VM calc uses different fixing date (T vs T-1)', resolutionNotes: null },
  { id: 'mr-5', reconDate: '2026-02-19', counterparty: 'CME Group', nettingSet: 'CME-AG', ourIm: 18000000, theirIm: 18000000, deltaIm: 0, ourVm: -2300000, theirVm: -2300000, deltaVm: 0, ourCollateral: 18200000, theirCollateral: 18200000, deltaCollateral: 0, glBalance: 18200000, glDelta: 0, disputeFlag: false, disputeStatus: null, disputeReason: null, resolutionNotes: 'Clean match' },
];

export function useCollateralMargin() {
  const [counterpartyFilter, setCounterpartyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('2026-02-20');
  const [activeTab, setActiveTab] = useState('overview');

  const statements = useMemo(() => {
    return demoStatements.filter(s => {
      if (counterpartyFilter !== 'all' && s.counterparty !== counterpartyFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      return true;
    });
  }, [counterpartyFilter, statusFilter]);

  const recons = useMemo(() => {
    return demoRecon.filter(r => {
      if (counterpartyFilter !== 'all' && r.counterparty !== counterpartyFilter) return false;
      return true;
    });
  }, [counterpartyFilter]);

  const disputes = useMemo(() => demoRecon.filter(r => r.disputeFlag), []);

  const kpis = useMemo(() => {
    const totalPosted = demoStatements.reduce((s, st) => s + st.collateralPosted, 0);
    const totalHeld = demoStatements.reduce((s, st) => s + st.collateralHeld, 0);
    const totalDelta = demoRecon.reduce((s, r) => s + Math.abs(r.deltaIm) + Math.abs(r.deltaVm), 0);
    const openDisputes = disputes.length;
    const totalMarginCall = demoStatements.reduce((s, st) => s + st.marginCallAmount, 0);
    const glDelta = demoRecon.reduce((s, r) => s + Math.abs(r.glDelta), 0);

    return { totalPosted, totalHeld, totalDelta, openDisputes, totalMarginCall, glDelta };
  }, [disputes]);

  const counterparties = [...new Set(demoStatements.map(s => s.counterparty))];

  return {
    statements,
    collateral: demoCollateral,
    recons,
    disputes,
    kpis,
    counterparties,
    counterpartyFilter, setCounterpartyFilter,
    statusFilter, setStatusFilter,
    dateFilter, setDateFilter,
    activeTab, setActiveTab,
  };
}
