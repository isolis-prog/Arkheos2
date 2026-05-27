import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

// ─── Deterministic PRNG (Mulberry32) ─────────────────────────────────
class SeededRNG {
  private state: number;
  constructor(seed: number) { this.state = seed; }
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min: number, max: number): number { return Math.floor(this.next() * (max - min + 1)) + min; }
  pick<T>(arr: T[]): T { return arr[this.int(0, arr.length - 1)]; }
  float(min: number, max: number, decimals = 2): number {
    const v = this.next() * (max - min) + min;
    return Math.round(v * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
  uuid(): string {
    const hex = () => this.int(0, 15).toString(16);
    const s = (n: number) => Array.from({ length: n }, hex).join('');
    return `${s(8)}-${s(4)}-4${s(3)}-${(this.int(8, 11)).toString(16)}${s(3)}-${s(12)}`;
  }
}

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const DATASET_TAG = 'history_seed_6m';
const HIST_PREFIX = 'HIST6M_';

// ─── Size configs ────────────────────────────────────────────────────
const SIZES: Record<string, { modules: number; entitiesPerModule: number; eventsTotal: number; batchSize: number }> = {
  S:  { modules: 5,  entitiesPerModule: 30,  eventsTotal: 600,    batchSize: 500 },
  M:  { modules: 10, entitiesPerModule: 120, eventsTotal: 8000,   batchSize: 1000 },
  L:  { modules: 12, entitiesPerModule: 300, eventsTotal: 40000,  batchSize: 2000 },
};

// ─── Module definitions ──────────────────────────────────────────────
const ALL_MODULES = [
  { key: 'reconciliations', entityTypes: ['Template', 'Run', 'Break', 'Match'], actions: ['CREATE', 'UPDATE', 'RUN', 'RESOLVE', 'APPROVE'] },
  { key: 'valuation-recon', entityTypes: ['Template', 'Run', 'Break'], actions: ['CREATE', 'UPDATE', 'RUN', 'RESOLVE'] },
  { key: 'cashflows', entityTypes: ['CashflowEvent', 'Forecast', 'Netting'], actions: ['CREATE', 'UPDATE', 'APPROVE', 'DELETE'] },
  { key: 'exceptions', entityTypes: ['Exception', 'Comment', 'Attachment'], actions: ['CREATE', 'UPDATE', 'ASSIGN', 'RESOLVE'] },
  { key: 'amendments', entityTypes: ['AmendmentPlan', 'Approval'], actions: ['CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'EXPORT'] },
  { key: 'trade-explorer', entityTypes: ['Trade', 'TradeEvent'], actions: ['CREATE', 'UPDATE', 'DELETE'] },
  { key: 'market-data', entityTypes: ['Curve', 'PricePoint', 'Lock'], actions: ['CREATE', 'UPDATE', 'APPROVE'] },
  { key: 'intercompany', entityTypes: ['ICPair', 'Elimination', 'NettingCycle'], actions: ['CREATE', 'UPDATE', 'RUN', 'APPROVE'] },
  { key: 'data-health', entityTypes: ['Rule', 'CheckRun', 'Issue'], actions: ['CREATE', 'UPDATE', 'RUN', 'RESOLVE'] },
  { key: 'close-readiness', entityTypes: ['Checklist', 'Task', 'Signoff'], actions: ['CREATE', 'UPDATE', 'APPROVE'] },
  { key: 'hedge-accounting', entityTypes: ['Relationship', 'TestResult', 'Pack'], actions: ['CREATE', 'UPDATE', 'RUN', 'APPROVE'] },
  { key: 'confirmations', entityTypes: ['Confirmation', 'MatchResult', 'Break'], actions: ['CREATE', 'UPDATE', 'RESOLVE', 'EXPORT'] },
];

const ACTORS = [
  null, // system
  'system',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000013',
];

const SUMMARY_TEMPLATES: Record<string, string[]> = {
  CREATE: [
    'Created {entityType} {entityId}',
    'New {entityType} added by {actor}',
    '{entityType} {entityId} initialized',
  ],
  UPDATE: [
    'Updated {entityType} {entityId} — status changed',
    '{entityType} {entityId} fields modified',
    'Config update on {entityType} {entityId}',
  ],
  RUN: [
    'Recon run started for {entityType} {entityId}',
    '{entityType} run completed — match rate 94.2%',
    '{entityType} run finished in 3m 22s',
    'Run {entityId} completed with 87.5% match rate',
    'Run {entityId} failed — timeout after 120s',
  ],
  RESOLVE: [
    'Break {entityId} resolved as "Timing difference"',
    '{entityType} {entityId} marked as resolved',
    'Exception {entityId} closed — no action required',
  ],
  APPROVE: [
    '{entityType} {entityId} approved by manager',
    'Approval granted for {entityType} {entityId}',
    'Sign-off completed on {entityType} {entityId}',
  ],
  REJECT: [
    '{entityType} {entityId} rejected — insufficient documentation',
    'Approval denied for {entityType} {entityId}',
  ],
  ASSIGN: [
    '{entityType} {entityId} assigned to analyst',
    'Reassigned {entityType} {entityId} to operations team',
  ],
  DELETE: [
    '{entityType} {entityId} soft-deleted',
    'Removed {entityType} {entityId} from active set',
  ],
  EXPORT: [
    'Exported {entityType} {entityId} to CSV',
    '{entityType} data exported for period Q4 2024',
  ],
};

function generateTimestamp(rng: SeededRNG, monthsBack: number): string {
  const now = Date.now();
  const start = now - monthsBack * 30 * 24 * 60 * 60 * 1000;
  const ts = start + rng.next() * (now - start);
  const d = new Date(ts);

  // Bias towards weekdays (60%)
  const dow = d.getDay();
  if ((dow === 0 || dow === 6) && rng.next() < 0.6) {
    d.setDate(d.getDate() + (dow === 0 ? 1 : 2));
  }

  // Bias towards business hours (30% strong bias)
  if (rng.next() < 0.3) {
    d.setHours(rng.int(9, 18), rng.int(0, 59), rng.int(0, 59));
  }

  // End-of-month spike
  const dayOfMonth = d.getDate();
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  if (lastDay - dayOfMonth <= 2 && rng.next() < 0.4) {
    d.setHours(rng.int(8, 22), rng.int(0, 59), rng.int(0, 59));
  }

  return d.toISOString();
}

function makeSummary(rng: SeededRNG, action: string, entityType: string, entityId: string): string {
  const templates = SUMMARY_TEMPLATES[action] || [`${action} on {entityType} {entityId}`];
  let s = rng.pick(templates);
  s = s.replace('{entityType}', entityType).replace('{entityId}', entityId).replace('{actor}', 'analyst');
  return s;
}

function makeBeforeAfter(rng: SeededRNG, action: string) {
  if (action === 'CREATE') {
    return {
      before: null,
      after: { status: 'active', amount: rng.float(1000, 500000), currency: rng.pick(['USD', 'EUR', 'GBP']) },
      diff: null,
    };
  }
  if (action === 'UPDATE') {
    const oldAmt = rng.float(1000, 500000);
    const newAmt = oldAmt + rng.float(-5000, 5000);
    return {
      before: { status: 'draft', amount: oldAmt },
      after: { status: 'active', amount: Math.round(newAmt * 100) / 100 },
      diff: { status: ['draft', 'active'], amount: [oldAmt, Math.round(newAmt * 100) / 100] },
    };
  }
  if (action === 'RUN') {
    return {
      before: null,
      after: { status: 'completed', matchRate: rng.float(70, 99, 1), duration: `${rng.int(1, 15)}m ${rng.int(0, 59)}s`, items: rng.int(100, 10000) },
      diff: null,
    };
  }
  if (action === 'RESOLVE' || action === 'APPROVE') {
    return {
      before: { status: action === 'RESOLVE' ? 'open' : 'pending_approval' },
      after: { status: action === 'RESOLVE' ? 'resolved' : 'approved', resolvedAt: new Date().toISOString() },
      diff: { status: [action === 'RESOLVE' ? 'open' : 'pending_approval', action === 'RESOLVE' ? 'resolved' : 'approved'] },
    };
  }
  return { before: null, after: null, diff: null };
}

// ─── Batch insert helper ─────────────────────────────────────────────
async function batchInsert(supabase: any, records: any[], batchSize: number, log: string[]): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from('audit_events').insert(batch);
    if (error) {
      log.push(`ERROR batch ${Math.floor(i / batchSize)}: ${error.message}`);
      continue;
    }
    inserted += batch.length;
  }
  return inserted;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const log: string[] = [];

  try {
    const body = await req.json();
    const mode = body.mode || 'seed';
    const size = (body.size || 'M').toUpperCase();
    const confirm = body.confirm === true;
    const months = Math.min(Math.max(body.months || 6, 6), 12);
    const seedRandom = body.seedRandom || 42;

    if (!confirm) {
      return new Response(JSON.stringify({
        error: 'Safety check: set confirm=true to proceed',
        hint: `POST with { "mode": "${mode}", "size": "${size}", "months": ${months}, "confirm": true }`,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ─── CLEAN MODE ────────────────────────────────────────────
    if (mode === 'clean') {
      log.push('Cleaning history_seed_6m events...');
      // Delete in batches by selecting IDs first
      let totalDeleted = 0;
      let hasMore = true;
      while (hasMore) {
        const { data: batch } = await supabase
          .from('audit_events')
          .select('id')
          .contains('metadata', { dataSet: DATASET_TAG })
          .limit(5000);

        if (!batch || batch.length === 0) {
          hasMore = false;
          break;
        }

        const ids = batch.map((r: any) => r.id);
        const { error } = await supabase.from('audit_events').delete().in('id', ids);
        if (error) {
          log.push(`Delete error: ${error.message}`);
          hasMore = false;
        } else {
          totalDeleted += ids.length;
          log.push(`Deleted batch of ${ids.length} (total: ${totalDeleted})`);
        }
      }

      return new Response(JSON.stringify({
        status: 'cleaned',
        totalDeleted,
        log,
        duration_ms: Date.now() - startTime,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── SEED MODE ─────────────────────────────────────────────
    if (!SIZES[size]) {
      return new Response(JSON.stringify({ error: `Invalid size: ${size}. Use S, M, or L` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cfg = SIZES[size];
    const rng = new SeededRNG(seedRandom);
    const modules = ALL_MODULES.slice(0, cfg.modules);
    const eventsPerModule = Math.ceil(cfg.eventsTotal / modules.length);

    log.push(`Starting history seed: size=${size}, months=${months}, modules=${modules.length}, target=${cfg.eventsTotal} events`);

    const allRecords: any[] = [];
    const statsByModule: Record<string, number> = {};

    for (const mod of modules) {
      const entityIds: string[] = [];
      for (let i = 0; i < cfg.entitiesPerModule; i++) {
        entityIds.push(`${HIST_PREFIX}${mod.key.toUpperCase().replace(/-/g, '_')}_${String(i).padStart(5, '0')}`);
      }

      let moduleCount = 0;
      for (let e = 0; e < eventsPerModule; e++) {
        const entityType = rng.pick(mod.entityTypes);
        const entityId = rng.pick(entityIds);
        const action = rng.pick(mod.actions);
        const actor = rng.pick(ACTORS);
        const correlationId = `${HIST_PREFIX}${rng.uuid()}`;
        const ts = generateTimestamp(rng, months);
        const { before, after, diff } = makeBeforeAfter(rng, action);
        const summary = makeSummary(rng, action, entityType, entityId);

        const metadata: Record<string, unknown> = {
          dataSet: DATASET_TAG,
          synthetic: true,
        };

        // Add scope metadata for RUN actions in reconciliations
        if (action === 'RUN' && (mod.key === 'reconciliations' || mod.key === 'valuation-recon')) {
          metadata.scope = {
            sourceSystem: rng.pick(['Allegro', 'Endur', 'RightAngle']),
            financialSystem: rng.pick(['SAP S/4HANA', 'NetSuite', 'Dynamics 365']),
            legalEntities: [rng.pick(['Trading Co. US', 'Trading Co. UK', 'Trading Co. Singapore'])],
            periodStart: '2024-10-01',
            periodEnd: '2024-12-31',
          };
          metadata.jobId = `JOB_${rng.uuid().substring(0, 8)}`;
          metadata.duration = `${rng.int(1, 12)}m ${rng.int(0, 59)}s`;
        }

        allRecords.push({
          tenant_id: TENANT_ID,
          module_key: mod.key,
          entity_type: entityType,
          entity_id: entityId,
          action,
          actor_id: actor === 'system' || actor === null ? null : actor,
          correlation_id: correlationId,
          summary,
          before_state: before,
          after_state: after,
          diff,
          metadata,
          created_at: ts,
        });
        moduleCount++;
      }
      statsByModule[mod.key] = moduleCount;
    }

    // Sort by timestamp for realism
    allRecords.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    log.push(`Generated ${allRecords.length} events, inserting in batches of ${cfg.batchSize}...`);
    const inserted = await batchInsert(supabase, allRecords, cfg.batchSize, log);

    // Sanity checks
    const { count: totalCount } = await supabase
      .from('audit_events')
      .select('*', { count: 'exact', head: true })
      .contains('metadata', { dataSet: DATASET_TAG });

    const { data: dateRange } = await supabase
      .from('audit_events')
      .select('created_at')
      .contains('metadata', { dataSet: DATASET_TAG })
      .order('created_at', { ascending: true })
      .limit(1);

    const { data: dateRangeEnd } = await supabase
      .from('audit_events')
      .select('created_at')
      .contains('metadata', { dataSet: DATASET_TAG })
      .order('created_at', { ascending: false })
      .limit(1);

    log.push(`\n─── Summary ───`);
    log.push(`Inserted: ${inserted} events`);
    log.push(`Total in DB (dataSet=${DATASET_TAG}): ${totalCount}`);
    log.push(`Date range: ${dateRange?.[0]?.created_at ?? '?'} → ${dateRangeEnd?.[0]?.created_at ?? '?'}`);
    log.push(`By module:`);
    for (const [mod, count] of Object.entries(statsByModule)) {
      log.push(`  ${mod}: ${count}`);
    }
    log.push(`Duration: ${Date.now() - startTime}ms`);

    return new Response(JSON.stringify({
      status: 'seeded',
      inserted,
      totalInDB: totalCount,
      dateRange: {
        from: dateRange?.[0]?.created_at,
        to: dateRangeEnd?.[0]?.created_at,
      },
      statsByModule,
      log,
      duration_ms: Date.now() - startTime,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.push(`Fatal error: ${message}`);
    return new Response(JSON.stringify({ error: message, log }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
