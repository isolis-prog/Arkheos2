import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Clock, DollarSign, Inbox } from 'lucide-react';
import {
  buildSourceUrl,
  computeKpis,
  sortByUrgency,
  useUnifiedBreaks,
  type UnifiedBreakModule,
  type UnifiedBreakRow,
  type UnifiedBreakSeverity,
} from '@/hooks/inbox/useUnifiedBreaks';
import { ModulePill, moduleLabel } from '@/components/inbox/ModulePill';
import { SeverityBadge } from '@/components/inbox/SeverityBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const MODULES: UnifiedBreakModule[] = [
  'reconciliations',
  'cashflows',
  'valuation_recon',
  'confirmations_recon',
];

const formatUsd = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: Math.abs(v) >= 1_000_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(v);

type GroupBy = 'none' | 'counterparty' | 'deal' | 'module' | 'severity';

export default function InboxPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [moduleFilter, setModuleFilter] = useState<UnifiedBreakModule | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<UnifiedBreakSeverity | 'all'>('all');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [counterpartyQuery, setCounterpartyQuery] = useState(
    searchParams.get('counterpartyId') ?? '',
  );
  const [dealQuery, setDealQuery] = useState(searchParams.get('dealId') ?? '');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [urgencyFirst, setUrgencyFirst] = useState(false);

  const { data: rows = [], isLoading, error } = useUnifiedBreaks({
    module: moduleFilter === 'all' ? undefined : moduleFilter,
    severity: severityFilter === 'all' ? undefined : severityFilter,
    assignedToMe,
    counterpartyId: counterpartyQuery || undefined,
    dealId: dealQuery || undefined,
  });

  const sorted = useMemo(
    () => (urgencyFirst ? sortByUrgency(rows) : rows),
    [rows, urgencyFirst],
  );
  const kpis = useMemo(() => computeKpis(rows), [rows]);

  const grouped = useMemo(() => {
    if (groupBy === 'none') return null;
    const map = new Map<string, UnifiedBreakRow[]>();
    for (const row of sorted) {
      let key: string;
      switch (groupBy) {
        case 'counterparty':
          key = row.counterparty_id ?? '— Unknown counterparty —';
          break;
        case 'deal':
          key = row.deal_id ?? '— No deal —';
          break;
        case 'module':
          key = moduleLabel(row.module);
          break;
        case 'severity':
          key = row.severity;
          break;
      }
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [sorted, groupBy]);

  const handleRowClick = (row: UnifiedBreakRow) => {
    navigate(buildSourceUrl(row));
  };

  const updateUrlFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Inbox className="h-8 w-8 text-primary" />
            Unified Breaks Inbox
          </h1>
          <p className="text-muted-foreground mt-1">
            Every open break across all four reconciliation modules, sorted by urgency.
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Inbox className="h-4 w-4" /> Open Breaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : kpis.totalOpen.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> USD Exposure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-24" /> : formatUsd(kpis.totalUsdExposure)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Oldest Break
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : `${kpis.oldestAgeDays}d`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> SLA Breaches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {isLoading ? <Skeleton className="h-8 w-16" /> : kpis.slaBreaches.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div>
            <Label htmlFor="filter-module">Module</Label>
            <Select
              value={moduleFilter}
              onValueChange={(v) => setModuleFilter(v as UnifiedBreakModule | 'all')}
            >
              <SelectTrigger id="filter-module">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {MODULES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {moduleLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-severity">Severity</Label>
            <Select
              value={severityFilter}
              onValueChange={(v) => setSeverityFilter(v as UnifiedBreakSeverity | 'all')}
            >
              <SelectTrigger id="filter-severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="material">Material</SelectItem>
                <SelectItem value="review">Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-counterparty">Counterparty ID</Label>
            <Input
              id="filter-counterparty"
              placeholder="UUID"
              value={counterpartyQuery}
              onChange={(e) => {
                setCounterpartyQuery(e.target.value);
                updateUrlFilter('counterpartyId', e.target.value);
              }}
            />
          </div>
          <div>
            <Label htmlFor="filter-deal">Deal ID</Label>
            <Input
              id="filter-deal"
              placeholder="DEAL-001"
              value={dealQuery}
              onChange={(e) => {
                setDealQuery(e.target.value);
                updateUrlFilter('dealId', e.target.value);
              }}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch
              id="my-breaks"
              checked={assignedToMe}
              onCheckedChange={setAssignedToMe}
            />
            <Label htmlFor="my-breaks">My breaks only</Label>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch
              id="urgency-sort"
              checked={urgencyFirst}
              onCheckedChange={setUrgencyFirst}
            />
            <Label htmlFor="urgency-sort">Urgency first</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Label htmlFor="group-by">Group by:</Label>
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
          <SelectTrigger id="group-by" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No grouping (flat)</SelectItem>
            <SelectItem value="counterparty">Counterparty</SelectItem>
            <SelectItem value="deal">Deal</SelectItem>
            <SelectItem value="module">Module</SelectItem>
            <SelectItem value="severity">Severity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-destructive">Failed to load breaks: {(error as Error).message}</div>
          ) : isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No open breaks</p>
              <p className="text-sm">Adjust your filters or check back later.</p>
            </div>
          ) : grouped ? (
            <div className="divide-y">
              {grouped.map(([key, group]) => (
                <div key={key}>
                  <div className="px-4 py-2 bg-muted/50 font-medium text-sm flex items-center justify-between">
                    <span>{key}</span>
                    <span className="text-muted-foreground">{group.length} breaks</span>
                  </div>
                  <BreaksTable rows={group} onRowClick={handleRowClick} />
                </div>
              ))}
            </div>
          ) : (
            <BreaksTable rows={sorted} onRowClick={handleRowClick} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BreaksTable({
  rows,
  onRowClick,
}: {
  rows: UnifiedBreakRow[];
  onRowClick: (row: UnifiedBreakRow) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Module</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Deal</TableHead>
          <TableHead className="text-right">Δ USD</TableHead>
          <TableHead className="text-right">Age</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.break_id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onRowClick(row)}
            data-testid={`break-row-${row.break_id}`}
          >
            <TableCell>
              <ModulePill module={row.module} />
            </TableCell>
            <TableCell>
              <SeverityBadge severity={row.severity} />
            </TableCell>
            <TableCell className="font-mono text-xs">
              {row.deal_id ?? <span className="text-muted-foreground">—</span>}
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatUsd(Number(row.amount_delta_usd ?? 0))}
            </TableCell>
            <TableCell className="text-right">
              <span className={row.age_days > 5 ? 'text-destructive font-medium' : ''}>
                {row.age_days}d
              </span>
            </TableCell>
            <TableCell className="capitalize text-sm">{row.status}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">
                Open →
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
