// Demo data generation utilities for ArkheOS

export const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

export const counterparties = [
  { code: 'GS', name: 'Goldman Sachs' },
  { code: 'MS', name: 'Morgan Stanley' },
  { code: 'JPM', name: 'JP Morgan' },
  { code: 'BP', name: 'BP Trading' },
  { code: 'SHELL', name: 'Shell Trading' },
  { code: 'ICE', name: 'ICE Clear' },
  { code: 'CME', name: 'CME Group' },
  { code: 'VITOL', name: 'Vitol' },
];

export const strategies = [
  'Crude Oil Swaps',
  'Natural Gas Futures',
  'Power Hedging',
  'LNG Arbitrage',
  'Refined Products',
  'Carbon Credits',
];

export const feeTypes = [
  'Broker Fee',
  'Exchange Fee',
  'Clearing Fee',
  'Commission',
  'Admin Fee',
  'Platform Fee',
];

export const legalEntities = [
  { code: 'US', name: 'Trading Co. US' },
  { code: 'UK', name: 'Trading Co. UK' },
  { code: 'SG', name: 'Trading Co. Singapore' },
];

export const desks = [
  { code: 'CRUDE', name: 'Crude Oil Desk' },
  { code: 'GAS', name: 'Natural Gas Desk' },
  { code: 'POWER', name: 'Power Trading Desk' },
  { code: 'LNG', name: 'LNG Desk' },
];

// Generate a random amount between min and max
export function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Generate a random date in a range
export function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

// Pick random item from array
export function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate deal ID
export function generateDealId(index: number): string {
  return `TRD-2024-${String(index).padStart(4, '0')}`;
}

export interface ETRMFee {
  deal_id: string;
  strategy: string;
  fee_type: string;
  fee_amount: number;
  currency: string;
  economic_date: string;
  counterparty: string;
  book_portfolio: string;
  legal_entity: string;
  fee_status: string;
}

export interface NetSuiteLine {
  ns_doc_id: string;
  ns_doc_type: string;
  deal_id: string;
  strategy: string;
  fee_type: string;
  amount: number;
  currency: string;
  posting_date: string;
  subsidiary: string;
  counterparty: string;
  memo: string;
  line_id: string;
}

export function generateDemoData() {
  const etrmFees: ETRMFee[] = [];
  const netsuiteLines: NetSuiteLine[] = [];
  
  const startDate = new Date('2024-12-01');
  const endDate = new Date('2024-12-31');
  
  // Generate 200 ETRM records
  for (let i = 1; i <= 200; i++) {
    const dealId = generateDealId(i);
    const strategy = randomItem(strategies);
    const feeType = randomItem(feeTypes);
    const amount = randomAmount(500, 150000);
    const counterparty = randomItem(counterparties);
    const legalEntity = randomItem(legalEntities);
    const desk = randomItem(desks);
    const date = randomDate(startDate, endDate);
    
    etrmFees.push({
      deal_id: dealId,
      strategy,
      fee_type: feeType,
      fee_amount: amount,
      currency: 'USD',
      economic_date: date,
      counterparty: counterparty.code,
      book_portfolio: desk.code,
      legal_entity: legalEntity.code,
      fee_status: 'CONFIRMED',
    });
  }
  
  // Generate NetSuite lines based on distribution:
  // 70% exact match (140), 15% amount mismatch (30), 10% missing in ERP (20), 5% duplicates (10)
  
  let nsIndex = 1;
  
  // 70% exact matches (140 records)
  for (let i = 0; i < 140; i++) {
    const etrmFee = etrmFees[i];
    netsuiteLines.push({
      ns_doc_id: `JE-${String(nsIndex).padStart(6, '0')}`,
      ns_doc_type: 'Journal Entry',
      deal_id: etrmFee.deal_id,
      strategy: etrmFee.strategy,
      fee_type: etrmFee.fee_type,
      amount: etrmFee.fee_amount, // Exact match
      currency: etrmFee.currency,
      posting_date: etrmFee.economic_date,
      subsidiary: etrmFee.legal_entity,
      counterparty: etrmFee.counterparty,
      memo: `Fee posting for ${etrmFee.deal_id}`,
      line_id: '1',
    });
    nsIndex++;
  }
  
  // 15% amount mismatch (30 records)
  for (let i = 140; i < 170; i++) {
    const etrmFee = etrmFees[i];
    const variance = (Math.random() > 0.5 ? 1 : -1) * randomAmount(50, 5000);
    netsuiteLines.push({
      ns_doc_id: `JE-${String(nsIndex).padStart(6, '0')}`,
      ns_doc_type: 'Journal Entry',
      deal_id: etrmFee.deal_id,
      strategy: etrmFee.strategy,
      fee_type: etrmFee.fee_type,
      amount: Math.round((etrmFee.fee_amount + variance) * 100) / 100, // Mismatched amount
      currency: etrmFee.currency,
      posting_date: etrmFee.economic_date,
      subsidiary: etrmFee.legal_entity,
      counterparty: etrmFee.counterparty,
      memo: `Fee posting for ${etrmFee.deal_id}`,
      line_id: '1',
    });
    nsIndex++;
  }
  
  // 10% missing in ERP (20 records) - skip these, they won't have NetSuite lines
  // Records 170-189 in ETRM have no NetSuite counterpart
  
  // 5% duplicates (10 records) - create extra NetSuite lines for some ETRM records
  for (let i = 0; i < 10; i++) {
    const etrmFee = etrmFees[i]; // Duplicate from first 10 records
    netsuiteLines.push({
      ns_doc_id: `JE-${String(nsIndex).padStart(6, '0')}`,
      ns_doc_type: 'Journal Entry',
      deal_id: etrmFee.deal_id,
      strategy: etrmFee.strategy,
      fee_type: etrmFee.fee_type,
      amount: etrmFee.fee_amount,
      currency: etrmFee.currency,
      posting_date: etrmFee.economic_date,
      subsidiary: etrmFee.legal_entity,
      counterparty: etrmFee.counterparty,
      memo: `Duplicate fee posting for ${etrmFee.deal_id}`,
      line_id: '2', // Different line
    });
    nsIndex++;
  }
  
  // Add 20 NetSuite records that don't exist in ETRM (missing in ETRM)
  for (let i = 0; i < 20; i++) {
    const dealId = `TRD-2024-${String(300 + i).padStart(4, '0')}`; // IDs that don't exist in ETRM
    netsuiteLines.push({
      ns_doc_id: `JE-${String(nsIndex).padStart(6, '0')}`,
      ns_doc_type: 'Journal Entry',
      deal_id: dealId,
      strategy: randomItem(strategies),
      fee_type: randomItem(feeTypes),
      amount: randomAmount(500, 50000),
      currency: 'USD',
      posting_date: randomDate(startDate, endDate),
      subsidiary: randomItem(legalEntities).code,
      counterparty: randomItem(counterparties).code,
      memo: `Fee posting for ${dealId}`,
      line_id: '1',
    });
    nsIndex++;
  }
  
  return { etrmFees, netsuiteLines };
}
