import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';
import { ModulePill } from '@/components/inbox/ModulePill';
import { SeverityBadge } from '@/components/inbox/SeverityBadge';
import { buildSourceUrl, type UnifiedBreakRow } from '@/hooks/inbox/useUnifiedBreaks';
import { supabase } from '@/integrations/supabase/client';

interface DealLensBreakDrawerProps {
  row: UnifiedBreakRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BreakDetailExtras {
  side_a_amount: number | null;
  side_b_amount: number | null;
  side_a_date: string | null;
  side_b_date: string | null;
  side_a_source_ref: string | null;
  side_b_source_ref: string | null;
  amount_delta: number | null;
  amount_delta_pct: number | null;
  date_delta_days: number | null;
  currency: string | null;
  suggested_root_cause: string | null;
  ai_confidence: number | null;
  source_record_ids: string[] | null;
  derivation_inputs: Record<string, unknown> | null;
  evidence_refs: Array<Record<string, unknown>> | null;
  rule_id: string | null;
  rule_version: string | null;
}

function formatUsd(n: number | null | undefined, ccy: string | null = 'USD') {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: ccy || 'USD',
    maximumFractionDigits: 2,
  }).format(n);
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={mono ? 'font-mono text-sm break-all' : 'text-sm font-medium'}>{value}</div>
    </div>
  );
}

export function DealLensBreakDrawer({ row, open, onOpenChange }: DealLensBreakDrawerProps) {
  const [extras, setExtras] = useState<BreakDetailExtras | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !row) {
      setExtras(null);
      setError(null);
      return;
    }

    // Only the reconciliations module has rich break_details rows. For other
    // modules we still show all fields from the unified row.
    if (row.module !== 'reconciliations') {
      setExtras(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const { data, error: queryError } = await supabase
        .from('break_details')
        .select(
          'side_a_amount, side_b_amount, side_a_date, side_b_date, side_a_source_ref, side_b_source_ref, amount_delta, amount_delta_pct, date_delta_days, currency, suggested_root_cause, ai_confidence, source_record_ids, derivation_inputs, evidence_refs, rule_id, rule_version',
        )
        .eq('exception_case_id', row.break_id)
        .maybeSingle();

      if (cancelled) return;
      if (queryError) {
        setError(queryError.message);
        setExtras(null);
      } else {
        setExtras((data as unknown as BreakDetailExtras) ?? null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, row]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto"
        data-testid="deal-lens-break-drawer"
      >
        {row && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ModulePill module={row.module} />
                <span>Break detail</span>
              </SheetTitle>
              <SheetDescription className="font-mono text-xs break-all">
                {row.break_id}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Severity" value={<SeverityBadge severity={row.severity} />} />
                <Field label="Status" value={<Badge variant="outline">{row.status}</Badge>} />
                <Field label="Δ (USD)" value={formatUsd(Number(row.amount_delta_usd ?? 0))} />
                <Field label="Age" value={`${row.age_days} day(s)`} />
                <Field label="Deal" value={row.deal_id ?? '—'} mono />
                <Field label="Counterparty" value={row.counterparty_id ?? '—'} mono />
                <Field label="Legal entity" value={row.legal_entity_id ?? '—'} mono />
                <Field label="Assigned to" value={row.assigned_to ?? '—'} mono />
                <Field label="Run" value={row.run_id ?? '—'} mono />
                <Field
                  label="Created"
                  value={new Date(row.created_at).toLocaleString()}
                />
              </div>

              {row.source_ref && (
                <Field label="Source ref" value={row.source_ref} mono />
              )}

              <Separator />

              {/* Before / after evidence (recon only) */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Before / after evidence</h3>

                {row.module !== 'reconciliations' && (
                  <p className="text-sm text-muted-foreground">
                    Detailed before/after evidence is only available for reconciliation breaks.
                  </p>
                )}

                {loading && <Skeleton className="h-32 w-full" />}

                {error && (
                  <p className="text-sm text-destructive">Failed to load detail: {error}</p>
                )}

                {!loading && !error && extras && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase text-muted-foreground">
                          Side A (before)
                        </div>
                        <Field
                          label="Amount"
                          value={formatUsd(extras.side_a_amount, extras.currency)}
                        />
                        <Field label="Date" value={extras.side_a_date ?? '—'} />
                        <Field
                          label="Source ref"
                          value={extras.side_a_source_ref ?? '—'}
                          mono
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase text-muted-foreground">
                          Side B (after)
                        </div>
                        <Field
                          label="Amount"
                          value={formatUsd(extras.side_b_amount, extras.currency)}
                        />
                        <Field label="Date" value={extras.side_b_date ?? '—'} />
                        <Field
                          label="Source ref"
                          value={extras.side_b_source_ref ?? '—'}
                          mono
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Field
                        label="Δ Amount"
                        value={formatUsd(extras.amount_delta, extras.currency)}
                      />
                      <Field
                        label="Δ %"
                        value={
                          extras.amount_delta_pct != null
                            ? `${extras.amount_delta_pct.toFixed(2)}%`
                            : '—'
                        }
                      />
                      <Field
                        label="Δ Days"
                        value={extras.date_delta_days ?? '—'}
                      />
                    </div>

                    {extras.suggested_root_cause && (
                      <Field
                        label="Suggested root cause"
                        value={
                          <span>
                            {extras.suggested_root_cause}
                            {extras.ai_confidence != null && (
                              <Badge variant="secondary" className="ml-2">
                                {Math.round(extras.ai_confidence * 100)}% conf.
                              </Badge>
                            )}
                          </span>
                        }
                      />
                    )}

                    {(extras.rule_id || extras.rule_version) && (
                      <Field
                        label="Rule"
                        value={`${extras.rule_id ?? '—'}${extras.rule_version ? ` · v${extras.rule_version}` : ''}`}
                        mono
                      />
                    )}

                    {extras.source_record_ids && extras.source_record_ids.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                          Source record IDs
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {extras.source_record_ids.map((id) => (
                            <Badge key={id} variant="outline" className="font-mono text-xs">
                              {id}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {extras.evidence_refs && extras.evidence_refs.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                          Evidence refs
                        </div>
                        <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-auto max-h-48">
                          {JSON.stringify(extras.evidence_refs, null, 2)}
                        </pre>
                      </div>
                    )}

                    {extras.derivation_inputs && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                          Derivation inputs
                        </div>
                        <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-auto max-h-48">
                          {JSON.stringify(extras.derivation_inputs, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {!loading && !error && !extras && row.module === 'reconciliations' && (
                  <p className="text-sm text-muted-foreground">
                    No enriched break_details record found for this break.
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button asChild size="sm" variant="default">
                  <Link to={buildSourceUrl(row)} onClick={() => onOpenChange(false)}>
                    Open in source module <ExternalLink className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
