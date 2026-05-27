import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileEdit, Plus, X } from 'lucide-react';
import { useCreateAmendment, CreateAmendmentInput } from '@/hooks/useAmendmentPlans';

interface AmendmentGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledData?: {
    exceptionId?: string;
    matchGroupId?: string;
    dealId?: string;
    amount?: number;
    targetSystem?: 'netsuite' | 'etrm';
  };
}

const ACTION_TYPES = [
  { value: 'CREATE', label: 'Create New Record', description: 'Create a new record in target system' },
  { value: 'UPDATE', label: 'Update Existing', description: 'Modify existing record fields' },
  { value: 'REVERSE_AND_REPOST', label: 'Reverse & Repost', description: 'Reverse original and create corrected entry' },
  { value: 'WRITE_OFF', label: 'Write Off', description: 'Write off the difference as approved variance' },
];

const RISK_FLAGS = [
  'high_value',
  'closed_period',
  'cross_entity',
  'reversal',
  'manual_override',
];

export const AmendmentGeneratorDialog = ({
  open,
  onOpenChange,
  prefilledData,
}: AmendmentGeneratorDialogProps) => {
  const createAmendment = useCreateAmendment();

  const [formData, setFormData] = useState({
    actionType: 'UPDATE' as CreateAmendmentInput['actionType'],
    targetSystem: prefilledData?.targetSystem || 'netsuite' as 'netsuite' | 'etrm',
    dealId: prefilledData?.dealId || '',
    originalAmount: prefilledData?.amount?.toString() || '',
    correctedAmount: '',
    rationale: '',
    requiresApproval: true,
    riskFlags: [] as string[],
  });

  const handleSubmit = async () => {
    const payload: Record<string, unknown> = {
      deal_id: formData.dealId,
      original_amount: parseFloat(formData.originalAmount) || 0,
      corrected_amount: parseFloat(formData.correctedAmount) || 0,
    };

    const deltaSummary: Record<string, unknown> = {
      amount_change: (parseFloat(formData.correctedAmount) || 0) - (parseFloat(formData.originalAmount) || 0),
    };

    await createAmendment.mutateAsync({
      exceptionId: prefilledData?.exceptionId,
      matchGroupId: prefilledData?.matchGroupId,
      actionType: formData.actionType,
      targetSystem: formData.targetSystem,
      payload,
      deltaSummary,
      rationale: formData.rationale,
      riskFlags: formData.riskFlags,
      requiresApproval: formData.requiresApproval,
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      actionType: 'UPDATE',
      targetSystem: 'netsuite',
      dealId: '',
      originalAmount: '',
      correctedAmount: '',
      rationale: '',
      requiresApproval: true,
      riskFlags: [],
    });
  };

  const toggleRiskFlag = (flag: string) => {
    setFormData((prev) => ({
      ...prev,
      riskFlags: prev.riskFlags.includes(flag)
        ? prev.riskFlags.filter((f) => f !== flag)
        : [...prev.riskFlags, flag],
    }));
  };

  const amountDifference =
    (parseFloat(formData.correctedAmount) || 0) - (parseFloat(formData.originalAmount) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Generate Amendment Proposal
          </DialogTitle>
          <DialogDescription>
            Create an amendment proposal to correct discrepancies between systems
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Action Type & Target System */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select
                value={formData.actionType}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, actionType: v as CreateAmendmentInput['actionType'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      <div>
                        <div className="font-medium">{action.label}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target System</Label>
              <Select
                value={formData.targetSystem}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, targetSystem: v as 'netsuite' | 'etrm' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="netsuite">NetSuite</SelectItem>
                  <SelectItem value="etrm">ETRM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deal ID & Amounts */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Deal ID</Label>
              <Input
                value={formData.dealId}
                onChange={(e) => setFormData((prev) => ({ ...prev, dealId: e.target.value }))}
                placeholder="DEAL-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Original Amount</Label>
              <Input
                type="number"
                value={formData.originalAmount}
                onChange={(e) => setFormData((prev) => ({ ...prev, originalAmount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Corrected Amount</Label>
              <Input
                type="number"
                value={formData.correctedAmount}
                onChange={(e) => setFormData((prev) => ({ ...prev, correctedAmount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Delta Preview */}
          {formData.originalAmount && formData.correctedAmount && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Amount Change</span>
                <span
                  className={`text-lg font-bold tabular-nums ${
                    amountDifference >= 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {amountDifference >= 0 ? '+' : ''}
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(amountDifference)}
                </span>
              </div>
            </div>
          )}

          {/* Rationale */}
          <div className="space-y-2">
            <Label>Rationale / Justification</Label>
            <Textarea
              value={formData.rationale}
              onChange={(e) => setFormData((prev) => ({ ...prev, rationale: e.target.value }))}
              placeholder="Explain why this amendment is needed..."
              rows={3}
            />
          </div>

          {/* Risk Flags */}
          <div className="space-y-2">
            <Label>Risk Flags</Label>
            <div className="flex flex-wrap gap-2">
              {RISK_FLAGS.map((flag) => (
                <Badge
                  key={flag}
                  variant={formData.riskFlags.includes(flag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleRiskFlag(flag)}
                >
                  {formData.riskFlags.includes(flag) ? (
                    <X className="mr-1 h-3 w-3" />
                  ) : (
                    <Plus className="mr-1 h-3 w-3" />
                  )}
                  {flag.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Approval Requirement */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="requires-approval"
              checked={formData.requiresApproval}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, requiresApproval: checked === true }))
              }
            />
            <Label htmlFor="requires-approval" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Requires manager approval before execution
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createAmendment.isPending || !formData.dealId}
          >
            {createAmendment.isPending ? 'Creating...' : 'Create Proposal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
