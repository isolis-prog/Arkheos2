import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Finding {
  id: string; title: string; severity: string; rootCause: string; module: string;
  desk: string; owner: string; dueDate: string; status: string; daysOpen: number;
}

const sevColor: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-amber-100 text-amber-800',
  LOW: 'bg-muted text-muted-foreground',
};
const statusColor: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REMEDIATED: 'bg-emerald-100 text-emerald-800',
  ACCEPTED_RISK: 'bg-muted text-muted-foreground',
};

export const FindingsTab = ({ findings }: { findings: Finding[] }) => (
  <Card>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Severity</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Module</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Desk</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Owner</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Due Date</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Days Open</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((f) => (
              <tr key={f.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium max-w-xs truncate">{f.title}</td>
                <td className="p-3"><Badge variant="outline" className={`text-xs ${sevColor[f.severity] || ''}`}>{f.severity}</Badge></td>
                <td className="p-3 text-muted-foreground">{f.module}</td>
                <td className="p-3 text-muted-foreground">{f.desk}</td>
                <td className="p-3">{f.owner}</td>
                <td className="p-3 text-muted-foreground">{f.dueDate}</td>
                <td className="p-3"><Badge variant="outline" className={`text-xs ${statusColor[f.status] || ''}`}>{f.status}</Badge></td>
                <td className="p-3 text-right font-mono">{f.daysOpen}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);
