import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CloseTask, CloseSignoff } from '@/hooks/useCloseCockpit';
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle } from 'lucide-react';

interface Props {
  tasks: CloseTask[];
  signoffs: CloseSignoff[];
  legalEntities: string[];
}

type TrafficColor = 'green' | 'amber' | 'red' | 'grey';

function getEntityColor(tasks: CloseTask[], signoffs: CloseSignoff[]): TrafficColor {
  if (tasks.length === 0) return 'grey';
  const completed = tasks.filter(t => t.status === 'completed').length;
  const blocked = tasks.filter(t => t.status === 'blocked' || t.status === 'overdue').length;
  const pct = (completed / tasks.length) * 100;
  const allSigned = signoffs.every(s => s.status === 'approved');

  if (pct === 100 && allSigned) return 'green';
  if (blocked > 0 || pct < 40) return 'red';
  return 'amber';
}

const colorConfig: Record<TrafficColor, { icon: typeof CheckCircle2; bg: string; text: string; label: string }> = {
  green: { icon: CheckCircle2, bg: 'bg-success/10 border-success/30', text: 'text-success', label: 'Ready' },
  amber: { icon: AlertTriangle, bg: 'bg-warning/10 border-warning/30', text: 'text-warning', label: 'In Progress' },
  red: { icon: XCircle, bg: 'bg-destructive/10 border-destructive/30', text: 'text-destructive', label: 'Blocked' },
  grey: { icon: MinusCircle, bg: 'bg-muted border-border', text: 'text-muted-foreground', label: 'Not Started' },
};

export const EntityTrafficLight = ({ tasks, signoffs, legalEntities }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Entity Status</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {legalEntities.map((entity) => {
          const entityTasks = tasks.filter(t => t.legalEntity === entity);
          const entitySignoffs = signoffs.filter(s => s.legalEntity === entity);
          const color = getEntityColor(entityTasks, entitySignoffs);
          const cfg = colorConfig[color];
          const Icon = cfg.icon;
          const completed = entityTasks.filter(t => t.status === 'completed').length;

          return (
            <div key={entity} className={`rounded-lg border p-4 ${cfg.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-5 w-5 ${cfg.text}`} />
                <span className="font-semibold text-sm">{entity}</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>{completed}/{entityTasks.length} tasks done</p>
                <p>{entitySignoffs.filter(s => s.status === 'approved').length}/{entitySignoffs.length} sign-offs</p>
              </div>
              <p className={`text-xs font-medium mt-2 ${cfg.text}`}>{cfg.label}</p>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);
