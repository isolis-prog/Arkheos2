 import { useMemo } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
 import { format, parseISO } from 'date-fns';
 import { cn } from '@/lib/utils';
 import { useState } from 'react';
 import type { SnapshotEntry } from '@/hooks/useAuditExplainability';
 
 interface SnapshotHistoryProps {
   snapshots: SnapshotEntry[];
 }
 
 const metricColors: Record<string, string> = {
   'Match Rate': '#3b82f6',
   'Amount at Risk': '#ef4444',
   'Open Exceptions': '#f59e0b',
   'Net FX Exposure': '#10b981',
   'Total P&L': '#8b5cf6',
   'Overall Quality Score': '#06b6d4',
 };
 
 export function SnapshotHistory({ snapshots }: SnapshotHistoryProps) {
   const [selectedMetric, setSelectedMetric] = useState<string>('all');
   
   // Get unique metric names
   const metricNames = useMemo(() => {
     return [...new Set(snapshots.map(s => s.metricName))];
   }, [snapshots]);
 
   // Prepare chart data
   const chartData = useMemo(() => {
     const byDate: Record<string, Record<string, number>> = {};
     
     snapshots.forEach(snap => {
       const date = format(parseISO(snap.timestamp), 'MMM dd');
       if (!byDate[date]) byDate[date] = {};
       byDate[date][snap.metricName] = snap.value;
     });
 
     return Object.entries(byDate)
       .map(([date, metrics]) => ({ date, ...metrics }))
       .slice(-14)
       .reverse();
   }, [snapshots]);
 
   // Filter snapshots for table
   const filteredSnapshots = useMemo(() => {
     if (selectedMetric === 'all') return snapshots.slice(0, 50);
     return snapshots.filter(s => s.metricName === selectedMetric).slice(0, 50);
   }, [snapshots, selectedMetric]);
 
   const visibleMetrics = selectedMetric === 'all' 
     ? metricNames.slice(0, 6) 
     : [selectedMetric];
 
   return (
     <div className="space-y-6">
       {/* Trend Chart */}
       <Card>
         <CardHeader className="flex-row items-center justify-between pb-4">
           <CardTitle className="text-base">Metric Trends (14 Days)</CardTitle>
           <Select value={selectedMetric} onValueChange={setSelectedMetric}>
             <SelectTrigger className="w-[200px]">
               <SelectValue placeholder="Select metric" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Metrics</SelectItem>
               {metricNames.map(name => (
                 <SelectItem key={name} value={name}>{name}</SelectItem>
               ))}
             </SelectContent>
           </Select>
         </CardHeader>
         <CardContent>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                 <XAxis 
                   dataKey="date" 
                   tick={{ fontSize: 11 }}
                   tickLine={false}
                   axisLine={false}
                 />
                 <YAxis 
                   tick={{ fontSize: 11 }}
                   tickLine={false}
                   axisLine={false}
                 />
                 <Tooltip 
                   contentStyle={{ 
                     backgroundColor: 'hsl(var(--card))',
                     border: '1px solid hsl(var(--border))',
                     borderRadius: '8px',
                   }}
                 />
                 <Legend />
                 {visibleMetrics.map(metric => (
                   <Line 
                     key={metric}
                     type="monotone" 
                     dataKey={metric}
                     stroke={metricColors[metric] || '#6366f1'}
                     strokeWidth={2}
                     dot={false}
                     name={metric}
                   />
                 ))}
               </LineChart>
             </ResponsiveContainer>
           </div>
         </CardContent>
       </Card>
 
       {/* Snapshot Table */}
       <Card>
         <CardHeader>
           <CardTitle className="text-base flex items-center gap-2">
             <Clock className="h-4 w-4" />
             Snapshot Log
             <span className="text-sm font-normal text-muted-foreground">
               ({filteredSnapshots.length} entries)
             </span>
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="rounded-lg border">
             <Table>
               <TableHeader>
                 <TableRow className="bg-muted/50">
                   <TableHead>Timestamp</TableHead>
                   <TableHead>Metric</TableHead>
                   <TableHead>Module</TableHead>
                   <TableHead className="text-right">Value</TableHead>
                   <TableHead className="text-right">Delta</TableHead>
                   <TableHead>Triggered By</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredSnapshots.slice(0, 20).map((snap) => (
                   <TableRow key={snap.id}>
                     <TableCell className="text-sm text-muted-foreground">
                       {format(parseISO(snap.timestamp), 'MMM dd, HH:mm')}
                     </TableCell>
                     <TableCell className="font-medium">{snap.metricName}</TableCell>
                     <TableCell>
                       <Badge variant="outline" className="text-xs">{snap.module}</Badge>
                     </TableCell>
                     <TableCell className="text-right font-mono">
                       {snap.value.toLocaleString()}
                     </TableCell>
                     <TableCell className="text-right">
                       <div className={cn(
                         'flex items-center justify-end gap-1 text-sm',
                         snap.delta >= 0 ? 'text-success' : 'text-destructive'
                       )}>
                         {snap.delta >= 0 ? (
                           <TrendingUp className="h-3 w-3" />
                         ) : (
                           <TrendingDown className="h-3 w-3" />
                         )}
                         {Math.abs(snap.delta)}%
                       </div>
                     </TableCell>
                     <TableCell>
                       <Badge variant={snap.triggeredBy === 'Live' ? 'default' : 'secondary'}>
                         {snap.triggeredBy}
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
 }