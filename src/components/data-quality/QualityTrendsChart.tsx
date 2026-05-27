 import { useMemo } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
 import { format, parseISO } from 'date-fns';
 import type { QualityTrend } from '@/hooks/useDataQuality';
 
 interface QualityTrendsChartProps {
   trends: QualityTrend[];
   qualityDimension?: string;
 }
 
 const dimensionConfig = {
   completeness: { color: '#3b82f6', name: 'Completeness' },
   validity: { color: '#8b5cf6', name: 'Validity' },
   timeliness: { color: '#f59e0b', name: 'Timeliness' },
   consistency: { color: '#10b981', name: 'Consistency' },
   overall: { color: '#6366f1', name: 'Overall' },
 };
 
 export function QualityTrendsChart({ trends, qualityDimension }: QualityTrendsChartProps) {
   const chartData = useMemo(() => {
     return trends.map(t => ({
       ...t,
       date: format(parseISO(t.date), 'MMM dd'),
       completeness: Math.round(t.completeness * 10) / 10,
       validity: Math.round(t.validity * 10) / 10,
       timeliness: Math.round(t.timeliness * 10) / 10,
       consistency: Math.round(t.consistency * 10) / 10,
       overall: Math.round(t.overall * 10) / 10,
     }));
   }, [trends]);
 
   const visibleDimensions = qualityDimension && qualityDimension !== 'all'
     ? [qualityDimension]
     : ['completeness', 'validity', 'timeliness', 'consistency'];
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="text-base">Quality Score Trends (30 Days)</CardTitle>
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
                 className="text-muted-foreground"
               />
               <YAxis 
                 domain={[80, 100]} 
                 tick={{ fontSize: 11 }}
                 tickLine={false}
                 axisLine={false}
                 tickFormatter={(value) => `${value}%`}
                 className="text-muted-foreground"
               />
               <Tooltip 
                 contentStyle={{ 
                   backgroundColor: 'hsl(var(--card))',
                   border: '1px solid hsl(var(--border))',
                   borderRadius: '8px',
                 }}
                 formatter={(value: number) => [`${value}%`]}
               />
               <Legend />
               <ReferenceLine 
                 y={95} 
                 stroke="hsl(var(--success))" 
                 strokeDasharray="5 5" 
                 label={{ value: 'Target', position: 'right', fontSize: 10 }}
               />
               
               {visibleDimensions.includes('completeness') && (
                 <Line 
                   type="monotone" 
                   dataKey="completeness" 
                   stroke={dimensionConfig.completeness.color}
                   strokeWidth={2}
                   dot={false}
                   name="Completeness"
                 />
               )}
               {visibleDimensions.includes('validity') && (
                 <Line 
                   type="monotone" 
                   dataKey="validity" 
                   stroke={dimensionConfig.validity.color}
                   strokeWidth={2}
                   dot={false}
                   name="Validity"
                 />
               )}
               {visibleDimensions.includes('timeliness') && (
                 <Line 
                   type="monotone" 
                   dataKey="timeliness" 
                   stroke={dimensionConfig.timeliness.color}
                   strokeWidth={2}
                   dot={false}
                   name="Timeliness"
                 />
               )}
               {visibleDimensions.includes('consistency') && (
                 <Line 
                   type="monotone" 
                   dataKey="consistency" 
                   stroke={dimensionConfig.consistency.color}
                   strokeWidth={2}
                   dot={false}
                   name="Consistency"
                 />
               )}
             </LineChart>
           </ResponsiveContainer>
         </div>
       </CardContent>
     </Card>
   );
 }