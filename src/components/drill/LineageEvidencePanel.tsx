import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FileSearch, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { LineageEvidence } from './types';

export interface LineageEvidencePanelProps {
  lineage?: LineageEvidence | null;
  /** Controls visual density: 'card' for the side panel, 'inline' for embedded use under a row. */
  variant?: 'card' | 'inline';
  /** Optional title override. */
  title?: string;
  className?: string;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function isPopulated(lineage?: LineageEvidence | null): boolean {
  if (!lineage) return false;
  return Object.values(lineage).some((v) => {
    if (v === null || v === undefined) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return Object.keys(v as object).length > 0;
    return String(v).length > 0;
  });
}

interface RowProps {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}

function LineageRow({ label, value, mono }: RowProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-1.5 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn('max-w-[60%] text-right text-sm text-foreground', mono && 'font-mono text-xs')}>
        {value === null || value === undefined || value === '' ? '—' : value}
      </span>
    </div>
  );
}

interface JsonBlockProps {
  label: string;
  value: unknown;
}

function JsonBlock({ label, value }: JsonBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const json = useMemo(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {label}
      </button>
      {expanded && (
        <pre className="max-h-56 overflow-auto rounded-md border border-border bg-muted/40 p-2 font-mono text-[11px] text-foreground">
          {json}
        </pre>
      )}
    </div>
  );
}

export function LineageEvidencePanel({ lineage, variant = 'card', title, className }: LineageEvidencePanelProps) {
  const populated = isPopulated(lineage);

  const body = (
    <div className="space-y-3">
      {!populated ? (
        <p className="text-sm text-muted-foreground">
          No lineage captured for this row yet. It will appear once the enrichment pipeline runs and writes audit references.
        </p>
      ) : (
        <>
          <div className="space-y-0.5">
            {lineage?.sideASourceRef !== undefined && (
              <LineageRow label="Side A source" value={lineage?.sideASourceRef} mono />
            )}
            {lineage?.sideBSourceRef !== undefined && (
              <LineageRow label="Side B source" value={lineage?.sideBSourceRef} mono />
            )}
            {lineage?.sourceRecordIds && lineage.sourceRecordIds.length > 0 && (
              <LineageRow
                label="Source records"
                value={lineage.sourceRecordIds.join(', ')}
                mono
              />
            )}
            {lineage?.resolutionMethod !== undefined && (
              <LineageRow
                label="Resolution method"
                value={
                  lineage?.resolutionMethod ? (
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {lineage.resolutionMethod}
                    </Badge>
                  ) as unknown as string : undefined
                }
              />
            )}
            {(lineage?.ruleId || lineage?.ruleVersion) && (
              <LineageRow
                label="Rule"
                value={[lineage?.ruleId, lineage?.ruleVersion].filter(Boolean).join(' · ')}
                mono
              />
            )}
            {(lineage?.enrichmentRunId || lineage?.resolvedByRunId) && (
              <LineageRow
                label="Run id"
                value={lineage?.enrichmentRunId ?? lineage?.resolvedByRunId}
                mono
              />
            )}
            {(lineage?.enrichedAt || lineage?.resolvedAt) && (
              <LineageRow label="Enriched at" value={formatDate(lineage?.enrichedAt ?? lineage?.resolvedAt)} />
            )}
            {(lineage?.enrichedBy || lineage?.resolvedBy) && (
              <LineageRow label="Enriched by" value={lineage?.enrichedBy ?? lineage?.resolvedBy} mono />
            )}
            {(lineage?.ailRequestId || lineage?.ailModelVersion) && (
              <LineageRow
                label="AIL"
                value={[lineage?.ailModelVersion, lineage?.ailRequestId].filter(Boolean).join(' · ')}
                mono
              />
            )}
          </div>

          {(lineage?.derivationInputs || lineage?.matchFeatures || (lineage?.evidenceRefs && lineage.evidenceRefs.length > 0)) && (
            <>
              <Separator />
              <div className="space-y-2">
                {lineage?.derivationInputs && (
                  <JsonBlock label="Derivation inputs" value={lineage.derivationInputs} />
                )}
                {lineage?.matchFeatures && (
                  <JsonBlock label="Match features" value={lineage.matchFeatures} />
                )}
                {lineage?.evidenceRefs && lineage.evidenceRefs.length > 0 && (
                  <JsonBlock label={`Audit references (${lineage.evidenceRefs.length})`} value={lineage.evidenceRefs} />
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className={cn('rounded-md border border-dashed border-border/70 bg-muted/30 p-3', className)}>
        <div className="mb-2 flex items-center gap-2">
          <FileSearch className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title ?? 'Lineage evidence'}
          </span>
        </div>
        {body}
      </div>
    );
  }

  return (
    <Card className={cn('rounded-md border-border', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-info" />
          {title ?? 'Lineage & evidence'}
        </CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

/** Compact toggle for inline use under tables. */
export function LineageEvidenceToggle({ lineage, title }: { lineage?: LineageEvidence | null; title?: string }) {
  const [open, setOpen] = useState(false);
  const populated = isPopulated(lineage);
  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 gap-1 px-2 text-xs"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Evidence
        {populated && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-info" aria-hidden />}
      </Button>
      {open && (
        <div className="mt-2">
          <LineageEvidencePanel lineage={lineage} variant="inline" title={title} />
        </div>
      )}
    </div>
  );
}
