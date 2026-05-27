import { Card, CardContent } from '@/components/ui/card';
import { Zap, AlertTriangle, BarChart3, CheckCircle, DollarSign } from 'lucide-react';

interface Props {
  kpis: {
    totalBreakAmount: number;
    breakCount: number;
    coveragePct: number;
    statementsReconciled: number;
  };
}

export const ISOKPIs = ({ kpis }: Props) => {
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`;
  const cards = [
    { label: 'Total Break $', value: fmt(kpis.totalBreakAmount), icon: DollarSign, color: 'text-destructive' },
    { label: 'Break Count', value: kpis.breakCount, icon: AlertTriangle, color: 'text-warning' },
    { label: 'Interval Coverage', value: `${kpis.coveragePct}%`, icon: BarChart3, color: 'text-primary' },
    { label: 'Statements Done', value: kpis.statementsReconciled, icon: CheckCircle, color: 'text-primary' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <Card key={c.label}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <c.icon className={`h-4 w-4 ${c.color}`} />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
