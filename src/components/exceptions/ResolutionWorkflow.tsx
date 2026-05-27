import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  UserPlus, 
  FileEdit, 
  ArrowRight,
  Play,
  Pause,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ExceptionWithDetails } from '@/hooks/useExceptionDetails';
import type { ExceptionStatus } from '@/lib/types';
import type { UseMutationResult } from '@tanstack/react-query';

interface ResolutionWorkflowProps {
  exception: ExceptionWithDetails;
  updateStatus: UseMutationResult<void, Error, { 
    status: ExceptionStatus; 
    reasonCode?: string;
    reasonDetails?: string;
  }, unknown>;
  assignUser: UseMutationResult<void, Error, string | null, unknown>;
  teamMembers?: { id: string; full_name: string | null; email: string }[];
}

const REASON_CODES = [
  { value: 'timing_difference', label: 'Timing Difference' },
  { value: 'booking_error', label: 'Booking Error' },
  { value: 'rate_difference', label: 'Rate Difference' },
  { value: 'missing_trade', label: 'Missing Trade' },
  { value: 'duplicate_entry', label: 'Duplicate Entry' },
  { value: 'system_issue', label: 'System Issue' },
  { value: 'manual_adjustment', label: 'Manual Adjustment' },
  { value: 'other', label: 'Other' },
];

const statusFlow: ExceptionStatus[] = ['open', 'in_progress', 'pending_approval', 'resolved', 'closed'];

export function ResolutionWorkflow({ 
  exception, 
  updateStatus, 
  assignUser,
  teamMembers = []
}: ResolutionWorkflowProps) {
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');

  const currentStatusIndex = statusFlow.indexOf(exception.status);

  const handleResolve = () => {
    updateStatus.mutate({
      status: 'resolved',
      reasonCode,
      reasonDetails,
    }, {
      onSuccess: () => {
        setResolveDialogOpen(false);
        setReasonCode('');
        setReasonDetails('');
      },
    });
  };

  const handleAssign = () => {
    assignUser.mutate(selectedUser || null, {
      onSuccess: () => {
        setAssignDialogOpen(false);
        setSelectedUser('');
      },
    });
  };

  const canStartWork = exception.status === 'open';
  const canResolve = exception.status === 'in_progress' || exception.status === 'open';
  const canClose = exception.status === 'resolved';
  const isTerminal = exception.status === 'closed' || exception.status === 'resolved';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resolution Workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Progress */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Progress</Label>
            <div className="flex items-center gap-1">
              {statusFlow.map((status, index) => {
                const isCompleted = index < currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                
                return (
                  <div key={status} className="flex items-center flex-1">
                    <div className={`
                      flex-1 h-2 rounded-full transition-colors
                      ${isCompleted ? 'bg-primary' : isCurrent ? 'bg-primary/50' : 'bg-muted'}
                    `} />
                    {index < statusFlow.length - 1 && (
                      <ArrowRight className="h-3 w-3 mx-1 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Open</span>
              <span>In Progress</span>
              <span>Pending</span>
              <span>Resolved</span>
              <span>Closed</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {canStartWork && (
              <Button
                onClick={() => updateStatus.mutate({ status: 'in_progress' })}
                disabled={updateStatus.isPending}
                className="col-span-2"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Investigation
              </Button>
            )}

            {exception.status === 'in_progress' && (
              <Button
                variant="outline"
                onClick={() => updateStatus.mutate({ status: 'open' })}
                disabled={updateStatus.isPending}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(true)}
              disabled={isTerminal}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {exception.assigned_to ? 'Reassign' : 'Assign'}
            </Button>

            {canResolve && (
              <Button
                onClick={() => setResolveDialogOpen(true)}
                disabled={updateStatus.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve
              </Button>
            )}

            {canClose && (
              <Button
                onClick={() => updateStatus.mutate({ status: 'closed' })}
                disabled={updateStatus.isPending}
                variant="secondary"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Close
              </Button>
            )}
          </div>

          {/* Create Amendment Link */}
          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full" asChild>
              <Link to={`/amendments?exception=${exception.id}`}>
                <FileEdit className="h-4 w-4 mr-2" />
                Create Amendment Proposal
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Exception</DialogTitle>
            <DialogDescription>
              Provide details about how this exception was resolved.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason-code">Reason Code</Label>
              <Select value={reasonCode} onValueChange={setReasonCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason code" />
                </SelectTrigger>
                <SelectContent>
                  {REASON_CODES.map((code) => (
                    <SelectItem key={code.value} value={code.value}>
                      {code.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason-details">Resolution Details</Label>
              <Textarea
                id="reason-details"
                placeholder="Describe how this exception was resolved..."
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={!reasonCode || updateStatus.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve Exception
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Exception</DialogTitle>
            <DialogDescription>
              Select a team member to investigate this exception.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedUser || assignUser.isPending}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
