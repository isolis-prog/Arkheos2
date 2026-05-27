import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { EntityMapping } from '@/hooks/useCoreMappings';
import { format } from 'date-fns';

const resultVariant = (r: string) => r === 'match' ? 'success' : r === 'possible' ? 'warning' : 'error';
const methodLabel: Record<string, string> = { exact: 'Exact', fuzzy: 'Fuzzy', manual: 'Manual', rule_based: 'Rule-Based' };

interface Props { mappings: EntityMapping[]; }

export const MappingsTable = ({ mappings }: Props) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Entity Type</TableHead>
          <TableHead>Source System</TableHead>
          <TableHead>Source ID</TableHead>
          <TableHead>Canonical Name</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Confidence</TableHead>
          <TableHead>Result</TableHead>
          <TableHead>Approval</TableHead>
          <TableHead>Why</TableHead>
          <TableHead>Effective</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mappings.length === 0 ? (
          <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No mappings found</TableCell></TableRow>
        ) : mappings.map(m => (
          <TableRow key={m.id}>
            <TableCell className="capitalize font-medium">{m.entityType}</TableCell>
            <TableCell><StatusBadge variant="info">{m.sourceSystem}</StatusBadge></TableCell>
            <TableCell className="font-mono text-xs">{m.sourceId}</TableCell>
            <TableCell>{m.canonicalName}</TableCell>
            <TableCell><StatusBadge variant="default">{methodLabel[m.mappingMethod]}</StatusBadge></TableCell>
            <TableCell>
              <span className={m.confidenceScore >= 0.9 ? 'text-success' : m.confidenceScore >= 0.7 ? 'text-warning' : 'text-destructive'}>
                {Math.round(m.confidenceScore * 100)}%
              </span>
            </TableCell>
            <TableCell><StatusBadge variant={resultVariant(m.matchResult)}>{m.matchResult.replace('_', ' ').toUpperCase()}</StatusBadge></TableCell>
            <TableCell>
              {m.approvedBy ? (
                <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="h-3.5 w-3.5" /> Approved</span>
              ) : (
                <Button variant="outline" size="sm" className="h-7 text-xs">Approve</Button>
              )}
            </TableCell>
            <TableCell>
              <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Info className="h-4 w-4" /></Button></TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(m.explainability, null, 2)}</pre>
                </TooltipContent>
              </Tooltip>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{format(new Date(m.effectiveFrom), 'dd MMM yyyy')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
