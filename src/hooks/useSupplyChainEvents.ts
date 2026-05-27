import { useMemo } from 'react';

export interface SupplyChainEvent {
  type: 'CASHFLOW_UPDATED_BY_NOMINATION' | 'INVENTORY_MOVEMENT_CREATED' | 'SCHEDULING_VOLUME_DISCREPANCY' | 'MEASUREMENT_CASHFLOW_VARIANCE';
  tradeId: string;
  timestamp: Date;
  beforeValue?: number;
  afterValue?: number;
  details: Record<string, unknown>;
}

export interface NominationCashflowLink {
  nominationId: string;
  dealId: string;
  counterparty: string;
  commodity: string;
  nominatedQty: number;
  executedQty: number | null;
  tradePrice: number;
  oldCashflowAmount: number;
  newCashflowAmount: number;
  cashflowStatus: string;
  updated: boolean;
  auditEvent: SupplyChainEvent | null;
}

export interface NominationInventoryLink {
  nominationId: string;
  dealId: string;
  commodity: string;
  location: string;
  executedQty: number;
  movementType: 'IN' | 'OUT';
  movementCreated: boolean;
  inventoryMovementId: string | null;
}

export interface VolumeDiscrepancy {
  nominationId: string;
  dealId: string;
  commodity: string;
  nominatedQty: number;
  executedQty: number;
  difference: number;
  differencePct: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  exceptionCreated: boolean;
}

export interface MeasurementCashflowVariance {
  measurementId: string;
  dealId: string;
  commodity: string;
  measuredQty: number;
  cashflowBasisQty: number;
  delta: number;
  deltaPct: number;
  cashflowFlagged: boolean;
  exceptionCreated: boolean;
}

export interface SupplyChainTradeStatus {
  tradeId: string;
  commodity: string;
  counterparty: string;
  nominationStatus: 'PENDING' | 'CONFIRMED' | 'EXECUTED' | 'CANCELLED';
  schedulingStatus: 'NOT_STARTED' | 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED';
  deliveryStatus: 'AWAITING' | 'PARTIAL' | 'COMPLETE' | 'FAILED';
  measurementStatus: 'PENDING' | 'PROVISIONAL' | 'FINAL' | 'N/A';
  invoiceStatus: 'NOT_ISSUED' | 'DRAFT' | 'ISSUED' | 'PAID';
  cashflowStatus: 'FORECAST' | 'CONFIRMED' | 'POSTED' | 'PAID';
  overallHealth: 'green' | 'amber' | 'red';
  blockedStep: string | null;
}

function seed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 1000;
}

const COMMODITIES = ['Brent Crude', 'WTI', 'TTF Gas', 'LME Copper', 'CBOT Wheat', 'ICE Sugar', 'Palm Oil', 'Jet Fuel'];
const COUNTERPARTIES = ['Vitol SA', 'Trafigura', 'Glencore', 'Cargill', 'BP Trading', 'Koch Supply', 'Mercuria', 'Gunvor'];
const STATUSES_NOM: SupplyChainTradeStatus['nominationStatus'][] = ['PENDING', 'CONFIRMED', 'EXECUTED', 'CANCELLED'];
const STATUSES_SCHED: SupplyChainTradeStatus['schedulingStatus'][] = ['NOT_STARTED', 'SCHEDULED', 'IN_TRANSIT', 'DELIVERED'];
const STATUSES_DEL: SupplyChainTradeStatus['deliveryStatus'][] = ['AWAITING', 'PARTIAL', 'COMPLETE', 'FAILED'];
const STATUSES_MEAS: SupplyChainTradeStatus['measurementStatus'][] = ['PENDING', 'PROVISIONAL', 'FINAL', 'N/A'];
const STATUSES_INV: SupplyChainTradeStatus['invoiceStatus'][] = ['NOT_ISSUED', 'DRAFT', 'ISSUED', 'PAID'];
const STATUSES_CF: SupplyChainTradeStatus['cashflowStatus'][] = ['FORECAST', 'CONFIRMED', 'POSTED', 'PAID'];

export function useSupplyChainEvents() {
  const tradeStatuses: SupplyChainTradeStatus[] = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => {
      const s = seed(`trade-${i}`);
      const nomIdx = Math.min(3, Math.floor(s * 4.5));
      const schedIdx = Math.min(3, Math.floor(seed(`sched-${i}`) * 4.5));
      const delIdx = Math.min(3, Math.floor(seed(`del-${i}`) * 4.5));
      const measIdx = Math.min(3, Math.floor(seed(`meas-${i}`) * 4.5));
      const invIdx = Math.min(3, Math.floor(seed(`inv-${i}`) * 4.5));
      const cfIdx = Math.min(3, Math.floor(seed(`cf-${i}`) * 4.5));

      const nom = STATUSES_NOM[nomIdx];
      const sched = STATUSES_SCHED[schedIdx];
      const del = STATUSES_DEL[delIdx];
      const meas = STATUSES_MEAS[measIdx];
      const inv = STATUSES_INV[invIdx];
      const cf = STATUSES_CF[cfIdx];

      const allComplete = nom === 'EXECUTED' && sched === 'DELIVERED' && del === 'COMPLETE' && (meas === 'FINAL' || meas === 'N/A') && inv === 'PAID' && cf === 'PAID';
      const hasBlocked = nom === 'CANCELLED' || del === 'FAILED';
      const overallHealth: 'green' | 'amber' | 'red' = allComplete ? 'green' : hasBlocked ? 'red' : 'amber';

      let blockedStep: string | null = null;
      if (nom === 'CANCELLED') blockedStep = 'Nomination cancelled';
      else if (del === 'FAILED') blockedStep = 'Delivery failed';
      else if (meas === 'PENDING' && del === 'COMPLETE') blockedStep = 'Awaiting measurement';

      return {
        tradeId: `TRD-${2024000 + i}`,
        commodity: COMMODITIES[i % COMMODITIES.length],
        counterparty: COUNTERPARTIES[i % COUNTERPARTIES.length],
        nominationStatus: nom,
        schedulingStatus: sched,
        deliveryStatus: del,
        measurementStatus: meas,
        invoiceStatus: inv,
        cashflowStatus: cf,
        overallHealth,
        blockedStep,
      };
    });
  }, []);

  const cashflowLinks: NominationCashflowLink[] = useMemo(() => {
    return tradeStatuses.filter(t => t.nominationStatus === 'EXECUTED' || t.nominationStatus === 'CONFIRMED').slice(0, 6).map((t, i) => {
      const s = seed(`cf-link-${i}`);
      const nominatedQty = 5000 + s * 15000;
      const price = 50 + s * 150;
      const oldAmt = nominatedQty * price;
      const qtyChange = nominatedQty * (0.95 + s * 0.1);
      const newAmt = qtyChange * price;
      const canUpdate = t.cashflowStatus === 'FORECAST' || t.cashflowStatus === 'CONFIRMED';
      return {
        nominationId: `NOM-${i + 100}`,
        dealId: t.tradeId,
        counterparty: t.counterparty,
        commodity: t.commodity,
        nominatedQty,
        executedQty: t.nominationStatus === 'EXECUTED' ? qtyChange : null,
        tradePrice: price,
        oldCashflowAmount: oldAmt,
        newCashflowAmount: canUpdate ? newAmt : oldAmt,
        cashflowStatus: t.cashflowStatus,
        updated: canUpdate && Math.abs(newAmt - oldAmt) > 100,
        auditEvent: canUpdate ? {
          type: 'CASHFLOW_UPDATED_BY_NOMINATION' as const,
          tradeId: t.tradeId,
          timestamp: new Date(),
          beforeValue: oldAmt,
          afterValue: newAmt,
          details: { nominationId: `NOM-${i + 100}`, qtyChange },
        } : null,
      };
    });
  }, [tradeStatuses]);

  const inventoryLinks: NominationInventoryLink[] = useMemo(() => {
    return tradeStatuses.filter(t => t.nominationStatus === 'EXECUTED').slice(0, 5).map((t, i) => {
      const s = seed(`inv-link-${i}`);
      return {
        nominationId: `NOM-${i + 200}`,
        dealId: t.tradeId,
        commodity: t.commodity,
        location: ['Rotterdam', 'Houston', 'Singapore', 'Fujairah', 'Cushing'][i % 5],
        executedQty: 5000 + s * 15000,
        movementType: (s > 0.5 ? 'IN' : 'OUT') as 'IN' | 'OUT',
        movementCreated: true,
        inventoryMovementId: `MOV-${i + 300}`,
      };
    });
  }, [tradeStatuses]);

  const volumeDiscrepancies: VolumeDiscrepancy[] = useMemo(() => {
    return tradeStatuses.filter(t => t.nominationStatus === 'EXECUTED').slice(0, 4).map((t, i) => {
      const s = seed(`disc-${i}`);
      const nominated = 10000 + s * 20000;
      const pctDiff = (s - 0.4) * 0.12;
      const executed = nominated * (1 + pctDiff);
      const diff = executed - nominated;
      const absPct = Math.abs(pctDiff) * 100;
      return {
        nominationId: `NOM-${i + 400}`,
        dealId: t.tradeId,
        commodity: t.commodity,
        nominatedQty: nominated,
        executedQty: executed,
        difference: diff,
        differencePct: absPct,
        severity: absPct > 5 ? 'HIGH' : absPct > 1 ? 'MEDIUM' : 'LOW',
        exceptionCreated: absPct > 0.5,
      };
    });
  }, [tradeStatuses]);

  const measurementVariances: MeasurementCashflowVariance[] = useMemo(() => {
    return tradeStatuses.filter(t => t.measurementStatus === 'FINAL').slice(0, 4).map((t, i) => {
      const s = seed(`meas-var-${i}`);
      const basisQty = 8000 + s * 12000;
      const measuredQty = basisQty * (0.97 + s * 0.06);
      const delta = measuredQty - basisQty;
      const deltaPct = (delta / basisQty) * 100;
      return {
        measurementId: `MEAS-${i + 500}`,
        dealId: t.tradeId,
        commodity: t.commodity,
        measuredQty,
        cashflowBasisQty: basisQty,
        delta,
        deltaPct,
        cashflowFlagged: Math.abs(deltaPct) > 0.5,
        exceptionCreated: Math.abs(deltaPct) > 1,
      };
    });
  }, [tradeStatuses]);

  const eventLog: SupplyChainEvent[] = useMemo(() => {
    const events: SupplyChainEvent[] = [];
    cashflowLinks.filter(l => l.auditEvent).forEach(l => events.push(l.auditEvent!));
    inventoryLinks.forEach(l => events.push({
      type: 'INVENTORY_MOVEMENT_CREATED',
      tradeId: l.dealId,
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      details: { movementId: l.inventoryMovementId, qty: l.executedQty, movementType: l.movementType },
    }));
    volumeDiscrepancies.filter(d => d.exceptionCreated).forEach(d => events.push({
      type: 'SCHEDULING_VOLUME_DISCREPANCY',
      tradeId: d.dealId,
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      beforeValue: d.nominatedQty,
      afterValue: d.executedQty,
      details: { severity: d.severity, differencePct: d.differencePct },
    }));
    measurementVariances.filter(v => v.exceptionCreated).forEach(v => events.push({
      type: 'MEASUREMENT_CASHFLOW_VARIANCE',
      tradeId: v.dealId,
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      beforeValue: v.cashflowBasisQty,
      afterValue: v.measuredQty,
      details: { deltaPct: v.deltaPct },
    }));
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [cashflowLinks, inventoryLinks, volumeDiscrepancies, measurementVariances]);

  // Summary KPIs
  const kpis = useMemo(() => ({
    totalTrades: tradeStatuses.length,
    greenTrades: tradeStatuses.filter(t => t.overallHealth === 'green').length,
    amberTrades: tradeStatuses.filter(t => t.overallHealth === 'amber').length,
    redTrades: tradeStatuses.filter(t => t.overallHealth === 'red').length,
    cashflowsUpdated: cashflowLinks.filter(l => l.updated).length,
    inventoryMovements: inventoryLinks.filter(l => l.movementCreated).length,
    discrepancies: volumeDiscrepancies.filter(d => d.exceptionCreated).length,
    measurementFlags: measurementVariances.filter(v => v.cashflowFlagged).length,
    totalEvents: eventLog.length,
  }), [tradeStatuses, cashflowLinks, inventoryLinks, volumeDiscrepancies, measurementVariances, eventLog]);

  return {
    tradeStatuses,
    cashflowLinks,
    inventoryLinks,
    volumeDiscrepancies,
    measurementVariances,
    eventLog,
    kpis,
  };
}
