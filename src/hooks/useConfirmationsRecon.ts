import { useState, useMemo } from 'react';

// ── Types ──────────────────────────────────────────────────

export type PriceType = 'fixed' | 'index' | 'formula';
export type ConfirmationStatus = 'pending' | 'matched' | 'partial' | 'unmatched' | 'waived' | 'disputed';
export type ConfMatchType = 'exact' | 'fuzzy' | 'manual';

export interface Confirmation {
  id: string;
  confirmationId: string;
  externalRef: string | null;
  counterparty: string;
  product: string;
  buySell: 'buy' | 'sell';
  quantity: number;
  uom: string;
  priceType: PriceType;
  priceValue: number | null;
  indexName: string | null;
  deliveryStart: string;
  deliveryEnd: string;
  location: string;
  fees: { type: string; amount: number; currency: string }[];
  version: number;
  status: ConfirmationStatus;
  commodityGroup: string;
  createdAt: string;
}

export interface ConfirmationMatch {
  id: string;
  confirmationId: string;
  confirmationRef: string;
  etrmTradeId: string;
  matchScore: number;
  matchType: ConfMatchType;
  differences: { field: string; confValue: string; etrmValue: string; withinTolerance: boolean }[];
  tolerances: Record<string, string>;
  explain: { rules: string[]; hits: string[] };
  status: 'auto_matched' | 'pending_review' | 'approved' | 'waived' | 'rejected';
  exceptionType: string | null;
}

export interface ConfirmationsFilters {
  search: string;
  status: ConfirmationStatus | 'all';
  commodityGroup: string;
  counterparty: string;
  buySell: string;
}

// ── Demo Data ──────────────────────────────────────────────

const demoConfirmations: Confirmation[] = [
  { id: 'c-1', confirmationId: 'ICE-2025-0001', externalRef: 'TRD-2025-0042', counterparty: 'Shell Trading', product: 'Brent Crude FOB', buySell: 'buy', quantity: 50000, uom: 'bbl', priceType: 'index', priceValue: null, indexName: 'ICE Brent M1', deliveryStart: '2025-07-01', deliveryEnd: '2025-07-31', location: 'Rotterdam ARA', fees: [{ type: 'brokerage', amount: 0.05, currency: 'USD' }], version: 1, status: 'matched', commodityGroup: 'Crude', createdAt: '2025-06-15T10:00:00Z' },
  { id: 'c-2', confirmationId: 'ICE-2025-0002', externalRef: 'TRD-2025-0099', counterparty: 'Glencore International', product: 'Gasoline 95 RON', buySell: 'sell', quantity: 25000, uom: 'mt', priceType: 'fixed', priceValue: 875.50, indexName: null, deliveryStart: '2025-07-15', deliveryEnd: '2025-08-15', location: 'Houston USGC', fees: [], version: 2, status: 'partial', commodityGroup: 'Products', createdAt: '2025-06-16T14:30:00Z' },
  { id: 'c-3', confirmationId: 'ECONF-2025-0003', externalRef: null, counterparty: 'Trafigura', product: 'VLSFO 0.5%', buySell: 'buy', quantity: 10000, uom: 'mt', priceType: 'formula', priceValue: null, indexName: 'Platts Singapore', deliveryStart: '2025-08-01', deliveryEnd: '2025-08-31', location: 'Singapore', fees: [{ type: 'inspection', amount: 1200, currency: 'USD' }], version: 1, status: 'unmatched', commodityGroup: 'Fuel Oil', createdAt: '2025-06-17T09:00:00Z' },
  { id: 'c-4', confirmationId: 'ICE-2025-0004', externalRef: 'TRD-2025-0150', counterparty: 'Vitol', product: 'Gasoil 0.1%', buySell: 'buy', quantity: 30000, uom: 'mt', priceType: 'index', priceValue: null, indexName: 'Platts CIF NWE', deliveryStart: '2025-07-01', deliveryEnd: '2025-07-31', location: 'Amsterdam ARA', fees: [{ type: 'brokerage', amount: 0.03, currency: 'USD' }], version: 1, status: 'matched', commodityGroup: 'Products', createdAt: '2025-06-18T11:00:00Z' },
  { id: 'c-5', confirmationId: 'ECONF-2025-0005', externalRef: 'TRD-2025-0180', counterparty: 'BP Trading', product: 'Naphtha Full Range', buySell: 'sell', quantity: 15000, uom: 'mt', priceType: 'index', priceValue: null, indexName: 'Platts CIF Japan', deliveryStart: '2025-08-15', deliveryEnd: '2025-09-15', location: 'Chiba Japan', fees: [], version: 1, status: 'disputed', commodityGroup: 'Naphtha', createdAt: '2025-06-19T08:00:00Z' },
  { id: 'c-6', confirmationId: 'ICE-2025-0006', externalRef: 'TRD-2025-0201', counterparty: 'Gunvor', product: 'JET A1', buySell: 'sell', quantity: 8000, uom: 'mt', priceType: 'fixed', priceValue: 920.00, indexName: null, deliveryStart: '2025-07-10', deliveryEnd: '2025-07-20', location: 'Fujairah UAE', fees: [{ type: 'storage', amount: 2500, currency: 'USD' }], version: 1, status: 'waived', commodityGroup: 'Products', createdAt: '2025-06-20T13:00:00Z' },
  { id: 'c-7', confirmationId: 'ECONF-2025-0007', externalRef: null, counterparty: 'Mercuria', product: 'Crude Murban', buySell: 'buy', quantity: 100000, uom: 'bbl', priceType: 'index', priceValue: null, indexName: 'ICE Murban', deliveryStart: '2025-09-01', deliveryEnd: '2025-09-30', location: 'Ruwais UAE', fees: [{ type: 'brokerage', amount: 0.02, currency: 'USD' }], version: 1, status: 'pending', commodityGroup: 'Crude', createdAt: '2025-06-21T07:00:00Z' },
  { id: 'c-8', confirmationId: 'ICE-2025-0008', externalRef: 'TRD-2025-0220', counterparty: 'Shell Trading', product: 'HSFO 3.5%', buySell: 'buy', quantity: 20000, uom: 'mt', priceType: 'index', priceValue: null, indexName: 'Platts Rdam Barges', deliveryStart: '2025-07-01', deliveryEnd: '2025-07-15', location: 'Rotterdam ARA', fees: [], version: 3, status: 'partial', commodityGroup: 'Fuel Oil', createdAt: '2025-06-22T10:00:00Z' },
];

const demoMatches: ConfirmationMatch[] = [
  { id: 'cm-1', confirmationId: 'c-1', confirmationRef: 'ICE-2025-0001', etrmTradeId: 'TRD-2025-0042', matchScore: 0.98, matchType: 'exact', differences: [], tolerances: { qty: '±0.1%', price: '±tick', date: '±1d' }, explain: { rules: ['external_ref_match', 'counterparty_match'], hits: ['External ref exact match', 'Counterparty canonical match'] }, status: 'auto_matched', exceptionType: null },
  { id: 'cm-2', confirmationId: 'c-2', confirmationRef: 'ICE-2025-0002', etrmTradeId: 'TRD-2025-0099', matchScore: 0.82, matchType: 'fuzzy', differences: [{ field: 'quantity', confValue: '25,000 mt', etrmValue: '25,050 mt', withinTolerance: true }, { field: 'price', confValue: '$875.50', etrmValue: '$876.00', withinTolerance: false }, { field: 'location', confValue: 'Houston USGC', etrmValue: 'Houston Ship Channel', withinTolerance: true }], tolerances: { qty: '±0.1%', price: '±$0.25', date: '±1d' }, explain: { rules: ['fuzzy_key_match', 'qty_tolerance', 'price_check'], hits: ['Counterparty+product+delivery window match', 'Qty within 0.2% tolerance', 'Price outside tick tolerance'] }, status: 'pending_review', exceptionType: 'price_mismatch' },
  { id: 'cm-3', confirmationId: 'c-4', confirmationRef: 'ICE-2025-0004', etrmTradeId: 'TRD-2025-0150', matchScore: 0.96, matchType: 'exact', differences: [{ field: 'delivery_end', confValue: '2025-07-31', etrmValue: '2025-07-30', withinTolerance: true }], tolerances: { qty: '±0.1%', price: '±tick', date: '±1d' }, explain: { rules: ['external_ref_match', 'date_tolerance'], hits: ['External ref exact match', 'Delivery end within 1-day tolerance'] }, status: 'approved', exceptionType: null },
  { id: 'cm-4', confirmationId: 'c-5', confirmationRef: 'ECONF-2025-0005', etrmTradeId: 'TRD-2025-0180', matchScore: 0.75, matchType: 'fuzzy', differences: [{ field: 'index_name', confValue: 'Platts CIF Japan', etrmValue: 'Platts CIF Japan Naphtha', withinTolerance: false }, { field: 'quantity', confValue: '15,000 mt', etrmValue: '14,800 mt', withinTolerance: false }, { field: 'fees', confValue: 'None', etrmValue: 'Brokerage $0.04/mt', withinTolerance: false }], tolerances: { qty: '±0.1%', price: '±tick', date: '±1d' }, explain: { rules: ['fuzzy_key_match', 'index_check', 'qty_check', 'fee_check'], hits: ['Counterparty+product match', 'Index name partial mismatch', 'Qty outside 0.1% tolerance', 'Fee mismatch: ETRM has brokerage, Conf does not'] }, status: 'pending_review', exceptionType: 'qty_mismatch' },
  { id: 'cm-5', confirmationId: 'c-6', confirmationRef: 'ICE-2025-0006', etrmTradeId: 'TRD-2025-0201', matchScore: 0.91, matchType: 'exact', differences: [{ field: 'fees', confValue: 'Storage $2,500', etrmValue: 'Storage $2,000', withinTolerance: false }], tolerances: { qty: '±0.1%', price: '±$0.50', date: '±1d' }, explain: { rules: ['external_ref_match', 'fee_check'], hits: ['External ref exact match', 'Fee amount mismatch $500'] }, status: 'waived', exceptionType: 'fee_mismatch' },
  { id: 'cm-6', confirmationId: 'c-8', confirmationRef: 'ICE-2025-0008', etrmTradeId: 'TRD-2025-0220', matchScore: 0.85, matchType: 'fuzzy', differences: [{ field: 'quantity', confValue: '20,000 mt', etrmValue: '20,050 mt', withinTolerance: true }, { field: 'version', confValue: 'v3', etrmValue: 'v2', withinTolerance: false }], tolerances: { qty: '±0.1%', price: '±tick', date: '±1d' }, explain: { rules: ['external_ref_match', 'version_check'], hits: ['External ref match', 'Confirmation version 3 > ETRM version 2 — amendment mismatch'] }, status: 'pending_review', exceptionType: 'amendment_mismatch' },
];

// ── Hook ───────────────────────────────────────────────────

export function useConfirmationsRecon() {
  const [confirmations] = useState<Confirmation[]>(demoConfirmations);
  const [matches] = useState<ConfirmationMatch[]>(demoMatches);
  const [filters, setFilters] = useState<ConfirmationsFilters>({
    search: '',
    status: 'all',
    commodityGroup: '',
    counterparty: '',
    buySell: '',
  });
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return confirmations.filter(c => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!c.confirmationId.toLowerCase().includes(q) && !c.counterparty.toLowerCase().includes(q) && !c.product.toLowerCase().includes(q) && !(c.externalRef || '').toLowerCase().includes(q)) return false;
      }
      if (filters.status !== 'all' && c.status !== filters.status) return false;
      if (filters.commodityGroup && c.commodityGroup !== filters.commodityGroup) return false;
      if (filters.counterparty && c.counterparty !== filters.counterparty) return false;
      if (filters.buySell && c.buySell !== filters.buySell) return false;
      return true;
    });
  }, [confirmations, filters]);

  const kpis = useMemo(() => {
    const total = confirmations.length;
    const matched = confirmations.filter(c => c.status === 'matched').length;
    const partial = confirmations.filter(c => c.status === 'partial').length;
    const unmatched = confirmations.filter(c => c.status === 'unmatched').length;
    const pending = confirmations.filter(c => c.status === 'pending').length;
    const disputed = confirmations.filter(c => c.status === 'disputed').length;
    const waived = confirmations.filter(c => c.status === 'waived').length;
    const matchRate = total > 0 ? Math.round(((matched + waived) / total) * 100) : 0;
    const pendingReview = matches.filter(m => m.status === 'pending_review').length;
    const readyToInvoice = confirmations.filter(c => c.status === 'matched' || c.status === 'waived').length;

    const breaksByType: Record<string, number> = {};
    matches.filter(m => m.exceptionType).forEach(m => {
      breaksByType[m.exceptionType!] = (breaksByType[m.exceptionType!] || 0) + 1;
    });

    const commodityGroups = [...new Set(confirmations.map(c => c.commodityGroup))];
    const counterparties = [...new Set(confirmations.map(c => c.counterparty))];

    return { total, matched, partial, unmatched, pending, disputed, waived, matchRate, pendingReview, readyToInvoice, breaksByType, commodityGroups, counterparties };
  }, [confirmations, matches]);

  const selectedMatch = useMemo(() => {
    if (!selectedMatchId) return null;
    const match = matches.find(m => m.id === selectedMatchId);
    if (!match) return null;
    const conf = confirmations.find(c => c.id === match.confirmationId);
    return { match, confirmation: conf || null };
  }, [selectedMatchId, matches, confirmations]);

  const readyToInvoiceList = useMemo(() => {
    return confirmations.filter(c => c.status === 'matched' || c.status === 'waived');
  }, [confirmations]);

  return {
    confirmations: filtered,
    matches,
    filters,
    setFilters,
    kpis,
    selectedMatch,
    selectedMatchId,
    setSelectedMatchId,
    readyToInvoiceList,
  };
}
