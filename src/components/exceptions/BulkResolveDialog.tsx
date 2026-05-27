import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExceptionItem {
  id: string;
  delta: number;
  currency: string;
}

interface BulkResolveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedExceptions: ExceptionItem[];
  onResolve: (status: 'resolved' | 'closed', reasonCode: string, reasonDetails: string) => Promise<void>;
  isLoading?: boolean;
}

const RESOLUTION_CODES = [
  { value: 'timing_difference', label: 'Timing Difference', description: 'Records will match in next period' },
  { value: 'rounding_variance', label: 'Rounding Variance', description: 'Immaterial difference due to rounding' },
  { value: 'system_correction', label: 'System Correction', description: 'Source system has been corrected' },
  { value: 'manual_adjustment', label: 'Manual Adjustment', description: 'Manual journal entry posted' },
  { value: 'write_off', label: 'Write-off Approved', description: 'Approved for write-off below threshold' },
  { value: 'duplicate_entry', label: 'Duplicate Entry', description: 'Duplicate record identified and removed' },
  { value: 'data_quality', label: 'Data Quality Issue', description: 'Source data quality issue resolved' },
  { value: 'booking_error', label: 'Booking Error', description: 'Trade booking error corrected' },
  { value: 'other', label: 'Other', description: 'Other resolution reason' },
];

export function BulkResolveDialog({
  open,
  onOpenChange,
  selectedExceptions,
  onResolve,
  isLoading = false,
}: BulkResolveDialogProps) {
  const [status, setStatus] = useState<'resolved' | 'closed'>('resolved');
  const [reasonCode, setReasonCode] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');

  const totalAmountAtRisk = selectedExceptions.reduce((sum, e) => sum + Math.abs(e.delta), 0);

  const handleSubmit = async () => {
    if (!reasonCode) return;
    await onResolve(status, reasonCode, reasonDetails);
    setStatus('resolved');
    setReasonCode('');
    setReasonDetails('');
  };

  const selectedReasonInfo = RESOLUTION_CODES.find(r => r.value === reasonCode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Bulk Resolve Exceptions
          </DialogTitle>
          <DialogDescription>
            Resolve {selectedExceptions.length} selected exception{selectedExceptions.length !== 1 ? 's' : ''} with a common resolution reason.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Selected Exceptions:</span>
              <span className="font-medium">{selectedExceptions.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Amount at Risk:</span>
              <span className="font-mono font-medium text-destructive">
                ${totalAmountAtRisk.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Resolution Status */}
          <div className="space-y-2">
            <Label>Resolution Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'resolved' | 'closed')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason Code */}
          <div className="space-y-2">
            <Label>Resolution Reason <span className="text-destructive">*</span></Label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_CODES.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedReasonInfo && (
              <p className="text-xs text-muted-foreground">{selectedReasonInfo.description}</p>
            )}
          </div>

          {/* Reason Details */}
          <div className="space-y-2">
            <Label>Additional Details</Label>
            <Textarea
              placeholder="Provide additional context..."
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!reasonCode || isLoading}
          >
            {isLoading ? 'Processing...' : `${status === 'resolved' ? 'Resolve' : 'Close'} ${selectedExceptions.length} Exception${selectedExceptions.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
