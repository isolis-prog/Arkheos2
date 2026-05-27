import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Play, 
  Eye, 
  Upload,
  FileSpreadsheet,
  Bot,
  Database,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { DataTable } from '@/components/ui/data-table';
import { Progress } from '@/components/ui/progress';
import { useReconRuns } from '@/hooks/useReconAgent';
import { generateDemoData } from '@/lib/recon-demo-data';
import { formatDistanceToNow } from 'date-fns';
import { NewReconRunDialog } from '@/components/recon-agent/NewReconRunDialog';
import { useAgentNotifications } from '@/hooks/useAgentNotifications';

export default function ReconAgentRuns() {
  const navigate = useNavigate();
  const { runs, isLoading, createRun, runMatching, refetch } = useReconRuns();
  const [showNewRunDialog, setShowNewRunDialog] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  // Enable global real-time notifications for all agent activity
  useAgentNotifications({ enabled: true });

  const handleLoadDemoData = async () => {
    setIsLoadingDemo(true);
    try {
      const demo = generateDemoData(200);
      await createRun.mutateAsync({
        periodStart: '2024-11-01',
        periodEnd: '2024-12-31',
        sourceAName: 'ETRM Fees',
        sourceBName: 'NetSuite Postings',
        recordsA: demo.sourceA,
        recordsB: demo.sourceB,
      });
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleRunMatching = async (runId: string) => {
    await runMatching.mutateAsync(runId);
    refetch();
  };

  const columns = [
    {
      key: 'period',
      header: 'Period',
      cell: (run: any) => (
        <div>
          <p className="font-medium">{run.source_a_name} ↔ {run.source_b_name}</p>
          <p className="text-sm text-muted-foreground">
            {run.period_start} to {run.period_end}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (run: any) => (
        <StatusBadge variant={getStatusVariant(run.status)}>
          {run.status}
        </StatusBadge>
      ),
    },
    {
      key: 'metrics',
      header: 'Metrics',
      cell: (run: any) => {
        const metrics = run.metrics || {};
        return (
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Database className="h-3 w-3 text-muted-foreground" />
              <span>{metrics.records_a || 0} / {metrics.records_b || 0} records</span>
            </div>
            {metrics.match_rate && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-accent" />
                <span className="text-accent font-medium">{metrics.match_rate}% matched</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'exceptions',
      header: 'Exceptions',
      cell: (run: any) => {
        const metrics = run.metrics || {};
        return (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="font-medium">{metrics.exceptions_created || 0}</span>
          </div>
        );
      },
    },
    {
      key: 'created',
      header: 'Created',
      cell: (run: any) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (run: any) => (
        <div className="flex items-center gap-2">
          {run.status === 'pending' && (
            <Button 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                handleRunMatching(run.id);
              }}
              disabled={runMatching.isPending}
            >
              {runMatching.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="ml-1">Run</span>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigate(`/recon-agent/${run.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'w-32',
    },
  ];

  // Summary stats
  const totalRuns = runs.length;
  const completedRuns = runs.filter(r => r.status === 'completed').length;
  const pendingRuns = runs.filter(r => r.status === 'pending').length;
  const totalExceptions = runs.reduce((sum, r) => sum + (r.metrics?.exceptions_created || 0), 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Reconciliation Agent"
        description="Intelligent matching with AI-powered exception analysis"
        actions={
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleLoadDemoData}
              disabled={isLoadingDemo || createRun.isPending}
            >
              {isLoadingDemo ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Load Demo Data
            </Button>
            <Button onClick={() => setShowNewRunDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Run
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Runs</p>
                <p className="text-2xl font-bold">{totalRuns}</p>
              </div>
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-accent">{completedRuns}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-accent/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">{pendingRuns}</p>
              </div>
              <Clock className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Exceptions</p>
                <p className="text-2xl font-bold text-destructive">{totalExceptions}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Agent Info Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>AI-Powered Reconciliation</CardTitle>
              <CardDescription>
                The agent uses Gemini 3 Flash to analyze exceptions, propose matches, and auto-triage the queue
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent mt-0.5" />
              <div>
                <p className="font-medium">Intelligent Matching</p>
                <p className="text-muted-foreground">Hybrid scoring with amount, date, text & ID analysis</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent mt-0.5" />
              <div>
                <p className="font-medium">Exception Analysis</p>
                <p className="text-muted-foreground">AI reviews evidence and proposes resolutions</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent mt-0.5" />
              <div>
                <p className="font-medium">Full Audit Trail</p>
                <p className="text-muted-foreground">Every action logged with hashes for compliance</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Runs Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Reconciliation Runs</h2>
        <DataTable
          columns={columns}
          data={runs}
          loading={isLoading}
          emptyMessage="No reconciliation runs yet. Load demo data or create a new run."
          onRowClick={(run) => navigate(`/recon-agent/${run.id}`)}
        />
      </div>

      <NewReconRunDialog 
        open={showNewRunDialog} 
        onOpenChange={setShowNewRunDialog}
        onSubmit={async (data) => {
          await createRun.mutateAsync(data);
          setShowNewRunDialog(false);
        }}
        isLoading={createRun.isPending}
      />
    </div>
  );
}
