// Demo data generator for the AI Reconciliation Agent
import { RecordData } from './matching-engine';

export type { RecordData };

export const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

const counterparties = ['Goldman Sachs', 'Morgan Stanley', 'JP Morgan', 'BP Trading', 'Shell Trading', 'ICE Clear', 'CME Group', 'Vitol'];
const descriptions = [
  'Broker Commission - Crude Oil Swap',
  'Exchange Fee - Natural Gas Futures',
  'Clearing Fee - Power Forward',
  'Platform Fee - LNG Cargo',
  'Admin Fee - Carbon Credit',
  'Transaction Fee - Oil Options',
  'Settlement Fee - Gas Swap',
  'Margin Call - Crude Future',
];

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateExternalId(index: number, prefix: string): string {
  return `${prefix}-2024-${String(index).padStart(5, '0')}`;
}

export interface DemoDataSet {
  sourceA: RecordData[];
  sourceB: RecordData[];
  expectedMatches: number;
  expectedMismatches: number;
  expectedUnmatched: number;
}

export function generateDemoData(recordCount: number = 200): DemoDataSet {
  const startDate = new Date('2024-11-01');
  const endDate = new Date('2024-12-31');
  
  const sourceA: RecordData[] = [];
  const sourceB: RecordData[] = [];
  
  // Distribution: 60% perfect match, 15% amount tolerance, 10% date mismatch, 10% unmatched, 5% duplicates
  const perfectMatchCount = Math.floor(recordCount * 0.60);
  const toleranceMatchCount = Math.floor(recordCount * 0.15);
  const dateMismatchCount = Math.floor(recordCount * 0.10);
  const unmatchedACount = Math.floor(recordCount * 0.10);
  const duplicateCount = Math.floor(recordCount * 0.05);
  
  let index = 1;
  
  // 60% Perfect 1-1 matches
  for (let i = 0; i < perfectMatchCount; i++, index++) {
    const externalId = generateExternalId(index, 'TXN');
    const date = randomDate(startDate, endDate);
    const amount = randomFloat(1000, 150000);
    const counterparty = randomItem(counterparties);
    const description = randomItem(descriptions);
    
    sourceA.push({
      id: `a-${index}`,
      external_id: externalId,
      record_date: date,
      amount,
      currency: 'USD',
      counterparty,
      description,
    });
    
    sourceB.push({
      id: `b-${index}`,
      external_id: externalId,
      record_date: date,
      amount,
      currency: 'USD',
      counterparty,
      description: description.replace('Fee', 'Charge'), // Slight variation
    });
  }
  
  // 15% Amount within tolerance (0.1% to 2.5% difference)
  for (let i = 0; i < toleranceMatchCount; i++, index++) {
    const externalId = generateExternalId(index, 'TXN');
    const date = randomDate(startDate, endDate);
    const amount = randomFloat(5000, 100000);
    const variance = amount * randomFloat(0.001, 0.025); // 0.1% to 2.5%
    const counterparty = randomItem(counterparties);
    const description = randomItem(descriptions);
    
    sourceA.push({
      id: `a-${index}`,
      external_id: externalId,
      record_date: date,
      amount,
      currency: 'USD',
      counterparty,
      description,
    });
    
    sourceB.push({
      id: `b-${index}`,
      external_id: externalId,
      record_date: date,
      amount: amount + (Math.random() > 0.5 ? variance : -variance),
      currency: 'USD',
      counterparty,
      description,
    });
  }
  
  // 10% Date mismatch (3-7 days difference)
  for (let i = 0; i < dateMismatchCount; i++, index++) {
    const externalId = generateExternalId(index, 'TXN');
    const date = new Date(randomDate(startDate, endDate));
    const amount = randomFloat(2000, 80000);
    const counterparty = randomItem(counterparties);
    const description = randomItem(descriptions);
    const daysDiff = Math.floor(Math.random() * 5) + 3; // 3-7 days
    
    const dateB = new Date(date);
    dateB.setDate(dateB.getDate() + (Math.random() > 0.5 ? daysDiff : -daysDiff));
    
    sourceA.push({
      id: `a-${index}`,
      external_id: externalId,
      record_date: date.toISOString().split('T')[0],
      amount,
      currency: 'USD',
      counterparty,
      description,
    });
    
    sourceB.push({
      id: `b-${index}`,
      external_id: externalId,
      record_date: dateB.toISOString().split('T')[0],
      amount,
      currency: 'USD',
      counterparty,
      description,
    });
  }
  
  // 10% Unmatched in Source A (no corresponding B record)
  for (let i = 0; i < unmatchedACount; i++, index++) {
    sourceA.push({
      id: `a-${index}`,
      external_id: generateExternalId(index, 'TXN'),
      record_date: randomDate(startDate, endDate),
      amount: randomFloat(1000, 50000),
      currency: 'USD',
      counterparty: randomItem(counterparties),
      description: randomItem(descriptions),
    });
  }
  
  // Add some unmatched in Source B (no corresponding A record)
  for (let i = 0; i < Math.floor(unmatchedACount / 2); i++, index++) {
    sourceB.push({
      id: `b-${index}`,
      external_id: generateExternalId(index + 500, 'INV'),
      record_date: randomDate(startDate, endDate),
      amount: randomFloat(1000, 50000),
      currency: 'USD',
      counterparty: randomItem(counterparties),
      description: randomItem(descriptions),
    });
  }
  
  // 5% Duplicates (multiple B records matching same A)
  for (let i = 0; i < duplicateCount; i++, index++) {
    const externalId = generateExternalId(index, 'DUP');
    const date = randomDate(startDate, endDate);
    const amount = randomFloat(10000, 60000);
    const counterparty = randomItem(counterparties);
    const description = randomItem(descriptions);
    
    sourceA.push({
      id: `a-${index}`,
      external_id: externalId,
      record_date: date,
      amount,
      currency: 'USD',
      counterparty,
      description,
    });
    
    // Add 2 matching B records (duplicates)
    sourceB.push({
      id: `b-${index}-1`,
      external_id: externalId,
      record_date: date,
      amount,
      currency: 'USD',
      counterparty,
      description,
    });
    
    sourceB.push({
      id: `b-${index}-2`,
      external_id: externalId,
      record_date: date,
      amount: amount * 0.5, // Split amount
      currency: 'USD',
      counterparty,
      description: description + ' (Split)',
    });
  }
  
  return {
    sourceA,
    sourceB,
    expectedMatches: perfectMatchCount + toleranceMatchCount,
    expectedMismatches: dateMismatchCount,
    expectedUnmatched: unmatchedACount + Math.floor(unmatchedACount / 2) + duplicateCount,
  };
}

export function generateCSVContent(records: RecordData[], sourceName: string): string {
  const headers = ['external_id', 'date', 'amount', 'currency', 'counterparty', 'description'];
  const rows = records.map(r => [
    r.external_id || '',
    r.record_date || '',
    r.amount?.toString() || '0',
    r.currency || 'USD',
    r.counterparty || '',
    `"${(r.description || '').replace(/"/g, '""')}"`,
  ].join(','));
  
  return [headers.join(','), ...rows].join('\n');
}
