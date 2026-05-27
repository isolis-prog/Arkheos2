 import { useState } from 'react';
 import { ChevronRight, Database, ArrowRight, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { cn } from '@/lib/utils';
 import { format, parseISO } from 'date-fns';
 import type { KPIMetric } from '@/hooks/useAuditExplainability';
 import { useMetricDrillDown } from '@/hooks/useAuditExplainability';
 
 interface KPIDrillDownProps {
   kpis: KPIMetric[];
 }
 
 const moduleColors: Record<string, string> = {
   Dashboard: 'bg-blue-500/10 text-blue-600 border-blue-200',
   'FX Analytics': 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
   'PnL Attribution': 'bg-purple-500/10 text-purple-600 border-purple-200',
   Valuation: 'bg-amber-500/10 text-amber-600 border-amber-200',
   'Close Readiness': 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
   'Data Quality': 'bg-rose-500/10 text-rose-600 border-rose-200',
 };
 
 function formatValue(value: number | string, unit: string): string {
   if (typeof value === 'string') return value;
   if (unit === '%') return `${value}%`;
   if (unit === 'USD') return `$${value.toLocaleString()}`;
   if (unit === 'count') return value.toLocaleString();
   return value.toString();
 }
 
 function DrillDownDialog({ metric }: { metric: KPIMetric }) {
   const { data, isLoading } = useMetricDrillDown(metric.id);
 
   return (
     <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
       <DialogHeader>
         <DialogTitle className="flex items-center gap-2">
           <span>Drill Down: {metric.name}</span>
           <Badge variant="outline" className={cn(moduleColors[metric.module])}>
             {metric.module}
           </Badge>
         </DialogTitle>
       </DialogHeader>
 
       <div className="flex-1 overflow-auto">
         <Tabs defaultValue="breakdown" className="space-y-4">
           <TabsList>
             <TabsTrigger value="breakdown">By Dimension</TabsTrigger>
             <TabsTrigger value="events">Economic Events</TabsTrigger>
           </TabsList>
 
           <TabsContent value="breakdown" className="space-y-4">
             <div className="text-sm text-muted-foreground mb-4">
               Breakdown of <strong>{metric.name}</strong> = {formatValue(metric.currentValue, metric.unit)} across dimensions
             </div>
             
             {isLoading ? (
               <div className="text-center py-8 text-muted-foreground">Loading...</div>
             ) : (
               <Table>
                 <TableHeader>
                   <TableRow className="bg-muted/50">
                     <TableHead>Dimension</TableHead>
                     <TableHead className="text-right">Value</TableHead>
                     <TableHead className="text-right">% of Total</TableHead>
                     <TableHead className="text-right">Records</TableHead>
                     <TableHead>Source</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {data?.breakdown.map((row) => (
                     <TableRow key={row.id}>
                       <TableCell className="font-medium">{row.dimension}</TableCell>
                       <TableCell className="text-right">${row.value.toLocaleString()}</TableCell>
                       <TableCell className="text-right">
                         <div className="flex items-center justify-end gap-2">
                           <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-primary" 
                               style={{ width: `${row.percentage}%` }}
                             />
                           </div>
                           <span>{row.percentage}%</span>
                         </div>
                       </TableCell>
                       <TableCell className="text-right">{row.recordCount}</TableCell>
                       <TableCell>
                         <Badge variant="outline">{row.sourceSystem}</Badge>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             )}
           </TabsContent>
 
           <TabsContent value="events" className="space-y-4">
             <div className="text-sm text-muted-foreground mb-4">
               Underlying economic events contributing to this metric
             </div>
             
             {isLoading ? (
               <div className="text-center py-8 text-muted-foreground">Loading...</div>
             ) : (
               <Table>
                 <TableHeader>
                   <TableRow className="bg-muted/50">
                     <TableHead>Deal ID</TableHead>
                     <TableHead>Type</TableHead>
                     <TableHead>Entity</TableHead>
                     <TableHead className="text-right">Amount</TableHead>
                     <TableHead>Date</TableHead>
                     <TableHead>Source</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {data?.events.slice(0, 15).map((event) => (
                     <TableRow key={event.id}>
                       <TableCell>
                         <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{event.dealId}</code>
                       </TableCell>
                       <TableCell>{event.eventType}</TableCell>
                       <TableCell>{event.legalEntity}</TableCell>
                       <TableCell className="text-right font-medium">
                         {event.currency} {event.amount.toLocaleString()}
                       </TableCell>
                       <TableCell className="text-sm text-muted-foreground">
                         {format(parseISO(event.date), 'MMM dd, yyyy')}
                       </TableCell>
                       <TableCell>
                         <Badge variant="outline">{event.sourceSystem}</Badge>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             )}
           </TabsContent>
         </Tabs>
       </div>
     </DialogContent>
   );
 }
 
 export function KPIDrillDown({ kpis }: KPIDrillDownProps) {
   // Group KPIs by module
   const grouped = kpis.reduce((acc, kpi) => {
     if (!acc[kpi.module]) acc[kpi.module] = [];
     acc[kpi.module].push(kpi);
     return acc;
   }, {} as Record<string, KPIMetric[]>);
 
   return (
     <div className="space-y-6">
       {Object.entries(grouped).map(([module, moduleKpis]) => (
         <Card key={module}>
           <CardHeader className="pb-3">
             <CardTitle className="text-base flex items-center gap-2">
               <Badge variant="outline" className={cn(moduleColors[module])}>
                 {module}
               </Badge>
               <span className="text-muted-foreground font-normal text-sm">
                 {moduleKpis.length} metrics
               </span>
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
               {moduleKpis.map((kpi) => (
                 <Dialog key={kpi.id}>
                   <DialogTrigger asChild>
                     <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors group">
                       <div className="flex items-start justify-between">
                         <div className="space-y-1">
                           <p className="text-sm font-medium text-muted-foreground">{kpi.name}</p>
                           <p className="text-xl font-bold">{formatValue(kpi.currentValue, kpi.unit)}</p>
                         </div>
                         <div className="flex flex-col items-end gap-1">
                           <div className={cn(
                             'flex items-center gap-0.5 text-xs font-medium',
                             kpi.change >= 0 ? 'text-success' : 'text-destructive'
                           )}>
                             {kpi.change >= 0 ? (
                               <TrendingUp className="h-3 w-3" />
                             ) : (
                               <TrendingDown className="h-3 w-3" />
                             )}
                             {Math.abs(kpi.change)}%
                           </div>
                           <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                         </div>
                       </div>
                       <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                         <Database className="h-3 w-3" />
                         <span>{kpi.sourceCount.toLocaleString()} records</span>
                       </div>
                     </div>
                   </DialogTrigger>
                   <DrillDownDialog metric={kpi} />
                 </Dialog>
               ))}
             </div>
           </CardContent>
         </Card>
       ))}
     </div>
   );
 }