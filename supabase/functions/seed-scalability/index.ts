import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

// ─── Deterministic PRNG (Mulberry32) ─────────────────────────────────
class SeededRNG {
  private state: number;
  constructor(seed: number) {
    this.state = seed;
  }
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
  float(min: number, max: number, decimals = 2): number {
    const v = this.next() * (max - min) + min;
    const f = Math.pow(10, decimals);
    return Math.round(v * f) / f;
  }
  uuid(): string {
    const hex = () => this.int(0, 15).toString(16);
    const s = (n: number) => Array.from({ length: n }, hex).join('');
    return `${s(8)}-${s(4)}-4${s(3)}-${(this.int(8, 11)).toString(16)}${s(3)}-${s(12)}`;
  }
  date(start: Date, end: Date): string {
    const d = new Date(start.getTime() + this.next() * (end.getTime() - start.getTime()));
    return d.toISOString().split('T')[0];
  }
  dateISO(start: Date, end: Date): string {
    const d = new Date(start.getTime() + this.next() * (end.getTime() - start.getTime()));
    return d.toISOString();
  }
}

// ─── Size configurations ─────────────────────────────────────────────
const SIZES: Record<string, {
  templates: number; runs: number; sideARecords: number; sideBRecords: number;
  counterparties: number; legalEntities: number; portfolios: number;
  instrumentTypes: number; transactionTypes: number; sourceSystems: number; financialSystems: number;
  batchSize: number;
}> = {
  S: {
    templates: 25, runs: 200, sideARecords: 5000, sideBRecords: 5000,
    counterparties: 200, legalEntities: 10, portfolios: 25, instrumentTypes: 20,
    transactionTypes: 15, sourceSystems: 10, financialSystems: 6, batchSize: 500,
  },
  M: {
    templates: 75, runs: 750, sideARecords: 10000, sideBRecords: 10000,
    counterparties: 500, legalEntities: 25, portfolios: 50, instrumentTypes: 30,
    transactionTypes: 20, sourceSystems: 15, financialSystems: 8, batchSize: 500,
  },
  L: {
    templates: 150, runs: 2000, sideARecords: 25000, sideBRecords: 25000,
    counterparties: 1000, legalEntities: 50, portfolios: 100, instrumentTypes: 40,
    transactionTypes: 20, sourceSystems: 20, financialSystems: 10, batchSize: 500,
  },
  XL: {
    templates: 300, runs: 5000, sideARecords: 50000, sideBRecords: 50000,
    counterparties: 2000, legalEntities: 100, portfolios: 250, instrumentTypes: 50,
    transactionTypes: 20, sourceSystems: 25, financialSystems: 12, batchSize: 500,
  },
};

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const SYN_PREFIX = 'SYN_';

// ─── Reference data generators ───────────────────────────────────────
const BASE_SOURCE_SYSTEMS = ['Allegro', 'Endur', 'RightAngle', 'Aspect', 'SAP CM', 'Enuit'];
const BASE_FINANCIAL_SYSTEMS = ['Dynamics 365', 'NetSuite', 'SAP S/4HANA', 'Odoo'];
const BASE_INSTRUMENT_TYPES = [
  'Fees', 'Physical', 'Option', 'Swap', 'FX', 'Future', 'Power', 'Basis Swap',
  'Bond', 'Brokerage', 'Transport Charge', 'Derivative', 'Cash Transfer', 'Storage'
];
const BASE_TRANSACTION_TYPES = [
  'Invoice', 'Bill', 'Credit', 'Payment', 'PrePayment', 'Deposit',
  'Adjustment', 'Accrual', 'Tax', 'Journal'
];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'SGD', 'NOK', 'BRL'];
const STATUSES = ['completed', 'completed', 'completed', 'completed', 'failed', 'completed'];
const COMMODITIES = ['Crude Oil', 'Natural Gas', 'Power', 'LNG', 'Refined Products', 'Carbon Credits', 'Coal', 'Ethanol'];

function generateNames(rng: SeededRNG, prefix: string, count: number, baseList: string[]): string[] {
  const result = [...baseList];
  for (let i = result.length; i < count; i++) {
    result.push(`${SYN_PREFIX}${prefix}_${String(i).padStart(4, '0')}`);
  }
  return result;
}

function generateCounterpartyNames(rng: SeededRNG, count: number): string[] {
  const base = ['Goldman Sachs', 'Morgan Stanley', 'JP Morgan', 'BP Trading', 'Shell Trading',
    'ICE Clear', 'CME Group', 'Vitol', 'Trafigura', 'Glencore', 'Gunvor', 'Mercuria'];
  const suffixes = ['Capital', 'Energy', 'Trading', 'Commodities', 'Partners', 'Group', 'Holdings', 'Markets', 'Resources', 'Corp'];
  const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Omega', 'Sigma', 'Theta', 'Kappa', 'Lambda',
    'Nova', 'Apex', 'Zenith', 'Pinnacle', 'Summit', 'Vertex', 'Prime', 'Core', 'Nexus', 'Atlas'];
  const result = [...base];
  for (let i = result.length; i < count; i++) {
    result.push(`${SYN_PREFIX}${rng.pick(prefixes)}${i} ${rng.pick(suffixes)}`);
  }
  return result;
}

// ─── Batch insert helper ─────────────────────────────────────────────
async function batchInsert(supabase: any, table: string, records: any[], batchSize: number, log: string[] = []): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      log.push(`ERROR inserting into ${table} batch ${i / batchSize}: ${error.message}`);
      // Continue with next batch rather than failing entirely
      continue;
    }
    inserted += batch.length;
  }
  return inserted;
}

// ─── Template configs for realism ────────────────────────────────────
const TEMPLATE_ARCHETYPES = [
  { name: 'Invoice ↔ AP/AR', sideA: 'ETRM Invoices', sideB: 'ERP AP/AR Lines', matchRateBase: 0.92, type: 'fee_recon' },
  { name: 'Cash ↔ Bank Statement', sideA: 'Payment Records', sideB: 'Bank Statement Lines', matchRateBase: 0.85, type: 'cash_recon' },
  { name: 'Subledger ↔ GL', sideA: 'ETRM Subledger', sideB: 'ERP GL Lines', matchRateBase: 0.97, type: 'gl_recon' },
  { name: 'Physical Movement ↔ Invoice', sideA: 'Movement Records', sideB: 'Invoice Lines', matchRateBase: 0.74, type: 'physical_recon' },
  { name: 'Trade ↔ Confirmation', sideA: 'Trade Records', sideB: 'Confirmation Documents', matchRateBase: 0.89, type: 'trade_recon' },
  { name: 'MTM ↔ Risk Report', sideA: 'ETRM Valuations', sideB: 'Risk System MTM', matchRateBase: 0.95, type: 'valuation_recon' },
  { name: 'Fee Schedule ↔ Posting', sideA: 'Fee Calculations', sideB: 'GL Fee Postings', matchRateBase: 0.91, type: 'fee_recon' },
  { name: 'Collateral ↔ Margin Statement', sideA: 'Internal Margin Calc', sideB: 'CCP Statement', matchRateBase: 0.88, type: 'margin_recon' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const log: string[] = [];

  try {
    const body = await req.json();
    const mode = body.mode || 'seed'; // 'seed' or 'clean'
    const size = (body.size || 'L').toUpperCase();
    const confirm = body.confirm === true;
    const seedRandom = body.seedRandom || 1337;

    if (!confirm) {
      return new Response(JSON.stringify({
        error: 'Safety check: set confirm=true to proceed',
        hint: `POST with { "mode": "${mode}", "size": "${size}", "confirm": true }`,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ─── CLEAN MODE ────────────────────────────────────────────
    if (mode === 'clean') {
      log.push('Starting cleanup of synthetic data...');

      // Delete in dependency order (children first)
      const tables = [
        { table: 'match_group_items', filter: 'match_group_id', subquery: true },
        { table: 'exceptions', filter: 'run_id', subquery: true },
        { table: 'match_groups', filter: 'run_id', subquery: true },
      ];

      // Delete reconciliation_runs where template name starts with SYN_
      // First get SYN template IDs
      const { data: synTemplates } = await supabase
        .from('reconciliation_templates')
        .select('id')
        .like('name', `${SYN_PREFIX}%`);

      const synTemplateIds = (synTemplates || []).map((t: any) => t.id);
      log.push(`Found ${synTemplateIds.length} synthetic templates`);

      if (synTemplateIds.length > 0) {
        // Get run IDs for synthetic templates
        const { data: synRuns } = await supabase
          .from('reconciliation_runs')
          .select('id')
          .in('template_id', synTemplateIds);

        const synRunIds = (synRuns || []).map((r: any) => r.id);
        log.push(`Found ${synRunIds.length} synthetic runs`);

        if (synRunIds.length > 0) {
          // Delete match_group_items via match_groups
          const { data: synGroups } = await supabase
            .from('match_groups')
            .select('id')
            .in('run_id', synRunIds);

          const synGroupIds = (synGroups || []).map((g: any) => g.id);

          if (synGroupIds.length > 0) {
            // Batch delete match_group_items
            for (let i = 0; i < synGroupIds.length; i += 500) {
              const batch = synGroupIds.slice(i, i + 500);
              await supabase.from('match_group_items').delete().in('match_group_id', batch);
            }
            log.push(`Cleaned match_group_items for ${synGroupIds.length} groups`);
          }

          // Delete exceptions for synthetic runs
          for (let i = 0; i < synRunIds.length; i += 500) {
            const batch = synRunIds.slice(i, i + 500);
            await supabase.from('exceptions').delete().in('run_id', batch);
          }
          log.push('Cleaned exceptions');

          // Delete match_groups
          for (let i = 0; i < synRunIds.length; i += 500) {
            const batch = synRunIds.slice(i, i + 500);
            await supabase.from('match_groups').delete().in('run_id', batch);
          }
          log.push('Cleaned match_groups');

          // Delete runs
          for (let i = 0; i < synRunIds.length; i += 500) {
            const batch = synRunIds.slice(i, i + 500);
            await supabase.from('reconciliation_runs').delete().in('id', batch);
          }
          log.push('Cleaned reconciliation_runs');
        }

        // Delete matching_rules
        for (let i = 0; i < synTemplateIds.length; i += 500) {
          const batch = synTemplateIds.slice(i, i + 500);
          await supabase.from('matching_rules').delete().in('template_id', batch);
        }

        // Delete templates
        await supabase.from('reconciliation_templates').delete().like('name', `${SYN_PREFIX}%`);
        log.push('Cleaned reconciliation_templates');
      }

      // Delete synthetic canonical_records
      await supabase.from('canonical_records').delete().like('deal_id', `${SYN_PREFIX}%`);
      log.push('Cleaned canonical_records');

      // Delete synthetic counterparties
      await supabase.from('canonical_counterparties').delete().like('name', `${SYN_PREFIX}%`);
      log.push('Cleaned canonical_counterparties');

      // Delete synthetic ingestion_batches
      await supabase.from('ingestion_batches').delete().like('file_name', `${SYN_PREFIX}%`);
      log.push('Cleaned ingestion_batches');

      return new Response(JSON.stringify({
        status: 'cleaned',
        log,
        duration_ms: Date.now() - startTime,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── SEED MODE ─────────────────────────────────────────────
    if (!SIZES[size]) {
      return new Response(JSON.stringify({ error: `Invalid size: ${size}. Use S, M, L, or XL` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cfg = SIZES[size];
    const rng = new SeededRNG(seedRandom);
    log.push(`Starting scalability seed: size=${size}, seed=${seedRandom}`);

    // Generate reference data arrays
    const sourceSystems = generateNames(rng, 'SRC', cfg.sourceSystems, BASE_SOURCE_SYSTEMS);
    const financialSystems = generateNames(rng, 'FIN', cfg.financialSystems, BASE_FINANCIAL_SYSTEMS);
    const legalEntities = generateNames(rng, 'LE', cfg.legalEntities, ['Trading Co. US', 'Trading Co. UK', 'Trading Co. Singapore']);
    const portfolios = generateNames(rng, 'PF', cfg.portfolios, ['CRUDE', 'GAS', 'POWER', 'LNG']);
    const instrumentTypes = generateNames(rng, 'IT', cfg.instrumentTypes, BASE_INSTRUMENT_TYPES);
    const transactionTypes = generateNames(rng, 'TT', cfg.transactionTypes, BASE_TRANSACTION_TYPES);
    const counterpartyNames = generateCounterpartyNames(rng, cfg.counterparties);

    const dateStart = new Date('2023-01-01');
    const dateEnd = new Date('2024-12-31');

    // 1. Insert synthetic counterparties
    log.push('Inserting counterparties...');
    const cpRecords = counterpartyNames
      .filter(n => n.startsWith(SYN_PREFIX))
      .map(name => ({
        tenant_id: TENANT_ID,
        name,
        short_name: name.substring(0, 20),
        country: rng.pick(['US', 'UK', 'SG', 'CH', 'DE', 'JP', 'AU', 'CA', 'NO', 'BR']),
        is_active: true,
      }));
    const cpInserted = await batchInsert(supabase, 'canonical_counterparties', cpRecords, cfg.batchSize, log);
    log.push(`Counterparties: ${cpInserted} inserted`);

    // 2. Insert templates
    log.push('Inserting templates...');
    const templateRecords: any[] = [];
    const templateIds: string[] = [];
    for (let i = 0; i < cfg.templates; i++) {
      const archetype = TEMPLATE_ARCHETYPES[i % TEMPLATE_ARCHETYPES.length];
      const id = rng.uuid();
      templateIds.push(id);
      const srcSys = rng.pick(sourceSystems);
      const finSys = rng.pick(financialSystems);
      templateRecords.push({
        id,
        tenant_id: TENANT_ID,
        name: `${SYN_PREFIX}${archetype.name} #${String(i + 1).padStart(3, '0')}`,
        description: `Scalability test template: ${archetype.name} — ${srcSys} vs ${finSys}`,
        template_type: archetype.type,
        side_a_source: srcSys,
        side_a_dataset: archetype.sideA,
        side_b_source: finSys,
        side_b_dataset: archetype.sideB,
        is_active: rng.next() > 0.15,
        template_status: rng.next() > 0.2 ? 'active' : 'draft',
        tags: [SYN_PREFIX.slice(0, -1), archetype.type, srcSys],
      });
    }
    const tmplInserted = await batchInsert(supabase, 'reconciliation_templates', templateRecords, cfg.batchSize, log);
    log.push(`Templates: ${tmplInserted} inserted`);

    // 3. Insert ingestion batches (for linking canonical_records)
    log.push('Inserting ingestion batches...');
    const batchIds: string[] = [];
    const ingestionBatches: any[] = [];
    const numBatches = Math.min(cfg.runs, 200); // cap batches
    for (let i = 0; i < numBatches; i++) {
      const id = rng.uuid();
      batchIds.push(id);
      ingestionBatches.push({
        id,
        tenant_id: TENANT_ID,
        source_system: rng.pick(sourceSystems),
        dataset: rng.pick(['fees', 'trades', 'invoices', 'gl_lines', 'payments']),
        file_name: `${SYN_PREFIX}batch_${String(i).padStart(5, '0')}.csv`,
        status: 'completed',
        stats: { total_rows: rng.int(100, 5000), valid_rows: rng.int(90, 4900) },
        as_of_date: rng.date(dateStart, dateEnd),
      });
    }
    const batchInserted = await batchInsert(supabase, 'ingestion_batches', ingestionBatches, cfg.batchSize, log);
    log.push(`Ingestion batches: ${batchInserted} inserted`);

    // 4. Insert canonical_records (Side A + Side B)
    log.push('Generating canonical records...');
    const allSideAIds: string[] = [];
    const allSideBIds: string[] = [];
    const matchRate = 0.72; // ~72% will have a matching counterpart

    // Generate Side A records in batches
    let sideAInserted = 0;
    const sideABatchData: any[] = [];
    for (let i = 0; i < cfg.sideARecords; i++) {
      const id = rng.uuid();
      allSideAIds.push(id);
      const dealId = `${SYN_PREFIX}TRD-${String(i).padStart(7, '0')}`;
      const amount = rng.float(100, 500000);
      sideABatchData.push({
        id,
        tenant_id: TENANT_ID,
        record_type: 'etrm_fee',
        source_system: rng.pick(sourceSystems),
        batch_id: rng.pick(batchIds),
        deal_id: dealId,
        strategy: rng.pick(COMMODITIES),
        fee_type: rng.pick(instrumentTypes),
        amount,
        currency: rng.pick(CURRENCIES),
        date_primary: rng.date(dateStart, dateEnd),
        economic_date: rng.date(dateStart, dateEnd),
        counterparty: rng.pick(counterpartyNames).substring(0, 50),
        legal_entity: rng.pick(legalEntities),
        book_portfolio: rng.pick(portfolios),
        match_key: dealId,
        memo: `${SYN_PREFIX}Side A record`,
        attributes: { synthetic: true, dataset: 'scalability' },
      });

      if (sideABatchData.length >= cfg.batchSize) {
        sideAInserted += await batchInsert(supabase, 'canonical_records', sideABatchData, cfg.batchSize, log);
        sideABatchData.length = 0;
      }
    }
    if (sideABatchData.length > 0) {
      sideAInserted += await batchInsert(supabase, 'canonical_records', sideABatchData, cfg.batchSize, log);
    }
    log.push(`Side A records: ${sideAInserted} inserted`);

    // Generate Side B records
    let sideBInserted = 0;
    const sideBBatchData: any[] = [];
    for (let i = 0; i < cfg.sideBRecords; i++) {
      const id = rng.uuid();
      allSideBIds.push(id);
      const isMatch = i < Math.floor(cfg.sideBRecords * matchRate);
      const dealId = isMatch
        ? `${SYN_PREFIX}TRD-${String(i).padStart(7, '0')}`
        : `${SYN_PREFIX}ERP-${String(i).padStart(7, '0')}`;
      // For matches, add slight amount variance
      const baseAmount = rng.float(100, 500000);
      const amount = isMatch ? baseAmount * (1 + rng.float(-0.005, 0.005)) : baseAmount;

      sideBBatchData.push({
        id,
        tenant_id: TENANT_ID,
        record_type: 'erp_line',
        source_system: rng.pick(financialSystems),
        batch_id: rng.pick(batchIds),
        deal_id: dealId,
        strategy: rng.pick(COMMODITIES),
        fee_type: rng.pick(transactionTypes),
        amount: Math.round(amount * 100) / 100,
        currency: rng.pick(CURRENCIES),
        date_primary: rng.date(dateStart, dateEnd),
        posting_date: rng.date(dateStart, dateEnd),
        counterparty: rng.pick(counterpartyNames).substring(0, 50),
        legal_entity: rng.pick(legalEntities),
        book_portfolio: rng.pick(portfolios),
        match_key: dealId,
        memo: `${SYN_PREFIX}Side B record`,
        attributes: { synthetic: true, dataset: 'scalability' },
      });

      if (sideBBatchData.length >= cfg.batchSize) {
        sideBInserted += await batchInsert(supabase, 'canonical_records', sideBBatchData, cfg.batchSize, log);
        sideBBatchData.length = 0;
      }
    }
    if (sideBBatchData.length > 0) {
      sideBInserted += await batchInsert(supabase, 'canonical_records', sideBBatchData, cfg.batchSize, log);
    }
    log.push(`Side B records: ${sideBInserted} inserted`);

    // 5. Insert reconciliation_runs
    log.push('Inserting reconciliation runs...');
    const runRecords: any[] = [];
    const runIds: string[] = [];
    for (let i = 0; i < cfg.runs; i++) {
      const id = rng.uuid();
      runIds.push(id);
      const templateId = rng.pick(templateIds);
      const template = templateRecords.find(t => t.id === templateId);
      const archIdx = templateIds.indexOf(templateId) % TEMPLATE_ARCHETYPES.length;
      const baseMatchRate = TEMPLATE_ARCHETYPES[archIdx].matchRateBase;
      const thisMatchRate = baseMatchRate + rng.float(-0.08, 0.05);
      const clampedRate = Math.max(0.5, Math.min(0.99, thisMatchRate));
      const totalItems = rng.int(50, 2000);
      const matched = Math.round(totalItems * clampedRate);
      const breaks = totalItems - matched;
      const periodStart = rng.date(dateStart, dateEnd);
      const pStart = new Date(periodStart);
      const periodEnd = new Date(pStart.getTime() + rng.int(7, 31) * 86400000).toISOString().split('T')[0];
      const status = rng.pick(STATUSES) as string;
      const duration = rng.int(5, 600);
      const startedAt = rng.dateISO(dateStart, dateEnd);
      const completedAt = status === 'completed'
        ? new Date(new Date(startedAt).getTime() + duration * 1000).toISOString()
        : null;

      runRecords.push({
        id,
        tenant_id: TENANT_ID,
        template_id: templateId,
        period_start: periodStart,
        period_end: periodEnd,
        status,
        metrics: {
          total_side_a: rng.int(100, 5000),
          total_side_b: rng.int(100, 5000),
          matched,
          breaks,
          match_rate: Math.round(clampedRate * 10000) / 100,
          amount_at_risk: rng.float(0, 5000000),
          duration_seconds: duration,
          synthetic: true,
        },
        started_at: startedAt,
        completed_at: completedAt,
      });
    }
    const runsInserted = await batchInsert(supabase, 'reconciliation_runs', runRecords, cfg.batchSize, log);
    log.push(`Runs: ${runsInserted} inserted`);

    // 6. Insert match_groups and exceptions for a subset of runs
    // (limited to avoid timeout — do first N runs)
    const runsToDetail = Math.min(runIds.length, 100);
    log.push(`Generating match_groups & exceptions for ${runsToDetail} runs...`);

    let totalGroups = 0;
    let totalExceptions = 0;
    const groupBatch: any[] = [];
    const exceptionBatch: any[] = [];

    for (let r = 0; r < runsToDetail; r++) {
      const runId = runIds[r];
      const runMetrics = runRecords[r].metrics as any;
      const matchedCount = Math.min(runMetrics.matched || 10, 50); // cap per run
      const breakCount = Math.min(runMetrics.breaks || 5, 20);

      // Matched groups
      for (let g = 0; g < matchedCount; g++) {
        const sideAAmount = rng.float(100, 500000);
        const sideBAmount = sideAAmount * (1 + rng.float(-0.003, 0.003));
        groupBatch.push({
          run_id: runId,
          match_type: 'exact_1_1',
          match_key: `${SYN_PREFIX}MK-${r}-${g}`,
          status: 'matched',
          side_a_total: Math.round(sideAAmount * 100) / 100,
          side_b_total: Math.round(sideBAmount * 100) / 100,
          delta: Math.round((sideAAmount - sideBAmount) * 100) / 100,
          delta_pct: Math.round(((sideAAmount - sideBAmount) / sideAAmount) * 10000) / 100,
          explainability: { synthetic: true },
        });
        totalGroups++;
      }

      // Break exceptions
      const breakTypes = ['MISSING_IN_ERP', 'MISSING_IN_ETRM', 'AMOUNT_MISMATCH', 'CURRENCY_MISMATCH', 'DATE_MISMATCH', 'DUPLICATE_IN_ERP'];
      const severities = ['low', 'medium', 'high'];
      for (let e = 0; e < breakCount; e++) {
        exceptionBatch.push({
          tenant_id: TENANT_ID,
          run_id: runId,
          break_type: rng.pick(breakTypes),
          severity: rng.pick(severities),
          status: rng.pick(['open', 'in_progress', 'resolved', 'closed']),
          amount_at_risk: rng.float(0, 250000),
          currency: rng.pick(CURRENCIES),
          reason_code: `${SYN_PREFIX}RC-${rng.int(1, 50)}`,
          reason_details: `Synthetic break #${e} for run ${r}`,
          metadata: { synthetic: true, dataset: 'scalability' },
        });
        totalExceptions++;
      }

      // Flush in batches
      if (groupBatch.length >= cfg.batchSize) {
        await batchInsert(supabase, 'match_groups', groupBatch, cfg.batchSize, log);
        groupBatch.length = 0;
      }
      if (exceptionBatch.length >= cfg.batchSize) {
        await batchInsert(supabase, 'exceptions', exceptionBatch, cfg.batchSize, log);
        exceptionBatch.length = 0;
      }
    }

    // Flush remaining
    if (groupBatch.length > 0) await batchInsert(supabase, 'match_groups', groupBatch, cfg.batchSize, log);
    if (exceptionBatch.length > 0) await batchInsert(supabase, 'exceptions', exceptionBatch, cfg.batchSize, log);
    log.push(`Match groups: ${totalGroups} inserted`);
    log.push(`Exceptions: ${totalExceptions} inserted`);

    // 7. Sanity checks
    log.push('Running sanity checks...');
    const { count: tmplCount } = await supabase
      .from('reconciliation_templates').select('*', { count: 'exact', head: true }).like('name', `${SYN_PREFIX}%`);
    const { count: runCount } = await supabase
      .from('reconciliation_runs').select('*', { count: 'exact', head: true }).in('template_id', templateIds.slice(0, 500));
    const { count: recCount } = await supabase
      .from('canonical_records').select('*', { count: 'exact', head: true }).like('deal_id', `${SYN_PREFIX}%`);

    const sanity = {
      templates: tmplCount,
      runs: runCount,
      canonical_records: recCount,
      match_groups: totalGroups,
      exceptions: totalExceptions,
    };
    log.push(`Sanity: ${JSON.stringify(sanity)}`);

    const duration_ms = Date.now() - startTime;
    log.push(`Completed in ${duration_ms}ms`);

    return new Response(JSON.stringify({
      status: 'seeded',
      size,
      sanity,
      log,
      duration_ms,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    log.push(`FATAL: ${err.message}`);
    return new Response(JSON.stringify({
      status: 'error',
      error: err.message,
      log,
      duration_ms: Date.now() - startTime,
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
