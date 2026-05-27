import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plus, Play, Pause, Database, RefreshCw, ShieldCheck, Send, GitCompare, Bell, Code2 } from 'lucide-react';
import { StudioWorkflow } from '@/hooks/useStudio';
import { cn } from '@/lib/utils';

const stepIcons: Record<string, React.ReactNode> = {
  extract: <Database className="h-4 w-4" />,
  transform: <RefreshCw className="h-4 w-4" />,
  validate: <ShieldCheck className="h-4 w-4" />,
  post: <Send className="h-4 w-4" />,
  reconcile: <GitCompare className="h-4 w-4" />,
  notify: <Bell className="h-4 w-4" />,
  custom: <Code2 className="h-4 w-4" />,
};

const stepColors: Record<string, string> = {
  extract: 'border-blue-500/40 bg-blue-500/5',
  transform: 'border-purple-500/40 bg-purple-500/5',
  validate: 'border-amber-500/40 bg-amber-500/5',
  post: 'border-emerald-500/40 bg-emerald-500/5',
  reconcile: 'border-cyan-500/40 bg-cyan-500/5',
  notify: 'border-rose-500/40 bg-rose-500/5',
  custom: 'border-muted-foreground/40 bg-muted/50',
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  paused: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  archived: 'bg-muted text-muted-foreground/60',
};

const triggerLabels: Record<string, string> = {
  manual: '▶ Manual',
  scheduled: '🕐 Scheduled',
  event: '⚡ Event-driven',
  webhook: '🔗 Webhook',
};

interface Props {
  workflows: StudioWorkflow[];
}

export const WorkflowCanvas = ({ workflows }: Props) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">Workflow Canvas</h3>
        <p className="text-sm text-muted-foreground">Design multi-step automation pipelines</p>
      </div>
      <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Workflow</Button>
    </div>

    <div className="space-y-6">
      {workflows.map((wf) => (
        <Card key={wf.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">{wf.name}</CardTitle>
                <Badge className={cn('text-xs', statusColors[wf.status])}>{wf.status}</Badge>
                <Badge variant="outline" className="text-xs">v{wf.version}</Badge>
                <Badge variant="secondary" className="text-xs">{triggerLabels[wf.triggerType]}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"><Play className="h-4 w-4 mr-1" /> Test Run</Button>
                {wf.status === 'active' ? (
                  <Button variant="outline" size="sm"><Pause className="h-4 w-4 mr-1" /> Pause</Button>
                ) : (
                  <Button size="sm"><Play className="h-4 w-4 mr-1" /> Activate</Button>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{wf.description}</p>
            {wf.scheduleCron && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span>Cron: <code className="bg-muted px-1 rounded">{wf.scheduleCron}</code></span>
                <span>TZ: {wf.scheduleTimezone}</span>
                {wf.executionWindowStart && <span>Window: {wf.executionWindowStart}–{wf.executionWindowEnd}</span>}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Visual pipeline */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4">
              {wf.steps.sort((a, b) => a.order - b.order).map((step, i) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 min-w-[120px] transition-all hover:shadow-md cursor-pointer',
                    stepColors[step.type]
                  )}>
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-background shadow-sm">
                      {stepIcons[step.type]}
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">{step.name}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-[10px] capitalize px-1.5">{step.type}</Badge>
                      {step.onFailure === 'retry' && (
                        <Badge variant="outline" className="text-[10px] px-1.5">×{step.retries}</Badge>
                      )}
                    </div>
                  </div>
                  {i < wf.steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                </div>
              ))}
              <button className="flex items-center justify-center h-10 w-10 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-colors flex-shrink-0">
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </motion.div>
);
