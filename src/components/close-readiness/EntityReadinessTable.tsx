 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import { EntityReadiness } from '@/hooks/useCloseReadiness';
 import { Building2, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
 
 interface EntityReadinessTableProps {
   entities: EntityReadiness[];
 }
 
 const statusConfig = {
   ready: { label: 'Ready', color: 'bg-success text-success-foreground', icon: CheckCircle2 },
   in_progress: { label: 'In Progress', color: 'bg-info text-info-foreground', icon: Clock },
   blocked: { label: 'Blocked', color: 'bg-destructive text-destructive-foreground', icon: XCircle },
   not_started: { label: 'Not Started', color: 'bg-muted text-muted-foreground', icon: AlertTriangle },
 };
 
 export const EntityReadinessTable = ({ entities }: EntityReadinessTableProps) => {
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2 text-lg">
           <Building2 className="h-5 w-5" />
           Entity Readiness Overview
         </CardTitle>
       </CardHeader>
       <CardContent>
         <div className="space-y-4">
           {entities.map((entity) => {
             const config = statusConfig[entity.status];
             const StatusIcon = config.icon;
 
             return (
               <div key={entity.entityId} className="rounded-lg border p-4">
                 <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                       <Building2 className="h-5 w-5 text-primary" />
                     </div>
                     <div>
                       <h4 className="font-semibold">{entity.entityName}</h4>
                       <p className="text-sm text-muted-foreground">
                         {entity.completionPct.toFixed(0)}% complete
                       </p>
                     </div>
                   </div>
                   <Badge className={config.color}>
                     <StatusIcon className="h-3 w-3 mr-1" />
                     {config.label}
                   </Badge>
                 </div>
 
                 <Progress value={entity.completionPct} className="h-2 mb-3" />
 
                 <div className="grid grid-cols-3 gap-4 text-sm">
                   <div className="flex items-center gap-2">
                     <div className={`h-2 w-2 rounded-full ${entity.reconCompleted ? 'bg-success' : 'bg-warning'}`} />
                     <span className="text-muted-foreground">Open Events:</span>
                     <span className="font-medium">{entity.openEvents}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className={`h-2 w-2 rounded-full ${entity.valuationCompleted ? 'bg-success' : 'bg-warning'}`} />
                     <span className="text-muted-foreground">Missing Val:</span>
                     <span className="font-medium">{entity.missingValuations}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className={`h-2 w-2 rounded-full ${entity.fxCompleted ? 'bg-success' : 'bg-warning'}`} />
                     <span className="text-muted-foreground">Pending FX:</span>
                     <span className="font-medium">{entity.pendingFX}</span>
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