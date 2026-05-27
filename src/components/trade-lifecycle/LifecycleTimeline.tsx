 import { format } from 'date-fns';
 import { Check, Circle } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { LifecycleStage, TradeLifecycle } from '@/hooks/useTradeLifecycle';
 
 interface LifecycleTimelineProps {
   trade: TradeLifecycle;
   compact?: boolean;
 }
 
 const stageLabels: Record<LifecycleStage, string> = {
   created: 'Created',
   active: 'Active',
   delivered: 'Delivered',
   settled: 'Settled',
   closed: 'Closed',
 };
 
 const stageColors: Record<LifecycleStage, string> = {
   created: 'bg-blue-500',
   active: 'bg-amber-500',
   delivered: 'bg-purple-500',
   settled: 'bg-emerald-500',
   closed: 'bg-slate-500',
 };
 
 export const LifecycleTimeline = ({ trade, compact = false }: LifecycleTimelineProps) => {
   if (compact) {
     return (
       <div className="flex items-center gap-1">
         {trade.stages.map((stage, index) => (
           <div
             key={stage.stage}
             className={cn(
               'h-2 flex-1 rounded-full transition-colors',
               stage.reached ? stageColors[stage.stage] : 'bg-muted'
             )}
             title={`${stageLabels[stage.stage]}${stage.date ? `: ${stage.date}` : ''}`}
           />
         ))}
       </div>
     );
   }
 
   return (
     <div className="relative">
       {/* Progress line */}
       <div className="absolute top-5 left-5 right-5 h-0.5 bg-muted" />
       <div
         className="absolute top-5 left-5 h-0.5 bg-primary transition-all"
         style={{ width: `calc(${trade.stageProgress}% - 40px)` }}
       />
 
       {/* Stage nodes */}
       <div className="relative flex justify-between">
         {trade.stages.map((stage, index) => (
           <div key={stage.stage} className="flex flex-col items-center">
             <div
               className={cn(
                 'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                 stage.reached
                   ? `${stageColors[stage.stage]} border-transparent text-white`
                   : 'border-muted bg-background text-muted-foreground'
               )}
             >
               {stage.reached ? (
                 <Check className="h-5 w-5" />
               ) : (
                 <Circle className="h-5 w-5" />
               )}
             </div>
             <div className="mt-2 text-center">
               <p
                 className={cn(
                   'text-sm font-medium',
                   stage.reached ? 'text-foreground' : 'text-muted-foreground'
                 )}
               >
                 {stageLabels[stage.stage]}
               </p>
               {stage.date && (
                 <p className="text-xs text-muted-foreground">
                   {format(new Date(stage.date), 'MMM d')}
                 </p>
               )}
               {stage.eventCount > 0 && (
                 <p className="text-xs text-muted-foreground/70">
                   {stage.eventCount} event{stage.eventCount > 1 ? 's' : ''}
                 </p>
               )}
             </div>
           </div>
         ))}
       </div>
     </div>
   );
 };