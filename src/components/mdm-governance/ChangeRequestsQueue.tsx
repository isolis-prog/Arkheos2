import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { format } from 'date-fns';
import type { MDMChangeRequest } from '@/hooks/useMDMGovernance';

const typeLabel: Record<string, string> = { new_mapping: 'New Mapping', update_mapping: 'Update', new_entity: 'New Entity', deactivate: 'Deactivate' };

interface Props { requests: MDMChangeRequest[]; }

export const ChangeRequestsQueue = ({ requests }: Props) => (
  <Card>
    <CardHeader><CardTitle>Mapping Change Requests</CardTitle></CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Entity Type</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Justification</TableHead>
            <TableHead>Requester</TableHead>
            <TableHead>Approver</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map(r => (
            <TableRow key={r.id}>
              <TableCell><StatusBadge variant="info">{typeLabel[r.requestType]}</StatusBadge></TableCell>
              <TableCell className="capitalize">{r.entityType.replace('_', ' ')}</TableCell>
              <TableCell className="font-medium">{r.entityName}</TableCell>
              <TableCell className="max-w-[250px] truncate">{r.justification}</TableCell>
              <TableCell>{r.requesterName} ({r.requesterRole})</TableCell>
              <TableCell>{r.approverName ? `${r.approverName} (${r.approverRole})` : <span className="text-muted-foreground">{r.approverRole}</span>}</TableCell>
              <TableCell>
                <StatusBadge variant={r.status === 'approved' || r.status === 'implemented' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}>
                  {r.status}
                </StatusBadge>
              </TableCell>
              <TableCell>{format(new Date(r.createdAt), 'MMM dd')}</TableCell>
              <TableCell>
                {r.status === 'pending' && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600"><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><X className="h-4 w-4" /></Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);
