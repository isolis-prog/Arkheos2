 import { LucideIcon, Plus, Play, Truck, CreditCard, CheckCircle2 } from 'lucide-react';
 import { Card, CardContent } from '@/components/ui/card';
 import { cn } from '@/lib/utils';
 import { LifecycleStage } from '@/hooks/useTradeLifecycle';
 
 interface LifecycleStageCardProps {
   stage: LifecycleStage;
   count: number;
   amount: number;
   isActive?: boolean;
   onClick?: () => void;
 }
 
 const stageConfig: Record<LifecycleStage, { label: string; icon: LucideIcon; color: string }> = {
   created: { label: 'Created', icon: Plus, color: 'text-blue-500 bg-blue-500/10' },
   active: { label: 'Active', icon: Play, color: 'text-amber-500 bg-amber-500/10' },
   delivered: { label: 'Delivered', icon: Truck, color: 'text-purple-500 bg-purple-500/10' },
   settled: { label: 'Settled', icon: CreditCard, color: 'text-emerald-500 bg-emerald-500/10' },
   closed: { label: 'Closed', icon: CheckCircle2, color: 'text-slate-500 bg-slate-500/10' },
 };
 
 export const LifecycleStageCard = ({
   stage,
   count,
   amount,
   isActive,
   onClick,
 }: LifecycleStageCardProps) => {
   const config = stageConfig[stage];
   const Icon = config.icon;
 
   const formatCurrency = (amt: number) => {
     if (amt >= 1000000) {
       return `$${(amt / 1000000).toFixed(1)}M`;
     }
     if (amt >= 1000) {
       return `$${(amt / 1000).toFixed(0)}K`;
     }
     return `$${amt.toFixed(0)}`;
   };
 
   return (
     <Card
       className={cn(
         'cursor-pointer transition-all hover:shadow-md',
         isActive && 'ring-2 ring-primary'
       )}
       onClick={onClick}
     >
       <CardContent className="p-4">
         <div className="flex items-center gap-3">
           <div className={cn('rounded-lg p-2', config.color)}>
             <Icon className="h-5 w-5" />
           </div>
           <div className="flex-1">
             <p className="text-sm font-medium text-muted-foreground">{config.label}</p>
             <p className="text-2xl font-bold">{count}</p>
           </div>
           <div className="text-right">
             <p className="text-sm text-muted-foreground">Value</p>
             <p className="text-lg font-semibold">{formatCurrency(amount)}</p>
           </div>
         </div>
       </CardContent>
     </Card>
   );
 };