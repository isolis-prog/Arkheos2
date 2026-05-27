 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { FXTimeBucket } from '@/hooks/useFXAnalytics';
 import {
   AreaChart,
   Area,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   Legend,
   ComposedChart,
   Bar,
   Line,
 } from 'recharts';
 import { Calendar } from 'lucide-react';
 
 interface FXTimeBucketsProps {
   timeBuckets: FXTimeBucket[];
   bucketType: string;
 }
 
 export const FXTimeBuckets = ({ timeBuckets, bucketType }: FXTimeBucketsProps) => {
   const chartData = timeBuckets.map((bucket) => ({
     ...bucket,
     netExposureM: bucket.netExposure / 1000000,
     realizedPnLK: bucket.realizedPnL / 1000,
     unrealizedPnLK: bucket.unrealizedPnL / 1000,
     hedgedM: bucket.hedgedAmount / 1000000,
     unhedgedM: bucket.unhedgedAmount / 1000000,
     hedgeRatio: bucket.hedgedAmount + bucket.unhedgedAmount > 0
       ? (bucket.hedgedAmount / (bucket.hedgedAmount + bucket.unhedgedAmount)) * 100
       : 0,
   }));
 
   return (
     <div className="grid gap-4 lg:grid-cols-2">
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2 text-lg">
             <Calendar className="h-5 w-5" />
             Net Exposure Over Time ({bucketType})
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="h-[280px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                 <defs>
                   <linearGradient id="exposureGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                     <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                 <XAxis 
                   dataKey="bucket" 
                   className="text-xs fill-muted-foreground"
                   tick={{ fontSize: 10 }}
                   angle={-45}
                   textAnchor="end"
                   height={60}
                 />
                 <YAxis 
                   tickFormatter={(value) => `$${value}M`}
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
                 <Area
                   type="monotone"
                   dataKey="netExposureM"
                   name="Net Exposure"
                   stroke="hsl(var(--info))"
                   fill="url(#exposureGradient)"
                   strokeWidth={2}
                 />
               </AreaChart>
             </ResponsiveContainer>
           </div>
         </CardContent>
       </Card>
 
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2 text-lg">
             <Calendar className="h-5 w-5" />
             Hedged vs Unhedged Exposure
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="h-[280px]">
             <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                 <XAxis 
                   dataKey="bucket" 
                   className="text-xs fill-muted-foreground"
                   tick={{ fontSize: 10 }}
                   angle={-45}
                   textAnchor="end"
                   height={60}
                 />
                 <YAxis 
                   yAxisId="left"
                   tickFormatter={(value) => `$${value}M`}
                   className="text-xs fill-muted-foreground"
                 />
                 <YAxis 
                   yAxisId="right"
                   orientation="right"
                   tickFormatter={(value) => `${value}%`}
                   domain={[0, 100]}
                   className="text-xs fill-muted-foreground"
                 />
                 <Tooltip
                   formatter={(value: number, name: string) => {
                     if (name === 'Hedge Ratio') return [`${value.toFixed(1)}%`, name];
                     return [`$${value.toFixed(2)}M`, name];
                   }}
                   contentStyle={{
                     backgroundColor: 'hsl(var(--card))',
                     border: '1px solid hsl(var(--border))',
                     borderRadius: '8px',
                   }}
                 />
                 <Legend />
                 <Bar 
                   yAxisId="left"
                   dataKey="hedgedM" 
                   name="Hedged" 
                   fill="hsl(var(--success))" 
                   stackId="exposure"
                   radius={[0, 0, 0, 0]}
                 />
                 <Bar 
                   yAxisId="left"
                   dataKey="unhedgedM" 
                   name="Unhedged" 
                   fill="hsl(var(--warning))" 
                   stackId="exposure"
                   radius={[4, 4, 0, 0]}
                 />
                 <Line
                   yAxisId="right"
                   type="monotone"
                   dataKey="hedgeRatio"
                   name="Hedge Ratio"
                   stroke="hsl(var(--primary))"
                   strokeWidth={2}
                   dot={false}
                 />
               </ComposedChart>
             </ResponsiveContainer>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 };