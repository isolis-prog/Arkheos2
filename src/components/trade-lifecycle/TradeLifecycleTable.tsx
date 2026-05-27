 import { useNavigate } from 'react-router-dom';
 import { ArrowRight } from 'lucide-react';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Skeleton } from '@/components/ui/skeleton';
 import { TradeLifecycle, LifecycleStage } from '@/hooks/useTradeLifecycle';
 import { LifecycleTimeline } from './LifecycleTimeline';
 import { cn } from '@/lib/utils';
 
 interface TradeLifecycleTableProps {
   trades: TradeLifecycle[];
   isLoading: boolean;
 }
 
 const stageBadgeColors: Record<LifecycleStage, string> = {
   created: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
   active: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
   delivered: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
   settled: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
   closed: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
 };
 
 const stageLabels: Record<LifecycleStage, string> = {
   created: 'Created',
   active: 'Active',
   delivered: 'Delivered',
   settled: 'Settled',
   closed: 'Closed',
 };
 
 export const TradeLifecycleTable = ({ trades, isLoading }: TradeLifecycleTableProps) => {
   const navigate = useNavigate();
 
   const formatCurrency = (amount: number, currency?: string | null) => {
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency: currency || 'USD',
       minimumFractionDigits: 0,
       maximumFractionDigits: 0,
     }).format(amount);
   };
 
   if (isLoading) {
     return (
       <div className="space-y-3">
         {[...Array(5)].map((_, i) => (
           <Skeleton key={i} className="h-16 w-full" />
         ))}
       </div>
     );
   }
 
   if (trades.length === 0) {
     return (
       <div className="flex flex-col items-center justify-center py-12 text-center">
         <p className="text-lg font-medium text-muted-foreground">No trades found</p>
         <p className="text-sm text-muted-foreground/70">Try adjusting your filters</p>
       </div>
     );
   }
 
   return (
     <div className="rounded-md border">
       <Table>
         <TableHeader>
           <TableRow>
             <TableHead>Trade ID</TableHead>
             <TableHead>Counterparty</TableHead>
             <TableHead>Book</TableHead>
             <TableHead>Commodity</TableHead>
             <TableHead className="text-right">Amount</TableHead>
             <TableHead className="w-[200px]">Lifecycle Progress</TableHead>
             <TableHead>Stage</TableHead>
             <TableHead className="w-[50px]"></TableHead>
           </TableRow>
         </TableHeader>
         <TableBody>
           {trades.map((trade) => (
             <TableRow
               key={trade.id}
               className="cursor-pointer hover:bg-muted/50"
               onClick={() => navigate(`/trade-explorer/${encodeURIComponent(trade.dealId)}`)}
             >
               <TableCell className="font-mono font-medium">{trade.dealId}</TableCell>
               <TableCell>{trade.counterparty || '-'}</TableCell>
               <TableCell>{trade.bookPortfolio || '-'}</TableCell>
               <TableCell>{trade.commodity || trade.strategy || '-'}</TableCell>
               <TableCell className="text-right font-medium">
                 {formatCurrency(trade.totalAmount, trade.currency)}
               </TableCell>
               <TableCell>
                 <LifecycleTimeline trade={trade} compact />
               </TableCell>
               <TableCell>
                 <Badge
                   variant="outline"
                   className={cn('capitalize', stageBadgeColors[trade.currentStage])}
                 >
                   {stageLabels[trade.currentStage]}
                 </Badge>
               </TableCell>
               <TableCell>
                 <Button variant="ghost" size="icon" className="h-8 w-8">
                   <ArrowRight className="h-4 w-4" />
                 </Button>
               </TableCell>
             </TableRow>
           ))}
         </TableBody>
       </Table>
     </div>
   );
 };