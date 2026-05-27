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
 import { FXExposure } from '@/hooks/useFXAnalytics';
 import { useMemo } from 'react';
 import { Building2, TrendingUp, TrendingDown } from 'lucide-react';
 
 interface FXByEntityTableProps {
   exposures: FXExposure[];
 }
 
 interface EntitySummary {
   entity: string;
   totalExposure: number;
   realizedPnL: number;
   unrealizedPnL: number;
   dealCount: number;
   currencyPairs: string[];
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
 
 export const FXByEntityTable = ({ exposures }: FXByEntityTableProps) => {
   const entitySummaries = useMemo<EntitySummary[]>(() => {
     const entityMap = new Map<string, EntitySummary>();
 
     exposures.forEach((exposure) => {
       const existing = entityMap.get(exposure.legalEntity);
       if (existing) {
         existing.totalExposure += exposure.totalExposure;
         existing.realizedPnL += exposure.realizedAmount * 0.02;
         existing.unrealizedPnL += exposure.unrealizedAmount * 0.015;
         existing.dealCount += exposure.dealCount;
         if (!existing.currencyPairs.includes(exposure.currencyPair)) {
           existing.currencyPairs.push(exposure.currencyPair);
         }
       } else {
         entityMap.set(exposure.legalEntity, {
           entity: exposure.legalEntity,
           totalExposure: exposure.totalExposure,
           realizedPnL: exposure.realizedAmount * 0.02,
           unrealizedPnL: exposure.unrealizedAmount * 0.015,
           dealCount: exposure.dealCount,
           currencyPairs: [exposure.currencyPair],
         });
       }
     });
 
     return Array.from(entityMap.values()).sort((a, b) => b.totalExposure - a.totalExposure);
   }, [exposures]);
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2 text-lg">
           <Building2 className="h-5 w-5" />
           FX Impact by Legal Entity
         </CardTitle>
       </CardHeader>
       <CardContent>
         <Table>
           <TableHeader>
             <TableRow>
               <TableHead>Entity</TableHead>
               <TableHead className="text-right">Total Exposure</TableHead>
               <TableHead className="text-right">Realized P&L</TableHead>
               <TableHead className="text-right">Unrealized P&L</TableHead>
               <TableHead className="text-center">Deals</TableHead>
               <TableHead>Currency Pairs</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {entitySummaries.map((entity) => (
               <TableRow key={entity.entity}>
                 <TableCell className="font-medium">{entity.entity}</TableCell>
                 <TableCell className="text-right">
                   {formatCurrency(entity.totalExposure)}
                 </TableCell>
                 <TableCell className="text-right">
                   <span className={`flex items-center justify-end gap-1 ${
                     entity.realizedPnL >= 0 ? 'text-success' : 'text-destructive'
                   }`}>
                     {entity.realizedPnL >= 0 ? (
                       <TrendingUp className="h-3 w-3" />
                     ) : (
                       <TrendingDown className="h-3 w-3" />
                     )}
                     {formatCurrency(entity.realizedPnL)}
                   </span>
                 </TableCell>
                 <TableCell className="text-right">
                   <span className={`flex items-center justify-end gap-1 ${
                     entity.unrealizedPnL >= 0 ? 'text-success' : 'text-warning'
                   }`}>
                     {entity.unrealizedPnL >= 0 ? (
                       <TrendingUp className="h-3 w-3" />
                     ) : (
                       <TrendingDown className="h-3 w-3" />
                     )}
                     {formatCurrency(entity.unrealizedPnL)}
                   </span>
                 </TableCell>
                 <TableCell className="text-center">{entity.dealCount}</TableCell>
                 <TableCell>
                   <div className="flex flex-wrap gap-1">
                     {entity.currencyPairs.slice(0, 3).map((pair) => (
                       <Badge key={pair} variant="outline" className="text-xs">
                         {pair}
                       </Badge>
                     ))}
                     {entity.currencyPairs.length > 3 && (
                       <Badge variant="secondary" className="text-xs">
                         +{entity.currencyPairs.length - 3}
                       </Badge>
                     )}
                   </div>
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
       </CardContent>
     </Card>
   );
 };