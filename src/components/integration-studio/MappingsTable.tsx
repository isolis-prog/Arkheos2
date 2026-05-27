import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, Eye } from 'lucide-react';
import type { MappingVersion } from '@/hooks/useIntegrationStudio';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline', testing: 'secondary', approved: 'default', published: 'default', deprecated: 'destructive',
};

export const MappingsTable = ({ mappings }: { mappings: MappingVersion[] }) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mapping</TableHead>
          <TableHead>Instance</TableHead>
          <TableHead>Source → Target</TableHead>
          <TableHead className="text-center">Fields</TableHead>
          <TableHead>Template</TableHead>
          <TableHead className="text-center">v</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mappings.map(m => (
          <TableRow key={m.id}>
            <TableCell className="font-medium text-sm">{m.mappingName}</TableCell>
            <TableCell className="text-sm">{m.instanceName}</TableCell>
            <TableCell className="font-mono text-xs">{m.sourceObject} → {m.targetObject}</TableCell>
            <TableCell className="text-center">{m.fieldMappings.length}</TableCell>
            <TableCell>{m.commodityTemplate ? <Badge variant="outline">{m.commodityTemplate}</Badge> : '—'}</TableCell>
            <TableCell className="text-center font-mono">{m.versionNumber}</TableCell>
            <TableCell><Badge variant={statusVariant[m.status]}>{m.status}</Badge></TableCell>
            <TableCell className="text-right space-x-1">
              <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
              {m.status !== 'published' && <Button variant="ghost" size="sm" title="Promote"><ArrowUpCircle className="h-4 w-4" /></Button>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
