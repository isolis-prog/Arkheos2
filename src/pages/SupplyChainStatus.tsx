import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricCard } from '@/components/ui/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, AlertTriangle, XCircle, Activity, 
  ArrowRightLeft, Boxes, AlertOctagon, Ruler, History 
} from 'lucide-react';
import { useSupplyChainEvents } from '@/hooks/useSupplyChainEvents';
import type { SupplyChainTradeStatus } from '@/hooks/useSupplyChainEvents';

const healthIcon = (h: 'green' | 'amber' | 'red') => {
  if (h === 'green') return <CheckCircle className="h-4 w-4 text-success" />;
  if (h === 'amber') return <AlertTriangle className="h-4 w-4 text-warning" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
};

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    EXECUTED: 'bg-success/10 text-success border-success/30',
    DELIVERED: 'bg-success/10 text-success border-success/30',
    COMPLETE: 'bg-success/10 text-success border-success/30',
    FINAL: 'bg-success/10 text-success border-success/30',
    PAID: 'bg-success/10 text-success border-success/30',
    ISSUED: 'bg-primary/10 text-primary border-primary/30',
    CONFIRMED: 'bg-primary/10 text-primary border-primary/30',
    IN_TRANSIT: 'bg-primary/10 text-primary border-primary/30',
    POSTED: 'bg-primary/10 text-primary border-primary/30',
    SCHEDULED: 'bg-primary/10 text-primary border-primary/30',
    PROVISIONAL: 'bg-warning/10 text-warning border-warning/30',
    PENDING: 'bg-muted text-muted-foreground border-border',
    DRAFT: 'bg-muted text-muted-foreground border-border',
    FORECAST: 'bg-muted text-muted-foreground border-border',
    NOT_STARTED: 'bg-muted text-muted-foreground border-border',
    NOT_ISSUED: 'bg-muted text-muted-foreground border-border',
    AWAITING: 'bg-muted text-muted-foreground border-border',
    'N/A': 'bg-muted text-muted-foreground border-border',
    PARTIAL: 'bg-warning/10 text-warning border-warning/30',
    CANCELLED: 'bg-destructive/10 text-destructive border-destructive/30',
    FAILED: 'bg-destructive/10 text-destructive border-destructive/30',
  };
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${colors[status] || ''}`}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
};

const fmt = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(0)}K`;
  return `$${abs.toFixed(0)}`;
};

const SupplyChainStatus = () => {
  const { tradeStatuses, cashflowLinks, inventoryLinks, volumeDiscrepancies, measurementVariances, eventLog, kpis } = useSupplyChainEvents();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supply Chain Status"
        description="End-to-end visibility of physical trade lifecycle: nomination → scheduling → delivery → measurement → invoice → cashflow"
      />

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Active Trades" value={kpis.totalTrades} icon={Activity} subtitle={`${kpis.greenTrades} complete`} />
        <MetricCard title="On Track" value={kpis.greenTrades} icon={CheckCircle} subtitle="All steps complete" variant="success" />
        <MetricCard title="In Progress" value={kpis.amberTrades} icon={AlertTriangle} subtitle="Steps pending" variant="warning" />
        <MetricCard title="Blocked" value={kpis.redTrades} icon={XCircle} subtitle="Action required" variant={kpis.redTrades > 0 ? 'error' : 'default'} />
        <MetricCard title="Domain Events" value={kpis.totalEvents} icon={History} subtitle="Auto-triggered today" />
      </div>

      <Tabs defaultValue="trade-status" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="trade-status">Trade Status</TabsTrigger>
          <TabsTrigger value="cashflow-updates">Sched → Cashflow</TabsTrigger>
          <TabsTrigger value="inventory-updates">Sched → Inventory</TabsTrigger>
          <TabsTrigger value="discrepancies">Volume Discrepancies</TabsTrigger>
          <TabsTrigger value="measurement-var">Meas → Cashflow</TabsTrigger>
          <TabsTrigger value="event-log">Event Log</TabsTrigger>
        </TabsList>

        {/* Trade Status Grid */}
        <TabsContent value="trade-status">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Physical Trade Lifecycle Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Trade ID</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Nomination</TableHead>
                    <TableHead>Scheduling</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Measurement</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Cashflow</TableHead>
                    <TableHead>Blocked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradeStatuses.map((t) => (
                    <TableRow key={t.tradeId}>
                      <TableCell>{healthIcon(t.overallHealth)}</TableCell>
                      <TableCell className="font-medium text-sm">{t.tradeId}</TableCell>
                      <TableCell className="text-sm">{t.commodity}</TableCell>
                      <TableCell>{statusBadge(t.nominationStatus)}</TableCell>
                      <TableCell>{statusBadge(t.schedulingStatus)}</TableCell>
                      <TableCell>{statusBadge(t.deliveryStatus)}</TableCell>
                      <TableCell>{statusBadge(t.measurementStatus)}</TableCell>
                      <TableCell>{statusBadge(t.invoiceStatus)}</TableCell>
                      <TableCell>{statusBadge(t.cashflowStatus)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                        {t.blockedStep || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduling → Cashflows */}
        <TabsContent value="cashflow-updates">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Nomination → Cashflow Auto-Updates
                </CardTitle>
                <Badge variant="outline">{cashflowLinks.filter(l => l.updated).length} updated</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomination</TableHead>
                    <TableHead>Trade</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead className="text-right">Nom Qty</TableHead>
                    <TableHead className="text-right">Old Cashflow</TableHead>
                    <TableHead className="text-right">New Cashflow</TableHead>
                    <TableHead>CF Status</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashflowLinks.map((l) => (
                    <TableRow key={l.nominationId}>
                      <TableCell className="font-medium text-sm">{l.nominationId}</TableCell>
                      <TableCell className="text-sm">{l.dealId}</TableCell>
                      <TableCell className="text-sm">{l.commodity}</TableCell>
                      <TableCell className="text-right text-sm">{l.nominatedQty.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(l.oldCashflowAmount)}</TableCell>
                      <TableCell className={`text-right text-sm font-semibold ${l.updated ? 'text-primary' : ''}`}>
                        {fmt(l.newCashflowAmount)}
                      </TableCell>
                      <TableCell>{statusBadge(l.cashflowStatus)}</TableCell>
                      <TableCell>
                        {l.updated ? (
                          <Badge className="text-xs bg-success/10 text-success border-success/30" variant="outline">✓ Auto</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Skipped</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3">
                Only cashflows with status FORECAST or CONFIRMED are updated. POSTED and PAID cashflows are not modified.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduling → Inventory */}
        <TabsContent value="inventory-updates">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Boxes className="h-5 w-5" />
                Nomination → Inventory Movement Creation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomination</TableHead>
                    <TableHead>Trade</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Executed Qty</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Movement ID</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryLinks.map((l) => (
                    <TableRow key={l.nominationId}>
                      <TableCell className="font-medium text-sm">{l.nominationId}</TableCell>
                      <TableCell className="text-sm">{l.dealId}</TableCell>
                      <TableCell className="text-sm">{l.commodity}</TableCell>
                      <TableCell className="text-sm">{l.location}</TableCell>
                      <TableCell className="text-right text-sm">{l.executedQty.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${l.movementType === 'IN' ? 'text-success border-success/30' : 'text-destructive border-destructive/30'}`}>
                          {l.movementType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-mono">{l.inventoryMovementId}</TableCell>
                      <TableCell>
                        <Badge className="text-xs bg-success/10 text-success border-success/30" variant="outline">Created</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Volume Discrepancies */}
        <TabsContent value="discrepancies">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertOctagon className="h-5 w-5" />
                Scheduling Volume Discrepancies → Exceptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomination</TableHead>
                    <TableHead>Trade</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead className="text-right">Nominated</TableHead>
                    <TableHead className="text-right">Executed</TableHead>
                    <TableHead className="text-right">Difference</TableHead>
                    <TableHead className="text-right">Diff %</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Exception</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {volumeDiscrepancies.map((d) => (
                    <TableRow key={d.nominationId}>
                      <TableCell className="font-medium text-sm">{d.nominationId}</TableCell>
                      <TableCell className="text-sm">{d.dealId}</TableCell>
                      <TableCell className="text-sm">{d.commodity}</TableCell>
                      <TableCell className="text-right text-sm">{d.nominatedQty.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right text-sm">{d.executedQty.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className={`text-right text-sm font-semibold ${d.difference >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {d.difference >= 0 ? '+' : ''}{d.difference.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right text-sm">{d.differencePct.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${
                          d.severity === 'HIGH' ? 'text-destructive border-destructive/30' :
                          d.severity === 'MEDIUM' ? 'text-warning border-warning/30' : ''
                        }`}>
                          {d.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {d.exceptionCreated ? (
                          <Badge className="text-xs bg-warning/10 text-warning border-warning/30" variant="outline">Created</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Within tolerance</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Measurement → Cashflow */}
        <TabsContent value="measurement-var">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Measurement → Cashflow Variance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Measurement</TableHead>
                    <TableHead>Trade</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead className="text-right">Measured Qty</TableHead>
                    <TableHead className="text-right">CF Basis Qty</TableHead>
                    <TableHead className="text-right">Delta</TableHead>
                    <TableHead className="text-right">Delta %</TableHead>
                    <TableHead>CF Flagged</TableHead>
                    <TableHead>Exception</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {measurementVariances.map((v) => (
                    <TableRow key={v.measurementId}>
                      <TableCell className="font-medium text-sm">{v.measurementId}</TableCell>
                      <TableCell className="text-sm">{v.dealId}</TableCell>
                      <TableCell className="text-sm">{v.commodity}</TableCell>
                      <TableCell className="text-right text-sm">{v.measuredQty.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right text-sm">{v.cashflowBasisQty.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className={`text-right text-sm font-semibold ${v.delta >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {v.delta >= 0 ? '+' : ''}{v.delta.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right text-sm">{v.deltaPct.toFixed(2)}%</TableCell>
                      <TableCell>
                        {v.cashflowFlagged ? (
                          <Badge variant="outline" className="text-xs text-warning border-warning/30">ADJUSTMENT_PENDING</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {v.exceptionCreated ? (
                          <Badge className="text-xs bg-warning/10 text-warning border-warning/30" variant="outline">Created</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Within tolerance</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Event Log */}
        <TabsContent value="event-log">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Domain Event Audit Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Trade</TableHead>
                    <TableHead className="text-right">Before</TableHead>
                    <TableHead className="text-right">After</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventLog.map((e, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm text-muted-foreground">
                        {e.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {e.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{e.tradeId}</TableCell>
                      <TableCell className="text-right text-sm">
                        {e.beforeValue !== undefined ? e.beforeValue.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {e.afterValue !== undefined ? e.afterValue.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {JSON.stringify(e.details)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupplyChainStatus;
