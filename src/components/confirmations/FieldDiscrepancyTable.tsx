import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Check, MoreVertical, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ConfirmationDiscrepancy, FieldCategory } from '@/hooks/confirmations/types';

const CATEGORY_LABELS: Record<FieldCategory, string> = {
  economic: 'Economic',
  temporal: 'Temporal',
  legal: 'Legal',
  settlement: 'Settlement',
  reference_data: 'Reference data',
  other: 'Other',
};

const CATEGORY_ORDER: FieldCategory[] = [
  'economic',
  'temporal',
  'settlement',
  'legal',
  'reference_data',
  'other',
];

function rowBgForDiscrepancy(d: ConfirmationDiscrepancy): string {
  if (d.status === 'resolved' || d.status === 'accepted_as_is') return 'bg-success/10';
  if (d.discrepancyType === 'format_only' || d.isMaterial === false) return 'bg-warning/10';
  return 'bg-destructive/10';
}

interface FieldDiscrepancyTableProps {
  discrepancies: ConfirmationDiscrepancy[];
  highlightedFieldName?: string | null;
  onRowClick?: (d: ConfirmationDiscrepancy) => void;
  onResolve: (d: ConfirmationDiscrepancy) => void;
  onAccept: (d: ConfirmationDiscrepancy) => void;
  onReject: (d: ConfirmationDiscrepancy) => void;
  onAmend: (d: ConfirmationDiscrepancy) => void;
  onEscalate: (d: ConfirmationDiscrepancy) => void;
  onReopen: (d: ConfirmationDiscrepancy) => void;
  onFlagFalsePositive: (d: ConfirmationDiscrepancy) => void;
  onResolveAllNonMaterial?: () => void;
  onAcceptAllFormatOnly?: () => void;
}

export function FieldDiscrepancyTable({
  discrepancies,
  highlightedFieldName,
  onRowClick,
  onResolve,
  onAccept,
  onReject,
  onAmend,
  onEscalate,
  onReopen,
  onFlagFalsePositive,
  onResolveAllNonMaterial,
  onAcceptAllFormatOnly,
}: FieldDiscrepancyTableProps) {
  const grouped = useMemo(() => {
    const map = new Map<FieldCategory, ConfirmationDiscrepancy[]>();
    discrepancies.forEach((d) => {
      const cat = (d.fieldCategory ?? 'other') as FieldCategory;
      const arr = map.get(cat) ?? [];
      arr.push(d);
      map.set(cat, arr);
    });
    return CATEGORY_ORDER.map((cat) => ({ cat, items: map.get(cat) ?? [] })).filter((g) => g.items.length > 0);
  }, [discrepancies]);

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            {discrepancies.length} field discrepanc{discrepancies.length === 1 ? 'y' : 'ies'}
          </p>
          <div className="flex flex-wrap gap-2">
            {onResolveAllNonMaterial && (
              <Button variant="outline" size="sm" onClick={onResolveAllNonMaterial}>
                <ShieldCheck className="h-3.5 w-3.5" />
                Resolve all non-material
              </Button>
            )}
            {onAcceptAllFormatOnly && (
              <Button variant="outline" size="sm" onClick={onAcceptAllFormatOnly}>
                <Check className="h-3.5 w-3.5" />
                Accept all format-only
              </Button>
            )}
          </div>
        </div>

        {grouped.length === 0 && (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No field discrepancies for this trade.
          </p>
        )}

        {grouped.map(({ cat, items }) => (
          <CategoryGroup
            key={cat}
            label={CATEGORY_LABELS[cat]}
            items={items}
            highlightedFieldName={highlightedFieldName}
            onRowClick={onRowClick}
            onResolve={onResolve}
            onAccept={onAccept}
            onReject={onReject}
            onAmend={onAmend}
            onEscalate={onEscalate}
            onReopen={onReopen}
            onFlagFalsePositive={onFlagFalsePositive}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface CategoryGroupProps {
  label: string;
  items: ConfirmationDiscrepancy[];
  highlightedFieldName?: string | null;
  onRowClick?: (d: ConfirmationDiscrepancy) => void;
  onResolve: (d: ConfirmationDiscrepancy) => void;
  onAccept: (d: ConfirmationDiscrepancy) => void;
  onReject: (d: ConfirmationDiscrepancy) => void;
  onAmend: (d: ConfirmationDiscrepancy) => void;
  onEscalate: (d: ConfirmationDiscrepancy) => void;
  onReopen: (d: ConfirmationDiscrepancy) => void;
  onFlagFalsePositive: (d: ConfirmationDiscrepancy) => void;
}

function CategoryGroup({
  label,
  items,
  highlightedFieldName,
  onRowClick,
  onResolve,
  onAccept,
  onReject,
  onAmend,
  onEscalate,
  onReopen,
  onFlagFalsePositive,
}: CategoryGroupProps) {
  const [open, setOpen] = useState(true);
  const materialCount = items.filter((i) => i.isMaterial).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border bg-card">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">{items.length} field{items.length === 1 ? '' : 's'}</span>
        </div>
        {materialCount > 0 && (
          <StatusBadge variant="error">
            <ShieldAlert className="mr-1 h-3 w-3" />
            {materialCount} material
          </StatusBadge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t">
        <ul className="divide-y">
          {items.map((d) => (
            <DiscrepancyRow
              key={d.discrepancyId}
              discrepancy={d}
              highlighted={highlightedFieldName === d.fieldName}
              onRowClick={onRowClick}
              onResolve={onResolve}
              onAccept={onAccept}
              onReject={onReject}
              onAmend={onAmend}
              onEscalate={onEscalate}
              onReopen={onReopen}
              onFlagFalsePositive={onFlagFalsePositive}
            />
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface DiscrepancyRowProps {
  discrepancy: ConfirmationDiscrepancy;
  highlighted: boolean;
  onRowClick?: (d: ConfirmationDiscrepancy) => void;
  onResolve: (d: ConfirmationDiscrepancy) => void;
  onAccept: (d: ConfirmationDiscrepancy) => void;
  onReject: (d: ConfirmationDiscrepancy) => void;
  onAmend: (d: ConfirmationDiscrepancy) => void;
  onEscalate: (d: ConfirmationDiscrepancy) => void;
  onReopen: (d: ConfirmationDiscrepancy) => void;
  onFlagFalsePositive: (d: ConfirmationDiscrepancy) => void;
}

function DiscrepancyRow({
  discrepancy: d,
  highlighted,
  onRowClick,
  onResolve,
  onAccept,
  onReject,
  onAmend,
  onEscalate,
  onReopen,
  onFlagFalsePositive,
}: DiscrepancyRowProps) {
  const [expanded, setExpanded] = useState(false);
  const bg = rowBgForDiscrepancy(d);
  const isOpen = d.status === 'open';

  return (
    <li
      data-testid={`discrepancy-row-${d.fieldName}`}
      className={cn(
        'cursor-pointer px-3 py-2 transition-colors',
        bg,
        highlighted && 'ring-2 ring-primary ring-inset',
      )}
      onClick={() => onRowClick?.(d)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          <span className="font-mono text-sm text-foreground">{d.fieldName}</span>
          {d.isMaterial && <StatusBadge variant="error">Material</StatusBadge>}
          {d.discrepancyType === 'format_only' && <StatusBadge variant="warning">Format only</StatusBadge>}
          {d.status !== 'open' && <StatusBadge variant="success">{d.status.replace(/_/g, ' ')}</StatusBadge>}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono text-muted-foreground">our:</span>
          <span className="font-mono text-foreground">{d.ourValue ?? '—'}</span>
          <span className="font-mono text-muted-foreground">cpty:</span>
          <span className="font-mono text-foreground">{d.counterpartyValue ?? '—'}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAccept(d)} disabled={!isOpen}>Accept counterparty value</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReject(d)} disabled={!isOpen}>Reject (ours stands)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAmend(d)} disabled={!isOpen}>Request amendment…</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEscalate(d)} disabled={!isOpen}>Escalate to MO Head</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onResolve(d)} disabled={!isOpen}>Mark resolved</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFlagFalsePositive(d)} disabled={!isOpen}>Flag as false positive</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onReopen(d)} disabled={isOpen}>Reopen</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {expanded && (
        <div className="mt-2 grid grid-cols-1 gap-2 rounded-md bg-background/60 p-2 text-xs sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Our normalized</p>
            <p className="font-mono text-foreground">{d.ourValueNormalized ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Counterparty normalized</p>
            <p className="font-mono text-foreground">{d.counterpartyValueNormalized ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tolerance applied</p>
            <p className="font-mono text-foreground">{d.toleranceApplied ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">AI confidence</p>
            <p className="font-mono text-foreground">{d.aiConfidence != null ? `${(d.aiConfidence * 100).toFixed(0)}%` : '—'}</p>
          </div>
          {d.suggestedRootCause && (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground">Suggested root cause</p>
              <p className="text-foreground">{d.suggestedRootCause}</p>
            </div>
          )}
          {d.resolutionNote && (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground">Resolution note</p>
              <p className="text-foreground">{d.resolutionNote}</p>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
