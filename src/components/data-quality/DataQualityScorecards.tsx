 import { motion } from 'framer-motion';
 import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, TrendingDown, Database, ShieldCheck } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Progress } from '@/components/ui/progress';
 import { cn } from '@/lib/utils';
 import type { QualityScore } from '@/hooks/useDataQuality';
 
 interface DataQualityScorecardsProps {
   scores: QualityScore[];
   overallScore: number;
   totalRecords: number;
   totalIssues: number;
 }
 
 const dimensionIcons: Record<string, typeof CheckCircle2> = {
   Completeness: Database,
   Validity: ShieldCheck,
   Timeliness: TrendingUp,
   Consistency: CheckCircle2,
 };
 
 const statusColors = {
   good: 'text-success',
   warning: 'text-warning',
   critical: 'text-destructive',
 };
 
 const statusBgColors = {
   good: 'bg-success/10',
   warning: 'bg-warning/10',
   critical: 'bg-destructive/10',
 };
 
 const progressColors = {
   good: 'bg-success',
   warning: 'bg-warning',
   critical: 'bg-destructive',
 };
 
 export function DataQualityScorecards({ scores, overallScore, totalRecords, totalIssues }: DataQualityScorecardsProps) {
   const getOverallStatus = (score: number) => {
     if (score >= 95) return 'good';
     if (score >= 80) return 'warning';
     return 'critical';
   };
 
   const overallStatus = getOverallStatus(overallScore);
 
   return (
     <div className="space-y-4">
       {/* Overall Score Card */}
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.3 }}
       >
         <Card className="border-l-4 border-l-primary">
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div className="space-y-2">
                 <p className="text-sm font-medium text-muted-foreground">Overall Data Quality Score</p>
                 <div className="flex items-baseline gap-2">
                   <span className={cn('text-4xl font-bold', statusColors[overallStatus])}>
                     {overallScore}%
                   </span>
                   <span className="text-sm text-muted-foreground">across {totalRecords.toLocaleString()} records</span>
                 </div>
                 <div className="flex items-center gap-4 text-sm">
                   <span className="text-muted-foreground">
                     <span className="font-medium text-foreground">{totalIssues.toLocaleString()}</span> issues detected
                   </span>
                 </div>
               </div>
               <div className={cn('flex h-20 w-20 items-center justify-center rounded-full', statusBgColors[overallStatus])}>
                 {overallStatus === 'good' && <CheckCircle2 className={cn('h-10 w-10', statusColors[overallStatus])} />}
                 {overallStatus === 'warning' && <AlertTriangle className={cn('h-10 w-10', statusColors[overallStatus])} />}
                 {overallStatus === 'critical' && <XCircle className={cn('h-10 w-10', statusColors[overallStatus])} />}
               </div>
             </div>
           </CardContent>
         </Card>
       </motion.div>
 
       {/* Dimension Scorecards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {scores.map((score, index) => {
           const Icon = dimensionIcons[score.dimension] || CheckCircle2;
           
           return (
             <motion.div
               key={score.dimension}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.3, delay: index * 0.1 }}
             >
               <Card>
                 <CardHeader className="pb-2">
                   <div className="flex items-center justify-between">
                     <CardTitle className="text-sm font-medium text-muted-foreground">
                       {score.dimension}
                     </CardTitle>
                     <div className={cn('rounded-full p-1.5', statusBgColors[score.status])}>
                       <Icon className={cn('h-4 w-4', statusColors[score.status])} />
                     </div>
                   </div>
                 </CardHeader>
                 <CardContent className="space-y-3">
                   <div className="flex items-baseline justify-between">
                     <span className={cn('text-2xl font-bold', statusColors[score.status])}>
                       {score.score}%
                     </span>
                     <div className={cn(
                       'flex items-center gap-1 text-xs font-medium',
                       score.trend >= 0 ? 'text-success' : 'text-destructive'
                     )}>
                       {score.trend >= 0 ? (
                         <TrendingUp className="h-3 w-3" />
                       ) : (
                         <TrendingDown className="h-3 w-3" />
                       )}
                       {Math.abs(score.trend)}%
                     </div>
                   </div>
                   
                   <Progress 
                     value={score.score} 
                     className="h-2"
                     // Apply color via indicator
                   />
                   
                   <div className="flex justify-between text-xs text-muted-foreground">
                     <span>{score.issueCount} issues</span>
                     <span>{score.totalRecords} records</span>
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
           );
         })}
       </div>
     </div>
   );
 }