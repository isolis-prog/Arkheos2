 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import { Badge } from '@/components/ui/badge';
 import { MTMVariance } from '@/hooks/useValuationConsistency';
 import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
 import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
 
 interface MTMVarianceTableProps {
   variances: MTMVariance[];
 }
 
 const formatCurrency = (value: number): string => {
   const absValue = Math.abs(value);
   if (absValue >= 1000000) {
     return `${value >= 0 ? '' : '-'}$${(absValue / 1000000).toFixed(2)}M`;
   }
   if (absValue >= 1000) {
     return `${value >= 0 ? '' : '-'}$${(absValue / 1000).toFixed(0)}K`;
   }
   return `$${value.toFixed(0)}`;
 };
 
 const driverColors: Record<string, string> = {
   Curve: 'bg-info text-info-foreground',
   Price: 'bg-warning text-warning-foreground',
   FX: 'bg-success text-success-foreground',
 };
 
 export const MTMVarianceTable = ({ variances }: MTMVarianceTableProps) => {
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2 text-lg">
           <BarChart3 className="h-5 w-5" />
           MTM Variance Detection
           <Badge variant="secondary">{variances.length} variances</Badge>
         </CardTitle>
       </CardHeader>
       <CardContent>
         <div className="overflow-x-auto">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Deal ID</TableHead>
                 <TableHead>Book</TableHead>
                 <TableHead>Commodity</TableHead>
                 <TableHead className="text-right">Previous MTM</TableHead>
                 <TableHead className="text-right">Current MTM</TableHead>
                 <TableHead className="text-right">Variance</TableHead>
                 <TableHead className="text-center">Driver</TableHead>
                 <TableHead>Attribution</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {variances.slice(0, 15).map((v) => (
                 <TableRow key={v.dealId}>
                   <TableCell className="font-mono text-sm">{v.dealId}</TableCell>
                   <TableCell>{v.book}</TableCell>
                   <TableCell>{v.commodity}</TableCell>
                   <TableCell className="text-right font-mono">
                     {formatCurrency(v.previousMTM)}
                   </TableCell>
                   <TableCell className="text-right font-mono">
                     {formatCurrency(v.currentMTM)}
                   </TableCell>
                   <TableCell className="text-right">
                     <div className={`flex items-center justify-end gap-1 font-medium ${
                       v.variance >= 0 ? 'text-success' : 'text-destructive'
                     }`}>
                       {v.variance >= 0 ? (
                         <TrendingUp className="h-3 w-3" />
                       ) : (
                         <TrendingDown className="h-3 w-3" />
                       )}
                       <span>{formatCurrency(v.variance)}</span>
                       <span className="text-xs text-muted-foreground">
                         ({v.variancePct >= 0 ? '+' : ''}{v.variancePct.toFixed(1)}%)
                       </span>
                     </div>
                   </TableCell>
                   <TableCell className="text-center">
                     <Badge className={driverColors[v.primaryDriver] || 'bg-muted'}>
                       {v.primaryDriver}
                     </Badge>
                   </TableCell>
                   <TableCell>
                     <Tooltip>
                       <TooltipTrigger>
                         <div className="flex gap-1 h-2 w-24 rounded overflow-hidden">
                           <div 
                             className="bg-info h-full" 
                             style={{ width: `${Math.abs(v.curveContribution) / (Math.abs(v.curveContribution) + Math.abs(v.priceContribution) + Math.abs(v.fxContribution)) * 100}%` }}
                           />
                           <div 
                             className="bg-warning h-full" 
                             style={{ width: `${Math.abs(v.priceContribution) / (Math.abs(v.curveContribution) + Math.abs(v.priceContribution) + Math.abs(v.fxContribution)) * 100}%` }}
                           />
                           <div 
                             className="bg-success h-full" 
                             style={{ width: `${Math.abs(v.fxContribution) / (Math.abs(v.curveContribution) + Math.abs(v.priceContribution) + Math.abs(v.fxContribution)) * 100}%` }}
                           />
                         </div>
                       </TooltipTrigger>
                       <TooltipContent>
                         <div className="space-y-1 text-xs">
                           <p>Curve: {formatCurrency(v.curveContribution)}</p>
                           <p>Price: {formatCurrency(v.priceContribution)}</p>
                           <p>FX: {formatCurrency(v.fxContribution)}</p>
                         </div>
                       </TooltipContent>
                     </Tooltip>
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </div>
       </CardContent>
     </Card>
   );
 };