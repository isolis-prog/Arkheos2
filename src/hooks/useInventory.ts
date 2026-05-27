import { useState, useMemo } from 'react';

export interface InventoryLot {
  id: string;
  siteId: string;
  lotRef: string;
  commodity: string;
  qty: number;
  uom: string;
  unitCost: number;
  totalCost: number;
  costCurrency: string;
  valuationMethod: 'FIFO' | 'weighted_average' | 'specific_id';
  qualityGrade?: string;
  status: 'active' | 'depleted' | 'frozen' | 'write_down_pending';
  landedCostAlloc: Record<string, number>;
  firstReceiptDate?: string;
  lastMovementDate?: string;
  legalEntity?: string;
  sourceSystem: string;
}

export interface InventoryMovement {
  id: string;
  lotId?: string;
  movementType: 'receipt' | 'issue' | 'transfer_in' | 'transfer_out' | 'loss' | 'adjustment' | 'write_down' | 'reclassification';
  movementDate: string;
  qty: number;
  uom: string;
  unitCost?: number;
  costDelta: number;
  costCurrency: string;
  refDoc?: string;
  linkTradeId?: string;
  linkInvoiceId?: string;
  counterparty?: string;
  siteId: string;
  fromSite?: string;
  toSite?: string;
  approvedBy?: string;
  notes?: string;
  sourceSystem: string;
}

export interface ValuationSnapshot {
  id: string;
  period: string;
  siteId: string;
  commodity: string;
  openingQty: number;
  receiptsQty: number;
  issuesQty: number;
  transfersNet: number;
  lossesQty: number;
  adjustmentsQty: number;
  closingQty: number;
  openingValue: number;
  closingValue: number;
  cogsValue: number;
  landedCostTotal: number;
  valuationMethod: 'FIFO' | 'weighted_average' | 'specific_id';
  glBalance?: number;
  glVariance: number;
  glAccount?: string;
  isReconciled: boolean;
  legalEntity?: string;
  uom: string;
  costCurrency: string;
}

// Demo data
const demoLots: InventoryLot[] = [
  { id: 'lot-001', siteId: 'Houston Terminal', lotRef: 'LOT-HOU-2026-001', commodity: 'Crude WTI', qty: 320000, uom: 'bbl', unitCost: 72.50, totalCost: 23200000, costCurrency: 'USD', valuationMethod: 'weighted_average', qualityGrade: 'API 39.6', status: 'active', landedCostAlloc: { freight: 145000, insurance: 32000 }, firstReceiptDate: '2026-01-05', lastMovementDate: '2026-02-12', legalEntity: 'Acme Trading LLC', sourceSystem: 'ERP' },
  { id: 'lot-002', siteId: 'Houston Terminal', lotRef: 'LOT-HOU-2026-002', commodity: 'Diesel', qty: 85000, uom: 'bbl', unitCost: 92.30, totalCost: 7845500, costCurrency: 'USD', valuationMethod: 'FIFO', qualityGrade: 'ULSD', status: 'active', landedCostAlloc: { freight: 42000 }, firstReceiptDate: '2026-01-15', lastMovementDate: '2026-02-10', legalEntity: 'Acme Trading LLC', sourceSystem: 'ERP' },
  { id: 'lot-003', siteId: 'Rotterdam Tank Farm', lotRef: 'LOT-RTD-2026-003', commodity: 'Crude WTI', qty: 180000, uom: 'bbl', unitCost: 73.10, totalCost: 13158000, costCurrency: 'USD', valuationMethod: 'weighted_average', status: 'active', landedCostAlloc: { freight: 280000, insurance: 55000, port_charges: 18000 }, firstReceiptDate: '2026-01-20', lastMovementDate: '2026-02-08', legalEntity: 'Acme Europe BV', sourceSystem: 'ERP' },
  { id: 'lot-004', siteId: 'Chicago Terminal', lotRef: 'LOT-CHI-2026-004', commodity: 'Ethanol', qty: 1200000, uom: 'gal', unitCost: 2.15, totalCost: 2580000, costCurrency: 'USD', valuationMethod: 'FIFO', status: 'active', landedCostAlloc: { freight: 65000 }, firstReceiptDate: '2026-02-01', lastMovementDate: '2026-02-14', legalEntity: 'Acme Trading LLC', sourceSystem: 'ERP' },
  { id: 'lot-005', siteId: 'Singapore Hub', lotRef: 'LOT-SG-2026-005', commodity: 'Jet Fuel', qty: 45000, uom: 'mt', unitCost: 680.00, totalCost: 30600000, costCurrency: 'USD', valuationMethod: 'weighted_average', qualityGrade: 'Jet A-1', status: 'active', landedCostAlloc: { freight: 190000, insurance: 38000 }, firstReceiptDate: '2026-01-10', lastMovementDate: '2026-02-06', legalEntity: 'Acme Asia Pte Ltd', sourceSystem: 'ERP' },
  { id: 'lot-006', siteId: 'Houston Terminal', lotRef: 'LOT-HOU-2025-088', commodity: 'Crude WTI', qty: 0, uom: 'bbl', unitCost: 68.40, totalCost: 0, costCurrency: 'USD', valuationMethod: 'weighted_average', status: 'depleted', landedCostAlloc: {}, firstReceiptDate: '2025-10-15', lastMovementDate: '2025-12-20', legalEntity: 'Acme Trading LLC', sourceSystem: 'ERP' },
  { id: 'lot-007', siteId: 'Rotterdam Tank Farm', lotRef: 'LOT-RTD-2026-007', commodity: 'Gasoil', qty: 55000, uom: 'mt', unitCost: 720.00, totalCost: 39600000, costCurrency: 'USD', valuationMethod: 'FIFO', status: 'frozen', landedCostAlloc: { freight: 110000 }, firstReceiptDate: '2026-01-25', lastMovementDate: '2026-02-01', legalEntity: 'Acme Europe BV', sourceSystem: 'ERP' },
];

const demoMovements: InventoryMovement[] = [
  { id: 'imv-001', lotId: 'lot-001', movementType: 'receipt', movementDate: '2026-02-12', qty: 50000, uom: 'bbl', unitCost: 73.20, costDelta: 3660000, costCurrency: 'USD', refDoc: 'GRN-2026-0412', linkTradeId: 'DL-8834', counterparty: 'Shell Trading', siteId: 'Houston Terminal', sourceSystem: 'ERP' },
  { id: 'imv-002', lotId: 'lot-002', movementType: 'issue', movementDate: '2026-02-10', qty: -15000, uom: 'bbl', unitCost: 92.30, costDelta: -1384500, costCurrency: 'USD', refDoc: 'DO-2026-0188', linkTradeId: 'DL-9102', linkInvoiceId: 'INV-2026-0344', counterparty: 'Vitol', siteId: 'Houston Terminal', sourceSystem: 'ERP' },
  { id: 'imv-003', lotId: 'lot-003', movementType: 'receipt', movementDate: '2026-02-08', qty: 80000, uom: 'bbl', unitCost: 73.50, costDelta: 5880000, costCurrency: 'USD', refDoc: 'GRN-RTD-0055', linkTradeId: 'DL-8901', counterparty: 'BP Energy', siteId: 'Rotterdam Tank Farm', sourceSystem: 'ERP' },
  { id: 'imv-004', lotId: 'lot-001', movementType: 'transfer_out', movementDate: '2026-02-05', qty: -30000, uom: 'bbl', unitCost: 72.50, costDelta: -2175000, costCurrency: 'USD', refDoc: 'TRF-2026-0012', siteId: 'Houston Terminal', toSite: 'Cushing Hub', sourceSystem: 'ERP' },
  { id: 'imv-005', lotId: 'lot-001', movementType: 'loss', movementDate: '2026-02-03', qty: -450, uom: 'bbl', costDelta: -32625, costCurrency: 'USD', refDoc: 'LOSS-2026-003', siteId: 'Houston Terminal', notes: 'Operational shrinkage – evaporation', approvedBy: 'mgr-001', sourceSystem: 'ERP' },
  { id: 'imv-006', lotId: 'lot-004', movementType: 'receipt', movementDate: '2026-02-14', qty: 300000, uom: 'gal', unitCost: 2.18, costDelta: 654000, costCurrency: 'USD', refDoc: 'GRN-CHI-0033', linkTradeId: 'DL-7720', counterparty: 'ADM', siteId: 'Chicago Terminal', sourceSystem: 'ERP' },
  { id: 'imv-007', lotId: 'lot-005', movementType: 'issue', movementDate: '2026-02-06', qty: -5000, uom: 'mt', unitCost: 680, costDelta: -3400000, costCurrency: 'USD', refDoc: 'DO-SG-0019', linkTradeId: 'DL-6650', counterparty: 'Singapore Airlines', siteId: 'Singapore Hub', sourceSystem: 'ERP' },
  { id: 'imv-008', lotId: 'lot-007', movementType: 'adjustment', movementDate: '2026-02-01', qty: -200, uom: 'mt', costDelta: -144000, costCurrency: 'USD', refDoc: 'ADJ-RTD-0008', siteId: 'Rotterdam Tank Farm', notes: 'Quality reclassification – downgraded', sourceSystem: 'ERP' },
];

const demoSnapshots: ValuationSnapshot[] = [
  { id: 'vs-001', period: '2026-01', siteId: 'Houston Terminal', commodity: 'Crude WTI', openingQty: 300000, receiptsQty: 120000, issuesQty: 80000, transfersNet: -30000, lossesQty: 450, adjustmentsQty: 0, closingQty: 309550, openingValue: 21750000, closingValue: 22442375, cogsValue: 5800000, landedCostTotal: 177000, valuationMethod: 'weighted_average', glBalance: 22500000, glVariance: 57625, glAccount: '1310-100', isReconciled: false, legalEntity: 'Acme Trading LLC', uom: 'bbl', costCurrency: 'USD' },
  { id: 'vs-002', period: '2026-01', siteId: 'Houston Terminal', commodity: 'Diesel', openingQty: 100000, receiptsQty: 0, issuesQty: 15000, transfersNet: 0, lossesQty: 0, adjustmentsQty: 0, closingQty: 85000, openingValue: 9230000, closingValue: 7845500, cogsValue: 1384500, landedCostTotal: 42000, valuationMethod: 'FIFO', glBalance: 7845500, glVariance: 0, glAccount: '1310-200', isReconciled: true, legalEntity: 'Acme Trading LLC', uom: 'bbl', costCurrency: 'USD' },
  { id: 'vs-003', period: '2026-01', siteId: 'Rotterdam Tank Farm', commodity: 'Crude WTI', openingQty: 100000, receiptsQty: 80000, issuesQty: 0, transfersNet: 0, lossesQty: 0, adjustmentsQty: 0, closingQty: 180000, openingValue: 7310000, closingValue: 13158000, cogsValue: 0, landedCostTotal: 353000, valuationMethod: 'weighted_average', glBalance: 13200000, glVariance: 42000, glAccount: '1310-100', isReconciled: false, legalEntity: 'Acme Europe BV', uom: 'bbl', costCurrency: 'USD' },
  { id: 'vs-004', period: '2026-01', siteId: 'Singapore Hub', commodity: 'Jet Fuel', openingQty: 50000, receiptsQty: 0, issuesQty: 5000, transfersNet: 0, lossesQty: 0, adjustmentsQty: 0, closingQty: 45000, openingValue: 34000000, closingValue: 30600000, cogsValue: 3400000, landedCostTotal: 228000, valuationMethod: 'weighted_average', glBalance: 30600000, glVariance: 0, glAccount: '1310-300', isReconciled: true, legalEntity: 'Acme Asia Pte Ltd', uom: 'mt', costCurrency: 'USD' },
  { id: 'vs-005', period: '2026-01', siteId: 'Chicago Terminal', commodity: 'Ethanol', openingQty: 900000, receiptsQty: 300000, issuesQty: 0, transfersNet: 0, lossesQty: 0, adjustmentsQty: 0, closingQty: 1200000, openingValue: 1935000, closingValue: 2580000, cogsValue: 0, landedCostTotal: 65000, valuationMethod: 'FIFO', glBalance: 2590000, glVariance: 10000, glAccount: '1310-400', isReconciled: false, legalEntity: 'Acme Trading LLC', uom: 'gal', costCurrency: 'USD' },
  { id: 'vs-006', period: '2026-01', siteId: 'Rotterdam Tank Farm', commodity: 'Gasoil', openingQty: 55200, receiptsQty: 0, issuesQty: 0, transfersNet: 0, lossesQty: 0, adjustmentsQty: -200, closingQty: 55000, openingValue: 39744000, closingValue: 39600000, cogsValue: 0, landedCostTotal: 110000, valuationMethod: 'FIFO', glBalance: 39750000, glVariance: 150000, glAccount: '1310-500', isReconciled: false, legalEntity: 'Acme Europe BV', uom: 'mt', costCurrency: 'USD' },
];

export const useInventory = () => {
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [commodityFilter, setCommodityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('2026-01');
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  const sites = useMemo(() => [...new Set(demoLots.map(l => l.siteId))], []);
  const commodities = useMemo(() => [...new Set(demoLots.map(l => l.commodity))], []);

  const filteredLots = useMemo(() => {
    let result = demoLots;
    if (siteFilter !== 'all') result = result.filter(l => l.siteId === siteFilter);
    if (commodityFilter !== 'all') result = result.filter(l => l.commodity === commodityFilter);
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter);
    return result;
  }, [siteFilter, commodityFilter, statusFilter]);

  const lotMovements = useMemo(() => {
    if (!selectedLotId) return demoMovements;
    return demoMovements.filter(m => m.lotId === selectedLotId);
  }, [selectedLotId]);

  const filteredSnapshots = useMemo(() => {
    let result = demoSnapshots.filter(s => s.period === periodFilter);
    if (siteFilter !== 'all') result = result.filter(s => s.siteId === siteFilter);
    if (commodityFilter !== 'all') result = result.filter(s => s.commodity === commodityFilter);
    return result;
  }, [periodFilter, siteFilter, commodityFilter]);

  // Site heatmap data
  const siteHeatmap = useMemo(() => {
    const map = new Map<string, { totalValue: number; lotCount: number; commodities: Set<string>; agingLots: number }>();
    demoLots.filter(l => l.status !== 'depleted').forEach(l => {
      const existing = map.get(l.siteId) || { totalValue: 0, lotCount: 0, commodities: new Set<string>(), agingLots: 0 };
      existing.totalValue += l.totalCost;
      existing.lotCount += 1;
      existing.commodities.add(l.commodity);
      if (l.firstReceiptDate) {
        const days = Math.floor((Date.now() - new Date(l.firstReceiptDate).getTime()) / 86400000);
        if (days > 60) existing.agingLots += 1;
      }
      map.set(l.siteId, existing);
    });
    return Array.from(map.entries()).map(([site, data]) => ({
      site,
      totalValue: data.totalValue,
      lotCount: data.lotCount,
      commodities: Array.from(data.commodities),
      agingLots: data.agingLots,
    }));
  }, []);

  // KPIs
  const kpis = useMemo(() => {
    const activeLots = demoLots.filter(l => l.status !== 'depleted');
    const totalValue = activeLots.reduce((s, l) => s + l.totalCost, 0);
    const totalGlVariance = filteredSnapshots.reduce((s, snap) => s + Math.abs(snap.glVariance), 0);
    const unreconciledCount = filteredSnapshots.filter(s => !s.isReconciled).length;
    const movementsWithoutDoc = demoMovements.filter(m => !m.refDoc).length;
    const movementsTotal = demoMovements.length;
    const agingLots = activeLots.filter(l => {
      if (!l.firstReceiptDate) return false;
      return Math.floor((Date.now() - new Date(l.firstReceiptDate).getTime()) / 86400000) > 60;
    }).length;
    return {
      totalValue,
      totalGlVariance,
      unreconciledCount,
      pctWithoutDoc: movementsTotal > 0 ? (movementsWithoutDoc / movementsTotal * 100) : 0,
      agingLots,
      activeLotCount: activeLots.length,
    };
  }, [filteredSnapshots]);

  return {
    lots: filteredLots,
    movements: lotMovements,
    snapshots: filteredSnapshots,
    siteHeatmap,
    kpis,
    sites,
    commodities,
    siteFilter, setSiteFilter,
    commodityFilter, setCommodityFilter,
    statusFilter, setStatusFilter,
    periodFilter, setPeriodFilter,
    selectedLotId, setSelectedLotId,
    allMovements: demoMovements,
  };
};
