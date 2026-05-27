import { TrendingUp, Info } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MetricCard } from '@/components/ui/metric-card';
import { useMtMEngine } from '@/hooks/usePositionRisk';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const MarkToMarket = () => {
  const {
    positions, totalUnrealizedPnl, pnlByCommodity, sparklines,
    filters, setFilters, commodityGroups, desks,
  } = useMtMEngine();

  const fmtUsd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mark-to-Market Engine"
        description="Value open positions against current market prices to show unrealized P&L"
      />

      {/* Disclaimer */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Unrealized P&L — Open Positions Only.</strong> For realized P&L see{' '}
          <a href="/pnl-attribution" className="underline text-primary">P&L Attribution module</a>.
        </AlertDescription>
      </Alert>

      {/* Grand Total + Commodity Summary */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="md:col-span-1 border-2 border-primary/20">
          <CardContent className="pt-6 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Unrealized P&L</p>
            <p className={`text-2xl font-bold mt-1 ${totalUnrealizedPnl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {fmtUsd(totalUnrealizedPnl)}
            </p>
          </CardContent>
        </Card>
        {pnlByCommodity.map((c) => (
          <MetricCard
            key={c.commodity}
            title={c.commodity}
            value={fmtUsd(c.pnl)}
            className={c.pnl >= 0 ? 'text-emerald-600' : 'text-red-500'}
          />
        ))}
      </div>

      {/* Sparklines */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(sparklines).map(([group, data]) => (
          <Card key={group}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{group} — 30d MtM</CardTitle>
            </CardHeader>
            <CardContent className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id={`grad-${group}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area dataKey="pnl" stroke="hsl(var(--primary))" fill={`url(#grad-${group})`} strokeWidth={1.5} dot={false} />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip formatter={(v: number) => fmtUsd(v)} labelFormatter={() => ''} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={filters.commodity} onValueChange={(v) => setFilters({ ...filters, commodity: v })}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Commodity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Commodities</SelectItem>
                {commodityGroups.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.desk} onValueChange={(v) => setFilters({ ...filters, desk: v })}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Desk" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Desks</SelectItem>
                {desks.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.priceSource} onValueChange={(v) => setFilters({ ...filters, priceSource: v })}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Price Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="Valuation Curve">Valuation Curve</SelectItem>
                <SelectItem value="Manual Override">Manual Override</SelectItem>
                <SelectItem value="live" disabled>Live Market Feed — Coming Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* MtM Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Desk</TableHead>
                  <TableHead className="text-right">Net Qty</TableHead>
                  <TableHead className="text-right">Entry Price</TableHead>
                  <TableHead className="text-right">Market Price</TableHead>
                  <TableHead className="text-right">Δ Price</TableHead>
                  <TableHead className="text-right">Unrealized P&L / Unit</TableHead>
                  <TableHead className="text-right">Total Unrealized P&L</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.slice(0, 50).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.commodityGroup}</TableCell>
                    <TableCell>{p.location}</TableCell>
                    <TableCell>{p.desk}</TableCell>
                    <TableCell className={`text-right ${p.netQty >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(p.netQty)}</TableCell>
                    <TableCell className="text-right">{fmt(p.entryPrice)}</TableCell>
                    <TableCell className="text-right">{fmt(p.marketPrice)}</TableCell>
                    <TableCell className={`text-right ${p.priceDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(p.priceDelta)}</TableCell>
                    <TableCell className={`text-right ${p.unrealizedPnlPerUnit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(p.unrealizedPnlPerUnit)}</TableCell>
                    <TableCell className={`text-right font-semibold ${p.totalUnrealizedPnl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtUsd(p.totalUnrealizedPnl)}</TableCell>
                    <TableCell>
                      <Badge variant={p.priceSource === 'Manual Override' ? 'outline' : 'secondary'} className="text-xs">
                        {p.priceSource}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarkToMarket;
