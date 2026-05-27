 import { useState } from 'react';
 import { Eye, GitBranch, Clock, Users } from 'lucide-react';
 import { PageHeader } from '@/components/ui/page-header';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Skeleton } from '@/components/ui/skeleton';
 import { AuditExplainabilityFilters } from '@/components/audit-explainability/AuditExplainabilityFilters';
 import { KPIDrillDown } from '@/components/audit-explainability/KPIDrillDown';
 import { SnapshotHistory } from '@/components/audit-explainability/SnapshotHistory';
 import { TransformationLineage } from '@/components/audit-explainability/TransformationLineage';
 import { UserActivityTrail } from '@/components/audit-explainability/UserActivityTrail';
 import { useAuditExplainability, type AuditFilters } from '@/hooks/useAuditExplainability';
 
 export default function AuditExplainability() {
   const [filters, setFilters] = useState<AuditFilters>({});
   const { data, isLoading } = useAuditExplainability(filters);
 
   if (isLoading) {
     return (
       <div className="space-y-6">
         <PageHeader
           title="Audit & Explainability"
           description="Full traceability from KPIs to source data with transformation lineage"
         />
         <div className="grid gap-4">
           {[...Array(3)].map((_, i) => (
             <Card key={i}>
               <CardContent className="pt-6">
                 <Skeleton className="h-32 w-full" />
               </CardContent>
             </Card>
           ))}
         </div>
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       <PageHeader
         title="Audit & Explainability"
         description="Full traceability from KPIs to source data with transformation lineage and user activity trails"
       />
 
       {/* Summary Stats */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-primary/10">
                 <Eye className="h-5 w-5 text-primary" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Tracked KPIs</p>
                 <p className="text-2xl font-bold">{data?.kpis.length || 0}</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-blue-500/10">
                 <GitBranch className="h-5 w-5 text-blue-500" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Lineage Nodes</p>
                 <p className="text-2xl font-bold">{data?.lineageNodes.length || 0}</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-amber-500/10">
                 <Clock className="h-5 w-5 text-amber-500" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Snapshots (30d)</p>
                 <p className="text-2xl font-bold">{data?.snapshots.length || 0}</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-emerald-500/10">
                 <Users className="h-5 w-5 text-emerald-500" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">User Activities</p>
                 <p className="text-2xl font-bold">{data?.userActivities.length || 0}</p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Filters */}
       <Card>
         <CardContent className="pt-6">
           <AuditExplainabilityFilters
             filters={filters}
             onFiltersChange={setFilters}
             modules={data?.modules || []}
             users={data?.users || []}
           />
         </CardContent>
       </Card>
 
       {/* Tabbed Content */}
       <Tabs defaultValue="drilldown" className="space-y-4">
         <TabsList>
           <TabsTrigger value="drilldown" className="flex items-center gap-2">
             <Eye className="h-4 w-4" />
             KPI Drill-Down
           </TabsTrigger>
           <TabsTrigger value="lineage" className="flex items-center gap-2">
             <GitBranch className="h-4 w-4" />
             Transformation Lineage
           </TabsTrigger>
           <TabsTrigger value="snapshots" className="flex items-center gap-2">
             <Clock className="h-4 w-4" />
             Snapshot History
           </TabsTrigger>
           <TabsTrigger value="activity" className="flex items-center gap-2">
             <Users className="h-4 w-4" />
             User Activity
           </TabsTrigger>
         </TabsList>
 
         <TabsContent value="drilldown">
           {data && <KPIDrillDown kpis={data.kpis} />}
         </TabsContent>
 
         <TabsContent value="lineage">
           {data && (
             <TransformationLineage 
               nodes={data.lineageNodes} 
               edges={data.lineageEdges} 
             />
           )}
         </TabsContent>
 
         <TabsContent value="snapshots">
           {data && <SnapshotHistory snapshots={data.snapshots} />}
         </TabsContent>
 
         <TabsContent value="activity">
           <Card>
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                 <Users className="h-5 w-5" />
                 User Activity Audit Trail
               </CardTitle>
             </CardHeader>
             <CardContent>
               {data && <UserActivityTrail activities={data.userActivities} />}
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>
     </div>
   );
 }