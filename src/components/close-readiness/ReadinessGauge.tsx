 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { CloseReadinessSummary } from '@/hooks/useCloseReadiness';
 import { Target, CheckCircle2, AlertTriangle } from 'lucide-react';
 
 interface ReadinessGaugeProps {
   summary: CloseReadinessSummary;
 }
 
 export const ReadinessGauge = ({ summary }: ReadinessGaugeProps) => {
   const percentage = summary.overallCompletionPct;
   const radius = 80;
   const circumference = 2 * Math.PI * radius;
   const offset = circumference - (percentage / 100) * circumference;
 
   const getColor = () => {
     if (percentage >= 90) return 'hsl(var(--success))';
     if (percentage >= 70) return 'hsl(var(--warning))';
     return 'hsl(var(--destructive))';
   };
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2 text-lg">
           <Target className="h-5 w-5" />
           Close Readiness
         </CardTitle>
       </CardHeader>
       <CardContent className="flex flex-col items-center">
         <div className="relative">
           <svg width="200" height="200" className="-rotate-90">
             <circle
               cx="100"
               cy="100"
               r={radius}
               fill="none"
               stroke="hsl(var(--muted))"
               strokeWidth="12"
             />
             <circle
               cx="100"
               cy="100"
               r={radius}
               fill="none"
               stroke={getColor()}
               strokeWidth="12"
               strokeLinecap="round"
               strokeDasharray={circumference}
               strokeDashoffset={offset}
               className="transition-all duration-1000 ease-out"
             />
           </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center">
             <span className="text-4xl font-bold">{percentage.toFixed(0)}%</span>
             <span className="text-sm text-muted-foreground">Complete</span>
           </div>
         </div>
 
         <div className="mt-4 flex items-center gap-2">
           {summary.isOnTrack ? (
             <>
               <CheckCircle2 className="h-5 w-5 text-success" />
               <span className="font-medium text-success">On Track for Close</span>
             </>
           ) : (
             <>
               <AlertTriangle className="h-5 w-5 text-warning" />
               <span className="font-medium text-warning">Action Required</span>
             </>
           )}
         </div>
 
         <div className="mt-4 text-center text-sm text-muted-foreground">
           <p>Target Close: {summary.estimatedCloseDate}</p>
           <p>{summary.daysToClose} days remaining</p>
         </div>
       </CardContent>
     </Card>
   );
 };