import { useState, useMemo } from 'react';

export interface NominationLine {
  id: string;
  batchId: string;
  dealId: string;
  deliveryId: string;
  counterparty: string;
  legalEntity: string;
  bookPortfolio: string;
  commodity: string;
  location: string;
  startDt: string;
  endDt: string;
  qty: number;
  uom: string;
  status: 'draft' | 'submitted' | 'confirmed' | 'revised' | 'cancelled' | 'expired';
  revisionNo: number;
  sourceSystem: string;
  etrmQty: number | null;
  etrmLocation: string | null;
  etrmStartDt: string | null;
  etrmEndDt: string | null;
  reconStatus: 'pending' | 'matched' | 'break' | 'partial';
  reconResult: {
    reasons?: string[];
    qtyDelta?: number;
    qtyDeltaPct?: number;
    windowDeltaDays?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleEvent {
  id: string;
  nominationLineId: string;
  eventType: string;
  oldValue: any;
  newValue: any;
  actorName: string;
  reason: string;
  createdAt: string;
}

export interface SchedulingFilters {
  commodity: string;
  location: string;
  counterparty: string;
  book: string;
  reconStatus: string;
  search: string;
}

const demoNominations: NominationLine[] = [
  {
    id: '1', batchId: 'b1', dealId: 'DL-2026-0451', deliveryId: 'DEL-001',
    counterparty: 'Shell Trading', legalEntity: 'ArkheOS US LLC', bookPortfolio: 'Crude-WTI',
    commodity: 'Crude Oil', location: 'Cushing, OK', startDt: '2026-03-01T00:00:00Z', endDt: '2026-03-05T00:00:00Z',
    qty: 50000, uom: 'bbl', status: 'confirmed', revisionNo: 2, sourceSystem: 'ETRM',
    etrmQty: 50000, etrmLocation: 'Cushing, OK', etrmStartDt: '2026-03-01T00:00:00Z', etrmEndDt: '2026-03-05T00:00:00Z',
    reconStatus: 'matched', reconResult: {}, createdAt: '2026-02-15T10:00:00Z', updatedAt: '2026-02-18T14:30:00Z',
  },
  {
    id: '2', batchId: 'b1', dealId: 'DL-2026-0452', deliveryId: 'DEL-002',
    counterparty: 'BP Commodities', legalEntity: 'ArkheOS US LLC', bookPortfolio: 'Crude-WTI',
    commodity: 'Crude Oil', location: 'Houston Ship Channel', startDt: '2026-03-03T00:00:00Z', endDt: '2026-03-07T00:00:00Z',
    qty: 75000, uom: 'bbl', status: 'submitted', revisionNo: 1, sourceSystem: 'ETRM',
    etrmQty: 80000, etrmLocation: 'Houston Ship Channel', etrmStartDt: '2026-03-03T00:00:00Z', etrmEndDt: '2026-03-07T00:00:00Z',
    reconStatus: 'break', reconResult: { reasons: ['Qty outside tolerance'], qtyDelta: -5000, qtyDeltaPct: -6.25 },
    createdAt: '2026-02-16T09:00:00Z', updatedAt: '2026-02-19T11:00:00Z',
  },
  {
    id: '3', batchId: 'b1', dealId: 'DL-2026-0453', deliveryId: 'DEL-003',
    counterparty: 'Vitol SA', legalEntity: 'ArkheOS EU BV', bookPortfolio: 'Products-Diesel',
    commodity: 'Diesel', location: 'Rotterdam', startDt: '2026-03-10T00:00:00Z', endDt: '2026-03-12T00:00:00Z',
    qty: 30000, uom: 'mt', status: 'confirmed', revisionNo: 3, sourceSystem: 'ETRM',
    etrmQty: 30000, etrmLocation: 'ARA Hub', etrmStartDt: '2026-03-10T00:00:00Z', etrmEndDt: '2026-03-12T00:00:00Z',
    reconStatus: 'break', reconResult: { reasons: ['Location mismatch'] },
    createdAt: '2026-02-14T08:00:00Z', updatedAt: '2026-02-20T16:00:00Z',
  },
  {
    id: '4', batchId: 'b2', dealId: 'DL-2026-0460', deliveryId: 'DEL-004',
    counterparty: 'Trafigura', legalEntity: 'ArkheOS US LLC', bookPortfolio: 'Gas-HH',
    commodity: 'Natural Gas', location: 'Henry Hub', startDt: '2026-03-01T00:00:00Z', endDt: '2026-03-31T00:00:00Z',
    qty: 150000, uom: 'mmbtu', status: 'submitted', revisionNo: 1, sourceSystem: 'ETRM',
    etrmQty: null, etrmLocation: null, etrmStartDt: null, etrmEndDt: null,
    reconStatus: 'break', reconResult: { reasons: ['Missing schedule'] },
    createdAt: '2026-02-17T07:00:00Z', updatedAt: '2026-02-17T07:00:00Z',
  },
  {
    id: '5', batchId: 'b2', dealId: 'DL-2026-0461', deliveryId: 'DEL-005',
    counterparty: 'Glencore', legalEntity: 'ArkheOS EU BV', bookPortfolio: 'Metals-Copper',
    commodity: 'Copper', location: 'LME Warehouse, Antwerp', startDt: '2026-03-15T00:00:00Z', endDt: '2026-03-15T00:00:00Z',
    qty: 500, uom: 'mt', status: 'revised', revisionNo: 2, sourceSystem: 'ETRM',
    etrmQty: 500, etrmLocation: 'LME Warehouse, Antwerp', etrmStartDt: '2026-03-14T00:00:00Z', etrmEndDt: '2026-03-14T00:00:00Z',
    reconStatus: 'break', reconResult: { reasons: ['Window mismatch'], windowDeltaDays: 1 },
    createdAt: '2026-02-13T12:00:00Z', updatedAt: '2026-02-21T09:00:00Z',
  },
  {
    id: '6', batchId: 'b2', dealId: 'DL-2026-0462', deliveryId: 'DEL-006',
    counterparty: 'Shell Trading', legalEntity: 'ArkheOS US LLC', bookPortfolio: 'Crude-WTI',
    commodity: 'Crude Oil', location: 'Midland, TX', startDt: '2026-03-08T00:00:00Z', endDt: '2026-03-10T00:00:00Z',
    qty: 25000, uom: 'bbl', status: 'confirmed', revisionNo: 1, sourceSystem: 'ETRM',
    etrmQty: 25000, etrmLocation: 'Midland, TX', etrmStartDt: '2026-03-08T00:00:00Z', etrmEndDt: '2026-03-10T00:00:00Z',
    reconStatus: 'matched', reconResult: {}, createdAt: '2026-02-18T10:00:00Z', updatedAt: '2026-02-19T10:00:00Z',
  },
  {
    id: '7', batchId: 'b2', dealId: 'DL-2026-0463', deliveryId: 'DEL-007',
    counterparty: 'TotalEnergies', legalEntity: 'ArkheOS EU BV', bookPortfolio: 'LNG-Spot',
    commodity: 'LNG', location: 'Fos-sur-Mer', startDt: '2026-03-20T00:00:00Z', endDt: '2026-03-22T00:00:00Z',
    qty: 65000, uom: 'mmbtu', status: 'submitted', revisionNo: 1, sourceSystem: 'ETRM',
    etrmQty: 65000, etrmLocation: 'Fos-sur-Mer', etrmStartDt: '2026-03-20T00:00:00Z', etrmEndDt: '2026-03-22T00:00:00Z',
    reconStatus: 'matched', reconResult: {}, createdAt: '2026-02-20T14:00:00Z', updatedAt: '2026-02-20T14:00:00Z',
  },
  {
    id: '8', batchId: 'b3', dealId: 'DL-2026-0451', deliveryId: 'DEL-008',
    counterparty: 'Shell Trading', legalEntity: 'ArkheOS US LLC', bookPortfolio: 'Crude-WTI',
    commodity: 'Crude Oil', location: 'Cushing, OK', startDt: '2026-03-06T00:00:00Z', endDt: '2026-03-08T00:00:00Z',
    qty: 50000, uom: 'bbl', status: 'cancelled', revisionNo: 1, sourceSystem: 'ETRM',
    etrmQty: 50000, etrmLocation: 'Cushing, OK', etrmStartDt: '2026-03-06T00:00:00Z', etrmEndDt: '2026-03-08T00:00:00Z',
    reconStatus: 'break', reconResult: { reasons: ['Late nomination', 'Duplicate'] },
    createdAt: '2026-02-21T06:00:00Z', updatedAt: '2026-02-21T08:00:00Z',
  },
];

const demoEvents: ScheduleEvent[] = [
  { id: 'e1', nominationLineId: '1', eventType: 'nomination_submitted', oldValue: null, newValue: { qty: 45000 }, actorName: 'John Doe', reason: 'Initial nomination', createdAt: '2026-02-15T10:00:00Z' },
  { id: 'e2', nominationLineId: '1', eventType: 'qty_change', oldValue: { qty: 45000 }, newValue: { qty: 50000 }, actorName: 'Jane Smith', reason: 'Adjusted per ops', createdAt: '2026-02-17T14:00:00Z' },
  { id: 'e3', nominationLineId: '1', eventType: 'confirmation', oldValue: null, newValue: { status: 'confirmed' }, actorName: 'System', reason: 'Auto-confirmed', createdAt: '2026-02-18T14:30:00Z' },
  { id: 'e4', nominationLineId: '3', eventType: 'nomination_submitted', oldValue: null, newValue: { location: 'Rotterdam' }, actorName: 'Pierre Dupont', reason: 'Initial', createdAt: '2026-02-14T08:00:00Z' },
  { id: 'e5', nominationLineId: '3', eventType: 'location_change', oldValue: { location: 'ARA Hub' }, newValue: { location: 'Rotterdam' }, actorName: 'Pierre Dupont', reason: 'Terminal changed', createdAt: '2026-02-16T10:00:00Z' },
  { id: 'e6', nominationLineId: '5', eventType: 'window_change', oldValue: { start: '2026-03-14' }, newValue: { start: '2026-03-15' }, actorName: 'Maria Garcia', reason: 'Vessel delay', createdAt: '2026-02-20T09:00:00Z' },
];

export function useScheduling() {
  const [filters, setFilters] = useState<SchedulingFilters>({
    commodity: 'all', location: 'all', counterparty: 'all', book: 'all', reconStatus: 'all', search: '',
  });
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return demoNominations.filter((n) => {
      if (filters.commodity !== 'all' && n.commodity !== filters.commodity) return false;
      if (filters.location !== 'all' && n.location !== filters.location) return false;
      if (filters.counterparty !== 'all' && n.counterparty !== filters.counterparty) return false;
      if (filters.book !== 'all' && n.bookPortfolio !== filters.book) return false;
      if (filters.reconStatus !== 'all' && n.reconStatus !== filters.reconStatus) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        return n.dealId.toLowerCase().includes(s) || n.counterparty.toLowerCase().includes(s) || n.location.toLowerCase().includes(s);
      }
      return true;
    });
  }, [filters]);

  const selectedLine = selectedLineId ? demoNominations.find((n) => n.id === selectedLineId) ?? null : null;
  const selectedEvents = selectedLineId ? demoEvents.filter((e) => e.nominationLineId === selectedLineId) : [];

  const commodities = [...new Set(demoNominations.map((n) => n.commodity))];
  const locations = [...new Set(demoNominations.map((n) => n.location))];
  const counterparties = [...new Set(demoNominations.map((n) => n.counterparty))];
  const books = [...new Set(demoNominations.map((n) => n.bookPortfolio))];

  const kpis = useMemo(() => {
    const total = demoNominations.length;
    const matched = demoNominations.filter((n) => n.reconStatus === 'matched').length;
    const breaks = demoNominations.filter((n) => n.reconStatus === 'break').length;
    const onTime = demoNominations.filter((n) => !n.reconResult.reasons?.includes('Late nomination')).length;
    const estImpact = demoNominations
      .filter((n) => n.reconResult.qtyDelta)
      .reduce((sum, n) => sum + Math.abs(n.reconResult.qtyDelta ?? 0) * 72, 0); // ~$72/bbl estimate
    return { total, matched, breaks, onTimePct: Math.round((onTime / total) * 100), estImpact };
  }, []);

  const topBreakLocations = useMemo(() => {
    const locMap: Record<string, number> = {};
    demoNominations.filter((n) => n.reconStatus === 'break').forEach((n) => {
      locMap[n.location] = (locMap[n.location] || 0) + 1;
    });
    return Object.entries(locMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, []);

  return {
    nominations: filtered,
    allNominations: demoNominations,
    filters, setFilters,
    selectedLine, selectedEvents,
    setSelectedLineId,
    commodities, locations, counterparties, books,
    kpis, topBreakLocations,
  };
}
