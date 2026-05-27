import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, Eye } from 'lucide-react';
import { ConsolidatedCashflow, CashflowEvent } from '@/hooks/useCashflows';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

interface CashflowRegisterProps {
  consolidated: ConsolidatedCashflow[];
  events: CashflowEvent[];
  isLoading: boolean;
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const statusVariant = (s: string) => {
  switch (s) {
    case 'PAID_RECEIVED': return 'default';
    case 'CONFIRMED': return 'secondary';
    case 'POSTED': return 'outline';
    case 'FORECAST': return 'destructive';
    case 'CANCELLED': return 'secondary';
    default: return 'secondary';
  }
};

export const CashflowRegister = ({ consolidated, events, isLoading }: CashflowRegisterProps) => {
  const [search, setSearch] = useState('');
  const [dirFilter, setDirFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confidenceMin, setConfidenceMin] = useState(0);
  const [lineageItem, setLineageItem] = useState<ConsolidatedCashflow | null>(null);

  const filtered = consolidated.filter(c => {
    if (search && !c.counterparty.toLowerCase().includes(search.toLowerCase()) && !c.reference?.toLowerCase().includes(search.toLowerCase())) return false;
    if (dirFilter !== 'all' && c.direction !== dirFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (c.confidence_score < confidenceMin) return false;
    return true;
  });

  const lineageEvents = lineageItem
    ? events.filter(e =>
        e.counterparty === lineageItem.counterparty &&
        e.direction === lineageItem.direction &&
        e.currency_original === lineageItem.currency_original
      )
    : [];

  const handleExport = () => {
    const headers = ['Value Date', 'Counterparty', 'Direction', 'Amount (Orig)', 'Currency', 'Amount (Base)', 'Status', 'Confidence', 'Source', 'Reference'];
    const rows = filtered.map(c => [
      c.value_date, c.counterparty, c.direction,
      c.amount_original, c.currency_original,
      c.amount_base || '', c.status, c.confidence_score,
      c.preferred_source, c.reference || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashflow-register-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <TableSkeleton rows={10} columns={8} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Counterparty or reference..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="w-[140px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Direction</label>
              <Select value={dirFilter} onValueChange={setDirFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="INFLOW">Inflow</SelectItem>
                  <SelectItem value="OUTFLOW">Outflow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[160px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="FORECAST">Forecast</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="POSTED">Posted</SelectItem>
                  <SelectItem value="PAID_RECEIVED">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Min Confidence: {confidenceMin}%</label>
              <Slider value={[confidenceMin]} onValueChange={v => setConfidenceMin(v[0])} max={100} step={5} />
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Value Date</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead className="text-right">Amount (Orig)</TableHead>
                <TableHead>CCY</TableHead>
                <TableHead className="text-right">Amount (Base)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
              ) : filtered.map(c => (
                <TableRow key={c.id} className="data-table-row">
                  <TableCell className="code-text">{format(new Date(c.value_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="font-medium">{c.counterparty}</TableCell>
                  <TableCell>
                    <Badge variant={c.direction === 'INFLOW' ? 'default' : 'destructive'} className="text-xs">
                      {c.direction}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right ${c.direction === 'INFLOW' ? 'amount-positive' : 'amount-negative'}`}>
                    {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(c.amount_original)}
                  </TableCell>
                  <TableCell className="code-text">{c.currency_original}</TableCell>
                  <TableCell className="text-right code-text">{c.amount_base ? fmt(c.amount_base) : '-'}</TableCell>
                  <TableCell><Badge variant={statusVariant(c.status)} className="text-xs">{c.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${c.confidence_score}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{c.confidence_score}%</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{c.preferred_source}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setLineageItem(c)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lineage Dialog */}
      <Dialog open={!!lineageItem} onOpenChange={() => setLineageItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Source Lineage — {lineageItem?.counterparty}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Consolidated Amount:</span> <span className="font-medium">{lineageItem && fmt(lineageItem.amount_base || lineageItem.amount_original)}</span></div>
              <div><span className="text-muted-foreground">Preferred Source:</span> <Badge variant="outline">{lineageItem?.preferred_source}</Badge></div>
              <div><span className="text-muted-foreground">Value Date:</span> <span className="code-text">{lineageItem && format(new Date(lineageItem.value_date), 'MMM d, yyyy')}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <Badge variant={statusVariant(lineageItem?.status || '')}>{lineageItem?.status}</Badge></div>
            </div>
            <div className="border-t pt-3">
              <h4 className="text-sm font-semibold mb-2">Source Events</h4>
              {lineageEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No linked source events found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>System</TableHead><TableHead>Type</TableHead><TableHead>Ref</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineageEvents.map(e => (
                      <TableRow key={e.id}>
                        <TableCell><Badge variant="outline" className="text-xs">{e.source_system}</Badge></TableCell>
                        <TableCell className="text-sm">{e.source_object_type}</TableCell>
                        <TableCell className="code-text text-sm">{e.source_object_id}</TableCell>
                        <TableCell className="text-right code-text">{new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(e.amount_original)} {e.currency_original}</TableCell>
                        <TableCell><Badge variant={statusVariant(e.status)} className="text-xs">{e.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
