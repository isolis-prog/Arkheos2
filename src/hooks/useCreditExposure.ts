import { useState, useMemo } from 'react';

export interface CreditLimit {
  id: string;
  counterparty: string;
  limitAmount: number;
  limitCurrency: string;
  warningPct: number;
  nettingSet: string | null;
  collateralHeld: number;
  guaranteeAmount: number;
  guaranteeProvider: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  validFrom: string;
  validTo: string | null;
  status: string;
}

export interface ARAgingBucket {
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days90plus: number;
}

export interface CreditDispute {
  id: string;
  counterparty: string;
  invoiceRef: string;
  amount: number;
  currency: string;
  disputeType: 'pricing' | 'quality' | 'quantity' | 'documentation' | 'other';
  status: 'open' | 'under_review' | 'resolved' | 'escalated';
  raisedAt: string;
  assignedTo: string | null;
}

export interface CreditMemo {
  id: string;
  counterparty: string;
  memoRef: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'draft' | 'approved' | 'applied';
  createdAt: string;
}

export interface ExposureSnapshot {
  id: string;
  counterparty: string;
  snapshotDate: string;
  mtmExposure: number;
  arOutstanding: number;
  apOutstanding: number;
  collateralOffset: number;
  netExposure: number;
  limitAmount: number | null;
  headroom: number | null;
  utilisationPct: number | null;
  dsoDays: number | null;
  currency: string;
  sourceSystems: string[];
  // M7 additions
  arAging: ARAgingBucket;
  arOverdue: number;
  disputeAmount: number;
  creditMemoAmount: number;
  paymentHold: boolean;
  recommendedAction: string | null;
  trafficLight: 'green' | 'amber' | 'red';
  ownerRole: string;
}

export interface CreditAlert {
  id: string;
  counterparty: string;
  alertType: 'breach' | 'warning' | 'concentration' | 'aging_deterioration' | 'dispute_escalation' | 'payment_hold';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metricValue: number | null;
  thresholdValue: number | null;
  isAcknowledged: boolean;
  acknowledgedBy: string | null;
  createdAt: string;
}

const demoLimits: CreditLimit[] = [
  { id: '1', counterparty: 'Shell Trading', limitAmount: 50000000, limitCurrency: 'USD', warningPct: 80, nettingSet: 'NS-SHELL-01', collateralHeld: 5000000, guaranteeAmount: 10000000, guaranteeProvider: 'HSBC', approvedBy: 'M. Chen', approvedAt: '2026-01-15', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active' },
  { id: '2', counterparty: 'Vitol SA', limitAmount: 75000000, limitCurrency: 'USD', warningPct: 75, nettingSet: 'NS-VITOL-01', collateralHeld: 8000000, guaranteeAmount: 0, guaranteeProvider: null, approvedBy: 'R. Singh', approvedAt: '2026-02-01', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active' },
  { id: '3', counterparty: 'Trafigura', limitAmount: 60000000, limitCurrency: 'USD', warningPct: 80, nettingSet: 'NS-TRAF-01', collateralHeld: 3000000, guaranteeAmount: 5000000, guaranteeProvider: 'Deutsche Bank', approvedBy: 'M. Chen', approvedAt: '2026-01-20', validFrom: '2026-01-01', validTo: '2026-06-30', status: 'active' },
  { id: '4', counterparty: 'Glencore', limitAmount: 100000000, limitCurrency: 'USD', warningPct: 70, nettingSet: 'NS-GLEN-01', collateralHeld: 12000000, guaranteeAmount: 20000000, guaranteeProvider: 'JPMorgan', approvedBy: 'R. Singh', approvedAt: '2026-01-10', validFrom: '2026-01-01', validTo: '2027-01-01', status: 'active' },
  { id: '5', counterparty: 'Mercuria', limitAmount: 40000000, limitCurrency: 'USD', warningPct: 80, nettingSet: null, collateralHeld: 0, guaranteeAmount: 0, guaranteeProvider: null, approvedBy: 'M. Chen', approvedAt: '2025-12-15', validFrom: '2025-12-01', validTo: '2026-06-30', status: 'active' },
  { id: '6', counterparty: 'Koch Industries', limitAmount: 30000000, limitCurrency: 'USD', warningPct: 85, nettingSet: 'NS-KOCH-01', collateralHeld: 2000000, guaranteeAmount: 0, guaranteeProvider: null, approvedBy: 'R. Singh', approvedAt: '2026-01-05', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active' },
  { id: '7', counterparty: 'BP Energy', limitAmount: 80000000, limitCurrency: 'USD', warningPct: 75, nettingSet: 'NS-BP-01', collateralHeld: 6000000, guaranteeAmount: 15000000, guaranteeProvider: 'Barclays', approvedBy: 'M. Chen', approvedAt: '2026-01-18', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active' },
  { id: '8', counterparty: 'Total Energies', limitAmount: 65000000, limitCurrency: 'USD', warningPct: 80, nettingSet: 'NS-TOT-01', collateralHeld: 4500000, guaranteeAmount: 0, guaranteeProvider: null, approvedBy: 'R. Singh', approvedAt: '2026-01-22', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active' },
  { id: '9', counterparty: 'Equinor', limitAmount: 55000000, limitCurrency: 'USD', warningPct: 80, nettingSet: 'NS-EQN-01', collateralHeld: 3500000, guaranteeAmount: 8000000, guaranteeProvider: 'Nordea', approvedBy: 'M. Chen', approvedAt: '2026-02-05', validFrom: '2026-02-01', validTo: '2027-01-31', status: 'active' },
  { id: '10', counterparty: 'Gunvor Group', limitAmount: 25000000, limitCurrency: 'USD', warningPct: 85, nettingSet: null, collateralHeld: 1500000, guaranteeAmount: 0, guaranteeProvider: null, approvedBy: 'R. Singh', approvedAt: '2026-01-12', validFrom: '2026-01-01', validTo: '2026-09-30', status: 'active' },
  { id: '11', counterparty: 'Cargill Energy', limitAmount: 45000000, limitCurrency: 'USD', warningPct: 80, nettingSet: 'NS-CGL-01', collateralHeld: 2800000, guaranteeAmount: 5000000, guaranteeProvider: 'Wells Fargo', approvedBy: 'M. Chen', approvedAt: '2026-01-30', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active' },
  { id: '12', counterparty: 'Repsol Trading', limitAmount: 35000000, limitCurrency: 'USD', warningPct: 80, nettingSet: 'NS-REP-01', collateralHeld: 2200000, guaranteeAmount: 4000000, guaranteeProvider: 'Santander', approvedBy: 'R. Singh', approvedAt: '2026-02-08', validFrom: '2026-02-01', validTo: '2026-12-31', status: 'active' },
  { id: '13', counterparty: 'PetroChina Intl', limitAmount: 20000000, limitCurrency: 'USD', warningPct: 90, nettingSet: null, collateralHeld: 5000000, guaranteeAmount: 0, guaranteeProvider: null, approvedBy: 'M. Chen', approvedAt: '2026-01-25', validFrom: '2026-01-01', validTo: '2026-06-30', status: 'active' },
  { id: '14', counterparty: 'Aramco Trading', limitAmount: 90000000, limitCurrency: 'USD', warningPct: 70, nettingSet: 'NS-ARC-01', collateralHeld: 0, guaranteeAmount: 25000000, guaranteeProvider: 'JPMorgan', approvedBy: 'R. Singh', approvedAt: '2026-01-08', validFrom: '2026-01-01', validTo: '2027-01-01', status: 'active' },
  { id: '15', counterparty: 'Phillips 66', limitAmount: 50000000, limitCurrency: 'USD', warningPct: 80, nettingSet: 'NS-P66-01', collateralHeld: 3200000, guaranteeAmount: 0, guaranteeProvider: null, approvedBy: 'M. Chen', approvedAt: '2026-02-12', validFrom: '2026-02-01', validTo: '2026-12-31', status: 'active' },
];

// AR aging demo data per counterparty (15 entries to match limits)
const demoAgingData: ARAgingBucket[] = [
  { current: 4000000, days30: 2500000, days60: 1000000, days90: 400000, days90plus: 100000 },
  { current: 5000000, days30: 3500000, days60: 2000000, days90: 1200000, days90plus: 300000 },
  { current: 2500000, days30: 1500000, days60: 1200000, days90: 500000, days90plus: 300000 },
  { current: 8000000, days30: 4000000, days60: 2000000, days90: 800000, days90plus: 200000 },
  { current: 1500000, days30: 1000000, days60: 800000, days90: 500000, days90plus: 200000 },
  { current: 1500000, days30: 800000, days60: 400000, days90: 200000, days90plus: 100000 },
  { current: 6000000, days30: 3200000, days60: 1500000, days90: 600000, days90plus: 150000 },
  { current: 4800000, days30: 2800000, days60: 1100000, days90: 350000, days90plus: 80000 },
  { current: 3500000, days30: 2000000, days60: 900000, days90: 400000, days90plus: 120000 },
  { current: 1200000, days30: 700000, days60: 500000, days90: 300000, days90plus: 180000 },
  { current: 3200000, days30: 1800000, days60: 700000, days90: 250000, days90plus: 60000 },
  { current: 2400000, days30: 1300000, days60: 550000, days90: 200000, days90plus: 70000 },
  { current: 800000, days30: 600000, days60: 700000, days90: 600000, days90plus: 450000 },
  { current: 9500000, days30: 4200000, days60: 1500000, days90: 400000, days90plus: 100000 },
  { current: 3800000, days30: 2100000, days60: 850000, days90: 300000, days90plus: 90000 },
];

const demoDisputes: CreditDispute[] = [
  { id: 'd1', counterparty: 'Vitol SA', invoiceRef: 'INV-2026-1042', amount: 1250000, currency: 'USD', disputeType: 'pricing', status: 'open', raisedAt: '2026-02-15', assignedTo: 'L. Fernandez' },
  { id: 'd2', counterparty: 'Trafigura', invoiceRef: 'INV-2026-0987', amount: 800000, currency: 'USD', disputeType: 'quantity', status: 'under_review', raisedAt: '2026-02-10', assignedTo: 'K. Rao' },
  { id: 'd3', counterparty: 'Trafigura', invoiceRef: 'INV-2026-0991', amount: 350000, currency: 'USD', disputeType: 'documentation', status: 'escalated', raisedAt: '2026-02-08', assignedTo: 'K. Rao' },
  { id: 'd4', counterparty: 'Mercuria', invoiceRef: 'INV-2026-0876', amount: 620000, currency: 'USD', disputeType: 'quality', status: 'open', raisedAt: '2026-02-18', assignedTo: null },
  { id: 'd5', counterparty: 'Shell Trading', invoiceRef: 'INV-2026-1100', amount: 180000, currency: 'USD', disputeType: 'pricing', status: 'resolved', raisedAt: '2026-01-28', assignedTo: 'L. Fernandez' },
  { id: 'd6', counterparty: 'PetroChina Intl', invoiceRef: 'INV-2026-1180', amount: 980000, currency: 'USD', disputeType: 'pricing', status: 'escalated', raisedAt: '2026-02-19', assignedTo: 'K. Rao' },
  { id: 'd7', counterparty: 'Gunvor Group', invoiceRef: 'INV-2026-1205', amount: 540000, currency: 'USD', disputeType: 'quantity', status: 'under_review', raisedAt: '2026-02-16', assignedTo: 'L. Fernandez' },
  { id: 'd8', counterparty: 'BP Energy', invoiceRef: 'INV-2026-1250', amount: 220000, currency: 'USD', disputeType: 'documentation', status: 'open', raisedAt: '2026-02-20', assignedTo: null },
  { id: 'd9', counterparty: 'Total Energies', invoiceRef: 'INV-2026-1267', amount: 410000, currency: 'USD', disputeType: 'quality', status: 'resolved', raisedAt: '2026-01-30', assignedTo: 'K. Rao' },
  { id: 'd10', counterparty: 'Glencore', invoiceRef: 'INV-2026-1289', amount: 1850000, currency: 'USD', disputeType: 'pricing', status: 'open', raisedAt: '2026-02-21', assignedTo: 'L. Fernandez' },
  { id: 'd11', counterparty: 'Cargill Energy', invoiceRef: 'INV-2026-1295', amount: 290000, currency: 'USD', disputeType: 'other', status: 'under_review', raisedAt: '2026-02-14', assignedTo: 'K. Rao' },
];

const demoCreditMemos: CreditMemo[] = [
  { id: 'cm1', counterparty: 'Vitol SA', memoRef: 'CM-2026-042', amount: 500000, currency: 'USD', reason: 'Pricing adjustment Q1', status: 'approved', createdAt: '2026-02-12' },
  { id: 'cm2', counterparty: 'Trafigura', memoRef: 'CM-2026-039', amount: 200000, currency: 'USD', reason: 'Quality claim settlement', status: 'applied', createdAt: '2026-02-05' },
  { id: 'cm3', counterparty: 'Mercuria', memoRef: 'CM-2026-045', amount: 150000, currency: 'USD', reason: 'Short delivery compensation', status: 'draft', createdAt: '2026-02-19' },
  { id: 'cm4', counterparty: 'Shell Trading', memoRef: 'CM-2026-051', amount: 320000, currency: 'USD', reason: 'Demurrage offset', status: 'approved', createdAt: '2026-02-15' },
  { id: 'cm5', counterparty: 'BP Energy', memoRef: 'CM-2026-053', amount: 175000, currency: 'USD', reason: 'Quality bonus reversal', status: 'applied', createdAt: '2026-02-10' },
  { id: 'cm6', counterparty: 'Glencore', memoRef: 'CM-2026-061', amount: 680000, currency: 'USD', reason: 'Volume rebate Q4 2025', status: 'approved', createdAt: '2026-02-18' },
  { id: 'cm7', counterparty: 'PetroChina Intl', memoRef: 'CM-2026-068', amount: 240000, currency: 'USD', reason: 'Settlement netting', status: 'draft', createdAt: '2026-02-20' },
  { id: 'cm8', counterparty: 'Aramco Trading', memoRef: 'CM-2026-072', amount: 850000, currency: 'USD', reason: 'Annual loyalty discount', status: 'applied', createdAt: '2026-01-31' },
];

const paymentHolds = new Set(['Mercuria', 'Trafigura', 'PetroChina Intl']);

function deriveTrafficLight(util: number, arOverdue: number, arTotal: number, disputeAmt: number, hasHold: boolean): 'green' | 'amber' | 'red' {
  const overduePct = arTotal > 0 ? (arOverdue / arTotal) * 100 : 0;
  if (util > 100 || hasHold || overduePct > 30) return 'red';
  if (util >= 75 || overduePct > 15 || disputeAmt > 500000) return 'amber';
  return 'green';
}

function deriveAction(util: number, arOverdue: number, arTotal: number, disputeAmt: number, hasHold: boolean): string | null {
  if (hasHold) return 'Payment hold active — escalate to Credit Committee';
  if (util > 100) return 'Limit breached — recommend trading halt & margin call';
  const overduePct = arTotal > 0 ? (arOverdue / arTotal) * 100 : 0;
  if (overduePct > 30 && util > 75) return 'High overdue + utilisation — recommend limit reduction';
  if (overduePct > 30) return 'Overdue AR rising — escalate to Collections';
  if (disputeAmt > 1000000) return 'Material disputes — exclude from collectable & review';
  if (util > 80) return 'Approaching limit — monitor closely';
  return null;
}

const demoSnapshots: ExposureSnapshot[] = demoLimits.map((l, i) => {
  const mtm = [32000000, 68000000, 55000000, 72000000, 35000000, 28000000, 58000000, 48000000, 39000000, 22000000, 31000000, 26000000, 17000000, 65000000, 36000000][i];
  const aging = demoAgingData[i];
  const arTotal = aging.current + aging.days30 + aging.days60 + aging.days90 + aging.days90plus;
  const arOverdue = aging.days60 + aging.days90 + aging.days90plus;
  const ap = [3000000, 5000000, 2000000, 8000000, 1000000, 1500000, 4200000, 3500000, 2800000, 800000, 2400000, 1900000, 600000, 7500000, 3100000][i];
  const collateral = l.collateralHeld;
  const cpDisputes = demoDisputes.filter(d => d.counterparty === l.counterparty && d.status !== 'resolved');
  const disputeAmt = cpDisputes.reduce((s, d) => s + d.amount, 0);
  const cpMemos = demoCreditMemos.filter(m => m.counterparty === l.counterparty && m.status !== 'draft');
  const creditMemoAmt = cpMemos.reduce((s, m) => s + m.amount, 0);
  const hasHold = paymentHolds.has(l.counterparty);
  const net = mtm + arTotal - ap - collateral;
  const headroom = l.limitAmount - net;
  const util = Math.round((net / l.limitAmount) * 1000) / 10;
  const dso = [42, 38, 55, 31, 67, 44, 36, 41, 39, 71, 45, 48, 82, 28, 43][i];
  const tl = deriveTrafficLight(util, arOverdue, arTotal, disputeAmt, hasHold);
  const action = deriveAction(util, arOverdue, arTotal, disputeAmt, hasHold);

  return {
    id: `snap-${i}`,
    counterparty: l.counterparty,
    snapshotDate: '2026-02-21',
    mtmExposure: mtm,
    arOutstanding: arTotal,
    apOutstanding: ap,
    collateralOffset: collateral,
    netExposure: net,
    limitAmount: l.limitAmount,
    headroom,
    utilisationPct: util,
    dsoDays: dso,
    currency: 'USD',
    sourceSystems: ['ETRM', 'ERP', 'Collateral Mgmt'],
    arAging: aging,
    arOverdue,
    disputeAmount: disputeAmt,
    creditMemoAmount: creditMemoAmt,
    paymentHold: hasHold,
    recommendedAction: action,
    trafficLight: tl,
    ownerRole: tl === 'red' ? 'MO/Credit' : 'BO AR',
  };
});

const demoAlerts: CreditAlert[] = [
  { id: 'a1', counterparty: 'Vitol SA', alertType: 'breach', severity: 'critical', message: 'Net exposure exceeds credit limit by $500K', metricValue: 75500000, thresholdValue: 75000000, isAcknowledged: false, acknowledgedBy: null, createdAt: '2026-02-21T08:30:00Z' },
  { id: 'a2', counterparty: 'Trafigura', alertType: 'warning', severity: 'warning', message: 'Utilisation at 93.3% — approaching limit', metricValue: 93.3, thresholdValue: 80, isAcknowledged: false, acknowledgedBy: null, createdAt: '2026-02-21T07:00:00Z' },
  { id: 'a3', counterparty: 'Mercuria', alertType: 'aging_deterioration', severity: 'warning', message: 'DSO increased from 45 to 67 days (49% deterioration)', metricValue: 67, thresholdValue: 45, isAcknowledged: false, acknowledgedBy: null, createdAt: '2026-02-20T16:00:00Z' },
  { id: 'a4', counterparty: 'Shell Trading', alertType: 'concentration', severity: 'info', message: 'Top 3 counterparties represent 54% of total exposure', metricValue: 54, thresholdValue: 50, isAcknowledged: true, acknowledgedBy: 'J. Torres', createdAt: '2026-02-19T10:00:00Z' },
  { id: 'a5', counterparty: 'Mercuria', alertType: 'payment_hold', severity: 'critical', message: 'Payment hold active — new shipments blocked', metricValue: null, thresholdValue: null, isAcknowledged: false, acknowledgedBy: null, createdAt: '2026-02-21T09:00:00Z' },
  { id: 'a6', counterparty: 'Trafigura', alertType: 'dispute_escalation', severity: 'warning', message: '2 disputes totalling $1.15M — 1 escalated', metricValue: 1150000, thresholdValue: 500000, isAcknowledged: false, acknowledgedBy: null, createdAt: '2026-02-20T14:00:00Z' },
  { id: 'a7', counterparty: 'PetroChina Intl', alertType: 'payment_hold', severity: 'critical', message: 'Payment hold — credit downgrade triggered', metricValue: null, thresholdValue: null, isAcknowledged: false, acknowledgedBy: null, createdAt: '2026-02-21T05:30:00Z' },
  { id: 'a8', counterparty: 'PetroChina Intl', alertType: 'aging_deterioration', severity: 'critical', message: 'DSO at 82 days — collections action required', metricValue: 82, thresholdValue: 60, isAcknowledged: false, acknowledgedBy: null, createdAt: '2026-02-21T06:00:00Z' },
  { id: 'a9', counterparty: 'Glencore', alertType: 'dispute_escalation', severity: 'warning', message: 'Pricing dispute $1.85M raised today', metricValue: 1850000, thresholdValue: 1000000, isAcknowledged: false, acknowledgedBy: null, createdAt: '2026-02-21T11:00:00Z' },
  { id: 'a10', counterparty: 'Gunvor Group', alertType: 'aging_deterioration', severity: 'warning', message: 'AR overdue >60d represents 36% of total', metricValue: 36, thresholdValue: 30, isAcknowledged: false, acknowledgedBy: null, createdAt: '2026-02-20T18:00:00Z' },
  { id: 'a11', counterparty: 'BP Energy', alertType: 'concentration', severity: 'info', message: 'New $80M facility approved — 8% of total limits', metricValue: 8, thresholdValue: 10, isAcknowledged: true, acknowledgedBy: 'M. Chen', createdAt: '2026-01-19T15:00:00Z' },
  { id: 'a12', counterparty: 'Aramco Trading', alertType: 'warning', severity: 'info', message: 'Quarterly review due in 30 days', metricValue: null, thresholdValue: null, isAcknowledged: false, acknowledgedBy: null, createdAt: '2026-02-21T08:00:00Z' },
];

export function useCreditExposure() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [trafficFilter, setTrafficFilter] = useState<string>('all');

  const filteredSnapshots = useMemo(() => {
    return demoSnapshots.filter(s => {
      if (searchQuery && !s.counterparty.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (trafficFilter !== 'all' && s.trafficLight !== trafficFilter) return false;
      return true;
    });
  }, [searchQuery, trafficFilter]);

  const totalNetExposure = demoSnapshots.reduce((s, e) => s + e.netExposure, 0);
  const totalLimits = demoSnapshots.reduce((s, e) => s + (e.limitAmount || 0), 0);
  const totalHeadroom = demoSnapshots.reduce((s, e) => s + (e.headroom || 0), 0);
  const breachCount = demoAlerts.filter(a => a.alertType === 'breach' && !a.isAcknowledged).length;
  const openAlerts = demoAlerts.filter(a => !a.isAcknowledged).length;
  const avgDso = Math.round(demoSnapshots.reduce((s, e) => s + (e.dsoDays || 0), 0) / demoSnapshots.length);
  const avgUtilisation = Math.round((totalNetExposure / totalLimits) * 1000) / 10;
  const totalOverdue = demoSnapshots.reduce((s, e) => s + e.arOverdue, 0);
  const totalDisputes = demoDisputes.filter(d => d.status !== 'resolved').reduce((s, d) => s + d.amount, 0);
  const holdsCount = demoSnapshots.filter(s => s.paymentHold).length;
  const redCount = demoSnapshots.filter(s => s.trafficLight === 'red').length;

  return {
    limits: demoLimits,
    snapshots: filteredSnapshots,
    allSnapshots: demoSnapshots,
    alerts: demoAlerts,
    disputes: demoDisputes,
    creditMemos: demoCreditMemos,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    trafficFilter,
    setTrafficFilter,
    kpis: {
      totalNetExposure,
      totalLimits,
      totalHeadroom,
      breachCount,
      openAlerts,
      avgDso,
      avgUtilisation,
      totalOverdue,
      totalDisputes,
      holdsCount,
      redCount,
    },
    loading: false,
  };
}
