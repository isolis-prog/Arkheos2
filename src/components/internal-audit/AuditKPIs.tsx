import { Card, CardContent } from '@/components/ui/card';
import { ClipboardCheck, ShieldCheck, AlertTriangle, Clock } from 'lucide-react';

interface Props {
  auditsCompleted: number;
  totalPlanned: number;
  controlPassRate: number;
  openFindings: number;
  overdueFindings: number;
}

export const AuditKPIs = ({ auditsCompleted, totalPlanned, controlPassRate, openFindings, overdueFindings }: Props) => {
  const cards = [
    { label: 'Audits Completed', value: `${auditsCompleted}/${totalPlanned}`, icon: ClipboardCheck, color: 'text-blue-500' },
    { label: 'Control Pass Rate', value: `${controlPassRate}%`, icon: ShieldCheck, color: 'text-emerald-500' },
    { label: 'Open Findings', value: openFindings, icon: AlertTriangle, color: 'text-amber-500' },
    { label: 'Overdue Remediations', value: overdueFindings, icon: Clock, color: 'text-red-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
