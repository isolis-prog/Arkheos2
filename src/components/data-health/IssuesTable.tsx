import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import type { DQIssue } from '@/hooks/useDataHealth';

const severityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'destructive',
  assigned: 'secondary',
  in_progress: 'secondary',
  resolved: 'default',
  ignored: 'outline',
};

const issueTypeLabels: Record<string, string> = {
  missing: 'Missing',
  invalid: 'Invalid',
  duplicate: 'Duplicate',
  stale: 'Stale',
  orphan: 'Orphan',
  mismatch: 'Mismatch',
};

export const IssuesTable = ({ issues }: { issues: DQIssue[] }) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead>Issue Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {issues.map(issue => (
          <TableRow key={issue.id}>
            <TableCell className="font-mono text-xs">{issue.id}</TableCell>
            <TableCell>
              <div>
                <p className="text-sm font-medium capitalize">{issue.entityType}</p>
                <p className="text-xs text-muted-foreground">{issue.entityId}</p>
              </div>
            </TableCell>
            <TableCell><Badge variant="outline">{issueTypeLabels[issue.issueType]}</Badge></TableCell>
            <TableCell className="max-w-[280px] truncate text-sm">{issue.description}</TableCell>
            <TableCell><Badge variant={severityVariant[issue.severity]}>{issue.severity}</Badge></TableCell>
            <TableCell><Badge variant={statusVariant[issue.status]}>{issue.status.replace('_', ' ')}</Badge></TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" title="Assign"><UserPlus className="h-4 w-4" /></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
