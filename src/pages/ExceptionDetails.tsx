import { useParams } from 'react-router-dom';
import { useExceptionDetails, useTeamMembers } from '@/hooks/useExceptionDetails';
import { ExceptionHeader } from '@/components/exceptions/ExceptionHeader';
import { BreakDetailsCard } from '@/components/exceptions/BreakDetailsCard';
import { InvestigationTimeline } from '@/components/exceptions/InvestigationTimeline';
import { CommentsThread } from '@/components/exceptions/CommentsThread';
import { ResolutionWorkflow } from '@/components/exceptions/ResolutionWorkflow';
import { AttachmentsPanel } from '@/components/exceptions/AttachmentsPanel';
import { AIExceptionClassification } from '@/components/ail/AIExceptionClassification';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function ExceptionDetails() {
  const { exceptionId } = useParams<{ exceptionId: string }>();
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
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!exception) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Exception Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The exception you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button asChild>
            <Link to="/exceptions">Back to Exceptions</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ExceptionHeader exception={exception} />

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Main content */}
        <div className="lg:col-span-2 space-y-6">
          <BreakDetailsCard exception={exception} />
          <AIExceptionClassification
            exceptionId={exceptionId!}
            exception={exception as unknown as Record<string, unknown>}
          />
          <AttachmentsPanel 
            exceptionId={exceptionId!}
            attachments={attachments}
            uploadAttachment={uploadAttachment}
            deleteAttachment={deleteAttachment}
          />
          <CommentsThread comments={comments} addComment={addComment} />
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          <ResolutionWorkflow 
            exception={exception}
            updateStatus={updateStatus}
            assignUser={assignUser}
            teamMembers={teamMembers}
          />
          <InvestigationTimeline events={timeline} />
        </div>
      </div>
    </div>
  );
}
