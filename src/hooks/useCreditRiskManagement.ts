import { useState, useMemo } from 'react';

export interface CreditFile {
  id: string;
  counterparty: string;
  counterparty_id: string;
  credit_score: number;
  external_rating: string;
  approved_line_usd: number;
  line_expiry: string;
  collateral_held_usd: number;
  review_date: string;
  analyst: string;
  status: 'ACTIVE' | 'UNDER_REVIEW' | 'SUSPENDED' | 'CLOSED';
  gross_exposure: number;
  net_exposure: number;
  utilization: number;
}

export interface MarginCall {
  id: string;
  counterparty: string;
  counterparty_id: string;
  call_amount: number;
  currency: string;
  call_date: string;
  due_date: string;
  status: 'ISSUED' | 'ACKNOWLEDGED' | 'RECEIVED' | 'DISPUTED' | 'OVERDUE';
  notes: string;
}

export interface WrongWayFlag {
  id: string;
  counterparty: string;
  trade_ref: string;
  credit_score_change: string;
  unrealized_loss: number;
  flagged_at: string;
  severity: 'HIGH' | 'CRITICAL';
}

const demoCreditFiles: CreditFile[] = [
  { id: 'cf1', counterparty: 'Vitol SA', counterparty_id: 'cp1', credit_score: 8, external_rating: 'BBB+', approved_line_usd: 50000000, line_expiry: '2026-12-31', collateral_held_usd: 5000000, review_date: '2026-04-25', analyst: 'M. Chen', status: 'ACTIVE', gross_exposure: 38500000, net_exposure: 33500000, utilization: 67 },
  { id: 'cf2', counterparty: 'Trafigura Group', counterparty_id: 'cp2', credit_score: 7, external_rating: 'BBB', approved_line_usd: 40000000, line_expiry: '2026-09-30', collateral_held_usd: 3000000, review_date: '2026-05-10', analyst: 'J. Park', status: 'ACTIVE', gross_exposure: 35200000, net_exposure: 32200000, utilization: 80.5 },
  { id: 'cf3', counterparty: 'Glencore Intl', counterparty_id: 'cp3', credit_score: 9, external_rating: 'BBB+', approved_line_usd: 75000000, line_expiry: '2027-03-31', collateral_held_usd: 10000000, review_date: '2026-06-15', analyst: 'M. Chen', status: 'ACTIVE', gross_exposure: 42000000, net_exposure: 32000000, utilization: 42.7 },
  { id: 'cf4', counterparty: 'Mercuria Energy', counterparty_id: 'cp4', credit_score: 6, external_rating: 'BB+', approved_line_usd: 25000000, line_expiry: '2026-06-30', collateral_held_usd: 2000000, review_date: '2026-04-18', analyst: 'S. Rao', status: 'UNDER_REVIEW', gross_exposure: 24800000, net_exposure: 22800000, utilization: 91.2 },
  { id: 'cf5', counterparty: 'Gunvor Group', counterparty_id: 'cp5', credit_score: 5, external_rating: 'BB', approved_line_usd: 20000000, line_expiry: '2026-05-31', collateral_held_usd: 4000000, review_date: '2026-04-14', analyst: 'J. Park', status: 'ACTIVE', gross_exposure: 19500000, net_exposure: 15500000, utilization: 77.5 },
  { id: 'cf6', counterparty: 'Koch Supply', counterparty_id: 'cp6', credit_score: 9, external_rating: 'A-', approved_line_usd: 100000000, line_expiry: '2027-06-30', collateral_held_usd: 0, review_date: '2026-09-01', analyst: 'M. Chen', status: 'ACTIVE', gross_exposure: 28000000, net_exposure: 28000000, utilization: 28 },
  { id: 'cf7', counterparty: 'PetroChina Intl', counterparty_id: 'cp7', credit_score: 3, external_rating: 'B+', approved_line_usd: 15000000, line_expiry: '2026-04-30', collateral_held_usd: 6000000, review_date: '2026-04-12', analyst: 'S. Rao', status: 'SUSPENDED', gross_exposure: 18200000, net_exposure: 12200000, utilization: 81.3 },
  { id: 'cf8', counterparty: 'Shell Trading', counterparty_id: 'cp8', credit_score: 10, external_rating: 'A+', approved_line_usd: 60000000, line_expiry: '2027-12-31', collateral_held_usd: 5000000, review_date: '2026-08-20', analyst: 'M. Chen', status: 'ACTIVE', gross_exposure: 32000000, net_exposure: 27000000, utilization: 45 },
  { id: 'cf9', counterparty: 'BP Energy', counterparty_id: 'cp9', credit_score: 9, external_rating: 'A', approved_line_usd: 80000000, line_expiry: '2026-12-31', collateral_held_usd: 6000000, review_date: '2026-07-15', analyst: 'J. Park', status: 'ACTIVE', gross_exposure: 58000000, net_exposure: 52000000, utilization: 65 },
  { id: 'cf10', counterparty: 'Total Energies', counterparty_id: 'cp10', credit_score: 9, external_rating: 'A-', approved_line_usd: 65000000, line_expiry: '2026-12-31', collateral_held_usd: 4500000, review_date: '2026-06-30', analyst: 'M. Chen', status: 'ACTIVE', gross_exposure: 48000000, net_exposure: 43500000, utilization: 66.9 },
  { id: 'cf11', counterparty: 'Equinor', counterparty_id: 'cp11', credit_score: 8, external_rating: 'BBB+', approved_line_usd: 55000000, line_expiry: '2027-01-31', collateral_held_usd: 3500000, review_date: '2026-05-20', analyst: 'S. Rao', status: 'ACTIVE', gross_exposure: 39000000, net_exposure: 35500000, utilization: 64.5 },
  { id: 'cf12', counterparty: 'Cargill Energy', counterparty_id: 'cp12', credit_score: 7, external_rating: 'BBB', approved_line_usd: 45000000, line_expiry: '2026-12-31', collateral_held_usd: 2800000, review_date: '2026-05-25', analyst: 'J. Park', status: 'ACTIVE', gross_exposure: 31000000, net_exposure: 28200000, utilization: 62.7 },
  { id: 'cf13', counterparty: 'Repsol Trading', counterparty_id: 'cp13', credit_score: 7, external_rating: 'BBB-', approved_line_usd: 35000000, line_expiry: '2026-12-31', collateral_held_usd: 2200000, review_date: '2026-05-12', analyst: 'M. Chen', status: 'ACTIVE', gross_exposure: 26000000, net_exposure: 23800000, utilization: 68 },
  { id: 'cf14', counterparty: 'Aramco Trading', counterparty_id: 'cp14', credit_score: 10, external_rating: 'AA-', approved_line_usd: 90000000, line_expiry: '2027-01-01', collateral_held_usd: 0, review_date: '2026-08-01', analyst: 'M. Chen', status: 'ACTIVE', gross_exposure: 65000000, net_exposure: 65000000, utilization: 72.2 },
  { id: 'cf15', counterparty: 'Phillips 66', counterparty_id: 'cp15', credit_score: 8, external_rating: 'BBB+', approved_line_usd: 50000000, line_expiry: '2026-12-31', collateral_held_usd: 3200000, review_date: '2026-04-29', analyst: 'S. Rao', status: 'ACTIVE', gross_exposure: 36000000, net_exposure: 32800000, utilization: 65.6 },
  { id: 'cf16', counterparty: 'Lukoil Energy', counterparty_id: 'cp16', credit_score: 4, external_rating: 'B', approved_line_usd: 12000000, line_expiry: '2026-06-30', collateral_held_usd: 8000000, review_date: '2026-04-10', analyst: 'S. Rao', status: 'SUSPENDED', gross_exposure: 14500000, net_exposure: 6500000, utilization: 54.2 },
  { id: 'cf17', counterparty: 'ENI SpA', counterparty_id: 'cp17', credit_score: 8, external_rating: 'BBB+', approved_line_usd: 48000000, line_expiry: '2026-11-30', collateral_held_usd: 3000000, review_date: '2026-06-08', analyst: 'J. Park', status: 'ACTIVE', gross_exposure: 33000000, net_exposure: 30000000, utilization: 62.5 },
];

const demoMarginCalls: MarginCall[] = [
  { id: 'mc1', counterparty: 'Mercuria Energy', counterparty_id: 'cp4', call_amount: 3800000, currency: 'USD', call_date: '2026-04-08', due_date: '2026-04-11', status: 'OVERDUE', notes: 'Net exposure exceeded approved line by $3.8M' },
  { id: 'mc2', counterparty: 'PetroChina Intl', counterparty_id: 'cp7', call_amount: 2200000, currency: 'USD', call_date: '2026-04-10', due_date: '2026-04-14', status: 'ISSUED', notes: 'Gross exposure breach — line suspended' },
  { id: 'mc3', counterparty: 'Trafigura Group', counterparty_id: 'cp2', call_amount: 1500000, currency: 'USD', call_date: '2026-04-05', due_date: '2026-04-09', status: 'RECEIVED', notes: 'Margin topped up via wire transfer' },
  { id: 'mc4', counterparty: 'Gunvor Group', counterparty_id: 'cp5', call_amount: 800000, currency: 'USD', call_date: '2026-04-09', due_date: '2026-04-13', status: 'DISPUTED', notes: 'Counterparty disputes MTM calculation' },
  { id: 'mc5', counterparty: 'Lukoil Energy', counterparty_id: 'cp16', call_amount: 2500000, currency: 'USD', call_date: '2026-04-07', due_date: '2026-04-10', status: 'OVERDUE', notes: 'Sanctions risk — position liquidation requested' },
  { id: 'mc6', counterparty: 'Vitol SA', counterparty_id: 'cp1', call_amount: 1200000, currency: 'USD', call_date: '2026-04-06', due_date: '2026-04-09', status: 'ACKNOWLEDGED', notes: 'Standard variation margin call' },
  { id: 'mc7', counterparty: 'Repsol Trading', counterparty_id: 'cp13', call_amount: 650000, currency: 'USD', call_date: '2026-04-04', due_date: '2026-04-08', status: 'RECEIVED', notes: 'Wire transfer confirmed' },
  { id: 'mc8', counterparty: 'Aramco Trading', counterparty_id: 'cp14', call_amount: 4500000, currency: 'USD', call_date: '2026-04-10', due_date: '2026-04-15', status: 'ISSUED', notes: 'Quarterly mark-up — guarantee call' },
  { id: 'mc9', counterparty: 'ENI SpA', counterparty_id: 'cp17', call_amount: 950000, currency: 'USD', call_date: '2026-04-08', due_date: '2026-04-11', status: 'ACKNOWLEDGED', notes: 'Pending Treasury approval' },
];

const demoWrongWayFlags: WrongWayFlag[] = [
  { id: 'ww1', counterparty: 'PetroChina Intl', trade_ref: 'T-2024-042', credit_score_change: '5 → 3', unrealized_loss: 4200000, flagged_at: '2026-04-09', severity: 'CRITICAL' },
  { id: 'ww2', counterparty: 'Mercuria Energy', trade_ref: 'T-2024-038', credit_score_change: '7 → 6', unrealized_loss: 1800000, flagged_at: '2026-04-07', severity: 'HIGH' },
  { id: 'ww3', counterparty: 'Gunvor Group', trade_ref: 'T-2024-051', credit_score_change: '6 → 5', unrealized_loss: 950000, flagged_at: '2026-04-10', severity: 'HIGH' },
  { id: 'ww4', counterparty: 'Lukoil Energy', trade_ref: 'T-2024-067', credit_score_change: '6 → 4', unrealized_loss: 3500000, flagged_at: '2026-04-08', severity: 'CRITICAL' },
  { id: 'ww5', counterparty: 'PetroChina Intl', trade_ref: 'T-2024-072', credit_score_change: '4 → 3', unrealized_loss: 2100000, flagged_at: '2026-04-10', severity: 'CRITICAL' },
  { id: 'ww6', counterparty: 'Repsol Trading', trade_ref: 'T-2024-089', credit_score_change: '8 → 7', unrealized_loss: 620000, flagged_at: '2026-04-06', severity: 'HIGH' },
];

export function useCreditRiskManagement() {
  const [activeTab, setActiveTab] = useState('credit-files');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = useMemo(() => {
    return demoCreditFiles.filter(f => {
      if (statusFilter !== 'all' && f.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return f.counterparty.toLowerCase().includes(q) || f.analyst.toLowerCase().includes(q);
      }
      return true;
    });
  }, [statusFilter, searchQuery]);

  const reviewQueue = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 30);
    return demoCreditFiles.filter(f => new Date(f.review_date) <= cutoff).sort((a, b) => new Date(a.review_date).getTime() - new Date(b.review_date).getTime());
  }, []);

  const kpis = useMemo(() => ({
    totalCounterparties: demoCreditFiles.length,
    activeLines: demoCreditFiles.filter(f => f.status === 'ACTIVE').length,
    totalApprovedLines: demoCreditFiles.reduce((s, f) => s + f.approved_line_usd, 0),
    totalNetExposure: demoCreditFiles.reduce((s, f) => s + f.net_exposure, 0),
    avgUtilization: demoCreditFiles.reduce((s, f) => s + f.utilization, 0) / demoCreditFiles.length,
    breachedLines: demoCreditFiles.filter(f => f.utilization > 90).length,
    openMarginCalls: demoMarginCalls.filter(m => !['RECEIVED'].includes(m.status)).length,
    wrongWayFlags: demoWrongWayFlags.length,
  }), []);

  return {
    activeTab, setActiveTab,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    creditFiles: filteredFiles,
    allCreditFiles: demoCreditFiles,
    marginCalls: demoMarginCalls,
    wrongWayFlags: demoWrongWayFlags,
    reviewQueue,
    kpis,
  };
}
