import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, Clock, RotateCcw, ArrowUpCircle, GitBranch } from 'lucide-react';
import { StudioVersion } from '@/hooks/useStudio';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const versionStatusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  draft: { icon: <GitBranch className="h-4 w-4" />, color: 'text-muted-foreground', label: 'Draft' },
  pending_approval: { icon: <Clock className="h-4 w-4" />, color: 'text-amber-600', label: 'Pending Approval' },
  approved: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-600', label: 'Approved' },
  rejected: { icon: <XCircle className="h-4 w-4" />, color: 'text-destructive', label: 'Rejected' },
  promoted: { icon: <ArrowUpCircle className="h-4 w-4" />, color: 'text-blue-600', label: 'Promoted' },
  rolled_back: { icon: <RotateCcw className="h-4 w-4" />, color: 'text-muted-foreground', label: 'Rolled Back' },
};

interface Props {
  versions: StudioVersion[];
}

export const VersionGovernance = ({ versions }: Props) => {
  const pending = versions.filter(v => v.status === 'pending_approval');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Version Governance</h3>
        <p className="text-sm text-muted-foreground">Approval workflows, version history, and rollback controls</p>
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">Pending Approvals ({pending.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map(v => (
              <div key={v.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{v.entityName}</span>
                    <Badge variant="outline" className="text-xs capitalize">{v.entityType}</Badge>
                    <Badge variant="secondary" className="text-xs">v{v.versionNumber}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {v.changeReason} — by {v.createdBy} on {format(new Date(v.createdAt), 'MMM dd, HH:mm')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="text-destructive"><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
                  <Button size="sm"><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Version history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Version History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Change Reason</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map(v => {
                const sc = versionStatusConfig[v.status];
                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium text-sm">{v.entityName}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{v.entityType}</Badge></TableCell>
                    <TableCell className="text-sm">v{v.versionNumber}</TableCell>
                    <TableCell>
                      <div className={cn('flex items-center gap-1 text-xs', sc.color)}>
                        {sc.icon}
                        <span>{sc.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{v.changeReason}</TableCell>
                    <TableCell className="text-sm">{v.createdBy}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(v.createdAt), 'MMM dd HH:mm')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {v.status === 'approved' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs"><ArrowUpCircle className="h-3 w-3 mr-1" /> Promote</Button>
                        )}
                        {(v.status === 'promoted' || v.status === 'approved') && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs"><RotateCcw className="h-3 w-3 mr-1" /> Rollback</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};
