import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Calendar, FileEdit, User } from 'lucide-react';
import { AmendmentPlan } from '@/hooks/useAmendmentPlans';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AmendmentDetailsDialogProps {
  amendment: AmendmentPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  proposed: { label: 'Proposed', color: 'bg-muted text-muted-foreground' },
  pending_approval: { label: 'Pending Approval', color: 'bg-warning/10 text-warning' },
  approved: { label: 'Approved', color: 'bg-success/10 text-success' },
  rejected: { label: 'Rejected', color: 'bg-destructive/10 text-destructive' },
  executed: { label: 'Executed', color: 'bg-info/10 text-info' },
  exported: { label: 'Exported', color: 'bg-primary/10 text-primary' },
  closed: { label: 'Closed', color: 'bg-muted text-muted-foreground' },
};

export const AmendmentDetailsDialog = ({
  amendment,
  open,
  onOpenChange,
}: AmendmentDetailsDialogProps) => {
  if (!amendment) return null;

  const statusConfig = STATUS_CONFIG[amendment.status] || STATUS_CONFIG.proposed;

  const formatCurrency = (amount: unknown) => {
    if (typeof amount !== 'number') return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Amendment Details
          </DialogTitle>
          <DialogDescription>
            {amendment.actionType.replace(/_/g, ' ')} for {amendment.targetSystem.toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status & Meta */}
          <div className="flex items-center justify-between">
            <Badge className={cn('px-3 py-1', statusConfig.color)}>
              {statusConfig.label}
            </Badge>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(amendment.createdAt), 'MMM d, yyyy HH:mm')}
              </span>
              {amendment.approvedBy && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Approved by {amendment.approvedBy}
                </span>
              )}
            </div>
          </div>

          <Separator />

          {/* Payload Details */}
          <div className="space-y-4">
            <h4 className="font-semibold">Amendment Details</h4>
            <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/50 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Deal ID</p>
                <p className="font-mono font-medium">
                  {(amendment.payload?.deal_id as string) || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target System</p>
                <p className="font-medium">{amendment.targetSystem.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Original Amount</p>
                <p className="font-medium tabular-nums">
                  {formatCurrency(amendment.payload?.original_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Corrected Amount</p>
                <p className="font-medium tabular-nums">
                  {formatCurrency(amendment.payload?.corrected_amount)}
                </p>
              </div>
            </div>
          </div>

          {/* Delta Summary */}
          <div className="space-y-4">
            <h4 className="font-semibold">Impact Summary</h4>
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Net Amount Change</span>
                <span
                  className={cn(
                    'text-xl font-bold tabular-nums',
                    typeof amendment.deltaSummary?.amount_change === 'number' &&
                      (amendment.deltaSummary.amount_change as number) >= 0
                      ? 'text-success'
                      : 'text-destructive'
                  )}
                >
                  {typeof amendment.deltaSummary?.amount_change === 'number'
                    ? `${(amendment.deltaSummary.amount_change as number) >= 0 ? '+' : ''}${formatCurrency(amendment.deltaSummary.amount_change)}`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Flags */}
          {amendment.riskFlags.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold">Risk Flags</h4>
              <div className="flex flex-wrap gap-2">
                {amendment.riskFlags.map((flag) => (
                  <Badge key={flag} variant="outline" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {flag.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Rationale */}
          {amendment.rationale && (
            <div className="space-y-4">
              <h4 className="font-semibold">Rationale</h4>
              <p className="rounded-lg border bg-muted/50 p-4 text-sm">
                {amendment.rationale}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-4">
            <h4 className="font-semibold">Timeline</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(amendment.createdAt), 'MMM d, yyyy HH:mm')}</span>
              </div>
              {amendment.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approved</span>
                  <span>{format(new Date(amendment.approvedAt), 'MMM d, yyyy HH:mm')}</span>
                </div>
              )}
              {amendment.executedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Executed</span>
                  <span>{format(new Date(amendment.executedAt), 'MMM d, yyyy HH:mm')}</span>
                </div>
              )}
              {amendment.exportedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exported</span>
                  <span>{format(new Date(amendment.exportedAt), 'MMM d, yyyy HH:mm')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
