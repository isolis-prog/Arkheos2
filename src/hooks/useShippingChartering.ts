import { useState, useMemo } from 'react';

// Demo data types
export interface Voyage {
  id: string;
  vessel_name: string;
  charter_type: 'time_charter' | 'voyage_charter';
  cargo: string;
  load_port: string;
  discharge_port: string;
  laycan_start: string;
  laycan_end: string;
  freight_rate: number;
  freight_unit: string;
  status: 'FIXING' | 'CONFIRMED' | 'LOADING' | 'ON_PASSAGE' | 'DISCHARGING' | 'COMPLETED';
  trade_id?: string;
}

export interface VoyageCost {
  id: string;
  voyage_id: string;
  cost_type: string;
  amount: number;
  currency: string;
  cost_date: string;
  notes: string;
}

export interface DemurrageClaim {
  id: string;
  voyage_id: string;
  vessel_name: string;
  counterparty: string;
  allowed_hours: number;
  actual_hours: number;
  demurrage_rate: number;
  despatch_rate: number;
  claim_amount: number;
  status: 'CALCULATING' | 'CLAIM_SENT' | 'DISPUTED' | 'SETTLED';
}

export interface FFAPosition {
  id: string;
  route: string;
  contract_month: string;
  direction: 'bought' | 'sold';
  quantity_lots: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
}

export interface BunkerLifting {
  id: string;
  voyage_id: string;
  vessel_name: string;
  port: string;
  quantity_mt: number;
  grade: string;
  price_per_mt: number;
  lifting_date: string;
  total_cost: number;
}

const demoVoyages: Voyage[] = [
  { id: 'v1', vessel_name: 'MT Pacific Voyager', charter_type: 'voyage_charter', cargo: 'WTI Crude', load_port: 'Houston, TX', discharge_port: 'Rotterdam, NL', laycan_start: '2026-04-15', laycan_end: '2026-04-18', freight_rate: 12.5, freight_unit: 'USD/MT', status: 'CONFIRMED', trade_id: 'T-2024-001' },
  { id: 'v2', vessel_name: 'MV Atlantic Spirit', charter_type: 'time_charter', cargo: 'ULSD', load_port: 'New York, NY', discharge_port: 'Antwerp, BE', laycan_start: '2026-04-10', laycan_end: '2026-04-12', freight_rate: 28000, freight_unit: 'USD/day', status: 'ON_PASSAGE', trade_id: 'T-2024-003' },
  { id: 'v3', vessel_name: 'MT Gulf Runner', charter_type: 'voyage_charter', cargo: 'Gasoline', load_port: 'Corpus Christi, TX', discharge_port: 'Freeport, BS', laycan_start: '2026-04-20', laycan_end: '2026-04-22', freight_rate: 9.8, freight_unit: 'USD/MT', status: 'FIXING' },
  { id: 'v4', vessel_name: 'MV Caspian Star', charter_type: 'voyage_charter', cargo: 'Naphtha', load_port: 'Lake Charles, LA', discharge_port: 'Ulsan, KR', laycan_start: '2026-03-28', laycan_end: '2026-03-30', freight_rate: 18.2, freight_unit: 'USD/MT', status: 'DISCHARGING', trade_id: 'T-2024-007' },
  { id: 'v5', vessel_name: 'MT Eagle Bay', charter_type: 'time_charter', cargo: 'Jet Fuel', load_port: 'Beaumont, TX', discharge_port: 'Santos, BR', laycan_start: '2026-03-15', laycan_end: '2026-03-17', freight_rate: 32000, freight_unit: 'USD/day', status: 'COMPLETED', trade_id: 'T-2024-005' },
  { id: 'v6', vessel_name: 'MV Northern Tide', charter_type: 'voyage_charter', cargo: 'Fuel Oil', load_port: 'Philadelphia, PA', discharge_port: 'Singapore, SG', laycan_start: '2026-04-25', laycan_end: '2026-04-28', freight_rate: 22.0, freight_unit: 'USD/MT', status: 'CONFIRMED' },
];

const demoDemurrage: DemurrageClaim[] = [
  { id: 'd1', voyage_id: 'v4', vessel_name: 'MV Caspian Star', counterparty: 'SK Energy', allowed_hours: 72, actual_hours: 96, demurrage_rate: 45000, despatch_rate: 22500, claim_amount: 45000, status: 'CLAIM_SENT' },
  { id: 'd2', voyage_id: 'v5', vessel_name: 'MT Eagle Bay', counterparty: 'Petrobras', allowed_hours: 48, actual_hours: 38, demurrage_rate: 38000, despatch_rate: 19000, claim_amount: -7917, status: 'SETTLED' },
  { id: 'd3', voyage_id: 'v2', vessel_name: 'MV Atlantic Spirit', counterparty: 'TotalEnergies', allowed_hours: 60, actual_hours: 60, demurrage_rate: 42000, despatch_rate: 21000, claim_amount: 0, status: 'CALCULATING' },
  { id: 'd4', voyage_id: 'v1', vessel_name: 'MT Pacific Voyager', counterparty: 'Vitol', allowed_hours: 72, actual_hours: 108, demurrage_rate: 50000, despatch_rate: 25000, claim_amount: 75000, status: 'DISPUTED' },
];

const demoFFA: FFAPosition[] = [
  { id: 'f1', route: 'TD3C (ME Gulf–China)', contract_month: 'May-26', direction: 'bought', quantity_lots: 5, entry_price: 14.20, current_price: 15.80, unrealized_pnl: 80000 },
  { id: 'f2', route: 'TD20 (W Africa–UKC)', contract_month: 'Jun-26', direction: 'sold', quantity_lots: 3, entry_price: 11.50, current_price: 10.90, unrealized_pnl: 18000 },
  { id: 'f3', route: 'TC2 (Rotterdam–NY)', contract_month: 'May-26', direction: 'bought', quantity_lots: 8, entry_price: 22.10, current_price: 21.40, unrealized_pnl: -56000 },
  { id: 'f4', route: 'TD7 (N Sea–UKC)', contract_month: 'Jul-26', direction: 'sold', quantity_lots: 2, entry_price: 8.30, current_price: 8.75, unrealized_pnl: -9000 },
];

const demoBunker: BunkerLifting[] = [
  { id: 'b1', voyage_id: 'v1', vessel_name: 'MT Pacific Voyager', port: 'Houston, TX', quantity_mt: 1200, grade: 'VLSFO', price_per_mt: 580, lifting_date: '2026-04-14', total_cost: 696000 },
  { id: 'b2', voyage_id: 'v2', vessel_name: 'MV Atlantic Spirit', port: 'New York, NY', quantity_mt: 850, grade: 'VLSFO', price_per_mt: 595, lifting_date: '2026-04-09', total_cost: 505750 },
  { id: 'b3', voyage_id: 'v4', vessel_name: 'MV Caspian Star', port: 'Lake Charles, LA', quantity_mt: 1500, grade: 'HSFO', price_per_mt: 420, lifting_date: '2026-03-27', total_cost: 630000 },
  { id: 'b4', voyage_id: 'v4', vessel_name: 'MV Caspian Star', port: 'Singapore, SG', quantity_mt: 600, grade: 'MGO', price_per_mt: 820, lifting_date: '2026-04-05', total_cost: 492000 },
  { id: 'b5', voyage_id: 'v5', vessel_name: 'MT Eagle Bay', port: 'Beaumont, TX', quantity_mt: 950, grade: 'VLSFO', price_per_mt: 570, lifting_date: '2026-03-14', total_cost: 541500 },
];

export function useShippingChartering() {
  const [activeTab, setActiveTab] = useState('voyages');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVoyages = useMemo(() => {
    return demoVoyages.filter(v => {
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return v.vessel_name.toLowerCase().includes(q) ||
          v.cargo.toLowerCase().includes(q) ||
          v.load_port.toLowerCase().includes(q) ||
          v.discharge_port.toLowerCase().includes(q);
      }
      return true;
    });
  }, [statusFilter, searchQuery]);

  const voyageKPIs = useMemo(() => ({
    totalVoyages: demoVoyages.length,
    activeVoyages: demoVoyages.filter(v => !['COMPLETED', 'FIXING'].includes(v.status)).length,
    totalDemurrage: demoDemurrage.filter(d => d.claim_amount > 0).reduce((s, d) => s + d.claim_amount, 0),
    totalDespatch: Math.abs(demoDemurrage.filter(d => d.claim_amount < 0).reduce((s, d) => s + d.claim_amount, 0)),
    ffaExposure: demoFFA.reduce((s, f) => s + f.unrealized_pnl, 0),
    bunkerSpend: demoBunker.reduce((s, b) => s + b.total_cost, 0),
  }), []);

  return {
    activeTab, setActiveTab,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    voyages: filteredVoyages,
    allVoyages: demoVoyages,
    demurrageClaims: demoDemurrage,
    ffaPositions: demoFFA,
    bunkerLiftings: demoBunker,
    kpis: voyageKPIs,
  };
}
