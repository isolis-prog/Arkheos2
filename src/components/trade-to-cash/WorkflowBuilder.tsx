import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WorkflowStep } from '@/hooks/useTradeToCash';
import { ArrowRight, Database, RefreshCw, ShieldCheck, Send, GitCompare, Lock } from 'lucide-react';

const stepIcons: Record<string, React.ReactNode> = {
  extract: <Database className="h-5 w-5" />,
  transform: <RefreshCw className="h-5 w-5" />,
  validate: <ShieldCheck className="h-5 w-5" />,
  post: <Send className="h-5 w-5" />,
  reconcile: <GitCompare className="h-5 w-5" />,
  close: <Lock className="h-5 w-5" />,
};

const stepColors: Record<string, string> = {
  extract: 'border-blue-500/30 bg-blue-500/5',
  transform: 'border-purple-500/30 bg-purple-500/5',
  validate: 'border-amber-500/30 bg-amber-500/5',
  post: 'border-emerald-500/30 bg-emerald-500/5',
  reconcile: 'border-cyan-500/30 bg-cyan-500/5',
  close: 'border-rose-500/30 bg-rose-500/5',
};

interface Props {
  steps: WorkflowStep[];
}

export const WorkflowBuilder = ({ steps }: Props) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pipeline Steps</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          {steps.sort((a, b) => a.order - b.order).map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className={cn(
                'flex flex-col items-center gap-2 rounded-xl border-2 p-4 min-w-[140px] transition-all hover:shadow-md cursor-pointer',
                stepColors[step.type] || 'border-border bg-card'
              )}>
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-background shadow-sm">
                  {stepIcons[step.type]}
                </div>
                <span className="text-sm font-medium text-center">{step.name}</span>
                <Badge variant="secondary" className="text-xs capitalize">{step.type}</Badge>
              </div>
              {i < steps.length - 1 && <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.sort((a, b) => a.order - b.order).map(step => (
            <Card key={step.id} className={cn('border', stepColors[step.type])}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  {stepIcons[step.type]}
                  <CardTitle className="text-sm">{step.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted/50 rounded p-2 overflow-auto max-h-24">
                  {JSON.stringify(step.config, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);
