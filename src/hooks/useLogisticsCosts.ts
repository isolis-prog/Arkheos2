import { useState, useMemo } from 'react';
import { subDays, subHours, addHours } from 'date-fns';

export type LogCostType = 'freight' | 'demurrage' | 'storage' | 'terminal' | 'inspection' | 'insurance' | 'other';
export type ReconStatus = 'pending' | 'matched' | 'variance' | 'disputed' | 'resolved';
export type LaytimeStatus = 'in_progress' | 'completed' | 'on_demurrage' | 'on_despatch';

export interface LogCostRecon {
  id: string;
  deliveryId: string;
  dealId: string;
  costType: LogCostType;
  counterparty: string;
  route: string;
  expectedAmount: number;
  actualAmount: number;
  delta: number;
  deltaPct: number;
  currency: string;
  status: ReconStatus;
  disputeFlag: boolean;
  disputeReason: string | null;
  invoiceRef: string | null;
  tariffRef: string | null;
  createdAt: string;
}

export interface Stoppage {
  reason: string;
  startDt: string;
  endDt: string;
  hours: number;
}

export interface LaytimeEvent {
  id: string;
  deliveryId: string;
  vesselName: string;
  port: string;
  terminal: string;
  arrivalDt: string;
  norTenderedDt: string;
  laytimeCommenceDt: string;
  laytimeCompleteDt: string | null;
  allowedHours: number;
  usedHours: number;
  stoppages: Stoppage[];
  status: LaytimeStatus;
  demurrageRatePerDay: number;
  despatchRatePerDay: number;
  demurrageAmount: number;
  despatchAmount: number;
  currency: string;
  cpRef: string;
  netHours: number;
  overUnderHours: number;
}

const VESSELS = ['MT Pacific Star', 'MV Nordic Explorer', 'MT Gulf Trader', 'MV Atlantic Dawn', 'MT Coral Spirit', 'MV Orient Pearl'];
const PORTS = ['Rotterdam', 'Houston', 'Fujairah', 'Singapore', 'Durban', 'Santos'];
const TERMINALS = ['Vopak T1', 'Oiltanking Berth 3', 'JNPT Terminal', 'Kinder Morgan Dock 5', 'Stolthaven Bay 2'];
const COUNTERPARTIES = ['Maersk Tankers', 'Hafnia', 'Scorpio Tankers', 'Stena Bulk', 'Euronav', 'Torm'];
const ROUTES = ['ARA → USG', 'MEG → Far East', 'WAF → Europe', 'USG → Brazil', 'Baltic → Med', 'AG → India'];
const COST_TYPES: LogCostType[] = ['freight', 'demurrage', 'storage', 'terminal', 'inspection', 'insurance'];
const STOPPAGE_REASONS = ['Weather delay', 'Port congestion', 'Customs hold', 'Tank cleaning', 'Bunkering', 'Awaiting berth'];

function generateRecons(): LogCostRecon[] {
  const items: LogCostRecon[] = [];
  for (let i = 0; i < 30; i++) {
    const costType = COST_TYPES[i % COST_TYPES.length];
    const expected = 5000 + Math.random() * 200000;
    const variance = (Math.random() - 0.4) * expected * 0.15;
    const actual = expected + variance;
    const delta = actual - expected;
    const deltaPct = (delta / expected) * 100;
    const absPct = Math.abs(deltaPct);
    const status: ReconStatus = absPct < 1 ? 'matched' : absPct < 5 ? 'variance' : (i % 5 === 0 ? 'disputed' : 'pending');
    items.push({
      id: `lcr-${i}`, deliveryId: `DEL-${2400 + i}`, dealId: `TRD-${1000 + i}`,
      costType, counterparty: COUNTERPARTIES[i % COUNTERPARTIES.length],
      route: ROUTES[i % ROUTES.length],
      expectedAmount: +expected.toFixed(2), actualAmount: +actual.toFixed(2),
      delta: +delta.toFixed(2), deltaPct: +deltaPct.toFixed(2),
      currency: 'USD', status, disputeFlag: status === 'disputed',
      disputeReason: status === 'disputed' ? 'Invoice exceeds tariff rate' : null,
      invoiceRef: `INV-${2025}-${String(i + 1).padStart(4, '0')}`,
      tariffRef: `TAR-${costType.toUpperCase()}-${i % 3 + 1}`,
      createdAt: subDays(new Date(), i * 2).toISOString(),
    });
  }
  return items;
}

function generateLaytimeEvents(): LaytimeEvent[] {
  const events: LaytimeEvent[] = [];
  for (let i = 0; i < 10; i++) {
    const arrival = subDays(new Date(), 5 + i * 4);
    const nor = addHours(arrival, 2 + Math.random() * 6);
    const commence = addHours(nor, 6);
    const allowed = 36 + Math.floor(Math.random() * 48);
    const used = allowed + (Math.random() - 0.5) * 30;
    const complete = i < 8 ? addHours(commence, used) : null;
    const rate = 25000 + Math.random() * 35000;
    const despatchRate = rate * 0.5;
    const stoppageCount = Math.floor(Math.random() * 3);
    const stoppages: Stoppage[] = [];
    let totalStoppageHours = 0;
    for (let s = 0; s < stoppageCount; s++) {
      const hours = 2 + Math.random() * 12;
      totalStoppageHours += hours;
      stoppages.push({
        reason: STOPPAGE_REASONS[Math.floor(Math.random() * STOPPAGE_REASONS.length)],
        startDt: addHours(commence, 10 + s * 15).toISOString(),
        endDt: addHours(commence, 10 + s * 15 + hours).toISOString(),
        hours: +hours.toFixed(1),
      });
    }
    const netHours = used - totalStoppageHours;
    const overUnder = netHours - allowed;
    const demAmount = overUnder > 0 ? (overUnder / 24) * rate : 0;
    const despAmount = overUnder < 0 ? (Math.abs(overUnder) / 24) * despatchRate : 0;
    const status: LaytimeStatus = !complete ? 'in_progress' : overUnder > 0 ? 'on_demurrage' : overUnder < 0 ? 'on_despatch' : 'completed';

    events.push({
      id: `lt-${i}`, deliveryId: `DEL-${2400 + i}`,
      vesselName: VESSELS[i % VESSELS.length], port: PORTS[i % PORTS.length],
      terminal: TERMINALS[i % TERMINALS.length],
      arrivalDt: arrival.toISOString(), norTenderedDt: nor.toISOString(),
      laytimeCommenceDt: commence.toISOString(),
      laytimeCompleteDt: complete?.toISOString() || null,
      allowedHours: allowed, usedHours: +used.toFixed(1),
      stoppages, status, demurrageRatePerDay: +rate.toFixed(2),
      despatchRatePerDay: +despatchRate.toFixed(2),
      demurrageAmount: +demAmount.toFixed(2), despatchAmount: +despAmount.toFixed(2),
      currency: 'USD', cpRef: `CP-${2025}-${String(i + 1).padStart(3, '0')}`,
      netHours: +netHours.toFixed(1), overUnderHours: +overUnder.toFixed(1),
    });
  }
  return events;
}

export function useLogisticsCosts() {
  const [recons] = useState(() => generateRecons());
  const [laytimeEvents] = useState(() => generateLaytimeEvents());
  const [costTypeFilter, setCostTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReconId, setSelectedReconId] = useState<string | null>(null);
  const [selectedLaytimeId, setSelectedLaytimeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'costs' | 'demurrage' | 'disputes'>('costs');

  const filteredRecons = useMemo(() => recons.filter(r => {
    if (costTypeFilter !== 'all' && r.costType !== costTypeFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery && !r.deliveryId.toLowerCase().includes(searchQuery.toLowerCase()) && !r.counterparty.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }), [recons, costTypeFilter, statusFilter, searchQuery]);

  const disputes = useMemo(() => recons.filter(r => r.disputeFlag), [recons]);
  const selectedRecon = useMemo(() => recons.find(r => r.id === selectedReconId) || null, [recons, selectedReconId]);
  const selectedLaytime = useMemo(() => laytimeEvents.find(l => l.id === selectedLaytimeId) || null, [laytimeEvents, selectedLaytimeId]);

  const kpis = useMemo(() => {
    const totalExpected = recons.reduce((s, r) => s + r.expectedAmount, 0);
    const totalActual = recons.reduce((s, r) => s + r.actualAmount, 0);
    const totalLeakage = recons.filter(r => r.delta > 0).reduce((s, r) => s + r.delta, 0);
    const recoveredLeakage = recons.filter(r => r.status === 'resolved' && r.delta > 0).reduce((s, r) => s + r.delta, 0);
    const totalDemurrage = laytimeEvents.reduce((s, l) => s + l.demurrageAmount, 0);
    const totalDespatch = laytimeEvents.reduce((s, l) => s + l.despatchAmount, 0);
    const avgDemurrageDays = laytimeEvents.filter(l => l.overUnderHours > 0).length > 0
      ? laytimeEvents.filter(l => l.overUnderHours > 0).reduce((s, l) => s + l.overUnderHours / 24, 0) / laytimeEvents.filter(l => l.overUnderHours > 0).length : 0;

    const byRoute: Record<string, number> = {};
    recons.filter(r => r.delta > 0).forEach(r => { byRoute[r.route] = (byRoute[r.route] || 0) + r.delta; });
    const topLanes = Object.entries(byRoute).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const byCostType: Record<string, { expected: number; actual: number }> = {};
    recons.forEach(r => {
      if (!byCostType[r.costType]) byCostType[r.costType] = { expected: 0, actual: 0 };
      byCostType[r.costType].expected += r.expectedAmount;
      byCostType[r.costType].actual += r.actualAmount;
    });

    return {
      totalExpected, totalActual, totalLeakage, recoveredLeakage,
      totalDemurrage, totalDespatch, avgDemurrageDays: +avgDemurrageDays.toFixed(1),
      openDisputes: disputes.length,
      topLanes, byCostType,
    };
  }, [recons, laytimeEvents, disputes]);

  return {
    recons, filteredRecons, laytimeEvents, disputes, kpis,
    costTypeFilter, setCostTypeFilter, statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    selectedReconId, setSelectedReconId, selectedRecon,
    selectedLaytimeId, setSelectedLaytimeId, selectedLaytime,
    activeTab, setActiveTab,
  };
}
