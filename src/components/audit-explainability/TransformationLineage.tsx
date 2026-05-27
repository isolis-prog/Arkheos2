 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { ArrowRight, Database, Cog, BarChart3, FileOutput } from 'lucide-react';
 import { format, parseISO } from 'date-fns';
 import { cn } from '@/lib/utils';
 import type { LineageNode, LineageEdge } from '@/hooks/useAuditExplainability';
 
 interface TransformationLineageProps {
   nodes: LineageNode[];
   edges: LineageEdge[];
 }
 
 const typeIcons = {
   source: Database,
   transformation: Cog,
   aggregation: BarChart3,
   output: FileOutput,
 };
 
 const typeColors = {
   source: 'border-blue-500 bg-blue-500/10',
   transformation: 'border-amber-500 bg-amber-500/10',
   aggregation: 'border-purple-500 bg-purple-500/10',
   output: 'border-emerald-500 bg-emerald-500/10',
 };
 
 const typeLabelColors = {
   source: 'bg-blue-500/10 text-blue-600',
   transformation: 'bg-amber-500/10 text-amber-600',
   aggregation: 'bg-purple-500/10 text-purple-600',
   output: 'bg-emerald-500/10 text-emerald-600',
 };
 
 export function TransformationLineage({ nodes, edges }: TransformationLineageProps) {
   // Group nodes by type for visual layout
   const sourceNodes = nodes.filter(n => n.type === 'source');
   const transformNodes = nodes.filter(n => n.type === 'transformation');
   const aggregationNodes = nodes.filter(n => n.type === 'aggregation');
   const outputNodes = nodes.filter(n => n.type === 'output');
 
   const getEdgesFrom = (nodeId: string) => edges.filter(e => e.from === nodeId);
   const getEdgesTo = (nodeId: string) => edges.filter(e => e.to === nodeId);
 
   const NodeCard = ({ node }: { node: LineageNode }) => {
     const Icon = typeIcons[node.type];
     const incomingEdges = getEdgesTo(node.id);
     const outgoingEdges = getEdgesFrom(node.id);
     
     return (
       <div className={cn(
         'p-4 rounded-lg border-2 bg-card transition-all hover:shadow-md',
         typeColors[node.type]
       )}>
         <div className="flex items-start gap-3">
           <div className={cn('p-2 rounded-lg', typeLabelColors[node.type])}>
             <Icon className="h-5 w-5" />
           </div>
           <div className="flex-1 min-w-0">
             <p className="font-medium text-sm truncate">{node.name}</p>
             <p className="text-xs text-muted-foreground">{node.system}</p>
           </div>
         </div>
         <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
           <div>
             <p className="text-muted-foreground">Records</p>
             <p className="font-medium">{node.recordCount.toLocaleString()}</p>
           </div>
           <div>
             <p className="text-muted-foreground">Updated</p>
             <p className="font-medium">{format(parseISO(node.lastUpdated), 'HH:mm')}</p>
           </div>
         </div>
         {outgoingEdges.length > 0 && (
           <div className="mt-2 pt-2 border-t border-border/50">
             {outgoingEdges.slice(0, 2).map((edge, idx) => (
               <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                 <ArrowRight className="h-3 w-3" />
                 <span>{edge.transformationType}</span>
                 <span className="ml-auto">{edge.recordsProcessed.toLocaleString()}</span>
               </div>
             ))}
           </div>
         )}
       </div>
     );
   };
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="text-base">Data Transformation Lineage</CardTitle>
         <p className="text-sm text-muted-foreground">
           Visual representation of data flow from source systems to output metrics
         </p>
       </CardHeader>
       <CardContent>
         {/* Legend */}
         <div className="flex flex-wrap gap-3 mb-6">
           {Object.entries(typeIcons).map(([type, Icon]) => (
             <div key={type} className="flex items-center gap-2 text-sm">
               <div className={cn('p-1.5 rounded', typeLabelColors[type as keyof typeof typeLabelColors])}>
                 <Icon className="h-3.5 w-3.5" />
               </div>
               <span className="capitalize">{type}</span>
             </div>
           ))}
         </div>
 
         {/* Lineage Flow */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
           {/* Sources */}
           <div className="space-y-3">
             <div className="flex items-center gap-2 mb-3">
               <Badge variant="outline" className={typeLabelColors.source}>Sources</Badge>
               <span className="text-xs text-muted-foreground">{sourceNodes.length}</span>
             </div>
             {sourceNodes.map(node => (
               <NodeCard key={node.id} node={node} />
             ))}
           </div>
 
           {/* Arrow */}
           <div className="hidden md:flex items-center justify-center">
             <ArrowRight className="h-6 w-6 text-muted-foreground" />
           </div>
 
           {/* Transformations */}
           <div className="space-y-3">
             <div className="flex items-center gap-2 mb-3">
               <Badge variant="outline" className={typeLabelColors.transformation}>Transformations</Badge>
               <span className="text-xs text-muted-foreground">{transformNodes.length}</span>
             </div>
             {transformNodes.map(node => (
               <NodeCard key={node.id} node={node} />
             ))}
           </div>
 
           {/* Outputs */}
           <div className="space-y-3">
             <div className="flex items-center gap-2 mb-3">
               <Badge variant="outline" className={typeLabelColors.output}>Outputs</Badge>
               <span className="text-xs text-muted-foreground">{aggregationNodes.length + outputNodes.length}</span>
             </div>
             {aggregationNodes.map(node => (
               <NodeCard key={node.id} node={node} />
             ))}
             {outputNodes.map(node => (
               <NodeCard key={node.id} node={node} />
             ))}
           </div>
         </div>
 
         {/* Edge Summary */}
         <div className="mt-6 pt-4 border-t">
           <p className="text-sm font-medium mb-3">Transformation Summary</p>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {edges.slice(0, 8).map((edge, idx) => (
               <div key={idx} className="p-3 rounded-lg bg-muted/50 text-sm">
                 <p className="font-medium truncate">{edge.transformationType}</p>
                 <p className="text-muted-foreground text-xs">
                   {edge.recordsProcessed.toLocaleString()} records
                 </p>
               </div>
             ))}
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }