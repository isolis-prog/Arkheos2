 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { CurveUsage } from '@/hooks/useValuationConsistency';
 import {
   BarChart,
   Bar,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   Cell,
 } from 'recharts';
 import { useMemo } from 'react';
 import { Badge } from '@/components/ui/badge';
 import { TrendingUp } from 'lucide-react';
 
 interface CurveUsageChartProps {
   curveUsages: CurveUsage[];
 }
 
 export const CurveUsageChart = ({ curveUsages }: CurveUsageChartProps) => {
   const chartData = useMemo(() => {
     const typeMap = new Map<string, { fresh: number; stale: number; books: Set<string> }>();
 
     curveUsages.forEach((curve) => {
       const existing = typeMap.get(curve.curveType) || { fresh: 0, stale: 0, books: new Set<string>() };
       if (curve.isStale) {
         existing.stale += 1;
       } else {
         existing.fresh += 1;
       }
       curve.books.forEach(b => existing.books.add(b));
       typeMap.set(curve.curveType, existing);
     });
 
     return Array.from(typeMap.entries()).map(([type, data]) => ({
       curveType: type.charAt(0).toUpperCase() + type.slice(1),
       fresh: data.fresh,
       stale: data.stale,
       total: data.fresh + data.stale,
       bookCount: data.books.size,
     }));
   }, [curveUsages]);
 
   const bookUsageData = useMemo(() => {
     const bookMap = new Map<string, { curves: Set<string>; stale: number }>();
 
     curveUsages.forEach((curve) => {
       curve.books.forEach((book) => {
         const existing = bookMap.get(book) || { curves: new Set<string>(), stale: 0 };
         existing.curves.add(curve.curveId);
         if (curve.isStale) existing.stale += 1;
         bookMap.set(book, existing);
       });
     });
 
     return Array.from(bookMap.entries())
       .map(([book, data]) => ({
         book,
         curveCount: data.curves.size,
         staleCount: data.stale,
       }))
       .sort((a, b) => b.curveCount - a.curveCount);
   }, [curveUsages]);
 
   return (
     <div className="grid gap-4 lg:grid-cols-2">
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2 text-lg">
             <TrendingUp className="h-5 w-5" />
             Curves by Type
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                 <XAxis 
                   dataKey="curveType" 
                   className="text-xs fill-muted-foreground"
                 />
                 <YAxis className="text-xs fill-muted-foreground" />
                 <Tooltip
                   contentStyle={{
                     backgroundColor: 'hsl(var(--card))',
                     border: '1px solid hsl(var(--border))',
                     borderRadius: '8px',
                   }}
                 />
                 <Bar dataKey="fresh" name="Fresh" stackId="a" fill="hsl(var(--success))" radius={[0, 0, 0, 0]} />
                 <Bar dataKey="stale" name="Stale" stackId="a" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
         </CardContent>
       </Card>
 
       <Card>
         <CardHeader>
           <CardTitle className="text-lg">Curve Usage by Book</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="space-y-3">
             {bookUsageData.slice(0, 6).map((item) => (
               <div key={item.book} className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <span className="font-medium">{item.book}</span>
                   {item.staleCount > 0 && (
                     <Badge variant="outline" className="text-warning border-warning text-xs">
                       {item.staleCount} stale
                     </Badge>
                   )}
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-primary rounded-full"
                       style={{ width: `${(item.curveCount / Math.max(...bookUsageData.map(b => b.curveCount))) * 100}%` }}
                     />
                   </div>
                   <span className="text-sm text-muted-foreground w-8">{item.curveCount}</span>
                 </div>
               </div>
             ))}
           </div>
         </CardContent>
       </Card>
     </div>
   );
 };