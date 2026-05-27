import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRight, Plus, GripVertical, Pencil, Copy, Trash2 } from 'lucide-react';
import { StudioMapping } from '@/hooks/useStudio';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  archived: 'bg-muted text-muted-foreground/60',
};

interface Props {
  mappings: StudioMapping[];
}

export const MappingBuilder = ({ mappings }: Props) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">Field Mappings</h3>
        <p className="text-sm text-muted-foreground">Configure source-to-target field mappings with transforms</p>
      </div>
      <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Mapping</Button>
    </div>

    <div className="grid gap-4">
      {mappings.map((mapping) => (
        <Card key={mapping.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">{mapping.name}</CardTitle>
                <Badge className={cn('text-xs', statusColors[mapping.status])}>{mapping.status}</Badge>
                <Badge variant="outline" className="text-xs">v{mapping.version}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Copy className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{mapping.description}</p>
            <div className="flex items-center gap-2 text-xs mt-1">
              <Badge variant="secondary">{mapping.sourceSystem}</Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge variant="secondary">{mapping.targetSystem}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Source Field</TableHead>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Target Field</TableHead>
                  <TableHead>Transform</TableHead>
                  <TableHead className="w-20">Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mapping.fieldMappings.map((fm) => (
                  <TableRow key={fm.id} className="group cursor-grab">
                    <TableCell><GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground" /></TableCell>
                    <TableCell className="font-mono text-sm">{fm.sourceField}</TableCell>
                    <TableCell><ArrowRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                    <TableCell className="font-mono text-sm">{fm.targetField}</TableCell>
                    <TableCell>
                      {fm.transform ? (
                        <Badge variant="outline" className="font-mono text-xs">{fm.transform}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {fm.required ? (
                        <Badge className="bg-amber-500/10 text-amber-600 text-xs">required</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">optional</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  </motion.div>
);
