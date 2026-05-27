import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CashflowException } from '@/hooks/useCashflows';
import { format } from 'date-fns';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowUpRight,
  Filter,
  X,
  Copy,
} from 'lucide-react';
import { CashflowBreakDetailPanel } from '@/components/cashflows/drill/CashflowBreakDetailPanel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CashflowExceptionsProps {
  exceptions: CashflowException[];
}

const severityConfig = {
  high: { icon: AlertTriangle, className: 'status-badge-error', label: 'High' },
  medium: { icon: AlertCircle, className: 'status-badge-warning', label: 'Medium' },
  low: { icon: Info, className: 'status-badge-info', label: 'Low' },
};

const statusVariant = (s: string) => {
  switch (s) {
    case 'open':
      return 'destructive';
    case 'acknowledged':
      return 'secondary';
    case 'resolved':
      return 'default';
    default:
      return 'outline';
  }
};

const ALL = '__all__';
const TRUE = 'yes';
const FALSE = 'no';

/** URL-persisted filter keys. Anything left as ALL is omitted from the URL. */
type FilterKey =
  | 'status'
  | 'severity'
  | 'assignee'
  | 'sla'
  | 'entity'
  | 'portfolio'
  | 'q';

interface EnrichmentRow {
  consolidated_id: string;
  legal_entity: string | null;
  portfolio_book: string | null;
}

/**
 * Fetches enrichment (legal_entity, portfolio_book) for the consolidated_cashflow
 * records referenced by the visible exceptions. We do this here (in the
 * presentation layer) so the parent hook stays focused on raw exception data.
 */
function useExceptionEnrichment(consolidatedIds: string[]) {
  const stableKey = consolidatedIds.slice().sort().join(',');
  return useQuery({
    queryKey: ['cashflow-exception-enrichment', stableKey],
    enabled: consolidatedIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consolidated_cashflow')
        .select('id, legal_entity, portfolio_book')
        .in('id', consolidatedIds);
      if (error) throw error;
      const map = new Map<string, EnrichmentRow>();
      (data || []).forEach((r) =>
        map.set(r.id as string, {
          consolidated_id: r.id as string,
          legal_entity: (r.legal_entity as string | null) ?? null,
          portfolio_book: (r.portfolio_book as string | null) ?? null,
        }),
      );
      return map;
    },
  });
}

/** Resolves assigned_to user IDs to display names for the assignee filter. */
function useAssigneeProfiles(userIds: string[]) {
  const stableKey = userIds.slice().sort().join(',');
  return useQuery({
    queryKey: ['cashflow-exception-assignees', stableKey],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      if (error) throw error;
      const map = new Map<string, string>();
      (data || []).forEach((p) => {
        const label = (p.full_name as string | null) || (p.email as string | null) || (p.id as string);
        map.set(p.id as string, label);
      });
      return map;
    },
  });
}

export const CashflowExceptions = ({ exceptions }: CashflowExceptionsProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedConsolidatedId, setSelectedConsolidatedId] = useState<string | null>(null);

  const getParam = (k: FilterKey) => searchParams.get(`fx_${k}`) || ALL;
  const setParam = (k: FilterKey, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === ALL) next.delete(`fx_${k}`);
    else next.set(`fx_${k}`, value);
    setSearchParams(next, { replace: true });
  };
  const clearAll = () => {
    const next = new URLSearchParams(searchParams);
    (['status', 'severity', 'assignee', 'sla', 'entity', 'portfolio', 'q'] as FilterKey[]).forEach(
      (k) => next.delete(`fx_${k}`),
    );
    setSearchParams(next, { replace: true });
  };

  const filters = {
    status: getParam('status'),
    severity: getParam('severity'),
    assignee: getParam('assignee'),
    sla: getParam('sla'),
    entity: getParam('entity'),
    portfolio: getParam('portfolio'),
    q: searchParams.get('fx_q') || '',
  };

  const consolidatedIds = useMemo(
    () =>
      Array.from(
        new Set(
          exceptions.map((e) => e.consolidated_id).filter((id): id is string => Boolean(id)),
        ),
      ),
    [exceptions],
  );
  const assigneeIds = useMemo(
    () =>
      Array.from(
        new Set(exceptions.map((e) => e.assigned_to).filter((id): id is string => Boolean(id))),
      ),
    [exceptions],
  );

  const { data: enrichment } = useExceptionEnrichment(consolidatedIds);
  const { data: assignees } = useAssigneeProfiles(assigneeIds);

  /** Distinct values for filter dropdowns, computed from the *unfiltered* list. */
  const statusOptions = useMemo(
    () => Array.from(new Set(exceptions.map((e) => e.status).filter(Boolean))).sort(),
    [exceptions],
  );
  const severityOptions = useMemo(
    () => Array.from(new Set(exceptions.map((e) => e.severity).filter(Boolean))).sort(),
    [exceptions],
  );
  const entityOptions = useMemo(() => {
    const set = new Set<string>();
    consolidatedIds.forEach((cid) => {
      const le = enrichment?.get(cid)?.legal_entity;
      if (le) set.add(le);
    });
    return Array.from(set).sort();
  }, [consolidatedIds, enrichment]);
  const portfolioOptions = useMemo(() => {
    const set = new Set<string>();
    consolidatedIds.forEach((cid) => {
      const pb = enrichment?.get(cid)?.portfolio_book;
      if (pb) set.add(pb);
    });
    return Array.from(set).sort();
  }, [consolidatedIds, enrichment]);

  const now = useMemo(() => Date.now(), []);

  const filtered = useMemo(() => {
    return exceptions.filter((ex) => {
      if (filters.status !== ALL && ex.status !== filters.status) return false;
      if (filters.severity !== ALL && ex.severity !== filters.severity) return false;
      if (filters.assignee !== ALL) {
        if (filters.assignee === '__unassigned__' && ex.assigned_to) return false;
        if (filters.assignee !== '__unassigned__' && ex.assigned_to !== filters.assignee) return false;
      }
      if (filters.sla !== ALL) {
        const breached = !!(ex.sla_breach_at && new Date(ex.sla_breach_at).getTime() <= now);
        if (filters.sla === TRUE && !breached) return false;
        if (filters.sla === FALSE && breached) return false;
      }
      if (filters.entity !== ALL) {
        const le = ex.consolidated_id ? enrichment?.get(ex.consolidated_id)?.legal_entity : null;
        if (le !== filters.entity) return false;
      }
      if (filters.portfolio !== ALL) {
        const pb = ex.consolidated_id ? enrichment?.get(ex.consolidated_id)?.portfolio_book : null;
        if (pb !== filters.portfolio) return false;
      }
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const hay = `${ex.description ?? ''} ${ex.counterparty ?? ''} ${ex.exception_type ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [exceptions, filters, enrichment, now]);

  const openCount = filtered.filter((e) => e.status === 'open').length;
  const highCount = filtered.filter((e) => e.severity === 'high' && e.status === 'open').length;

  const openPanel = (ex: CashflowException) => {
    if (!ex.consolidated_id) return;
    setSelectedConsolidatedId(ex.consolidated_id);
  };

  const activeFilterCount = (
    [filters.status, filters.severity, filters.assignee, filters.sla, filters.entity, filters.portfolio] as string[]
  ).filter((v) => v !== ALL).length + (filters.q ? 1 : 0);

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Filter URL copied to clipboard');
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Open Exceptions</p>
            <p className="text-2xl font-bold">{openCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">High Severity</p>
            <p className="text-2xl font-bold">{highCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{activeFilterCount > 0 ? 'Filtered' : 'Total'} Exceptions</p>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={copyShareUrl}>
                <Copy className="mr-1 h-3 w-3" /> Share URL
              </Button>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  <X className="mr-1 h-3 w-3" /> Clear all
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={filters.status} onValueChange={(v) => setParam('status', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Severity</Label>
              <Select value={filters.severity} onValueChange={(v) => setParam('severity', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All severities</SelectItem>
                  {severityOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Assignee</Label>
              <Select value={filters.assignee} onValueChange={(v) => setParam('assignee', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All assignees</SelectItem>
                  <SelectItem value="__unassigned__">Unassigned</SelectItem>
                  {assigneeIds.map((id) => (
                    <SelectItem key={id} value={id}>{assignees?.get(id) ?? id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">SLA Breached</Label>
              <Select value={filters.sla} onValueChange={(v) => setParam('sla', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any</SelectItem>
                  <SelectItem value={TRUE}>Breached</SelectItem>
                  <SelectItem value={FALSE}>Within SLA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Legal Entity</Label>
              <Select
                value={filters.entity}
                onValueChange={(v) => setParam('entity', v)}
                disabled={entityOptions.length === 0}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All entities</SelectItem>
                  {entityOptions.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Portfolio / Book</Label>
              <Select
                value={filters.portfolio}
                onValueChange={(v) => setParam('portfolio', v)}
                disabled={portfolioOptions.length === 0}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All portfolios</SelectItem>
                  {portfolioOptions.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Search</Label>
              <Input
                value={filters.q}
                placeholder="Counterparty, description, type…"
                className="h-9"
                onChange={(e) => setParam('q', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exception Queue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Severity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {exceptions.length === 0 ? 'No exceptions' : 'No exceptions match the current filters'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((ex) => {
                  const sev =
                    severityConfig[ex.severity as keyof typeof severityConfig] ||
                    severityConfig.low;
                  const SevIcon = sev.icon;
                  const canOpen = Boolean(ex.consolidated_id);
                  const breached = !!(ex.sla_breach_at && new Date(ex.sla_breach_at).getTime() <= now);
                  return (
                    <TableRow
                      key={ex.id}
                      className={
                        canOpen
                          ? 'data-table-row cursor-pointer hover:bg-muted/50'
                          : 'data-table-row'
                      }
                      onClick={() => canOpen && openPanel(ex)}
                    >
                      <TableCell>
                        <span className={`status-badge ${sev.className}`}>
                          <SevIcon className="h-3 w-3 mr-1" />
                          {sev.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {ex.exception_type.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-sm max-w-[300px] truncate">
                        {ex.description}
                      </TableCell>
                      <TableCell className="text-sm">{ex.counterparty || '-'}</TableCell>
                      <TableCell className="text-right code-text">
                        {ex.amount
                          ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: ex.currency || 'USD',
                              maximumFractionDigits: 0,
                            }).format(ex.amount)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(ex.status)} className="text-xs">
                          {ex.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ex.sla_breach_at ? (
                          breached ? (
                            <Badge variant="destructive" className="text-xs">Breached</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              by {format(new Date(ex.sla_breach_at), 'MMM d')}
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(ex.created_at), 'MMM d')}
                      </TableCell>
                      <TableCell className="text-right">
                        {canOpen ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPanel(ex);
                            }}
                          >
                            Resolve
                            <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CashflowBreakDetailPanel
        consolidatedCashflowId={selectedConsolidatedId}
        isOpen={Boolean(selectedConsolidatedId)}
        onClose={() => setSelectedConsolidatedId(null)}
      />
    </div>
  );
};
