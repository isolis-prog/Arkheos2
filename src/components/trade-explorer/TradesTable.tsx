import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { readDrillContextParam, withDrillContext } from '@/lib/drill-context-url';
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
 import { Trade } from '@/hooks/useTradeExplorer';
 
interface TradesTableProps {
  trades: Trade[];
  isLoading: boolean;
  selectedDealId?: string | null;
  onSelect?: (dealId: string) => void;
}
 
export const TradesTable = ({ trades, isLoading, selectedDealId, onSelect }: TradesTableProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const drillContextParam = readDrillContextParam(searchParams);

  const goToDeal = (dealId: string) =>
    navigate(withDrillContext(`/trade-explorer/${encodeURIComponent(dealId)}`, drillContextParam));
 
   const formatCurrency = (amount: number, currency?: string | null) => {
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency: currency || 'USD',
       minimumFractionDigits: 0,
       maximumFractionDigits: 0,
     }).format(amount);
   };
 
   const formatDate = (dateStr: string | null) => {
     if (!dateStr) return '-';
     return new Date(dateStr).toLocaleDateString('en-US', {
       month: 'short',
       day: 'numeric',
       year: 'numeric',
     });
   };
 
   if (isLoading) {
     return (
       <div className="space-y-3">
         {[...Array(5)].map((_, i) => (
           <Skeleton key={i} className="h-12 w-full" />
         ))}
       </div>
     );
   }
 
   if (trades.length === 0) {
     return (
       <div className="flex flex-col items-center justify-center py-12 text-center">
         <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
         <p className="text-lg font-medium text-muted-foreground">No trades found</p>
         <p className="text-sm text-muted-foreground/70">Try adjusting your search filters</p>
       </div>
     );
   }
 
   return (
     <div className="rounded-md border">
       <Table>
         <TableHeader>
           <TableRow>
             <TableHead>Trade ID</TableHead>
             <TableHead>Source</TableHead>
             <TableHead>Book/Portfolio</TableHead>
             <TableHead>Counterparty</TableHead>
             <TableHead>Strategy</TableHead>
             <TableHead className="text-right">Total Amount</TableHead>
             <TableHead className="text-center">Events</TableHead>
             <TableHead>Date Range</TableHead>
             <TableHead className="w-[50px]"></TableHead>
           </TableRow>
         </TableHeader>
         <TableBody>
           {trades.map((trade) => (
            <TableRow
              key={trade.id}
              data-state={selectedDealId === trade.dealId ? 'selected' : undefined}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => (onSelect ? onSelect(trade.dealId) : goToDeal(trade.dealId))}
            >
               <TableCell className="font-mono font-medium">{trade.dealId}</TableCell>
               <TableCell>
                 <Badge variant="outline" className="uppercase">
                   {trade.sourceSystem}
                 </Badge>
               </TableCell>
               <TableCell>{trade.bookPortfolio || '-'}</TableCell>
               <TableCell>{trade.counterparty || '-'}</TableCell>
               <TableCell>{trade.strategy || '-'}</TableCell>
               <TableCell className="text-right font-medium">
                 {formatCurrency(trade.totalAmount, trade.currency)}
               </TableCell>
               <TableCell className="text-center">
                 <Badge variant="secondary">{trade.eventCount}</Badge>
               </TableCell>
               <TableCell className="text-sm text-muted-foreground">
                 {formatDate(trade.firstEventDate)}
                 {trade.firstEventDate !== trade.lastEventDate && (
                   <> → {formatDate(trade.lastEventDate)}</>
                 )}
               </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToDeal(trade.dealId);
                  }}
                  aria-label="Open trade detail"
                >
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