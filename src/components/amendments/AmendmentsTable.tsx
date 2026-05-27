import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Play,
  Download,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { AmendmentPlan, useUpdateAmendmentStatus } from '@/hooks/useAmendmentPlans';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AmendmentsTableProps {
  amendments: AmendmentPlan[];
  isLoading: boolean;
  onViewDetails: (amendment: AmendmentPlan) => void;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  proposed: { label: 'Proposed', variant: 'outline' },
  pending_approval: { label: 'Pending Approval', variant: 'secondary' },
  approved: { label: 'Approved', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  executed: { label: 'Executed', variant: 'default' },
  exported: { label: 'Exported', variant: 'default' },
  closed: { label: 'Closed', variant: 'secondary' },
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  CREATE: 'Create',
  UPDATE: 'Update',
  REVERSE_AND_REPOST: 'Reverse & Repost',
  WRITE_OFF: 'Write Off',
};

export const AmendmentsTable = ({
  amendments,
  isLoading,
  onViewDetails,
}: AmendmentsTableProps) => {
  const updateStatus = useUpdateAmendmentStatus();

  const formatCurrency = (amount: unknown) => {
    if (typeof amount !== 'number') return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleApprove = (id: string) => {
    updateStatus.mutate({ id, status: 'approved', approvedBy: 'demo-user' });
  };

  const handleReject = (id: string) => {
    updateStatus.mutate({ id, status: 'rejected' });
  };

  const handleExecute = (id: string) => {
    updateStatus.mutate({ id, status: 'executed' });
  };

  const handleMarkExported = (id: string) => {
    updateStatus.mutate({ id, status: 'exported' });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Action</TableHead>
            <TableHead className="font-semibold">Target</TableHead>
            <TableHead className="font-semibold">Deal ID</TableHead>
            <TableHead className="font-semibold text-right">Amount Change</TableHead>
            <TableHead className="font-semibold">Risk Flags</TableHead>
            <TableHead className="font-semibold">Created</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {amendments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                No amendment proposals found
              </TableCell>
            </TableRow>
          ) : (
            amendments.map((amendment) => {
              const statusConfig = STATUS_CONFIG[amendment.status] || STATUS_CONFIG.proposed;
              const amountChange = amendment.deltaSummary?.amount_change;

              return (
                <TableRow key={amendment.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {ACTION_TYPE_LABELS[amendment.actionType] || amendment.actionType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        amendment.targetSystem === 'netsuite'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                          : 'border-blue-500/30 bg-blue-500/10 text-blue-600'
                      )}
                    >
                      {amendment.targetSystem.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {(amendment.payload?.deal_id as string) || '—'}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium tabular-nums',
                      typeof amountChange === 'number' && amountChange < 0
                        ? 'text-destructive'
                        : 'text-success'
                    )}
                  >
                    {typeof amountChange === 'number'
                      ? `${amountChange >= 0 ? '+' : ''}${formatCurrency(amountChange)}`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {amendment.riskFlags.slice(0, 2).map((flag) => (
                        <Badge key={flag} variant="outline" className="text-xs">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {flag.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {amendment.riskFlags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{amendment.riskFlags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(amendment.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDetails(amendment)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {amendment.status === 'proposed' && (
                          <>
                            <DropdownMenuItem onClick={() => handleApprove(amendment.id)}>
                              <CheckCircle className="mr-2 h-4 w-4 text-success" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReject(amendment.id)}>
                              <XCircle className="mr-2 h-4 w-4 text-destructive" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {amendment.status === 'approved' && (
                          <DropdownMenuItem onClick={() => handleExecute(amendment.id)}>
                            <Play className="mr-2 h-4 w-4" />
                            Execute
                          </DropdownMenuItem>
                        )}
                        {amendment.status === 'executed' && (
                          <DropdownMenuItem onClick={() => handleMarkExported(amendment.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            Mark as Exported
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
