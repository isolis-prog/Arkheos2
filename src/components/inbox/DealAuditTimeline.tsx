import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, History, ArrowRight } from 'lucide-react';
import type { DealActivityEvent, DealAuditTimelineGroup } from '@/hooks/inbox/useDealLens';
import { cn } from '@/lib/utils';

interface DealAuditTimelineProps {
  groups: DealAuditTimelineGroup[];
  isLoading: boolean;
}

const SOURCE_LABEL: Record<DealActivityEvent['source'], string> = {
  audit_events: 'Audit',
  drill_audit_events: 'Drill',
  agent_audit_events: 'Agent',
};

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/**
 * Compute a list of `{ field, before, after }` rows from an event.
 * Preference order:
 *   1. Explicit `diff` payload (object of field → { before, after } or
 *      field → newValue).
 *   2. Shallow comparison of `before_state` vs `after_state`.
 */
function computeChangeRows(
  ev: DealActivityEvent,
): Array<{ field: string; before: unknown; after: unknown }> {
  const rows: Array<{ field: string; before: unknown; after: unknown }> = [];

  if (ev.diff && typeof ev.diff === 'object') {
    for (const [field, value] of Object.entries(ev.diff)) {
      if (value && typeof value === 'object' && ('before' in value || 'after' in value)) {
        const v = value as { before?: unknown; after?: unknown };
        rows.push({ field, before: v.before ?? null, after: v.after ?? null });
      } else {
        rows.push({ field, before: null, after: value });
      }
    }
    if (rows.length > 0) return rows;
  }

  const before = (ev.before_state ?? {}) as Record<string, unknown>;
  const after = (ev.after_state ?? {}) as Record<string, unknown>;
  const fields = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const field of fields) {
    if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
      rows.push({ field, before: before[field], after: after[field] });
    }
  }
  return rows;
}

function ChangeTable({ ev }: { ev: DealActivityEvent }) {
  const rows = useMemo(() => computeChangeRows(ev), [ev]);

  if (rows.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No structured before/after data on this event.
      </p>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-2 py-1 text-left font-medium">Field</th>
            <th className="px-2 py-1 text-left font-medium">Before</th>
            <th className="px-2 py-1 text-left font-medium" />
            <th className="px-2 py-1 text-left font-medium">After</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.field} className="border-t">
              <td className="px-2 py-1 font-mono">{r.field}</td>
              <td className="px-2 py-1 font-mono break-all text-muted-foreground line-through">
                {formatValue(r.before)}
              </td>
              <td className="px-2 py-1">
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </td>
              <td className="px-2 py-1 font-mono break-all">{formatValue(r.after)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventRow({ ev }: { ev: DealActivityEvent }) {
  const [open, setOpen] = useState(false);
  const hasDetails =
    !!ev.diff ||
    !!ev.before_state ||
    !!ev.after_state ||
    !!ev.drill_path ||
    !!ev.scope_filters;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-l-2 border-muted pl-3">
      <CollapsibleTrigger
        className="w-full flex items-center gap-2 text-left py-1.5 hover:bg-muted/30 rounded-sm px-1"
        disabled={!hasDetails}
      >
        <ChevronRight
          className={cn(
            'h-3 w-3 shrink-0 transition-transform text-muted-foreground',
            open && 'rotate-90',
            !hasDetails && 'opacity-0',
          )}
        />
        <Badge variant="outline" className="text-[10px] px-1 py-0">
          {SOURCE_LABEL[ev.source]}
        </Badge>
        <span className="text-sm font-medium">{ev.action}</span>
        {ev.summary && (
          <span className="text-xs text-muted-foreground truncate flex-1">{ev.summary}</span>
        )}
        <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
          {new Date(ev.created_at).toLocaleString()}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 pr-1 py-2 space-y-2">
        {(ev.before_state || ev.after_state || ev.diff) && <ChangeTable ev={ev} />}
        {ev.drill_path != null && (
          <div>
            <div className="text-[10px] uppercase text-muted-foreground mb-1">Drill path</div>
            <pre className="text-[11px] bg-muted/50 p-2 rounded-sm overflow-auto max-h-32">
              {JSON.stringify(ev.drill_path, null, 2)}
            </pre>
          </div>
        )}
        {ev.scope_filters != null && (
          <div>
            <div className="text-[10px] uppercase text-muted-foreground mb-1">Scope filters</div>
            <pre className="text-[11px] bg-muted/50 p-2 rounded-sm overflow-auto max-h-32">
              {JSON.stringify(ev.scope_filters, null, 2)}
            </pre>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DealAuditTimeline({ groups, isLoading }: DealAuditTimelineProps) {
  return (
    <Card data-testid="deal-audit-timeline">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4" />
          Audit Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No audit or drill events recorded for this deal.
          </p>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => {
              const breakIds = Object.keys(group.byBreak);
              const breakEventIds = new Set(
                Object.values(group.byBreak)
                  .flat()
                  .map((e) => e.id),
              );
              const generalEvents = group.events.filter((e) => !breakEventIds.has(e.id));

              return (
                <div key={group.module} data-testid={`audit-module-${group.module}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="capitalize">
                      {group.module.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {group.events.length} event{group.events.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {breakIds.length > 0 && (
                    <div className="space-y-3 mb-3">
                      {breakIds.map((breakId) => (
                        <div
                          key={breakId}
                          className="rounded-md border bg-muted/20 p-2"
                          data-testid={`audit-break-${breakId}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase text-muted-foreground">
                              Break
                            </span>
                            <span className="font-mono text-xs">{breakId.slice(0, 12)}</span>
                            <Badge variant="outline" className="text-[10px] ml-auto">
                              {group.byBreak[breakId].length} change
                              {group.byBreak[breakId].length === 1 ? '' : 's'}
                            </Badge>
                          </div>
                          <div className="space-y-0.5">
                            {group.byBreak[breakId].map((ev) => (
                              <EventRow key={ev.id} ev={ev} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {generalEvents.length > 0 && (
                    <div className="space-y-0.5">
                      {generalEvents.map((ev) => (
                        <EventRow key={ev.id} ev={ev} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
