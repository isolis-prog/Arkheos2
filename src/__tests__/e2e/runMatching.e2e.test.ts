/**
 * E2E: run-matching → break_details + document_trade_links → drill MV refresh SLA
 *
 * Flow:
 *   1. Seed a synthetic reconciliation run via the SECURITY DEFINER RPC
 *      `e2e_seed_matching_run` (callable with anon).
 *   2. Verify that `break_details` and `document_trade_links` were created.
 *   3. Call `refresh_drill_mvs(run_id)` and assert that
 *      `mv_recon_run_by_document` reflects the new run within the 15s SLA.
 *   4. Cleanup with `e2e_cleanup_matching_run` so no fixture leaks.
 *
 * The test only runs when the dedicated test tenant id is provided via
 * `E2E_TEST_TENANT_ID`. Otherwise it is skipped so unrelated CI jobs don't
 * touch Cloud data.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const TEST_TENANT_ID = (import.meta.env.VITE_E2E_TEST_TENANT_ID ??
  process.env.E2E_TEST_TENANT_ID) as string | undefined;

const REFRESH_SLA_MS = 15_000;
const POLL_INTERVAL_MS = 250;

const shouldRun = Boolean(SUPABASE_URL && SUPABASE_KEY && TEST_TENANT_ID);
const describeE2E = shouldRun ? describe : describe.skip;

interface SeedRow {
  run_id: string;
  exception_case_id: string;
  doc_id: string;
  deal_id: string;
}

async function pollUntil<T>(
  fn: () => Promise<T | null>,
  predicate: (value: T | null) => boolean,
  timeoutMs: number,
  intervalMs: number,
): Promise<{ value: T | null; elapsedMs: number }> {
  const start = Date.now();
  let value = await fn();
  while (!predicate(value) && Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    value = await fn();
  }
  return { value, elapsedMs: Date.now() - start };
}

describeE2E('E2E · run-matching → drill refresh SLA', () => {
  let supabase: SupabaseClient;
  let seed: SeedRow;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
      auth: { persistSession: false },
    });
  });

  it(
    'seeds a run, populates break_details/document_trade_links, and refreshes drill MVs within SLA',
    async () => {
      // 1) Seed
      const { data: seedData, error: seedError } = await supabase.rpc(
        'e2e_seed_matching_run',
        { p_tenant_id: TEST_TENANT_ID },
      );
      expect(seedError, `seed rpc failed: ${seedError?.message}`).toBeNull();
      expect(Array.isArray(seedData) && seedData.length === 1).toBe(true);
      seed = (seedData as SeedRow[])[0];
      expect(seed.run_id).toMatch(/^[0-9a-f-]{36}$/i);

      try {
        // 2a) break_details
        const { data: breaks, error: breaksError } = await supabase
          .from('break_details')
          .select('break_detail_id, exception_case_id, doc_id, break_category')
          .eq('run_id', seed.run_id);
        expect(breaksError, breaksError?.message).toBeNull();
        expect(breaks).toHaveLength(1);
        expect(breaks![0].exception_case_id).toBe(seed.exception_case_id);
        expect(breaks![0].doc_id).toBe(seed.doc_id);
        expect(breaks![0].break_category).toBe('e2e_fixture');

        // 2b) document_trade_links
        const { data: links, error: linksError } = await supabase
          .from('document_trade_links')
          .select('link_id, doc_id, deal_id, link_source')
          .eq('doc_id', seed.doc_id);
        expect(linksError, linksError?.message).toBeNull();
        expect(links).toHaveLength(1);
        expect(links![0].deal_id).toBe(seed.deal_id);
        expect(links![0].link_source).toBe('e2e_fixture');

        // 3) Refresh + SLA on drill MVs
        const refreshStart = Date.now();
        const { error: refreshError } = await supabase.rpc('refresh_drill_mvs', {
          p_run_id: seed.run_id,
        });
        expect(refreshError, `refresh_drill_mvs failed: ${refreshError?.message}`).toBeNull();
        const refreshElapsed = Date.now() - refreshStart;
        expect(
          refreshElapsed,
          `refresh_drill_mvs took ${refreshElapsed}ms (SLA ${REFRESH_SLA_MS}ms)`,
        ).toBeLessThanOrEqual(REFRESH_SLA_MS);

        // Poll the MV via its SECURITY DEFINER accessor until the new run shows up
        const { value: mvRows, elapsedMs: mvElapsed } = await pollUntil<unknown[]>(
          async () => {
            const { data } = await supabase.rpc('get_mv_recon_run_by_document', {
              _run_id: seed.run_id,
            });
            return (data as unknown[]) ?? [];
          },
          (rows) => Array.isArray(rows) && rows.length > 0,
          REFRESH_SLA_MS,
          POLL_INTERVAL_MS,
        );

        expect(
          mvRows && mvRows.length > 0,
          `mv_recon_run_by_document did not surface run ${seed.run_id} within ${REFRESH_SLA_MS}ms (waited ${mvElapsed}ms)`,
        ).toBe(true);

        const totalElapsed = refreshElapsed + mvElapsed;
        expect(
          totalElapsed,
          `total drill refresh took ${totalElapsed}ms (SLA ${REFRESH_SLA_MS}ms)`,
        ).toBeLessThanOrEqual(REFRESH_SLA_MS);
      } finally {
        // 4) Cleanup — always run, even on assertion failure
        const { error: cleanupError } = await supabase.rpc('e2e_cleanup_matching_run', {
          p_run_id: seed.run_id,
        });
        if (cleanupError) {
          // Don't mask the original failure, but surface the cleanup issue.
          // eslint-disable-next-line no-console
          console.warn('[e2e] cleanup failed:', cleanupError.message);
        }
      }
    },
    REFRESH_SLA_MS * 2 + 10_000,
  );
});

if (!shouldRun) {
  // eslint-disable-next-line no-console
  console.warn(
    '[e2e/runMatching] Skipped — set E2E_TEST_TENANT_ID (or VITE_E2E_TEST_TENANT_ID) to enable.',
  );
}
