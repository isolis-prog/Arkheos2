 import { useState } from 'react';
 import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
 import { cn } from '@/lib/utils';
 import { format } from 'date-fns';
 import type { QualityRule } from '@/hooks/useDataQuality';
 
 interface QualityRulesTableProps {
   rules: QualityRule[];
   qualityDimension?: string;
 }
 
 const dimensionColors: Record<string, string> = {
   completeness: 'bg-blue-500/10 text-blue-600 border-blue-200',
   validity: 'bg-purple-500/10 text-purple-600 border-purple-200',
   timeliness: 'bg-amber-500/10 text-amber-600 border-amber-200',
   consistency: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
 };
 
 const severityColors: Record<string, string> = {
   low: 'bg-muted text-muted-foreground',
   medium: 'bg-warning/10 text-warning border-warning/20',
   high: 'bg-destructive/10 text-destructive border-destructive/20',
 };
 
 const statusIcons = {
   passed: <CheckCircle2 className="h-4 w-4 text-success" />,
   warning: <AlertTriangle className="h-4 w-4 text-warning" />,
   failed: <XCircle className="h-4 w-4 text-destructive" />,
 };
 
 export function QualityRulesTable({ rules, qualityDimension }: QualityRulesTableProps) {
   const [sortField, setSortField] = useState<'passRate' | 'failCount' | 'severity'>('failCount');
   const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
 
   const filteredRules = qualityDimension && qualityDimension !== 'all'
     ? rules.filter(r => r.dimension === qualityDimension)
     : rules;
 
   const sortedRules = [...filteredRules].sort((a, b) => {
     let comparison = 0;
     
     if (sortField === 'passRate') {
       comparison = a.passRate - b.passRate;
     } else if (sortField === 'failCount') {
       comparison = a.failCount - b.failCount;
     } else if (sortField === 'severity') {
       const severityOrder = { low: 1, medium: 2, high: 3 };
       comparison = severityOrder[a.severity] - severityOrder[b.severity];
     }
     
     return sortDirection === 'asc' ? comparison : -comparison;
   });
 
   const toggleSort = (field: typeof sortField) => {
     if (sortField === field) {
       setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
     } else {
       setSortField(field);
       setSortDirection('desc');
     }
   };
 
   const SortIcon = ({ field }: { field: typeof sortField }) => {
     if (sortField !== field) return null;
     return sortDirection === 'asc' ? 
       <ChevronUp className="h-3 w-3 ml-1" /> : 
       <ChevronDown className="h-3 w-3 ml-1" />;
   };
 
   return (
     <div className="rounded-lg border bg-card">
       <Table>
         <TableHeader>
           <TableRow className="bg-muted/50">
             <TableHead className="w-[40px]">Status</TableHead>
             <TableHead>Rule Name</TableHead>
             <TableHead>Dimension</TableHead>
             <TableHead>Field</TableHead>
             <TableHead>Condition</TableHead>
             <TableHead>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-auto p-0 font-medium hover:bg-transparent"
                 onClick={() => toggleSort('severity')}
               >
                 Severity
                 <SortIcon field="severity" />
               </Button>
             </TableHead>
             <TableHead className="text-right">
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-auto p-0 font-medium hover:bg-transparent"
                 onClick={() => toggleSort('passRate')}
               >
                 Pass Rate
                 <SortIcon field="passRate" />
               </Button>
             </TableHead>
             <TableHead className="text-right">
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-auto p-0 font-medium hover:bg-transparent"
                 onClick={() => toggleSort('failCount')}
               >
                 Failed
                 <SortIcon field="failCount" />
               </Button>
             </TableHead>
             <TableHead className="text-right">Last Run</TableHead>
           </TableRow>
         </TableHeader>
         <TableBody>
           {sortedRules.map((rule) => (
             <TableRow key={rule.id} className="hover:bg-muted/30">
               <TableCell>
                 <Tooltip>
                   <TooltipTrigger>
                     {statusIcons[rule.status]}
                   </TooltipTrigger>
                   <TooltipContent>
                     {rule.status === 'passed' && 'All checks passed'}
                     {rule.status === 'warning' && 'Some checks failed'}
                     {rule.status === 'failed' && 'Critical failures detected'}
                   </TooltipContent>
                 </Tooltip>
               </TableCell>
               <TableCell>
                 <div className="flex items-center gap-2">
                   <span className="font-medium">{rule.name}</span>
                   <Tooltip>
                     <TooltipTrigger>
                       <Info className="h-3.5 w-3.5 text-muted-foreground" />
                     </TooltipTrigger>
                     <TooltipContent className="max-w-[300px]">
                       {rule.description}
                     </TooltipContent>
                   </Tooltip>
                 </div>
               </TableCell>
               <TableCell>
                 <Badge variant="outline" className={cn('capitalize', dimensionColors[rule.dimension])}>
                   {rule.dimension}
                 </Badge>
               </TableCell>
               <TableCell>
                 <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{rule.field}</code>
               </TableCell>
               <TableCell className="text-sm text-muted-foreground">{rule.condition}</TableCell>
               <TableCell>
                 <Badge variant="outline" className={cn('capitalize', severityColors[rule.severity])}>
                   {rule.severity}
                 </Badge>
               </TableCell>
               <TableCell className="text-right">
                 <span className={cn(
                   'font-medium',
                   rule.passRate >= 99 ? 'text-success' :
                   rule.passRate >= 90 ? 'text-warning' : 'text-destructive'
                 )}>
                   {rule.passRate.toFixed(1)}%
                 </span>
               </TableCell>
               <TableCell className="text-right">
                 <span className={cn(
                   'font-medium',
                   rule.failCount > 0 ? 'text-destructive' : 'text-muted-foreground'
                 )}>
                   {rule.failCount.toLocaleString()}
                 </span>
               </TableCell>
               <TableCell className="text-right text-sm text-muted-foreground">
                 {format(new Date(rule.lastRun), 'HH:mm')}
               </TableCell>
             </TableRow>
           ))}
         </TableBody>
       </Table>
     </div>
   );
 }