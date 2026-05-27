 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { FXExposure } from '@/hooks/useFXAnalytics';
 import {
   BarChart,
   Bar,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   Legend,
 } from 'recharts';
 import { useMemo } from 'react';
 
 interface FXByCurrencyChartProps {
   exposures: FXExposure[];
 }
 
 export const FXByCurrencyChart = ({ exposures }: FXByCurrencyChartProps) => {
   const chartData = useMemo(() => {
     const pairMap = new Map<string, { realized: number; unrealized: number }>();
 
     exposures.forEach((exposure) => {
       const existing = pairMap.get(exposure.currencyPair) || { realized: 0, unrealized: 0 };
       pairMap.set(exposure.currencyPair, {
         realized: existing.realized + exposure.realizedAmount,
         unrealized: existing.unrealized + exposure.unrealizedAmount,
       });
     });
 
     return Array.from(pairMap.entries()).map(([pair, values]) => ({
       currencyPair: pair,
       realized: values.realized / 1000000,
       unrealized: values.unrealized / 1000000,
       total: (values.realized + values.unrealized) / 1000000,
     })).sort((a, b) => b.total - a.total);
   }, [exposures]);
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="text-lg">FX Exposure by Currency Pair</CardTitle>
       </CardHeader>
       <CardContent>
         <div className="h-[300px]">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={chartData} layout="vertical">
               <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
               <XAxis 
                 type="number" 
                 tickFormatter={(value) => `$${value}M`}
                 className="text-xs fill-muted-foreground"
               />
               <YAxis 
                 type="category" 
                 dataKey="currencyPair" 
                 width={80}
                 className="text-xs fill-muted-foreground"
               />
               <Tooltip
                 formatter={(value: number) => [`$${value.toFixed(2)}M`, '']}
                 contentStyle={{
                   backgroundColor: 'hsl(var(--card))',
                   border: '1px solid hsl(var(--border))',
                   borderRadius: '8px',
                 }}
               />
               <Legend />
               <Bar 
                 dataKey="realized" 
                 name="Realized" 
                 fill="hsl(var(--success))" 
                 radius={[0, 4, 4, 0]}
                 stackId="exposure"
               />
               <Bar 
                 dataKey="unrealized" 
                 name="Unrealized" 
                 fill="hsl(var(--warning))" 
                 radius={[0, 4, 4, 0]}
                 stackId="exposure"
               />
             </BarChart>
           </ResponsiveContainer>
         </div>
       </CardContent>
     </Card>
   );
 };