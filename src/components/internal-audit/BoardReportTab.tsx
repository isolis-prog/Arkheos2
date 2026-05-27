import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText } from 'lucide-react';

interface Props {
  auditsCompleted: number;
  totalPlanned: number;
  controlPassRate: number;
  openFindings: number;
  overdueFindings: number;
  findings: { severity: string; status: string }[];
}

export const BoardReportTab = ({ auditsCompleted, totalPlanned, controlPassRate, openFindings, overdueFindings, findings }: Props) => {
  const bySev = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => ({
    severity: s,
    open: findings.filter(f => f.severity === s && (f.status === 'OPEN' || f.status === 'IN_PROGRESS')).length,
    closed: findings.filter(f => f.severity === s && (f.status === 'REMEDIATED' || f.status === 'ACCEPTED_RISK')).length,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Internal Audit Summary — Q2 2026</h3>
          <p className="text-xs text-muted-foreground">Auto-generated board reporting package</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" /> Export PDF</Button>
          <Button size="sm" variant="outline"><FileText className="h-4 w-4 mr-1" /> Export XLSX</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Audit Plan Progress</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{auditsCompleted}/{totalPlanned}</p>
            <p className="text-xs text-muted-foreground">Audits completed YTD</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Control Test Pass Rate</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{controlPassRate}%</p>
            <p className="text-xs text-muted-foreground">Of automated tests passing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Overdue Remediations</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${overdueFindings > 0 ? 'text-red-500' : 'text-foreground'}`}>{overdueFindings}</p>
            <p className="text-xs text-muted-foreground">Past remediation due date</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Findings by Severity</CardTitle>
          <CardDescription className="text-xs">Open vs. closed across all audit activities</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Severity</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Open</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Closed</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {bySev.map((r) => (
                <tr key={r.severity} className="border-b">
                  <td className="p-3"><Badge variant="outline" className="text-xs">{r.severity}</Badge></td>
                  <td className="p-3 text-right font-mono">{r.open}</td>
                  <td className="p-3 text-right font-mono">{r.closed}</td>
                  <td className="p-3 text-right font-mono font-medium">{r.open + r.closed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
