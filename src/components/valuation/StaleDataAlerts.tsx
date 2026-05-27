 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { StaleDataAlert } from '@/hooks/useValuationConsistency';
 import { AlertTriangle, Clock, DollarSign } from 'lucide-react';
 import { formatDistanceToNow } from 'date-fns';
 
 interface StaleDataAlertsProps {
   alerts: StaleDataAlert[];
 }
 
 const formatCurrency = (value: number): string => {
   const absValue = Math.abs(value);
   if (absValue >= 1000000) {
     return `$${(absValue / 1000000).toFixed(1)}M`;
   }
   if (absValue >= 1000) {
     return `$${(absValue / 1000).toFixed(0)}K`;
   }
   return `$${value.toFixed(0)}`;
 };
 
 const severityStyles = {
   high: 'bg-destructive/10 text-destructive border-destructive',
   medium: 'bg-warning/10 text-warning border-warning',
   low: 'bg-info/10 text-info border-info',
 };
 
 const dataTypeLabels: Record<StaleDataAlert['dataType'], string> = {
   curve: 'Curve',
   price: 'Price',
   fx_rate: 'FX Rate',
   volatility: 'Volatility',
 };
 
 export const StaleDataAlerts = ({ alerts }: StaleDataAlertsProps) => {
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2 text-lg">
           <AlertTriangle className="h-5 w-5 text-warning" />
           Stale Data Alerts
           {alerts.length > 0 && (
             <Badge variant="secondary">{alerts.length}</Badge>
           )}
         </CardTitle>
       </CardHeader>
       <CardContent>
         {alerts.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
             <AlertTriangle className="h-10 w-10 mb-2 opacity-50" />
             <p>No stale data alerts</p>
           </div>
         ) : (
           <div className="space-y-3 max-h-[400px] overflow-y-auto">
             {alerts.map((alert) => (
               <div
                 key={alert.id}
                 className={`p-3 rounded-lg border ${severityStyles[alert.severity]}`}
               >
                 <div className="flex items-start justify-between gap-2">
                   <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                       <Badge variant="outline" className="text-xs">
                         {dataTypeLabels[alert.dataType]}
                       </Badge>
                       <Badge 
                         variant="outline" 
                         className={`text-xs ${
                           alert.severity === 'high' ? 'border-destructive text-destructive' :
                           alert.severity === 'medium' ? 'border-warning text-warning' :
                           'border-info text-info'
                         }`}
                       >
                         {alert.severity.toUpperCase()}
                       </Badge>
                     </div>
                     <p className="font-medium text-sm">{alert.identifier}</p>
                     <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                       <span className="flex items-center gap-1">
                         <Clock className="h-3 w-3" />
                         {formatDistanceToNow(new Date(alert.lastUpdate), { addSuffix: true })}
                       </span>
                       <span className="flex items-center gap-1">
                         <DollarSign className="h-3 w-3" />
                         Est. impact: {formatCurrency(alert.estimatedPnLImpact)}
                       </span>
                     </div>
                   </div>
                 </div>
                 {alert.affectedBooks.length > 0 && (
                   <div className="flex flex-wrap gap-1 mt-2">
                     {alert.affectedBooks.slice(0, 4).map((book) => (
                       <Badge key={book} variant="secondary" className="text-xs">
                         {book}
                       </Badge>
                     ))}
                     {alert.affectedBooks.length > 4 && (
                       <Badge variant="secondary" className="text-xs">
                         +{alert.affectedBooks.length - 4}
                       </Badge>
                     )}
                   </div>
                 )}
               </div>
             ))}
           </div>
         )}
       </CardContent>
     </Card>
   );
 };