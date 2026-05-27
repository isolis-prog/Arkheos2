import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Plan {
  id: string; subject: string; quarter: string; auditor: string; scope: string; status: string;
}

const statusColor: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  PLANNED: 'bg-muted text-muted-foreground',
  DEFERRED: 'bg-amber-100 text-amber-800',
};

export const AuditPlanTab = ({ plans }: { plans: Plan[] }) => {
  const completed = plans.filter(p => p.status === 'COMPLETED').length;
  const pct = Math.round((completed / plans.length) * 100);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Annual Plan Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{completed} of {plans.length} audits completed</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Subject</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Quarter</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Auditor</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Scope</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{p.subject}</td>
                    <td className="p-3">{p.quarter}</td>
                    <td className="p-3">{p.auditor}</td>
                    <td className="p-3 text-muted-foreground text-xs max-w-xs truncate">{p.scope}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-xs ${statusColor[p.status] || ''}`}>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
