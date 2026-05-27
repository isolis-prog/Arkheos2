import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Play,
  Eye,
  Filter,
  FileSearch,
  LayoutTemplate,
  X,
  Loader2,
  Search,
  Settings2,
  GitCompareArrows,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileText,
  History,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { DataTable } from '@/components/ui/data-table';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { Input } from '@/components/ui/input';
import { ReconciliationFiltersPanel } from '@/components/reconciliations/ReconciliationFiltersPanel';
import { RunReconDialog } from '@/components/reconciliations/RunReconDialog';
import { useReconciliationFilters } from '@/hooks/useReconciliationFilters';
import { useRunRecon } from '@/hooks/useRunRecon';
import { ModuleHistoryDrawer } from '@/components/history/ModuleHistoryDrawer';

// ── Mock template cards ──
const templates = [
  {
    id: 'tpl-1',
    name: 'Invoice ↔ AP/AR',
    description: 'Reconcile ETRM invoices against ERP accounts payable and receivable line items.',
    status: 'active' as const,
    sideA: 'ETRM Invoices',
    sideB: 'ERP AP/AR Lines',
    matchRate: 94.2,
    lastRun: '2 hours ago',
  },
  {
    id: 'tpl-2',
    name: 'Cash ↔ Bank Statement',
    description: 'Match internal payment records with bank statement lines for cash reconciliation.',
    status: 'active' as const,
    sideA: 'Payment Records',
    sideB: 'Bank Statement Lines',
    matchRate: 87.5,
    lastRun: '6 hours ago',
  },
  {
    id: 'tpl-3',
    name: 'Subledger ↔ GL',
    description: 'Verify subledger postings against general ledger entries for period close.',
    status: 'active' as const,
    sideA: 'ETRM Subledger',
    sideB: 'ERP GL Lines',
    matchRate: 98.1,
    lastRun: '1 day ago',
  },
  {
    id: 'tpl-4',
    name: 'Physical Movement ↔ Invoice',
    description: 'Reconcile physical commodity movements against corresponding invoice line items.',
    status: 'draft' as const,
    sideA: 'Movement Records',
    sideB: 'Invoice Lines',
    matchRate: 76.3,
    lastRun: '3 days ago',
  },
];

// ── Recent runs sourced from seed dataset (18 months synthetic data) ──
import seedData from '@/lib/seed';

const recentRuns = [...seedData.reconciliationRuns]
  .sort((a, b) => (a.runDate < b.runDate ? 1 : -1))
  .slice(0, 50)
  .map((r) => {
    const matchRate = r.totalRecords > 0 ? (r.matchedRecords / r.totalRecords) * 100 : 0;
    const status =
      r.status === 'Closed & Reconciled' || r.status === 'Closed with Immaterial Breaks'
        ? 'completed'
        : r.status === 'In Review'
          ? 'in-progress'
          : r.status === 'Failed Validation'
            ? 'failed'
            : 'pending';
    return {
      id: r.runId,
      template: r.templateName,
      period: r.period,
      status,
      items: r.totalRecords,
      matchRate: Number(matchRate.toFixed(1)),
      duration: r.frequency === 'Daily' ? '2m 14s' : '7m 48s',
      startedAt: r.runDate,
    };
  });

const recentRunColumns = [
  {
    key: 'id',
    header: 'Run ID',
    cell: (row: (typeof recentRuns)[0]) => (
      <span className="font-mono text-sm">{row.id}</span>
    ),
  },
  {
    key: 'template',
    header: 'Template',
    cell: (row: (typeof recentRuns)[0]) => (
      <span className="font-medium">{row.template}</span>
    ),
  },
  {
    key: 'period',
    header: 'Period',
    cell: (row: (typeof recentRuns)[0]) => (
      <span className="text-muted-foreground">{row.period}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (row: (typeof recentRuns)[0]) => (
      <StatusBadge variant={getStatusVariant(row.status)}>
        {row.status}
      </StatusBadge>
    ),
  },
  {
    key: 'items',
    header: 'Items',
    cell: (row: (typeof recentRuns)[0]) => (
      <span>{row.items.toLocaleString()}</span>
    ),
  },
  {
    key: 'matchRate',
    header: 'Match Rate',
    cell: (row: (typeof recentRuns)[0]) => (
      <span
        className={`font-mono font-semibold ${
          row.matchRate >= 90 ? 'text-accent' : 'text-warning'
        }`}
      >
        {row.matchRate}%
      </span>
    ),
  },
  {
    key: 'duration',
    header: 'Duration',
    cell: (row: (typeof recentRuns)[0]) => (
      <span className="font-mono text-sm text-muted-foreground">
        {row.duration}
      </span>
    ),
  },
  {
    key: 'startedAt',
    header: 'Started',
    cell: (row: (typeof recentRuns)[0]) => (
      <span className="text-sm text-muted-foreground">{row.startedAt}</span>
    ),
  },
];

export default function Reconciliations() {
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const {
    filters,
    appliedFilters,
    updateFilter,
    applyFilters,
    clearAll,
    hasActiveFilters,
    activeFilterChips,
  } = useReconciliationFilters();
  const { runRecon, isRunning } = useRunRecon();

  // Brief mount-time skeleton for the Recent Runs table to demo the
  // shape-aware loading pattern. Presentation-only — no data is fetched here.
  const [recentRunsLoading, setRecentRunsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setRecentRunsLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const handleRunRecon = async () => {
    const success = await runRecon(appliedFilters);
    if (success) {
      setRunDialogOpen(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const q = searchQuery.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const removeChip = (chip: { key: string; label: string; value: string }) => {
    if (chip.key === 'sourceSystem') updateFilter('sourceSystem', null);
    else if (chip.key === 'financialSystem') updateFilter('financialSystem', null);
    else if (chip.key === 'periodStart') updateFilter('periodStart', undefined);
    else if (chip.key === 'periodEnd') updateFilter('periodEnd', undefined);
    else if (chip.key.startsWith('le-'))
      updateFilter('legalEntities', appliedFilters.legalEntities.filter((v) => v !== chip.value));
    else if (chip.key.startsWith('cp-'))
      updateFilter('counterparties', appliedFilters.counterparties.filter((v) => v !== chip.value));
    else if (chip.key.startsWith('pf-'))
      updateFilter('portfolios', appliedFilters.portfolios.filter((v) => v !== chip.value));
    else if (chip.key.startsWith('it-'))
      updateFilter('instrumentTypes', appliedFilters.instrumentTypes.filter((v) => v !== chip.value));
    else if (chip.key.startsWith('tt-'))
      updateFilter('transactionTypes', appliedFilters.transactionTypes.filter((v) => v !== chip.value));
    setTimeout(() => applyFilters(), 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ── Header ── */}
      <PageHeader
        title="Reconciliations"
        description="Manage reconciliation templates and runs"
      />

      {/* ── Action Bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Search */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(true)}
            className={hasActiveFilters ? 'border-primary text-primary' : ''}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {activeFilterChips.length}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="mr-2 h-4 w-4" />
            History
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link to="/reconciliations/templates/new">
              <Settings2 className="mr-2 h-4 w-4" />
              Configure
            </Link>
          </Button>

          <Button
            size="sm"
            onClick={() => setRunDialogOpen(true)}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Recon
          </Button>

          <Button size="sm" asChild>
            <Link to="/reconciliations/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Active Filter Chips ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilterChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
            >
              <span className="text-muted-foreground">{chip.label}:</span>{' '}
              {chip.value}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => removeChip(chip)}
              />
            </span>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={clearAll}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* ── Template Cards Grid ── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredTemplates.map((tpl) => (
          <Card
            key={tpl.id}
            className="group cursor-pointer transition-colors hover:border-primary/50"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <GitCompareArrows className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{tpl.name}</CardTitle>
                </div>
                <StatusBadge
                  variant={tpl.status === 'active' ? 'success' : 'default'}
                >
                  {tpl.status}
                </StatusBadge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {tpl.description}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Data Sources */}
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md bg-muted px-3 py-2">
                  <p className="text-xs text-muted-foreground">Side A</p>
                  <p className="text-sm font-medium">{tpl.sideA}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 rounded-md bg-muted px-3 py-2">
                  <p className="text-xs text-muted-foreground">Side B</p>
                  <p className="text-sm font-medium">{tpl.sideB}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {tpl.lastRun}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                    <span className="font-mono font-semibold text-accent">
                      {tpl.matchRate}%
                    </span>
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRunDialogOpen(true);
                  }}
                  disabled={isRunning}
                >
                  <Play className="mr-1.5 h-3.5 w-3.5" />
                  Run
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Recent Runs ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Recent Runs</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {recentRunsLoading ? (
            <TableSkeleton rows={8} columns={recentRunColumns.length} />
          ) : (
            <DataTable
              columns={recentRunColumns}
              data={recentRuns}
              onRowClick={(row) => navigate(`/reconciliations/run/${row.id}`)}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Panels / Dialogs ── */}
      <ReconciliationFiltersPanel
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onUpdateFilter={updateFilter}
        onApply={applyFilters}
        onClear={clearAll}
      />
      <RunReconDialog
        open={runDialogOpen}
        onOpenChange={setRunDialogOpen}
        appliedFilters={appliedFilters}
        hasActiveFilters={hasActiveFilters}
        activeFilterChips={activeFilterChips}
        onRun={handleRunRecon}
        isRunning={isRunning}
      />
      <ModuleHistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        moduleKey="reconciliations"
        moduleLabel="Reconciliations"
        entityTypes={['Template', 'Run', 'Break', 'Match']}
      />
    </motion.div>
  );
}
