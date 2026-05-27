 import { useMemo } from 'react';
 import {
   BarChart,
   Bar,
   XAxis,
   YAxis,
   Tooltip,
   ResponsiveContainer,
   Cell,
   ReferenceLine,
 } from 'recharts';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Skeleton } from '@/components/ui/skeleton';
 import { PnLSummary } from '@/hooks/usePnLAttribution';
 
 interface PnLBridgeProps {
   summary: PnLSummary;
   previousTotal: number;
   isLoading: boolean;
 }
 
 export const PnLBridge = ({ summary, previousTotal, isLoading }: PnLBridgeProps) => {
   const formatCurrency = (value: number) => {
     const absValue = Math.abs(value);
     if (absValue >= 1000000) {
       return `${value >= 0 ? '' : '-'}$${(absValue / 1000000).toFixed(1)}M`;
     }
     if (absValue >= 1000) {
       return `${value >= 0 ? '' : '-'}$${(absValue / 1000).toFixed(0)}K`;
     }
     return `${value >= 0 ? '' : '-'}$${absValue.toFixed(0)}`;
   };
 
   // Build waterfall data
   const chartData = useMemo(() => {
     let runningTotal = previousTotal;
 
     const data = [
       {
         name: 'T-1',
         value: previousTotal,
         start: 0,
         end: previousTotal,
         isTotal: true,
         fill: 'hsl(var(--muted-foreground))',
       },
     ];
 
     summary.byDriver.forEach((driver) => {
       const start = runningTotal;
       runningTotal += driver.amount;
       data.push({
         name: driver.label,
         value: driver.amount,
         start: Math.min(start, runningTotal),
         end: Math.max(start, runningTotal),
         isTotal: false,
         fill: driver.amount >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))',
       });
     });
 
     data.push({
       name: 'T',
       value: runningTotal,
       start: 0,
       end: runningTotal,
       isTotal: true,
       fill: 'hsl(var(--primary))',
     });
 
     return data;
   }, [summary, previousTotal]);
 
   if (isLoading) {
     return (
       <Card>
         <CardHeader>
           <CardTitle>PnL Bridge</CardTitle>
         </CardHeader>
         <CardContent>
           <Skeleton className="h-[300px] w-full" />
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader className="pb-2">
         <CardTitle className="text-lg">PnL Bridge (T-1 → T)</CardTitle>
       </CardHeader>
       <CardContent>
         <div className="h-[300px]">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
               <XAxis dataKey="name" tick={{ fontSize: 12 }} />
               <YAxis
                 tickFormatter={(value) => formatCurrency(value)}
                 tick={{ fontSize: 11 }}
               />
               <Tooltip
                 formatter={(value: number) => [formatCurrency(value), 'Amount']}
                 labelFormatter={(label) => `${label}`}
                 contentStyle={{
                   backgroundColor: 'hsl(var(--popover))',
                   border: '1px solid hsl(var(--border))',
                   borderRadius: '8px',
                 }}
               />
               <ReferenceLine y={0} stroke="hsl(var(--border))" />
               <Bar dataKey="end" radius={[4, 4, 0, 0]}>
                 {chartData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.fill} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
         </div>
       </CardContent>
     </Card>
   );
 };