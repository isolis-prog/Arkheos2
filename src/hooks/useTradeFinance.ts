import { useState, useMemo } from 'react';

// Types
export interface LetterOfCredit {
  id: string;
  lc_number: string;
  lc_type: 'import' | 'export';
  issuing_bank: string;
  beneficiary: string;
  trade_id: string | null;
  commodity: string | null;
  amount: number;
  currency: string;
  issue_date: string | null;
  expiry_date: string | null;
  status: string;
  is_standby: boolean;
  standby_purpose: string | null;
  tenant_id: string;
}

export interface LCDiscrepancy {
  id: string;
  lc_id: string;
  description: string;
  raised_by: string | null;
  raised_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
}

export interface BorrowingBaseFacility {
  id: string;
  bank_name: string;
  facility_limit: number;
  advance_rate_inventory: number;
  advance_rate_receivables: number;
  maturity_date: string | null;
  status: string;
}

export interface BorrowingBaseSnapshot {
  id: string;
  facility_id: string;
  snapshot_date: string;
  eligible_inventory_value: number;
  eligible_receivables_value: number;
  borrowing_base_calculated: number;
  drawn_amount: number;
  headroom: number;
}

export interface PreExportFinance {
  id: string;
  bank_name: string | null;
  commodity_id: string | null;
  quantity: number | null;
  value: number;
  currency: string;
  drawdown_date: string | null;
  repayment_date: string | null;
  interest_rate: number | null;
  outstanding_balance: number;
  status: string;
  finance_type: string;
  trade_id: string | null;
  voyage_id: string | null;
  invoice_id: string | null;
  discount_rate: number | null;
  net_proceeds: number | null;
}

// Demo data
const demoLCs: LetterOfCredit[] = [
  { id: '1', lc_number: 'LC-2026-0041', lc_type: 'import', issuing_bank: 'HSBC London', beneficiary: 'Vitol SA', trade_id: 'T-1001', commodity: 'Crude Oil', amount: 45000000, currency: 'USD', issue_date: '2026-03-15', expiry_date: '2026-06-15', status: 'ISSUED', is_standby: false, standby_purpose: null, tenant_id: '' },
  { id: '2', lc_number: 'LC-2026-0042', lc_type: 'export', issuing_bank: 'Standard Chartered', beneficiary: 'Glencore Intl', trade_id: 'T-1003', commodity: 'Gasoil', amount: 28000000, currency: 'USD', issue_date: '2026-03-20', expiry_date: '2026-07-20', status: 'PRESENTED', is_standby: false, standby_purpose: null, tenant_id: '' },
  { id: '3', lc_number: 'LC-2026-0043', lc_type: 'import', issuing_bank: 'ING Bank', beneficiary: 'Saudi Aramco', trade_id: 'T-1005', commodity: 'Naphtha', amount: 62000000, currency: 'USD', issue_date: '2026-02-10', expiry_date: '2026-05-10', status: 'DISCREPANCY', is_standby: false, standby_purpose: null, tenant_id: '' },
  { id: '4', lc_number: 'LC-2026-0044', lc_type: 'import', issuing_bank: 'BNP Paribas', beneficiary: 'TotalEnergies', trade_id: null, commodity: 'Jet Fuel', amount: 18500000, currency: 'USD', issue_date: '2026-04-01', expiry_date: '2026-09-01', status: 'DRAFT', is_standby: false, standby_purpose: null, tenant_id: '' },
  { id: '5', lc_number: 'SBLC-2026-0010', lc_type: 'export', issuing_bank: 'Citibank NY', beneficiary: 'Trafigura', trade_id: 'T-1008', commodity: null, amount: 15000000, currency: 'USD', issue_date: '2026-01-15', expiry_date: '2027-01-15', status: 'ISSUED', is_standby: true, standby_purpose: 'Payment Guarantee', tenant_id: '' },
  { id: '6', lc_number: 'SBLC-2026-0011', lc_type: 'import', issuing_bank: 'Deutsche Bank', beneficiary: 'Koch Industries', trade_id: null, commodity: null, amount: 25000000, currency: 'USD', issue_date: '2026-02-01', expiry_date: '2026-08-01', status: 'ISSUED', is_standby: true, standby_purpose: 'Performance Bond', tenant_id: '' },
  { id: '7', lc_number: 'LC-2026-0045', lc_type: 'export', issuing_bank: 'Rabobank', beneficiary: 'Cargill', trade_id: 'T-1010', commodity: 'Wheat', amount: 12000000, currency: 'USD', issue_date: '2026-01-20', expiry_date: '2026-04-20', status: 'PAID', is_standby: false, standby_purpose: null, tenant_id: '' },
];

const demoFacilities: (BorrowingBaseFacility & { latestSnapshot: BorrowingBaseSnapshot })[] = [
  { id: 'f1', bank_name: 'HSBC Commodity Finance', facility_limit: 500000000, advance_rate_inventory: 0.80, advance_rate_receivables: 0.85, maturity_date: '2027-06-30', status: 'ACTIVE', latestSnapshot: { id: 's1', facility_id: 'f1', snapshot_date: '2026-04-10', eligible_inventory_value: 320000000, eligible_receivables_value: 180000000, borrowing_base_calculated: 409000000, drawn_amount: 310000000, headroom: 99000000 } },
  { id: 'f2', bank_name: 'ING Structured Finance', facility_limit: 300000000, advance_rate_inventory: 0.75, advance_rate_receivables: 0.80, maturity_date: '2026-12-31', status: 'ACTIVE', latestSnapshot: { id: 's2', facility_id: 'f2', snapshot_date: '2026-04-10', eligible_inventory_value: 200000000, eligible_receivables_value: 120000000, borrowing_base_calculated: 246000000, drawn_amount: 240000000, headroom: 6000000 } },
  { id: 'f3', bank_name: 'Rabobank Trade Finance', facility_limit: 200000000, advance_rate_inventory: 0.82, advance_rate_receivables: 0.88, maturity_date: '2027-03-31', status: 'ACTIVE', latestSnapshot: { id: 's3', facility_id: 'f3', snapshot_date: '2026-04-10', eligible_inventory_value: 150000000, eligible_receivables_value: 90000000, borrowing_base_calculated: 202200000, drawn_amount: 120000000, headroom: 82200000 } },
];

const demoPreExport: PreExportFinance[] = [
  { id: 'p1', bank_name: 'Standard Chartered', commodity_id: null, quantity: 50000, value: 35000000, currency: 'USD', drawdown_date: '2026-03-01', repayment_date: '2026-06-01', interest_rate: 5.25, outstanding_balance: 35000000, status: 'ACTIVE', finance_type: 'pre_export', trade_id: 'T-1001', voyage_id: null, invoice_id: null, discount_rate: null, net_proceeds: null },
  { id: 'p2', bank_name: 'BNP Paribas', commodity_id: null, quantity: 30000, value: 22000000, currency: 'USD', drawdown_date: '2026-02-15', repayment_date: '2026-05-15', interest_rate: 4.85, outstanding_balance: 15000000, status: 'ACTIVE', finance_type: 'inventory', trade_id: null, voyage_id: 'v1', invoice_id: null, discount_rate: null, net_proceeds: null },
  { id: 'p3', bank_name: 'Citibank', commodity_id: null, quantity: null, value: 18000000, currency: 'USD', drawdown_date: '2026-03-10', repayment_date: '2026-04-25', interest_rate: null, outstanding_balance: 0, status: 'REPAID', finance_type: 'receivables', trade_id: null, voyage_id: null, invoice_id: 'INV-2026-0088', discount_rate: 2.5, net_proceeds: 17550000 },
  { id: 'p4', bank_name: 'HSBC', commodity_id: null, quantity: null, value: 12000000, currency: 'USD', drawdown_date: '2026-04-01', repayment_date: '2026-07-01', interest_rate: null, outstanding_balance: 12000000, status: 'ACTIVE', finance_type: 'receivables', trade_id: null, voyage_id: null, invoice_id: 'INV-2026-0102', discount_rate: 2.8, net_proceeds: 11664000 },
];

export function useTradeFinance() {
  const [activeTab, setActiveTab] = useState('lc-register');
  const [lcFilter, setLcFilter] = useState('all');
  const [financeTypeFilter, setFinanceTypeFilter] = useState('all');

  const regularLCs = useMemo(() => demoLCs.filter(lc => !lc.is_standby), []);
  const standbyLCs = useMemo(() => demoLCs.filter(lc => lc.is_standby), []);

  const filteredLCs = useMemo(() => {
    const source = activeTab === 'sblc-register' ? standbyLCs : regularLCs;
    if (lcFilter === 'all') return source;
    return source.filter(lc => lc.status === lcFilter);
  }, [activeTab, lcFilter, regularLCs, standbyLCs]);

  const filteredFinance = useMemo(() => {
    if (financeTypeFilter === 'all') return demoPreExport;
    return demoPreExport.filter(f => f.finance_type === financeTypeFilter);
  }, [financeTypeFilter]);

  const totalLCExposure = useMemo(() =>
    demoLCs.filter(lc => !['PAID', 'EXPIRED', 'CANCELLED'].includes(lc.status))
      .reduce((sum, lc) => sum + lc.amount, 0), []);

  const totalFacilityDrawn = useMemo(() =>
    demoFacilities.reduce((sum, f) => sum + f.latestSnapshot.drawn_amount, 0), []);

  const totalOutstandingFinance = useMemo(() =>
    demoPreExport.reduce((sum, f) => sum + f.outstanding_balance, 0), []);

  const calendarEvents = useMemo(() => {
    const events: { date: string; label: string; type: string }[] = [];
    demoLCs.forEach(lc => {
      if (lc.expiry_date) events.push({ date: lc.expiry_date, label: `${lc.lc_number} expires`, type: lc.is_standby ? 'sblc' : 'lc' });
    });
    demoFacilities.forEach(f => {
      if (f.maturity_date) events.push({ date: f.maturity_date, label: `${f.bank_name} facility matures`, type: 'facility' });
    });
    demoPreExport.forEach(f => {
      if (f.repayment_date) events.push({ date: f.repayment_date, label: `${f.bank_name} repayment due`, type: 'finance' });
    });
    return events.sort((a, b) => a.date.localeCompare(b.date));
  }, []);

  return {
    activeTab, setActiveTab,
    lcFilter, setLcFilter,
    financeTypeFilter, setFinanceTypeFilter,
    filteredLCs, regularLCs, standbyLCs,
    facilities: demoFacilities,
    filteredFinance,
    calendarEvents,
    totalLCExposure, totalFacilityDrawn, totalOutstandingFinance,
  };
}
