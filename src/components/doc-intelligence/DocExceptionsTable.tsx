import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, ListTodo } from 'lucide-react';
import type { DocException } from '@/hooks/useDocumentIntelligence';

const severityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'destructive',
  investigating: 'secondary',
  resolved: 'default',
  escalated: 'destructive',
};

const typeLabels: Record<string, string> = {
  term_mismatch: 'Term Mismatch',
  missing_clause: 'Missing Clause',
  spec_deviation: 'Spec Deviation',
  pricing_error: 'Pricing Error',
};

export const DocExceptionsTable = ({ exceptions }: { exceptions: DocException[] }) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exceptions.map(ex => (
          <TableRow key={ex.id}>
            <TableCell className="font-mono text-xs">{ex.id}</TableCell>
            <TableCell><Badge variant="outline">{typeLabels[ex.exceptionType]}</Badge></TableCell>
            <TableCell className="max-w-[300px] truncate text-sm">{ex.description}</TableCell>
            <TableCell><Badge variant={severityVariant[ex.severity]}>{ex.severity}</Badge></TableCell>
            <TableCell><Badge variant={statusVariant[ex.status]}>{ex.status}</Badge></TableCell>
            <TableCell className="text-right space-x-1">
              <Button variant="ghost" size="sm" title="Accept Fix"><CheckCircle className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" title="Create Task"><ListTodo className="h-4 w-4" /></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
