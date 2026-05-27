import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Bot, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { BreakComment, BreakDetailView, BreakHistoryEvent } from './types';
import { LineageEvidencePanel } from './LineageEvidencePanel';

export interface BreakDetailPanelProps {
  break: BreakDetailView | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkResolved?: (breakId: string, note: string) => Promise<void>;
  onAddComment?: (breakId: string, comment: string) => Promise<void>;
  /** Optional extra content rendered between the lineage panel and comments. */
  extraSections?: React.ReactNode;
}

function formatAmount(value?: number | null, currency?: string | null) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency ?? 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function toneForDifference(left?: number | null, right?: number | null, tolerance = 0) {
  if (left === right) return 'border-success/30 bg-success/10 text-foreground';
  const delta = Math.abs((left ?? 0) - (right ?? 0));
  if (delta <= tolerance) return 'border-warning/30 bg-warning/10 text-foreground';
  return 'border-destructive/30 bg-destructive/10 text-foreground';
}

function toneForDateDifference(left?: string | null, right?: string | null, toleranceDays = 0) {
  if (left === right) return 'border-success/30 bg-success/10 text-foreground';
  if (!left || !right) return 'border-destructive/30 bg-destructive/10 text-foreground';
  const diff = Math.abs((new Date(left).getTime() - new Date(right).getTime()) / 86400000);
  if (diff <= toleranceDays) return 'border-warning/30 bg-warning/10 text-foreground';
  return 'border-destructive/30 bg-destructive/10 text-foreground';
}

export function BreakDetailPanel({ break: breakData, isOpen, onClose, onMarkResolved, onAddComment, extraSections }: BreakDetailPanelProps) {
  const queryClient = useQueryClient();
  const [commentDraft, setCommentDraft] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const exceptionId = breakData?.exceptionId;

  useEffect(() => {
    if (!isOpen) {
      setCommentDraft('');
      setResolutionNote('');
    }
  }, [isOpen]);

  const commentsQuery = useQuery({
    queryKey: ['drill-break-comments', exceptionId],
    enabled: isOpen && Boolean(exceptionId),
    queryFn: async (): Promise<BreakComment[]> => {
      if (!exceptionId) return [];
      const { data, error } = await supabase
        .from('exception_comments')
        .select(`
          id,
          comment,
          created_at,
          user_id,
          user:profiles!exception_comments_user_id_fkey(full_name,email)
        `)
        .eq('exception_id', exceptionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((item) => ({
        id: item.id,
        comment: item.comment,
        createdAt: item.created_at ?? new Date().toISOString(),
        user: {
          id: item.user_id,
          name: item.user?.full_name ?? item.user?.email ?? 'Unknown user',
          email: item.user?.email ?? null,
        },
      }));
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (comment: string) => {
      if (!breakData) throw new Error('No break selected');
      if (onAddComment) {
        await onAddComment(breakData.id, comment);
        return;
      }
      if (!exceptionId) {
        throw new Error('This break is not linked to an exception thread yet');
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      const { error } = await supabase.from('exception_comments').insert({
        exception_id: exceptionId,
        user_id: user.id,
        comment,
      });

      if (error) throw error;
    },
    onMutate: async (comment) => {
      if (!breakData) return { previous: [] as BreakComment[] };
      await queryClient.cancelQueries({ queryKey: ['drill-break-comments', exceptionId] });
      const previous = queryClient.getQueryData<BreakComment[]>(['drill-break-comments', exceptionId]) ?? [];
      queryClient.setQueryData<BreakComment[]>(['drill-break-comments', exceptionId], [
        ...previous,
        {
          id: `optimistic-${Date.now()}`,
          comment,
          createdAt: new Date().toISOString(),
          optimistic: true,
          user: { id: 'me', name: 'You' },
        },
      ]);
      setCommentDraft('');
      return { previous };
    },
    onError: (error, _comment, context) => {
      queryClient.setQueryData(['drill-break-comments', exceptionId], context?.previous ?? []);
      toast.error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drill-break-comments', exceptionId] });
      toast.success('Comment added');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async () => {
      if (!breakData) throw new Error('No break selected');
      if (!onMarkResolved) throw new Error('No resolve handler configured');
      await onMarkResolved(breakData.id, resolutionNote);
    },
    onSuccess: () => {
      toast.success('Break marked as resolved');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const comments = commentsQuery.data ?? breakData?.comments ?? [];
  const history = useMemo<BreakHistoryEvent[]>(() => breakData?.history ?? [], [breakData]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-[640px]">
        <div className="flex h-full flex-col bg-background">
          <SheetHeader className="border-b px-6 py-5 text-left">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <SheetTitle className="font-mono text-base">{breakData?.breakId ?? 'No break selected'}</SheetTitle>
                <SheetDescription>{breakData?.title ?? 'Inspect both sides, annotate deltas and take action.'}</SheetDescription>
              </div>
              {breakData && <StatusBadge variant={getStatusVariant(breakData.status)}>{breakData.status.replace(/_/g, ' ')}</StatusBadge>}
            </div>
          </SheetHeader>

          {breakData ? (
            <ScrollArea className="flex-1">
              <div className="space-y-6 px-6 py-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  {[{ title: 'Side A', side: breakData.sideA }, { title: 'Side B', side: breakData.sideB }].map(({ title, side }) => (
                    <Card key={title} className="rounded-md border-border">
                      <CardHeader className="space-y-1 pb-3">
                        <CardTitle className="text-base">{title}</CardTitle>
                        <p className="font-mono text-xs text-muted-foreground">{side.id}</p>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className={cn('rounded-md border px-3 py-2', toneForDifference(breakData.sideAAmount, breakData.sideBAmount, breakData.toleranceAmount ?? 0))}>
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">Amount</div>
                          <div className="mt-1 font-mono text-sm font-medium">{formatAmount(side.amount, side.currency ?? breakData.currency)}</div>
                        </div>
                        <div className={cn('rounded-md border px-3 py-2', toneForDateDifference(breakData.sideADate, breakData.sideBDate, 1))}>
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">Date</div>
                          <div className="mt-1 text-sm font-medium">{side.date ?? '—'}</div>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(side.fields).map(([field, value]) => (
                            <div key={field} className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-b-0 last:pb-0">
                              <span className="text-muted-foreground">{field}</span>
                              <span className="max-w-[60%] text-right font-medium text-foreground">{value ?? '—'}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="rounded-md border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Delta summary</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Amount delta</div>
                      <div className="mt-2 font-mono text-sm font-semibold">{formatAmount(breakData.amountDelta, breakData.currency)}</div>
                    </div>
                    <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Delta %</div>
                      <div className="mt-2 font-mono text-sm font-semibold">
                        {breakData.amountDeltaPct === null || breakData.amountDeltaPct === undefined
                          ? '—'
                          : `${breakData.amountDeltaPct.toFixed(2)}%`}
                      </div>
                    </div>
                    <div className="rounded-md border border-info/30 bg-info/10 px-3 py-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Date delta</div>
                      <div className="mt-2 font-mono text-sm font-semibold">{breakData.dateDeltaDays ?? '—'} days</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-md border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4 text-info" /> AI-suggested root cause</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-foreground">{breakData.suggestedRootCause ?? 'No AI narrative available for this break.'}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-mono text-foreground">{Math.round((breakData.aiConfidence ?? 0) * 100)}%</span>
                      </div>
                      <Progress value={(breakData.aiConfidence ?? 0) * 100} />
                    </div>
                  </CardContent>
                </Card>

                <LineageEvidencePanel lineage={breakData.lineage} />

                {extraSections}

                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <Card className="rounded-md border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4" /> Comments</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3 rounded-md border border-border/80 bg-muted/40 p-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>{comment.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-foreground">{comment.user.name}</p>
                                <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="text-sm text-foreground">{comment.comment}</p>
                            </div>
                          </div>
                        ))}
                        {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
                      </div>
                      <Separator />
                      <div className="space-y-3">
                        <Textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Add analyst context, evidence, or next step" />
                        <div className="flex justify-end">
                          <Button onClick={() => commentMutation.mutate(commentDraft)} disabled={!commentDraft.trim() || commentMutation.isPending}>
                            <Send className="h-4 w-4" />
                            Add comment
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-md border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {history.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No status transitions recorded yet.</p>
                      ) : (
                        history.map((item) => (
                          <div key={item.id} className="rounded-md border border-border/70 px-3 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-foreground">{item.label}</p>
                              {item.type === 'status_change' ? <CheckCircle2 className="h-4 w-4 text-success" /> : <MessageSquare className="h-4 w-4 text-info" />}
                            </div>
                            {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{item.actor ?? 'System'}</span>
                              <span>{new Date(item.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-sm text-muted-foreground">Select a break to inspect its drill-down details.</div>
          )}

          <SheetFooter className="border-t px-6 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full space-y-2 sm:max-w-sm">
              <label className="text-sm font-medium text-foreground">Resolution note</label>
              <Textarea value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} placeholder="Document the evidence that closes the break" className="min-h-[88px]" />
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Button variant="outline" onClick={() => toast('Escalation flow is ready for module-specific orchestration.', { icon: <AlertTriangle className="h-4 w-4" /> })}>
                Escalate
              </Button>
              <Button onClick={() => resolveMutation.mutate()} disabled={!breakData || !onMarkResolved || resolveMutation.isPending}>
                Mark resolved
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
