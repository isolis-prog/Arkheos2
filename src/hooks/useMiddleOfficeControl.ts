import { useState, useMemo } from 'react';

export interface DealReview {
  id: string;
  trade_ref: string;
  desk: string;
  trader: string;
  counterparty: string;
  instrument: string;
  notional: number;
  currency: string;
  trade_date: string;
  review_status: string;
  risk_flags: string[];
  reviewer: string | null;
  reviewed_at: string | null;
  comments: string | null;
}

export interface MODailyPnL {
  id: string;
  desk_id: string;
  pnl_date: string;
  mo_pnl_usd: number;
  fo_pnl_usd: number;
  variance_usd: number;
  variance_pct: number;
  status: string;
  approved_by: string | null;
}

export interface BreachResponse {
  id: string;
  breach_id: string;
  desk: string;
  limit_type: string;
  breach_amount: number;
  response_type: string;
  responder: string | null;
  response_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface DailySignoff {
  id: string;
  desk_id: string;
  signoff_date: string;
  signed_by: string | null;
  status: string;
  gross_exposure: number;
  net_exposure: number;
  var_1d: number;
  limit_util_pct: number;
  open_issues: string | null;
}

export interface IPVPosition {
  id: string;
  position_ref: string;
  desk: string;
  instrument: string;
  notional: number;
  system_price: number;
  mo_price: number;
  variance: number;
  variance_pct: number;
  adjustment: number | null;
  justification: string | null;
}

const demoDealReviews: DealReview[] = [
  { id: '1', trade_ref: 'T-2026-1201', desk: 'Crude Americas', trader: 'M. Rodriguez', counterparty: 'Vitol SA', instrument: 'WTI Swap', notional: 85000000, currency: 'USD', trade_date: '2026-04-10', review_status: 'PENDING', risk_flags: ['Near credit limit', 'Position breach after trade'], reviewer: null, reviewed_at: null, comments: null },
  { id: '2', trade_ref: 'T-2026-1202', desk: 'Products EMEA', trader: 'J. Schmidt', counterparty: 'BP Trading', instrument: 'Gasoil Physical', notional: 42000000, currency: 'USD', trade_date: '2026-04-10', review_status: 'PENDING', risk_flags: ['Price deviation >3%'], reviewer: null, reviewed_at: null, comments: null },
  { id: '3', trade_ref: 'T-2026-1198', desk: 'Gas & Power', trader: 'S. Chen', counterparty: 'Shell Energy', instrument: 'Henry Hub Swap', notional: 28000000, currency: 'USD', trade_date: '2026-04-09', review_status: 'APPROVED', risk_flags: [], reviewer: 'A. Thompson', reviewed_at: '2026-04-09T16:30:00Z', comments: 'Standard flow, within limits' },
  { id: '4', trade_ref: 'T-2026-1199', desk: 'Crude Americas', trader: 'M. Rodriguez', counterparty: 'NewCo Energy Ltd', instrument: 'Brent Physical', notional: 56000000, currency: 'USD', trade_date: '2026-04-09', review_status: 'QUERIED', risk_flags: ['New counterparty', 'Off-market terms'], reviewer: 'A. Thompson', reviewed_at: '2026-04-09T17:00:00Z', comments: 'Need credit file confirmation for NewCo' },
  { id: '5', trade_ref: 'T-2026-1200', desk: 'FX Desk', trader: 'L. Park', counterparty: 'JPMorgan', instrument: 'EUR/USD FWD', notional: 120000000, currency: 'USD', trade_date: '2026-04-10', review_status: 'ESCALATED', risk_flags: ['Position breach after trade', 'Unusual size'], reviewer: 'A. Thompson', reviewed_at: '2026-04-10T09:15:00Z', comments: 'Escalated to Head of MO — notional exceeds desk limit' },
];

const demoDailyPnL: MODailyPnL[] = [
  { id: '1', desk_id: 'Crude Americas', pnl_date: '2026-04-10', mo_pnl_usd: 1250000, fo_pnl_usd: 1320000, variance_usd: -70000, variance_pct: -5.3, status: 'PENDING', approved_by: null },
  { id: '2', desk_id: 'Products EMEA', pnl_date: '2026-04-10', mo_pnl_usd: -430000, fo_pnl_usd: -380000, variance_usd: -50000, variance_pct: -13.2, status: 'MO_EXPLAIN_REQUIRED', approved_by: null },
  { id: '3', desk_id: 'Gas & Power', pnl_date: '2026-04-10', mo_pnl_usd: 890000, fo_pnl_usd: 910000, variance_usd: -20000, variance_pct: -2.2, status: 'EXPLAINED', approved_by: null },
  { id: '4', desk_id: 'FX Desk', pnl_date: '2026-04-10', mo_pnl_usd: 320000, fo_pnl_usd: 315000, variance_usd: 5000, variance_pct: 1.6, status: 'APPROVED', approved_by: 'A. Thompson' },
  { id: '5', desk_id: 'Crude Americas', pnl_date: '2026-04-09', mo_pnl_usd: -560000, fo_pnl_usd: -540000, variance_usd: -20000, variance_pct: -3.7, status: 'APPROVED', approved_by: 'A. Thompson' },
];

const demoBreachResponses: BreachResponse[] = [
  { id: '1', breach_id: 'BRE-001', desk: 'Crude Americas', limit_type: 'Position Limit', breach_amount: 5200000, response_type: 'REDUCE_POSITION', responder: 'A. Thompson', response_notes: 'Trader instructed to unwind 10k lots by EOD', resolved_at: null, created_at: '2026-04-10T08:00:00Z' },
  { id: '2', breach_id: 'BRE-002', desk: 'FX Desk', limit_type: 'VaR Limit', breach_amount: 1800000, response_type: 'WAIVER_REQUESTED', responder: 'A. Thompson', response_notes: 'Temporary waiver requested — hedge rolls tomorrow', resolved_at: null, created_at: '2026-04-10T09:30:00Z' },
  { id: '3', breach_id: 'BRE-003', desk: 'Gas & Power', limit_type: 'Credit Limit', breach_amount: 3000000, response_type: 'MONITOR', responder: 'K. Nguyen', response_notes: 'Settlement expected today, monitoring', resolved_at: '2026-04-10T14:00:00Z', created_at: '2026-04-09T16:00:00Z' },
];

const demoSignoffs: DailySignoff[] = [
  { id: '1', desk_id: 'Crude Americas', signoff_date: '2026-04-10', signed_by: null, status: 'PENDING', gross_exposure: 450000000, net_exposure: 180000000, var_1d: 4200000, limit_util_pct: 82, open_issues: 'Position breach pending resolution' },
  { id: '2', desk_id: 'Products EMEA', signoff_date: '2026-04-10', signed_by: null, status: 'ISSUES_OPEN', gross_exposure: 280000000, net_exposure: 95000000, var_1d: 2100000, limit_util_pct: 68, open_issues: 'P&L variance >10% unexplained' },
  { id: '3', desk_id: 'Gas & Power', signoff_date: '2026-04-10', signed_by: 'K. Nguyen', status: 'SIGNED_OFF', gross_exposure: 320000000, net_exposure: 140000000, var_1d: 3100000, limit_util_pct: 71, open_issues: null },
  { id: '4', desk_id: 'FX Desk', signoff_date: '2026-04-10', signed_by: null, status: 'PENDING', gross_exposure: 520000000, net_exposure: 45000000, var_1d: 1800000, limit_util_pct: 91, open_issues: 'VaR limit breach — waiver pending' },
];

const demoIPV: IPVPosition[] = [
  { id: '1', position_ref: 'POS-WTI-Q3', desk: 'Crude Americas', instrument: 'WTI Jul26', notional: 85000000, system_price: 72.45, mo_price: 72.30, variance: 0.15, variance_pct: 0.21, adjustment: null, justification: null },
  { id: '2', position_ref: 'POS-GO-JUN', desk: 'Products EMEA', instrument: 'Gasoil Jun26', notional: 42000000, system_price: 685.20, mo_price: 681.50, variance: 3.70, variance_pct: 0.54, adjustment: -155400, justification: 'Adjusted to Bloomberg mid' },
  { id: '3', position_ref: 'POS-HH-Q3', desk: 'Gas & Power', instrument: 'Henry Hub Jul26', notional: 28000000, system_price: 3.42, mo_price: 3.42, variance: 0, variance_pct: 0, adjustment: null, justification: null },
  { id: '4', position_ref: 'POS-BRT-Q4', desk: 'Crude Americas', instrument: 'Brent Q4-26', notional: 120000000, system_price: 74.80, mo_price: 73.95, variance: 0.85, variance_pct: 1.14, adjustment: -1020000, justification: 'ICE settlement vs broker mid — reserve applied' },
  { id: '5', position_ref: 'POS-NAPH-JUL', desk: 'Products EMEA', instrument: 'Naphtha Jul26', notional: 35000000, system_price: 612.00, mo_price: 612.40, variance: -0.40, variance_pct: -0.07, adjustment: null, justification: null },
];

export function useMiddleOfficeControl() {
  const [activeTab, setActiveTab] = useState('deal-review');
  const [reviewFilter, setReviewFilter] = useState('all');
  const [pnlDateFilter, setPnlDateFilter] = useState('2026-04-10');

  const filteredReviews = useMemo(() => {
    if (reviewFilter === 'all') return demoDealReviews;
    return demoDealReviews.filter(r => r.review_status === reviewFilter);
  }, [reviewFilter]);

  const filteredPnL = useMemo(() =>
    demoDailyPnL.filter(p => p.pnl_date === pnlDateFilter), [pnlDateFilter]);

  const pendingReviews = demoDealReviews.filter(r => r.review_status === 'PENDING').length;
  const openBreaches = demoBreachResponses.filter(b => !b.resolved_at).length;
  const desksSignedOff = demoSignoffs.filter(s => s.status === 'SIGNED_OFF').length;
  const totalDesks = demoSignoffs.length;
  const totalIPVReserve = demoIPV.reduce((sum, p) => sum + Math.abs(p.adjustment || 0), 0);

  return {
    activeTab, setActiveTab,
    reviewFilter, setReviewFilter,
    pnlDateFilter, setPnlDateFilter,
    filteredReviews,
    filteredPnL,
    breachResponses: demoBreachResponses,
    signoffs: demoSignoffs,
    ipvPositions: demoIPV,
    pendingReviews, openBreaches, desksSignedOff, totalDesks, totalIPVReserve,
  };
}
