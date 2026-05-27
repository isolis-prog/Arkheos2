/**
 * Shared Exception Detail Drawer — SOURCE OF TRUTH from Exception Inbox detail logic.
 * Used by both Inbox tab and All Exceptions tab.
 * Contains: header, break details, AI classification, attachments, comments, resolution workflow, timeline.
 */
import { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge, getStatusVariant, getBreakVariant } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
  X,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useExceptionDetails, useTeamMembers } from '@/hooks/useExceptionDetails';
import { BreakDetailsCard } from '@/components/exceptions/BreakDetailsCard';
import { ResolutionWorkflow } from '@/components/exceptions/ResolutionWorkflow';
import { InvestigationTimeline } from '@/components/exceptions/InvestigationTimeline';
import { CommentsThread } from '@/components/exceptions/CommentsThread';
import { AttachmentsPanel } from '@/components/exceptions/AttachmentsPanel';
import { AIExceptionClassification } from '@/components/ail/AIExceptionClassification';
import type { ExceptionCase } from '@/hooks/useExceptionCases';

interface ExceptionDetailDrawerProps {
  /** DB exception id for Supabase-backed exceptions */
  exceptionId?: string | null;
  /** Inbox case data (demo) — used when no DB record */
  inboxCase?: ExceptionCase | null;
  open: boolean;
  onClose: () => void;
}

/* ── Helpers ─────────────────────────────────────────── */

const severityVariant = (s: string) =>
  s === 'critical' ? 'error' : s === 'high' ? 'warning' : s === 'medium' ? 'info' : 'muted';

const roleLabel: Record<string, string> = {
  fo: 'Front Office',
  mo: 'Middle Office',
  bo: 'Back Office',
  ops: 'Operations',
  treasury: 'Treasury',
};

const formatCurrency = (amount: number | null, currency: string | null = 'USD') => {
  if (amount === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
};

const getDaysRemaining = (dueDate: string | null) => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

/* ── Inbox Detail (demo data) ────────────────────────── */

function InboxCaseDetail({ c }: { c: ExceptionCase }) {
  const slaOverdue =
    c.slaDueAt &&
    new Date(c.slaDueAt) < new Date() &&
    !['resolved', 'waived'].includes(c.status);
  const daysLeft = getDaysRemaining(c.slaDueAt);

  return (
    <div className="space-y-6 p-1">
      {/* Header badges */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge variant={severityVariant(c.severity)}>
            {c.severity.toUpperCase()}
          </StatusBadge>
          <StatusBadge
            variant={
              c.status === 'new'
                ? 'error'
                : c.status === 'in_progress'
                  ? 'info'
                  : c.status === 'resolved'
                    ? 'success'
                    : c.status === 'waived'
                      ? 'muted'
                      : 'warning'
            }
          >
            {c.status.replace(/_/g, ' ')}
          </StatusBadge>
          <Badge variant="outline" className="capitalize">
            {c.module.replace('-', ' ')}
          </Badge>
        </div>

        {c.amount !== null && (
          <div className="text-right">
            <p className="text-2xl font-bold text-destructive font-mono">
              {formatCurrency(c.amount, c.currency)}
            </p>
            <p className="text-xs text-muted-foreground">Amount at Risk</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Description */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
        <p className="text-sm">{c.description}</p>
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Owner Role</p>
          <p className="font-medium">
            {c.ownerRole ? roleLabel[c.ownerRole] : 'Unassigned'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Assigned To</p>
          <p className="font-medium">{c.ownerUserName || 'Unassigned'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Created</p>
          <p className="font-medium">
            {new Date(c.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">SLA Due</p>
          {c.slaDueAt ? (
            <p
              className={`font-medium ${slaOverdue ? 'text-destructive' : daysLeft !== null && daysLeft <= 2 ? 'text-warning' : ''}`}
            >
              {new Date(c.slaDueAt).toLocaleDateString()}
              {daysLeft !== null && (
                <span className="ml-1 text-xs">
                  ({daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'})
                </span>
              )}
            </p>
          ) : (
            <p className="font-medium text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* Root cause & resolution */}
      {(c.rootCauseCode || c.resolutionNotes) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Resolution</h4>
            {c.rootCauseCode && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Root Cause</span>
                <Badge variant="outline">{c.rootCauseCode.replace(/_/g, ' ')}</Badge>
              </div>
            )}
            {c.resolutionNotes && (
              <p className="text-sm bg-muted/50 p-3 rounded-lg">{c.resolutionNotes}</p>
            )}
          </div>
        </>
      )}

      {/* Related entities */}
      {c.relatedEntities.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Related Entities
            </h4>
            <div className="flex flex-wrap gap-2">
              {c.relatedEntities.map((e, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {e.type}: {e.label}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Evidence */}
      {c.evidenceLinks.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Evidence Links</h4>
            <div className="flex flex-wrap gap-2">
              {c.evidenceLinks.map((link, i) => (
                <Badge key={i} variant="outline" className="text-xs gap-1">
                  <ExternalLink className="h-3 w-3" />
                  {link}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* AI Classification */}
      <AIExceptionClassification
        exceptionId={c.id}
        exception={c as unknown as Record<string, unknown>}
      />
    </div>
  );
}

/* ── DB Exception Detail (full Supabase) ─────────────── */

function DBExceptionDetail({ exceptionId }: { exceptionId: string }) {
  const {
    exception,
    comments,
    attachments,
    timeline,
    isLoading,
    addComment,
    updateStatus,
    assignUser,
    uploadAttachment,
    deleteAttachment,
  } = useExceptionDetails(exceptionId);
  const { data: teamMembers = [] } = useTeamMembers();

  if (isLoading) {
    return (
      <div className="space-y-4 p-1">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!exception) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <AlertTriangle className="h-10 w-10 mb-3" />
        <p className="font-medium">Exception not found</p>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(exception.sla_due_date);

  return (
    <div className="space-y-6 p-1">
      {/* Header info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge variant={getStatusVariant(exception.status)}>
            {exception.status.replace(/_/g, ' ')}
          </StatusBadge>
          <StatusBadge variant={getBreakVariant(exception.break_type)}>
            {exception.break_type.replace(/_/g, ' ')}
          </StatusBadge>
          <StatusBadge variant={severityVariant(exception.severity || 'medium') as any}>
            {exception.severity || 'medium'}
          </StatusBadge>
          {exception.run?.template?.name && (
            <StatusBadge variant="muted">{exception.run.template.name}</StatusBadge>
          )}
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-destructive font-mono">
            {formatCurrency(exception.amount_at_risk, exception.currency)}
          </p>
          <p className="text-xs text-muted-foreground">Amount at Risk</p>
        </div>
      </div>

      {/* Quick info bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {exception.assigned_user && (
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Assigned:</span>
            <span className="font-medium">
              {exception.assigned_user.full_name || exception.assigned_user.email}
            </span>
          </div>
        )}
        {exception.sla_due_date && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">SLA:</span>
            <span className={daysRemaining !== null && daysRemaining <= 2 ? 'text-warning font-medium' : ''}>
              {new Date(exception.sla_due_date).toLocaleDateString()}
              {daysRemaining !== null && (
                <span className="ml-1">
                  ({daysRemaining > 0 ? `${daysRemaining}d left` : 'Overdue'})
                </span>
              )}
            </span>
          </div>
        )}
        {exception.run?.period_start && exception.run?.period_end && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {new Date(exception.run.period_start).toLocaleDateString()} –{' '}
              {new Date(exception.run.period_end).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <Separator />

      {/* Tabbed detail sections */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="comments">
            Comments ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="files">
            Files ({attachments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-4">
          <BreakDetailsCard exception={exception} />
          <AIExceptionClassification
            exceptionId={exceptionId}
            exception={exception as unknown as Record<string, unknown>}
          />
          <InvestigationTimeline events={timeline} />
        </TabsContent>

        <TabsContent value="workflow" className="mt-4">
          <ResolutionWorkflow
            exception={exception}
            updateStatus={updateStatus}
            assignUser={assignUser}
            teamMembers={teamMembers}
          />
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <CommentsThread comments={comments} addComment={addComment} />
        </TabsContent>

        <TabsContent value="files" className="mt-4">
          <AttachmentsPanel
            exceptionId={exceptionId}
            attachments={attachments}
            uploadAttachment={uploadAttachment}
            deleteAttachment={deleteAttachment}
          />
        </TabsContent>
      </Tabs>

      {/* Open full page link */}
      <div className="pt-2 border-t">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to={`/exceptions/${exceptionId}`}>
            <ExternalLink className="h-3.5 w-3.5 mr-2" />
            Open Full Detail Page
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* ── Main Drawer ─────────────────────────────────────── */

export function ExceptionDetailDrawer({
  exceptionId,
  inboxCase,
  open,
  onClose,
}: ExceptionDetailDrawerProps) {
  const title = inboxCase
    ? inboxCase.caseRef
    : exceptionId
      ? `Exception ${exceptionId.slice(0, 8)}`
      : 'Exception Detail';

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-mono text-lg">{title}</SheetTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription className="sr-only">Exception detail view</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {inboxCase ? (
            <InboxCaseDetail c={inboxCase} />
          ) : exceptionId ? (
            <DBExceptionDetail exceptionId={exceptionId} />
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              Select an exception to view details
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
