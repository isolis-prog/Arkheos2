import { useState, useMemo } from 'react';

// ── Constants ──────────────────────────────────────────────────────
const COMMODITIES = {
  'Natural Gas': [
    'Henry Hub', 'Chicago Citygate', 'Waha', 'Permian Basin',
    'SoCal Gas', 'Dominion South', 'Algonquin Citygate',
  ],
  'Crude Oil': ['WTI Cushing', 'Brent', 'WCS', 'MEH'],
  'Electricity': ['ERCOT', 'PJM', 'CAISO', 'MISO', 'SPP', 'NYISO', 'ISO-NE'],
  'NGLs': ['Mont Belvieu Ethane', 'Propane', 'Butane', 'Natural Gasoline'],
} as const;

const DESKS = ['Gas Trading', 'Power Trading', 'Crude Desk', 'NGL Desk', 'Hedging'];
const COUNTERPARTIES = ['Shell Trading', 'BP Energy', 'Vitol', 'Trafigura', 'Cargill', 'Mercuria', 'Gunvor', 'Koch Supply'];
const POSITION_TYPES = ['PHYSICAL', 'FINANCIAL', 'HEDGE'] as const;
const UNITS: Record<string, string> = {
  'Natural Gas': 'MMBtu',
  'Crude Oil': 'BBL',
  'Electricity': 'MWh',
  'NGLs': 'BBL',
};

// ── Seeded random ──────────────────────────────────────────────────
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Types ──────────────────────────────────────────────────────────
export interface Position {
  id: string;
  commodity: string;
  commodityGroup: string;
  location: string;
  desk: string;
  counterparty: string;
  longQty: number;
  shortQty: number;
  netQty: number;
  unit: string;
  deliveryPeriodStart: string;
  deliveryPeriodEnd: string;
  positionType: 'PHYSICAL' | 'FINANCIAL' | 'HEDGE';
  entryPrice: number;
  currency: string;
  tradeDate: string;
}

export interface MtMPosition extends Position {
  marketPrice: number;
  priceDelta: number;
  unrealizedPnlPerUnit: number;
  totalUnrealizedPnl: number;
  asOfTimestamp: string;
  priceSource: string;
}

export interface RiskLimit {
  id: string;
  limitName: string;
  limitCategory: 'internal' | 'regulatory';
  scopeCommodity: string | null;
  scopeDesk: string | null;
  scopeCounterparty: string | null;
  limitValue: number;
  unit: string;
  currentExposure: number;
  utilizationPct: number;
  warningThresholdPct: number;
  breachThresholdPct: number;
  status: 'green' | 'amber' | 'red' | 'critical';
  ownerName: string;
  isActive: boolean;
}

export interface VaRResult {
  totalVaR: number;
  confidenceLevel: number;
  timeHorizon: number;
  byComponent: { commodity: string; var: number }[];
  timeSeries: { date: string; var: number }[];
}

export interface PositionFilters {
  commodity: string;
  desk: string;
  counterparty: string;
  positionType: string;
  viewMode: 'gross' | 'net';
}

export interface MtMFilters {
  commodity: string;
  desk: string;
  priceSource: string;
}

// ── CFTC Reference Limits ──────────────────────────────────────────
export const CFTC_LIMITS = [
  { name: 'NYMEX Henry Hub Natural Gas — Spot Month', value: 1000, unit: 'contracts', note: '1 contract = 10,000 MMBtu' },
  { name: 'NYMEX WTI Crude Oil — Spot Month', value: 3000, unit: 'contracts', note: '1 contract = 1,000 BBL' },
  { name: 'NYMEX RBOB Gasoline — Spot Month', value: 1000, unit: 'contracts', note: '' },
  { name: 'NYMEX Heating Oil — Spot Month', value: 1000, unit: 'contracts', note: '' },
  { name: 'NYMEX Natural Gas — All Months Combined', value: 12000, unit: 'contracts', note: '' },
];

// ── Generate demo positions ────────────────────────────────────────
function generatePositions(): Position[] {
  const rand = mulberry32(42);
  const positions: Position[] = [];
  let id = 0;

  for (const [group, locations] of Object.entries(COMMODITIES)) {
    for (const loc of locations) {
      const count = Math.floor(rand() * 4) + 2;
      for (let i = 0; i < count; i++) {
        const desk = DESKS[Math.floor(rand() * DESKS.length)];
        const cpty = COUNTERPARTIES[Math.floor(rand() * COUNTERPARTIES.length)];
        const pType = POSITION_TYPES[Math.floor(rand() * POSITION_TYPES.length)];
        const longQty = Math.round(rand() * 500000);
        const shortQty = Math.round(rand() * 500000);
        const monthOffset = Math.floor(rand() * 6);
        const start = new Date();
        start.setMonth(start.getMonth() + monthOffset);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);

        const basePrice = group === 'Crude Oil' ? 65 + rand() * 20
          : group === 'Electricity' ? 25 + rand() * 60
          : group === 'NGLs' ? 0.5 + rand() * 1.5
          : 2 + rand() * 4;

        positions.push({
          id: `POS-${String(++id).padStart(5, '0')}`,
          commodity: `${group} — ${loc}`,
          commodityGroup: group,
          location: loc,
          desk,
          counterparty: cpty,
          longQty,
          shortQty,
          netQty: longQty - shortQty,
          unit: UNITS[group],
          deliveryPeriodStart: start.toISOString().split('T')[0],
          deliveryPeriodEnd: end.toISOString().split('T')[0],
          positionType: pType,
          entryPrice: Math.round(basePrice * 100) / 100,
          currency: 'USD',
          tradeDate: new Date(Date.now() - Math.floor(rand() * 90) * 86400000).toISOString().split('T')[0],
        });
      }
    }
  }
  return positions;
}

// ── Generate MtM data ──────────────────────────────────────────────
function addMtM(positions: Position[]): MtMPosition[] {
  const rand = mulberry32(99);
  return positions.map((p) => {
    const marketPrice = Math.round((p.entryPrice * (0.9 + rand() * 0.2)) * 100) / 100;
    const priceDelta = Math.round((marketPrice - p.entryPrice) * 100) / 100;
    const unrealizedPerUnit = p.netQty >= 0 ? priceDelta : -priceDelta;
    return {
      ...p,
      marketPrice,
      priceDelta,
      unrealizedPnlPerUnit: Math.round(unrealizedPerUnit * 100) / 100,
      totalUnrealizedPnl: Math.round(unrealizedPerUnit * Math.abs(p.netQty) * 100) / 100,
      asOfTimestamp: new Date().toISOString(),
      priceSource: rand() > 0.3 ? 'Valuation Curve' : 'Manual Override',
    };
  });
}

// ── Generate Risk Limits ───────────────────────────────────────────
function generateRiskLimits(): RiskLimit[] {
  const rand = mulberry32(77);
  const limits: RiskLimit[] = [];
  const specs: { name: string; commodity: string | null; desk: string | null; cpty: string | null; value: number; unit: string }[] = [
    { name: 'Max Open Position — Natural Gas', commodity: 'Natural Gas', desk: null, cpty: null, value: 5000000, unit: 'MMBtu' },
    { name: 'Max Open Position — Crude Oil', commodity: 'Crude Oil', desk: null, cpty: null, value: 2000000, unit: 'BBL' },
    { name: 'Max Open Position — Electricity', commodity: 'Electricity', desk: null, cpty: null, value: 3000000, unit: 'MWh' },
    { name: 'Max Position — Gas Trading Desk', commodity: null, desk: 'Gas Trading', cpty: null, value: 3000000, unit: 'MMBtu' },
    { name: 'Max Position — Power Trading Desk', commodity: null, desk: 'Power Trading', cpty: null, value: 2500000, unit: 'MWh' },
    { name: 'Max Unrealized Loss — Crude Desk', commodity: null, desk: 'Crude Desk', cpty: null, value: 5000000, unit: 'USD' },
    { name: 'Max Counterparty Exposure — Shell', commodity: null, desk: null, cpty: 'Shell Trading', value: 25000000, unit: 'USD' },
    { name: 'Max Counterparty Exposure — Vitol', commodity: null, desk: null, cpty: 'Vitol', value: 20000000, unit: 'USD' },
    { name: 'Max Single Trade — Natural Gas', commodity: 'Natural Gas', desk: null, cpty: null, value: 500000, unit: 'MMBtu' },
    { name: 'Max Single Trade — Crude Oil', commodity: 'Crude Oil', desk: null, cpty: null, value: 200000, unit: 'BBL' },
  ];

  specs.forEach((s, i) => {
    const utilization = 40 + rand() * 60;
    const status = utilization > 100 ? 'critical' : utilization > 90 ? 'red' : utilization > 75 ? 'amber' : 'green';
    limits.push({
      id: `LIM-${String(i + 1).padStart(4, '0')}`,
      limitName: s.name,
      limitCategory: 'internal',
      scopeCommodity: s.commodity,
      scopeDesk: s.desk,
      scopeCounterparty: s.cpty,
      limitValue: s.value,
      unit: s.unit,
      currentExposure: Math.round(s.value * utilization / 100),
      utilizationPct: Math.round(utilization * 10) / 10,
      warningThresholdPct: 75,
      breachThresholdPct: 90,
      status: status as RiskLimit['status'],
      ownerName: ['John Smith', 'Sarah Chen', 'Mike Torres', 'Lisa Park'][Math.floor(rand() * 4)],
      isActive: true,
    });
  });

  return limits;
}

// ── Generate VaR data ──────────────────────────────────────────────
function generateVaR(confidence: number, horizon: number): VaRResult {
  const rand = mulberry32(55 + confidence + horizon);
  const commodities = Object.keys(COMMODITIES);
  const byComponent = commodities.map((c) => ({
    commodity: c,
    var: Math.round((500000 + rand() * 4500000) * Math.sqrt(horizon) * (confidence === 99 ? 1.28 : 1)),
  }));
  const totalVaR = byComponent.reduce((s, c) => s + c.var, 0);

  const timeSeries: { date: string; var: number }[] = [];
  for (let i = 90; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    timeSeries.push({
      date: d.toISOString().split('T')[0],
      var: Math.round(totalVaR * (0.7 + rand() * 0.6)),
    });
  }

  return { totalVaR, confidenceLevel: confidence, timeHorizon: horizon, byComponent, timeSeries };
}

// ── MtM sparkline data ────────────────────────────────────────────
function generateMtMSparklines(): Record<string, { date: string; pnl: number }[]> {
  const rand = mulberry32(123);
  const result: Record<string, { date: string; pnl: number }[]> = {};
  for (const group of Object.keys(COMMODITIES)) {
    const series: { date: string; pnl: number }[] = [];
    let running = 0;
    for (let i = 30; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      running += (rand() - 0.5) * 200000;
      series.push({ date: d.toISOString().split('T')[0], pnl: Math.round(running) });
    }
    result[group] = series;
  }
  return result;
}

// ── Hooks ──────────────────────────────────────────────────────────
const ALL_POSITIONS = generatePositions();
const ALL_MTM = addMtM(ALL_POSITIONS);
const ALL_LIMITS = generateRiskLimits();
const MTM_SPARKLINES = generateMtMSparklines();

export function usePositionKeeper() {
  const [filters, setFilters] = useState<PositionFilters>({
    commodity: 'all',
    desk: 'all',
    counterparty: 'all',
    positionType: 'all',
    viewMode: 'net',
  });

  const filtered = useMemo(() => {
    return ALL_POSITIONS.filter((p) => {
      if (filters.commodity !== 'all' && p.commodityGroup !== filters.commodity) return false;
      if (filters.desk !== 'all' && p.desk !== filters.desk) return false;
      if (filters.counterparty !== 'all' && p.counterparty !== filters.counterparty) return false;
      if (filters.positionType !== 'all' && p.positionType !== filters.positionType) return false;
      return true;
    });
  }, [filters]);

  const commodityGroups = Object.keys(COMMODITIES);

  return {
    positions: filtered,
    filters,
    setFilters,
    isLoading: false,
    commodityGroups,
    desks: DESKS,
    counterparties: COUNTERPARTIES,
    positionTypes: POSITION_TYPES as unknown as string[],
  };
}

export function useMtMEngine() {
  const [filters, setFilters] = useState<MtMFilters>({
    commodity: 'all',
    desk: 'all',
    priceSource: 'all',
  });

  const filtered = useMemo(() => {
    return ALL_MTM.filter((p) => {
      if (filters.commodity !== 'all' && p.commodityGroup !== filters.commodity) return false;
      if (filters.desk !== 'all' && p.desk !== filters.desk) return false;
      if (filters.priceSource !== 'all' && p.priceSource !== filters.priceSource) return false;
      return true;
    });
  }, [filters]);

  const totalUnrealizedPnl = useMemo(() => filtered.reduce((s, p) => s + p.totalUnrealizedPnl, 0), [filtered]);

  const pnlByCommodity = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((p) => {
      map.set(p.commodityGroup, (map.get(p.commodityGroup) || 0) + p.totalUnrealizedPnl);
    });
    return Array.from(map.entries()).map(([commodity, pnl]) => ({ commodity, pnl }));
  }, [filtered]);

  return {
    positions: filtered,
    totalUnrealizedPnl,
    pnlByCommodity,
    sparklines: MTM_SPARKLINES,
    filters,
    setFilters,
    isLoading: false,
    commodityGroups: Object.keys(COMMODITIES),
    desks: DESKS,
  };
}

export function useRiskLimits() {
  return {
    limits: ALL_LIMITS,
    cftcLimits: CFTC_LIMITS,
    isLoading: false,
  };
}

export function useVaRDashboard() {
  const [confidence, setConfidence] = useState(95);
  const [horizon, setHorizon] = useState(1);

  const result = useMemo(() => generateVaR(confidence, horizon), [confidence, horizon]);

  return {
    result,
    confidence,
    setConfidence,
    horizon,
    setHorizon,
    isLoading: false,
  };
}
