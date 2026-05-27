 import { useState } from 'react';
 import { User, Bot, Settings, Clock, Filter, ExternalLink } from 'lucide-react';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Avatar, AvatarFallback } from '@/components/ui/avatar';
 import { cn } from '@/lib/utils';
 import { format, parseISO } from 'date-fns';
 import type { UserActivity } from '@/hooks/useAuditExplainability';
 
 interface UserActivityTrailProps {
   activities: UserActivity[];
 }
 
 const actionColors: Record<string, string> = {
   EXCEPTION_RESOLVED: 'bg-success/10 text-success',
   AMENDMENT_APPROVED: 'bg-blue-500/10 text-blue-600',
   AMENDMENT_REJECTED: 'bg-destructive/10 text-destructive',
   RECON_RUN_COMPLETED: 'bg-purple-500/10 text-purple-600',
   BULK_ASSIGN: 'bg-amber-500/10 text-amber-600',
   DATA_LOAD: 'bg-cyan-500/10 text-cyan-600',
   REPORT_EXPORTED: 'bg-emerald-500/10 text-emerald-600',
   MATCH_PROPOSED: 'bg-indigo-500/10 text-indigo-600',
   PERIOD_LOCKED: 'bg-rose-500/10 text-rose-600',
 };
 
 const moduleColors: Record<string, string> = {
   Exceptions: 'border-orange-200 text-orange-600',
   Amendments: 'border-blue-200 text-blue-600',
   Reconciliations: 'border-purple-200 text-purple-600',
   'Match Review': 'border-green-200 text-green-600',
   'Data Loads': 'border-cyan-200 text-cyan-600',
   Reports: 'border-emerald-200 text-emerald-600',
   'AI Recon Agent': 'border-indigo-200 text-indigo-600',
   'Close Management': 'border-rose-200 text-rose-600',
   System: 'border-gray-200 text-gray-600',
 };
 
 export function UserActivityTrail({ activities }: UserActivityTrailProps) {
   const [moduleFilter, setModuleFilter] = useState<string>('all');
   const [actorFilter, setActorFilter] = useState<string>('all');
 
   // Get unique modules and actors
   const modules = [...new Set(activities.map(a => a.module))];
   const actors = [...new Set(activities.map(a => a.userName))];
 
   const filteredActivities = activities.filter(activity => {
     if (moduleFilter !== 'all' && activity.module !== moduleFilter) return false;
     if (actorFilter !== 'all' && activity.userName !== actorFilter) return false;
     return true;
   });
 
   const getActorIcon = (userName: string) => {
     if (userName === 'System') return <Settings className="h-4 w-4" />;
     if (userName === 'AI Agent') return <Bot className="h-4 w-4" />;
     return <User className="h-4 w-4" />;
   };
 
   const getActorInitials = (userName: string) => {
     if (userName === 'System') return 'SYS';
     if (userName === 'AI Agent') return 'AI';
     return userName.split(' ').map(n => n[0]).join('').toUpperCase();
   };
 
   return (
     <div className="space-y-4">
       {/* Filters */}
       <div className="flex items-center gap-3">
         <Filter className="h-4 w-4 text-muted-foreground" />
         <Select value={moduleFilter} onValueChange={setModuleFilter}>
           <SelectTrigger className="w-[160px]">
             <SelectValue placeholder="Module" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">All Modules</SelectItem>
             {modules.map(module => (
               <SelectItem key={module} value={module}>{module}</SelectItem>
             ))}
           </SelectContent>
         </Select>
         <Select value={actorFilter} onValueChange={setActorFilter}>
           <SelectTrigger className="w-[160px]">
             <SelectValue placeholder="Actor" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">All Actors</SelectItem>
             {actors.map(actor => (
               <SelectItem key={actor} value={actor}>{actor}</SelectItem>
             ))}
           </SelectContent>
         </Select>
         <span className="text-sm text-muted-foreground ml-auto">
           {filteredActivities.length} activities
         </span>
       </div>
 
       {/* Activity Timeline */}
       <div className="rounded-lg border bg-card">
         <Table>
           <TableHeader>
             <TableRow className="bg-muted/50">
               <TableHead className="w-[180px]">Timestamp</TableHead>
               <TableHead>Actor</TableHead>
               <TableHead>Action</TableHead>
               <TableHead>Module</TableHead>
               <TableHead>Entity</TableHead>
               <TableHead>Details</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {filteredActivities.slice(0, 50).map((activity) => (
               <TableRow key={activity.id} className="hover:bg-muted/30">
                 <TableCell>
                   <div className="flex items-center gap-2 text-sm">
                     <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                     <span className="text-muted-foreground">
                       {format(parseISO(activity.timestamp), 'MMM dd, HH:mm:ss')}
                     </span>
                   </div>
                 </TableCell>
                 <TableCell>
                   <div className="flex items-center gap-2">
                     <Avatar className="h-7 w-7">
                       <AvatarFallback className="text-xs bg-muted">
                         {getActorInitials(activity.userName)}
                       </AvatarFallback>
                     </Avatar>
                     <span className="text-sm font-medium">{activity.userName}</span>
                   </div>
                 </TableCell>
                 <TableCell>
                   <Badge 
                     variant="outline" 
                     className={cn('text-xs', actionColors[activity.action] || 'bg-muted')}
                   >
                     {activity.action.replace(/_/g, ' ')}
                   </Badge>
                 </TableCell>
                 <TableCell>
                   <Badge 
                     variant="outline" 
                     className={cn('text-xs', moduleColors[activity.module])}
                   >
                     {activity.module}
                   </Badge>
                 </TableCell>
                 <TableCell>
                   {activity.entityId && (
                     <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                       {activity.entityId}
                     </code>
                   )}
                 </TableCell>
                 <TableCell className="max-w-[300px]">
                   <p className="text-sm text-muted-foreground truncate" title={activity.details}>
                     {activity.details}
                   </p>
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
       </div>
 
       {/* Activity Stats */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="p-4 rounded-lg bg-muted/50">
           <p className="text-sm text-muted-foreground">Total Activities</p>
           <p className="text-2xl font-bold">{activities.length}</p>
         </div>
         <div className="p-4 rounded-lg bg-muted/50">
           <p className="text-sm text-muted-foreground">Unique Users</p>
           <p className="text-2xl font-bold">{actors.filter(a => a !== 'System' && a !== 'AI Agent').length}</p>
         </div>
         <div className="p-4 rounded-lg bg-muted/50">
           <p className="text-sm text-muted-foreground">AI Actions</p>
           <p className="text-2xl font-bold">{activities.filter(a => a.userName === 'AI Agent').length}</p>
         </div>
         <div className="p-4 rounded-lg bg-muted/50">
           <p className="text-sm text-muted-foreground">System Events</p>
           <p className="text-2xl font-bold">{activities.filter(a => a.userName === 'System').length}</p>
         </div>
       </div>
     </div>
   );
 }