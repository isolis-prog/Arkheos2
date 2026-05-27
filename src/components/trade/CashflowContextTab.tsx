import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowUpRight, Banknote, Download, FileX2, RefreshCw, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTradeCashflows, type TradeCashflowRow } from '@/hooks/cashflows/useTradeCashflows';
import { useLatestFxRates, convertAmount } from '@/hooks/cashflows/useFxRates';
import { buildDrillUrl } from '@/pages/cashflows/drill/_drillScope';

interface CashflowContextTabProps {
  dealId: string;
}

const ALL_CURRENCIES = '__ALL__';
const BASE_CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CHF', 'JPY'];

function fmtAmount(amount: number | null, currency: string | null) {
  if (amount === null || Number.isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return amount.toLocaleString();
  }
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

export function CashflowContextTab({ dealId }: CashflowContextTabProps) {
  const queryClient = useQueryClient();
  const { data: rows, isLoading, isEmpty } = useTradeCashflows(dealId);
  const { data: fxRates } = useLatestFxRates();

  const [currencyFilter, setCurrencyFilter] = useState<string>(ALL_CURRENCIES);
  const [showBase, setShowBase] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['cashflow', 'by-trade', dealId] });
  };

  // Currencies discovered in the dataset (drives the selector options).
  const availableCurrencies = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.currencyOriginal || 'USD'));
    return Array.from(set).sort();
  }, [rows]);

  // Filtered rows respecting the currency selector.
  const filteredRows = useMemo(() => {
    if (currencyFilter === ALL_CURRENCIES) return rows;
    return rows.filter((r) => (r.currencyOriginal || 'USD') === currencyFilter);
  }, [rows, currencyFilter]);

  /**
   * Build a drill URL that mirrors the row's bucket/direction in the drill
   * breadcrumb scope, and tag the deal so the drill layout knows the user came
   * from a Trade Detail page (used to render the "Back to trade" affordance).
   */
  const buildRowDrillUrl = (row: TradeCashflowRow) => {
    const direction =
      row.direction === 'INFLOW'
        ? ('inflow' as const)
        : row.direction === 'OUTFLOW'
          ? ('outflow' as const)
          : undefined;
    const base = buildDrillUrl('/cashflows/buckets', {
      asOfDate: todayIso,
      bucket: row.bucket ?? undefined,
      flowDirection: direction,
    });
    const sep = base.includes('?') ? '&' : '?';
    const fromTrade = `fromTrade=${encodeURIComponent(dealId)}`;
    const focus = row.consolidatedCashflowId
      ? `&focus=${encodeURIComponent(row.consolidatedCashflowId)}`
      : '';
    return `${base}${sep}${fromTrade}${focus}`;
  };

  const openBucketsUrl = useMemo(
    () => `${buildDrillUrl('/cashflows/buckets', { asOfDate: todayIso })}&fromTrade=${encodeURIComponent(dealId)}`,
    [dealId, todayIso],
  );

  // Per-currency drill that pre-applies the currency filter so the user lands
  // on the matched breakdown for that specific currency.
  const buildCurrencyDrillUrl = (currency: string) => {
    const base = buildDrillUrl('/cashflows/buckets', { asOfDate: todayIso });
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}fromTrade=${encodeURIComponent(dealId)}&currency=${encodeURIComponent(currency)}`;
  };

  const totalsByCurrency = useMemo(() => {
    const map = new Map<string, { inflow: number; outflow: number }>();
    filteredRows.forEach((r) => {
      const ccy = r.currencyOriginal || 'USD';
      const amt = r.amountOriginal ?? r.amountBase ?? 0;
      const dir = (r.direction || '').toUpperCase();
      if (!map.has(ccy)) map.set(ccy, { inflow: 0, outflow: 0 });
      const entry = map.get(ccy)!;
      if (dir === 'INFLOW') entry.inflow += amt;
      else if (dir === 'OUTFLOW') entry.outflow += amt;
    });
    return Array.from(map.entries())
      .map(([currency, v]) => ({ currency, inflow: v.inflow, outflow: v.outflow, net: v.inflow - v.outflow }))
      .sort((a, b) => a.currency.localeCompare(b.currency));
  }, [filteredRows]);

  // Aggregate totals converted to the chosen base currency. Skips any row that
  // cannot be converted with the available FX rates and surfaces the count and
  // the affected currencies + missing rate pairs (used by the UX banner + CSV).
  const baseTotals = useMemo(() => {
    if (!showBase) return null;
    let inflow = 0;
    let outflow = 0;
    const unconvertedDetails: Array<{
      currency: string;
      inflow: number;
      outflow: number;
      net: number;
      missingPair: string;
    }> = [];
    totalsByCurrency.forEach((t) => {
      const inB = convertAmount(t.inflow, t.currency, baseCurrency, fxRates);
      const outB = convertAmount(t.outflow, t.currency, baseCurrency, fxRates);
      if (inB === null || outB === null) {
        unconvertedDetails.push({
          currency: t.currency,
          inflow: t.inflow,
          outflow: t.outflow,
          net: t.net,
          missingPair: `${t.currency} → ${baseCurrency}`,
        });
        return;
      }
      inflow += inB;
      outflow += outB;
    });
    return {
      inflow,
      outflow,
      net: inflow - outflow,
      unconverted: unconvertedDetails.length,
      unconvertedDetails,
    };
  }, [showBase, totalsByCurrency, baseCurrency, fxRates]);

  const downloadUnresolvedCsv = () => {
    if (!baseTotals || baseTotals.unconvertedDetails.length === 0) return;
    const header = ['currency', 'missing_pair', 'inflow', 'outflow', 'net', 'target_base', 'deal_id', 'generated_at'];
    const generatedAt = new Date().toISOString();
    const lines = [
      header.join(','),
      ...baseTotals.unconvertedDetails.map((r) =>
        [r.currency, r.missingPair, r.inflow, r.outflow, r.net, baseCurrency, dealId, generatedAt]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unresolved-fx-${dealId}-${baseCurrency}-${generatedAt.slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Banknote className="h-5 w-5" />
              Cashflow Context
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="h-8 w-[140px]" aria-label="Filter by currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CURRENCIES}>All currencies</SelectItem>
                  {availableCurrencies.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 rounded-md border px-2 py-1">
                <Switch id="show-base" checked={showBase} onCheckedChange={setShowBase} />
                <Label htmlFor="show-base" className="text-xs">
                  Base
                </Label>
                <Select value={baseCurrency} onValueChange={setBaseCurrency} disabled={!showBase}>
                  <SelectTrigger className="h-7 w-[80px] border-0 bg-transparent px-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BASE_CURRENCY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                disabled={isLoading}
                aria-label="Refresh linked cashflows"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to={openBucketsUrl}>
                  Open cashflow buckets
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-24 w-full" />
              <p className="text-xs text-muted-foreground">Loading consolidated cashflows linked to this trade…</p>
            </div>
          ) : totalsByCurrency.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cashflow totals to display.</p>
          ) : (
            <div className="space-y-3">
              {totalsByCurrency.map((t) => {
                const inB = showBase ? convertAmount(t.inflow, t.currency, baseCurrency, fxRates) : null;
                const outB = showBase ? convertAmount(t.outflow, t.currency, baseCurrency, fxRates) : null;
                const netB = showBase ? convertAmount(t.net, t.currency, baseCurrency, fxRates) : null;
                return (
                  <div key={t.currency} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t.currency}
                      </div>
                      <Button asChild variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        <Link to={buildCurrencyDrillUrl(t.currency)} aria-label={`Drill into ${t.currency} cashflows`}>
                          Drill {t.currency}
                          <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Stat
                        label="Inflow"
                        value={fmtAmount(t.inflow, t.currency)}
                        secondary={showBase ? fmtAmount(inB, baseCurrency) : undefined}
                        tone="positive"
                      />
                      <Stat
                        label="Outflow"
                        value={fmtAmount(t.outflow, t.currency)}
                        secondary={showBase ? fmtAmount(outB, baseCurrency) : undefined}
                        tone="negative"
                      />
                      <Stat
                        label="Net"
                        value={fmtAmount(t.net, t.currency)}
                        secondary={showBase ? fmtAmount(netB, baseCurrency) : undefined}
                      />
                    </div>
                  </div>
                );
              })}

              {showBase && baseTotals && totalsByCurrency.length > 1 && (
                <div className="space-y-2 rounded-lg border-2 border-dashed border-primary/30 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Total in {baseCurrency}
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Stat label="Inflow" value={fmtAmount(baseTotals.inflow, baseCurrency)} tone="positive" />
                    <Stat label="Outflow" value={fmtAmount(baseTotals.outflow, baseCurrency)} tone="negative" />
                    <Stat label="Net" value={fmtAmount(baseTotals.net, baseCurrency)} />
                  </div>
                </div>
              )}

              {showBase && baseTotals && baseTotals.unconverted > 0 && (
                <div
                  role="alert"
                  className="space-y-2 rounded-lg border border-warning/40 bg-warning/10 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-warning">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        FX rate missing
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {baseTotals.unconverted}{' '}
                        {baseTotals.unconverted === 1 ? 'currency was' : 'currencies were'} excluded from
                        the {baseCurrency} total because no direct or inverse FX rate is available.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadUnresolvedCsv}
                      className="h-7"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download CSV
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {baseTotals.unconvertedDetails.map((d) => (
                      <Badge
                        key={d.currency}
                        variant="outline"
                        className="border-warning/40 bg-background font-mono text-[10px] text-warning"
                        title={`Missing pair: ${d.missingPair}`}
                      >
                        {d.missingPair}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Linked cashflow events
            {currencyFilter !== ALL_CURRENCIES && (
              <Badge variant="outline" className="ml-2 text-xs">
                {currencyFilter}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-2/3" />
              <p className="text-xs text-muted-foreground">Fetching cashflow events…</p>
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div className="rounded-full bg-muted p-3 text-muted-foreground">
                <FileX2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No cashflow events linked yet</p>
                <p className="max-w-md text-xs text-muted-foreground">
                  Cashflow events appear here once invoices, settlements, or payments
                  reference this trade. They are usually published shortly after
                  ETRM/ERP capture and reconciliation.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Retry
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to={openBucketsUrl}>
                    <Sparkles className="mr-1 h-3 w-3" />
                    Browse all cashflows
                  </Link>
                </Button>
              </div>
            </div>
          ) : filteredRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No events match the {currencyFilter} filter.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Value date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  {showBase && <TableHead className="text-right">{baseCurrency}</TableHead>}
                  <TableHead>Bucket</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Drill</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => {
                  const amt = row.amountOriginal ?? row.amountBase;
                  const ccy = row.currencyOriginal || 'USD';
                  const inBase = showBase ? convertAmount(amt, ccy, baseCurrency, fxRates) : null;
                  return (
                    <TableRow key={row.eventId}>
                      <TableCell className="font-mono text-xs">{fmtDate(row.valueDate)}</TableCell>
                      <TableCell className="text-xs">{row.sourceSystem ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={row.direction === 'INFLOW' ? 'default' : 'secondary'}>
                          {row.direction ?? '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {fmtAmount(amt, ccy)}
                      </TableCell>
                      {showBase && (
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {fmtAmount(inBase, baseCurrency)}
                        </TableCell>
                      )}
                      <TableCell>
                        {row.bucket ? <Badge variant="outline">{row.bucket}</Badge> : '—'}
                      </TableCell>
                      <TableCell className="text-xs">{row.status ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        {row.consolidatedCashflowId || row.bucket ? (
                          <Button asChild variant="ghost" size="sm">
                            <Link to={buildRowDrillUrl(row)}>
                              View
                              <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  secondary,
  tone,
}: {
  label: string;
  value: string;
  secondary?: string;
  tone?: 'positive' | 'negative';
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={`mt-1 font-mono text-lg ${
          tone === 'positive' ? 'text-emerald-600' : tone === 'negative' ? 'text-destructive' : ''
        }`}
      >
        {value}
      </div>
      {secondary && (
        <div className="mt-0.5 font-mono text-xs text-muted-foreground">≈ {secondary}</div>
      )}
    </div>
  );
}
