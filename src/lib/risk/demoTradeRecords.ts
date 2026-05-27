/**
 * Generador determinista de canonical_records sintéticos para alimentar
 * los hooks de Risk & Trading Intelligence (PnL Attribution, Trade Lifecycle, FX)
 * cuando la base de datos está vacía o el usuario no tiene permisos.
 *
 * Mantiene la misma forma que las filas reales de `canonical_records` que
 * consumen los hooks (campos: id, deal_id, source_system, strategy,
 * counterparty, book_portfolio, currency, amount, fee_type, record_type,
 * economic_date, legal_entity, created_at).
 */

const COUNTERPARTIES = [
  'Shell Trading', 'BP Energy', 'Vitol SA', 'Trafigura', 'Mercuria',
  'Glencore', 'Gunvor', 'Koch Supply', 'Cargill', 'Total Energies',
  'Equinor', 'Repsol Trading',
];

const BOOK_PORTFOLIOS = [
  'CRUDE-Americas', 'CRUDE-EMEA', 'CRUDE-Asia',
  'GAS-NorthAm', 'GAS-Europe',
  'POWER-PJM', 'POWER-ERCOT', 'POWER-Nordic',
  'PRODUCTS-EMEA', 'PRODUCTS-USGC',
  'LNG-Atlantic', 'LNG-Pacific',
  'METALS-LME',
  'FX-Treasury',
];

const STRATEGIES = [
  'CRUDE-Directional', 'CRUDE-CalendarSpread', 'CRUDE-Crack',
  'GAS-Storage', 'GAS-BasisSpread',
  'POWER-PeakOffPeak', 'POWER-HeatRate',
  'PRODUCTS-Crack', 'PRODUCTS-Arbitrage',
  'LNG-Charter', 'LNG-DESvsFOB',
  'METALS-Hedge',
  'FX-Hedge',
];

const LEGAL_ENTITIES = ['HarmonyUS', 'HarmonyEU', 'HarmonyUK', 'HarmonyAsia', 'HarmonySG'];
const CURRENCIES = ['USD', 'USD', 'USD', 'EUR', 'GBP', 'JPY']; // weighted toward USD

const FEE_TYPES = [
  'mtm_unrealized', 'mtm_unrealized', 'mtm_unrealized',
  'physical_delivery', 'physical_delivery',
  'fx_revaluation', 'fx_settlement',
  'broker_fee', 'exchange_fee',
  'settlement_payment', 'invoice',
  'margin_call',
  'accrual',
  'final_settlement', 'termination',
];

const RECORD_TYPES = ['trade', 'event', 'position', 'payment', 'settlement'];

// Deterministic PRNG so the seed is stable across renders
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DemoCanonicalRecord {
  id: string;
  tenant_id: string;
  deal_id: string;
  source_system: string;
  strategy: string | null;
  counterparty: string | null;
  book_portfolio: string | null;
  currency: string;
  amount: number;
  fee_type: string;
  record_type: string;
  economic_date: string;
  date_primary: string;
  legal_entity: string;
  created_at: string;
}

const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

let cache: DemoCanonicalRecord[] | null = null;

export function getDemoCanonicalRecords(): DemoCanonicalRecord[] {
  if (cache) return cache;

  const rand = mulberry32(20260427);
  const records: DemoCanonicalRecord[] = [];
  const dealCount = 60; // ~60 deals
  const today = new Date();
  let recId = 0;

  for (let d = 0; d < dealCount; d++) {
    const cp = COUNTERPARTIES[Math.floor(rand() * COUNTERPARTIES.length)];
    const book = BOOK_PORTFOLIOS[Math.floor(rand() * BOOK_PORTFOLIOS.length)];
    const strategy = STRATEGIES[Math.floor(rand() * STRATEGIES.length)];
    const entity = LEGAL_ENTITIES[Math.floor(rand() * LEGAL_ENTITIES.length)];
    const ccy = CURRENCIES[Math.floor(rand() * CURRENCIES.length)];
    const dealId = `D-2026-${String(1000 + d).padStart(5, '0')}`;
    const sourceSystem = rand() > 0.5 ? 'ETRM' : 'ERP';
    const baseAmount = (rand() * 8_000_000 + 250_000) * (rand() > 0.5 ? 1 : -1);

    // Each deal gets 4-12 events spanning ~120 days
    const eventCount = 4 + Math.floor(rand() * 9);
    const startDaysBack = 100 + Math.floor(rand() * 60);

    for (let e = 0; e < eventCount; e++) {
      const dayOffset = startDaysBack - Math.floor((e / eventCount) * (startDaysBack + 30));
      const eventDate = new Date(today);
      eventDate.setDate(eventDate.getDate() - dayOffset);
      const isoDate = eventDate.toISOString().split('T')[0];

      // Stage progression: early = trade/mtm, mid = physical/fx, late = settlement/closed
      const progressPct = e / eventCount;
      let feeType: string;
      let recordType: string;
      if (progressPct < 0.2) {
        feeType = rand() > 0.5 ? 'mtm_unrealized' : 'broker_fee';
        recordType = 'trade';
      } else if (progressPct < 0.55) {
        feeType = ['mtm_unrealized', 'accrual', 'physical_delivery', 'fx_revaluation'][Math.floor(rand() * 4)];
        recordType = 'position';
      } else if (progressPct < 0.85) {
        feeType = ['physical_delivery', 'invoice', 'settlement_payment', 'margin_call'][Math.floor(rand() * 4)];
        recordType = 'event';
      } else {
        feeType = rand() > 0.7 ? 'termination' : 'final_settlement';
        recordType = 'settlement';
      }

      // Amount drifts: PnL effect grows over time
      const drift = (rand() - 0.4) * 0.15;
      const amount = baseAmount * (1 + progressPct * drift) * (0.85 + rand() * 0.3);

      records.push({
        id: `demo-rec-${++recId}`,
        tenant_id: DEMO_TENANT_ID,
        deal_id: dealId,
        source_system: sourceSystem,
        strategy,
        counterparty: cp,
        book_portfolio: book,
        currency: ccy,
        amount: Math.round(amount),
        fee_type: feeType,
        record_type: recordType,
        economic_date: isoDate,
        date_primary: isoDate,
        legal_entity: entity,
        created_at: eventDate.toISOString(),
      });
    }
  }

  cache = records;
  return records;
}
