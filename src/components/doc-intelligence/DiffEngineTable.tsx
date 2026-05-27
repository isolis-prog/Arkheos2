import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { DocDiff } from '@/hooks/useDocumentIntelligence';

const severityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'destructive',
  accepted: 'default',
  rejected: 'secondary',
  fixed: 'default',
};

const diffTypeLabels: Record<string, string> = {
  mismatch: 'Mismatch',
  missing_in_doc: 'Missing in Doc',
  missing_in_deal: 'Missing in Deal',
  value_drift: 'Value Drift',
};

export const DiffEngineTable = ({ diffs }: { diffs: DocDiff[] }) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Field</TableHead>
          <TableHead>Doc Value</TableHead>
          <TableHead>Deal Value</TableHead>
          <TableHead>Diff Type</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {diffs.map(d => (
          <TableRow key={d.id}>
            <TableCell className="font-mono text-xs">{d.id}</TableCell>
            <TableCell className="font-medium">{d.fieldName}</TableCell>
            <TableCell className="text-sm">{d.docValue || <span className="text-muted-foreground italic">—</span>}</TableCell>
            <TableCell className="text-sm">{d.dealValue || <span className="text-muted-foreground italic">—</span>}</TableCell>
            <TableCell><Badge variant="outline">{diffTypeLabels[d.diffType]}</Badge></TableCell>
            <TableCell><Badge variant={severityVariant[d.severity]}>{d.severity}</Badge></TableCell>
            <TableCell><Badge variant={statusVariant[d.status]}>{d.status}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
