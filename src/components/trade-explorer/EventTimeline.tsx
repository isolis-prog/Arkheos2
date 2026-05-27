 import { format } from 'date-fns';
 import { Calendar, FileText, Hash, Database, DollarSign } from 'lucide-react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Skeleton } from '@/components/ui/skeleton';
 import { TradeEvent } from '@/hooks/useTradeExplorer';
 import { cn } from '@/lib/utils';
 
 interface EventTimelineProps {
   events: TradeEvent[];
   isLoading: boolean;
 }
 
 export const EventTimeline = ({ events, isLoading }: EventTimelineProps) => {
   const formatCurrency = (amount: number | null, currency?: string | null) => {
     if (amount === null) return '-';
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency: currency || 'USD',
       minimumFractionDigits: 2,
       maximumFractionDigits: 2,
     }).format(amount);
   };
 
   if (isLoading) {
     return (
       <div className="space-y-4">
         {[...Array(4)].map((_, i) => (
           <Skeleton key={i} className="h-32 w-full" />
         ))}
       </div>
     );
   }
 
   if (events.length === 0) {
     return (
       <div className="flex flex-col items-center justify-center py-12 text-center">
         <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
         <p className="text-lg font-medium text-muted-foreground">No events found</p>
       </div>
     );
   }
 
   return (
     <div className="relative">
       {/* Timeline line */}
       <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
 
       <div className="space-y-4">
         {events.map((event, index) => (
           <div key={event.id} className="relative pl-10">
             {/* Timeline dot */}
             <div
               className={cn(
                 'absolute left-2 top-4 h-5 w-5 rounded-full border-2 bg-background flex items-center justify-center',
                 event.sourceSystem === 'etrm' ? 'border-blue-500' : 'border-green-500'
               )}
             >
               <div
                 className={cn(
                   'h-2 w-2 rounded-full',
                   event.sourceSystem === 'etrm' ? 'bg-blue-500' : 'bg-green-500'
                 )}
               />
             </div>
 
             <Card className="overflow-hidden">
               <CardContent className="p-4">
                 <div className="flex items-start justify-between gap-4">
                   <div className="flex-1 space-y-2">
                     {/* Header */}
                     <div className="flex items-center gap-2 flex-wrap">
                       <Badge
                         variant="outline"
                         className={cn(
                           'uppercase font-mono',
                           event.sourceSystem === 'etrm'
                             ? 'border-blue-500/50 text-blue-600'
                             : 'border-green-500/50 text-green-600'
                         )}
                       >
                         {event.sourceSystem}
                       </Badge>
                       <Badge variant="secondary">{event.recordType}</Badge>
                       {event.feeType && (
                         <Badge variant="outline">{event.feeType}</Badge>
                       )}
                     </div>
 
                     {/* Date info */}
                     <div className="flex items-center gap-4 text-sm text-muted-foreground">
                       <div className="flex items-center gap-1.5">
                         <Calendar className="h-3.5 w-3.5" />
                         <span>
                           Economic:{' '}
                           {event.economicDate
                             ? format(new Date(event.economicDate), 'MMM d, yyyy')
                             : '-'}
                         </span>
                       </div>
                       {event.postingDate && (
                         <div className="flex items-center gap-1.5">
                           <FileText className="h-3.5 w-3.5" />
                           <span>
                             Posted: {format(new Date(event.postingDate), 'MMM d, yyyy')}
                           </span>
                         </div>
                       )}
                     </div>
 
                     {/* Source references - drill-down fields */}
                     <div className="flex items-center gap-4 text-xs text-muted-foreground/80 font-mono">
                       {event.docId && (
                         <div className="flex items-center gap-1">
                           <Hash className="h-3 w-3" />
                           <span>Doc: {event.docId}</span>
                         </div>
                       )}
                       {event.lineId && (
                         <div className="flex items-center gap-1">
                           <Database className="h-3 w-3" />
                           <span>Line: {event.lineId}</span>
                         </div>
                       )}
                       {event.matchKey && (
                         <div className="flex items-center gap-1 max-w-[200px] truncate">
                           <span className="text-muted-foreground">Key:</span>
                           <span className="truncate">{event.matchKey}</span>
                         </div>
                       )}
                     </div>
                   </div>
 
                   {/* Amount */}
                   <div className="text-right">
                     <div className="flex items-center gap-1 text-lg font-semibold">
                       <DollarSign className="h-4 w-4 text-muted-foreground" />
                       {formatCurrency(event.amount, event.currency)}
                     </div>
                     <div className="text-xs text-muted-foreground">{event.currency || 'USD'}</div>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
         ))}
       </div>
     </div>
   );
 };