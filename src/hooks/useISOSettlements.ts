import { useState, useMemo } from 'react';
import { subDays, addMinutes, format } from 'date-fns';

export type ISOName = 'PJM' | 'ERCOT' | 'CAISO' | 'MISO' | 'NYISO' | 'SPP' | 'ISO-NE';
export type ChargeType = 'energy_da' | 'energy_rt' | 'congestion' | 'losses' | 'uplift' | 'ancillary_reg' | 'ancillary_spin' | 'capacity';
export type RootCause = 'node_mismatch' | 'missing_interval' | 'uplift_allocation' | 'negative_price' | 'price_delta' | 'mw_delta' | 'timezone_shift' | 'rounding';

export interface ISOStatement {
  id: string;
  isoName: ISOName;
  marketType: 'DA' | 'RT';
  periodStart: string;
  periodEnd: string;
  statementRef: string;
  timezone: string;
  intervalMinutes: number;
  totalLines: number;
  totalAmount: number;
  currency: string;
  status: 'uploaded' | 'parsing' | 'parsed' | 'reconciling' | 'reconciled' | 'error';
  matchedPct: number;
  breakCount: number;
  breakAmount: number;
  createdAt: string;
}

export interface ISOLine {
  id: string;
  statementId: string;
  node: string;
  zone: string;
  intervalDt: string;
  mw: number;
  price: number;
  chargeType: ChargeType;
  amount: number;
}

export interface ISOReconResult {
  id: string;
  statementId: string;
  node: string;
  zone: string;
  intervalDt: string | null;
  chargeType: ChargeType;
  expectedAmount: number;
  actualAmount: number;
  delta: number;
  deltaPct: number;
  rootCauseCode: RootCause | null;
  status: 'pending' | 'matched' | 'break' | 'adjusted' | 'resolved';
  glAccount: string;
  glPosted: boolean;
}

const ISOS: ISOName[] = ['PJM', 'ERCOT', 'CAISO', 'MISO', 'NYISO', 'SPP', 'ISO-NE'];
const TZ_MAP: Record<ISOName, string> = { PJM: 'America/New_York', ERCOT: 'America/Chicago', CAISO: 'America/Los_Angeles', MISO: 'America/Chicago', NYISO: 'America/New_York', SPP: 'America/Chicago', 'ISO-NE': 'America/New_York' };
const NODES = ['WEST_HUB', 'HOUSTON_345', 'SP15', 'NP15', 'PJMWH', 'NYZONE_J', 'INDIANA_HUB', 'NORTH_HUB', 'SPPNORTH', 'ZP26'];
const ZONES = ['West', 'South', 'North', 'Coast', 'Central'];
const CHARGE_TYPES: ChargeType[] = ['energy_da', 'energy_rt', 'congestion', 'losses', 'uplift', 'ancillary_reg', 'ancillary_spin', 'capacity'];
const ROOT_CAUSES: RootCause[] = ['node_mismatch', 'missing_interval', 'uplift_allocation', 'negative_price', 'price_delta', 'mw_delta', 'timezone_shift', 'rounding'];
const GL_ACCOUNTS = ['4100-Energy Revenue', '4200-Congestion', '4300-Losses', '5100-Uplift Expense', '5200-Ancillary', '4400-Capacity'];

function generateStatements(): ISOStatement[] {
  return Array.from({ length: 14 }, (_, i) => {
    const iso = ISOS[i % ISOS.length];
    const market = i % 2 === 0 ? 'DA' : 'RT';
    const lines = 200 + Math.floor(Math.random() * 2000);
    const total = (lines * (20 + Math.random() * 80));
    const breakCount = Math.floor(Math.random() * 40);
    const breakAmt = breakCount * (100 + Math.random() * 5000);
    const status = i < 2 ? 'uploaded' : i < 4 ? 'reconciling' : 'reconciled';
    return {
      id: `iso-${i}`, isoName: iso, marketType: market as 'DA' | 'RT',
      periodStart: subDays(new Date(), 30 + i * 3).toISOString().slice(0, 10),
      periodEnd: subDays(new Date(), 28 + i * 3).toISOString().slice(0, 10),
      statementRef: `${iso}-${market}-${format(subDays(new Date(), 30 + i * 3), 'yyyyMMdd')}`,
      timezone: TZ_MAP[iso], intervalMinutes: iso === 'ERCOT' ? 15 : 5,
      totalLines: lines, totalAmount: +total.toFixed(2), currency: 'USD',
      status, matchedPct: status === 'reconciled' ? 85 + Math.random() * 14 : 0,
      breakCount, breakAmount: +breakAmt.toFixed(2),
      createdAt: subDays(new Date(), i * 2).toISOString(),
    };
  });
}

function generateReconResults(statements: ISOStatement[]): ISOReconResult[] {
  const results: ISOReconResult[] = [];
  const reconciled = statements.filter(s => s.status === 'reconciled');
  reconciled.forEach((s, si) => {
    const count = 8 + Math.floor(Math.random() * 20);
    for (let i = 0; i < count; i++) {
      const ct = CHARGE_TYPES[i % CHARGE_TYPES.length];
      const expected = 500 + Math.random() * 50000;
      const isBreak = Math.random() < 0.35;
      const delta = isBreak ? (Math.random() - 0.4) * expected * 0.1 : (Math.random() - 0.5) * 2;
      const actual = expected + delta;
      results.push({
        id: `ir-${si}-${i}`, statementId: s.id,
        node: NODES[i % NODES.length], zone: ZONES[i % ZONES.length],
        intervalDt: addMinutes(new Date(s.periodStart), i * s.intervalMinutes * 10).toISOString(),
        chargeType: ct,
        expectedAmount: +expected.toFixed(2), actualAmount: +actual.toFixed(2),
        delta: +delta.toFixed(2), deltaPct: +((delta / expected) * 100).toFixed(2),
        rootCauseCode: isBreak ? ROOT_CAUSES[Math.floor(Math.random() * ROOT_CAUSES.length)] : null,
        status: isBreak ? (Math.random() < 0.3 ? 'resolved' : 'break') : 'matched',
        glAccount: GL_ACCOUNTS[i % GL_ACCOUNTS.length], glPosted: !isBreak,
      });
    }
  });
  return results;
}

export function useISOSettlements() {
  const [statements] = useState(() => generateStatements());
  const [reconResults] = useState(() => generateReconResults(statements));
  const [isoFilter, setIsoFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [chargeTypeFilter, setChargeTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);

  const filteredStatements = useMemo(() => statements.filter(s => {
    if (isoFilter !== 'all' && s.isoName !== isoFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (searchQuery && !s.statementRef.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }), [statements, isoFilter, statusFilter, searchQuery]);

  const selectedStatement = useMemo(() => statements.find(s => s.id === selectedStatementId) || null, [statements, selectedStatementId]);

  const selectedReconResults = useMemo(() => {
    if (!selectedStatementId) return [];
    return reconResults.filter(r => {
      if (r.statementId !== selectedStatementId) return false;
      if (chargeTypeFilter !== 'all' && r.chargeType !== chargeTypeFilter) return false;
      return true;
    });
  }, [reconResults, selectedStatementId, chargeTypeFilter]);

  const kpis = useMemo(() => {
    const totalBreaks = reconResults.filter(r => r.status === 'break').reduce((s, r) => s + Math.abs(r.delta), 0);
    const byCT: Record<string, number> = {};
    reconResults.filter(r => r.status === 'break').forEach(r => { byCT[r.chargeType] = (byCT[r.chargeType] || 0) + Math.abs(r.delta); });
    const topChargeTypes = Object.entries(byCT).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const byNode: Record<string, number> = {};
    reconResults.filter(r => r.status === 'break').forEach(r => { byNode[r.node] = (byNode[r.node] || 0) + Math.abs(r.delta); });
    const topNodes = Object.entries(byNode).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const totalIntervals = reconResults.length;
    const matchedIntervals = reconResults.filter(r => r.status === 'matched' || r.status === 'resolved').length;
    const coveragePct = totalIntervals > 0 ? (matchedIntervals / totalIntervals) * 100 : 0;

    const byRC: Record<string, number> = {};
    reconResults.filter(r => r.rootCauseCode).forEach(r => { byRC[r.rootCauseCode!] = (byRC[r.rootCauseCode!] || 0) + 1; });
    const rootCauses = Object.entries(byRC).sort((a, b) => b[1] - a[1]);

    return {
      totalBreakAmount: totalBreaks,
      breakCount: reconResults.filter(r => r.status === 'break').length,
      coveragePct: +coveragePct.toFixed(1),
      statementsReconciled: statements.filter(s => s.status === 'reconciled').length,
      topChargeTypes, topNodes, rootCauses,
    };
  }, [reconResults, statements]);

  return {
    statements, filteredStatements, reconResults, selectedReconResults, kpis,
    isoFilter, setIsoFilter, statusFilter, setStatusFilter,
    chargeTypeFilter, setChargeTypeFilter,
    searchQuery, setSearchQuery,
    selectedStatementId, setSelectedStatementId, selectedStatement,
  };
}
