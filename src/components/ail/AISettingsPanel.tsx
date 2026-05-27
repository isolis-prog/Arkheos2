/**
 * AIL Settings Panel — AI administration within Platform Settings
 */
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sparkles, Brain, Zap, MessageSquare, Activity, Clock, BarChart3, Trash2, AlertTriangle } from 'lucide-react';
import { useAILStatus } from '@/hooks/useAIL';
import { DEFAULT_WORKFLOW_CONFIGS, type AILWorkflowConfig } from '@/lib/ail/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const AISettingsPanel = () => {
  const { stats, refresh } = useAILStatus();
  const [workflows, setWorkflows] = useState<AILWorkflowConfig[]>(DEFAULT_WORKFLOW_CONFIGS);
  const [ailEnabled, setAilEnabled] = useState(true);
  const [embeddingsRetentionMonths, setEmbeddingsRetentionMonths] = useState(24);
  const [feedbackRetentionMonths, setFeedbackRetentionMonths] = useState(36);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleWorkflow = useCallback((workflowType: string) => {
    setWorkflows(prev =>
      prev.map(w =>
        w.workflow_type === workflowType ? { ...w, is_enabled: !w.is_enabled } : w
      )
    );
  }, []);

  const toggleAutoTrigger = useCallback((workflowType: string) => {
    setWorkflows(prev =>
      prev.map(w =>
        w.workflow_type === workflowType ? { ...w, auto_trigger: !w.auto_trigger } : w
      )
    );
  }, []);

  const updateThreshold = useCallback((workflowType: string, value: number) => {
    setWorkflows(prev =>
      prev.map(w =>
        w.workflow_type === workflowType
          ? { ...w, min_confidence_threshold: value }
          : w
      )
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* Status Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Embeddings"
          value={stats.totalEmbeddings.toLocaleString()}
          icon={Brain}
          subtitle="Vector representations"
        />
        <MetricCard
          title="AI Inferences"
          value={stats.totalInferences.toLocaleString()}
          icon={Sparkles}
          subtitle={`Avg ${stats.avgLatencyMs}ms latency`}
        />
        <MetricCard
          title="Acceptance Rate"
          value={`${stats.acceptanceRate}%`}
          icon={MessageSquare}
          subtitle={`${stats.totalFeedback} feedback events`}
          variant={stats.acceptanceRate >= 70 ? 'success' : undefined}
        />
        <MetricCard
          title="Tokens This Month"
          value={stats.tokensUsedThisMonth.toLocaleString()}
          icon={Zap}
          subtitle="API usage"
        />
      </div>

      {/* Pipeline Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              AIL Status
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Intelligence Layer</span>
              <Switch checked={ailEnabled} onCheckedChange={setAilEnabled} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-md bg-muted/30">
              <div className="text-2xl font-bold">{stats.queuedJobs}</div>
              <div className="text-xs text-muted-foreground">Queued Jobs</div>
            </div>
            <div className="text-center p-3 rounded-md bg-muted/30">
              <div className="text-2xl font-bold">{stats.processingJobs}</div>
              <div className="text-xs text-muted-foreground">Processing</div>
            </div>
            <div className="text-center p-3 rounded-md bg-muted/30">
              <div className="text-2xl font-bold">
                {stats.queuedJobs === 0 && stats.processingJobs === 0 ? 'Idle' : 'Active'}
              </div>
              <div className="text-xs text-muted-foreground">Pipeline Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Workflow Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Auto-Trigger</TableHead>
                <TableHead>Min Confidence</TableHead>
                <TableHead>Cooldown</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map(w => (
                <TableRow key={w.workflow_type}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{w.display_name}</div>
                      <div className="text-xs text-muted-foreground">{w.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={w.tier_required === 'INTELLIGENCE_PRO' ? 'default' : 'secondary'} className="text-[10px]">
                      {w.tier_required === 'INTELLIGENCE_PRO' ? 'PRO' : 'STD'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={w.is_enabled}
                      onCheckedChange={() => toggleWorkflow(w.workflow_type)}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={w.auto_trigger}
                      onCheckedChange={() => toggleAutoTrigger(w.workflow_type)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={w.min_confidence_threshold}
                      onChange={e => updateThreshold(w.workflow_type, parseFloat(e.target.value))}
                      className="w-20 h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {w.cooldown_hours}h
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Data Privacy Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Data Privacy Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Embeddings Retention</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  value={embeddingsRetentionMonths}
                  onChange={e => setEmbeddingsRetentionMonths(parseInt(e.target.value))}
                  className="w-20 h-8 text-sm"
                />
                <span className="text-sm text-muted-foreground">months</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Feedback Data Retention</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  value={feedbackRetentionMonths}
                  onChange={e => setFeedbackRetentionMonths(parseInt(e.target.value))}
                  className="w-20 h-8 text-sm"
                />
                <span className="text-sm text-muted-foreground">months</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete All AI Data for This Tenant
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All AI Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all embeddings, inference results,
                    feedback, learned examples, and pattern data for this tenant.
                    <br /><br />
                    <strong>This does NOT affect operational data</strong> in other modules
                    (trades, cashflows, exceptions, etc.)
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground">
                    Delete All AI Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-muted-foreground mt-2">
              Deleting AI data does NOT affect operational data in any module.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
