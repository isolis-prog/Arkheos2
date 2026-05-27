import { Crosshair } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { usePositionKeeper } from '@/hooks/usePositionRisk';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricCard } from '@/components/ui/metric-card';

const PositionKeeper = () => {
  const {
    positions, filters, setFilters, isLoading,
    commodityGroups, desks, counterparties, positionTypes,
  } = usePositionKeeper();

  const totalLong = positions.reduce((s, p) => s + p.longQty, 0);
  const totalShort = positions.reduce((s, p) => s + p.shortQty, 0);
  const totalNet = positions.reduce((s, p) => s + p.netQty, 0);

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Position Keeper"
        description="Real-time net position per commodity, location, desk, counterparty, and delivery period"
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total Positions" value={positions.length} />
        <MetricCard title="Total Long" value={fmt(totalLong)} className="text-emerald-600" />
        <MetricCard title="Total Short" value={fmt(totalShort)} className="text-red-500" />
        <MetricCard
          title="Total Net"
          value={fmt(totalNet)}
          className={totalNet >= 0 ? 'text-emerald-600' : 'text-red-500'}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crosshair className="h-5 w-5" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Commodity</label>
              <Select value={filters.commodity} onValueChange={(v) => setFilters({ ...filters, commodity: v })}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Commodities</SelectItem>
                  {commodityGroups.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Desk</label>
              <Select value={filters.desk} onValueChange={(v) => setFilters({ ...filters, desk: v })}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Desks</SelectItem>
                  {desks.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Counterparty</label>
              <Select value={filters.counterparty} onValueChange={(v) => setFilters({ ...filters, counterparty: v })}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counterparties</SelectItem>
                  {counterparties.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Position Type</label>
              <Select value={filters.positionType} onValueChange={(v) => setFilters({ ...filters, positionType: v })}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {positionTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Tabs value={filters.viewMode} onValueChange={(v) => setFilters({ ...filters, viewMode: v as 'gross' | 'net' })}>
              <TabsList>
                <TabsTrigger value="net">Net</TabsTrigger>
                <TabsTrigger value="gross">Gross</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Positions Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Hub / Location</TableHead>
                  <TableHead>Desk</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead className="text-right">Long</TableHead>
                  <TableHead className="text-right">Short</TableHead>
                  <TableHead className="text-right">Net Position</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Delivery Period</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.slice(0, 50).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.commodityGroup}</TableCell>
                    <TableCell>{p.location}</TableCell>
                    <TableCell>{p.desk}</TableCell>
                    <TableCell>{p.counterparty}</TableCell>
                    <TableCell className="text-right text-emerald-600">{fmt(p.longQty)}</TableCell>
                    <TableCell className="text-right text-red-500">{fmt(p.shortQty)}</TableCell>
                    <TableCell className={`text-right font-semibold ${p.netQty > 0 ? 'text-emerald-600' : p.netQty < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {fmt(p.netQty)}
                    </TableCell>
                    <TableCell>{p.unit}</TableCell>
                    <TableCell className="text-xs">{p.deliveryPeriodStart} → {p.deliveryPeriodEnd}</TableCell>
                    <TableCell>
                      <Badge variant={p.positionType === 'PHYSICAL' ? 'default' : p.positionType === 'FINANCIAL' ? 'secondary' : 'outline'}>
                        {p.positionType}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {positions.length > 50 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">Showing 50 of {positions.length} positions</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PositionKeeper;
