import { useState, useMemo } from 'react';

export interface Movement {
  id: string;
  movement_ref: string;
  movement_type: 'shipment' | 'transfer' | 'pipeline' | 'truck' | 'rail' | 'vessel';
  status: 'scheduled' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  product: string;
  quantity: number;
  uom: string;
  quality_grade?: string;
  density?: number;
  temperature?: number;
  origin_location: string;
  destination_location: string;
  counterparty: string;
  contract_ref?: string;
  carrier?: string;
  vessel_name?: string;
  scheduled_date: string;
  actual_date?: string;
  source_system: string;
}

export interface Nomination {
  id: string;
  nomination_ref: string;
  status: 'draft' | 'submitted' | 'confirmed' | 'rejected' | 'expired';
  pipeline?: string;
  market?: string;
  product: string;
  quantity: number;
  uom: string;
  counterparty?: string;
  contract_ref?: string;
  nomination_date: string;
  flow_date: string;
  cycle?: string;
  location?: string;
  source_system: string;
}

export interface InventorySnapshot {
  id: string;
  location: string;
  tank_id?: string;
  warehouse_id?: string;
  product: string;
  quantity: number;
  uom: string;
  quality_grade?: string;
  density?: number;
  temperature?: number;
  snapshot_date: string;
  source_system: string;
  valuation_price?: number;
  valuation_currency?: string;
}

export interface LogReconResult {
  id: string;
  recon_type: string;
  movement_id?: string;
  status: 'matched' | 'partial' | 'unmatched' | 'tolerance_breach' | 'exception';
  quantity_expected: number;
  quantity_actual: number;
  quantity_variance: number;
  variance_pct: number;
  uom: string;
  tolerance_applied: number;
  quality_match: boolean;
  counterpart_ref?: string;
  counterpart_source?: string;
  reconciled_at?: string;
}

// UOM conversion factors to bbl
const UOM_TO_BBL: Record<string, number> = {
  bbl: 1,
  mt: 7.33,       // metric tons → bbl (crude avg)
  gal: 0.02381,
  l: 0.006293,
  mmbtu: 0.1724,  // approx energy equiv
  gj: 0.1636,
};

export const convertUOM = (qty: number, from: string, to: string): number => {
  const fromFactor = UOM_TO_BBL[from.toLowerCase()] ?? 1;
  const toFactor = UOM_TO_BBL[to.toLowerCase()] ?? 1;
  return (qty * fromFactor) / toFactor;
};

// Demo data
const demoMovements: Movement[] = [
  { id: 'mv-001', movement_ref: 'MOV-2026-0412', movement_type: 'vessel', status: 'completed', product: 'Crude WTI', quantity: 450000, uom: 'bbl', quality_grade: 'API 39.6', density: 0.827, temperature: 60, origin_location: 'Houston, TX', destination_location: 'Rotterdam, NL', counterparty: 'Shell Trading', contract_ref: 'CT-8834', carrier: 'Maersk Tankers', vessel_name: 'MT Nordic', scheduled_date: '2026-02-01', actual_date: '2026-02-03', source_system: 'ETRM' },
  { id: 'mv-002', movement_ref: 'MOV-2026-0413', movement_type: 'pipeline', status: 'in_transit', product: 'Natural Gas', quantity: 125000, uom: 'mmbtu', origin_location: 'Permian Basin', destination_location: 'Henry Hub', counterparty: 'BP Energy', contract_ref: 'CT-9021', scheduled_date: '2026-02-10', source_system: 'ETRM' },
  { id: 'mv-003', movement_ref: 'MOV-2026-0414', movement_type: 'truck', status: 'delivered', product: 'Diesel', quantity: 8500, uom: 'bbl', quality_grade: 'ULSD', origin_location: 'Refinery A', destination_location: 'Terminal B', counterparty: 'Vitol', scheduled_date: '2026-02-05', actual_date: '2026-02-05', source_system: 'ETRM' },
  { id: 'mv-004', movement_ref: 'MOV-2026-0415', movement_type: 'rail', status: 'scheduled', product: 'Ethanol', quantity: 30000, uom: 'gal', origin_location: 'Iowa Plant', destination_location: 'Chicago Terminal', counterparty: 'ADM', contract_ref: 'CT-7720', scheduled_date: '2026-02-15', source_system: 'ETRM' },
  { id: 'mv-005', movement_ref: 'MOV-2026-0416', movement_type: 'transfer', status: 'completed', product: 'Jet Fuel', quantity: 12000, uom: 'mt', origin_location: 'Tank Farm Alpha', destination_location: 'Airport Terminal', counterparty: 'Internal', scheduled_date: '2026-01-28', actual_date: '2026-01-29', source_system: 'ERP' },
];

const demoNominations: Nomination[] = [
  { id: 'nom-001', nomination_ref: 'NOM-PL-2026-0088', status: 'confirmed', pipeline: 'Colonial Pipeline', product: 'Gasoline RBOB', quantity: 75000, uom: 'bbl', counterparty: 'Trafigura', nomination_date: '2026-01-25', flow_date: '2026-02-01', cycle: 'Cycle 1', location: 'Linden, NJ', source_system: 'ETRM' },
  { id: 'nom-002', nomination_ref: 'NOM-PL-2026-0089', status: 'submitted', pipeline: 'Keystone XL', product: 'Crude WCS', quantity: 200000, uom: 'bbl', counterparty: 'Suncor', nomination_date: '2026-02-01', flow_date: '2026-02-10', cycle: 'Monthly', location: 'Hardisty, AB', source_system: 'ETRM' },
  { id: 'nom-003', nomination_ref: 'NOM-ISO-2026-0034', status: 'confirmed', market: 'ERCOT', product: 'Power', quantity: 50000, uom: 'mwh', counterparty: 'Luminant', nomination_date: '2026-02-05', flow_date: '2026-02-06', cycle: 'Day-Ahead', location: 'Hub South', source_system: 'ETRM' },
  { id: 'nom-004', nomination_ref: 'NOM-PL-2026-0090', status: 'rejected', pipeline: 'TAPS', product: 'ANS Crude', quantity: 100000, uom: 'bbl', counterparty: 'ConocoPhillips', nomination_date: '2026-02-03', flow_date: '2026-02-12', location: 'Valdez, AK', source_system: 'ETRM' },
  { id: 'nom-005', nomination_ref: 'NOM-MKT-2026-0012', status: 'draft', market: 'ICE Brent', product: 'Brent Crude', quantity: 50000, uom: 'bbl', counterparty: 'Glencore', nomination_date: '2026-02-10', flow_date: '2026-02-20', source_system: 'ETRM' },
];

const demoInventory: InventorySnapshot[] = [
  { id: 'inv-001', location: 'Houston Terminal', tank_id: 'TK-101', product: 'Crude WTI', quantity: 320000, uom: 'bbl', quality_grade: 'API 39.6', density: 0.827, temperature: 62, snapshot_date: '2026-02-14', source_system: 'ERP', valuation_price: 72.50, valuation_currency: 'USD' },
  { id: 'inv-002', location: 'Houston Terminal', tank_id: 'TK-102', product: 'Diesel', quantity: 85000, uom: 'bbl', quality_grade: 'ULSD', snapshot_date: '2026-02-14', source_system: 'ERP', valuation_price: 92.30, valuation_currency: 'USD' },
  { id: 'inv-003', location: 'Rotterdam Tank Farm', tank_id: 'RTD-A3', product: 'Crude WTI', quantity: 180000, uom: 'bbl', density: 0.830, snapshot_date: '2026-02-14', source_system: 'ERP', valuation_price: 73.10, valuation_currency: 'USD' },
  { id: 'inv-004', location: 'Chicago Terminal', warehouse_id: 'WH-CHI-04', product: 'Ethanol', quantity: 1200000, uom: 'gal', snapshot_date: '2026-02-14', source_system: 'ERP', valuation_price: 2.15, valuation_currency: 'USD' },
  { id: 'inv-005', location: 'Singapore Hub', tank_id: 'SG-T7', product: 'Jet Fuel', quantity: 45000, uom: 'mt', quality_grade: 'Jet A-1', density: 0.804, temperature: 30, snapshot_date: '2026-02-14', source_system: 'ERP', valuation_price: 680, valuation_currency: 'USD' },
];

const demoReconResults: LogReconResult[] = [
  { id: 'lr-001', recon_type: 'Movement vs Invoice', movement_id: 'mv-001', status: 'matched', quantity_expected: 450000, quantity_actual: 449820, quantity_variance: -180, variance_pct: -0.04, uom: 'bbl', tolerance_applied: 0.5, quality_match: true, counterpart_ref: 'INV-SH-88432', counterpart_source: 'NetSuite' },
  { id: 'lr-002', recon_type: 'Movement vs Invoice', movement_id: 'mv-003', status: 'tolerance_breach', quantity_expected: 8500, quantity_actual: 8320, quantity_variance: -180, variance_pct: -2.12, uom: 'bbl', tolerance_applied: 1.0, quality_match: true, counterpart_ref: 'INV-VT-22109', counterpart_source: 'NetSuite' },
  { id: 'lr-003', recon_type: 'Movement vs Settlement', movement_id: 'mv-005', status: 'matched', quantity_expected: 12000, quantity_actual: 11985, quantity_variance: -15, variance_pct: -0.13, uom: 'mt', tolerance_applied: 0.5, quality_match: true, counterpart_ref: 'SETT-INT-0044', counterpart_source: 'ERP' },
  { id: 'lr-004', recon_type: 'Inventory vs Book', status: 'partial', quantity_expected: 325000, quantity_actual: 320000, quantity_variance: -5000, variance_pct: -1.54, uom: 'bbl', tolerance_applied: 0.5, quality_match: false, counterpart_ref: 'BOOK-HOU-TK101', counterpart_source: 'ETRM' },
  { id: 'lr-005', recon_type: 'Nomination vs Actual', movement_id: 'mv-001', status: 'matched', quantity_expected: 450000, quantity_actual: 450000, quantity_variance: 0, variance_pct: 0, uom: 'bbl', tolerance_applied: 0.5, quality_match: true, counterpart_ref: 'NOM-PL-2026-0088', counterpart_source: 'ETRM' },
  { id: 'lr-006', recon_type: 'Movement vs Invoice', status: 'unmatched', quantity_expected: 30000, quantity_actual: 0, quantity_variance: -30000, variance_pct: -100, uom: 'gal', tolerance_applied: 1.0, quality_match: false, counterpart_ref: 'PENDING', counterpart_source: 'NetSuite' },
  { id: 'lr-007', recon_type: 'Movement vs Invoice', status: 'exception', quantity_expected: 200000, quantity_actual: 195000, quantity_variance: -5000, variance_pct: -2.5, uom: 'bbl', tolerance_applied: 0.5, quality_match: false, counterpart_ref: 'INV-SC-44210', counterpart_source: 'NetSuite' },
];

export const useLogistics = () => {
  const [movementFilter, setMovementFilter] = useState<string>('all');
  const [nominationFilter, setNominationFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMovements = useMemo(() => {
    let result = demoMovements;
    if (movementFilter !== 'all') result = result.filter(m => m.status === movementFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.movement_ref.toLowerCase().includes(q) ||
        m.product.toLowerCase().includes(q) ||
        m.counterparty.toLowerCase().includes(q)
      );
    }
    return result;
  }, [movementFilter, searchQuery]);

  const filteredNominations = useMemo(() => {
    let result = demoNominations;
    if (nominationFilter !== 'all') result = result.filter(n => n.status === nominationFilter);
    return result;
  }, [nominationFilter]);

  const reconStats = useMemo(() => {
    const total = demoReconResults.length;
    const matched = demoReconResults.filter(r => r.status === 'matched').length;
    const exceptions = demoReconResults.filter(r => r.status === 'exception' || r.status === 'tolerance_breach').length;
    const unmatched = demoReconResults.filter(r => r.status === 'unmatched').length;
    return { total, matched, exceptions, unmatched, matchRate: total > 0 ? (matched / total * 100) : 0 };
  }, []);

  return {
    movements: filteredMovements,
    nominations: filteredNominations,
    inventory: demoInventory,
    reconResults: demoReconResults,
    reconStats,
    movementFilter, setMovementFilter,
    nominationFilter, setNominationFilter,
    searchQuery, setSearchQuery,
    convertUOM,
  };
};
