import { useState, useMemo } from 'react';
import { subDays, format, addDays } from 'date-fns';

export interface OpsFlow {
  id: string;
  tradeRef: string;
  flowDate: string;
  plannedQty: number | null;
  nominatedQty: number | null;
  scheduledQty: number | null;
  actualQty: number | null;
  uom: string;
  location: string;
  counterparty: string;
  product: string;
  direction: 'buy' | 'sell';
  sourceDocRef: string;
  tolerancePct: number;
  varianceStatus: 'ok' | 'warning' | 'breach';
  exceptionType: string | null;
  ownerRole: string;
}

export interface WaterfallSummary {
  location: string;
  planned: number;
  nominated: number;
  scheduled: number;
  actual: number;
}

const LOCATIONS = ['Houston TX', 'Rotterdam', 'Singapore', 'Fujairah', 'Cushing OK'];
const PRODUCTS = ['Crude WTI', 'Brent', 'RBOB Gasoline', 'Natural Gas', 'Heating Oil'];
const CPS = ['Shell Trading', 'BP Oil', 'Vitol SA', 'Trafigura', 'Glencore'];
const EXCEPTION_TYPES = ['under_delivery', 'over_delivery', 'wrong_location', 'missing_actuals', 'missing_nomination'];

function generateFlows(): OpsFlow[] {
  const flows: OpsFlow[] = [];
  for (let i = 0; i < 60; i++) {
    const planned = 5000 + Math.floor(Math.random() * 20000);
    const nominated = i % 8 === 0 ? null : planned * (0.95 + Math.random() * 0.1);
    const scheduled = nominated ? nominated * (0.97 + Math.random() * 0.06) : null;
    const actual = i % 10 === 0 ? null : (scheduled ? scheduled * (0.96 + Math.random() * 0.08) : null);

    let varianceStatus: OpsFlow['varianceStatus'] = 'ok';
    let exceptionType: string | null = null;

    if (actual === null && planned) { exceptionType = 'missing_actuals'; varianceStatus = 'breach'; }
    else if (nominated === null && planned) { exceptionType = 'missing_nomination'; varianceStatus = 'breach'; }
    else if (actual && planned) {
      const pctDiff = Math.abs(actual - planned) / planned * 100;
      if (pctDiff > 2) { varianceStatus = 'breach'; exceptionType = actual < planned ? 'under_delivery' : 'over_delivery'; }
      else if (pctDiff > 0.5) { varianceStatus = 'warning'; }
    }

    flows.push({
      id: `of-${i}`,
      tradeRef: `T-2026-${String(3000 + Math.floor(i / 3)).padStart(5, '0')}`,
      flowDate: format(subDays(new Date(), Math.floor(i / 3)), 'yyyy-MM-dd'),
      plannedQty: planned,
      nominatedQty: nominated ? Math.round(nominated) : null,
      scheduledQty: scheduled ? Math.round(scheduled) : null,
      actualQty: actual ? Math.round(actual) : null,
      uom: 'BBL',
      location: LOCATIONS[i % LOCATIONS.length],
      counterparty: CPS[i % CPS.length],
      product: PRODUCTS[i % PRODUCTS.length],
      direction: i % 3 === 0 ? 'sell' : 'buy',
      sourceDocRef: `OPS-${format(subDays(new Date(), Math.floor(i / 3)), 'yyyyMMdd')}-${String(i).padStart(3, '0')}`,
      tolerancePct: 0.5,
      varianceStatus,
      exceptionType,
      ownerRole: 'Ops',
    });
  }
  return flows;
}

export function useOpsActuals() {
  const [flows] = useState(generateFlows);
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => flows.filter(f => {
    if (locationFilter !== 'all' && f.location !== locationFilter) return false;
    if (statusFilter !== 'all' && f.varianceStatus !== statusFilter) return false;
    if (searchQuery && !f.tradeRef.toLowerCase().includes(searchQuery.toLowerCase()) && !f.counterparty.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }), [flows, locationFilter, statusFilter, searchQuery]);

  const waterfall = useMemo((): WaterfallSummary[] => {
    return LOCATIONS.map(loc => {
      const locFlows = flows.filter(f => f.location === loc);
      return {
        location: loc,
        planned: locFlows.reduce((s, f) => s + (f.plannedQty || 0), 0),
        nominated: locFlows.reduce((s, f) => s + (f.nominatedQty || 0), 0),
        scheduled: locFlows.reduce((s, f) => s + (f.scheduledQty || 0), 0),
        actual: locFlows.reduce((s, f) => s + (f.actualQty || 0), 0),
      };
    });
  }, [flows]);

  const stats = useMemo(() => {
    const withActuals = flows.filter(f => f.actualQty !== null);
    const breaches = flows.filter(f => f.varianceStatus === 'breach');
    const totalPlanned = flows.reduce((s, f) => s + (f.plannedQty || 0), 0);
    const totalActual = flows.reduce((s, f) => s + (f.actualQty || 0), 0);
    return {
      totalFlows: flows.length,
      fulfillmentRate: totalPlanned > 0 ? Math.round(totalActual / totalPlanned * 100) : 0,
      breachCount: breaches.length,
      missingActuals: flows.filter(f => f.exceptionType === 'missing_actuals').length,
      missingNominations: flows.filter(f => f.exceptionType === 'missing_nomination').length,
      avgVariancePct: withActuals.length > 0 ? Math.round(withActuals.reduce((s, f) => s + Math.abs((f.actualQty! - (f.plannedQty || 0)) / (f.plannedQty || 1)) * 100, 0) / withActuals.length * 10) / 10 : 0,
    };
  }, [flows]);

  return {
    flows, filtered, waterfall, stats,
    locationFilter, setLocationFilter,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    locations: LOCATIONS,
  };
}
