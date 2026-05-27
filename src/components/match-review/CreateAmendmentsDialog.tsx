import { useState } from 'react';
import { FileEdit, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BreakDetail } from '@/hooks/useMatchReviewData';

interface CreateAmendmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBreaks: BreakDetail[];
  onCreate: (targetSystem: string, actionType: string, rationale: string) => void;
  isLoading?: boolean;
}

export function CreateAmendmentsDialog({
  open,
  onOpenChange,
  selectedBreaks,
  onCreate,
  isLoading = false,
}: CreateAmendmentsDialogProps) {
  const [targetSystem, setTargetSystem] = useState<string>('');
  const [actionType, setActionType] = useState<string>('');
  const [rationale, setRationale] = useState<string>('');

  const handleCreate = () => {
    onCreate(targetSystem, actionType, rationale);
    setTargetSystem('');
    setActionType('');
    setRationale('');
  };

  const totalAmountAtRisk = selectedBreaks.reduce((sum, b) => sum + b.amountAtRisk, 0);
  const hasHighRisk = selectedBreaks.some(b => b.severity === 'critical' || b.severity === 'high');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Create Amendment Plans
          </DialogTitle>
          <DialogDescription>
            Create amendment plans for {selectedBreaks.length} selected break{selectedBreaks.length !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {hasHighRisk && (
            <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-warning">High-risk amendments</p>
                <p className="text-muted-foreground">
                  Some selected breaks have critical or high severity. These amendments will require manager approval.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg text-sm">
            <div>
              <span className="text-muted-foreground">Total Breaks:</span>
              <span className="ml-2 font-medium">{selectedBreaks.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Amount at Risk:</span>
              <span className="ml-2 font-mono font-medium text-destructive">
                ${totalAmountAtRisk.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-system">Target System</Label>
            <Select value={targetSystem} onValueChange={setTargetSystem}>
              <SelectTrigger id="target-system">
                <SelectValue placeholder="Select target system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NETSUITE">NetSuite</SelectItem>
                <SelectItem value="ETRM">ETRM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="action-type">Action Type</Label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger id="action-type">
                <SelectValue placeholder="Select action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CREATE">Create Record</SelectItem>
                <SelectItem value="UPDATE">Update Record</SelectItem>
                <SelectItem value="REVERSE_AND_REPOST">Reverse and Repost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rationale">Rationale</Label>
            <Textarea
              id="rationale"
              placeholder="Describe the reason for this amendment..."
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!targetSystem || !actionType || isLoading}
          >
            {isLoading ? 'Creating...' : `Create ${selectedBreaks.length} Amendment${selectedBreaks.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
