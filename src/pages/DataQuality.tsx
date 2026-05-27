 import { useState } from 'react';
 import { ShieldCheck, FileCheck, TrendingUp, ClipboardList } from 'lucide-react';
 import { PageHeader } from '@/components/ui/page-header';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Skeleton } from '@/components/ui/skeleton';
 import { DataQualityFilters } from '@/components/data-quality/DataQualityFilters';
 import { DataQualityScorecards } from '@/components/data-quality/DataQualityScorecards';
 import { QualityRulesTable } from '@/components/data-quality/QualityRulesTable';
 import { QualityTrendsChart } from '@/components/data-quality/QualityTrendsChart';
 import { QualityAuditLog } from '@/components/data-quality/QualityAuditLog';
 import { useDataQuality, type DataQualityFilters as Filters } from '@/hooks/useDataQuality';
 
 export default function DataQuality() {
   const [filters, setFilters] = useState<Filters>({});
   const { data, isLoading } = useDataQuality(filters);
 
   if (isLoading) {
     return (
       <div className="space-y-6">
         <PageHeader
           title="Data Quality & Controls"
           description="Monitor data quality metrics, rule-based checks, and audit-ready logs"
         />
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {[...Array(4)].map((_, i) => (
             <Card key={i}>
               <CardContent className="pt-6">
                 <Skeleton className="h-24 w-full" />
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
         title="Data Quality & Controls"
         description="Monitor data quality metrics, rule-based checks, and audit-ready logs for trading data governance"
       />
 
       {/* Filters */}
       <Card>
         <CardContent className="pt-6">
           <DataQualityFilters
             filters={filters}
             onFiltersChange={setFilters}
             legalEntities={data?.legalEntities || []}
             sourceSystems={data?.sourceSystems || []}
           />
         </CardContent>
       </Card>
 
       {/* Scorecards */}
       {data && (
         <DataQualityScorecards
           scores={data.scores}
           overallScore={data.overallScore}
           totalRecords={data.totalRecords}
           totalIssues={data.totalIssues}
         />
       )}
 
       {/* Tabbed Content */}
       <Tabs defaultValue="rules" className="space-y-4">
         <TabsList>
           <TabsTrigger value="rules" className="flex items-center gap-2">
             <FileCheck className="h-4 w-4" />
             Quality Rules
           </TabsTrigger>
           <TabsTrigger value="trends" className="flex items-center gap-2">
             <TrendingUp className="h-4 w-4" />
             Historical Trends
           </TabsTrigger>
           <TabsTrigger value="audit" className="flex items-center gap-2">
             <ClipboardList className="h-4 w-4" />
             Audit Log
           </TabsTrigger>
         </TabsList>
 
         <TabsContent value="rules">
           <Card>
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                 <ShieldCheck className="h-5 w-5" />
                 Rule-Based Quality Checks
               </CardTitle>
             </CardHeader>
             <CardContent>
               {data && (
                 <QualityRulesTable 
                   rules={data.rules} 
                   qualityDimension={filters.qualityDimension}
                 />
               )}
             </CardContent>
           </Card>
         </TabsContent>
 
         <TabsContent value="trends">
           {data && (
             <QualityTrendsChart 
               trends={data.trends}
               qualityDimension={filters.qualityDimension}
             />
           )}
         </TabsContent>
 
         <TabsContent value="audit">
           <Card>
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                 <ClipboardList className="h-5 w-5" />
                 Quality Issue Audit Trail
               </CardTitle>
             </CardHeader>
             <CardContent>
               {data && <QualityAuditLog auditLog={data.auditLog} />}
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>
     </div>
   );
 }