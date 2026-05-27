 import { useState } from 'react';
 import { AlertCircle, CheckCircle2, Clock, Eye, Filter } from 'lucide-react';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { cn } from '@/lib/utils';
 import { format, parseISO } from 'date-fns';
 import type { QualityAuditEntry } from '@/hooks/useDataQuality';
 
 interface QualityAuditLogProps {
   auditLog: QualityAuditEntry[];
 }
 
 const statusIcons = {
   open: <AlertCircle className="h-4 w-4 text-destructive" />,
   acknowledged: <Clock className="h-4 w-4 text-warning" />,
   resolved: <CheckCircle2 className="h-4 w-4 text-success" />,
 };
 
 const statusColors = {
   open: 'bg-destructive/10 text-destructive border-destructive/20',
   acknowledged: 'bg-warning/10 text-warning border-warning/20',
   resolved: 'bg-success/10 text-success border-success/20',
 };
 
 const severityColors = {
   low: 'bg-muted text-muted-foreground',
   medium: 'bg-warning/10 text-warning',
   high: 'bg-destructive/10 text-destructive',
 };
 
 const dimensionColors: Record<string, string> = {
   completeness: 'bg-blue-500/10 text-blue-600',
   validity: 'bg-purple-500/10 text-purple-600',
   timeliness: 'bg-amber-500/10 text-amber-600',
   consistency: 'bg-emerald-500/10 text-emerald-600',
 };
 
 export function QualityAuditLog({ auditLog }: QualityAuditLogProps) {
   const [statusFilter, setStatusFilter] = useState<string>('all');
   const [severityFilter, setSeverityFilter] = useState<string>('all');
   const [selectedEntry, setSelectedEntry] = useState<QualityAuditEntry | null>(null);
 
   const filteredLog = auditLog.filter(entry => {
     if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
     if (severityFilter !== 'all' && entry.severity !== severityFilter) return false;
     return true;
   });
 
   const openCount = auditLog.filter(e => e.status === 'open').length;
   const acknowledgedCount = auditLog.filter(e => e.status === 'acknowledged').length;
   const resolvedCount = auditLog.filter(e => e.status === 'resolved').length;
 
   return (
     <div className="space-y-4">
       {/* Summary Stats */}
       <div className="flex items-center gap-4 text-sm">
         <div className="flex items-center gap-2">
           <AlertCircle className="h-4 w-4 text-destructive" />
           <span><strong>{openCount}</strong> Open</span>
         </div>
         <div className="flex items-center gap-2">
           <Clock className="h-4 w-4 text-warning" />
           <span><strong>{acknowledgedCount}</strong> Acknowledged</span>
         </div>
         <div className="flex items-center gap-2">
           <CheckCircle2 className="h-4 w-4 text-success" />
           <span><strong>{resolvedCount}</strong> Resolved</span>
         </div>
       </div>
 
       {/* Filters */}
       <div className="flex items-center gap-3">
         <Filter className="h-4 w-4 text-muted-foreground" />
         <Select value={statusFilter} onValueChange={setStatusFilter}>
           <SelectTrigger className="w-[140px]">
             <SelectValue placeholder="Status" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">All Status</SelectItem>
             <SelectItem value="open">Open</SelectItem>
             <SelectItem value="acknowledged">Acknowledged</SelectItem>
             <SelectItem value="resolved">Resolved</SelectItem>
           </SelectContent>
         </Select>
         <Select value={severityFilter} onValueChange={setSeverityFilter}>
           <SelectTrigger className="w-[140px]">
             <SelectValue placeholder="Severity" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">All Severity</SelectItem>
             <SelectItem value="high">High</SelectItem>
             <SelectItem value="medium">Medium</SelectItem>
             <SelectItem value="low">Low</SelectItem>
           </SelectContent>
         </Select>
         <span className="text-sm text-muted-foreground ml-auto">
           Showing {filteredLog.length} of {auditLog.length} entries
         </span>
       </div>
 
       {/* Audit Table */}
       <div className="rounded-lg border bg-card">
         <Table>
           <TableHeader>
             <TableRow className="bg-muted/50">
               <TableHead className="w-[100px]">Status</TableHead>
               <TableHead className="w-[140px]">Timestamp</TableHead>
               <TableHead>Dimension</TableHead>
               <TableHead>Rule</TableHead>
               <TableHead>Record ID</TableHead>
               <TableHead>Source</TableHead>
               <TableHead>Severity</TableHead>
               <TableHead className="w-[60px]">Details</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {filteredLog.slice(0, 50).map((entry) => (
               <TableRow key={entry.id} className="hover:bg-muted/30">
                 <TableCell>
                   <div className="flex items-center gap-2">
                     {statusIcons[entry.status]}
                     <Badge variant="outline" className={cn('capitalize text-xs', statusColors[entry.status])}>
                       {entry.status}
                     </Badge>
                   </div>
                 </TableCell>
                 <TableCell className="text-sm text-muted-foreground">
                   {format(parseISO(entry.timestamp), 'MMM dd, HH:mm')}
                 </TableCell>
                 <TableCell>
                   <Badge variant="outline" className={cn('capitalize text-xs', dimensionColors[entry.dimension])}>
                     {entry.dimension}
                   </Badge>
                 </TableCell>
                 <TableCell className="font-medium">{entry.rule}</TableCell>
                 <TableCell>
                   <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{entry.recordId}</code>
                 </TableCell>
                 <TableCell className="text-sm">{entry.sourceSystem}</TableCell>
                 <TableCell>
                   <Badge variant="outline" className={cn('capitalize text-xs', severityColors[entry.severity])}>
                     {entry.severity}
                   </Badge>
                 </TableCell>
                 <TableCell>
                   <Dialog>
                     <DialogTrigger asChild>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-8 w-8"
                         onClick={() => setSelectedEntry(entry)}
                       >
                         <Eye className="h-4 w-4" />
                       </Button>
                     </DialogTrigger>
                     <DialogContent>
                       <DialogHeader>
                         <DialogTitle>Quality Issue Details</DialogTitle>
                       </DialogHeader>
                       {selectedEntry && (
                         <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4 text-sm">
                             <div>
                               <p className="text-muted-foreground">Record ID</p>
                               <p className="font-medium">{selectedEntry.recordId}</p>
                             </div>
                             <div>
                               <p className="text-muted-foreground">Source System</p>
                               <p className="font-medium">{selectedEntry.sourceSystem}</p>
                             </div>
                             <div>
                               <p className="text-muted-foreground">Dimension</p>
                               <Badge className={cn('capitalize', dimensionColors[selectedEntry.dimension])}>
                                 {selectedEntry.dimension}
                               </Badge>
                             </div>
                             <div>
                               <p className="text-muted-foreground">Severity</p>
                               <Badge className={cn('capitalize', severityColors[selectedEntry.severity])}>
                                 {selectedEntry.severity}
                               </Badge>
                             </div>
                             <div>
                               <p className="text-muted-foreground">Rule</p>
                               <p className="font-medium">{selectedEntry.rule}</p>
                             </div>
                             <div>
                               <p className="text-muted-foreground">Field</p>
                               <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{selectedEntry.field}</code>
                             </div>
                             <div>
                               <p className="text-muted-foreground">Status</p>
                               <Badge className={cn('capitalize', statusColors[selectedEntry.status])}>
                                 {selectedEntry.status}
                               </Badge>
                             </div>
                             <div>
                               <p className="text-muted-foreground">Detected</p>
                               <p className="font-medium">
                                 {format(parseISO(selectedEntry.timestamp), 'MMM dd, yyyy HH:mm')}
                               </p>
                             </div>
                           </div>
                           <div>
                             <p className="text-muted-foreground text-sm mb-1">Issue Description</p>
                             <p className="p-3 bg-muted rounded-lg text-sm">{selectedEntry.issue}</p>
                           </div>
                         </div>
                       )}
                     </DialogContent>
                   </Dialog>
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
       </div>
     </div>
   );
 }