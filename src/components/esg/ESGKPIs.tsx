import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Leaf, Factory, Recycle, AlertTriangle } from 'lucide-react';

interface Props {
  ddCoverage: number;
  sourcingCoverage: number;
  totalEmissions: number;
  retiredCredits: number;
  overdueDD: number;
}

export const ESGKPIs = ({ ddCoverage, sourcingCoverage, totalEmissions, retiredCredits, overdueDD }: Props) => {
  const cards = [
    { label: 'DD Coverage', value: `${ddCoverage}%`, icon: ShieldCheck, color: 'text-blue-500' },
    { label: 'Sourcing Coverage', value: `${sourcingCoverage}%`, icon: Leaf, color: 'text-emerald-500' },
    { label: 'Emissions YTD (tCO₂e)', value: totalEmissions.toLocaleString(), icon: Factory, color: 'text-orange-500' },
    { label: 'Credits Retired', value: retiredCredits.toLocaleString(), icon: Recycle, color: 'text-purple-500' },
    { label: 'Overdue DD Reviews', value: overdueDD, icon: AlertTriangle, color: 'text-red-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{c.value}</p>
              <p className="text-[10px] text-muted-foreground">{c.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
