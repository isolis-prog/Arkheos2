/**
 * Unified Exceptions page — two tabs:
 *   Tab 1: Inbox (cross-module exception cases with KPIs, richer filters)
 *   Tab 2: All Exceptions (recon-centric exceptions with bulk actions)
 * Both tabs share the same Detail Drawer.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  User,
  Clock,
  DollarSign,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge, getStatusVariant, getBreakVariant } from '@/components/ui/status-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

// Inbox components
import { ExceptionInboxKPIs } from '@/components/exception-inbox/ExceptionInboxKPIs';
import { ExceptionInboxFilters } from '@/components/exception-inbox/ExceptionInboxFilters';
import { ExceptionCasesTable } from '@/components/exception-inbox/ExceptionCasesTable';
import { useExceptionCases } from '@/hooks/useExceptionCases';

// All-exceptions components
import { ExceptionsBulkActionsBar } from '@/components/exceptions/ExceptionsBulkActionsBar';
import { BulkResolveDialog } from '@/components/exceptions/BulkResolveDialog';
import { BulkAssignDialog } from '@/components/exceptions/BulkAssignDialog';
import { ExceptionsFilters } from '@/components/exceptions/ExceptionsFilters';
import { useTeamMembers } from '@/hooks/useExceptionDetails';
import { exportToCsv } from '@/lib/export-utils';

// Shared drawer
import { ExceptionDetailDrawer } from '@/components/exceptions/ExceptionDetailDrawer';

import type { ExceptionCase } from '@/hooks/useExceptionCases';

/* ── Demo data for "All Exceptions" tab ──────────────── */

const allExceptions = [
  {
    id: 'exc-1',
    dealId: 'TRD-2024-001',
    breakType: 'AMOUNT_MISMATCH',
    severity: 'high',
    status: 'open',
    sideAAmount: 125000.00,
    sideBAmount: 123500.00,
    delta: 1500.00,
    currency: 'USD',
    strategy: 'Crude Oil Swaps',
    feeType: 'Broker Fee',
    counterparty: 'Goldman Sachs',
    legalEntity: 'Trading Co. US',
    createdAt: '2024-01-12T10:30:00Z',
    slaDueDate: '2024-01-19T23:59:59Z',
    assignedTo: 'John Smith',
    ownerRole: 'accounting',
  },
  {
    id: 'exc-2',
    dealId: 'TRD-2024-015',
    breakType: 'MISSING_IN_ERP',
    severity: 'critical',
    status: 'in_progress',
    sideAAmount: 87500.00,
    sideBAmount: null,
    delta: 87500.00,
    currency: 'USD',
    strategy: 'Natural Gas Futures',
    feeType: 'Exchange Fee',
    counterparty: 'ICE Clear',
    legalEntity: 'Trading Co. US',
    createdAt: '2024-01-10T14:00:00Z',
    slaDueDate: '2024-01-17T23:59:59Z',
    assignedTo: 'Jane Doe',
    ownerRole: 'accounting',
  },
  {
    id: 'exc-3',
    dealId: 'TRD-2024-023',
    breakType: 'CURRENCY_MISMATCH',
    severity: 'medium',
    status: 'open',
    sideAAmount: 32000.00,
    sideBAmount: 32000.00,
    delta: 0,
    currency: 'EUR vs USD',
    strategy: 'Power Hedging',
    feeType: 'Commission',
    counterparty: 'Morgan Stanley',
    legalEntity: 'Trading Co. EU',
    createdAt: '2024-01-14T08:00:00Z',
    slaDueDate: '2024-01-21T23:59:59Z',
    assignedTo: null,
    ownerRole: 'accounting',
  },
  {
    id: 'exc-4',
    dealId: 'TRD-2024-045',
    breakType: 'AMOUNT_MISMATCH',
    severity: 'low',
    status: 'pending_approval',
    sideAAmount: 5200.00,
    sideBAmount: 5180.00,
    delta: 20.00,
    currency: 'USD',
    strategy: 'Crude Oil Swaps',
    feeType: 'Admin Fee',
    counterparty: 'BP Trading',
    legalEntity: 'Trading Co. US',
    createdAt: '2024-01-15T11:00:00Z',
    slaDueDate: '2024-01-22T23:59:59Z',
    assignedTo: 'John Smith',
    ownerRole: 'accounting',
  },
];

type AllExceptionType = typeof allExceptions[0];

/* ── Helpers ─────────────────────────────────────────── */

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    default: return 'muted';
  }
};

const getDaysRemaining = (dueDate: string) => {
  const due = new Date(dueDate);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const formatCurrency = (amount: number | null, currency: string) => {
  if (amount === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.split(' ')[0] || 'USD',
  }).format(amount);
};

/* ── Inbox Tab Content ───────────────────────────────── */

function InboxTab({
  onSelectCase,
}: {
  onSelectCase: (c: ExceptionCase) => void;
}) {
  const { cases, filters, setFilters, kpis } = useExceptionCases();

  return (
    <div className="space-y-6">
      <ExceptionInboxKPIs
        totalOpen={kpis.totalOpen}
        critical={kpis.critical}
        slaOverdue={kpis.slaOverdue}
        totalAmountAtRisk={kpis.totalAmountAtRisk}
      />
      <ExceptionInboxFilters filters={filters} onChange={setFilters} modules={kpis.modules} />
      {/* Clickable table rows */}
      <InboxCasesClickable cases={cases} onSelect={onSelectCase} />
    </div>
  );
}

/** Wraps ExceptionCasesTable rows to make them clickable → opens drawer */
function InboxCasesClickable({
  cases,
  onSelect,
}: {
  cases: ExceptionCase[];
  onSelect: (c: ExceptionCase) => void;
}) {
  // We re-use the table but wrap each row with a click handler via a wrapper
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Case Ref</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Module</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Severity</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Owner</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Amount</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">SLA</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {cases.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-8 text-muted-foreground">
                No exception cases found
              </td>
            </tr>
          ) : (
            cases.map((c) => {
              const slaOverdue =
                c.slaDueAt &&
                new Date(c.slaDueAt) < new Date() &&
                !['resolved', 'waived'].includes(c.status);
              const roleLabel: Record<string, string> = {
                fo: 'Front Office',
                mo: 'Middle Office',
                bo: 'Back Office',
                ops: 'Operations',
                treasury: 'Treasury',
              };
              const sevVar = (s: string) =>
                s === 'critical' ? 'error' : s === 'high' ? 'warning' : s === 'medium' ? 'info' : 'muted';
              const statVar = (s: string) => {
                const map: Record<string, string> = {
                  new: 'error',
                  triaged: 'warning',
                  in_progress: 'info',
                  pending_counterparty: 'warning',
                  resolved: 'success',
                  waived: 'muted',
                };
                return map[s] || 'muted';
              };

              return (
                <tr
                  key={c.id}
                  className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => onSelect(c)}
                >
                  <td className="p-4 align-middle font-mono text-xs font-medium">{c.caseRef}</td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize">
                      {c.module.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    <StatusBadge variant={sevVar(c.severity) as any}>{c.severity.toUpperCase()}</StatusBadge>
                  </td>
                  <td className="p-4 align-middle">
                    <StatusBadge variant={statVar(c.status) as any}>{c.status.replace(/_/g, ' ')}</StatusBadge>
                  </td>
                  <td className="p-4 align-middle text-xs">
                    {c.ownerRole && <span className="text-muted-foreground">{roleLabel[c.ownerRole]}</span>}
                    {c.ownerUserName && <p className="font-medium">{c.ownerUserName}</p>}
                    {!c.ownerUserName && !c.ownerRole && (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </td>
                  <td className="p-4 align-middle max-w-[300px] truncate text-sm">{c.description}</td>
                  <td className="p-4 align-middle text-right font-mono text-sm">
                    {c.amount ? `${c.currency || '$'}${c.amount.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-4 align-middle">
                    {c.slaDueAt ? (
                      <span className={slaOverdue ? 'text-destructive font-medium text-xs' : 'text-xs text-muted-foreground'}>
                        {new Date(c.slaDueAt).toLocaleDateString()}
                        {slaOverdue && ' ⚠'}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ── All Exceptions Tab Content ──────────────────────── */

function AllExceptionsTab({
  onSelectException,
}: {
  onSelectException: (id: string) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: teamMembers = [] } = useTeamMembers();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [breakTypeFilter, setBreakTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const filteredExceptions = useMemo(() => {
    return allExceptions.filter((exc) => {
      if (searchQuery && !exc.dealId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (statusFilter !== 'all' && exc.status !== statusFilter) return false;
      if (severityFilter !== 'all' && exc.severity !== severityFilter) return false;
      if (breakTypeFilter !== 'all' && exc.breakType !== breakTypeFilter) return false;
      const excDate = new Date(exc.createdAt);
      if (dateRange.from && excDate < dateRange.from) return false;
      if (dateRange.to) {
        const toEnd = new Date(dateRange.to);
        toEnd.setHours(23, 59, 59, 999);
        if (excDate > toEnd) return false;
      }
      return true;
    });
  }, [searchQuery, statusFilter, severityFilter, breakTypeFilter, dateRange]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSeverityFilter('all');
    setBreakTypeFilter('all');
    setDateRange({ from: undefined, to: undefined });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(filteredExceptions.map((e) => e.id)) : new Set());
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    checked ? newSet.add(id) : newSet.delete(id);
    setSelectedIds(newSet);
  };

  const selectedExceptions = filteredExceptions.filter((e) => selectedIds.has(e.id));
  const totalSelectedAmount = selectedExceptions.reduce((sum, e) => sum + Math.abs(e.delta), 0);

  const handleBulkResolve = async (status: 'resolved' | 'closed', reasonCode: string, reasonDetails: string) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success(`${selectedIds.size} exception(s) ${status}`);
      setSelectedIds(new Set());
      setResolveDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to resolve: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAssign = async (userId: string) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      const user = teamMembers.find((m) => m.id === userId);
      toast.success(`${selectedIds.size} exception(s) assigned to ${user?.full_name || user?.email}`);
      setSelectedIds(new Set());
      setAssignDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to assign: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const data = selectedExceptions.map((e) => ({
      'Deal ID': e.dealId,
      'Break Type': e.breakType.replace(/_/g, ' '),
      Severity: e.severity,
      Status: e.status.replace(/_/g, ' '),
      'Side A Amount': e.sideAAmount,
      'Side B Amount': e.sideBAmount,
      Delta: e.delta,
      Currency: e.currency,
      Strategy: e.strategy,
      'Fee Type': e.feeType,
      Counterparty: e.counterparty,
      'Legal Entity': e.legalEntity,
      'Assigned To': e.assignedTo || '',
      'SLA Due Date': new Date(e.slaDueDate).toLocaleDateString(),
    }));
    exportToCsv(data, `exceptions-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${selectedExceptions.length} exception(s)`);
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-destructive">
                  {allExceptions.filter((e) => e.severity === 'critical').length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High</p>
                <p className="text-2xl font-bold text-warning">
                  {allExceptions.filter((e) => e.severity === 'high').length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unassigned</p>
                <p className="text-2xl font-bold">
                  {allExceptions.filter((e) => !e.assignedTo).length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Delta</p>
                <p className="text-2xl font-bold">
                  ${(allExceptions.reduce((s, e) => s + Math.abs(e.delta), 0) / 1000).toFixed(1)}K
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ExceptionsFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        severity={severityFilter}
        onSeverityChange={setSeverityFilter}
        breakType={breakTypeFilter}
        onBreakTypeChange={setBreakTypeFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onClearFilters={handleClearFilters}
      />

      <ExceptionsBulkActionsBar
        selectedCount={selectedIds.size}
        totalAmount={totalSelectedAmount}
        onAssign={() => setAssignDialogOpen(true)}
        onResolve={() => setResolveDialogOpen(true)}
        onExport={handleExport}
        onClearSelection={() => setSelectedIds(new Set())}
        isLoading={isLoading}
      />

      {filteredExceptions.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedIds.size === filteredExceptions.length && filteredExceptions.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size === filteredExceptions.length ? 'Deselect all' : 'Select all'}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            Showing {filteredExceptions.length} of {allExceptions.length} exceptions
          </span>
        </div>
      )}

      {filteredExceptions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No exceptions match your filters</div>
      )}

      <div className="space-y-3">
        <AnimatePresence>
          {filteredExceptions.map((exc, index) => (
            <motion.div
              key={exc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`transition-all hover:border-accent/50 ${
                  selectedIds.has(exc.id) ? 'ring-2 ring-primary/50 border-primary/50' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedIds.has(exc.id)}
                      onCheckedChange={(checked) => handleSelectOne(exc.id, !!checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div
                      className="flex-1 flex items-center justify-between cursor-pointer"
                      onClick={() => onSelectException(exc.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{exc.dealId}</span>
                            <StatusBadge variant={getBreakVariant(exc.breakType)}>
                              {exc.breakType.replace(/_/g, ' ')}
                            </StatusBadge>
                            <StatusBadge variant={getSeverityColor(exc.severity) as any}>
                              {exc.severity}
                            </StatusBadge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{exc.strategy}</span>
                            <span>•</span>
                            <span>{exc.feeType}</span>
                            <span>•</span>
                            <span>{exc.counterparty}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-mono font-semibold text-destructive">
                            {formatCurrency(exc.delta, exc.currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">Delta</p>
                        </div>
                        <div className="text-right">
                          <StatusBadge variant={getStatusVariant(exc.status)}>
                            {exc.status.replace(/_/g, ' ')}
                          </StatusBadge>
                          {exc.assignedTo && (
                            <p className="text-xs text-muted-foreground mt-1">{exc.assignedTo}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {getDaysRemaining(exc.slaDueDate) > 0 ? (
                            <p className="text-sm">
                              <span className={getDaysRemaining(exc.slaDueDate) <= 2 ? 'text-warning' : ''}>
                                {getDaysRemaining(exc.slaDueDate)}d left
                              </span>
                            </p>
                          ) : (
                            <p className="text-sm text-destructive">Overdue</p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <BulkResolveDialog
        open={resolveDialogOpen}
        onOpenChange={setResolveDialogOpen}
        selectedExceptions={selectedExceptions.map((e) => ({ id: e.id, delta: e.delta, currency: e.currency }))}
        onResolve={handleBulkResolve}
        isLoading={isLoading}
      />
      <BulkAssignDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        selectedCount={selectedIds.size}
        teamMembers={teamMembers}
        onAssign={handleBulkAssign}
        isLoading={isLoading}
      />
    </div>
  );
}

/* ── Main Unified Page ───────────────────────────────── */

export default function ExceptionsUnified() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedExceptionId, setSelectedExceptionId] = useState<string | null>(null);
  const [selectedInboxCase, setSelectedInboxCase] = useState<ExceptionCase | null>(null);

  const handleSelectInboxCase = (c: ExceptionCase) => {
    setSelectedInboxCase(c);
    setSelectedExceptionId(null);
    setDrawerOpen(true);
  };

  const handleSelectAllException = (id: string) => {
    setSelectedExceptionId(id);
    setSelectedInboxCase(null);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedExceptionId(null);
    setSelectedInboxCase(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exceptions"
        description="Unified exception management — review, investigate, and resolve breaks across all modules"
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        }
      />

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="all">All Exceptions</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-6">
          <InboxTab onSelectCase={handleSelectInboxCase} />
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <AllExceptionsTab onSelectException={handleSelectAllException} />
        </TabsContent>
      </Tabs>

      {/* Shared Detail Drawer */}
      <ExceptionDetailDrawer
        open={drawerOpen}
        exceptionId={selectedExceptionId}
        inboxCase={selectedInboxCase}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
