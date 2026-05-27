import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Calendar } from 'lucide-react';
import type { HedgeCloseTask } from '@/hooks/useHedgeAutoDesignation';

interface Props {
  closeTasks: HedgeCloseTask[];
}

export const CloseIntegrationPanel = ({ closeTasks }: Props) => {
  const grouped = closeTasks.reduce<Record<string, HedgeCloseTask[]>>((acc, t) => {
    (acc[t.period] ??= []).push(t);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Close Calendar Integration
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Hedge accounting tasks required for period close sign-off
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(grouped).map(([period, tasks]) => {
          const allComplete = tasks.every(t => t.isComplete);
          return (
            <div key={period} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{period}</h4>
                <Badge className={`text-xs ${allComplete ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                  {allComplete ? 'Ready for Sign-off' : 'Blocking Sign-off'}
                </Badge>
              </div>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-2 text-sm">
                    {task.isComplete ? (
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={task.isComplete ? 'text-muted-foreground' : ''}>{task.taskDescription}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {task.dueDate}
                        {task.completedAt && ` · Completed: ${new Date(task.completedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
