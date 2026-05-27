import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { exportToCsv, exportToExcel } from '@/lib/export-utils';
import seedData from '@/lib/seed';

type ComparisonRow = {
  id: string;
  invoiceNumber: string;
  subsidiary: string;
  counterparty: string;
  dealType: string;
  dealId: string;
  etrmAmount: number | null;
  etrmCurrency: string | null;
  erpAmount: number | null;
  erpCurrency: string | null;
  discrepancy: string;
  matchStatus: string;
};

const fmt = (v: number | null, ccy: string | null) =>
  v === null
    ? null
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: ccy || 'USD',
        maximumFractionDigits: 2,
      }).format(v);

const computeVariance = (a: number | null, b: number | null) => {
  if (a === null || b === null) return null;
  return a - b;
};

// Pre-index seed lookups (cheap; runs once at module load)
const counterpartyById = new Map(seedData.masterData.counterparties.map((c) => [c.id, c]));
const legalEntityById = new Map(seedData.masterData.legalEntities.map((e) => [e.id, e]));
const tradeById = new Map(seedData.trades.map((t) => [t.tradeId, t]));
const invoiceById = new Map(seedData.invoices.map((i) => [i.invoiceId, i]));
const runById = new Map(seedData.reconciliationRuns.map((r) => [r.runId, r]));
const itemsByRun = new Map<string, typeof seedData.reconciliationItems>();
for (const it of seedData.reconciliationItems) {
  if (!itemsByRun.has(it.runId)) itemsByRun.set(it.runId, []);
  itemsByRun.get(it.runId)!.push(it);
}

export default function ReconciliationRunDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const run = runById.get(id);
  const seedItems = itemsByRun.get(id) ?? [];

  const header = run
    ? {
        template: run.templateName,
        period: run.period,
        status:
          run.status === 'Closed & Reconciled' || run.status === 'Closed with Immaterial Breaks'
            ? 'completed'
            : run.status === 'In Review'
              ? 'in-progress'
              : run.status === 'Failed Validation'
                ? 'failed'
                : 'pending',
        startedAt: run.runDate,
      }
    : { template: 'Reconciliation Run', period: '—', status: 'completed', startedAt: '—' };

  const allRows: ComparisonRow[] = useMemo(() => {
    return seedItems.map((it, idx) => {
      const inv = invoiceById.get(it.invoiceId);
      const trade = tradeById.get(it.tradeId);
      const cp = counterpartyById.get(it.counterpartyId);
      const le = legalEntityById.get(it.legalEntityId);
      return {
        id: `${it.itemId}-${idx}`,
        invoiceNumber: inv?.etrmInvoiceRef ?? it.invoiceId,
        subsidiary: le?.name ?? it.legalEntityId,
        counterparty: cp?.name ?? it.counterpartyId,
        dealType: trade?.tradeType ?? '—',
        dealId: it.tradeId,
        etrmAmount: it.etrmAmount,
        etrmCurrency: it.currency,
        erpAmount: it.erpAmount,
        erpCurrency: it.erpAmount === null ? null : it.currency,
        discrepancy: it.discrepancyType,
        matchStatus: it.matchStatus,
      };
    });
  }, [seedItems]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((r) =>
      [r.invoiceNumber, r.subsidiary, r.counterparty, r.dealType, r.dealId, r.discrepancy]
        .some((f) => f.toLowerCase().includes(q))
    );
  }, [allRows, search]);

  const summary = useMemo(() => {
    const total = allRows.length;
    const matched = allRows.filter(
      (r) =>
        r.etrmAmount !== null &&
        r.erpAmount !== null &&
        Math.abs(r.etrmAmount - r.erpAmount) < 0.01,
    ).length;
    const breaks = allRows.filter((r) => {
      if (r.etrmAmount === null || r.erpAmount === null) return false;
      return Math.abs(r.etrmAmount - r.erpAmount) >= 0.01;
    }).length;
    const orphans = allRows.filter((r) => r.etrmAmount === null || r.erpAmount === null).length;
    return { total, matched, breaks, orphans };
  }, [allRows]);

  const buildExportRows = () =>
    rows.map((r) => {
      const variance = computeVariance(r.etrmAmount, r.erpAmount);
      return {
        invoice_number: r.invoiceNumber,
        subsidiary: r.subsidiary,
        counterparty: r.counterparty,
        deal_type: r.dealType,
        deal_id: r.dealId,
        etrm_amount: r.etrmAmount ?? 'N/A',
        etrm_currency: r.etrmCurrency ?? 'N/A',
        erp_amount: r.erpAmount ?? 'N/A',
        erp_currency: r.erpCurrency ?? 'N/A',
        variance: variance ?? 'N/A',
        discrepancy_type: r.discrepancy,
        match_status: r.matchStatus,
        status:
          r.etrmAmount === null || r.erpAmount === null
            ? 'ORPHAN'
            : Math.abs(variance as number) < 0.01
              ? 'MATCHED'
              : 'BREAK',
      };
    });

  const handleExportCsv = () => {
    exportToCsv(buildExportRows(), `${id || 'reconciliation-run'}-comparison`);
  };
  const handleExportExcel = async () => {
    await exportToExcel(buildExportRows(), `${id || 'reconciliation-run'}-comparison`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/reconciliations')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`Run ${id}`}
          description={`${header.template} · ${header.period} · Started ${header.startedAt}`}
          className="mb-0"
          actions={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Resultados
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCsv}>
                  <FileText className="mr-2 h-4 w-4" />
                  CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Items</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Matched</p>
            <p className="text-2xl font-bold text-accent">{summary.matched}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Breaks</p>
            <p className="text-2xl font-bold text-destructive">{summary.breaks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Orphans</p>
            <p className="text-2xl font-bold text-warning">{summary.orphans}</p>
          </CardContent>
        </Card>
      </div>

      {/* Comparison */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">
              ETRM vs ERP — Side-by-Side ({rows.length.toLocaleString()} items)
            </CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoice, deal, counterparty..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card overflow-x-auto max-h-[70vh]">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Invoice #</TableHead>
                  <TableHead className="font-semibold">Subsidiary</TableHead>
                  <TableHead className="font-semibold">Counterparty</TableHead>
                  <TableHead className="font-semibold">Deal Type</TableHead>
                  <TableHead className="font-semibold">Deal ID</TableHead>
                  <TableHead className="font-semibold text-right">ETRM Amount</TableHead>
                  <TableHead className="font-semibold text-right">ERP Amount</TableHead>
                  <TableHead className="font-semibold text-right">Variance</TableHead>
                  <TableHead className="font-semibold">Discrepancy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      {run ? 'No matching rows' : `Run ${id} not found in seed dataset`}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => {
                    const variance = computeVariance(r.etrmAmount, r.erpAmount);
                    const isOrphan = r.etrmAmount === null || r.erpAmount === null;
                    const isBreak = !isOrphan && Math.abs(variance as number) >= 0.01;
                    const isMatch = !isOrphan && !isBreak;

                    return (
                      <TableRow key={r.id} className="data-table-row">
                        <TableCell className="font-mono text-sm">{r.invoiceNumber}</TableCell>
                        <TableCell>{r.subsidiary}</TableCell>
                        <TableCell>{r.counterparty}</TableCell>
                        <TableCell>
                          <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs">
                            {r.dealType}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{r.dealId}</TableCell>

                        <TableCell
                          className={cn(
                            'text-right font-mono',
                            r.etrmAmount === null
                              ? 'bg-warning/10 text-warning italic'
                              : isBreak
                                ? 'text-destructive'
                                : 'text-foreground',
                          )}
                        >
                          {r.etrmAmount === null ? 'N/A' : fmt(r.etrmAmount, r.etrmCurrency)}
                        </TableCell>

                        <TableCell
                          className={cn(
                            'text-right font-mono',
                            r.erpAmount === null
                              ? 'bg-warning/10 text-warning italic'
                              : isBreak
                                ? 'text-destructive'
                                : 'text-foreground',
                          )}
                        >
                          {r.erpAmount === null ? 'N/A' : fmt(r.erpAmount, r.erpCurrency)}
                        </TableCell>

                        <TableCell className="text-right font-mono">
                          {variance === null ? (
                            <StatusBadge variant="warning">Orphan</StatusBadge>
                          ) : isMatch ? (
                            <span className="inline-flex items-center gap-1 text-accent">
                              <Minus className="h-3.5 w-3.5" />
                              {fmt(0, r.etrmCurrency || r.erpCurrency)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-destructive">
                              {(variance as number) > 0 ? (
                                <TrendingUp className="h-3.5 w-3.5" />
                              ) : (
                                <TrendingDown className="h-3.5 w-3.5" />
                              )}
                              {fmt(Math.abs(variance as number), r.etrmCurrency || r.erpCurrency)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.discrepancy === 'None' ? '—' : r.discrepancy}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Tip: When a record exists in only one system, the populated side is used as the primary
            source and the missing side is marked as <span className="text-warning">N/A</span>.
            Discrepancies are highlighted in <span className="text-destructive">red</span>; matched
            rows in <span className="text-accent">green</span>.
          </p>
        </CardContent>
      </Card>

      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/reconciliations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reconciliations
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
