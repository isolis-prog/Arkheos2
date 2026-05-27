import { useState, useMemo } from 'react';

export interface MeasurementEvent {
  id: string;
  location: string;
  meterId: string;
  commodity: string;
  measurementDt: string;
  qty: number;
  uom: string;
  qualityAttrs: Record<string, any>;
  temperature: number | null;
  density: number | null;
  source: string;
  sourceSystem: string;
  docRef: string;
}

export interface ReconResult {
  id: string;
  measurementEventId: string | null;
  location: string;
  meterId: string;
  commodity: string;
  reconDate: string;
  expectedQty: number;
  expectedUom: string;
  actualQty: number;
  actualUom: string;
  delta: number;
  deltaPct: number | null;
  deltaValueEst: number;
  adjustmentType: string | null;
  status: 'pending' | 'matched' | 'adjusted' | 'disputed' | 'closed';
  evidenceRequired: boolean;
  evidenceRefs: string[];
  trueUpJournal: any;
  notes: string;
}

export interface UomConversion {
  id: string;
  fromUom: string;
  toUom: string;
  factor: number;
  commodity: string | null;
  validFrom: string;
  validTo: string;
  notes: string;
}

export interface MeasurementsFilters {
  location: string;
  meterId: string;
  commodity: string;
  status: string;
  search: string;
}

const demoMeasurements: MeasurementEvent[] = [
  { id: 'm1', location: 'Cushing Terminal A', meterId: 'MTR-CUS-001', commodity: 'Crude Oil', measurementDt: '2026-03-01T06:00:00Z', qty: 49850, uom: 'bbl', qualityAttrs: { api: 39.5, sulfur: 0.42 }, temperature: 60, density: 0.825, source: 'meter_read', sourceSystem: 'SCADA', docRef: 'TKT-20260301-001' },
  { id: 'm2', location: 'Cushing Terminal A', meterId: 'MTR-CUS-001', commodity: 'Crude Oil', measurementDt: '2026-03-02T06:00:00Z', qty: 50100, uom: 'bbl', qualityAttrs: { api: 39.3, sulfur: 0.44 }, temperature: 58, density: 0.827, source: 'meter_read', sourceSystem: 'SCADA', docRef: 'TKT-20260302-001' },
  { id: 'm3', location: 'Houston Ship Channel', meterId: 'MTR-HSC-004', commodity: 'Crude Oil', measurementDt: '2026-03-03T06:00:00Z', qty: 74200, uom: 'bbl', qualityAttrs: { api: 38.1 }, temperature: 62, density: 0.832, source: 'ticket', sourceSystem: 'Terminal OS', docRef: 'BL-HSC-0445' },
  { id: 'm4', location: 'Rotterdam Tank Farm', meterId: 'MTR-RTD-012', commodity: 'Diesel', measurementDt: '2026-03-10T08:00:00Z', qty: 29750, uom: 'mt', qualityAttrs: { cetane: 52, flashPoint: 66 }, temperature: 15, density: 0.845, source: 'weighbridge', sourceSystem: 'WB System', docRef: 'WB-RTD-2260310' },
  { id: 'm5', location: 'Henry Hub', meterId: 'MTR-HH-007', commodity: 'Natural Gas', measurementDt: '2026-03-01T00:00:00Z', qty: 148500, uom: 'mmbtu', qualityAttrs: { btu: 1032, moisture: 0.02 }, temperature: null, density: null, source: 'iso_metering', sourceSystem: 'Pipeline SCADA', docRef: 'ISO-HH-030126' },
  { id: 'm6', location: 'Fos-sur-Mer LNG', meterId: 'MTR-FOS-002', commodity: 'LNG', measurementDt: '2026-03-20T10:00:00Z', qty: 64800, uom: 'mmbtu', qualityAttrs: { gcv: 1075 }, temperature: -162, density: 0.45, source: 'bl_qty', sourceSystem: 'Terminal', docRef: 'BL-FOS-0891' },
  { id: 'm7', location: 'LME Warehouse Antwerp', meterId: 'MTR-ANT-W01', commodity: 'Copper', measurementDt: '2026-03-15T12:00:00Z', qty: 498.5, uom: 'mt', qualityAttrs: { grade: 'A', purity: 99.99 }, temperature: 20, density: 8.96, source: 'weighbridge', sourceSystem: 'Warehouse', docRef: 'WR-ANT-15032026' },
  { id: 'm8', location: 'Cushing Terminal B', meterId: 'MTR-CUS-003', commodity: 'Crude Oil', measurementDt: '2026-03-05T06:00:00Z', qty: 24700, uom: 'bbl', qualityAttrs: { api: 41.2 }, temperature: 59, density: 0.818, source: 'pipeline_statement', sourceSystem: 'Pipeline Co', docRef: 'PS-CUS-050326' },
];

const demoReconResults: ReconResult[] = [
  { id: 'r1', measurementEventId: 'm1', location: 'Cushing Terminal A', meterId: 'MTR-CUS-001', commodity: 'Crude Oil', reconDate: '2026-03-01', expectedQty: 50000, expectedUom: 'bbl', actualQty: 49850, actualUom: 'bbl', delta: -150, deltaPct: -0.30, deltaValueEst: -10800, adjustmentType: 'shrink', status: 'adjusted', evidenceRequired: true, evidenceRefs: ['TKT-20260301-001'], trueUpJournal: { debit: 'Shrink Expense', credit: 'Inventory', amount: 10800 }, notes: 'Transit shrink within tolerance' },
  { id: 'r2', measurementEventId: 'm3', location: 'Houston Ship Channel', meterId: 'MTR-HSC-004', commodity: 'Crude Oil', reconDate: '2026-03-03', expectedQty: 75000, expectedUom: 'bbl', actualQty: 74200, actualUom: 'bbl', delta: -800, deltaPct: -1.07, deltaValueEst: -57600, adjustmentType: 'imbalance', status: 'disputed', evidenceRequired: true, evidenceRefs: ['BL-HSC-0445'], trueUpJournal: null, notes: 'Qty exceeds tolerance — disputed with terminal' },
  { id: 'r3', measurementEventId: 'm4', location: 'Rotterdam Tank Farm', meterId: 'MTR-RTD-012', commodity: 'Diesel', reconDate: '2026-03-10', expectedQty: 30000, expectedUom: 'mt', actualQty: 29750, actualUom: 'mt', delta: -250, deltaPct: -0.83, deltaValueEst: -187500, adjustmentType: 'loss', status: 'pending', evidenceRequired: true, evidenceRefs: [], trueUpJournal: null, notes: 'Weighbridge variance — pending investigation' },
  { id: 'r4', measurementEventId: 'm5', location: 'Henry Hub', meterId: 'MTR-HH-007', commodity: 'Natural Gas', reconDate: '2026-03-01', expectedQty: 150000, expectedUom: 'mmbtu', actualQty: 148500, actualUom: 'mmbtu', delta: -1500, deltaPct: -1.0, deltaValueEst: -4500, adjustmentType: 'imbalance', status: 'adjusted', evidenceRequired: true, evidenceRefs: ['ISO-HH-030126'], trueUpJournal: { debit: 'Imbalance', credit: 'Revenue', amount: 4500 }, notes: 'Pipeline imbalance settled' },
  { id: 'r5', measurementEventId: 'm6', location: 'Fos-sur-Mer LNG', meterId: 'MTR-FOS-002', commodity: 'LNG', reconDate: '2026-03-20', expectedQty: 65000, expectedUom: 'mmbtu', actualQty: 64800, actualUom: 'mmbtu', delta: -200, deltaPct: -0.31, deltaValueEst: -2400, adjustmentType: 'rounding', status: 'matched', evidenceRequired: false, evidenceRefs: ['BL-FOS-0891'], trueUpJournal: null, notes: 'Within rounding tolerance' },
  { id: 'r6', measurementEventId: 'm7', location: 'LME Warehouse Antwerp', meterId: 'MTR-ANT-W01', commodity: 'Copper', reconDate: '2026-03-15', expectedQty: 500, expectedUom: 'mt', actualQty: 498.5, actualUom: 'mt', delta: -1.5, deltaPct: -0.30, deltaValueEst: -13500, adjustmentType: 'shrink', status: 'pending', evidenceRequired: true, evidenceRefs: [], trueUpJournal: null, notes: 'Warehouse receipt vs deal qty' },
  { id: 'r7', measurementEventId: 'm8', location: 'Cushing Terminal B', meterId: 'MTR-CUS-003', commodity: 'Crude Oil', reconDate: '2026-03-05', expectedQty: 25000, expectedUom: 'bbl', actualQty: 24700, actualUom: 'bbl', delta: -300, deltaPct: -1.20, deltaValueEst: -21600, adjustmentType: 'temperature', status: 'adjusted', evidenceRequired: true, evidenceRefs: ['PS-CUS-050326'], trueUpJournal: { debit: 'Temp Adjustment', credit: 'Inventory', amount: 21600 }, notes: 'Temperature correction applied (59°F vs 60°F std)' },
];

const demoConversions: UomConversion[] = [
  { id: 'u1', fromUom: 'bbl', toUom: 'mt', factor: 0.1364, commodity: 'Crude Oil', validFrom: '2020-01-01', validTo: '2099-12-31', notes: 'API ~39' },
  { id: 'u2', fromUom: 'mt', toUom: 'bbl', factor: 7.33, commodity: 'Crude Oil', validFrom: '2020-01-01', validTo: '2099-12-31', notes: 'API ~39' },
  { id: 'u3', fromUom: 'bbl', toUom: 'm3', factor: 0.15899, commodity: null, validFrom: '2020-01-01', validTo: '2099-12-31', notes: 'Universal' },
  { id: 'u4', fromUom: 'mmbtu', toUom: 'gj', factor: 1.05506, commodity: null, validFrom: '2020-01-01', validTo: '2099-12-31', notes: 'Universal' },
  { id: 'u5', fromUom: 'MWh', toUom: 'gj', factor: 3.6, commodity: 'Power', validFrom: '2020-01-01', validTo: '2099-12-31', notes: 'Standard' },
  { id: 'u6', fromUom: 'mt', toUom: 'bbl', factor: 7.45, commodity: 'Diesel', validFrom: '2020-01-01', validTo: '2099-12-31', notes: 'Density ~0.845' },
];

export function useMeasurements() {
  const [filters, setFilters] = useState<MeasurementsFilters>({
    location: 'all', meterId: 'all', commodity: 'all', status: 'all', search: '',
  });
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  const filteredResults = useMemo(() => {
    return demoReconResults.filter((r) => {
      if (filters.location !== 'all' && r.location !== filters.location) return false;
      if (filters.meterId !== 'all' && r.meterId !== filters.meterId) return false;
      if (filters.commodity !== 'all' && r.commodity !== filters.commodity) return false;
      if (filters.status !== 'all' && r.status !== filters.status) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        return r.location.toLowerCase().includes(s) || r.meterId.toLowerCase().includes(s) || r.commodity.toLowerCase().includes(s);
      }
      return true;
    });
  }, [filters]);

  const selectedResult = selectedResultId ? demoReconResults.find((r) => r.id === selectedResultId) ?? null : null;
  const selectedMeasurement = selectedResult?.measurementEventId
    ? demoMeasurements.find((m) => m.id === selectedResult.measurementEventId) ?? null
    : null;

  const locations = [...new Set(demoReconResults.map((r) => r.location))];
  const meterIds = [...new Set(demoReconResults.map((r) => r.meterId))];
  const commodities = [...new Set(demoReconResults.map((r) => r.commodity))];

  const kpis = useMemo(() => {
    const totalDelta = demoReconResults.reduce((s, r) => s + Math.abs(r.deltaValueEst), 0);
    const totalExpected = demoReconResults.reduce((s, r) => s + r.expectedQty, 0);
    const totalActual = demoReconResults.reduce((s, r) => s + r.actualQty, 0);
    const shrinkRate = totalExpected > 0 ? ((totalExpected - totalActual) / totalExpected * 100) : 0;
    const pending = demoReconResults.filter((r) => r.status === 'pending').length;
    const disputed = demoReconResults.filter((r) => r.status === 'disputed').length;
    return { totalDelta, shrinkRate: +shrinkRate.toFixed(3), pending, disputed, totalResults: demoReconResults.length };
  }, []);

  const topOutlierMeters = useMemo(() => {
    const meterMap: Record<string, { delta: number; count: number }> = {};
    demoReconResults.forEach((r) => {
      if (!meterMap[r.meterId]) meterMap[r.meterId] = { delta: 0, count: 0 };
      meterMap[r.meterId].delta += Math.abs(r.deltaValueEst);
      meterMap[r.meterId].count += 1;
    });
    return Object.entries(meterMap).sort((a, b) => b[1].delta - a[1].delta).slice(0, 5);
  }, []);

  return {
    reconResults: filteredResults,
    measurements: demoMeasurements,
    conversions: demoConversions,
    filters, setFilters,
    selectedResult, selectedMeasurement,
    setSelectedResultId,
    locations, meterIds, commodities,
    kpis, topOutlierMeters,
  };
}
