import { useState, useMemo } from 'react';
import { subDays, format } from 'date-fns';

export interface PricePoint {
  id: string;
  indexName: string;
  tenor: string;
  priceDate: string;
  vendorPrice: number;
  etrmPrice: number;
  diff: number;
  diffPct: number;
  withinTolerance: boolean;
  toleranceValue: number;
  toleranceType: 'absolute' | 'relative' | 'ticks';
  sourceVendor: string;
  isStale: boolean;
  isSpike: boolean;
  zScore: number | null;
  isOverridden: boolean;
  overrideReason: string | null;
  isFrozen: boolean;
  snapshotVersion: number;
}

export interface ToleranceConfig {
  id: string;
  indexName: string;
  toleranceType: 'absolute' | 'relative' | 'ticks';
  toleranceValue: number;
  spikeZThreshold: number;
  staleHours: number;
  isActive: boolean;
}

const INDICES = ['WTI Crude', 'Brent Crude', 'Henry Hub NG', 'RBOB Gasoline', 'Heating Oil', 'EUR/USD', 'GBP/USD', 'JPY/USD'];
const TENORS = ['Spot', 'M+1', 'M+2', 'M+3', 'Q+1', 'Q+2', 'Cal+1'];
const VENDORS = ['ICE', 'Platts', 'Argus', 'Bloomberg', 'Reuters'];

function generatePricePoints(): PricePoint[] {
  const points: PricePoint[] = [];
  const basePrices: Record<string, number> = { 'WTI Crude': 72.5, 'Brent Crude': 76.3, 'Henry Hub NG': 3.45, 'RBOB Gasoline': 2.15, 'Heating Oil': 2.38, 'EUR/USD': 1.085, 'GBP/USD': 1.265, 'JPY/USD': 0.0067 };

  for (let d = 0; d < 5; d++) {
    const date = format(subDays(new Date(), d), 'yyyy-MM-dd');
    INDICES.forEach((idx, ii) => {
      const tenorsForIdx = idx.includes('USD') ? ['Spot'] : TENORS.slice(0, 4 + Math.floor(Math.random() * 3));
      tenorsForIdx.forEach((tenor, ti) => {
        const base = basePrices[idx] * (1 + ti * 0.005) * (1 + (Math.random() - 0.5) * 0.02);
        const vendor = Math.round(base * 10000) / 10000;
        const etrm = vendor * (1 + (Math.random() - 0.5) * 0.006);
        const etrmRound = Math.round(etrm * 10000) / 10000;
        const diff = Math.round((etrmRound - vendor) * 10000) / 10000;
        const diffPct = Math.round(Math.abs(diff / vendor) * 10000) / 100;
        const tol = idx.includes('USD') ? 0.001 : (idx.includes('NG') ? 0.02 : 0.15);
        const within = Math.abs(diff) <= tol;
        const isStale = d >= 3 && ti === 0 && ii % 4 === 0;
        const zScore = Math.abs(diff / (tol || 0.01));
        const isSpike = zScore > 2.5;

        points.push({
          id: `pp-${d}-${ii}-${ti}`,
          indexName: idx, tenor, priceDate: date,
          vendorPrice: vendor, etrmPrice: etrmRound, diff, diffPct,
          withinTolerance: within, toleranceValue: tol,
          toleranceType: idx.includes('USD') ? 'absolute' : 'absolute',
          sourceVendor: VENDORS[ii % VENDORS.length],
          isStale, isSpike, zScore: Math.round(zScore * 100) / 100,
          isOverridden: !within && Math.random() > 0.7,
          overrideReason: !within && Math.random() > 0.7 ? 'Confirmed with vendor' : null,
          isFrozen: d >= 2, snapshotVersion: d >= 2 ? 2 : 1,
        });
      });
    });
  }
  return points;
}

function generateConfigs(): ToleranceConfig[] {
  return INDICES.map((idx, i) => ({
    id: `tc-${i}`, indexName: idx,
    toleranceType: 'absolute' as const,
    toleranceValue: idx.includes('USD') ? 0.001 : idx.includes('NG') ? 0.02 : 0.15,
    spikeZThreshold: 2.0, staleHours: 24, isActive: true,
  }));
}

export function useMarketDataControls() {
  const [points] = useState(generatePricePoints);
  const [configs] = useState(generateConfigs);
  const [indexFilter, setIndexFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const dates = useMemo(() => [...new Set(points.map(p => p.priceDate))].sort().reverse(), [points]);

  const filtered = useMemo(() => points.filter(p => {
    if (indexFilter !== 'all' && p.indexName !== indexFilter) return false;
    if (dateFilter !== 'all' && p.priceDate !== dateFilter) return false;
    if (statusFilter === 'breach' && p.withinTolerance) return false;
    if (statusFilter === 'stale' && !p.isStale) return false;
    if (statusFilter === 'spike' && !p.isSpike) return false;
    if (statusFilter === 'overridden' && !p.isOverridden) return false;
    if (searchQuery && !p.indexName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }), [points, indexFilter, dateFilter, statusFilter, searchQuery]);

  const topOffenders = useMemo(() => {
    const byIndex = new Map<string, { breaches: number; maxDiff: number }>();
    points.forEach(p => {
      if (!p.withinTolerance) {
        const cur = byIndex.get(p.indexName) || { breaches: 0, maxDiff: 0 };
        cur.breaches++;
        cur.maxDiff = Math.max(cur.maxDiff, Math.abs(p.diff));
        byIndex.set(p.indexName, cur);
      }
    });
    return [...byIndex.entries()].map(([name, data]) => ({ indexName: name, ...data })).sort((a, b) => b.breaches - a.breaches).slice(0, 8);
  }, [points]);

  const stats = useMemo(() => {
    const total = points.length;
    const within = points.filter(p => p.withinTolerance).length;
    return {
      total,
      withinTolerancePct: Math.round(within / total * 100),
      breaches: total - within,
      staleCount: points.filter(p => p.isStale).length,
      spikeCount: points.filter(p => p.isSpike).length,
      overriddenCount: points.filter(p => p.isOverridden).length,
      frozenCount: points.filter(p => p.isFrozen).length,
    };
  }, [points]);

  return {
    points, filtered, configs, topOffenders, stats, dates,
    indexFilter, setIndexFilter, dateFilter, setDateFilter,
    statusFilter, setStatusFilter, searchQuery, setSearchQuery,
    indices: INDICES,
  };
}
