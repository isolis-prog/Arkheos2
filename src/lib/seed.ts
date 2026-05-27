/*
  Synthetic seed dataset for an Energy & Commodities trading platform.
  Scope: 18 months of continuous operations, Oct 2024 through Mar 2026.
  Persona: large-scale merchant energy trader inspired by Vitol/Hartree operating model.

  Usage in Lovable / React:
    import seedData, { buildSeedData } from './seed';

    const data = seedData;
    // data.trades, data.invoices, data.reconciliationRuns, etc.

  Notes:
  - Deterministic pseudo-random generation: same seed => same dataset every time.
  - Reconciliation items reference existing Trade IDs and Invoice IDs.
  - Around 10% of reconciliation items contain realistic breaks/discrepancies.
*/

export type Currency = 'USD' | 'MXN' | 'CHF';
export type TradeType = 'Physical Purchase' | 'Physical Sale' | 'Financial Swap' | 'Futures';
export type TradeStatus = 'Confirmed' | 'Cleared';
export type Commodity = 'WTI' | 'Brent' | 'Henry Hub' | 'ERCOT Power' | 'PJM Power';
export type PriceIndex = 'NYMEX WTI' | 'ICE Brent' | 'NYMEX Henry Hub' | 'Platts USGC' | 'ERCOT North Hub' | 'PJM West Hub';
export type RunFrequency = 'Daily' | 'Monthly';
export type RunStatus = 'Closed & Reconciled' | 'Closed with Immaterial Breaks' | 'In Review' | 'Pending' | 'Failed Validation';
export type DiscrepancyType = 'None' | 'FX Rounding' | 'ETRM Accrual Missing in ERP' | 'Payment Date Mismatch';
export type MatchStatus = 'Matched' | 'Auto-Matched' | 'Open Break' | 'Investigating' | 'Pending ERP Posting';
export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Partially Paid' | 'Accrued';
export type CostType = 'Freight' | 'Storage' | 'Inspection Fee' | 'Brokerage' | 'Exchange Fee';

export interface Counterparty {
  id: string;
  name: string;
  type: 'Oil Major' | 'National Oil Company' | 'Utility' | 'Bank' | 'Trading House' | 'Producer' | 'Industrial';
  country: string;
  creditRating: string;
  defaultCurrency: Currency;
  paymentTermsDays: number;
}

export interface LegalEntity {
  id: string;
  name: string;
  region: 'USA' | 'Mexico' | 'Geneva';
  country: string;
  functionalCurrency: Currency;
  erpSystem: 'NetSuite' | 'SAP S/4HANA' | 'Microsoft Dynamics 365';
  etrmSystem: 'Endur' | 'RightAngle' | 'Allegro';
}

export interface Portfolio {
  id: string;
  name: string;
  region: 'North America' | 'Mexico' | 'Europe';
  productGroup: 'Crude' | 'Natural Gas' | 'Power' | 'Derivatives';
  book: string;
  legalEntityId: string;
  baseCurrency: Currency;
  riskOwner: string;
}

export interface Trade {
  tradeId: string;
  tradeDate: string;
  deliveryStart: string;
  deliveryEnd: string;
  tradeType: TradeType;
  status: TradeStatus;
  commodity: Commodity;
  quantity: number;
  unit: 'bbl' | 'MMBtu' | 'MWh' | 'lots';
  price: number;
  priceIndex: PriceIndex;
  counterpartyId: string;
  legalEntityId: string;
  portfolioId: string;
  buySell: 'Buy' | 'Sell';
  currency: Currency;
  trader: string;
  broker?: string;
  comments: string;
}

export interface SettlementCost {
  costId: string;
  tradeId: string;
  invoiceId: string;
  costType: CostType;
  amount: number;
  currency: Currency;
  vendor: string;
  costDate: string;
}

export interface Invoice {
  invoiceId: string;
  tradeId: string;
  counterpartyId: string;
  legalEntityId: string;
  portfolioId: string;
  issueDate: string;
  dueDate: string;
  invoiceMonth: string;
  currency: Currency;
  grossAmount: number;
  secondaryCostsAmount: number;
  taxAmount: number;
  netAmount: number;
  status: InvoiceStatus;
  etrmInvoiceRef: string;
  erpVoucherId: string | null;
  paymentDate: string | null;
}

export interface CashflowItem {
  cashflowId: string;
  invoiceId: string;
  tradeId: string;
  legalEntityId: string;
  counterpartyId: string;
  expectedDate: string;
  erpPaymentDate: string | null;
  cashflowType: 'AR Receipt' | 'AP Payment' | 'Broker/Exchange Fee' | 'Logistics Fee';
  direction: 'Inflow' | 'Outflow';
  amount: number;
  currency: Currency;
  timingBucket: '0-30' | '31-60' | '61-90' | '91-120' | '120+';
  status: 'Projected' | 'Scheduled' | 'Settled' | 'Delayed';
}

export interface ReconciliationRun {
  runId: string;
  runDate: string;
  period: string;
  frequency: RunFrequency;
  templateName: string;
  legalEntityId: string;
  portfolioId?: string;
  sourceA: string;
  sourceB: string;
  status: RunStatus;
  totalRecords: number;
  matchedRecords: number;
  breakRecords: number;
  breakAmountUsd: number;
  owner: string;
}

export interface ReconciliationItem {
  itemId: string;
  runId: string;
  period: string;
  tradeId: string;
  invoiceId: string;
  legalEntityId: string;
  portfolioId: string;
  counterpartyId: string;
  discrepancyType: DiscrepancyType;
  matchStatus: MatchStatus;
  etrmAmount: number;
  erpAmount: number | null;
  differenceAmount: number;
  currency: Currency;
  etrmFxRate: number;
  erpFxRate: number | null;
  etrmPaymentDate: string;
  erpPaymentDate: string | null;
  rootCause: string;
  assignedTo: string;
  agingDays: number;
  severity: 'Low' | 'Medium' | 'High';
}

export interface MonthlyMetric {
  period: string;
  tradeCount: number;
  invoiceCount: number;
  grossExposureUsd: number;
  breakCount: number;
  breakAmountUsd: number;
  closedStatus: 'Closed' | 'In Close' | 'Open';
}

export interface SeedDataset {
  metadata: {
    generatedAt: string;
    deterministicSeed: number;
    periodStart: string;
    periodEnd: string;
    targetTradeCount: number;
    discrepancyRateTarget: number;
    description: string;
  };
  masterData: {
    counterparties: Counterparty[];
    legalEntities: LegalEntity[];
    portfolios: Portfolio[];
  };
  trades: Trade[];
  invoices: Invoice[];
  settlementCosts: SettlementCost[];
  cashflows: CashflowItem[];
  reconciliationRuns: ReconciliationRun[];
  reconciliationItems: ReconciliationItem[];
  dashboardMetrics: MonthlyMetric[];
}

const SEED = 20260331;
const TARGET_TRADE_COUNT = 500;
const PERIODS = [
  '2024-10', '2024-11', '2024-12',
  '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
  '2026-01', '2026-02', '2026-03',
];

export const counterparties: Counterparty[] = [
  { id: 'CP-001', name: 'BP Energy Company', type: 'Oil Major', country: 'United Kingdom', creditRating: 'A-', defaultCurrency: 'USD', paymentTermsDays: 20 },
  { id: 'CP-002', name: 'Shell Trading US Company', type: 'Oil Major', country: 'United States', creditRating: 'A+', defaultCurrency: 'USD', paymentTermsDays: 20 },
  { id: 'CP-003', name: 'Chevron Products Company', type: 'Oil Major', country: 'United States', creditRating: 'AA-', defaultCurrency: 'USD', paymentTermsDays: 15 },
  { id: 'CP-004', name: 'ExxonMobil Trading', type: 'Oil Major', country: 'United States', creditRating: 'AA-', defaultCurrency: 'USD', paymentTermsDays: 15 },
  { id: 'CP-005', name: 'Petróleos Mexicanos (Pemex)', type: 'National Oil Company', country: 'Mexico', creditRating: 'B+', defaultCurrency: 'MXN', paymentTermsDays: 30 },
  { id: 'CP-006', name: 'CFE International', type: 'Utility', country: 'Mexico', creditRating: 'BBB', defaultCurrency: 'MXN', paymentTermsDays: 30 },
  { id: 'CP-007', name: 'Goldman Sachs Commodities', type: 'Bank', country: 'United States', creditRating: 'A+', defaultCurrency: 'USD', paymentTermsDays: 2 },
  { id: 'CP-008', name: 'Macquarie Energy', type: 'Bank', country: 'Australia', creditRating: 'A', defaultCurrency: 'USD', paymentTermsDays: 2 },
  { id: 'CP-009', name: 'J.P. Morgan Commodities', type: 'Bank', country: 'United States', creditRating: 'A+', defaultCurrency: 'USD', paymentTermsDays: 2 },
  { id: 'CP-010', name: 'Morgan Stanley Capital Group', type: 'Bank', country: 'United States', creditRating: 'A', defaultCurrency: 'USD', paymentTermsDays: 2 },
  { id: 'CP-011', name: 'Trafigura Trading LLC', type: 'Trading House', country: 'Singapore', creditRating: 'BBB', defaultCurrency: 'USD', paymentTermsDays: 10 },
  { id: 'CP-012', name: 'Vitol Inc.', type: 'Trading House', country: 'Switzerland', creditRating: 'BBB+', defaultCurrency: 'USD', paymentTermsDays: 10 },
  { id: 'CP-013', name: 'Mercuria Energy Trading', type: 'Trading House', country: 'Switzerland', creditRating: 'BBB', defaultCurrency: 'USD', paymentTermsDays: 10 },
  { id: 'CP-014', name: 'Gunvor USA LLC', type: 'Trading House', country: 'Switzerland', creditRating: 'BBB-', defaultCurrency: 'USD', paymentTermsDays: 10 },
  { id: 'CP-015', name: 'Freepoint Commodities', type: 'Trading House', country: 'United States', creditRating: 'BB+', defaultCurrency: 'USD', paymentTermsDays: 10 },
  { id: 'CP-016', name: 'Castleton Commodities International', type: 'Trading House', country: 'United States', creditRating: 'BBB-', defaultCurrency: 'USD', paymentTermsDays: 10 },
  { id: 'CP-017', name: 'ConocoPhillips Supply & Trading', type: 'Producer', country: 'United States', creditRating: 'A-', defaultCurrency: 'USD', paymentTermsDays: 15 },
  { id: 'CP-018', name: 'TotalEnergies Trading', type: 'Oil Major', country: 'France', creditRating: 'A+', defaultCurrency: 'USD', paymentTermsDays: 15 },
  { id: 'CP-019', name: 'ENGIE Energy Marketing', type: 'Utility', country: 'France', creditRating: 'A-', defaultCurrency: 'USD', paymentTermsDays: 20 },
  { id: 'CP-020', name: 'Repsol Trading', type: 'Oil Major', country: 'Spain', creditRating: 'BBB+', defaultCurrency: 'USD', paymentTermsDays: 20 },
  { id: 'CP-021', name: 'Marathon Petroleum Supply', type: 'Producer', country: 'United States', creditRating: 'BBB', defaultCurrency: 'USD', paymentTermsDays: 15 },
  { id: 'CP-022', name: 'Valero Marketing and Supply', type: 'Producer', country: 'United States', creditRating: 'BBB', defaultCurrency: 'USD', paymentTermsDays: 15 },
  { id: 'CP-023', name: 'Grupo México Energía', type: 'Industrial', country: 'Mexico', creditRating: 'BBB-', defaultCurrency: 'MXN', paymentTermsDays: 30 },
  { id: 'CP-024', name: 'ArcelorMittal Energy Desk', type: 'Industrial', country: 'Luxembourg', creditRating: 'BBB', defaultCurrency: 'USD', paymentTermsDays: 20 },
];

export const legalEntities: LegalEntity[] = [
  { id: 'LE-US-001', name: 'Aurora Energy Trading LLC', region: 'USA', country: 'United States', functionalCurrency: 'USD', erpSystem: 'NetSuite', etrmSystem: 'Endur' },
  { id: 'LE-MX-001', name: 'Aurora Energía México S.A. de C.V.', region: 'Mexico', country: 'Mexico', functionalCurrency: 'MXN', erpSystem: 'SAP S/4HANA', etrmSystem: 'RightAngle' },
  { id: 'LE-CH-001', name: 'Aurora Trading Geneva SA', region: 'Geneva', country: 'Switzerland', functionalCurrency: 'CHF', erpSystem: 'Microsoft Dynamics 365', etrmSystem: 'Allegro' },
];

export const portfolios: Portfolio[] = [
  { id: 'PF-CRUDE-USGC', name: 'US Gulf Coast Crude Book', region: 'North America', productGroup: 'Crude', book: 'CRUDE-USGC', legalEntityId: 'LE-US-001', baseCurrency: 'USD', riskOwner: 'Sarah Mitchell' },
  { id: 'PF-CRUDE-ATL', name: 'Atlantic Basin Brent Book', region: 'Europe', productGroup: 'Crude', book: 'CRUDE-ATL', legalEntityId: 'LE-CH-001', baseCurrency: 'USD', riskOwner: 'Luca Romano' },
  { id: 'PF-GAS-NA', name: 'North America Natural Gas Book', region: 'North America', productGroup: 'Natural Gas', book: 'GAS-NA', legalEntityId: 'LE-US-001', baseCurrency: 'USD', riskOwner: 'Michael Grant' },
  { id: 'PF-GAS-MX', name: 'Mexico Natural Gas Import Book', region: 'Mexico', productGroup: 'Natural Gas', book: 'GAS-MX', legalEntityId: 'LE-MX-001', baseCurrency: 'MXN', riskOwner: 'Mariana Torres' },
  { id: 'PF-POWER-ERCOT', name: 'ERCOT Power Book', region: 'North America', productGroup: 'Power', book: 'POWER-ERCOT', legalEntityId: 'LE-US-001', baseCurrency: 'USD', riskOwner: 'James Carter' },
  { id: 'PF-POWER-MX', name: 'Mexico Power Book', region: 'Mexico', productGroup: 'Power', book: 'POWER-MX', legalEntityId: 'LE-MX-001', baseCurrency: 'MXN', riskOwner: 'Ana Sofía Vega' },
  { id: 'PF-DERIV-OIL', name: 'Oil Derivatives Book', region: 'Europe', productGroup: 'Derivatives', book: 'DERIV-OIL', legalEntityId: 'LE-CH-001', baseCurrency: 'USD', riskOwner: 'Sophie Keller' },
  { id: 'PF-DERIV-GAS', name: 'Gas & Power Derivatives Book', region: 'North America', productGroup: 'Derivatives', book: 'DERIV-GASPOWER', legalEntityId: 'LE-US-001', baseCurrency: 'USD', riskOwner: 'Daniel Brooks' },
];

const traders = ['A. Ramirez', 'S. Mitchell', 'M. Grant', 'J. Carter', 'M. Torres', 'L. Romano', 'S. Keller', 'D. Brooks'];
const reconOwners = ['Back Office Ops', 'Trade Accounting', 'Product Control', 'Settlements Team', 'Mexico Accounting'];
const vendors = ['Gulf Marine Freight', 'Colonial Storage', 'Intertek Inspection', 'CME Clearing', 'ICE Clear Europe', 'Kinder Morgan Logistics'];
const brokers = ['Marex', 'Tullett Prebon', 'ICAP', 'StoneX', 'ADM Investor Services'];

function mulberry32(seed: number): () => number {
  return function rng() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(SEED);

function rand(min: number, max: number): number {
  return min + (max - min) * rng();
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function dateUtc(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function getMonthStart(period: string): Date {
  const [year, month] = period.split('-').map(Number);
  return dateUtc(year, month - 1, 1);
}

function getMonthEnd(period: string): Date {
  const [year, month] = period.split('-').map(Number);
  return dateUtc(year, month, 0);
}

function daysInMonth(period: string): number {
  return getMonthEnd(period).getUTCDate();
}

function monthNumber(period: string): number {
  return Number(period.split('-')[1]);
}

function isWinter(period: string): boolean {
  return [11, 12, 1, 2].includes(monthNumber(period));
}

function isSummer(period: string): boolean {
  return [6, 7, 8, 9].includes(monthNumber(period));
}

function closedStatusByPeriod(period: string): MonthlyMetric['closedStatus'] {
  if (period <= '2025-12') return 'Closed';
  if (period === '2026-01' || period === '2026-02') return 'In Close';
  return 'Open';
}

function runStatusByPeriod(period: string, frequency: RunFrequency): RunStatus {
  if (period <= '2025-12') return rng() > 0.82 ? 'Closed with Immaterial Breaks' : 'Closed & Reconciled';
  if (period === '2026-01') return frequency === 'Monthly' ? 'Closed with Immaterial Breaks' : 'In Review';
  if (period === '2026-02') return 'In Review';
  return rng() > 0.12 ? 'Pending' : 'Failed Validation';
}

function fxRate(currency: Currency, period: string, jitter = 0): number {
  const m = monthNumber(period);
  const yearOffset = Number(period.slice(0, 4)) - 2024;
  if (currency === 'USD') return 1;
  if (currency === 'MXN') return round(17.8 + yearOffset * 0.35 + Math.sin(m / 12 * Math.PI * 2) * 0.55 + jitter, 6);
  return round(0.88 + yearOffset * 0.02 + Math.cos(m / 12 * Math.PI * 2) * 0.03 + jitter, 6);
}

function toUsd(amount: number, currency: Currency, period: string): number {
  if (currency === 'USD') return amount;
  if (currency === 'MXN') return amount / fxRate('MXN', period);
  return amount / fxRate('CHF', period);
}

function commodityForPortfolio(portfolio: Portfolio): Commodity {
  if (portfolio.productGroup === 'Crude') return rng() > 0.46 ? 'WTI' : 'Brent';
  if (portfolio.productGroup === 'Natural Gas') return 'Henry Hub';
  if (portfolio.productGroup === 'Power') return portfolio.id.includes('ERCOT') ? 'ERCOT Power' : pick(['ERCOT Power', 'PJM Power']);
  return pick(['WTI', 'Brent', 'Henry Hub', 'ERCOT Power', 'PJM Power']);
}

function priceIndexForCommodity(commodity: Commodity): PriceIndex {
  switch (commodity) {
    case 'WTI': return rng() > 0.25 ? 'NYMEX WTI' : 'Platts USGC';
    case 'Brent': return 'ICE Brent';
    case 'Henry Hub': return 'NYMEX Henry Hub';
    case 'ERCOT Power': return 'ERCOT North Hub';
    case 'PJM Power': return 'PJM West Hub';
  }
}

function unitForCommodity(commodity: Commodity, tradeType: TradeType): Trade['unit'] {
  if (tradeType === 'Futures') return 'lots';
  if (commodity === 'WTI' || commodity === 'Brent') return 'bbl';
  if (commodity === 'Henry Hub') return 'MMBtu';
  return 'MWh';
}

function seasonalPrice(commodity: Commodity, period: string): number {
  const m = monthNumber(period);
  const t = PERIODS.indexOf(period);
  if (commodity === 'WTI') return round(72 + Math.sin((m - 1) / 12 * Math.PI * 2) * 3 + t * 0.08 + rand(-4.5, 4.5), 2);
  if (commodity === 'Brent') return round(78 + Math.sin((m - 2) / 12 * Math.PI * 2) * 3.5 + t * 0.09 + rand(-4.8, 4.8), 2);
  if (commodity === 'Henry Hub') return round((isWinter(period) ? 4.15 : 2.85) + rand(-0.55, 0.65), 3);
  if (commodity === 'ERCOT Power') return round((isSummer(period) ? 68 : isWinter(period) ? 52 : 38) + rand(-9, 14), 2);
  return round((isSummer(period) ? 58 : isWinter(period) ? 50 : 35) + rand(-7, 10), 2);
}

function seasonalQuantity(commodity: Commodity, period: string, tradeType: TradeType): number {
  const financialMultiplier = tradeType === 'Financial Swap' || tradeType === 'Futures' ? rand(0.35, 0.85) : rand(0.85, 1.35);
  if (commodity === 'WTI' || commodity === 'Brent') return Math.round(rand(25000, 650000) * financialMultiplier / 1000) * 1000;
  if (commodity === 'Henry Hub') return Math.round(rand(120000, 2200000) * (isWinter(period) ? 1.45 : 0.92) * financialMultiplier / 1000) * 1000;
  return Math.round(rand(25000, 420000) * (isSummer(period) || isWinter(period) ? 1.25 : 0.82) * financialMultiplier / 100) * 100;
}

function choosePortfolio(tradeType: TradeType): Portfolio {
  if (tradeType === 'Financial Swap' || tradeType === 'Futures') {
    return rng() > 0.5 ? portfolios.find(p => p.id === 'PF-DERIV-OIL')! : portfolios.find(p => p.id === 'PF-DERIV-GAS')!;
  }
  return pick(portfolios.filter(p => p.productGroup !== 'Derivatives'));
}

function currencyForTrade(legalEntity: LegalEntity, counterparty: Counterparty, tradeType: TradeType): Currency {
  if (tradeType === 'Futures' || tradeType === 'Financial Swap') return 'USD';
  if (legalEntity.region === 'Mexico' && rng() > 0.42) return 'MXN';
  if (legalEntity.region === 'Geneva' && rng() > 0.78) return 'CHF';
  return counterparty.defaultCurrency === 'MXN' && rng() > 0.55 ? 'MXN' : 'USD';
}

function notionalAmount(trade: Trade): number {
  const sign = trade.buySell === 'Sell' ? 1 : -1;
  let multiplier = 1;
  if (trade.unit === 'lots') multiplier = trade.commodity === 'Henry Hub' ? 10000 : 1000;
  return round(sign * trade.quantity * trade.price * multiplier, 2);
}

function tradeMixByPortfolio(): TradeType {
  const n = rng();
  if (n < 0.36) return 'Physical Purchase';
  if (n < 0.70) return 'Physical Sale';
  if (n < 0.88) return 'Financial Swap';
  return 'Futures';
}

function tradeCountForMonth(index: number): number {
  // Sums to exactly 500 across the 18 periods.
  const base = 27;
  const extraMonths = [1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 0, 6];
  return base + (extraMonths.includes(index) ? 1 : 0);
}

function buildTrades(): Trade[] {
  const trades: Trade[] = [];
  let seq = 1;

  PERIODS.forEach((period, periodIndex) => {
    const count = tradeCountForMonth(periodIndex);
    for (let i = 0; i < count; i += 1) {
      const tradeType = tradeMixByPortfolio();
      const portfolio = choosePortfolio(tradeType);
      const legalEntity = legalEntities.find(le => le.id === portfolio.legalEntityId)!;
      const commodity = commodityForPortfolio(portfolio);
      const counterparty = pick(counterparties);
      const day = randInt(1, Math.min(27, daysInMonth(period)));
      const tradeDate = getMonthStart(period);
      tradeDate.setUTCDate(day);
      const deliveryStart = addDays(tradeDate, randInt(7, 42));
      const deliveryEnd = addDays(deliveryStart, tradeType === 'Futures' || tradeType === 'Financial Swap' ? randInt(25, 60) : randInt(5, 35));
      const status: TradeStatus = tradeType === 'Futures' || tradeType === 'Financial Swap' ? 'Cleared' : 'Confirmed';
      const currency = currencyForTrade(legalEntity, counterparty, tradeType);
      const price = seasonalPrice(commodity, period);
      const quantity = seasonalQuantity(commodity, period, tradeType);
      const buySell = tradeType === 'Physical Sale' ? 'Sell' : tradeType === 'Physical Purchase' ? 'Buy' : (rng() > 0.5 ? 'Buy' : 'Sell');

      trades.push({
        tradeId: `TRD-${period.replace('-', '')}-${String(seq).padStart(5, '0')}`,
        tradeDate: formatDate(tradeDate),
        deliveryStart: formatDate(deliveryStart),
        deliveryEnd: formatDate(deliveryEnd),
        tradeType,
        status,
        commodity,
        quantity,
        unit: unitForCommodity(commodity, tradeType),
        price,
        priceIndex: priceIndexForCommodity(commodity),
        counterpartyId: counterparty.id,
        legalEntityId: legalEntity.id,
        portfolioId: portfolio.id,
        buySell,
        currency,
        trader: pick(traders),
        broker: tradeType === 'Financial Swap' || tradeType === 'Futures' ? pick(brokers) : undefined,
        comments: isWinter(period) && commodity === 'Henry Hub'
          ? 'Winter demand premium reflected in volume profile.'
          : isSummer(period) && commodity.includes('Power')
            ? 'Summer power load profile reflected in price and quantity.'
            : 'Standard commercial trade generated for synthetic seed data.',
      });
      seq += 1;
    }
  });

  return trades;
}

function buildInvoicesAndCosts(trades: Trade[]): { invoices: Invoice[]; settlementCosts: SettlementCost[]; cashflows: CashflowItem[] } {
  const invoices: Invoice[] = [];
  const settlementCosts: SettlementCost[] = [];
  const cashflows: CashflowItem[] = [];
  let costSeq = 1;
  let cashSeq = 1;

  trades.forEach((trade, index) => {
    const period = trade.tradeDate.slice(0, 7);
    const cp = counterparties.find(c => c.id === trade.counterpartyId)!;
    const issueDate = addDays(new Date(`${trade.deliveryEnd}T00:00:00.000Z`), randInt(1, 8));
    const dueDate = addDays(issueDate, cp.paymentTermsDays);
    const isRecent = period >= '2026-02';
    const baseNotional = Math.abs(notionalAmount(trade));
    const physical = trade.tradeType === 'Physical Purchase' || trade.tradeType === 'Physical Sale';
    const costTypes: CostType[] = physical ? ['Freight', 'Storage', 'Inspection Fee'] : ['Brokerage', 'Exchange Fee'];
    const invoiceId = `INV-${period.replace('-', '')}-${String(index + 1).padStart(5, '0')}`;
    let secondaryCostsAmount = 0;

    costTypes.forEach((costType, j) => {
      const pct = costType === 'Freight' ? rand(0.0025, 0.0075)
        : costType === 'Storage' ? rand(0.0008, 0.0025)
          : costType === 'Inspection Fee' ? rand(0.00015, 0.00065)
            : costType === 'Brokerage' ? rand(0.0001, 0.00035)
              : rand(0.00005, 0.0002);
      const amount = round(baseNotional * pct, 2);
      secondaryCostsAmount += amount;
      settlementCosts.push({
        costId: `COST-${String(costSeq).padStart(6, '0')}`,
        tradeId: trade.tradeId,
        invoiceId,
        costType,
        amount,
        currency: trade.currency,
        vendor: physical ? vendors[j % 3] : vendors[3 + (j % 2)],
        costDate: formatDate(addDays(issueDate, -randInt(2, 9))),
      });
      costSeq += 1;
    });

    const taxable = trade.legalEntityId === 'LE-MX-001' && trade.currency === 'MXN';
    const taxAmount = taxable ? round((baseNotional + secondaryCostsAmount) * 0.16, 2) : 0;
    const netAmount = round(baseNotional + secondaryCostsAmount + taxAmount, 2);
    const settled = !isRecent && rng() > 0.05;
    const partial = isRecent && rng() > 0.55;
    const status: InvoiceStatus = settled ? 'Paid' : partial ? 'Partially Paid' : isRecent ? 'Issued' : 'Accrued';
    const erpVoucherId = period >= '2026-03' && rng() < 0.18 ? null : `ERP-${trade.legalEntityId.slice(3, 5)}-${period.replace('-', '')}-${String(index + 1).padStart(5, '0')}`;
    const paymentDate = settled ? formatDate(addDays(dueDate, randInt(-2, 3))) : partial ? formatDate(addDays(dueDate, randInt(1, 5))) : null;

    invoices.push({
      invoiceId,
      tradeId: trade.tradeId,
      counterpartyId: trade.counterpartyId,
      legalEntityId: trade.legalEntityId,
      portfolioId: trade.portfolioId,
      issueDate: formatDate(issueDate),
      dueDate: formatDate(dueDate),
      invoiceMonth: period,
      currency: trade.currency,
      grossAmount: round(baseNotional, 2),
      secondaryCostsAmount: round(secondaryCostsAmount, 2),
      taxAmount,
      netAmount,
      status,
      etrmInvoiceRef: `ETRM-${trade.tradeId}`,
      erpVoucherId,
      paymentDate,
    });

    const direction = trade.buySell === 'Sell' ? 'Inflow' : 'Outflow';
    const expectedDate = formatDate(dueDate);
    const bucketDays = Math.max(0, Math.round((dueDate.getTime() - new Date('2026-03-31T00:00:00.000Z').getTime()) / (1000 * 60 * 60 * 24)));
    const timingBucket: CashflowItem['timingBucket'] = bucketDays <= 30 ? '0-30' : bucketDays <= 60 ? '31-60' : bucketDays <= 90 ? '61-90' : bucketDays <= 120 ? '91-120' : '120+';
    cashflows.push({
      cashflowId: `CF-${String(cashSeq).padStart(6, '0')}`,
      invoiceId,
      tradeId: trade.tradeId,
      legalEntityId: trade.legalEntityId,
      counterpartyId: trade.counterpartyId,
      expectedDate,
      erpPaymentDate: paymentDate,
      cashflowType: direction === 'Inflow' ? 'AR Receipt' : 'AP Payment',
      direction,
      amount: netAmount,
      currency: trade.currency,
      timingBucket,
      status: paymentDate ? 'Settled' : isRecent ? 'Scheduled' : 'Delayed',
    });
    cashSeq += 1;
  });

  return { invoices, settlementCosts, cashflows };
}

function buildRuns(invoices: Invoice[]): ReconciliationRun[] {
  const runs: ReconciliationRun[] = [];
  let runSeq = 1;

  PERIODS.forEach(period => {
    legalEntities.forEach(le => {
      const invs = invoices.filter(inv => inv.invoiceMonth === period && inv.legalEntityId === le.id);
      if (!invs.length) return;
      const runDate = addDays(getMonthEnd(period), randInt(1, 4));
      const status = runStatusByPeriod(period, 'Monthly');
      const breakRate = period <= '2025-12' ? rand(0.015, 0.045) : period === '2026-01' ? rand(0.05, 0.08) : period === '2026-02' ? rand(0.07, 0.11) : rand(0.12, 0.18);
      const breakRecords = Math.max(0, Math.round(invs.length * breakRate));
      runs.push({
        runId: `RUN-M-${period.replace('-', '')}-${le.id}-${String(runSeq).padStart(4, '0')}`,
        runDate: formatDate(runDate),
        period,
        frequency: 'Monthly',
        templateName: `${le.etrmSystem} ↔ ${le.erpSystem} Monthly Close`,
        legalEntityId: le.id,
        sourceA: le.etrmSystem,
        sourceB: le.erpSystem,
        status,
        totalRecords: invs.length,
        matchedRecords: invs.length - breakRecords,
        breakRecords,
        breakAmountUsd: round(invs.slice(0, breakRecords).reduce((sum, inv) => sum + Math.abs(toUsd(inv.netAmount, inv.currency, period)) * rand(0.001, 0.015), 0), 2),
        owner: pick(reconOwners),
      });
      runSeq += 1;
    });
  });

  // Daily recent runs: last 45 days of Feb-Mar 2026 to simulate Recent Runs widget.
  const dailyStart = new Date('2026-02-15T00:00:00.000Z');
  for (let d = 0; d < 45; d += 1) {
    const runDate = addDays(dailyStart, d);
    const period = formatDate(runDate).slice(0, 7);
    legalEntities.forEach(le => {
      const invs = invoices.filter(inv => inv.invoiceMonth === period && inv.legalEntityId === le.id);
      const totalRecords = Math.max(5, Math.round(invs.length * rand(0.18, 0.42)));
      const breakRecords = Math.round(totalRecords * rand(0.06, period === '2026-03' ? 0.16 : 0.10));
      runs.push({
        runId: `RUN-D-${formatDate(runDate).replace(/-/g, '')}-${le.id}-${String(runSeq).padStart(4, '0')}`,
        runDate: formatDate(runDate),
        period,
        frequency: 'Daily',
        templateName: `${le.etrmSystem} ↔ ${le.erpSystem} Daily Trade & Cashflow Check`,
        legalEntityId: le.id,
        sourceA: le.etrmSystem,
        sourceB: le.erpSystem,
        status: runStatusByPeriod(period, 'Daily'),
        totalRecords,
        matchedRecords: totalRecords - breakRecords,
        breakRecords,
        breakAmountUsd: round(rand(2500, 180000), 2),
        owner: pick(reconOwners),
      });
      runSeq += 1;
    });
  }

  return runs;
}

function buildReconciliationItems(invoices: Invoice[], runs: ReconciliationRun[]): ReconciliationItem[] {
  const monthlyRunByPeriodEntity = new Map<string, ReconciliationRun>();
  runs.filter(r => r.frequency === 'Monthly').forEach(r => monthlyRunByPeriodEntity.set(`${r.period}|${r.legalEntityId}`, r));

  const items: ReconciliationItem[] = [];
  const discrepancyTarget = Math.round(invoices.length * 0.10);
  const discrepancyInvoiceIndexes = new Set<number>();
  while (discrepancyInvoiceIndexes.size < discrepancyTarget) {
    discrepancyInvoiceIndexes.add(randInt(0, invoices.length - 1));
  }

  invoices.forEach((invoice, index) => {
    const period = invoice.invoiceMonth;
    const run = monthlyRunByPeriodEntity.get(`${period}|${invoice.legalEntityId}`)!;
    const hasBreak = discrepancyInvoiceIndexes.has(index);
    const discrepancyType: DiscrepancyType = !hasBreak ? 'None' : pick(['FX Rounding', 'ETRM Accrual Missing in ERP', 'Payment Date Mismatch']);
    const etrmFx = fxRate(invoice.currency, period, 0);
    const erpFx = discrepancyType === 'FX Rounding' ? fxRate(invoice.currency, period, rand(-0.015, 0.018)) : etrmFx;
    let erpAmount: number | null = invoice.netAmount;
    let differenceAmount = 0;
    let erpPaymentDate = invoice.paymentDate || invoice.dueDate;
    let rootCause = 'No exception. ETRM transaction, ERP voucher and cashflow timing are aligned.';
    let matchStatus: MatchStatus = rng() > 0.62 ? 'Auto-Matched' : 'Matched';
    let severity: ReconciliationItem['severity'] = 'Low';

    if (discrepancyType === 'FX Rounding') {
      const usdEtrm = invoice.currency === 'USD' ? invoice.netAmount : invoice.currency === 'MXN' ? invoice.netAmount / etrmFx : invoice.netAmount / etrmFx;
      const usdErp = invoice.currency === 'USD' ? invoice.netAmount : invoice.netAmount / (erpFx || etrmFx);
      differenceAmount = round(Math.abs(usdEtrm - usdErp), 2);
      erpAmount = round(invoice.netAmount + (invoice.currency === 'USD' ? rand(-12, 18) : rand(-350, 450)), 2);
      rootCause = 'Minor FX rate precision variance between ETRM mark-to-market/settlement feed and ERP voucher conversion.';
      matchStatus = differenceAmount < 250 ? 'Auto-Matched' : 'Investigating';
      severity = differenceAmount < 250 ? 'Low' : 'Medium';
    }

    if (discrepancyType === 'ETRM Accrual Missing in ERP') {
      erpAmount = null;
      differenceAmount = round(Math.abs(toUsd(invoice.netAmount, invoice.currency, period)), 2);
      erpPaymentDate = null;
      rootCause = 'Invoice/accrual exists in ETRM but ERP voucher is missing or not posted before close cutoff.';
      matchStatus = 'Pending ERP Posting';
      severity = differenceAmount > 1000000 ? 'High' : 'Medium';
    }

    if (discrepancyType === 'Payment Date Mismatch') {
      erpPaymentDate = formatDate(addDays(new Date(`${invoice.dueDate}T00:00:00.000Z`), randInt(2, 9)));
      differenceAmount = 0;
      rootCause = 'Cashflow timing mismatch: ERP payment date does not match expected ETRM settlement date.';
      matchStatus = 'Open Break';
      severity = 'Medium';
    }

    const agingDays = period <= '2025-12' ? randInt(0, 5) : period === '2026-01' ? randInt(3, 18) : period === '2026-02' ? randInt(8, 30) : randInt(1, 20);

    items.push({
      itemId: `REC-ITEM-${String(index + 1).padStart(6, '0')}`,
      runId: run.runId,
      period,
      tradeId: invoice.tradeId,
      invoiceId: invoice.invoiceId,
      legalEntityId: invoice.legalEntityId,
      portfolioId: invoice.portfolioId,
      counterpartyId: invoice.counterpartyId,
      discrepancyType,
      matchStatus,
      etrmAmount: invoice.netAmount,
      erpAmount,
      differenceAmount,
      currency: invoice.currency,
      etrmFxRate: etrmFx,
      erpFxRate: erpFx,
      etrmPaymentDate: invoice.dueDate,
      erpPaymentDate,
      rootCause,
      assignedTo: pick(reconOwners),
      agingDays,
      severity,
    });
  });

  return items;
}

function buildMetrics(trades: Trade[], invoices: Invoice[], reconciliationItems: ReconciliationItem[]): MonthlyMetric[] {
  return PERIODS.map(period => {
    const periodTrades = trades.filter(t => t.tradeDate.slice(0, 7) === period);
    const periodInvoices = invoices.filter(inv => inv.invoiceMonth === period);
    const periodBreaks = reconciliationItems.filter(item => item.period === period && item.discrepancyType !== 'None');
    return {
      period,
      tradeCount: periodTrades.length,
      invoiceCount: periodInvoices.length,
      grossExposureUsd: round(periodInvoices.reduce((sum, inv) => sum + Math.abs(toUsd(inv.netAmount, inv.currency, period)), 0), 2),
      breakCount: periodBreaks.length,
      breakAmountUsd: round(periodBreaks.reduce((sum, item) => sum + Math.abs(item.differenceAmount), 0), 2),
      closedStatus: closedStatusByPeriod(period),
    };
  });
}

export function buildSeedData(): SeedDataset {
  const trades = buildTrades();
  const { invoices, settlementCosts, cashflows } = buildInvoicesAndCosts(trades);
  const reconciliationRuns = buildRuns(invoices);
  const reconciliationItems = buildReconciliationItems(invoices, reconciliationRuns);
  const dashboardMetrics = buildMetrics(trades, invoices, reconciliationItems);

  return {
    metadata: {
      generatedAt: '2026-03-31T23:59:59Z',
      deterministicSeed: SEED,
      periodStart: '2024-10-01',
      periodEnd: '2026-03-31',
      targetTradeCount: TARGET_TRADE_COUNT,
      discrepancyRateTarget: 0.10,
      description: 'Synthetic 18-month commodity trading, settlement and ETRM-vs-ERP reconciliation dataset for a large-scale energy merchant.',
    },
    masterData: {
      counterparties,
      legalEntities,
      portfolios,
    },
    trades,
    invoices,
    settlementCosts,
    cashflows,
    reconciliationRuns,
    reconciliationItems,
    dashboardMetrics,
  };
}

export const seedData = buildSeedData();
export default seedData;

/*
  Suggested Lovable mappings:

  - Trading module:
      seedData.trades
      Join with masterData.counterparties, legalEntities and portfolios by ID.

  - Finance / Settlement module:
      seedData.invoices
      seedData.settlementCosts
      seedData.cashflows

  - Reconciliations module:
      seedData.reconciliationRuns for Recent Runs cards/table.
      seedData.reconciliationItems for exception management.
      Discrepancy simulation uses:
        1) FX Rounding
        2) ETRM Accrual Missing in ERP
        3) Payment Date Mismatch

  - CFO dashboard / monthly close:
      seedData.dashboardMetrics
      Historical months through Dec 2025 are mostly Closed.
      Jan-Feb 2026 are In Close.
      Mar 2026 is Open/Pending.
*/
