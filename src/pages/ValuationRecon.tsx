import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Play, 
  Eye, 
  Filter,
  Calendar,
  FileSearch,
  LayoutTemplate,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ValuationReconTemplateLibrary } from '@/components/valuation-recon/ValuationReconTemplateLibrary';
import { ValuationReconFiltersPanel } from '@/components/valuation-recon/ValuationReconFiltersPanel';
import { useValuationReconFilters } from '@/hooks/useValuationReconFilters';

// Demo runs (same data as Reconciliations)
const runs = [
  {
    id: 'run-1',
    template: 'Fees ETRM ↔ NetSuite',
    templateId: '1',
    periodStart: '2024-12-01',
    periodEnd: '2024-12-31',
    status: 'completed',
    matchRate: 94.2,
    sideACount: 1245,
    sideBCount: 1289,
    matched: 1173,
    breaks: 72,
    amountAtRisk: 248500,
    startedAt: '2024-01-15T10:30:00Z',
    completedAt: '2024-01-15T10:35:00Z',
  },
  {
    id: 'run-2',
    template: 'Invoice ↔ AP/AR',
    templateId: '2',
    periodStart: '2024-12-01',
    periodEnd: '2024-12-31',
    status: 'completed',
    matchRate: 91.5,
    sideACount: 856,
    sideBCount: 892,
    matched: 783,
    breaks: 73,
    amountAtRisk: 156200,
    startedAt: '2024-01-14T14:00:00Z',
    completedAt: '2024-01-14T14:08:00Z',
  },
  {
    id: 'run-3',
    template: 'Fees ETRM ↔ NetSuite',
    templateId: '1',
    periodStart: '2024-11-01',
    periodEnd: '2024-11-30',
    status: 'completed',
    matchRate: 92.8,
    sideACount: 1198,
    sideBCount: 1234,
    matched: 1112,
    breaks: 86,
    amountAtRisk: 312400,
    startedAt: '2024-12-05T09:00:00Z',
    completedAt: '2024-12-05T09:07:00Z',
  },
];

const runColumns = [
  {
    key: 'template',
    header: 'Template',
    cell: (run: typeof runs[0]) => (
      <div>
        <p className="font-medium">{run.template}</p>
        <p className="text-sm text-muted-foreground">
          {run.periodStart} to {run.periodEnd}
        </p>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (run: typeof runs[0]) => (
      <StatusBadge variant={getStatusVariant(run.status)}>
        {run.status}
      </StatusBadge>
    ),
  },
  {
    key: 'matchRate',
    header: 'Match Rate',
    cell: (run: typeof runs[0]) => (
      <span className="font-mono font-semibold text-accent">{run.matchRate}%</span>
    ),
  },
  {
    key: 'records',
    header: 'Records',
    cell: (run: typeof runs[0]) => (
      <div className="text-sm">
        <p>Side A: {run.sideACount.toLocaleString()}</p>
        <p className="text-muted-foreground">Side B: {run.sideBCount.toLocaleString()}</p>
      </div>
    ),
  },
  {
    key: 'breaks',
    header: 'Breaks',
    cell: (run: typeof runs[0]) => (
      <div>
        <p className="font-medium text-destructive">{run.breaks}</p>
        <p className="text-xs text-muted-foreground">${run.amountAtRisk.toLocaleString()}</p>
      </div>
    ),
  },
  {
    key: 'actions',
    header: '',
    cell: (run: typeof runs[0]) => (
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/valuation-recon/${run.id}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
    ),
    className: 'w-12',
  },
];

export default function ValuationRecon() {
  const [activeTab, setActiveTab] = useState<'runs' | 'templates'>('runs');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const {
    filters,
    appliedFilters,
    updateFilter,
    applyFilters,
    clearAll,
    hasActiveFilters,
    activeFilterChips,
  } = useValuationReconFilters();

  // Filter runs based on applied period filters
  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      if (appliedFilters.periodStart) {
        const runEnd = new Date(run.periodEnd);
        if (runEnd < appliedFilters.periodStart) return false;
      }
      if (appliedFilters.periodEnd) {
        const runStart = new Date(run.periodStart);
        if (runStart > appliedFilters.periodEnd) return false;
      }
      return true;
    });
  }, [appliedFilters]);

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
    <div className="space-y-8">
      <PageHeader
        title="Valuation Recon"
        description="Configure templates and run valuation reconciliation processes"
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
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
            <Button asChild>
              <Link to="/valuation-recon/templates/new">
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Link>
            </Button>
          </div>
        }
      />

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilterChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
            >
              <span className="text-muted-foreground">{chip.label}:</span> {chip.value}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => removeChip(chip)}
              />
            </span>
          ))}
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearAll}>
            Clear all
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4">
        <Button
          variant={activeTab === 'runs' ? 'default' : 'outline'}
          onClick={() => setActiveTab('runs')}
        >
          <FileSearch className="mr-2 h-4 w-4" />
          Valuation Recon Runs
        </Button>
        <Button
          variant={activeTab === 'templates' ? 'default' : 'outline'}
          onClick={() => setActiveTab('templates')}
        >
          <LayoutTemplate className="mr-2 h-4 w-4" />
          Template Library
        </Button>
      </div>

      {activeTab === 'templates' && <ValuationReconTemplateLibrary />}

      {activeTab === 'runs' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input placeholder="Search runs..." className="max-w-sm" />
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DataTable
            columns={runColumns}
            data={filteredRuns}
            onRowClick={(run) => window.location.href = `/valuation-recon/${run.id}`}
          />
        </div>
      )}

      <ValuationReconFiltersPanel
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onUpdateFilter={updateFilter}
        onApply={applyFilters}
        onClear={clearAll}
      />
    </div>
  );
}
