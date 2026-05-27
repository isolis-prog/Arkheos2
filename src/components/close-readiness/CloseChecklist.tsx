 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { CloseChecklistItem } from '@/hooks/useCloseReadiness';
 import { CheckCircle2, Clock, AlertTriangle, XCircle, ListChecks } from 'lucide-react';
 import { formatDistanceToNow } from 'date-fns';
 
 interface CloseChecklistProps {
   items: CloseChecklistItem[];
 }
 
 const statusConfig = {
   completed: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
   in_progress: { icon: Clock, color: 'text-info', bg: 'bg-info/10' },
   pending: { icon: AlertTriangle, color: 'text-muted-foreground', bg: 'bg-muted' },
   blocked: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
 };
 
 const categoryLabels = {
   recon: 'Reconciliation',
   valuation: 'Valuation',
   fx: 'FX',
   approval: 'Approvals',
 };
 
 export const CloseChecklist = ({ items }: CloseChecklistProps) => {
   const completedCount = items.filter(i => i.status === 'completed').length;
 
   return (
     <Card>
       <CardHeader>
         <div className="flex items-center justify-between">
           <CardTitle className="flex items-center gap-2 text-lg">
             <ListChecks className="h-5 w-5" />
             Close Checklist
           </CardTitle>
           <Badge variant="outline">
             {completedCount}/{items.length} Complete
           </Badge>
         </div>
       </CardHeader>
       <CardContent>
         <div className="space-y-2">
           {items.map((item) => {
             const config = statusConfig[item.status];
             const StatusIcon = config.icon;
 
             return (
               <div
                 key={item.id}
                 className={`flex items-center gap-3 p-3 rounded-lg ${config.bg}`}
               >
                 <StatusIcon className={`h-5 w-5 flex-shrink-0 ${config.color}`} />
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2">
                     <span className={`font-medium ${item.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                       {item.label}
                     </span>
                     <Badge variant="secondary" className="text-xs">
                       {categoryLabels[item.category]}
                     </Badge>
                   </div>
                   <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                     {item.assignee && <span>Assignee: {item.assignee}</span>}
                     {item.completedAt && (
                       <span>Completed {formatDistanceToNow(new Date(item.completedAt), { addSuffix: true })}</span>
                     )}
                     {item.blockerReason && (
                       <span className="text-destructive">{item.blockerReason}</span>
                     )}
                   </div>
                 </div>
               </div>
             );
           })}
         </div>
       </CardContent>
     </Card>
   );
 };