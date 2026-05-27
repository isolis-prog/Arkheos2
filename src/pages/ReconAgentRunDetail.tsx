import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Play, 
  Bot,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Loader2,
  FileText,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReconRunDetails, useAgentTools, useReconRuns } from '@/hooks/useReconAgent';
import { ExceptionsQueue } from '@/components/recon-agent/ExceptionsQueue';
import { MatchedPairsView } from '@/components/recon-agent/MatchedPairsView';
import { AgentAuditLog } from '@/components/recon-agent/AgentAuditLog';
import { ReportExportDialog } from '@/components/recon-agent/ReportExportDialog';
import { RunEnrichmentStatusPanel } from '@/components/recon-agent/RunEnrichmentStatusPanel';
import { useAgentNotifications } from '@/hooks/useAgentNotifications';
import { formatDistanceToNow } from 'date-fns';

export default function ReconAgentRunDetail() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { run, exceptions, candidates, isLoading, refetch } = useReconRunDetails(runId);
  const { runMatching } = useReconRuns();
  const { autoTriage, isLoading: agentLoading } = useAgentTools();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isTriaging, setIsTriaging] = useState(false);

  // Enable real-time notifications for this run
  useAgentNotifications({ runId, enabled: !!runId });

  const handleRunMatching = async () => {
    if (!runId) return;
    await runMatching.mutateAsync(runId);
    refetch();
  };

  const handleAutoTriage = async () => {
    if (!runId) return;
    setIsTriaging(true);
    try {
      await autoTriage(runId);
      refetch();
    } finally {
      setIsTriaging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Run not found</p>
        <Button variant="link" onClick={() => navigate('/recon-agent')}>
          Back to runs
        </Button>
      </div>
    );
  }

  const metrics = run.metrics || {};
  const openExceptions = exceptions.filter(e => e.status === 'open').length;
  const inReviewExceptions = exceptions.filter(e => e.status === 'in_review' || e.status === 'proposed').length;
  const closedExceptions = exceptions.filter(e => e.status === 'closed' || e.status === 'approved').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/recon-agent')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`${run.source_a_name} ↔ ${run.source_b_name}`}
          description={`Period: ${run.period_start} to ${run.period_end}`}
          className="mb-0"
          actions={
            <div className="flex gap-2">
              {run.status === 'pending' && (
                <Button onClick={handleRunMatching} disabled={runMatching.isPending}>
                  {runMatching.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Run Matching
                </Button>
              )}
              {run.status === 'completed' && (
                <>
                  <Button variant="outline" onClick={handleAutoTriage} disabled={isTriaging}>
                    {isTriaging ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-4 w-4" />
                    )}
                    Auto-Triage
                  </Button>
                  <Button variant="outline" onClick={() => setShowReportDialog(true)}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          }
        />
      </div>

      {/* Status and Metrics */}
      <div className="flex items-center gap-4">
        <StatusBadge variant={getStatusVariant(run.status)} className="text-sm px-3 py-1">
          {run.status}
        </StatusBadge>
        <span className="text-sm text-muted-foreground">
          Created {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
        </span>
        <span className="text-sm text-muted-foreground">
          Ruleset: {run.ruleset_version} | Model: {run.model_version}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Source A Records</div>
            <div className="text-2xl font-bold">{metrics.records_a || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Source B Records</div>
            <div className="text-2xl font-bold">{metrics.records_b || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Auto-Matched</div>
            <div className="text-2xl font-bold text-accent">{metrics.auto_matched || 0}</div>
            {metrics.match_rate && (
              <div className="text-xs text-muted-foreground">{metrics.match_rate}% rate</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Open Exceptions</div>
            <div className="text-2xl font-bold text-destructive">{openExceptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Unmatched Amount</div>
            <div className="text-2xl font-bold">
              ${(metrics.unmatched_amount || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exception Status Summary */}
      {run.status === 'completed' && (
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive" />
                  <span className="text-sm">Open: {openExceptions}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-warning" />
                  <span className="text-sm">In Review: {inReviewExceptions}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-accent" />
                  <span className="text-sm">Resolved: {closedExceptions}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  AI Agent ready to analyze exceptions
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enrichment pipeline status */}
      {run.status === 'completed' && runId && (
        <RunEnrichmentStatusPanel runId={runId} onCompleted={refetch} />
      )}

      {/* Main Content Tabs */}
      {run.status === 'completed' && (
        <Tabs defaultValue="exceptions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="exceptions" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Exceptions Queue
              {openExceptions > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
                  {openExceptions}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="matched" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Matched Pairs
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exceptions">
            <ExceptionsQueue 
              runId={runId!}
              exceptions={exceptions} 
              onRefresh={refetch}
            />
          </TabsContent>

          <TabsContent value="matched">
            <MatchedPairsView runId={runId!} candidates={candidates} />
          </TabsContent>

          <TabsContent value="audit">
            <AgentAuditLog runId={runId!} />
          </TabsContent>
        </Tabs>
      )}

      <ReportExportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        runId={runId!}
      />
    </div>
  );
}
