import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, MessageSquare, History, UserPlus2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTeamMembers } from '@/hooks/useExceptionDetails';
import {
  CASHFLOW_EXCEPTION_STATUSES,
  type CashflowExceptionStatus,
  useAddCashflowExceptionThreadComment,
  useAssignCashflowException,
  useCashflowExceptionComments,
  useCashflowExceptionStatusHistory,
  useChangeCashflowExceptionStatus,
  useTriggerSlaScan,
} from '@/hooks/cashflows/useCashflowMutations';

export interface CashflowExceptionWorkflowPanelProps {
  exceptionId: string;
  currentStatus?: string | null;
  currentAssigneeId?: string | null;
  /** When true, all mutating actions are disabled (e.g. period locked). */
  locked?: boolean;
}

/**
 * Workflow actions panel for a cashflow exception. Lets the user:
 *   - Assign the exception to a tenant member
 *   - Change status with a required justification note
 *   - Browse and append free-form comments
 *   - Inspect the status history
 *   - Trigger an SLA reminder scan on demand
 */
export function CashflowExceptionWorkflowPanel({
  exceptionId,
  currentStatus,
  currentAssigneeId,
  locked = false,
}: CashflowExceptionWorkflowPanelProps) {
  const team = useTeamMembers();
  const history = useCashflowExceptionStatusHistory(exceptionId);
  const comments = useCashflowExceptionComments(exceptionId);
  const changeStatus = useChangeCashflowExceptionStatus();
  const assign = useAssignCashflowException();
  const addComment = useAddCashflowExceptionThreadComment();
  const slaScan = useTriggerSlaScan();

  const [nextStatus, setNextStatus] = useState<CashflowExceptionStatus>(
    (currentStatus as CashflowExceptionStatus) ?? 'open',
  );
  const [statusNote, setStatusNote] = useState('');
  const [draftComment, setDraftComment] = useState('');
  const [pendingAssignee, setPendingAssignee] = useState<string>(currentAssigneeId ?? 'unassigned');

  const handleStatusSubmit = async () => {
    if (!statusNote.trim()) {
      toast.error('A note is required to change status');
      return;
    }
    await changeStatus.mutateAsync({ exceptionId, toStatus: nextStatus, note: statusNote.trim() });
    setStatusNote('');
  };

  const handleAssign = async () => {
    await assign.mutateAsync({
      exceptionId,
      assigneeId: pendingAssignee === 'unassigned' ? null : pendingAssignee,
    });
  };

  const handleComment = async () => {
    if (!draftComment.trim()) return;
    await addComment.mutateAsync({ exceptionId, body: draftComment.trim() });
    setDraftComment('');
  };

  const disabled = locked;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">Workflow actions</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => slaScan.mutate()}
            disabled={slaScan.isPending}
          >
            <Bell className="h-3 w-3 mr-1" />
            Run SLA scan
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assignment */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <UserPlus2 className="h-3 w-3" /> Assignment
          </div>
          <div className="flex gap-2">
            <Select value={pendingAssignee} onValueChange={setPendingAssignee} disabled={disabled}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {(team.data ?? []).map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name || member.email || member.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleAssign}
              disabled={disabled || assign.isPending || pendingAssignee === (currentAssigneeId ?? 'unassigned')}
            >
              Save
            </Button>
          </div>
        </section>

        {/* Status change */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            Status
            {currentStatus && <Badge variant="outline" className="text-[10px]">current: {currentStatus}</Badge>}
          </div>
          <div className="flex gap-2">
            <Select
              value={nextStatus}
              onValueChange={(v) => setNextStatus(v as CashflowExceptionStatus)}
              disabled={disabled}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CASHFLOW_EXCEPTION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Justification note (required)"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            rows={2}
            disabled={disabled}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleStatusSubmit}
              disabled={disabled || changeStatus.isPending || !statusNote.trim()}
            >
              Apply status change
            </Button>
          </div>
        </section>

        {/* Tabs: comments + history */}
        <Tabs defaultValue="comments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comments">
              <MessageSquare className="h-3 w-3 mr-1" />
              Comments ({comments.data?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-3 w-3 mr-1" />
              History ({history.data?.length ?? 0})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="comments" className="space-y-2">
            <Textarea
              placeholder="Add a review note…"
              value={draftComment}
              onChange={(e) => setDraftComment(e.target.value)}
              rows={2}
              disabled={disabled}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleComment}
                disabled={disabled || addComment.isPending || !draftComment.trim()}
              >
                Post comment
              </Button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {comments.data?.length === 0 && (
                <p className="text-xs text-muted-foreground">No comments yet.</p>
              )}
              {comments.data?.map((c) => (
                <div key={c.id} className="rounded border bg-muted/40 p-2">
                  <p className="text-sm">{c.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="history" className="space-y-2">
            <div className="max-h-64 overflow-y-auto space-y-2">
              {history.data?.length === 0 && (
                <p className="text-xs text-muted-foreground">No status changes recorded.</p>
              )}
              {history.data?.map((h) => (
                <div key={h.id} className="rounded border bg-muted/40 p-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">{h.from_status ?? '∅'}</Badge>
                    <span>→</span>
                    <Badge>{h.to_status}</Badge>
                  </div>
                  <p className="text-sm mt-1">{h.note}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(h.changed_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
